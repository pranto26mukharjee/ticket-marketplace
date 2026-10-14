"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Ticket,
  Search,
  PlusCircle,
  LayoutDashboard,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Heart,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
  Package,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";

interface AuthUser {
  id: string;
  fullName: string | null;
  email: string;
  phone?: string | null;
  role: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Re-check authentication on mount and whenever pathname changes
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      });

    // Close menus on route change
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tickets?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  }

  return (
    <header className="w-full bg-[#1A1C43] border-b border-slate-800/80 sticky top-0 z-50 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl sm:text-2xl font-black tracking-tight shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-[#1A1C43] shadow-md group-hover:scale-105 transition-transform">
            <Ticket className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="leading-none text-white">
              Ticket<span className="text-[#5EEAD4]">Lagbe</span>
            </span>
            <span className="text-[9px] font-mono tracking-wider text-teal-300 font-semibold uppercase opacity-80 mt-0.5 hidden sm:inline">
              AI Escrow Verified
            </span>
          </div>
        </Link>

        {/* Global Search Bar (Desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden lg:flex items-center flex-1 max-w-sm mx-4"
        >
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search train, bus, flight, concert..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-800/70 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </form>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold">
          <Link
            href="/"
            className={`transition ${
              pathname === "/" ? "text-[#5EEAD4]" : "text-slate-300 hover:text-white"
            }`}
          >
            Home
          </Link>

          <Link
            href="/tickets"
            className={`flex items-center gap-1.5 transition ${
              pathname.startsWith("/tickets") && pathname !== "/tickets/create"
                ? "text-[#5EEAD4]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Search size={14} />
            <span>Browse Tickets</span>
          </Link>

          <Link
            href="/verification-result"
            className={`flex items-center gap-1.5 transition ${
              pathname === "/verification-result"
                ? "text-[#5EEAD4]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <ShieldCheck size={14} className="text-teal-400" />
            <span>How Escrow Works</span>
          </Link>

          {/* Sell Ticket Link / Button */}
          <Link
            href="/create-listing"
            className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-[#1A1C43] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition transform active:scale-95"
          >
            <PlusCircle size={14} />
            <span>Sell Ticket</span>
          </Link>
        </nav>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Favorites Heart Icon */}
              <Link
                href="/dashboard?tab=favorites"
                title="Saved Tickets"
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-rose-400 transition"
              >
                <Heart size={16} />
              </Link>

              {/* Interactive Notification Popover */}
              <NotificationDropdown />

              {/* Admin Portal Quick Button (if Admin) */}
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1 text-[11px] font-bold bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1.5 rounded-lg transition shadow-sm"
                >
                  <ShieldCheck size={13} />
                  <span>Admin</span>
                </Link>
              )}

              {/* User Dropdown */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-400 text-[#1A1C43] flex items-center justify-center font-bold text-xs shadow-inner">
                    {(user.fullName || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left max-w-[100px] truncate">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {user.fullName || user.email.split("@")[0]}
                    </p>
                    <p className="text-[9px] text-teal-300 font-mono uppercase tracking-wider">
                      {user.role}
                    </p>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu Modal */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                    {/* Header info */}
                    <div className="p-3.5 bg-slate-50 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.fullName || "Valued User"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
                        {user.role} Account
                      </span>
                    </div>

                    <div className="p-1.5 space-y-0.5 text-xs font-medium">
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 font-bold"
                        >
                          <ShieldCheck size={14} className="text-purple-600" />
                          <span>Admin Command Center</span>
                        </Link>
                      )}

                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                      >
                        <LayoutDashboard size={14} className="text-slate-400" />
                        <span>My Dashboard</span>
                      </Link>

                      <Link
                        href="/create-listing"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-teal-600 font-semibold"
                      >
                        <PlusCircle size={14} className="text-teal-500" />
                        <span>Sell a Ticket</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=purchases"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                      >
                        <Package size={14} className="text-slate-400" />
                        <span>Purchased Tickets & Escrow</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=listings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                      >
                        <Ticket size={14} className="text-slate-400" />
                        <span>My Listed Tickets</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=inquiries"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                      >
                        <MessageSquare size={14} className="text-slate-400" />
                        <span>Buyer Inquiries</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=favorites"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                      >
                        <Heart size={14} className="text-rose-400" />
                        <span>Saved Favorites</span>
                      </Link>

                      <Link
                        href="/dashboard?tab=profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                      >
                        <User size={14} className="text-slate-400" />
                        <span>Profile & Verification</span>
                      </Link>
                    </div>

                    {/* Logout Option */}
                    <div className="p-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold text-left transition cursor-pointer"
                      >
                        <LogOut size={14} />
                        <span>{loggingOut ? "Signing Out..." : "Sign Out"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-bold text-slate-200 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 bg-[#5EEAD4] hover:bg-[#2dd4bf] text-[#1A1C43] font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow-sm active:scale-95"
              >
                <LogIn size={13} />
                <span>Register</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#161838] border-b border-slate-700/80 px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search train, bus, event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          {/* Navigation Links */}
          <div className="space-y-1 text-sm font-semibold">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              Home
            </Link>
            <Link
              href="/tickets"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              Browse Verified Tickets
            </Link>
            <Link
              href="/verification-result"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-teal-300 flex items-center gap-1.5"
            >
              <ShieldCheck size={16} />
              How Escrow Works
            </Link>
            <Link
              href="/create-listing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg bg-teal-500/20 text-[#5EEAD4] border border-teal-500/30 flex items-center gap-2"
            >
              <PlusCircle size={16} />
              Sell a Ticket Now
            </Link>
          </div>

          {/* User Links in Mobile Menu */}
          {user ? (
            <div className="pt-3 border-t border-slate-700/70 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-800/60 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white">
                    {user.fullName || user.email}
                  </p>
                  <p className="text-[10px] text-teal-300 uppercase">{user.role}</p>
                </div>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs bg-purple-600 px-2 py-1 rounded font-bold"
                  >
                    Admin
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 bg-slate-800/80 rounded-lg text-center text-slate-200"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard?tab=purchases"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 bg-slate-800/80 rounded-lg text-center text-slate-200"
                >
                  My Orders
                </Link>
                <Link
                  href="/dashboard?tab=listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 bg-slate-800/80 rounded-lg text-center text-slate-200"
                >
                  My Listings
                </Link>
                <Link
                  href="/dashboard?tab=inquiries"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 bg-slate-800/80 rounded-lg text-center text-slate-200"
                >
                  Inquiries
                </Link>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full py-2.5 text-center text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl"
              >
                {loggingOut ? "Signing Out..." : "Sign Out"}
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-700/70 flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-bold bg-slate-800 text-white rounded-xl"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-bold bg-[#5EEAD4] text-[#1A1C43] rounded-xl"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}