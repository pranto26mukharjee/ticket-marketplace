"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  Tag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  PlusCircle, 
  ArrowUpRight 
} from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"purchases" | "listings">("purchases");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      {/* Header */}
      <nav className="w-full bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#1E293B]">
          Ticket<span className="text-[#0D9488]">Lagbe</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link
            href="/create-listing"
            className="flex items-center space-x-1.5 text-sm font-semibold bg-[#0D9488] text-white px-4 py-2 rounded-xl hover:bg-[#0F766E] transition shadow-sm"
          >
            <PlusCircle size={16} />
            <span>Sell Ticket</span>
          </Link>
          <div className="w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
            AH
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">User Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your active purchases, sales, and tickets.</p>
          </div>

          <div className="flex space-x-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Trust Level</span>
                <span className="text-sm font-bold text-slate-800">Verified Seller</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-6 space-x-8">
          <button
            onClick={() => setActiveTab("purchases")}
            className={`pb-3 font-semibold text-sm flex items-center space-x-2 transition border-b-2 cursor-pointer ${
              activeTab === "purchases"
                ? "border-[#0D9488] text-[#0D9488]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShoppingBag size={18} />
            <span>My Purchases</span>
          </button>
          <button
            onClick={() => setActiveTab("listings")}
            className={`pb-3 font-semibold text-sm flex items-center space-x-2 transition border-b-2 cursor-pointer ${
              activeTab === "listings"
                ? "border-[#0D9488] text-[#0D9488]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Tag size={18} />
            <span>My Ticket Listings</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "purchases" ? (
          <div className="space-y-4">
            {/* Purchase Item Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 size={12} />
                    <span>Completed</span>
                  </span>
                  <span className="text-xs text-slate-400">Order #TL-8823</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Dhaka to Chittagong - Subarna Express</h3>
                <p className="text-xs text-slate-500">Journey Date: Tomorrow, 07:00 AM • Seat Snigdha-G12</p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Amount Paid</span>
                  <span className="text-lg font-bold text-slate-900">৳ 950</span>
                </div>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer">
                  Download Ticket
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Listing Item Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                    <Clock size={12} />
                    <span>Active Listing</span>
                  </span>
                  <span className="text-xs text-[#0D9488] font-medium">AI Signature Verified</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Dhaka to Cox's Bazar - Bus Ticket</h3>
                <p className="text-xs text-slate-500">Listed on: Today • Asking Price: ৳ 1,200</p>
              </div>

              <div className="flex items-center space-x-3">
                <button className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition cursor-pointer">
                  Remove Listing
                </button>
                <Link
                  href="/tickets/1"
                  className="bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center space-x-1"
                >
                  <span>View Public Page</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}