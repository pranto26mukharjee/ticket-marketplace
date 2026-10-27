"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Ticket,
  ShieldCheck,
  ArrowRight,
  Train,
  Bus,
  Plane,
  Music,
  Ship,
  Lock,
  CheckCircle2,
  Clock,
  Film,
  CalendarDays,
  Armchair,
  Loader2,
  FileCheck2,
} from "lucide-react";

const CATEGORIES = [
  { id: "TRAIN", label: "Train", icon: Train, bg: "bg-blue-50", text: "text-blue-700" },
  { id: "BUS", label: "Intercity bus", icon: Bus, bg: "bg-amber-50", text: "text-amber-700" },
  { id: "FLIGHT", label: "Flight", icon: Plane, bg: "bg-sky-50", text: "text-sky-700" },
  { id: "LAUNCH", label: "Launch", icon: Ship, bg: "bg-teal-50", text: "text-teal-700" },
  { id: "CONCERT", label: "Concert", icon: Music, bg: "bg-rose-50", text: "text-rose-700" },
  { id: "MUSIC", label: "Music festival", icon: Music, bg: "bg-violet-50", text: "text-violet-700" },
  { id: "MOVIE", label: "Cinema", icon: Film, bg: "bg-orange-50", text: "text-orange-700" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse or list a ticket",
    description: "Sellers add category-specific travel or event details and upload the original ticket PDF. Buyers can compare the listing before ordering.",
    icon: Ticket,
    color: "bg-blue-500",
  },
  {
    step: "02",
    title: "Review the details",
    description: "The platform checks required fields, PDF format, and possible duplicates. Listings can remain pending for administrator review.",
    icon: Lock,
    color: "bg-teal-500",
  },
  {
    step: "03",
    title: "Track the order",
    description: "Order and payment status are available in your account. Payment options in this project are sandbox/manual flows, not live payment settlement.",
    icon: CheckCircle2,
    color: "bg-emerald-500",
  },
];

const TRUST_FEATURES = [
  {
    icon: FileCheck2,
    title: "PDF ticket document",
    description: "A listing requires the original ticket PDF. The upload flow checks the file extension and PDF signature before it is attached to verification.",
    badge: "Required for listings",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  {
    icon: Lock,
    title: "Duplicate screening",
    description: "Ticket details are checked against existing listings for possible duplicates. Some verification results require administrator review.",
    badge: "Listing review",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    icon: Ticket,
    title: "Order status tracking",
    description: "Buyers and sellers can review order and payment status from their account dashboard. Current payment flows are sandbox/manual.",
    badge: "Account dashboard",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
];

interface HomeTicket {
  id: string;
  title: string;
  from: string | null;
  to: string | null;
  travelDate: string | null;
  travelTime: string | null;
  seatNumber: string | null;
  price: number | null;
  category?: { categoryName: string } | null;
  verifications?: Array<{ verificationStatus: string }>;
}

export default function HomePage() {
  const router = useRouter();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("ALL");
  const [recentListings, setRecentListings] = useState<HomeTicket[]>([]);
  const [recentListingsLoading, setRecentListingsLoading] = useState(true);
  const [listingError, setListingError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadRecentListings() {
      try {
        const response = await fetch("/api/tickets?sort=newest&page=1&limit=6", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load listings.");
        if (isCurrent) setRecentListings(data.tickets || []);
      } catch (error) {
        if (isCurrent) setListingError(error instanceof Error ? error.message : "Could not load listings.");
      } finally {
        if (isCurrent) setRecentListingsLoading(false);
      }
    }

    void loadRecentListings();
    return () => { isCurrent = false; };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from.trim()) params.set("from", from.trim());
    if (to.trim()) params.set("to", to.trim());
    if (category !== "ALL") params.set("category", category);
    router.push(`/tickets?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 overflow-x-hidden">

      {/* ============================================================
          HERO SECTION — Premium Dark with ambient glow
          ============================================================ */}
      <section className="bg-[#172238] text-white py-14 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          {/* Trust badge pill */}
          <div className="lg:col-span-2 inline-flex items-center gap-2 text-xs font-semibold text-teal-200">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Peer-to-peer ticket marketplace · Bangladesh</span>
          </div>

          {/* Main Headline */}
          <div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Tickets for trips and events, in one marketplace.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-7 mt-4">
            Browse available tickets, compare the listing details, and track orders from your account.
          </p>
          </div>

          {/* Main Search Box */}
          <div>
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800"
            >
              <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus-within:bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="w-full text-left">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">From</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus-within:bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="w-full text-left">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">To</label>
                  <input
                    type="text"
                    placeholder="e.g. Chittagong"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus-within:bg-white focus-within:border-teal-500 transition-all">
                <Ticket className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="w-full text-left">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="TRAIN">Train</option>
                    <option value="BUS">Intercity Bus</option>
                    <option value="FLIGHT">Flight</option>
                    <option value="LAUNCH">Launch / Ferry</option>
                    <option value="CONCERT">Concert</option>
                    <option value="MUSIC">Music festival</option>
                    <option value="MOVIE">Cinema</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg px-5 py-3 text-sm transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* ============================================================
          STATS COUNTER SECTION
          ============================================================ */}
      <section className="border-b border-amber-200 bg-amber-50 px-4 py-3">
        <p className="max-w-6xl mx-auto text-xs sm:text-sm text-amber-950">
          Payment options are currently sandbox/manual flows. Do not send real money until production payment processing is configured.
          <Link href="/how-it-works" className="ml-1 font-semibold underline">Details</Link>
        </p>
      </section>

      {/* ============================================================
          CATEGORY GRID
          ============================================================ */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16 reveal">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-2">Browse by Category</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
            Browse by ticket type
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Select a category to see currently available listings.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/tickets?category=${cat.id}`}
                className="group bg-white border border-slate-200/80 rounded-2xl p-6 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ticket-card flex flex-col items-center justify-center min-h-[140px]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`w-14 h-14 rounded-xl ${cat.bg} ${cat.text} group-hover:bg-teal-700 group-hover:text-white flex items-center justify-center mb-3.5 transition-colors`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm text-slate-800 leading-snug">{cat.label}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
          ============================================================ */}
      <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 py-20 sm:py-28 px-4 border-y border-slate-200/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 sm:mb-20 reveal">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-2">Before you order</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              How listings move through the marketplace
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-4 max-w-lg mx-auto leading-relaxed">
              Review the document status and order details before making a decision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 relative pt-4">
            {/* Connector Line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-0.5 bg-gradient-to-r from-blue-200 via-teal-300 to-emerald-200 pointer-events-none" />

            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="relative flex flex-col items-center text-center p-8 pt-10 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 reveal"
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-5 relative z-10`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 w-8 h-8 rounded-full bg-slate-900 text-white border-2 border-white flex items-center justify-center text-xs font-black shadow-md">
                    {step.step}
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg mb-2.5">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          TRUST FEATURES GRID
          ============================================================ */}
      <section className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
        <div className="text-center mb-16 sm:mb-20 reveal">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-2">Platform tools</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
            Listing checks and order tracking
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Current tools focus on document requirements, duplicate checks, and account-level order updates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {TRUST_FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className={`group p-7 sm:p-8 bg-white rounded-2xl border ${feature.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 reveal flex flex-col justify-between`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div>
                  <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 mb-3.5 uppercase tracking-wide">
                    {feature.badge}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-2.5">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          RECENT MARKETPLACE LISTINGS
          ============================================================ */}
      <section className="bg-[#172238] py-12 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold text-teal-300 uppercase tracking-wider">Marketplace</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white">Recently listed tickets</h2>
            </div>
            <Link href="/tickets" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-200 hover:text-white">
              Browse all <ArrowRight size={15} />
            </Link>
          </div>

          {recentListingsLoading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-slate-300"><Loader2 size={18} className="animate-spin" /> Loading listings</div>
          ) : listingError ? (
            <p role="status" className="py-8 text-sm text-slate-300">Listings are temporarily unavailable. <Link href="/tickets" className="underline">Open marketplace</Link>.</p>
          ) : recentListings.length === 0 ? (
            <div className="border-t border-slate-700 py-8 text-sm text-slate-300">
              No available listings yet. <Link href="/create-listing" className="font-semibold text-teal-200 underline">List a ticket</Link>.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentListings.map((listing) => {
                const verified = listing.verifications?.[0]?.verificationStatus === "VERIFIED";
                return (
                  <article key={listing.id} className="bg-white text-slate-900 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase text-teal-800">{listing.category?.categoryName || "Ticket"}</span>
                      <span className={`text-[10px] font-semibold ${verified ? "text-emerald-700" : "text-amber-700"}`}>{verified ? "Verified" : "Review pending"}</span>
                    </div>
                    <h3 className="mt-2 font-bold line-clamp-1">{listing.title}</h3>
                    <p className="mt-1 text-xs text-slate-600">{listing.from || "Location not listed"} to {listing.to || "Venue not listed"}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1"><CalendarDays size={13} />{listing.travelDate ? new Date(listing.travelDate).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" }) : "Date not listed"}</span>
                      {listing.travelTime && <span className="inline-flex items-center gap-1"><Clock size={13} />{listing.travelTime}</span>}
                      {listing.seatNumber && <span className="inline-flex items-center gap-1"><Armchair size={13} />{listing.seatNumber}</span>}
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                      <strong>৳{(listing.price || 0).toLocaleString()}</strong>
                      <Link href={`/tickets/${listing.id}`} className="text-xs font-semibold text-teal-800 hover:underline">View details</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          SELL CTA BANNER
          ============================================================ */}
      <section className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
        <div className="bg-[#0f766e] rounded-xl p-8 sm:p-10 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="text-white text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-100 mb-4">
                <FileCheck2 className="w-4 h-4" />
                Seller workflow
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-4">
                Have a ticket you can&apos;t use?
              </h2>
              <p className="text-white/90 text-sm sm:text-base max-w-lg leading-relaxed">
                Add the ticket details, upload the original PDF, and follow its review status from your account.
              </p>
              <div className="flex items-center gap-4 sm:gap-6 mt-6 flex-wrap justify-center md:justify-start">
                {["PDF required", "Category-specific fields", "Review status visible"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white text-xs sm:text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-teal-200" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3.5 shrink-0 w-full sm:w-auto">
              <Link
                href="/create-listing"
                className="inline-flex items-center justify-center gap-2 bg-white text-teal-800 font-extrabold text-sm sm:text-base px-8 py-4 rounded-2xl hover:bg-slate-50 transition-all shadow-xl hover:shadow-2xl active:scale-95 cursor-pointer"
              >
                <Ticket className="w-5 h-5" />
                Sell Your Ticket Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tickets"
                className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-2xl transition-all cursor-pointer backdrop-blur-sm"
              >
                <Search className="w-4 h-4" />
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          PLATFORM STATUS
          ============================================================ */}
      <section className="bg-slate-100 py-7 px-4 border-t border-slate-200">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-5 sm:gap-8">
          {[
            { icon: FileCheck2, label: "Original PDF required", color: "text-teal-800" },
            { icon: ShieldCheck, label: "Review status shown", color: "text-blue-800" },
            { icon: Ticket, label: "Order tracking available", color: "text-slate-700" },
            { icon: Lock, label: "Payments currently sandbox/manual", color: "text-amber-800" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className={`flex items-center gap-2 text-xs sm:text-sm font-semibold ${item.color}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}