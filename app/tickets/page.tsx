"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ticket,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  ShieldCheck,
  Heart,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  RefreshCw,
  Bus,
  Train,
  Plane,
  Film,
  Music,
  Ship,
  Armchair,
  Tag,
} from "lucide-react";

interface TicketData {
  id: string;
  title: string;
  description: string | null;
  from: string | null;
  to: string | null;
  travelDate: string | null;
  travelTime: string | null;
  seatNumber: string | null;
  ticketType: string | null;
  price: number | null;
  quantity: number;
  ticketStatus: string;
  category?: {
    categoryName: string;
  } | null;
  seller?: {
    id: string;
    fullName: string | null;
  } | null;
  verifications?: Array<{
    verificationStatus: string;
    aiConfidenceScore: number | null;
  }>;
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const CATEGORIES = [
  { id: "ALL", label: "All Categories", icon: Ticket },
  { id: "TRAIN", label: "Train", icon: Train },
  { id: "BUS", label: "Bus", icon: Bus },
  { id: "FLIGHT", label: "Air Flight", icon: Plane },
  { id: "LAUNCH", label: "Launch / Ship", icon: Ship },
  { id: "CONCERT", label: "Concert", icon: Music },
  { id: "MOVIE", label: "Movie", icon: Film },
];

function formatCategory(category: unknown, fallback = "TRAVEL"): string {
  if (!category) return fallback;
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null) {
    const cat = category as { categoryName?: string; ticketType?: string };
    return cat.categoryName || cat.ticketType || fallback;
  }
  return fallback;
}

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Read filter values from URL
  const currentCategory = searchParams.get("category") || "ALL";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Local state for inputs
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [fromInput, setFromInput] = useState(currentFrom);
  const [toInput, setToInput] = useState(currentTo);

  // Data states
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 12,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);

  // Sync inputs if URL params change externally
  useEffect(() => {
    setSearchInput(currentSearch);
    setFromInput(currentFrom);
    setToInput(currentTo);
  }, [currentSearch, currentFrom, currentTo]);

  // Load tickets based on current URL query params
  useEffect(() => {
    let isMounted = true;

    async function fetchTickets() {
      setLoading(true);
      setError("");

      try {
        const query = new URLSearchParams();
        if (currentCategory && currentCategory !== "ALL") query.set("category", currentCategory);
        if (currentFrom) query.set("from", currentFrom);
        if (currentTo) query.set("to", currentTo);
        if (currentSearch) query.set("search", currentSearch);
        if (currentSort) query.set("sort", currentSort);
        query.set("page", currentPage.toString());
        query.set("limit", "12");

        const res = await fetch(`/api/tickets?${query.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load marketplace tickets.");
        }

        if (isMounted) {
          setTickets(data.tickets || []);
          if (data.pagination) setPagination(data.pagination);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Something went wrong loading tickets.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTickets();

    // Fetch user favorites to show filled heart icons
    fetch("/api/favorites")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.favorites && isMounted) {
          const ids = new Set<string>(
            data.favorites.map((fav: { ticketId: string }) => fav.ticketId)
          );
          setFavoriteIds(ids);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentCategory, currentFrom, currentTo, currentSearch, currentSort, currentPage]);

  // Helper to push updated URL query params
  function updateFilters(updates: Record<string, string | number | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "" || val === "ALL") {
        params.delete(key);
      } else {
        params.set(key, val.toString());
      }
    });

    // Reset to page 1 whenever filters change (unless updating page itself)
    if (!updates.page) {
      params.delete("page");
    }

    startTransition(() => {
      router.push(`/tickets?${params.toString()}`);
    });
  }

  // Handle Search Submission
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({
      search: searchInput.trim() || null,
      from: fromInput.trim() || null,
      to: toInput.trim() || null,
    });
  }

  // Toggle favorite
  async function handleToggleFavorite(ticketId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    try {
      setTogglingFavorite(ticketId);
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      const data = await res.json();
      if (res.ok) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (data.isFavorited) next.add(ticketId);
          else next.delete(ticketId);
          return next;
        });
      } else if (res.status === 401) {
        router.push("/login?redirect=/tickets");
      }
    } catch (err) {
      console.error("Favorite toggle failed", err);
    } finally {
      setTogglingFavorite(null);
    }
  }

  // Helper to format date
  function formatTravelDate(dateString: string | null) {
    if (!dateString) return "Date not specified";
    try {
      return new Date(dateString).toLocaleDateString("en-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16">
      {/* Search Header Banner */}
      <section className="bg-[#1A1C43] text-white pt-10 pb-16 px-4 md:px-8 border-b border-slate-700/60 shadow-inner">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5EEAD4]/10 text-[#5EEAD4] text-xs font-semibold border border-[#5EEAD4]/20 mb-2">
                <Sparkles size={14} />
                <span>Verified Secondary Ticket Exchange</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Browse Available Tickets
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Authentic P2P tickets with AI verification and 100% Escrow buyer protection.
              </p>
            </div>

            <div className="text-right hidden md:block">
              <span className="text-xs text-slate-400 block">Total Active Listings</span>
              <span className="text-2xl font-black text-[#5EEAD4]">
                {pagination.totalCount} Tickets
              </span>
            </div>
          </div>

          {/* Search Box Card */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white text-slate-800 p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3"
          >
            {/* From Input */}
            <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus-within:bg-white focus-within:border-[#0D9488] transition">
              <MapPin size={18} className="text-[#0D9488] shrink-0" />
              <div className="w-full text-left">
                <label className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                  From
                </label>
                <input
                  type="text"
                  placeholder="Dhaka, Sylhet..."
                  value={fromInput}
                  onChange={(e) => setFromInput(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* To Input */}
            <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus-within:bg-white focus-within:border-[#0D9488] transition">
              <MapPin size={18} className="text-[#0D9488] shrink-0" />
              <div className="w-full text-left">
                <label className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                  To
                </label>
                <input
                  type="text"
                  placeholder="Chittagong, Cox's Bazar..."
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Keyword Search */}
            <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus-within:bg-white focus-within:border-[#0D9488] transition">
              <Search size={18} className="text-[#0D9488] shrink-0" />
              <div className="w-full text-left">
                <label className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                  Keywords / Operator
                </label>
                <input
                  type="text"
                  placeholder="Subarna, Green Line, Concert..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold rounded-xl px-5 py-3 transition shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Search size={16} />
              <span>Filter Tickets</span>
            </button>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-6 space-y-6">
        {/* Category Filter Pills & Sort Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => updateFilters({ category: cat.id })}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
                    isActive
                      ? "bg-[#0D9488] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Sort By:</span>
            <div className="relative">
              <select
                value={currentSort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="appearance-none pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#0D9488] cursor-pointer"
              >
                <option value="newest">Recently Listed</option>
                <option value="cheapest">Price: Lowest First</option>
                <option value="expensive">Price: Highest First</option>
                <option value="travel_date">Travel Date: Soonest</option>
              </select>
              <ArrowUpDown
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Applied Filters Display */}
        {(currentFrom || currentTo || currentSearch || currentCategory !== "ALL") && (
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Active filters:</span>
            {currentCategory !== "ALL" && (
              <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                Category: {currentCategory}
              </span>
            )}
            {currentFrom && (
              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full">
                From: {currentFrom}
              </span>
            )}
            {currentTo && (
              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full">
                To: {currentTo}
              </span>
            )}
            {currentSearch && (
              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full">
                Search: &quot;{currentSearch}&quot;
              </span>
            )}
            <button
              onClick={() => {
                setSearchInput("");
                setFromInput("");
                setToInput("");
                router.push("/tickets");
              }}
              className="text-[#0D9488] font-bold hover:underline ml-2 cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Loader2 size={36} className="animate-spin text-[#0D9488]" />
            <p className="text-sm font-semibold text-slate-500">
              Fetching verified marketplace tickets...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center bg-white rounded-3xl border border-red-100 shadow-sm space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center">
              <RefreshCw size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Failed to Load Tickets</h3>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              onClick={() => updateFilters({})}
              className="px-5 py-2.5 bg-[#0D9488] text-white text-xs font-bold rounded-xl hover:bg-[#0F766E] transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && tickets.length === 0 && (
          <div className="py-20 px-4 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-teal-50 text-[#0D9488] mx-auto flex items-center justify-center">
              <Ticket size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Tickets Found</h3>
            <p className="text-sm text-slate-500">
              We couldn&apos;t find any tickets matching your search criteria. Try removing some filters or searching for another route.
            </p>
            <button
              onClick={() => {
                setSearchInput("");
                setFromInput("");
                setToInput("");
                router.push("/tickets");
              }}
              className="px-6 py-3 bg-[#0D9488] text-white text-xs font-bold rounded-xl hover:bg-[#0F766E] transition cursor-pointer"
            >
              View All Available Tickets
            </button>
          </div>
        )}

        {/* Ticket Grid */}
        {!loading && !error && tickets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((t) => {
              const isFav = favoriteIds.has(t.id);
              const isPendingFav = togglingFavorite === t.id;
              const isVerified = t.verifications?.[0]?.verificationStatus === "VERIFIED";

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-[#0D9488]/40"
                >
                  {/* Card Header */}
                  <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200/60">
                          {formatCategory(t.category, t.ticketType || "TRAVEL")}
                        </span>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <ShieldCheck size={12} />
                            <span>AI Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <span>Review Pending</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-[#0D9488] transition line-clamp-1">
                        {t.title}
                      </h3>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(t.id, e)}
                      disabled={isPendingFav}
                      className={`p-2 rounded-full border transition cursor-pointer ${
                        isFav
                          ? "bg-rose-50 border-rose-200 text-rose-500"
                          : "bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                      }`}
                      title={isFav ? "Remove from wishlist" : "Save to wishlist"}
                    >
                      <Heart
                        size={16}
                        className={isFav ? "fill-rose-500 text-rose-500" : ""}
                      />
                    </button>
                  </div>

                  {/* Card Body / Route & Info */}
                  <div className="p-5 space-y-4 text-xs text-slate-600">
                    {/* Origin / Destination Box */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-800 text-sm">
                        <span>{t.from || "Anywhere"}</span>
                        <ArrowRight size={14} className="text-[#0D9488]" />
                        <span>{t.to || "Destination"}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-500" />
                          <span>{formatTravelDate(t.travelDate)}</span>
                        </span>
                        {t.travelTime && (
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Clock size={12} className="text-slate-400" />
                            <span>{t.travelTime}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Seat & Class Details */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-50/80 p-2 rounded-xl flex items-center gap-2">
                        <Armchair size={14} className="text-slate-400" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">Seat/Seat Class</span>
                          <span className="font-semibold text-slate-800">
                            {t.seatNumber || "General"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50/80 p-2 rounded-xl flex items-center gap-2">
                        <Tag size={14} className="text-slate-400" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">Stock Left</span>
                          <span className="font-semibold text-slate-800">
                            {t.quantity} ticket{t.quantity > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Seller details */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">
                        Seller:{" "}
                        <strong className="text-slate-700">
                          {t.seller?.fullName || "Verified Seller"}
                        </strong>
                      </span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        Escrow Protected
                      </span>
                    </div>
                  </div>

                  {/* Card Footer / Price & Action */}
                  <div className="p-5 pt-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Price
                      </span>
                      <span className="text-xl font-extrabold text-[#0D9488]">
                        ৳{t.price?.toLocaleString() || "0"}
                      </span>
                    </div>

                    <Link
                      href={`/tickets/${t.id}`}
                      className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="pt-6 pb-12 flex items-center justify-between border-t border-slate-200">
            <span className="text-xs text-slate-500 font-medium">
              Showing Page <strong className="text-slate-800">{pagination.currentPage}</strong> of{" "}
              <strong className="text-slate-800">{pagination.totalPages}</strong> ({pagination.totalCount} tickets total)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => updateFilters({ page: pagination.currentPage - 1 })}
                className="px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition shadow-sm cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              <button
                disabled={!pagination.hasNextPage}
                onClick={() => updateFilters({ page: pagination.currentPage + 1 })}
                className="px-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition shadow-sm cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-[#0D9488]" />
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
