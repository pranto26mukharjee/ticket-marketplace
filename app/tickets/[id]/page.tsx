"use client";

import Link from "next/link";
import { ShieldCheck, MapPin, Calendar, Clock, UserCheck, AlertTriangle, ChevronLeft } from "lucide-react";

export default function TicketDetailPage({ params }: { params: { id: string } }) {
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

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link href="/tickets" className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
          <ChevronLeft size={16} />
          <span>Back to Ticket Listings</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Box */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              {/* Badge & Title */}
              <div className="flex items-center justify-between">
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                  Train Ticket
                </span>
                <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck size={16} />
                  <span>Cryptographic Verified</span>
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Dhaka to Chittagong</h1>
                <p className="text-slate-500 text-sm mt-1">Subarna Express (Non-Stop)</p>
              </div>

              {/* Journey Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block">Date & Time</span>
                  <div className="flex items-center space-x-2 text-sm font-semibold text-slate-800">
                    <Calendar size={16} className="text-[#0D9488]" />
                    <span>Tomorrow, 07:00 AM</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block">Seat Category</span>
                  <div className="flex items-center space-x-2 text-sm font-semibold text-slate-800">
                    <MapPin size={16} className="text-[#0D9488]" />
                    <span>Snigdha (AC Chair)</span>
                  </div>
                </div>
              </div>

              {/* Security Alert Banner */}
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-4 flex items-start space-x-3">
                <ShieldCheck size={20} className="text-[#0D9488] shrink-0 mt-0.5" />
                <div className="text-xs text-[#065F46] leading-relaxed">
                  <p className="font-semibold mb-0.5">Escrow Buyer Protection Active</p>
                  <span>Your payment is held safely until you confirm valid entry/ticket verification.</span>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Seller Information</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">
                    AH
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1">
                      <span>Abrar Hasan</span>
                      <UserCheck size={16} className="text-blue-500" />
                    </h4>
                    <p className="text-xs text-slate-400">NID Verified Seller • 98% Positive Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Action Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg space-y-6">
              <div>
                <span className="text-xs text-slate-400 block">Total Price</span>
                <span className="text-3xl font-extrabold text-[#0D9488]">৳ 950</span>
                <span className="text-xs text-slate-400 block mt-1">+ ৳ 30 Platform Service Fee</span>
              </div>

              <button className="w-full py-3.5 px-4 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold rounded-xl text-sm transition shadow-md cursor-pointer">
                Proceed to Checkout
              </button>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <div className="flex items-center space-x-2">
                  <Clock size={14} className="text-slate-400" />
                  <span>Instant Ticket Digital Delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={14} className="text-slate-400" />
                  <span>Money-back Guarantee on Dispute</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}