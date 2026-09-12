"use client";


import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for Admin Authentication will be added during backend integration
    window.location.href = "/admin/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#1A1C43] flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="max-w-md w-full bg-[#232659] border border-slate-700/60 rounded-3xl p-8 shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0D9488]/20 text-[#5EEAD4] border border-[#0D9488]/40 rounded-2xl mb-2">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Ticket<span className="text-[#5EEAD4]">Lagbe</span> Admin
          </h1>
          <p className="text-xs text-slate-400">
            Internal Platform Management & Security Ops
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleAdminLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Admin Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ticketlagbe.com"
                className="w-full pl-10 pr-4 py-3 bg-[#1A1C43] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Passcode / Token
            </label>
            <div className="relative">
              <KeyRound size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[#1A1C43] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Access Backoffice</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Note */}
        <div className="pt-4 border-t border-slate-700/60 text-center text-xs text-slate-400 flex items-center justify-center space-x-1">
          <Lock size={12} className="text-[#5EEAD4]" />
          <span>Restricted Portal • Authorized Personnel Only</span>
        </div>

      </div>
    </div>
  );
}