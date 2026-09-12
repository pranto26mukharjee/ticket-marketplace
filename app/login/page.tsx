"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Cpu } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen w-full bg-[#F4F7FB] flex items-center justify-center p-4 md:p-10 font-sans">
      {/* Container Box */}
      <div className="w-full max-w-[880px] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[480px]">
        
        {/* Left Section: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          {/* Logo */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] flex items-center">
              Ticket<span className="text-[#0D9488]">Lagbe</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-normal">
              Secure access to your tickets
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {/* Email / Phone Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email / Phone
              </label>
              <input
                type="text"
                defaultValue="buyer@ticketlagbe.com"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  defaultValue="••••••••••••"
                  className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold rounded-xl text-sm transition shadow-sm mt-2 cursor-pointer"
            >
              Decrypt & Log In
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center mt-6">
            <p className="text-xs text-slate-500">
              New to TicketLagbe?{" "}
              <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Right Section: Banner */}
        <div className="w-full md:w-1/2 bg-[#1A1C43] p-8 md:p-12 flex flex-col items-center justify-center text-center text-white relative">
          {/* Circular Icon Wrapper */}
          <div className="w-20 h-20 bg-[#6EE7B7]/20 border border-[#6EE7B7]/40 rounded-full flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-[#5EEAD4] rounded-full flex items-center justify-center text-[#1A1C43]">
              <Cpu size={28} />
            </div>
          </div>

          <h2 className="text-xl font-bold mb-3 tracking-wide">
            AI Signature Check
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-[280px]">
            Our system instantly checks the ticket cryptographic key to ensure uniqueness before any sale.
          </p>
        </div>

      </div>
    </main>
  );
}