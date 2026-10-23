
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
} from "lucide-react";

type TicketData = {
  id: string;
  title: string;
  category: string;
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
  createdAt: string;
};

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticketId) {
      return;
    }

    async function loadTicket() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/tickets/${ticketId}`);

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load ticket.");
          return;
        }

        setTicket(data.ticket);
      } catch (error) {
        console.error("Ticket details error:", error);

        setError(
          "Something went wrong while loading the ticket."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [ticketId]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function handleBuyNow() {
    /*
      Purchase system will be connected here
      in the next step.
    */

    router.push(`/checkout?ticketId=${ticket?.id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />

          <p className="text-slate-600">
            Loading ticket details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Ticket Not Found
          </h1>

          <p className="mt-2 text-slate-500">
            {error || "This ticket does not exist."}
          </p>

          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>
        </div>
      </div>
    );
  }

  const isAvailable = ticket.status === "AVAILABLE";

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets
        </Link>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Ticket Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                      <Ticket className="w-4 h-4" />
                      {ticket.category}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        isAvailable
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {ticket.title}
                  </h1>

                  {ticket.description && (
                    <p className="mt-3 text-slate-600 leading-relaxed">
                      {ticket.description}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-sm text-slate-500">
                    Ticket Price
                  </p>

                  <p className="text-3xl font-bold text-blue-600">
                    ৳{ticket.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-5">
                Journey Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      From
                    </p>

                    <p className="font-semibold text-slate-900">
                      {ticket.from}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      To
                    </p>

                    <p className="font-semibold text-slate-900">
                      {ticket.to}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-5">
                Ticket Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-blue-600" />

                  <div>
                    <p className="text-sm text-slate-500">
                      Travel Date
                    </p>

                    <p className="font-semibold text-slate-900">
                      {formatDate(ticket.travelDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-blue-600" />

                  <div>
                    <p className="text-sm text-slate-500">
                      Travel Time
                    </p>

                    <p className="font-semibold text-slate-900">
                      {ticket.travelTime || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Armchair className="w-5 h-5 text-blue-600" />

                  <div>
                    <p className="text-sm text-slate-500">
                      Seat Number
                    </p>

                    <p className="font-semibold text-slate-900">
                      {ticket.seatNumber || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-blue-600" />

                  <div>
                    <p className="text-sm text-slate-500">
                      Ticket Type
                    </p>

                    <p className="font-semibold text-slate-900">
                      {ticket.ticketType || "Standard"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Information */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />

                <div>
                  <h3 className="font-bold text-blue-900">
                    TicketLagbe Buyer Protection
                  </h3>

                  <p className="mt-1 text-sm text-blue-800 leading-relaxed">
                    Always complete your purchase through TicketLagbe.
                    Do not send money directly to a seller outside the
                    platform.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Purchase Card */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:sticky lg:top-24">
              <p className="text-sm text-slate-500">
                Total Price
              </p>

              <p className="text-4xl font-bold text-slate-900 mt-1">
                ৳{ticket.price.toLocaleString()}
              </p>

              <div className="mt-5 border-t border-slate-200 pt-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Ticket
                  </span>

                  <span className="font-medium text-slate-900">
                    1 × ৳{ticket.price.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Quantity
                  </span>

                  <span className="font-medium text-slate-900">
                    {ticket.quantity}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!isAvailable}
                className={`w-full mt-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                  isAvailable
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />

                {isAvailable ? "Buy Now" : "Ticket Unavailable"}
              </button>

              <p className="text-xs text-slate-400 text-center mt-4">
                Secure checkout will be available in the next step.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

