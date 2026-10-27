import crypto from "crypto";

export type PaymentMethodType = "BKASH" | "NAGAD" | "CARD" | "ROCKET";
export type PaymentStatusType =
  | "PENDING"
  | "PROCESSING"
  | "UNDER_REVIEW"
  | "PAID"
  | "FAILED"
  | "REJECTED"
  | "REFUND_REQUESTED"
  | "REFUNDED"
  | "CANCELLED";

export const MOBILE_WALLET_METHODS: PaymentMethodType[] = ["BKASH", "NAGAD", "ROCKET"];

/**
 * Sandbox mode enables the simulated card flow and unsigned webhooks.
 * Never enable it on a deployment that handles real money.
 */
export function isPaymentSandbox(): boolean {
  return process.env.PAYMENT_SANDBOX === "true";
}

export function getEnabledPaymentMethods(): PaymentMethodType[] {
  return isPaymentSandbox() ? [...MOBILE_WALLET_METHODS, "CARD"] : [...MOBILE_WALLET_METHODS];
}

export interface CreatePaymentSessionParams {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;
}

export interface PaymentSessionResponse {
  gatewayReference: string;
  paymentUrl?: string;
  status: PaymentStatusType;
  instructions: string;
}

export interface VerifyPaymentParams {
  gatewayReference: string;
  authCode?: string;
  trxId?: string;
  senderNumber?: string;
  paymentMethod: PaymentMethodType;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: PaymentStatusType;
  transactionId: string;
  message: string;
}

export interface ProcessRefundParams {
  gatewayReference: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  status: "COMPLETED" | "REJECTED" | "PROCESSING";
  refundReference: string;
  message: string;
}

// bKash/Nagad/Rocket transaction IDs are 8-12 uppercase alphanumerics.
const TRX_ID_PATTERN = /^[A-Z0-9]{8,12}$/;
// Bangladeshi mobile numbers: 01[3-9] followed by 8 digits.
const BD_MOBILE_PATTERN = /^01[3-9]\d{8}$/;

export function normalizeTrxId(raw: string | undefined | null): string {
  return (raw || "").replace(/\s+/g, "").toUpperCase();
}

export function normalizeBdMobile(raw: string | undefined | null): string {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.startsWith("880") ? digits.slice(2) : digits;
}

class PaymentGatewayManager {
  private getWebhookSecret(): string | null {
    return process.env.PAYMENT_SECRET_KEY || null;
  }

  async createPaymentSession(
    params: CreatePaymentSessionParams
  ): Promise<PaymentSessionResponse> {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    const gatewayReference = `${params.paymentMethod}-REF-${timestamp}-${randomHex}`;

    let instructions = "";
    switch (params.paymentMethod) {
      case "BKASH":
        instructions = `Send Money ৳${params.amount} to ${process.env.NEXT_PUBLIC_BKASH_NUMBER || "01700000000"} (${process.env.NEXT_PUBLIC_BKASH_TYPE || "Personal"}) and submit your TrxID.`;
        break;
      case "NAGAD":
        instructions = `Send Money ৳${params.amount} to ${process.env.NEXT_PUBLIC_NAGAD_NUMBER || "01700000000"} (${process.env.NEXT_PUBLIC_NAGAD_TYPE || "Personal"}) and submit your TrxID.`;
        break;
      case "ROCKET":
        instructions = `Send Money ৳${params.amount} to ${process.env.NEXT_PUBLIC_ROCKET_NUMBER || "01700000000"} (${process.env.NEXT_PUBLIC_ROCKET_TYPE || "Personal"}) and submit your TrxID.`;
        break;
      case "CARD":
        instructions = "Sandbox card payment: enter any test card. No real charge is made.";
        break;
    }

    return { gatewayReference, status: "PROCESSING", instructions };
  }

  /**
   * Mobile-wallet payments are manual transfers, so the server cannot know
   * whether the money arrived. A well-formed submission is queued as
   * UNDER_REVIEW and an admin confirms it against the merchant wallet
   * statement. Only sandbox card payments are approved instantly.
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    if (MOBILE_WALLET_METHODS.includes(params.paymentMethod)) {
      const trxId = normalizeTrxId(params.trxId || params.authCode);
      const sender = normalizeBdMobile(params.senderNumber);

      if (!TRX_ID_PATTERN.test(trxId)) {
        return {
          success: false,
          status: "FAILED",
          transactionId: params.gatewayReference,
          message: `Enter the ${params.paymentMethod} Transaction ID exactly as shown in your confirmation SMS (8-12 letters/numbers).`,
        };
      }

      if (!BD_MOBILE_PATTERN.test(sender)) {
        return {
          success: false,
          status: "FAILED",
          transactionId: params.gatewayReference,
          message: "Enter the 11-digit mobile number you sent the money from.",
        };
      }

      return {
        success: true,
        status: "UNDER_REVIEW",
        transactionId: trxId,
        message: `${params.paymentMethod} payment submitted (TrxID: ${trxId}). We'll confirm it against our wallet statement shortly.`,
      };
    }

    if (params.paymentMethod === "CARD" && isPaymentSandbox()) {
      if (params.authCode === "0000" || params.authCode?.toUpperCase() === "FAIL") {
        return {
          success: false,
          status: "FAILED",
          transactionId: params.gatewayReference,
          message: "Sandbox card declined.",
        };
      }

      return {
        success: true,
        status: "PAID",
        transactionId: `CARD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        message: "Sandbox card payment approved.",
      };
    }

    return {
      success: false,
      status: "FAILED",
      transactionId: params.gatewayReference,
      message: "This payment method is not available.",
    };
  }

  /**
   * HMAC SHA-256 webhook signature check. Returns false (never throws) when
   * the secret is missing or the signature is malformed.
   */
  verifyWebhookSignature(payloadString: string, signature: string): boolean {
    const secret = this.getWebhookSecret();
    if (!secret || !signature) return false;

    const expected = Buffer.from(
      crypto.createHmac("sha256", secret).update(payloadString).digest("hex"),
      "utf8"
    );
    const received = Buffer.from(signature.trim().toLowerCase(), "utf8");

    if (expected.length !== received.length) return false;
    return crypto.timingSafeEqual(expected, received);
  }

  /**
   * Mobile-wallet refunds are sent manually by finance; this records the
   * instruction. Swap in the provider's refund API when integrating one.
   */
  async processRefund(params: ProcessRefundParams): Promise<RefundResult> {
    const refundRef = `REFUND-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    return {
      success: true,
      status: "PROCESSING",
      refundReference: refundRef,
      message: `Refund of ৳${params.amount} queued to the original payment source. Reason: ${params.reason}`,
    };
  }
}

export const paymentGateway = new PaymentGatewayManager();
