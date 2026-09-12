"use client";

import Link from "next/link";
import { CheckCircle2, ShieldCheck, Download, Share2, Calendar, MapPin, Ticket, ArrowRight } from "lucide-react";

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans py-12 px-4">
      <main className="max-w-3xl mx-auto space-y-8">
        
        {/* Top Success Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-2 shadow-sm">
            <CheckCircle2 size={48} />
          </div>
          <span className="block text-xs font-extrabold text-emerald-600 tracking-wider uppercase">
            Payment Confirmed
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Your Ticket Purchase is Successful!</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Order <span className="font-mono font-bold text-slate-700">#TL-99482</span> has been processed. Your payment is safely locked in Escrow.
          </p>
        </div>

        {/* Digital Ticket Pass Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden">
          
          {/* Header Bar */}
          <div className="bg-[#1A1C43] text-white p-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Ticket className="text-[#5EEAD4]" size={24} />
              <span className="font-bold tracking-tight text-lg">Digital Entry Pass</span>
            </div>
            <span className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-[#5EEAD4]/10 text-[#5EEAD4] border border-[#5EEAD4]/30 px-3 py-1 rounded-full">
              <ShieldCheck size={14} />
              <span>Verified Valid</span>
            </span>
          </div>

          {/* Ticket Content */}
          <div className="p-6 md:p-8 space-y-6">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Route / Event</span>
                <h2 className="text-2xl font-black text-slate-900">Dhaka to Chittagong</h2>
                <p className="text-xs text-slate-500 font-medium">Subarna Express (Train No: 702)</p>
              </div>
              <div className="md:text-right">
                <span className="text-xs text-slate-400 font-medium block">Seat Info</span>
                <span className="text-lg font-bold text-[#0D9488]">Snigdha Class • Seat G-12</span>
              </div>
            </div>

            {/* Travel Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block">Departure Date</span>
                <div className="flex items-center space-x-1.5 text-sm font-bold text-slate-800 mt-1">
                  <Calendar size={14} className="text-[#0D9488]" />
                  <span>Tomorrow, 07:00 AM</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Boarding Station</span>
                <div className="flex items-center space-x-1.5 text-sm font-bold text-slate-800 mt-1">
                  <MapPin size={14} className="text-[#0D9488]" />
                  <span>Kamalapur Station</span>
                </div>
              </div>

              <div className="col-span-2 md:col-span-1">
                <span className="text-xs text-slate-400 block">Amount Paid</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">৳ 980 (bKash Escrow)</span>
              </div>
            </div>

            {/* Mock QR Code Section */}
            <div className="pt-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-inner inline-block">
                {/* Visual SVG representation of a QR code */}
                <svg width="120" height="120" viewBox="0 0 100 100" className="fill-slate-900">
                  <rect x="0" y="0" width="30" height="30" />
                  <rect x="5" y="5" width="20" height="20" fill="white" />
                  <rect x="10" y="10" width="10" height="10" />
                  
                  <rect x="70" y="0" width="30" height="30" />
                  <rect x="75" y="5" width="20" height="20" fill="white" />
                  <rect x="80" y="10" width="10" height="10" />

                  <rect x="0" y="70" width="30" height="30" />
                  <rect x="5" y="75" width="20" height="20" fill="white" />
                  <rect x="10" y="80" width="10" height="10" />

                  <rect x="40" y="10" width="15" height="15" />
                  <rect x="40" y="35" width="20" height="20" />
                  <rect x="70" y="45" width="20" height="15" />
                  <rect x="35" y="70" width="25" height="25" />
                  <rect x="70" y="75" width="15" height="20" />
                </svg>
              </div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                Verification Hash: 8f92-a74c-9011
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button className="w-full sm:w-auto px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer">
              <Download size={14} />
              <span>Download PDF Ticket</span>
            </button>

            <button className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition flex items-center justify-center space-x-2 cursor-pointer">
              <Share2 size={14} />
              <span>Share Pass</span>
            </button>
          </div>
        </div>

        {/* Bottom Redirect Link */}
        <div className="text-center pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-sm font-bold text-[#0D9488] hover:underline"
          >
            <span>Go to My Purchases Dashboard</span>
            <ArrowRight size={16} />
          </Link>
        </div>

      </main>
    </div>
  );
}