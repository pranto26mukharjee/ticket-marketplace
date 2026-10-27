"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Ticket,
  Smartphone,
  Lock,
  X,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";

type TicketData = {
  id: string;
  title: string;
  category?: string | { id?: string; categoryName?: string; ticketType?: string | null } | null;
  description: string | null;
  from: string;
  to: string;
  travelDate: string;
  travelTime: string | null;
  seatNumber: string | null;
  ticketType: string | null;
  price: number;
  quantity: number;
  status: string;
  seller?: {
    id: string;
    fullName: string | null;
    email: string;
  };
};

type PaymentMethod = "BKASH" | "NAGAD" | "CARD" | "ROCKET";

// Card payments are a simulation; only offer them when the server runs in sandbox mode.
const CARD_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_SANDBOX === "true";

interface PendingOrderData {
  id: string;
  orderTotal: number;
  gatewayReference?: string;
}

function getCategoryLabel(category: unknown): string {
  if (!category) return "GENERAL";
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null) {
    const cat = category as { categoryName?: string; ticketType?: string };
    return cat.categoryName || cat.ticketType || "GENERAL";
  }
  return "GENERAL";
}

function CheckoutContent() {
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [ticketId, setTicketId] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BKASH");

  const [loading, setLoading] = useState(true);
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  const [error, setError] = useState("");
  const [orderError, setOrderError] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingOrderData | null>(null);
  const [gatewayRef, setGatewayRef] = useState("");
  const [walletNumber, setWalletNumber] = useState("");
  const [authPin, setAuthPin] = useState("");
  const [trxId, setTrxId] = useState("");
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [gatewayStep, setGatewayStep] = useState<"INPUT" | "OTP" | "PROCESSING" | "SUCCESS">("INPUT");
  const [paymentUnderReview, setPaymentUnderReview] = useState(false);
  const [gatewayError, setGatewayError] = useState("");

  const handleCopyNumber = (num: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  // 1. Get ticket ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("ticketId");

    if (!id) {
      void Promise.resolve().then(() => {
        setError("Ticket information is missing. Please select a ticket from the marketplace.");
        setLoading(false);
      });
      return;
    }

    void Promise.resolve().then(() => setTicketId(id));
  }, [router]);

  // 2. Load ticket
  useEffect(() => {
    if (!ticketId) return;

    const loadTicket = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/tickets/${ticketId}`, {
          cache: "no-store",
        });

        const responseText = await response.text();

        let data: {
          success?: boolean;
          message?: string;
          ticket?: TicketData;
        } = {};

        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          throw new Error(`Server returned an invalid response. Status: ${response.status}`);
        }

        if (!response.ok || !data.success || !data.ticket) {
          throw new Error(data.message || "Failed to load ticket details.");
        }

        setTicket(data.ticket);

        if (data.ticket.quantity < 1) {
          setError("This ticket has just sold out and is no longer available.");
        }
      } catch (err) {
        console.error("Load ticket error:", err);
        setError(err instanceof Error ? err.message : "Failed to load ticket.");
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  // 3. Load logged-in user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const responseText = await response.text();

        let data: {
          success?: boolean;
          user?: {
            fullName?: string;
            email?: string;
            phone?: string | null;
          };
        } = {};

        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          return;
        }

        if (!response.ok || !data.success || !data.user) {
          // If not logged in, redirect user to login page with return URL
          if (typeof window !== "undefined") {
            const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
            router.replace(`/login?redirect=${currentUrl}`);
          }
          return;
        }

        setBuyerName(data.user.fullName || "");
        setBuyerEmail(data.user.email || "");
        setBuyerPhone(data.user.phone || "");
        setWalletNumber(data.user.phone || "01712000000");
        setCardHolder(data.user.fullName || "VALUED BUYER");
      } catch (err) {
        console.error("Failed to load user:", err);
      }
    };

    loadUser();
  }, [router]);

  // Price calculation (5% escrow guarantee fee)
  const ticketPrice = ticket ? ticket.price * quantity : 0;
  const serviceFee = Math.round(ticketPrice * 0.05);
  const totalAmount = ticketPrice + serviceFee;

  // 4. Step 1: Initialize Order and Open Payment Sandbox
  const handleProceedToPayment = async () => {
    if (!ticket) return;

    setOrderError("");

    if (!buyerName.trim()) {
      setOrderError("Please enter your full name.");
      return;
    }
    if (!buyerEmail.trim()) {
      setOrderError("Please enter your email.");
      return;
    }
    if (!buyerPhone.trim()) {
      setOrderError("Please enter your contact phone number.");
      return;
    }
    if (quantity < 1 || quantity > ticket.quantity) {
      setOrderError(`Please select between 1 and ${ticket.quantity} tickets.`);
      return;
    }

    try {
      setInitiatingPayment(true);

      // Create Order in PENDING status
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          quantity,
          paymentMethod,
        }),
      });

      const responseText = await response.text();
      let data: { success?: boolean; message?: string; order?: PendingOrderData } = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("Invalid response from server when creating order.");
      }

      if (!response.ok || !data.success || !data.order) {
        throw new Error(data.message || "Failed to create order.");
      }

      const createdOrder = data.order;
      setPendingOrder(createdOrder);

      // Initiate Payment Gateway Session
      const sessionRes = await fetch("/api/payments/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: createdOrder.id,
          paymentMethod,
        }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok || !sessionData.success) {
        throw new Error(sessionData.message || "Failed to initialize payment gateway session.");
      }

      setGatewayRef(sessionData.session.gatewayReference);
      setGatewayStep("INPUT");
      setGatewayError("");
      setShowPaymentModal(true);
    } catch (err) {
      console.error("Order initialization error:", err);
      setOrderError(err instanceof Error ? err.message : "Failed to initiate payment.");
    } finally {
      setInitiatingPayment(false);
    }
  };

  // 5. Step 2: Confirm Payment in Sandbox Gateway
  const handleConfirmGatewayPayment = async () => {
    if (!pendingOrder || !gatewayRef) return;

    setGatewayError("");

    if (paymentMethod === "CARD") {
      if (!cardNumber || cardNumber.replace(/\s/g, "").length < 15) {
        setGatewayError("Please enter a valid 16-digit card number.");
        return;
      }
      if (!authPin || authPin.length < 3) {
        setGatewayError("Please enter CVV / 3D Secure code.");
        return;
      }
    } else {
      if (!walletNumber || walletNumber.length < 11) {
        setGatewayError(`Please enter your 11-digit ${paymentMethod} mobile number.`);
        return;
      }
      if (!trxId || trxId.trim().length < 4) {
        setGatewayError(`Please enter the Transaction ID (TrxID) received from ${paymentMethod}.`);
        return;
      }
    }

    try {
      setGatewayStep("PROCESSING");

      // Small natural delay for realistic gateway communication
      await new Promise((resolve) => setTimeout(resolve, 800));

      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: pendingOrder.id,
          gatewayReference: gatewayRef,
          authCode: paymentMethod === "CARD" ? authPin : trxId.trim().toUpperCase(),
          trxId: trxId.trim().toUpperCase(),
          senderNumber: walletNumber.trim(),
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setGatewayStep("INPUT");
        setGatewayError(data.message || "Payment verification failed. Please check your TrxID.");
        return;
      }

      const underReview = data.status === "UNDER_REVIEW";
      setPaymentUnderReview(underReview);
      setGatewayStep("SUCCESS");

      setTimeout(() => {
        router.push(
          underReview
            ? `/order/${pendingOrder.id}`
            : `/order-success?orderId=${pendingOrder.id}&trx=${data.transactionId || gatewayRef}`
        );
      }, underReview ? 2500 : 1200);
    } catch (err) {
      console.error("Verification error:", err);
      setGatewayStep("INPUT");
      setGatewayError("Connection failure with payment gateway. Please retry.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-600 font-medium">Securing checkout session...</p>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <Ticket className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Checkout Unavailable</h1>
          <p className="mt-3 text-slate-600">{error || "Ticket information could not be loaded."}</p>
          <Link
            href="/tickets"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 transition"
          >
            Browse Verified Tickets
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/tickets/${ticket.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Ticket Details
          </Link>
          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Checkout
              </h1>
              <p className="mt-1 text-slate-600 text-sm">
                Review your order details and payment method before continuing.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Sandbox / manual payment flow
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {orderError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to proceed</p>
              <p className="mt-0.5">{orderError}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          {/* LEFT: Checkout Configuration */}
          <div className="space-y-6">
            {/* Ticket Card Summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700 border border-blue-100">
                    {getCategoryLabel(ticket.category)}
                  </span>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">{ticket.title}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">Unit Price</p>
                  <p className="text-xl font-bold text-slate-900">৳{ticket.price.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    From Origin
                  </div>
                  <p className="mt-1 font-semibold text-slate-900 text-sm">{ticket.from}</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    Destination
                  </div>
                  <p className="mt-1 font-semibold text-slate-900 text-sm">{ticket.to}</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <CalendarDays className="h-3.5 w-3.5 text-purple-600" />
                    Travel Date
                  </div>
                  <p className="mt-1 font-semibold text-slate-900 text-sm">
                    {new Date(ticket.travelDate).toLocaleDateString("en-BD", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Ticket className="h-3.5 w-3.5 text-amber-600" />
                    Assigned Seat
                  </div>
                  <p className="mt-1 font-semibold text-slate-900 text-sm">
                    {ticket.seatNumber || "General Admission"}
                  </p>
                </div>
              </div>
            </section>

            {/* Buyer Contact Details */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Passenger & Buyer Details</h2>
              <p className="mt-1 text-xs text-slate-500">
                Official ticket pass and escrow dispute notifications will be delivered to this contact.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Phone Number (SMS Alert)</label>
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email Address (E-Ticket PDF)</label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="buyer@example.com"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </section>

            {/* Quantity Selector */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Select Quantity</h2>
                  <p className="text-xs text-slate-500">Remaining in listing: {ticket.quantity} ticket(s)</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((v) => Math.max(1, v - 1))}
                    className="h-10 w-10 rounded-lg border border-slate-300 text-lg font-bold hover:bg-slate-50 disabled:opacity-40 transition flex items-center justify-center"
                  >
                    −
                  </button>

                  <div className="flex h-10 min-w-12 items-center justify-center rounded-lg border border-slate-300 px-3 font-bold text-slate-900">
                    {quantity}
                  </div>

                  <button
                    type="button"
                    disabled={quantity >= ticket.quantity}
                    onClick={() => setQuantity((v) => Math.min(ticket.quantity, v + 1))}
                    className="h-10 w-10 rounded-lg border border-slate-300 text-lg font-bold hover:bg-slate-50 disabled:opacity-40 transition flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            </section>

            {/* Payment Method Selector */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Select Escrow Payment Gateway</h2>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  256-bit TLS Encrypted
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* bKash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("BKASH")}
                  className={`rounded-xl border p-4 text-left transition relative flex items-center justify-between ${
                    paymentMethod === "BKASH"
                      ? "border-pink-500 bg-pink-50/60 ring-2 ring-pink-400"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-600 text-white font-extrabold text-sm shadow-sm">
                      bK
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">bKash</p>
                      <p className="text-xs text-slate-500">Fast wallet checkout</p>
                    </div>
                  </div>
                  {paymentMethod === "BKASH" && (
                    <span className="h-5 w-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("NAGAD")}
                  className={`rounded-xl border p-4 text-left transition relative flex items-center justify-between ${
                    paymentMethod === "NAGAD"
                      ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-400"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white font-extrabold text-sm shadow-sm">
                      নগদ
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Nagad</p>
                      <p className="text-xs text-slate-500">Post Office digital wallet</p>
                    </div>
                  </div>
                  {paymentMethod === "NAGAD" && (
                    <span className="h-5 w-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </button>

                {/* Card (sandbox only) */}
                {CARD_ENABLED && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`rounded-xl border p-4 text-left transition relative flex items-center justify-between ${
                    paymentMethod === "CARD"
                      ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-400"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Credit / Debit Card</p>
                      <p className="text-xs text-slate-500">Visa, Mastercard, Amex</p>
                    </div>
                  </div>
                  {paymentMethod === "CARD" && (
                    <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </button>
                )}

                {/* Rocket */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("ROCKET")}
                  className={`rounded-xl border p-4 text-left transition relative flex items-center justify-between ${
                    paymentMethod === "ROCKET"
                      ? "border-purple-500 bg-purple-50/60 ring-2 ring-purple-400"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-700 text-white font-extrabold text-sm shadow-sm">
                      🚀
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">DBBL Rocket</p>
                      <p className="text-xs text-slate-500">Dutch-Bangla Bank 12-digit</p>
                    </div>
                  </div>
                  {paymentMethod === "ROCKET" && (
                    <span className="h-5 w-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  Our simulated sandbox lets you test real-world gateway validation, OTP verification, and instant escrow settlement.
                </span>
              </div>
            </section>
          </div>

          {/* RIGHT: Order Summary and Checkout Action */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Summary & Pricing</h2>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Base Ticket Price</span>
                  <span className="font-medium text-slate-900">
                    ৳{ticket.price.toLocaleString()} × {quantity}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-900">৳{ticketPrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-500 flex items-center gap-1">
                    Escrow Protection Fee (5%)
                  </span>
                  <span className="font-medium text-slate-900">৳{serviceFee.toLocaleString()}</span>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-base">Grand Total</span>
                    <span className="text-2xl font-black text-blue-600">৳{totalAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-right text-[11px] text-slate-400 mt-0.5">Includes all taxes and escrow handling</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={initiatingPayment || ticket.quantity < 1}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 px-4 font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-blue-500/10"
              >
                {initiatingPayment ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Opening Payment Gateway...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay ৳{totalAmount.toLocaleString()} via {paymentMethod}
                  </>
                )}
              </button>

              <div className="mt-5 space-y-2 rounded-xl bg-amber-50 border border-amber-200 p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                  Payment environment notice
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  Payment methods in this project are sandbox/manual flows. Do not send real money; production payment processing and settlement are not configured.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ========================================================
          INTERACTIVE PAYMENT GATEWAY SANDBOX MODAL
      ======================================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
            {/* Branded Modal Header */}
            <div
              className={`p-5 text-white ${
                paymentMethod === "BKASH"
                  ? "bg-[#E2136E]"
                  : paymentMethod === "NAGAD"
                  ? "bg-[#F7941D]"
                  : paymentMethod === "ROCKET"
                  ? "bg-[#8C1D40]"
                  : "bg-gradient-to-r from-blue-700 to-indigo-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md font-black text-sm">
                    {paymentMethod === "BKASH"
                      ? "bK"
                      : paymentMethod === "NAGAD"
                      ? "নগদ"
                      : paymentMethod === "ROCKET"
                      ? "🚀"
                      : "💳"}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-wide">
                      {paymentMethod === "BKASH"
                        ? "bKash Payment Gateway"
                        : paymentMethod === "NAGAD"
                        ? "Nagad Electronic Checkout"
                        : paymentMethod === "ROCKET"
                        ? "DBBL Rocket Gateway"
                        : "Secure 3D-Secure Card Gateway"}
                    </h3>
                    <p className="text-xs text-white/80">Merchant: TicketLagbe Escrow Ltd</p>
                  </div>
                </div>

                {gatewayStep !== "PROCESSING" && (
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setOrderError("Payment checkout cancelled. Your order remains pending.");
                    }}
                    className="rounded-full bg-white/10 p-1 hover:bg-white/20 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Amount bar */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-black/15 px-3.5 py-2.5">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-white/70">Invoice Amount</span>
                  <p className="text-xl font-black">৳{totalAmount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-white/70">Ref</span>
                  <p className="font-mono text-xs font-bold text-white/90">
                    {gatewayRef ? gatewayRef.slice(-10) : "TRX"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Test Sandbox Badge Helper */}
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                <span className="font-bold">🧪 Sandbox Simulation:</span> Enter any valid 4-digit PIN (e.g.{" "}
                <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">1234</code>) to approve. Use{" "}
                <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">0000</code> or{" "}
                <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">FAIL</code> to simulate bank decline.
              </div>

              {/* Gateway Error Notification */}
              {gatewayError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{gatewayError}</span>
                </div>
              )}

              {/* Processing View */}
              {gatewayStep === "PROCESSING" && (
                <div className="py-8 text-center">
                  <Loader2
                    className={`mx-auto h-12 w-12 animate-spin ${
                      paymentMethod === "BKASH"
                        ? "text-[#E2136E]"
                        : paymentMethod === "NAGAD"
                        ? "text-[#F7941D]"
                        : "text-blue-600"
                    }`}
                  />
                  <h4 className="mt-4 font-bold text-slate-800">Contacting Payment Gateway...</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Verifying authorization credentials with the banking network...
                  </p>
                </div>
              )}

              {/* Success View */}
              {gatewayStep === "SUCCESS" && (
                <div className="py-8 text-center animate-in zoom-in-95 duration-200">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h4 className="mt-4 font-extrabold text-slate-900 text-lg">
                    {paymentUnderReview ? "Payment Submitted" : "Payment Verified!"}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600">
                    {paymentUnderReview
                      ? "We're matching your TrxID with our wallet statement. Your ticket is reserved and will be released as soon as the payment is confirmed."
                      : `৳${totalAmount.toLocaleString()} has been safely locked in TicketLagbe Escrow.`}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-emerald-600">
                    {paymentUnderReview ? "Opening your order..." : "Redirecting to order pass..."}
                  </p>
                </div>
              )}

              {/* Input View */}
              {gatewayStep === "INPUT" && (
                <div className="space-y-4">
                  {/* bKash / Nagad / Rocket Wallet Inputs */}
                  {paymentMethod !== "CARD" ? (
                    <>
                      {/* Merchant/Personal Account Instruction Box */}
                      {(() => {
                        const targetNumber =
                          paymentMethod === "BKASH"
                            ? process.env.NEXT_PUBLIC_BKASH_NUMBER || "01700000000"
                            : paymentMethod === "NAGAD"
                            ? process.env.NEXT_PUBLIC_NAGAD_NUMBER || "01700000000"
                            : process.env.NEXT_PUBLIC_ROCKET_NUMBER || "01700000000";

                        const targetType =
                          paymentMethod === "BKASH"
                            ? process.env.NEXT_PUBLIC_BKASH_TYPE || "Personal (Send Money)"
                            : paymentMethod === "NAGAD"
                            ? process.env.NEXT_PUBLIC_NAGAD_TYPE || "Personal (Send Money)"
                            : process.env.NEXT_PUBLIC_ROCKET_TYPE || "Personal (Send Money)";

                        return (
                          <div className="rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50/70 to-rose-50/30 p-3.5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                {paymentMethod} পেমেন্ট নির্দেশনা
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 border border-pink-200">
                                {targetType}
                              </span>
                            </div>

                            <div className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-pink-200/80 shadow-xs">
                              <div>
                                <p className="text-[10px] text-slate-500 font-medium">প্রাপক বিকাশ নম্বর:</p>
                                <p className="text-base font-black text-slate-900 font-mono tracking-wider">
                                  {targetNumber}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyNumber(targetNumber)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                              >
                                {copiedNumber ? (
                                  <>
                                    <Check size={13} />
                                    <span>কপি হয়েছে!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={13} />
                                    <span>কপি করুন</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-1 bg-white/60 p-2 rounded-lg border border-pink-100">
                              <p className="flex items-center gap-1.5 font-medium text-slate-800">
                                <span>১.</span> আপনার {paymentMethod} অ্যাপ থেকে ওপরের নম্বরে মোট{" "}
                                <strong className="text-pink-600 font-bold">৳{totalAmount.toLocaleString()}</strong> টাকা পাঠান।
                              </p>
                              <p className="flex items-center gap-1.5">
                                <span>২.</span> টাকা পাঠানো সম্পন্ন হলে প্রাপ্ত <strong className="text-slate-800">TrxID</strong> ও আপনার নম্বর নিচে লিখুন।
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          আপনার {paymentMethod} নম্বর (যে নম্বর থেকে টাকা পাঠিয়েছেন) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="tel"
                            maxLength={11}
                            value={walletNumber}
                            onChange={(e) => setWalletNumber(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm font-mono outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Transaction ID (TrxID) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            maxLength={16}
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                            placeholder="e.g. BL7A89X1Z"
                            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm font-mono uppercase tracking-widest outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                          বিকাশ থেকে আসা SMS বা অ্যাপের ইনবক্সে TrxID পেয়ে যাবেন।
                        </p>
                      </div>
                    </>
                  ) : (
                    /* Card Payment Inputs */
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">Cardholder Name</label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="NAME ON CARD"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">16-Digit Card Number</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4111 2222 3333 4444"
                            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="12/28"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">CVV / CVC</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="123"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          3D Secure Test OTP
                        </label>
                        <input
                          type="password"
                          maxLength={6}
                          value={authPin}
                          onChange={(e) => setAuthPin(e.target.value)}
                          placeholder="Enter 1234"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tracking-widest outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </>
                  )}

                  {/* Gateway Modal Buttons */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="w-1/3 rounded-xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmGatewayPayment}
                      className={`w-2/3 rounded-xl py-3 text-xs font-bold text-white shadow-md transition ${
                        paymentMethod === "BKASH"
                          ? "bg-[#E2136E] hover:bg-[#c00e5c]"
                          : paymentMethod === "NAGAD"
                          ? "bg-[#F7941D] hover:bg-[#d87c12]"
                          : paymentMethod === "ROCKET"
                          ? "bg-[#8C1D40] hover:bg-[#721532]"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {paymentMethod === "CARD"
                        ? `Confirm ৳${totalAmount.toLocaleString()}`
                        : `পেমেন্ট নিশ্চিত করুন (Submit TrxID)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
            <p className="text-slate-600 font-medium">Loading checkout...</p>
          </div>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}