"use client";

import Link from "next/link";
import {
  Ticket,
  Search,
  PlusCircle,
  User,
  LayoutDashboard,
} from "lucide-react";

export default function Navbar() {
  return (
    <header className="w-full bg-[#1A1C43] border-b border-slate-700/60 sticky top-0 z-50 text-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold tracking-tight"
        >
          <Ticket className="text-[#5EEAD4]" size={28} />

          <span>
            Ticket<span className="text-[#5EEAD4]">Lagbe</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">

          <Link
            href="/"
            className="hover:text-[#5EEAD4] transition"
          >
            Home
          </Link>

          <Link
            href="/tickets"
            className="flex items-center gap-1.5 hover:text-[#5EEAD4] transition"
          >
            <Search size={16} />
            <span>Search Tickets</span>
          </Link>

          <Link
            href="/create-listing"
            className="flex items-center gap-1.5 hover:text-[#5EEAD4] transition"
          >
            <PlusCircle size={16} />
            <span>Sell Ticket</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 hover:text-[#5EEAD4] transition"
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

        </nav>

        {/* Account */}
        <Link
          href="/login"
          className="flex items-center gap-2 bg-[#5EEAD4] hover:bg-[#2dd4bf] text-[#1A1C43] font-bold text-xs px-4 py-2 rounded-xl transition"
        >
          <User size={16} />
          <span>Account</span>
        </Link>

      </div>
    </header>
  );
}