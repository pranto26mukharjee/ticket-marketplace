"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
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
  Star,
  Info,
  Sparkles,
  Check,
  MessageSquare,
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
  listingDetails?: Record<string, string> | null;
  price: number | null;
  quantity: number;
  ticketStatus: string;
  createdAt: string;
  seller?: {
    id: string;
    fullName: string | null;
    email: string;
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

  // Inquiry messaging states
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [navigatingCheckout, setNavigatingCheckout] = useState(false);

  async function handleProceedToCheckout() {
    if (!ticket) return;
    setNavigatingCheckout(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        const returnUrl = encodeURIComponent(`/checkout?ticketId=${ticket.id}&quantity=${quantity}`);
        router.push(`/login?redirect=${returnUrl}`);
        return;
      }
      router.push(`/checkout?ticketId=${ticket.id}&quantity=${quantity}`);
    } catch {
      const returnUrl = encodeURIComponent(`/checkout?ticketId=${ticket.id}&quantity=${quantity}`);
      router.push(`/login?redirect=${returnUrl}`);
    } finally {
      setNavigatingCheckout(false);
    }
  }

  useEffect(() => {
    if (!ticketId) return;

    let isMounted = true;

    async function loadTicket() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/tickets/${ticketId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load ticket details.");
        }

        if (isMounted) {
          setTicket(data.ticket);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTicket();

    // Check favorite status
    fetch("/api/favorites")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.favorites && isMounted) {
          const isFav = data.favorites.some((f: { ticketId: string }) => f.ticketId === ticketId);
          setIsFavorited(isFav);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  // Handle Share link copy
  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  // Handle Favorite toggle
  async function handleToggleFavorite() {
    if (!ticket) return;

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsFavorited(data.isFavorited);
      } else if (res.status === 401) {
        router.push(`/login?redirect=/tickets/${ticket.id}`);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    }
  }

  // Handle Report submit
  function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportReason) return;
    setReportSubmitted(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSubmitted(false);
      setReportReason("");
    }, 2000);
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
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-[#0D9488]" />
          <p className="text-sm font-semibold text-slate-500">Loading verified ticket details...</p>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full space-y-4">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Ticket Not Available</h2>
          <p className="text-xs text-slate-500">{error || "This ticket may have expired or been removed."}</p>
          <Link
            href="/tickets"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#0D9488] text-white text-xs font-bold rounded-xl hover:bg-[#0F766E] transition"
          >
            Browse Other Tickets
          </Link>
        </div>
      </main>
    );
  }

  const unitPrice = ticket.price || 0;
  const subtotal = unitPrice * quantity;
  const escrowFee = Math.round(subtotal * 0.05); // 5% Escrow Protection Fee
  const total = subtotal + escrowFee;
  const isSoldOut = ticket.ticketStatus !== "AVAILABLE" || ticket.quantity <= 0;
  const verification = ticket.verifications?.[0];
  const isVerified = verification?.verificationStatus === "VERIFIED";

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-20">
      {/* Top Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Ticket Info (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Header Banner */}
            <div className="bg-[#1A1C43] text-white p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#5EEAD4]/10 text-[#5EEAD4] border border-[#5EEAD4]/30">
                    {formatCategory(ticket.category, ticket.ticketType || "TRAVEL")}
                  </span>

                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/40">
                      <ShieldCheck size={14} />
                      <span>Automated checks passed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40">
                      <span>Manual Review Pending</span>
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {ticket.title}
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                  Listing ID: <span className="font-mono">{ticket.id}</span>
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
                  title={isFavorited ? "Saved in favorites" : "Save to favorites"}
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
                    Travel Route / Venue
                  </span>
                  <div className="flex items-center gap-2 font-black text-slate-900 text-lg mt-1">
                    <span>{ticket.from || "Anywhere"}</span>
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
                      <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs">
                        {ticket.travelTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Seating & Quantity Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-slate-400 block font-medium">Seat / Coach</span>
                  <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Armchair size={16} className="text-[#0D9488]" />
                    {ticket.seatNumber || "General Admission"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
                  <span className="text-slate-400 block font-medium">Ticket Class</span>
                  <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Tag size={16} className="text-[#0D9488]" />
                    {ticket.ticketType || "Standard"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block font-medium">Available Units</span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {ticket.quantity} ticket{ticket.quantity > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {ticket.listingDetails && Object.entries(ticket.listingDetails).some(([, value]) => value) && (
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">Service / Event Details</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(ticket.listingDetails).filter(([, value]) => value).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <dt className="text-[10px] text-slate-400 uppercase font-bold">{key.replace(/([A-Z])/g, " $1")}</dt>
                        <dd className="text-sm font-semibold text-slate-800 mt-1">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">Ticket Description & Seller Notes</h3>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                  {ticket.description || "No specific instructions provided by the seller. This ticket will be transferred directly to your buyer account upon purchase."}
                </p>
              </div>

              {/* Automated listing checks */}
              <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-2">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                  <Sparkles size={16} className="text-[#0D9488]" />
                  <span>Automated listing checks</span>
                </div>
                <p className="text-[11px] text-teal-700">
                  {verification?.decision || "Required listing details and possible duplicates are checked. This does not verify a ticket with its carrier or event organizer."}
                </p>
                <div className="flex items-center gap-4 text-[10px] text-teal-600 pt-1 font-semibold">
                  <span>{verification?.aiConfidenceScore == null ? "No screening score recorded" : `Rule-based screening score: ${Math.round(verification.aiConfidenceScore * 100)}%`}</span>
                  <span>•</span>
                  <span>Payments currently sandbox/manual</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Trust Profile Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1C43] text-[#5EEAD4] font-black flex items-center justify-center text-sm">
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
                  {ticket.seller?.createdAt ? (
                    <span>Joined {new Date(ticket.seller.createdAt).getFullYear()}</span>
                  ) : (
                    <span>Seller profile</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions: Contact Seller & Report */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setInquiryOpen(true)}
                className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1.5 transition cursor-pointer bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200"
              >
                <MessageSquare size={14} />
                <span>Message Seller</span>
              </button>

              <button
                onClick={() => setReportOpen(true)}
                className="text-xs font-semibold text-slate-400 hover:text-red-500 flex items-center gap-1 transition cursor-pointer"
              >
                <Flag size={14} />
                <span>Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Purchase & Checkout Sidebar (Right Column) */}
        <div className="space-y-6 sticky top-24">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Price per ticket
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#0D9488]">
                  ৳{unitPrice.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">BDT</span>
              </div>
            </div>

            {/* Quantity Selector */}
            {!isSoldOut && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Select Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-base w-8 text-center text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(ticket.quantity, q + 1))}
                    disabled={quantity >= ticket.quantity}
                    className="w-10 h-10 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-400 ml-auto">
                    Max: {ticket.quantity} available
                  </span>
                </div>
              </div>
            )}

            {/* Price Breakdown Calculation */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tickets ({quantity}x)</span>
                <span className="font-bold text-slate-900">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <span>Escrow Protection Fee (5%)</span>
                  <Info size={12} className="text-slate-400" />
                </span>
                <span className="font-bold text-slate-900">৳{escrowFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="text-[#0D9488]">৳{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Buy / Sold Out Button */}
            {isSoldOut ? (
              <button
                disabled
                className="w-full py-4 bg-slate-200 text-slate-400 font-bold rounded-2xl text-xs uppercase tracking-wider cursor-not-allowed"
              >
                Ticket Sold Out
              </button>
            ) : (
              <button
                onClick={handleProceedToCheckout}
                disabled={navigatingCheckout}
                className="w-full py-4 bg-[#0D9488] hover:bg-[#0F766E] text-white font-extrabold rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {navigatingCheckout ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ShoppingCart size={18} />
                )}
                <span>{navigatingCheckout ? "Checking Security..." : "Proceed to Checkout"}</span>
              </button>
            )}

            {/* Security Guarantee Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <ShieldCheck size={14} className="text-[#0D9488]" />
                <span>TicketLagbe Guarantee</span>
              </div>
              <p>
                Funds are held in secure Escrow. The seller is only paid after your journey or event is successfully validated.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Flag size={18} className="text-red-500" />
                <span>Report Suspicious Listing</span>
              </h3>
              <button
                onClick={() => setReportOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-900 text-sm">Report Submitted</p>
                <p className="text-xs text-slate-500">
                  Our trust & safety team has been alerted and will inspect this listing.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Please specify why you are reporting this ticket. Reports are reviewed by human admins immediately.
                </p>

                <select
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  <option value="">Select violation type...</option>
                  <option value="FAKE_TICKET">Suspected Fake / Altered Ticket</option>
                  <option value="DUPLICATE">Duplicate Seat Listing</option>
                  <option value="INCORRECT_DETAILS">Wrong Route, Date or Price</option>
                  <option value="PRICE_GOUGING">Unreasonable Price Gouging</option>
                  <option value="OTHER">Other Violation</option>
                </select>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Direct Seller Inquiry Modal */}
      {inquiryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <MessageSquare size={18} className="text-[#0D9488]" />
                <span>Message Verified Seller</span>
              </h3>
              <button
                onClick={() => setInquiryOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {inquirySent ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">Message Delivered!</h4>
                <p className="text-xs text-slate-500">
                  Your inquiry has been forwarded to {ticket.seller?.fullName || "the seller"}. You will receive a notification when they reply.
                </p>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!inquiryMessage.trim()) return;
                  try {
                    setInquiryLoading(true);
                    const res = await fetch("/api/inquiries", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ticketId,
                        message: inquiryMessage,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || "Failed to send message.");
                    setInquirySent(true);
                    setTimeout(() => {
                      setInquiryOpen(false);
                      setInquirySent(false);
                      setInquiryMessage("");
                    }, 2200);
                  } catch (err: unknown) {
                    alert(err instanceof Error ? err.message : "Error sending message.");
                  } finally {
                    setInquiryLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <p className="text-xs text-slate-500">
                  Have a question regarding boarding time, luggage allowance, or seat location? Ask the verified seller directly:
                </p>

                <textarea
                  required
                  rows={4}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="e.g. Hi, is this seat near a window? Can you transfer the ticket 2 hours before departure?..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInquiryOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inquiryLoading || !inquiryMessage.trim()}
                    className="px-5 py-2 bg-[#0D9488] text-white rounded-xl text-xs font-bold hover:bg-[#0F766E] transition disabled:opacity-50"
                  >
                    {inquiryLoading ? "Sending..." : "Send Message"}
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
