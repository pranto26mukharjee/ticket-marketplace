"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MapPin,
  Printer,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  User,
  Eye,
  Check,
} from "lucide-react";

interface OrderData {
  id: string;
  quantity: number | null;
  orderTotal: number;
  orderStatus: string;
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
    price: number | null;
    seller?: {
      id: string;
      fullName: string | null;
      email: string;
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
    gatewayReference: string | null;
  } | null;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    async function loadOrder() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load order.");
        }

        setOrder(data.order);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load order.");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

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
          <p className="text-sm font-semibold text-slate-500">Retrieving confirmed ticket pass...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md w-full space-y-4 shadow-sm">
          <CheckCircle2 size={36} className="text-[#0D9488] mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Order Placed</h2>
          <p className="text-xs text-slate-500">{error || "Your order was created. Please view your dashboard."}</p>
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

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-3 print:hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 block">
            Payment Confirmed & Escrow Locked
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">
            Your Ticket is Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Order <strong className="text-slate-800">#{order.id.slice(-8).toUpperCase()}</strong> has been processed successfully. Your payment is held safely in escrow.
          </p>
        </div>

        {/* Digital Boarding Pass */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-[#1A1C43] text-white p-6 md:p-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="text-[#5EEAD4]" size={24} />
              <span className="font-extrabold tracking-tight text-lg">Digital Boarding Pass</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#5EEAD4]/10 text-[#5EEAD4] border border-[#5EEAD4]/30 px-3 py-1 rounded-full">
              <ShieldCheck size={14} />
              <span>Valid & Verified</span>
            </span>
          </div>

          {/* Ticket Content */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Route / Event
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  {order.ticket?.from} ➔ {order.ticket?.to}
                </h2>
                <p className="text-xs font-semibold text-[#0D9488]">{order.ticket?.title}</p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Seat / Coach
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {order.ticket?.seatNumber || "General Admission"}
                </span>
              </div>
            </div>

            {/* Travel Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Travel Date
                </span>
                <span className="font-bold text-slate-800 mt-1 block">
                  {formatDate(order.ticket?.travelDate ?? null)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Departure Time
                </span>
                <span className="font-bold text-slate-800 mt-1 block">
                  {order.ticket?.travelTime || "Scheduled"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Pass Quantity
                </span>
                <span className="font-bold text-slate-800 mt-1 block">
                  {order.quantity || 1} passenger(s)
                </span>
              </div>
            </div>

            {/* Buyer and Seller Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Passenger Name
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">{order.buyer?.fullName}</span>
                <span className="text-[11px] text-slate-500">{order.buyer?.email}</span>
              </div>

              <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Verified Seller
                </span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {order.ticket?.seller?.fullName || "Platform Seller"}
                </span>
                <span className="text-[11px] text-slate-500">{order.ticket?.seller?.email}</span>
              </div>
            </div>

            {/* Total Paid & Payment Method */}
            <div className="flex justify-between items-center p-4 bg-teal-50/60 rounded-2xl border border-teal-100">
              <div>
                <span className="text-[10px] text-teal-700 font-bold uppercase block">
                  Total Paid via {order.paymentMethod || "Card"}
                </span>
                <span className="font-mono text-xs text-teal-800 font-semibold">
                  Ref: {order.payment?.gatewayReference || "TX-ESCROW"}
                </span>
              </div>
              <span className="text-2xl font-black text-[#0D9488]">
                ৳{order.orderTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 print:hidden">
          <Link
            href={`/order/${order.id}`}
            className="p-3.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold rounded-2xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye size={16} />
            <span>Track Order</span>
          </Link>

          <button
            onClick={handlePrint}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer size={16} />
            <span>Print Pass</span>
          </button>

          <Link
            href="/dashboard"
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>My Console</span>
          </Link>

          <Link
            href="/tickets"
            className="p-3.5 bg-[#1A1C43] hover:bg-[#232659] text-white font-bold rounded-2xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>More Tickets</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-[#0D9488]" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
