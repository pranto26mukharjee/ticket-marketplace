"use client";

import { useState, useEffect, useRef } from "react";
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
  Sparkles,
  Lock,
  RefreshCw,
  Star,
  CheckCircle2,
  TrendingUp,
  Users,
  BadgeCheck,
  Zap,
  Clock,
  ChevronRight,
  Play,
  Film,
} from "lucide-react";

const CATEGORIES = [
  { id: "TRAIN",   label: "Train",          icon: Train,   color: "from-blue-500 to-blue-600",    bg: "bg-blue-50",    text: "text-blue-600",   count: "2,400+ listed" },
  { id: "BUS",     label: "Intercity Bus",  icon: Bus,     color: "from-amber-500 to-orange-500", bg: "bg-amber-50",   text: "text-amber-600",  count: "1,800+ listed" },
  { id: "FLIGHT",  label: "Flight",          icon: Plane,   color: "from-sky-500 to-cyan-500",     bg: "bg-sky-50",     text: "text-sky-600",    count: "600+ listed" },
  { id: "LAUNCH",  label: "Launch / Ferry", icon: Ship,    color: "from-teal-500 to-emerald-500", bg: "bg-teal-50",    text: "text-teal-600",   count: "900+ listed" },
  { id: "CONCERT", label: "Concerts",       icon: Music,   color: "from-purple-500 to-pink-500",  bg: "bg-purple-50",  text: "text-purple-600", count: "400+ listed" },
  { id: "MOVIE",   label: "Cinema",         icon: Film,    color: "from-rose-500 to-red-500",     bg: "bg-rose-50",    text: "text-rose-600",   count: "350+ listed" },
];

const POPULAR_ROUTES = [
  { from: "Dhaka",    to: "Chittagong", cat: "TRAIN",  label: "Dhaka → Ctg",     price: 450 },
  { from: "Dhaka",    to: "Cox's Bazar", cat: "BUS",  label: "Dhaka → Cox's Bazar", price: 850 },
  { from: "Dhaka",    to: "Sylhet",     cat: "TRAIN",  label: "Dhaka → Sylhet",   price: 380 },
  { from: "Dhaka",    to: "Barisal",    cat: "LAUNCH", label: "Dhaka → Barisal",  price: 320 },
  { from: "Dhaka",    to: "Rajshahi",   cat: "TRAIN",  label: "Dhaka → Rajshahi", price: 420 },
  { from: "Ctg",      to: "Cox's Bazar", cat: "BUS",  label: "Ctg → Cox's Bazar", price: 250 },
];

const STATS = [
  { value: 12400, suffix: "+", label: "Verified Tickets Sold", icon: Ticket },
  { value: 98,    suffix: "%", label: "Buyer Satisfaction",    icon: Star },
  { value: 24000, suffix: "+", label: "Registered Members",    icon: Users },
  { value: 4200,  suffix: "৳", label: "Avg Escrow Value",      icon: Lock },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "List Your Ticket",
    description: "Upload a photo or PDF of your ticket. Our AI scans it for authenticity in under 30 seconds. No fake listings allowed.",
    icon: Ticket,
    color: "bg-blue-500",
  },
  {
    step: "02",
    title: "Buyer Pays into Escrow",
    description: "A verified buyer pays via bKash, Nagad, or card. Funds are locked in our secure escrow vault — not released to you yet.",
    icon: Lock,
    color: "bg-teal-500",
  },
  {
    step: "03",
    title: "Travel & Get Paid",
    description: "After the buyer boards safely and confirms, the escrow releases your payment automatically. Everyone wins. Zero risk.",
    icon: CheckCircle2,
    color: "bg-emerald-500",
  },
];

const TRUST_FEATURES = [
  {
    icon: Sparkles,
    title: "AI Ticket Verification",
    description: "OCR-powered optical scan detects edited dates, seat swaps, and duplicate listings across 18 data points.",
    badge: "Phase 5 Engine",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  {
    icon: Lock,
    title: "4-Stage Escrow Vault",
    description: "PENDING → HOLD → CONFIRMED → RELEASED. Your funds never go directly to sellers. Platform holds until delivery is verified.",
    badge: "4 Safety Stages",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    icon: RefreshCw,
    title: "100% Refund Guarantee",
    description: "Invalid ticket? Seller cancels? You get an instant refund to your bKash, Nagad, or bank card. Zero hassle.",
    badge: "Zero-Risk Policy",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    icon: ShieldCheck,
    title: "HMAC-Signed Payments",
    description: "Every payment callback is cryptographically verified via HMAC-SHA256 signatures. No man-in-the-middle attacks.",
    badge: "Enterprise Security",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    icon: Zap,
    title: "60-Second Listing",
    description: "Upload your ticket, set your price, choose a category — live on the marketplace in under a minute.",
    badge: "Fast & Simple",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    icon: TrendingUp,
    title: "Live Market Price Guide",
    description: "See real-time demand and suggested prices for every route and event before you list.",
    badge: "Real-time Data",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
];

const REVIEWS = [
  {
    name: "Farhan Ahmed",
    role: "Frequent Traveler",
    rating: 5,
    text: "Bought a Dhaka-Ctg train ticket 2 hours before departure. Escrow gave me full confidence. The seller released the ticket code immediately after payment. Absolutely trustworthy!",
    avatar: "F",
    color: "bg-blue-500",
  },
  {
    name: "Sadia Islam",
    role: "Concert Goer",
    rating: 5,
    text: "Sold my extra Dhaka Concert ticket when I couldn't attend. Got paid within minutes after the buyer confirmed. TicketLagbe is the safest marketplace I've ever used.",
    avatar: "S",
    color: "bg-purple-500",
  },
  {
    name: "Rakib Hassan",
    role: "Business Traveler",
    rating: 5,
    text: "The AI verification badge gave me complete peace of mind. I verified my ticket screenshot was authentic within 30 seconds. No scam, no fake — pure trust.",
    avatar: "R",
    color: "bg-teal-500",
  },
  {
    name: "Nusrat Jahan",
    role: "Travel Blogger",
    rating: 5,
    text: "Barisal launch ticket during Eid was impossible to find. Found one here at a fair price, paid via Nagad, escrow protected everything. 10/10 would use again!",
    avatar: "N",
    color: "bg-rose-500",
  },
];

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ stat, index, inView }: { stat: typeof STATS[0]; index: number; inView: boolean }) {
  const count = useCountUp(stat.value, 2000, inView);
  const Icon = stat.icon;
  return (
    <div
      className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center text-white animate-fade-in"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-teal-300" />
      </div>
      <div className="text-3xl font-black tabular-nums">
        {stat.suffix === "৳" ? `${stat.suffix}${count.toLocaleString()}` : `${count.toLocaleString()}${stat.suffix}`}
      </div>
      <div className="text-xs text-slate-300 font-medium mt-1">{stat.label}</div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("ALL");
  const [activeReview, setActiveReview] = useState(0);
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Auto-rotate reviews
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % REVIEWS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Intersection observer for stats counter
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsInView(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
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
      <section className="relative bg-brand-gradient text-white overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20">
        {/* Star field ambient */}
        <div className="star-field" />

        {/* Glowing orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-float delay-700" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-teal-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          {/* Trust badge pill */}
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs font-bold text-teal-300 mb-6 sm:mb-8 animate-fade-in shadow-sm">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>AI-Verified Escrow Marketplace • Bangladesh</span>
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.18] mb-6 sm:mb-8 animate-slide-up">
            Buy & Sell Spare Tickets
            <br className="hidden sm:inline" />
            {" "}<span className="text-gradient-teal">Zero Scam. Zero Risk.</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 sm:mb-12 animate-fade-in delay-300 font-normal">
            Bangladesh's first AI-powered peer-to-peer ticket marketplace with
            neutral escrow, duplicate detection, and instant refund protection.
          </p>

          {/* Main Search Box */}
          <div className="animate-scale-in delay-400 mb-6 sm:mb-8">
            <form
              onSubmit={handleSearch}
              className="max-w-4xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-2xl shadow-black/40 p-3 sm:p-4 md:p-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_190px_auto] gap-3 text-slate-800"
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
                    <option value="MOVIE">Cinema</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-teal-gradient hover:opacity-95 text-white font-bold rounded-xl px-7 py-3.5 text-sm transition-all shadow-lg shadow-teal-900/30 cursor-pointer active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Popular Route Quick Chips */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap animate-fade-in delay-500 pb-4">
            <span className="text-xs text-slate-400 font-medium">Popular Routes:</span>
            {POPULAR_ROUTES.map((route, i) => (
              <button
                key={i}
                onClick={() => {
                  setFrom(route.from);
                  setTo(route.to);
                  setCategory(route.cat);
                  router.push(`/tickets?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&category=${route.cat}`);
                }}
                className="inline-flex items-center gap-1.5 glass px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-200 hover:bg-white/20 hover:text-white transition cursor-pointer shadow-sm"
              >
                {route.label}
                <span className="text-teal-400 font-bold ml-0.5">৳{route.price}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          STATS COUNTER SECTION
          ============================================================ */}
      <section className="bg-[#15173B] py-14 sm:py-16 border-t border-white/10" ref={statsRef}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} inView={statsInView} />
          ))}
        </div>
      </section>

      {/* Smooth Wave Divider between Dark Stats and Light Content */}
      <div className="w-full overflow-hidden leading-none bg-[#15173B] block">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-8 sm:h-12 md:h-14 block">
          <path d="M0 60L48 50C96 40 192 20 288 15C384 10 480 20 576 30C672 40 768 50 864 48C960 46 1056 32 1152 24C1248 16 1344 14 1392 13L1440 12V60H0Z" fill="#F8FAFC"/>
        </svg>
      </div>

      {/* ============================================================
          CATEGORY GRID
          ============================================================ */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16 reveal">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-2">Browse by Category</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
            Every Ticket Type. One Verified Platform.
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Choose your preferred travel mode or event to find verified, escrow-backed tickets.
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
                <div className={`w-14 h-14 rounded-xl ${cat.bg} ${cat.text} group-hover:bg-gradient-to-br group-hover:${cat.color} group-hover:text-white flex items-center justify-center mb-3.5 transition-all duration-300 shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm text-slate-800 leading-snug">{cat.label}</div>
                <div className={`text-xs font-semibold ${cat.text} mt-1.5`}>{cat.count}</div>
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
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-2">Zero-Scam Process</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              How TicketLagbe Protects You
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-4 max-w-lg mx-auto leading-relaxed">
              Three simple steps. Every transaction is AI-verified and escrow-protected.
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
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block mb-2">Enterprise-Grade Security</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight">
            Built Different. Built Safer.
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Every feature exists to prevent fraud, protect payments, and guarantee fair outcomes.
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
          LIVE REVIEWS CAROUSEL
          ============================================================ */}
      <section className="bg-[#1A1C43] py-20 sm:py-28 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-2">Real User Experiences</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
              Trusted by Thousands of Bangladeshis
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
              <span className="text-xs sm:text-sm text-slate-300 ml-2 font-medium">4.9 / 5 from 2,400+ reviews</span>
            </div>
          </div>

          {/* Review Carousel */}
          <div className="relative">
            <div className="glass rounded-3xl p-8 sm:p-12 min-h-[220px] transition-all duration-500 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                <div className={`w-14 h-14 ${REVIEWS[activeReview].color} rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-md`}>
                  {REVIEWS[activeReview].avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(REVIEWS[activeReview].rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-100 text-base sm:text-lg leading-relaxed mb-5 italic font-normal">
                    &ldquo;{REVIEWS[activeReview].text}&rdquo;
                  </p>
                  <div>
                    <div className="text-white font-extrabold text-base">{REVIEWS[activeReview].name}</div>
                    <div className="text-teal-300 text-xs sm:text-sm font-medium mt-0.5">{REVIEWS[activeReview].role}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel dots */}
            <div className="flex items-center justify-center gap-2.5 mt-8">
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveReview(i)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    i === activeReview
                      ? "w-8 h-2.5 bg-teal-400 shadow-sm"
                      : "w-2.5 h-2.5 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SELL CTA BANNER
          ============================================================ */}
      <section className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
        <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 rounded-3xl p-8 sm:p-12 md:p-16 overflow-hidden shadow-2xl shadow-teal-900/25">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full translate-y-1/3 -translate-x-1/3 blur-xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="text-white text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-xs font-bold mb-5 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                List in under 60 seconds
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-4">
                Have a ticket you can't use?
              </h2>
              <p className="text-white/90 text-sm sm:text-base max-w-lg leading-relaxed">
                Turn your unused train, bus, concert, or flight ticket into instant cash.
                AI-verified listing. Neutral escrow payment. Zero risk for buyers.
              </p>
              <div className="flex items-center gap-4 sm:gap-6 mt-6 flex-wrap justify-center md:justify-start">
                {["Free to List", "AI Verified", "Instant Payout"].map((item, i) => (
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
          SAFETY GUARANTEE STRIP
          ============================================================ */}
      <section className="bg-slate-950 py-10 sm:py-12 px-4 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {[
            { icon: BadgeCheck, label: "AI-Verified Tickets",   color: "text-teal-400" },
            { icon: Lock,       label: "Escrow Protected",       color: "text-blue-400" },
            { icon: RefreshCw,  label: "Instant Refunds",        color: "text-emerald-400" },
            { icon: ShieldCheck,label: "HMAC-Signed Payments",   color: "text-purple-400" },
            { icon: Clock,      label: "24/7 Escrow Support",    color: "text-amber-400" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className={`flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-300 ${item.color}`}>
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