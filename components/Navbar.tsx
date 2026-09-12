"use client";

import Link from "next/link";
import { Ticket, Search, PlusCircle, User, Shield } from "lucide-react";

export default function Navbar() {
  return (
    <header className="w-full bg-[#1A1C43] border-b border-slate-700/60 sticky top-0 z-50 text-white font-sans">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2 text-2xl font-bold tracking-tight">
          <Ticket className="text-[#5EEAD4]" size={28} />
          <span>Ticket<span className="text-[#5EEAD4]">Lagbe</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link href="/" className="hover:text-[#5EEAD4] transition">
            Home
          </Link>
          <Link href="/ticket-search" className="hover:text-[#5EEAD4] transition flex items-center space-x-1.5">
            <Search size={16} />
            <span>Search Tickets</span>
          </Link>
          <Link href="/create-listing" className="hover:text-[#5EEAD4] transition flex items-center space-x-1.5">
            <PlusCircle size={16} />
            <span>Sell Ticket</span>
          </Link>
          <Link href="/dispute-management" className="hover:text-[#5EEAD4] transition flex items-center space-x-1.5 text-[#5EEAD4]">
            <Shield size={16} />
            <span>Escrow Trust</span>
          </Link>
        </nav>

        {/* Right CTA / User Action */}
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="flex items-center space-x-2 bg-[#5EEAD4] hover:bg-[#2dd4bf] text-[#1A1C43] font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
          >
            <User size={16} />
            <span>Account</span>
          </Link>
        </div>

      </div>
    </header>
  );
}