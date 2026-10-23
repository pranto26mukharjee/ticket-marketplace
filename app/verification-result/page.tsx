
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

type Ticket = {
  id: string;
  title: string;
  category: string;
  from: string;
  to: string;
  travelDate: string;
  travelTime: string | null;
  seatNumber: string | null;
  ticketType: string | null;
  price: number;
  quantity: number;
};

export default function VerificationResultPage() {
  const searchParams = useSearchParams();

  const ticketId = searchParams.get("id");

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTicket() {
      if (!ticketId) {
        setError("Ticket ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/tickets/${ticketId}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message || "Failed to load ticket."
          );
          return;
        }

        setTicket(data.ticket);
      } catch (error) {
        console.error("Load ticket error:", error);

        setError(
          "Something went wrong while loading the ticket."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin text-[#0D9488]"
          />

          <p className="text-sm text-slate-500">
            Loading ticket information...
          </p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center max-w-md">
          <AlertCircle
            size={40}
            className="text-red-500 mx-auto mb-4"
          />

          <h1 className="text-xl font-bold text-slate-900">
            Unable to Load Ticket
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            {error || "Ticket information was not found."}
          </p>

          <Link
            href="/create-listing"
            className="inline-block mt-6 bg-[#0D9488] text-white px-5 py-3 rounded-xl text-sm font-semibold"
          >
            Create New Listing
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(
    ticket.travelDate
  ).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">

      <main className="max-w-3xl mx-auto px-4 py-12">

        {/* Status Header */}
        <div className="text-center space-y-3 mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-2">
            <ShieldCheck size={36} />
          </div>

          <span className="block text-xs font-bold text-emerald-600 tracking-wider uppercase">
            Verification Successful
          </span>

          <h1 className="text-3xl font-extrabold text-slate-900">
            Your Ticket is Ready For Sale!
          </h1>

          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Your ticket listing has been successfully created
            and saved to the TicketLagbe marketplace.
          </p>

        </div>

        {/* Ticket Information */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">

          <div className="flex items-center justify-between pb-4 border-b border-slate-100">

            <div>
              <span className="text-xs text-slate-400 block">
                Ticket
              </span>

              <span className="text-lg font-bold text-slate-900">
                {ticket.title}
              </span>
            </div>

            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              VERIFIED
            </span>

          </div>

          {/* Ticket Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="bg-slate-50 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">
                Category
              </span>

              <span className="text-sm font-bold text-slate-800">
                {ticket.category}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">
                Price
              </span>

              <span className="text-sm font-bold text-slate-800">
                ৳ {ticket.price}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">
                From
              </span>

              <span className="text-sm font-bold text-slate-800">
                {ticket.from}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">
                To
              </span>

              <span className="text-sm font-bold text-slate-800">
                {ticket.to}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">
                Travel Date
              </span>

              <span className="text-sm font-bold text-slate-800">
                {formattedDate}
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">
                Seat
              </span>

              <span className="text-sm font-bold text-slate-800">
                {ticket.seatNumber || "Not specified"}
              </span>
            </div>

          </div>

          {/* Verification Breakdown */}
          <div className="pt-4 border-t border-slate-100 space-y-4">

            <div className="flex items-start gap-3">

              <CheckCircle2
                size={18}
                className="text-emerald-500 shrink-0 mt-0.5"
              />

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Ticket Information Saved
                </p>

                <p className="text-xs text-slate-400">
                  Your ticket details have been successfully
                  stored in the marketplace database.
                </p>
              </div>

            </div>

            <div className="flex items-start gap-3">

              <CheckCircle2
                size={18}
                className="text-emerald-500 shrink-0 mt-0.5"
              />

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Duplicate Prevention Audit
                </p>

                <p className="text-xs text-slate-400">
                  The listing has been assigned a unique ticket ID.
                </p>
              </div>

            </div>

            <div className="flex items-start gap-3">

              <CheckCircle2
                size={18}
                className="text-emerald-500 shrink-0 mt-0.5"
              />

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Seller Information Protected
                </p>

                <p className="text-xs text-slate-400">
                  Your private account information is not shown
                  on this public ticket information.
                </p>
              </div>

            </div>

          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">

            <Link
              href="/tickets"
              className="w-full sm:flex-1 py-3.5 px-4 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold rounded-xl text-sm transition shadow-sm text-center flex items-center justify-center gap-2"
            >
              <span>View Marketplace</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition text-center flex items-center justify-center gap-1"
            >
              <RefreshCw size={14} />
              <span>Dashboard</span>
            </Link>

          </div>

        </div>
      </main>
    </div>
  );
}
