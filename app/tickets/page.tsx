
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Ticket,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  Search,
  AlertCircle,
} from "lucide-react";

type TicketData = {
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
  status: string;
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadTickets() {
      try {
        const response = await fetch("/api/tickets");

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message || "Failed to load tickets."
          );
          return;
        }

        setTickets(data.tickets || []);
      } catch (error) {
        console.error("Load tickets error:", error);

        setError(
          "Something went wrong while loading tickets."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const searchText = search.toLowerCase();

    return (
      ticket.title.toLowerCase().includes(searchText) ||
      ticket.from.toLowerCase().includes(searchText) ||
      ticket.to.toLowerCase().includes(searchText) ||
      ticket.category.toLowerCase().includes(searchText)
    );
  });

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin text-[#0D9488]"
          />

          <p className="text-sm text-slate-500">
            Loading available tickets...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">

      {/* Header */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-10">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

            <div>
              <p className="text-sm font-semibold text-[#0D9488] mb-1">
                Ticket Marketplace
              </p>

              <h1 className="text-3xl font-extrabold text-slate-900">
                Find Your Ticket
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Browse verified tickets listed by our sellers.
              </p>
            </div>

            <Link
              href="/create-listing"
              className="bg-[#0D9488] hover:bg-[#0F766E] text-white px-5 py-3 rounded-xl text-sm font-semibold transition text-center"
            >
              Sell Your Ticket
            </Link>

          </div>

          {/* Search */}
          <div className="mt-7 relative max-w-2xl">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by destination, origin, ticket name..."
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />

          </div>

        </div>
      </section>

      {/* Tickets */}
      <section className="max-w-6xl mx-auto px-4 py-8">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm mb-6">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!error && filteredTickets.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-16 text-center">

            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket
                size={26}
                className="text-slate-400"
              />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              No Tickets Found
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {search
                ? "Try searching with another destination or ticket name."
                : "There are currently no tickets listed for sale."}
            </p>

            {!search && (
              <Link
                href="/create-listing"
                className="inline-flex mt-5 bg-[#0D9488] hover:bg-[#0F766E] text-white px-5 py-3 rounded-xl text-sm font-semibold"
              >
                List Your Ticket
              </Link>
            )}

          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden"
            >

              {/* Top */}
              <div className="p-5 border-b border-slate-100">

                <div className="flex items-center justify-between mb-4">

                  <span className="text-xs font-bold uppercase tracking-wide text-[#0D9488] bg-[#0D9488]/10 px-2.5 py-1 rounded-full">
                    {ticket.category}
                  </span>

                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Available
                  </span>

                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  {ticket.title}
                </h2>

              </div>

              {/* Route */}
              <div className="p-5 space-y-4">

                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin
                      size={18}
                      className="text-[#0D9488]"
                    />
                  </div>

                  <div className="flex-1">

                    <p className="text-xs text-slate-400">
                      Route
                    </p>

                    <p className="text-sm font-bold text-slate-800">
                      {ticket.from} → {ticket.to}
                    </p>

                  </div>

                </div>

                {/* Date */}
                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar
                      size={18}
                      className="text-[#0D9488]"
                    />
                  </div>

                  <div>

                    <p className="text-xs text-slate-400">
                      Travel Date
                    </p>

                    <p className="text-sm font-bold text-slate-800">
                      {formatDate(ticket.travelDate)}
                    </p>

                  </div>

                </div>

                {/* Seat */}
                {ticket.seatNumber && (
                  <div className="text-xs text-slate-500">
                    Seat:{" "}
                    <span className="font-semibold text-slate-700">
                      {ticket.seatNumber}
                    </span>
                  </div>
                )}

                {/* Bottom */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">

                  <div>
                    <p className="text-xs text-slate-400">
                      Asking Price
                    </p>

                    <p className="text-xl font-extrabold text-slate-900">
                      ৳ {ticket.price}
                    </p>
                  </div>

                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="bg-[#0D9488] hover:bg-[#0F766E] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                  >
                    View Ticket
                    <ArrowRight size={14} />
                  </Link>

                </div>

              </div>

            </div>
          ))}

        </div>

      </section>

    </main>
  );
}

