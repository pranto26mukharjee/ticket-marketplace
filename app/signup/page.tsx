"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-4 py-12 font-sans">
      {/* Centered Card */}
      <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-lg border border-slate-100 p-8 flex flex-col items-center">
        
        {/* Top Shield Icon */}
        <div className="w-12 h-12 bg-[#0D9488] rounded-xl flex items-center justify-center text-white mb-3 shadow-sm">
          <Shield size={24} className="fill-current" />
        </div>

        {/* Header & Tagline */}
        <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] flex items-center">
          Ticket<span className="text-[#0D9488]">Lagbe</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 mb-6 text-center font-normal">
          Create your high-trust P2P account
        </p>

        {/* Tab Switcher */}
        <div className="w-full bg-[#F1F5F9] p-1 rounded-2xl flex mb-6">
          <button
            type="button"
            onClick={() => setRole("buyer")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              role === "buyer"
                ? "bg-white text-[#0D9488] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign Up as Buyer
          </button>
          <button
            type="button"
            onClick={() => setRole("seller")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              role === "seller"
                ? "bg-white text-[#0D9488] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign Up as Seller
          </button>
        </div>

        {/* Form Fields */}
        <form className="w-full space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              defaultValue="Abrar Hasan"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition"
            />
          </div>

          {/* Email or Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email or Phone Number
            </label>
            <input
              type="text"
              defaultValue="abrar@ticketlagbe.com"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                defaultValue="••••••••••••"
                className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Encryption Info Box */}
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3.5 flex items-start space-x-3">
            <Lock size={18} className="text-[#0D9488] mt-0.5 shrink-0" />
            <p className="text-xs text-[#065F46] leading-relaxed font-normal">
              Biometric & data encryption active. Your credentials are fully protected.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold rounded-xl text-sm transition shadow-sm mt-2 cursor-pointer"
          >
            Create Verified Account
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:underline">
              Log In
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}