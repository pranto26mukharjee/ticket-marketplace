import crypto from "crypto";

export type PaymentMethodType = "BKASH" | "NAGAD" | "CARD" | "ROCKET";
export type PaymentStatusType =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

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
  authCode?: string; // OTP / PIN / 3D-Secure mock or TrxID
  trxId?: string; // Customer's submitted TrxID
  senderNumber?: string; // Customer's bKash/Nagad number
  paymentMethod: PaymentMethodType;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: PaymentStatusType;
  transactionId: string;
  amount: number;
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

class PaymentGatewayManager {
  private webhookSecret: string;

  constructor() {
    this.webhookSecret =
      process.env.PAYMENT_SECRET_KEY || "ticketlagbe-payment-secret-sandbox-2026";
  }

  /**
   * Initializes a payment gateway checkout session for bKash, Nagad, Card, or Rocket.
   */
  async createPaymentSession(
    params: CreatePaymentSessionParams
  ): Promise<PaymentSessionResponse> {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    const prefix = params.paymentMethod.toUpperCase();
    const gatewayReference = `${prefix}-REF-${timestamp}-${randomHex}`;

    let instructions = "";
    switch (params.paymentMethod) {
      case "BKASH":
        instructions = `Send Money to ${process.env.NEXT_PUBLIC_BKASH_NUMBER || "01700000000"} (${process.env.NEXT_PUBLIC_BKASH_TYPE || "Personal"}) and submit your TrxID.`;
        break;
      case "NAGAD":
        instructions = `Send Money to ${process.env.NEXT_PUBLIC_NAGAD_NUMBER || "01700000000"} (${process.env.NEXT_PUBLIC_NAGAD_TYPE || "Personal"}) and submit your TrxID.`;
        break;
      case "CARD":
        instructions = "Enter Visa/Mastercard test credentials and approve 3D Secure simulation.";
        break;
      case "ROCKET":
        instructions = `Send Money to ${process.env.NEXT_PUBLIC_ROCKET_NUMBER || "01700000000"} (${process.env.NEXT_PUBLIC_ROCKET_TYPE || "Personal"}) and submit your TrxID.`;
        break;
      default:
        instructions = "Select a payment channel to complete escrow payment.";
    }

    return {
      gatewayReference,
      status: "PROCESSING",
      instructions,
    };
  }

  /**
   * Verifies payment via direct gateway callback, manual TrxID submission, or sandbox submission.
   */
  async verifyPayment(
    params: VerifyPaymentParams
  ): Promise<PaymentVerificationResult> {
    const rawTrx = params.trxId?.trim() || params.authCode?.trim();

    // For Mobile Financial Services (BKASH, NAGAD, ROCKET): Manual TrxID verification
    if (
      params.paymentMethod === "BKASH" ||
      params.paymentMethod === "NAGAD" ||
      params.paymentMethod === "ROCKET"
    ) {
      if (!rawTrx || rawTrx.length < 4) {
        return {
          success: false,
          status: "FAILED",
          transactionId: params.gatewayReference,
          amount: 0,
          message: "Please enter a valid bKash Transaction ID (TrxID).",
        };
      }

      if (rawTrx.toUpperCase() === "FAIL" || rawTrx === "0000") {
        return {
          success: false,
          status: "FAILED",
          transactionId: params.gatewayReference,
          amount: 0,
          message: "Payment verification failed. Please check your TrxID and try again.",
        };
      }

      const cleanTrxId = rawTrx.toUpperCase();

      return {
        success: true,
        status: "PAID",
        transactionId: cleanTrxId,
        amount: 0,
        message: `${params.paymentMethod} payment submitted successfully (TrxID: ${cleanTrxId}).`,
      };
    }

    // If card payment
    if (params.authCode === "0000" || params.authCode?.toUpperCase() === "FAIL") {
      return {
        success: false,
        status: "FAILED",
        transactionId: params.gatewayReference,
        amount: 0,
        message: "Payment declined by issuing bank or provider.",
      };
    }

    const txId = `CARD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    return {
      success: true,
      status: "PAID",
      transactionId: txId,
      amount: 0,
      message: `${params.paymentMethod} payment validated successfully.`,
    };
  }

  /**
   * Secure Webhook Signature Validation (HMAC SHA-256)
   */
  verifyWebhookSignature(payloadString: string, signature: string): boolean {
    if (!signature) return false;

    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payloadString)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  }

  /**
   * Processes a refund back through the original payment gateway channel.
   */
  async processRefund(params: ProcessRefundParams): Promise<RefundResult> {
    const refundRef = `REFUND-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    return {
      success: true,
      status: "COMPLETED",
      refundReference: refundRef,
      message: `Refund of ৳${params.amount} processed back to original source. Reason: ${params.reason}`,
    };
  }
}

export const paymentGateway = new PaymentGatewayManager();