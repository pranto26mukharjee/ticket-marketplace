"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, ShieldCheck, Ticket, Calendar, MapPin, DollarSign, AlertCircle } from "lucide-react";

export default function CreateListingPage() {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      {/* Navbar */}
      <nav className="w-full bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#1E293B]">
          Ticket<span className="text-[#0D9488]">Lagbe</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/tickets" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Browse Tickets
          </Link>
          <div className="w-9 h-9 bg-[#0D9488]/10 text-[#0D9488] rounded-full flex items-center justify-center font-bold text-sm">
            SL
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">List Your Ticket for Sale</h1>
          <p className="text-slate-500 text-sm mt-1">
            Fill in the details below. Our AI system will verify the ticket authenticity automatically.
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Section 1: Ticket Document Upload */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Upload size={20} className="text-[#0D9488]" />
              <span>Upload Ticket Document</span>
            </h2>

            <div className="border-2 border-dashed border-slate-200 hover:border-[#0D9488] rounded-2xl p-8 text-center transition bg-slate-50/50 relative cursor-pointer">
              <input
                type="file"
                accept=".pdf, image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 bg-[#0D9488]/10 text-[#0D9488] rounded-full flex items-center justify-center">
                  <Ticket size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {fileName ? fileName : "Click or drag & drop ticket file (PDF or Image)"}
                </p>
                <p className="text-xs text-slate-400">Max file size: 10MB (PDF, PNG, JPG)</p>
              </div>
            </div>

            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3 flex items-center space-x-2 text-xs text-[#065F46]">
              <ShieldCheck size={16} className="shrink-0" />
              <span>Personal sensitive information will be automatically masked before buyers see it.</span>
            </div>
          </div>

          {/* Section 2: Ticket Details */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Journey & Event Details</h2>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
              <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                <option value="train">Train Ticket</option>
                <option value="bus">Bus Ticket</option>
                <option value="concert">Concert / Event</option>
                <option value="movie">Movie Ticket</option>
              </select>
            </div>

            {/* Title / Route */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">From (Origin)</label>
                <input
                  type="text"
                  placeholder="e.g. Dhaka"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">To (Destination)</label>
                <input
                  type="text"
                  placeholder="e.g. Cox's Bazar"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            {/* Transport / Operator Name & Seat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Operator / Event Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cox's Bazar Express"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Class / Seat Info</label>
                <input
                  type="text"
                  placeholder="e.g. Snigdha / Seat G-12"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Departure Date & Time</label>
              <input
                type="datetime-local"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
          </div>

          {/* Section 3: Pricing */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Pricing</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Asking Price (BDT)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="1200"
                  className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">BDT</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 px-6 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold rounded-2xl text-base transition shadow-md cursor-pointer"
          >
            Publish Ticket Listing
          </button>
        </form>
      </main>
    </div>
  );
}