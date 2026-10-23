"use client";

import Link from "next/link";
import {
  Search,
  MapPin,
  Calendar,
  Ticket,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800">

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">

        <div className="inline-flex items-center gap-2 bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1.5 rounded-full text-xs font-medium text-[#065F46] mb-6">
          <ShieldCheck size={16} />
          <span>100% Verified P2P Ticket Marketplace</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight max-w-3xl mx-auto">
          Buy & Sell Tickets with Absolute Trust and AI Security
        </h1>

        <p className="text-slate-500 mt-4 text-base md:text-lg max-w-xl mx-auto">
          Find tickets, compare listings and buy securely through
          TicketLagbe.
        </p>

        {/* Search Box */}
        <div className="max-w-4xl mx-auto mt-10 bg-white p-4 rounded-3xl shadow-lg border border-slate-100">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3">
              <MapPin
                size={18}
                className="text-[#0D9488]"
              />

              <div className="text-left">
                <span className="text-[10px] text-slate-400 block">
                  From
                </span>

                <span className="text-sm font-semibold">
                  Dhaka
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3">
              <MapPin
                size={18}
                className="text-[#0D9488]"
              />

              <div className="text-left">
                <span className="text-[10px] text-slate-400 block">
                  To
                </span>

                <span className="text-sm font-semibold">
                  Chittagong
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3">
              <Calendar
                size={18}
                className="text-[#0D9488]"
              />

              <div className="text-left">
                <span className="text-[10px] text-slate-400 block">
                  Date
                </span>

                <span className="text-sm font-semibold">
                  Tomorrow
                </span>
              </div>
            </div>

            <Link
              href="/tickets"
              className="bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl flex items-center justify-center gap-2 font-semibold transition"
            >
              <Search size={18} />
              Search Tickets
            </Link>

          </div>

        </div>

      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-4 py-10">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <ShieldCheck
              size={28}
              className="text-[#0D9488] mb-4"
            />

            <h3 className="font-bold text-lg">
              Verified Tickets
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Tickets can be verified before they are published.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <Ticket
              size={28}
              className="text-[#0D9488] mb-4"
            />

            <h3 className="font-bold text-lg">
              Easy Ticket Selling
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Create a listing and make your ticket available to buyers.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <ArrowRight
              size={28}
              className="text-[#0D9488] mb-4"
            />

            <h3 className="font-bold text-lg">
              Secure Checkout
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              Buyers can review ticket information before checkout.
            </p>
          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-16">

        <div className="bg-[#1A1C43] rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">

          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Ready to find your ticket?
            </h2>

            <p className="text-slate-300 text-sm mt-2">
              Browse available tickets on TicketLagbe.
            </p>
          </div>

          <Link
            href="/tickets"
            className="bg-[#5EEAD4] hover:bg-[#2dd4bf] text-[#1A1C43] px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition"
          >
            Browse Tickets
            <ArrowRight size={18} />
          </Link>

        </div>

      </section>

    </main>
  );
}