"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, ShieldCheck, MapPin, Calendar, Tag } from "lucide-react";

export default function TicketSearchPage() {
  const [category, setCategory] = useState("all");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      {/* Header */}
      <nav className="w-full bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#1E293B]">
          Ticket<span className="text-[#0D9488]">Lagbe</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Log In
          </Link>
          <Link href="/signup" className="text-sm font-semibold bg-[#0D9488] text-white px-4 py-2 rounded-xl">
            Sign Up
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title & Search Bar Area */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Explore Available Tickets</h1>
          <p className="text-slate-500 text-sm mt-1">Verified tickets available for instant purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar: Filters */}
          <aside className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
            <div className="flex items-center space-x-2 font-bold text-slate-900 pb-4 border-b border-slate-100 mb-6">
              <Filter size={18} className="text-[#0D9488]" />
              <span>Filter Tickets</span>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Category
              </label>
              <div className="space-y-2">
                {["all", "train", "bus", "concert", "event"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition capitalize cursor-pointer ${
                      category === cat
                        ? "bg-[#0D9488]/10 text-[#0D9488] font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Max Price (BDT)
              </label>
              <input type="range" min="100" max="10000" className="w-full accent-[#0D9488]" />
            </div>
          </aside>

          {/* Right Area: Ticket List */}
          <section className="lg:col-span-3 space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      Train Ticket
                    </span>
                    <span className="inline-flex items-center space-x-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                      <ShieldCheck size={14} />
                      <span>AI Verified</span>
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Dhaka to Chittagong</h2>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <MapPin size={14} /> <span>Subarna Express</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar size={14} /> <span>Tomorrow, 07:00 AM</span>
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-slate-400 block">Asking Price</span>
                    <span className="text-2xl font-extrabold text-[#0D9488]">৳ 950</span>
                  </div>
                  <Link
                    href={`/tickets/${item}`}
                    className="mt-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}