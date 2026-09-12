"use client";

import Link from "next/link";
import { Search, MapPin, Calendar, Ticket, ShieldCheck, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      {/* 1. Header / Navbar */}
      <nav className="w-full bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#1E293B]">
          Ticket<span className="text-[#0D9488]">Lagbe</span>
        </Link>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 transition"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-[#0D9488] hover:bg-[#0F766E] text-white px-4 py-2 rounded-xl transition shadow-sm"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center space-x-2 bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1.5 rounded-full text-xs font-medium text-[#065F46] mb-6">
          <ShieldCheck size={16} />
          <span>100% Verified P2P Ticket Marketplace</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight max-w-3xl mx-auto">
          Buy & Sell Tickets with Absolute Trust and AI Security
        </h1>
        <p className="text-slate-500 mt-4 text-base md:text-lg max-w-xl mx-auto">
          Find instant tickets for trains, buses, concerts, and events from verified sellers.
        </p>

        {/* Search Bar Container */}
        <div className="mt-10 bg-white p-3 md:p-4 rounded-2xl md:rounded-full shadow-lg border border-slate-100 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center space-x-3 w-full px-4 py-2 border-b md:border-b-0 md:border-r border-slate-100">
            <Search size={20} className="text-slate-400" />
            <input
              type="text"
              placeholder="Event, Train, or Bus Name..."
              className="w-full outline-none text-sm bg-transparent text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Location */}
          <div className="flex items-center space-x-3 w-full px-4 py-2 border-b md:border-b-0 md:border-r border-slate-100">
            <MapPin size={20} className="text-slate-400" />
            <input
              type="text"
              placeholder="From / To Location"
              className="w-full outline-none text-sm bg-transparent text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Date */}
          <div className="flex items-center space-x-3 w-full px-4 py-2">
            <Calendar size={20} className="text-slate-400" />
            <input
              type="date"
              className="w-full outline-none text-sm bg-transparent text-slate-500"
            />
          </div>

          {/* Action Button */}
          <button className="w-full md:w-auto bg-[#0D9488] hover:bg-[#0F766E] text-white px-8 py-3.5 rounded-xl md:rounded-full font-semibold text-sm transition shadow-md shrink-0 cursor-pointer">
            Search
          </button>
        </div>
      </section>

      {/* 3. Featured Tickets / Categories Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Recent Ticket Listings</h2>
            <p className="text-sm text-slate-500 mt-1">Verified tickets available right now</p>
          </div>
          <Link href="/tickets" className="text-sm font-semibold text-[#0D9488] hover:underline flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Dummy Ticket Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                  Train Ticket
                </span>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                  AI Verified
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Dhaka to Cox's Bazar</h3>
              <p className="text-xs text-slate-400 mt-1">Cox's Bazar Express • AC Chair</p>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Price</span>
                  <span className="text-lg font-bold text-[#0D9488]">৳ 1,250</span>
                </div>
                <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}