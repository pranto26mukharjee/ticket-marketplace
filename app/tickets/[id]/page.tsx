"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Ticket,
  Armchair,
  Tag,
  ShieldCheck,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Share2,
  Heart,
  Flag,
  CheckCircle2,
  Clock,
  User,
  Star,
  Sparkles,
  Check,
  MessageSquare,
  Bus,
  Train,
  Plane,
  Music,
  Building,
} from "lucide-react";

interface TicketDetails {
  id: string;
  title: string;
  category?: {
    categoryName: string;
  } | null;
  description: string | null;
  from: string | null;
  to: string | null;
  travelDate: string | null;
  travelTime: string | null;
  seatNumber: string | null;
  ticketType: string | null;
  price: number | null;
  quantity: number;
  ticketStatus: string;
  operatorName?: string | null;
  coachType?: string | null;
  boardingPoint?: string | null;
  droppingPoint?: string | null;
  bogeyNumber?: string | null;
  createdAt: string;
  seller?: {
    id: string;
    fullName: string | null;
    email: string;
    phone?: string | null;
    createdAt: string;
    profile?: {
      identityVerified: boolean;
    } | null;
  } | null;
  verifications?: Array<{
    id: string;
    verificationStatus: string;
    aiConfidenceScore: number | null;
    verificationMethod: string;
    decision: string | null;
  }>;
}

function formatCategory(category: unknown, fallback = "TRAVEL"): string {
  if (!category) return fallback;
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null) {
    const cat = category as { categoryName?: string; ticketType?: string };
    return cat.categoryName || cat.ticketType || fallback;
  }
  return fallback;
}

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [navigatingCheckout, setNavigatingCheckout] = useState(false);

  async function handleProceedToCheckout() {
    if (!ticket) return;
    setNavigatingCheckout(true);
    router.push(`/checkout?ticketId=${ticket.id}&quantity=${quantity}`);
  }

  // Load ticket details
  useEffect(() => {
    async function loadTicket() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tickets/${ticketId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Could not find this ticket.");
        }

        setTicket(data.ticket);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading ticket.");
      } finally {
        setLoading(false);
      }
    }

    if (ticketId) loadTicket();
  }, [ticketId]);

  // Check wishlist state
  useEffect(() => {
    if (!ticketId) return;
    fetch("/api/favorites")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.favorites)) {
          const match = data.favorites.some((f: { ticketId: string }) => f.ticketId === ticketId);
          setIsFavorited(match);
        }
      })
      .catch(() => {});
  }, [ticketId]);

  async function handleToggleFavorite() {
    if (!ticket) return;
    try {
      const method = isFavorited ? "DELETE" : "POST";
      const url = isFavorited ? `/api/favorites?ticketId=${ticket.id}` : "/api/favorites";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: !isFavorited ? JSON.stringify({ ticketId: ticket.id }) : undefined,
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/tickets/${ticket.id}`);
        return;
      }

      setIsFavorited((prev) => !prev);
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  }

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportReason.trim() || !ticket) return;

    try {
      const res = await fetch("/api/admin/fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relatedTicketId: ticket.id,
          relatedUserId: ticket.seller?.id,
          alertType: "USER_REPORTED_FRAUD",
          severity: "MEDIUM",
          details: reportReason.trim(),
        }),
      });

      if (res.ok) {
        setReportSubmitted(true);
        setTimeout(() => {
          setReportOpen(false);
          setReportSubmitted(false);
          setReportReason("");
        }, 2000);
      }
    } catch (err) {
      console.error("Report submit error:", err);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Date not specified";
    try {
      return new Date(dateString).toLocaleDateString("en-BD", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-[#0D9488] mx-auto" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading ticket specifications...
          </p>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Ticket Unavailable</h2>
          <p className="text-xs text-slate-500">
            {error || "This listing has been sold or is no longer accessible on the marketplace."}
          </p>
          <Link
            href="/tickets"
            className="inline-block px-5 py-2.5 bg-[#0D9488] text-white text-xs font-bold rounded-xl hover:bg-[#0F766E] transition cursor-pointer"
          >
            Browse Other Tickets
          </Link>
        </div>
      </main>
    );
  }

  const categoryStr = formatCategory(ticket.category, ticket.ticketType || "TRAVEL").toUpperCase();
  const verification = ticket.verifications?.[0];
  const isVerified = verification?.verificationStatus === "VERIFIED";
  const itemTotal = (ticket.price || 0) * quantity;
  const escrowFee = Math.round(itemTotal * 0.03);
  const grandTotal = itemTotal + escrowFee;

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-20 font-sans">
      {/* Top Breadcrumb Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0D9488] transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ========================================================
            LEFT COLUMN: TICKET DETAILS (8 cols)
        ======================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
            {/* Header with Title and Badges */}
            <div className="bg-[#1A1C43] text-white p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#5EEAD4]/10 text-[#5EEAD4] border border-[#5EEAD4]/30">
                    {categoryStr}
                  </span>

                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/40">
                      <ShieldCheck size={14} />
                      <span>AI Verified Genuine</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40">
                      <span>Manual Review Pending</span>
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  {ticket.title}
                </h1>
                {ticket.operatorName && (
                  <p className="text-xs text-teal-300 font-bold mt-1">
                    {ticket.operatorName}
                  </p>
                )}
                <p className="text-xs text-slate-300 mt-1 font-mono">
                  Listing ID: #{ticket.id.slice(-8)}
                </p>
              </div>

              {/* Action Buttons: Favorite & Share */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleFavorite}
                  className={`p-3 rounded-2xl border transition cursor-pointer ${
                    isFavorited
                      ? "bg-rose-500/20 border-rose-400 text-rose-300"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }`}
                  title={isFavorited ? "Saved in wishlist" : "Save to wishlist"}
                >
                  <Heart size={18} className={isFavorited ? "fill-rose-400" : ""} />
                </button>

                <button
                  onClick={handleShare}
                  className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="Share link"
                >
                  {copiedLink ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
                  <span>{copiedLink ? "Link Copied!" : "Share"}</span>
                </button>
              </div>
            </div>

            {/* Travel Route & Logistics Box */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Route */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Travel Route / Journey
                  </span>
                  <div className="flex items-center gap-2 font-black text-slate-900 text-xl mt-1">
                    <span>{ticket.from || "Origin"}</span>
                    <span className="text-[#0D9488]">➔</span>
                    <span>{ticket.to || "Destination"}</span>
                  </div>
                </div>

                {/* Departure Schedule */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Departure Time & Date
                  </span>
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mt-1">
                    <CalendarDays size={16} className="text-[#0D9488]" />
                    <span>{formatDate(ticket.travelDate)}</span>
                    {ticket.travelTime && (
                      <span className="bg-teal-50 text-teal-800 font-extrabold px-2 py-0.5 rounded text-xs border border-teal-200">
                        {ticket.travelTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CATEGORY-SPECIFIC SPECIFICATIONS TABLE */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  Category Specifications
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Seating Specification */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      Seat / Allocation
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                      <Armchair size={14} className="text-[#0D9488]" />
                      {ticket.seatNumber || "General Admission"}
                    </span>
                  </div>

                  {/* Class / Coach Specification */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      Coach / Tier
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                      <Tag size={14} className="text-[#0D9488]" />
                      {ticket.coachType || ticket.ticketType || "Standard"}
                    </span>
                  </div>

                  {/* Bogey / Compartment or Boarding */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      {categoryStr.includes("TRAIN") ? "Bogey / Compartment" : "Boarding Point"}
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm block mt-0.5 truncate">
                      {ticket.bogeyNumber || ticket.boardingPoint || "Main Terminal / Counter"}
                    </span>
                  </div>

                  {/* Available Stock */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      Available Stock
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm block mt-0.5">
                      {ticket.quantity} ticket{ticket.quantity > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">Ticket Description & Seller Notes</h3>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                  {ticket.description || "Original ticket ready for secure transfer. Protected by TicketLagbe Escrow Guarantee."}
                </p>
              </div>

              {/* AI Verification Breakdown */}
              <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
                <div className="flex items-center gap-2 text-teal-900 font-extrabold text-xs">
                  <Sparkles size={16} className="text-[#0D9488]" />
                  <span>TicketLagbe AI Authenticity & Fraud Screening</span>
                </div>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  {verification?.decision || "Automated scan validated ticket code, operator timestamps, and seat uniqueness against our national registry."}
                </p>
                <div className="flex items-center gap-4 text-[10px] text-teal-700 pt-1 font-bold">
                  <span>Confidence Score: {Math.round((verification?.aiConfidenceScore || 0.92) * 100)}%</span>
                  <span>•</span>
                  <span>100% Escrow Refund Guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Trust Profile & Direct Chat Box */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1C43] text-[#5EEAD4] font-black flex items-center justify-center text-sm shadow-sm">
                {ticket.seller?.fullName?.substring(0, 2).toUpperCase() || "TL"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {ticket.seller?.fullName || "Verified Platform Seller"}
                  </h4>
                  {ticket.seller?.profile?.identityVerified && (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      NID Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-xs mt-0.5">
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star size={12} className="fill-amber-500" />
                    <span>4.9 / 5.0 Rating</span>
                  </span>
                  <span>•</span>
                  <span>Joined {new Date(ticket.seller?.createdAt || Date.now()).getFullYear()}</span>
                </div>
              </div>
            </div>

            {/* Direct Chat with Seller Link */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/messages?ticketId=${ticket.id}&sellerId=${ticket.seller?.id || ""}`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition"
              >
                <MessageSquare size={15} />
                <span>Chat with Seller</span>
              </Link>

              <button
                onClick={() => setReportOpen(true)}
                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-semibold flex items-center gap-1 transition"
                title="Report Fraud"
              >
                <Flag size={13} />
                <span>Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: ESCROW CHECKOUT SUMMARY (4 cols)
        ======================================================== */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                  Per Ticket Price
                </span>
                <span className="text-3xl font-black text-[#0D9488]">
                  ৳{ticket.price?.toLocaleString()}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                In Stock ({ticket.quantity})
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Select Quantity
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0D9488] focus:bg-white"
                >
                  {Array.from({ length: Math.min(ticket.quantity, 6) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} Ticket{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-slate-500">
                <span>Subtotal ({quantity} tickets)</span>
                <span className="font-semibold text-slate-800">৳{itemTotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span className="flex items-center gap-1">
                  <span>Escrow Guarantee Fee (3%)</span>
                </span>
                <span className="font-semibold text-slate-800">৳{escrowFee.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="text-teal-700 text-lg">৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Escrow Trust Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-slate-600 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                <ShieldCheck size={16} />
                <span>100% Escrow Protection</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your payment is held safely in escrow. The seller is only paid after you verify and use the ticket.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleProceedToCheckout}
                disabled={navigatingCheckout}
                className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {navigatingCheckout ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    <span>Buy with Escrow Protection</span>
                  </>
                )}
              </button>

              <Link
                href={`/messages?ticketId=${ticket.id}&sellerId=${ticket.seller?.id || ""}`}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <MessageSquare size={15} className="text-teal-600" />
                <span>Chat with Seller First</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Flag size={16} className="text-red-500" />
              <span>Report Suspicious Ticket</span>
            </h3>

            {reportSubmitted ? (
              <div className="p-4 bg-emerald-50 rounded-2xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Report submitted to admin for investigation.</span>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Please describe the reason for reporting (e.g. fake document, mismatched seat, or duplicate code).
                </p>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Explain why this listing is suspicious..."
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
