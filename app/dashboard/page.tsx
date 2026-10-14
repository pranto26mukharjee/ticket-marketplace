
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Tag,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  LogOut,
  Loader2,
  Ticket,
  TrendingUp,
  CircleDollarSign,
  PackageCheck,
  RefreshCw,
  MapPin,
  CalendarDays,
  AlertCircle,
  Clock3,
  CreditCard,
  Eye,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import SellerEarningsChart from "@/components/SellerEarningsChart";

type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
};

type Listing = {
  id: string;
  title: string;
  category?: string | { id?: string; categoryName?: string; ticketType?: string | null } | null;
  description: string | null;
  from: string;
  to: string;
  travelDate: string;
  travelTime: string | null;
  seatNumber: string | null;
  ticketType: string | null;
  price: number;
  quantity: number;
  status: "AVAILABLE" | "SOLD" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
};

type Stats = {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  cancelledListings: number;
  totalSales: number;
  totalListingValue: number;
};

type Purchase = {
  id: string;
  quantity: number;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  paymentMethod: string | null;
  createdAt: string;

  ticket: {
    id: string;
    title: string;
    category?: string | { id?: string; categoryName?: string; ticketType?: string | null } | null;
    from: string;
    to: string;
    travelDate: string;
    travelTime: string | null;
    seatNumber: string | null;
    ticketType: string | null;
    price: number;
    status: "AVAILABLE" | "SOLD" | "CANCELLED";
  };
};

type PurchaseSummary = {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
};

function formatCategory(category: unknown): string {
  if (!category) return "GENERAL";
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null) {
    const cat = category as { categoryName?: string; ticketType?: string };
    return cat.categoryName || cat.ticketType || "GENERAL";
  }
  return "GENERAL";
}

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "overview" | "purchases" | "listings" | "analytics"
  >("overview");

  const [user, setUser] = useState<User | null>(null);

  const [stats, setStats] = useState<Stats>({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    cancelledListings: 0,
    totalSales: 0,
    totalListingValue: 0,
  });

  const [listings, setListings] = useState<Listing[]>([]);

  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [purchaseSummary, setPurchaseSummary] =
    useState<PurchaseSummary>({
      totalOrders: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0,
    });

  const [loading, setLoading] = useState(true);
  const [purchasesLoading, setPurchasesLoading] =
    useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [error, setError] = useState("");
  const [purchaseError, setPurchaseError] = useState("");

  // ==================================================
  // LOAD SELLER DASHBOARD
  // ==================================================

  const loadDashboard = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login?redirect=/dashboard");
          return;
        }

        setError(
          data.message || "Failed to load dashboard."
        );

        return;
      }

      setUser(data.user);
      setStats(data.stats);
      setListings(data.listings || []);
    } catch (error) {
      console.error("Dashboard loading error:", error);

      setError(
        "Something went wrong while loading dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // ==================================================
  // LOAD BUYER PURCHASES
  // ==================================================

  const loadPurchases = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setPurchasesLoading(true);
      }

      setPurchaseError("");

      const response = await fetch("/api/orders", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login?redirect=/dashboard");
          return;
        }

        setPurchaseError(
          data.message || "Failed to load purchases."
        );

        return;
      }

      setPurchases(data.orders || []);

      setPurchaseSummary(
        data.summary || {
          totalOrders: 0,
          pendingOrders: 0,
          confirmedOrders: 0,
          cancelledOrders: 0,
          totalSpent: 0,
        }
      );
    } catch (error) {
      console.error("Purchases loading error:", error);

      setPurchaseError(
        "Something went wrong while loading your purchases."
      );
    } finally {
      setPurchasesLoading(false);
    }
  }, [router]);

  // ==================================================
  // INITIAL LOAD & STRICT AUTH GUARD
  // ==================================================

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function verifyAndLoad() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login?redirect=/dashboard");
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.message || "Could not verify your session. Please try again.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!data.success || !data.user) {
          router.replace("/login?redirect=/dashboard");
          return;
        }
        loadDashboard();
        loadPurchases();

        // Silent background polling every 20 seconds for real-time status updates
        intervalId = setInterval(() => {
          loadDashboard(false);
          loadPurchases(false);
        }, 20000);
      } catch (error) {
        console.error("Dashboard authentication check failed:", error);
        setError("Could not verify your session. Check your internet connection and try again.");
        setLoading(false);
      }
    }

    verifyAndLoad();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadDashboard, loadPurchases, router]);

  // ==================================================
  // LOGOUT
  // ==================================================

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);

      setLoggingOut(false);
    }
  }

  // ==================================================
  // REFRESH EVERYTHING
  // ==================================================

  async function handleRefresh() {
    setRefreshing(true);

    await Promise.all([
      loadDashboard(false),
      loadPurchases(false),
    ]);

    setRefreshing(false);
  }

  // ==================================================
  // DATE FORMAT
  // ==================================================

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(date: string) {
    return new Date(date).toLocaleString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin text-[#0D9488]"
          />

          <p className="text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <p className="text-sm text-red-700">
            {error || "Your dashboard could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-[#0D9488] text-white font-semibold text-sm"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-5">

          <div>
            <p className="text-sm text-[#0D9488] font-semibold mb-1">
              Welcome back 👋
            </p>

            <h1 className="text-3xl font-extrabold text-slate-900">
              {user.fullName}
            </h1>

            <p className="text-slate-500 text-sm mt-1">
              {user.email}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">

            {/* Account */}

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">

              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>

              <div>
                <span className="text-xs text-slate-400 block">
                  Account Type
                </span>

                <span className="text-sm font-bold text-slate-800">
                  {user.role}
                </span>
              </div>

            </div>

            {/* Refresh */}

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing ? "animate-spin" : ""
                }
              />

              Refresh
            </button>

            {/* Logout */}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-600 px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              {loggingOut ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <LogOut size={17} />
              )}

              Logout
            </button>

          </div>
        </div>

        {/* ================================================== */}
        {/* GENERAL ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm">
            <AlertCircle size={18} />

            <span>{error}</span>
          </div>
        )}

        {/* ================================================== */}
        {/* STATS */}
        {/* ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* Total Listings */}

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Total Listings
                </p>

                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {stats.totalListings}
                </p>
              </div>

              <div className="w-11 h-11 bg-teal-50 text-[#0D9488] rounded-xl flex items-center justify-center">
                <Tag size={21} />
              </div>

            </div>

            <p className="text-xs text-slate-400 mt-3">
              All tickets you have listed
            </p>

          </div>

          {/* Active */}

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Active Listings
                </p>

                <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {stats.activeListings}
                </p>
              </div>

              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <PackageCheck size={21} />
              </div>

            </div>

            <p className="text-xs text-slate-400 mt-3">
              Currently available for buyers
            </p>

          </div>

          {/* Sold */}

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Sold Tickets
                </p>

                <p className="text-2xl font-extrabold text-blue-600 mt-1">
                  {stats.soldListings}
                </p>
              </div>

              <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={21} />
              </div>

            </div>

            <p className="text-xs text-slate-400 mt-3">
              Successfully sold tickets
            </p>

          </div>

          {/* Sales */}

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Total Sales
                </p>

                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  ৳ {stats.totalSales.toLocaleString()}
                </p>
              </div>

              <div className="w-11 h-11 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
                <CircleDollarSign size={21} />
              </div>

            </div>

            <p className="text-xs text-slate-400 mt-3">
              From completed sales
            </p>

          </div>

        </div>

        {/* ================================================== */}
        {/* BUYER PURCHASE SUMMARY */}
        {/* ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  My Orders
                </p>

                <p className="text-xl font-extrabold text-slate-900">
                  {purchaseSummary.totalOrders}
                </p>
              </div>

            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock3 size={20} />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Pending Orders
                </p>

                <p className="text-xl font-extrabold text-slate-900">
                  {purchaseSummary.pendingOrders}
                </p>
              </div>

            </div>

          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <CircleDollarSign size={20} />
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Total Spent
                </p>

                <p className="text-xl font-extrabold text-slate-900">
                  ৳{" "}
                  {purchaseSummary.totalSpent.toLocaleString()}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* ================================================== */}
        {/* QUICK SUMMARY */}
        {/* ================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">

            <div className="flex items-center justify-between mb-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Seller Overview
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  Current status of your ticket listings
                </p>
              </div>

              <TrendingUp
                size={22}
                className="text-[#0D9488]"
              />

            </div>

            <div className="grid grid-cols-3 gap-4">

              <div className="bg-emerald-50 rounded-2xl p-4">
                <p className="text-xs text-emerald-600 font-medium">
                  Available
                </p>

                <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                  {stats.activeListings}
                </p>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4">
                <p className="text-xs text-blue-600 font-medium">
                  Sold
                </p>

                <p className="text-2xl font-extrabold text-blue-700 mt-1">
                  {stats.soldListings}
                </p>
              </div>

              <div className="bg-red-50 rounded-2xl p-4">
                <p className="text-xs text-red-600 font-medium">
                  Cancelled
                </p>

                <p className="text-2xl font-extrabold text-red-700 mt-1">
                  {stats.cancelledListings}
                </p>
              </div>

            </div>

          </div>

          {/* Listing Value */}

          <div className="bg-[#0D9488] text-white p-6 rounded-2xl shadow-sm">

            <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center mb-5">
              <Ticket size={22} />
            </div>

            <p className="text-sm text-white/70">
              Active Ticket Value
            </p>

            <p className="text-3xl font-extrabold mt-1">
              ৳ {stats.totalListingValue.toLocaleString()}
            </p>

            <p className="text-xs text-white/60 mt-3">
              Total value of your currently available listings.
            </p>

          </div>

        </div>

        {/* ================================================== */}
        {/* TABS */}
        {/* ================================================== */}

        <div className="flex overflow-x-auto border-b border-slate-200 mb-6 space-x-8">

          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 whitespace-nowrap font-semibold text-sm flex items-center gap-2 transition border-b-2 cursor-pointer ${activeTab === "overview"
              ? "border-[#0D9488] text-[#0D9488]"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            <TrendingUp size={18} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("purchases")}
            className={`pb-3 whitespace-nowrap font-semibold text-sm flex items-center gap-2 transition border-b-2 cursor-pointer ${activeTab === "purchases"
              ? "border-[#0D9488] text-[#0D9488]"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            <ShoppingBag size={18} />
            <span>My Purchases</span>

            {purchaseSummary.totalOrders > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#0D9488] text-white text-[10px] flex items-center justify-center">
                {purchaseSummary.totalOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("listings")}
            className={`pb-3 whitespace-nowrap font-semibold text-sm flex items-center gap-2 transition border-b-2 cursor-pointer ${activeTab === "listings"
              ? "border-[#0D9488] text-[#0D9488]"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            <Tag size={18} />
            <span>My Ticket Listings</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-3 whitespace-nowrap font-semibold text-sm flex items-center gap-2 transition border-b-2 cursor-pointer ${activeTab === "analytics"
              ? "border-[#0D9488] text-[#0D9488]"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            <BarChart3 size={18} />
            <span>Earnings Analytics</span>
          </button>

        </div>

        {/* ================================================== */}
        {/* OVERVIEW */}
        {/* ================================================== */}

        {activeTab === "overview" && (
          <div className="space-y-6">

            {/* Seller Earnings Analytics Chart */}
            <SellerEarningsChart />

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recent Listings
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Your latest published tickets
                </p>
              </div>

              <button
                onClick={() => setActiveTab("listings")}
                className="text-sm font-semibold text-[#0D9488] hover:underline cursor-pointer"
              >
                View all
              </button>

            </div>

            {listings.length === 0 ? (
              <EmptyListings />
            ) : (
              <div className="space-y-4">
                {listings.slice(0, 3).map((ticket) => (
                  <ListingCard
                    key={ticket.id}
                    ticket={ticket}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* ================================================== */}
        {/* REAL PURCHASES */}
        {/* ================================================== */}

        {activeTab === "purchases" && (
          <div className="space-y-5">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  My Purchases
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Tickets you have ordered through TicketLagbe
                </p>
              </div>

              <button
                onClick={() => loadPurchases(false)}
                disabled={purchasesLoading}
                className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    purchasesLoading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh Purchases
              </button>

            </div>

            {/* Purchase error */}

            {purchaseError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm">
                <AlertCircle size={18} />
                <span>{purchaseError}</span>
              </div>
            )}

            {/* Loading */}

            {purchasesLoading ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">

                <Loader2
                  size={30}
                  className="mx-auto animate-spin text-[#0D9488]"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading your purchases...
                </p>

              </div>
            ) : purchases.length === 0 ? (

              /* Empty */

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">

                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag
                    size={25}
                    className="text-slate-400"
                  />
                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  No Purchases Yet
                </h2>

                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  You have not purchased any tickets yet.
                  Browse available tickets and place your first
                  order.
                </p>

                <Link
                  href="/tickets"
                  className="inline-flex mt-5 bg-[#0D9488] hover:bg-[#0F766E] text-white px-5 py-3 rounded-xl text-sm font-semibold transition"
                >
                  Browse Tickets
                </Link>

              </div>
            ) : (

              /* Purchase list */

              <div className="space-y-4">

                {purchases.map((purchase) => (
                  <PurchaseCard
                    key={purchase.id}
                    purchase={purchase}
                    formatDate={formatDate}
                    formatDateTime={formatDateTime}
                  />
                ))}

              </div>
            )}

          </div>
        )}

        {/* ================================================== */}
        {/* LISTINGS */}
        {/* ================================================== */}

        {activeTab === "listings" && (
          <div className="space-y-4">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  My Ticket Listings
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  All tickets you have published
                </p>
              </div>

              <Link
                href="/create-listing"
                className="bg-[#0D9488] hover:bg-[#0F766E] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                + List Ticket
              </Link>

            </div>

            {listings.length === 0 ? (
              <EmptyListings />
            ) : (
              <div className="space-y-4">
                {listings.map((ticket) => (
                  <ListingCard
                    key={ticket.id}
                    ticket={ticket}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* ================================================== */}
        {/* ANALYTICS */}
        {/* ================================================== */}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Seller Revenue & Performance
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Visual analytics and month-over-month escrow revenue breakdown
              </p>
            </div>

            <SellerEarningsChart />
          </div>
        )}

      </main>
    </div>
  );
}

/* ====================================================== */
/* PURCHASE CARD */
/* ====================================================== */

function PurchaseCard({
  purchase,
  formatDate,
  formatDateTime,
}: {
  purchase: Purchase;
  formatDate: (date: string) => string;
  formatDateTime: (date: string) => string;
}) {
  function getOrderStatusStyle(
    status: Purchase["status"]
  ) {
    if (status === "CONFIRMED") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "CANCELLED") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  function getOrderStatusLabel(
    status: Purchase["status"]
  ) {
    if (status === "CONFIRMED") {
      return "Confirmed";
    }

    if (status === "CANCELLED") {
      return "Cancelled";
    }

    return "Pending";
  }

  function getPaymentLabel(
    paymentMethod: string | null
  ) {
    if (paymentMethod === "CARD") {
      return "Card";
    }

    if (paymentMethod === "MOBILE_BANKING") {
      return "Mobile Banking";
    }

    return "Not specified";
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* Top */}

      <div className="p-6">

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">

          <div className="flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getOrderStatusStyle(
                  purchase.status
                )}`}
              >
                {getOrderStatusLabel(
                  purchase.status
                )}
              </span>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {formatCategory(purchase.ticket.category)}
              </span>

            </div>

            <h3 className="mt-3 text-lg font-bold text-slate-900">
              {purchase.ticket.title}
            </h3>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">

              <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                {purchase.ticket.from} →{" "}
                {purchase.ticket.to}
              </span>

              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                {formatDate(
                  purchase.ticket.travelDate
                )}
              </span>

              {purchase.ticket.travelTime && (
                <span className="flex items-center gap-1.5">
                  <Clock3 size={14} />
                  {purchase.ticket.travelTime}
                </span>
              )}

            </div>

          </div>

          <div className="lg:text-right">

            <p className="text-xs text-slate-400">
              Total Amount
            </p>

            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              ৳ {purchase.totalAmount.toLocaleString()}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              {purchase.quantity} ticket
              {purchase.quantity > 1 ? "s" : ""}
            </p>

          </div>

        </div>

        {/* Details */}

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] text-slate-400">
              Order ID
            </p>

            <p
              className="mt-1 text-xs font-semibold text-slate-700 truncate"
              title={purchase.id}
            >
              {purchase.id}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] text-slate-400">
              Ticket Price
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              ৳ {purchase.ticket.price.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] text-slate-400">
              Payment
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <CreditCard size={13} />
              {getPaymentLabel(
                purchase.paymentMethod
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] text-slate-400">
              Ordered
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-700">
              {formatDateTime(purchase.createdAt)}
            </p>
          </div>

        </div>

        {/* Bottom */}

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-5">

          <div className="text-xs text-slate-400">
            Seat:{" "}
            <span className="font-semibold text-slate-600">
              {purchase.ticket.seatNumber ||
                "Not specified"}
            </span>
          </div>

          <Link
            href={`/order-success?orderId=${purchase.id}`}
            className="inline-flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-[#0F766E] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition"
          >
            <Eye size={15} />
            View Order
            <ArrowUpRight size={14} />
          </Link>

        </div>

      </div>

    </div>
  );
}

/* ====================================================== */
/* LISTING CARD */
/* ====================================================== */

function ListingCard({
  ticket,
}: {
  ticket: Listing;
}) {
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusStyle(status: Listing["status"]) {
    if (status === "AVAILABLE") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "SOLD") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }

    return "bg-red-50 text-red-700 border-red-200";
  }

  function getStatusLabel(status: Listing["status"]) {
    if (status === "AVAILABLE") {
      return "Active Listing";
    }

    if (status === "SOLD") {
      return "Sold";
    }

    return "Cancelled";
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

        {/* Left */}

        <div className="space-y-3 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusStyle(
                ticket.status
              )}`}
            >
              {getStatusLabel(ticket.status)}
            </span>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {formatCategory(ticket.category)}
            </span>

          </div>

          <h3 className="text-lg font-bold text-slate-900">
            {ticket.title}
          </h3>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">

            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {ticket.from} → {ticket.to}
            </span>

            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} />
              {formatDate(ticket.travelDate)}
            </span>

            {ticket.seatNumber && (
              <span>
                Seat:{" "}
                <strong className="text-slate-700">
                  {ticket.seatNumber}
                </strong>
              </span>
            )}

          </div>

          <p className="text-xs text-slate-400">
            Listed on {formatDate(ticket.createdAt)}
          </p>

        </div>

        {/* Right */}

        <div className="flex items-center justify-between lg:justify-end gap-5">

          <div className="text-left lg:text-right">

            <p className="text-xs text-slate-400">
              Asking Price
            </p>

            <p className="text-xl font-extrabold text-slate-900">
              ৳ {ticket.price.toLocaleString()}
            </p>

            {ticket.quantity > 1 && (
              <p className="text-xs text-slate-400">
                Quantity: {ticket.quantity}
              </p>
            )}

          </div>

          <Link
            href={`/tickets/${ticket.id}`}
            className="bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1"
          >
            <span>View Public Page</span>

            <ArrowUpRight size={14} />
          </Link>

        </div>

      </div>

    </div>
  );
}

/* ====================================================== */
/* EMPTY LISTINGS */
/* ====================================================== */

function EmptyListings() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">

      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Ticket
          size={26}
          className="text-slate-400"
        />
      </div>

      <h2 className="text-lg font-bold text-slate-900">
        No Ticket Listings Yet
      </h2>

      <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
        You have not published any tickets yet.
        Create your first listing and it will appear here.
      </p>

      <Link
        href="/create-listing"
        className="inline-flex mt-5 bg-[#0D9488] hover:bg-[#0F766E] text-white px-5 py-3 rounded-xl text-sm font-semibold transition"
      >
        Create Your First Listing
      </Link>

    </div>
  );
}
