"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  Loader2,
  MapPin,
  ShieldCheck,
  Ticket,
  User,
  Phone,
  Mail,
  Printer,
  Ban,
  RotateCcw,
  Sparkles,
  Check,
  Armchair,
  Radio,
} from "lucide-react";
import { OrderQrTicket } from "@/components/QrTicket";
import { ReviewForm } from "@/components/ReviewForm";

interface OrderDetail {
  id: string;
  orderTotal: number;
  orderStatus: string;
  quantity: number | null;
  paymentMethod: string | null;
  createdAt: string;
  ticket?: {
    id: string;
    title: string;
    from: string | null;
    to: string | null;
    travelDate: string | null;
    travelTime: string | null;
    seatNumber: string | null;
    ticketType: string | null;
    ticketCode: string | null;
    price: number | null;
    category?: {
      categoryName: string;
    } | null;
    seller?: {
      id: string;
      fullName: string | null;
      email: string;
      phone: string | null;
    } | null;
  } | null;
  buyer?: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
  } | null;
  payment?: {
    id: string;
    paymentStatus: string;
    amount: number;
    gatewayReference: string | null;
  } | null;
  disputes?: Array<{
    id: string;
    disputeStatus: string;
    resolutionNotes: string | null;
  }>;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [userRole, setUserRole] = useState<string>("BUYER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;

    async function loadOrder(isInitial = false) {
      try {
        if (isInitial) {
          setLoading(true);
          setError("");
        }

        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            router.push(`/login?redirect=/order/${orderId}`);
            return;
          }
          if (isInitial) throw new Error(data.message || "Failed to load order.");
        }

        if (isMounted && data.success) {
          setOrder(data.order);
          setUserRole(data.userRoleInOrder || "BUYER");
          setLastUpdated(new Date());
        }
      } catch (err: unknown) {
        if (isMounted && isInitial) {
          setError(err instanceof Error ? err.message : "Failed to load order.");
        }
      } finally {
        if (isMounted && isInitial) setLoading(false);
      }
    }

    // Initial load
    loadOrder(true);

    // Live status polling every 12 seconds
    const interval = setInterval(() => {
      loadOrder(false);
    }, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId, router]);

  // Execute order status actions (CANCEL, REFUND_REQUEST, COMPLETE)
  async function handleOrderAction(action: "CANCEL" | "REFUND_REQUEST" | "COMPLETE", payload?: Record<string, unknown>) {
    if (action === "CANCEL" && !confirm("Are you sure you want to cancel this order? The ticket will be returned to inventory.")) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage("");

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Action failed.");

      setOrder(data.order);
      setActionMessage(data.message);
      setRefundModalOpen(false);
      setRefundReason("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  }

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Date not specified";
    try {
      return new Date(dateString).toLocaleDateString("en-BD", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-[#0D9488]" />
          <p className="text-sm font-semibold text-slate-500">Loading order timeline & digital pass...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md w-full space-y-4 shadow-sm">
          <AlertCircle size={36} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
          <p className="text-xs text-slate-500">{error || "You might not have permission to view this order."}</p>
          <Link
            href="/dashboard"
            className="inline-block px-5 py-2.5 bg-[#0D9488] text-white text-xs font-bold rounded-xl hover:bg-[#0F766E] transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const isConfirmed = order.orderStatus === "CONFIRMED";
  const isCompleted = order.orderStatus === "COMPLETED";
  const isCancelled = order.orderStatus === "CANCELLED";
  const isRefundRequested = order.orderStatus === "REFUND_REQUESTED";

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-20">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4 flex items-center justify-between print:hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Console</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live • Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} />
            <span>Print Pass</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Action Status Notification */}
        {actionMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Digital QR Boarding Pass */}
        <OrderQrTicket
          orderId={order.id}
          ticketTitle={order.ticket?.title || "Travel Ticket"}
          ticketCode={order.ticket?.ticketCode}
          buyerName={order.buyer?.fullName || "Verified Buyer"}
          from={order.ticket?.from}
          to={order.ticket?.to}
          travelDate={order.ticket?.travelDate}
          seatNumber={order.ticket?.seatNumber}
          totalAmount={order.orderTotal}
          orderStatus={order.orderStatus}
        />

        {/* Digital Boarding Pass Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
          {/* Header Bar */}
          <div className="bg-[#1A1C43] text-white p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="text-[#5EEAD4]" size={20} />
                <span className="text-xs font-bold text-[#5EEAD4] uppercase tracking-wider">
                  Verified Digital Entry Ticket
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Order #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Booked on {new Date(order.createdAt).toLocaleString("en-BD", { dateStyle: "long", timeStyle: "short" })}
              </p>
            </div>

            {/* Status Pill */}
            <div className="sm:text-right">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">
                Order Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide ${
                  isConfirmed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                    : isCompleted
                    ? "bg-teal-500/20 text-[#5EEAD4] border border-[#5EEAD4]/30"
                    : isCancelled
                    ? "bg-red-500/20 text-red-300 border border-red-400/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                }`}
              >
                {isConfirmed && <CheckCircle2 size={14} />}
                <span>{order.orderStatus}</span>
              </span>
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="p-6 bg-slate-50 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-4">
              Escrow Protection Timeline
            </span>

            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              <div className="space-y-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center mx-auto text-xs shadow-sm">
                  ✓
                </div>
                <span className="font-bold text-slate-800 block">Order Placed</span>
                <span className="text-[10px] text-slate-400">Escrow Locked</span>
              </div>

              <div className="space-y-1">
                <div
                  className={`w-8 h-8 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                    isConfirmed || isCompleted
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  2
                </div>
                <span className="font-bold text-slate-800 block">Ticket Issued</span>
                <span className="text-[10px] text-slate-400">AI Screened</span>
              </div>

              <div className="space-y-1">
                <div
                  className={`w-8 h-8 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  3
                </div>
                <span className="font-bold text-slate-800 block">Journey / Event</span>
                <span className="text-[10px] text-slate-400">Boarding</span>
              </div>

              <div className="space-y-1">
                <div
                  className={`w-8 h-8 rounded-full font-bold flex items-center justify-center mx-auto text-xs ${
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  4
                </div>
                <span className="font-bold text-slate-800 block">Completed</span>
                <span className="text-[10px] text-slate-400">Payout Released</span>
              </div>
            </div>
          </div>

          {/* Ticket Information Body */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Route & Schedule Card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Route / Destination
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  {order.ticket?.from || "Origin"} ➔ {order.ticket?.to || "Destination"}
                </h2>
                <p className="text-xs font-semibold text-[#0D9488] mt-0.5">
                  {order.ticket?.title}
                </p>
              </div>

              <div className="md:text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Seat & Class
                </span>
                <span className="text-base font-extrabold text-slate-800 flex items-center md:justify-end gap-1 mt-1">
                  <Armchair size={16} className="text-[#0D9488]" />
                  <span>{order.ticket?.seatNumber || "General"}</span>
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Quantity: {order.quantity || 1} passenger(s)
                </span>
              </div>
            </div>

            {/* Travel Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Scheduled Departure Date</span>
                <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <CalendarDays size={16} className="text-[#0D9488]" />
                  <span>{formatDate(order.ticket?.travelDate ?? null)}</span>
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                <span className="text-slate-400 block font-medium">Reporting Time</span>
                <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <Clock size={16} className="text-[#0D9488]" />
                  <span>{order.ticket?.travelTime || "Standard Schedule"}</span>
                </span>
              </div>
            </div>

            {/* Buyer & Seller Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Buyer Information
                </span>
                <p className="font-bold text-slate-900">{order.buyer?.fullName || "Verified Buyer"}</p>
                <p className="text-slate-500 text-[11px]">{order.buyer?.email}</p>
                {order.buyer?.phone && (
                  <p className="text-teal-700 font-semibold text-[11px]">{order.buyer.phone}</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Seller Information
                </span>
                <p className="font-bold text-slate-900">
                  {order.ticket?.seller?.fullName || "Verified Community Seller"}
                </p>
                <p className="text-slate-500 text-[11px]">{order.ticket?.seller?.email}</p>
                {order.ticket?.seller?.phone && (
                  <p className="text-teal-700 font-semibold text-[11px]">{order.ticket.seller.phone}</p>
                )}
              </div>
            </div>

            {/* Payment & Total Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Payment Verification
              </span>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method</span>
                <span className="font-bold text-slate-800">{order.paymentMethod || "CARD"}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Escrow Gateway Ref</span>
                <span className="font-mono font-bold text-slate-800">
                  {order.payment?.gatewayReference || "TX-VERIFIED"}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Escrow Payment Status</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {order.payment?.paymentStatus || "PAID"}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount Paid</span>
                <span className="text-[#0D9488]">৳{order.orderTotal.toLocaleString()} BDT</span>
              </div>
            </div>

            {/* Interactive Buyer Actions Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                {/* Complete trip button */}
                {isConfirmed && (
                  <button
                    onClick={() => handleOrderAction("COMPLETE")}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    <span>Confirm Journey Complete</span>
                  </button>
                )}

                {/* Cancel Order */}
                {isConfirmed && (
                  <button
                    onClick={() => handleOrderAction("CANCEL")}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Ban size={16} />
                    <span>Cancel Order</span>
                  </button>
                )}

                {/* Request Refund */}
                {isConfirmed && (
                  <button
                    onClick={() => setRefundModalOpen(true)}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    <span>Request Refund</span>
                  </button>
                )}
              </div>

              <Link
                href="/dashboard"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Review & Rating Form (Visible to Buyer on Confirmed/Completed Orders) */}
        {userRole === "BUYER" && (isConfirmed || isCompleted) && (
          <div className="print:hidden">
            <ReviewForm
              orderId={order.id}
              sellerName={order.ticket?.seller?.fullName || "Seller"}
              onSuccess={() => {
                setActionMessage("Thank you for reviewing your seller! Your feedback helps keep TicketLagbe safe.");
              }}
            />
          </div>
        )}
      </div>

      {/* Refund Request Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <RotateCcw size={18} className="text-amber-600" />
                <span>Request Escrow Refund</span>
              </h3>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please explain why you are requesting a refund. Your payment is held safely in escrow. If the ticket was invalid or cancelled by the operator, your money will be returned to your wallet.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleOrderAction("REFUND_REQUEST", { reason: refundReason });
              }}
              className="space-y-4"
            >
              <textarea
                required
                rows={3}
                placeholder="Describe reason (e.g. invalid QR code, duplicate seat, train delayed/cancelled)..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !refundReason.trim()}
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit Refund Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
