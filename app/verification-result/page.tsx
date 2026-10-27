"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
} from "lucide-react";

interface VerificationCheck {
  key: string;
  label: string;
  status: "PASS" | "WARN" | "FAIL" | "SKIP";
  detail: string;
}

interface StoredVerificationData {
  engine?: "claude" | "rules-only";
  aiError?: string;
  checks?: VerificationCheck[];
  extraction?: { documentType?: string; issuer?: string | null } | null;
}

function parseStoredVerification(raw: string | null | undefined): StoredVerificationData {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StoredVerificationData;
  } catch {
    return {};
  }
}

const CHECK_STYLES = {
  PASS: { icon: CheckCircle2, className: "text-emerald-600" },
  WARN: { icon: AlertTriangle, className: "text-amber-500" },
  FAIL: { icon: XCircle, className: "text-red-500" },
  SKIP: { icon: MinusCircle, className: "text-slate-400" },
} as const;

interface TicketVerificationData {
  id: string;
  title: string;
  from: string | null;
  to: string | null;
  travelDate: string | null;
  seatNumber: string | null;
  price: number | null;
  ticketStatus: string;
  verifications?: Array<{
    id: string;
    verificationStatus: string;
    aiConfidenceScore: number | null;
    verificationMethod: string;
    decision: string | null;
    extractedData: string | null;
  }>;
}

function VerificationResultContent() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("id");

  const [ticket, setTicket] = useState<TicketVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticketId) {
      void Promise.resolve().then(() => {
        setError("Ticket ID is required to inspect verification result.");
        setLoading(false);
      });
      return;
    }

    async function loadTicketVerification() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/tickets/${ticketId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load verification status.");
        }

        setTicket(data.ticket);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load ticket.");
      } finally {
        setLoading(false);
      }
    }

    loadTicketVerification();
  }, [ticketId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-[#0D9488]" />
          <p className="text-sm font-semibold text-slate-500">
            Loading listing check results...
          </p>
        </div>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md w-full space-y-4 shadow-sm">
          <AlertCircle size={36} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Verification Result Not Found</h2>
          <p className="text-xs text-slate-500">{error || "Could not find a verification record for this ticket."}</p>
          <Link
            href="/create-listing"
            className="inline-block px-5 py-2.5 bg-[#0D9488] text-white text-xs font-bold rounded-xl hover:bg-[#0F766E] transition"
          >
            Create New Listing
          </Link>
        </div>
      </main>
    );
  }

  const verification = ticket.verifications?.[0];
  const status = verification?.verificationStatus || "PENDING";
  const confidenceScore = verification?.aiConfidenceScore == null
    ? null
    : Math.round(verification.aiConfidenceScore * 100);

  const stored = parseStoredVerification(verification?.extractedData);
  const checks = stored.checks ?? [];

  const isVerified = status === "VERIFIED";
  const isUnderReview = status === "UNDER_REVIEW" || status === "PENDING";
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Verification Status Header */}
        <div className="text-center space-y-3">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm ${
              isVerified
                ? "bg-emerald-100 text-emerald-600"
                : isUnderReview
                ? "bg-amber-100 text-amber-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {isVerified ? (
              <ShieldCheck size={44} />
            ) : isUnderReview ? (
              <Clock size={44} />
            ) : (
              <XCircle size={44} />
            )}
          </div>

          <span
            className={`text-xs font-extrabold uppercase tracking-wider block ${
              isVerified
                ? "text-emerald-600"
                : isUnderReview
                ? "text-amber-600"
                : "text-red-600"
            }`}
          >
            {isVerified
              ? "Automated listing checks passed"
              : isUnderReview
              ? "Manual review pending"
              : "Listing checks did not pass"}
          </span>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {isVerified
              ? "Required listing checks passed"
              : isUnderReview
              ? "Your listing is awaiting administrator review"
              : "Your listing could not be approved"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {verification?.decision ||
              "All automated checks for format compliance and duplicate seating have concluded."}
          </p>
        </div>

        {/* Verification Report Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 md:p-8 space-y-6">
          {/* Confidence Score Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#0D9488]" />
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  {stored.engine === "claude" ? "AI document verification score" : "Screening score"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {stored.engine === "claude"
                    ? `AI read your PDF${stored.extraction?.documentType ? ` (${stored.extraction.documentType})` : ""} and compared it with the listing.`
                    : "AI analysis was unavailable; an admin will inspect the PDF manually."}
                </span>
              </div>
            </div>

            <span
              className={`text-xl font-black ${
                confidenceScore !== null && confidenceScore >= 80
                  ? "text-emerald-600"
                  : confidenceScore !== null && confidenceScore >= 60
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {confidenceScore === null ? "Not recorded" : `${confidenceScore}%`}
            </span>
          </div>

          {checks.length > 0 && (
            <div className="space-y-2 text-xs">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
                Verification checks
              </h3>
              <ul className="space-y-2">
                {checks.map((check) => {
                  const style = CHECK_STYLES[check.status] ?? CHECK_STYLES.SKIP;
                  const Icon = style.icon;
                  return (
                    <li key={check.key} className="flex gap-2.5">
                      <Icon size={16} className={`${style.className} shrink-0 mt-0.5`} />
                      <div>
                        <span className="font-bold text-slate-900">{check.label}</span>
                        <p className="text-slate-500 leading-relaxed">{check.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Ticket Information Breakdown */}
          <div className="space-y-3 text-xs">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
              Screened Ticket Details
            </h3>

            <div className="flex justify-between py-1 text-slate-600">
              <span>Listing Title</span>
              <span className="font-bold text-slate-900">{ticket.title}</span>
            </div>

            <div className="flex justify-between py-1 text-slate-600">
              <span>Route</span>
              <span className="font-bold text-slate-900">
                {ticket.from} ➔ {ticket.to}
              </span>
            </div>

            <div className="flex justify-between py-1 text-slate-600">
              <span>Seat / Coach</span>
              <span className="font-bold text-slate-900">{ticket.seatNumber || "General"}</span>
            </div>

            <div className="flex justify-between py-1 text-slate-600">
              <span>Asking Price</span>
              <span className="font-bold text-[#0D9488]">৳{ticket.price?.toLocaleString()} BDT</span>
            </div>

            <div className="flex justify-between py-1 text-slate-600">
              <span>Marketplace Status</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  ticket.ticketStatus === "AVAILABLE"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {ticket.ticketStatus}
              </span>
            </div>
          </div>

          {/* Payment Notice */}
          <div className="p-4 bg-teal-50/60 border border-teal-100 rounded-2xl text-[11px] text-teal-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck size={14} className="text-[#0D9488]" />
              <span>What happens next</span>
            </div>
            <p className="text-teal-700 leading-relaxed">
              {isVerified
                ? "Your listing is live. When it sells, the buyer's payment is held in escrow and released to you after they confirm the trip."
                : isUnderReview
                ? "An admin will check the flagged items, usually within a few hours. You'll get a notification when it goes live."
                : "Fix the details that failed (or upload the correct PDF) and create the listing again. Repeated failed attempts are reviewed for fraud."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {isVerified && (
            <Link
              href={`/tickets/${ticket.id}`}
              className="p-3.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold rounded-2xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Public Listing</span>
              <ArrowRight size={14} />
            </Link>
          )}

          <Link
            href="/dashboard"
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition shadow-sm text-center"
          >
            Seller Console
          </Link>

          <Link
            href="/create-listing"
            className="p-3.5 bg-[#1A1C43] hover:bg-[#232659] text-white font-bold rounded-2xl text-xs transition shadow text-center"
          >
            List Another Ticket
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function VerificationResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-[#0D9488]" />
        </div>
      }
    >
      <VerificationResultContent />
    </Suspense>
  );
}
