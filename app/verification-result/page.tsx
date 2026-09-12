"use client";

import Link from "next/link";
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";

export default function VerificationResultPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      {/* Top Navigation Bar */}
      <nav className="w-full bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#1E293B]">
          Ticket<span className="text-[#0D9488]">Lagbe</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/seller-dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Dashboard
          </Link>
          <div className="w-9 h-9 bg-[#0D9488]/10 text-[#0D9488] rounded-full flex items-center justify-center font-bold text-sm">
            AH
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Status Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-2">
            <ShieldCheck size={36} />
          </div>
          <span className="block text-xs font-bold text-emerald-600 tracking-wider uppercase">
            Verification Successful
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">Your Ticket is Ready For Sale!</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Our AI validation engines have verified the authenticity and barcode integrity of your uploaded document.
          </p>
        </div>

        {/* Verification Breakdown Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900">AI Confidence Score</span>
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              98.4% Authentic
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Barcode & Cryptographic Check</p>
                <p className="text-xs text-slate-400">Valid digital signature detected from official provider.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Duplicate Prevention Audit</p>
                <p className="text-xs text-slate-400">This ticket serial key has not been listed elsewhere on our network.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Sensitive Information Masked</p>
                <p className="text-xs text-slate-400">Personal identity and PII have been safely obfuscated for public view.</p>
              </div>
            </div>
          </div>

          {/* Action Box */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/my-listings"
              className="w-full sm:flex-1 py-3.5 px-4 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold rounded-xl text-sm transition shadow-sm text-center flex items-center justify-center space-x-2"
            >
              <span>Publish To Marketplace</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/create-listing"
              className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition text-center flex items-center justify-center space-x-1"
            >
              <RefreshCw size={14} />
              <span>Re-upload</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}