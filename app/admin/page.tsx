"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Ticket,
  ShoppingBag,
  ShieldAlert,
  BarChart3,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ExternalLink,
  Ban,
  UserCheck,
  UserX,
  Loader2,
  Lock,
  ArrowUpRight,
  LogOut,
  RefreshCw,
  FileText,
} from "lucide-react";

interface MetricsData {
  totalPlatformVolume: number;
  totalEscrowHeld: number;
  totalUsers: number;
  totalVerifiedUsers: number;
  totalTickets: number;
  activeTickets: number;
  totalOrders: number;
  openDisputes: number;
  openFraudAlerts: number;
}

interface UserItem {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: string;
  accountStatus: string;
  createdAt: string;
  profile?: {
    identityVerified: boolean;
    nidPassportNo: string | null;
  } | null;
  _count?: {
    tickets: number;
    orders: number;
    fraudAlerts: number;
  };
}

interface TicketItem {
  id: string;
  title: string | null;
  from: string | null;
  to: string | null;
  travelDate: string | null;
  price: number | null;
  quantity: number;
  ticketStatus: string;
  seller: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
  };
  verifications?: Array<{
    id: string;
    aiConfidenceScore: number | null;
    decision: string | null;
    verificationStatus: string;
    documentUrl: string | null;
  }>;
}

interface OrderItem {
  id: string;
  orderTotal: number;
  orderStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  buyer: {
    id: string;
    fullName: string | null;
    email: string;
  };
  ticket?: {
    id: string;
    title: string | null;
    from: string | null;
    to: string | null;
    seller?: {
      id: string;
      fullName: string | null;
      email: string;
    } | null;
  } | null;
  payment?: {
    paymentStatus: string;
    gatewayReference: string | null;
  } | null;
  disputes?: Array<{
    id: string;
    disputeStatus: string;
    resolutionNotes: string | null;
  }>;
}

interface FraudAlertItem {
  id: string;
  alertType: string;
  severity: string;
  alertStatus: string;
  relatedUser?: {
    fullName: string | null;
    email: string;
  } | null;
  relatedTicket?: {
    title: string | null;
    from: string | null;
    to: string | null;
  } | null;
  relatedOrder?: {
    id: string;
    orderTotal: number;
  } | null;
}

interface AuditLogItem {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  details: string | null;
  createdAt: string;
  admin?: {
    id: string;
    fullName: string | null;
    email: string;
    role: string;
  } | null;
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Data states
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlertItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Filter states
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [ticketSearch, setTicketSearch] = useState("");

  // 1. Initial auth & metric load
  const loadAllData = async () => {
    try {
      setRefreshing(true);

      const [metricsRes, usersRes, ticketsRes, ordersRes, fraudRes, auditRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}&role=${userRoleFilter}`),
        fetch(`/api/admin/tickets?search=${encodeURIComponent(ticketSearch)}`),
        fetch("/api/admin/orders"),
        fetch("/api/admin/fraud"),
        fetch("/api/admin/audit"),
      ]);

      if (metricsRes.status === 401 || metricsRes.status === 403) {
        router.push("/admin/login");
        return;
      }

      const [metricsData, usersData, ticketsData, ordersData, fraudData, auditData] = await Promise.all([
        metricsRes.json(),
        usersRes.json(),
        ticketsRes.json(),
        ordersRes.json(),
        fraudRes.json(),
        auditRes.json(),
      ]);

      if (metricsData.success) setMetrics(metricsData.metrics);
      if (usersData.success) setUsers(usersData.users || []);
      if (ticketsData.success) setTickets(ticketsData.tickets || []);
      if (ordersData.success) setOrders(ordersData.orders || []);
      if (fraudData.success) setFraudAlerts(fraudData.alerts || []);
      if (auditData.success) setAuditLogs(auditData.auditLogs || []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [userRoleFilter]);

  // 2. User Moderation Handlers
  const handleUserAction = async (userId: string, action: string, payload: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update user.");

      setStatusMessage(data.message);
      loadAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error performing user action");
    }
  };

  // 3. Ticket Moderation Handlers
  const handleTicketAction = async (ticketId: string, action: string) => {
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to moderate ticket.");

      setStatusMessage(data.message);
      loadAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error moderating ticket");
    }
  };

  // 4. Order Escrow Handlers
  const handleOrderAction = async (orderId: string, action: string, notes = "") => {
    if (!confirm(`Are you sure you want to execute ${action} on order #${orderId.slice(-6)}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action, resolutionNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to process order moderation.");

      setStatusMessage(data.message);
      loadAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error processing order moderation");
    }
  };

  // 5. Fraud Alert Handlers
  const handleFraudAction = async (alertId: string, action: string) => {
    try {
      const res = await fetch("/api/admin/fraud", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update alert.");

      setStatusMessage(data.message);
      loadAllData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating fraud alert");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1123] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-teal-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            Loading TicketLagbe Security Command Center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1123] text-slate-100 font-sans pb-16">
      {/* Top Command Bar */}
      <header className="border-b border-slate-800 bg-[#14162E] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white flex items-center gap-1">
                Ticket<span className="text-teal-400">Lagbe</span> Backoffice
              </span>
              <p className="text-[10px] text-slate-400 font-mono">Platform Admin & Escrow Ops</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-teal-400" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition flex items-center gap-1"
            >
              <span>Marketplace</span>
              <ExternalLink size={12} />
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-400 transition flex items-center gap-1 cursor-pointer"
            >
              <LogOut size={12} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-2 py-2">
          {[
            { id: "overview", label: "Overview & Analytics", icon: BarChart3 },
            { id: "users", label: `User Management (${metrics?.totalUsers || 0})`, icon: Users },
            { id: "tickets", label: `Listing Moderation (${metrics?.totalTickets || 0})`, icon: Ticket },
            { id: "orders", label: `Escrow & Orders (${metrics?.totalOrders || 0})`, icon: ShoppingBag },
            { id: "fraud", label: `Fraud Flags (${metrics?.openFraudAlerts || 0})`, icon: ShieldAlert },
            { id: "audit", label: `Audit Ledger (${auditLogs.length})`, icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Status banner */}
      {statusMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-xs text-teal-300 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage("")} className="text-teal-400 hover:text-white">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {/* ========================================================
            TAB 1: OVERVIEW & ANALYTICS
        ======================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-[#181A38] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Platform Volume
                </span>
                <p className="text-xl font-black text-teal-400 mt-1">
                  ৳{(metrics?.totalPlatformVolume || 0).toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-500">Gross settled deals</span>
              </div>

              <div className="bg-[#181A38] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Escrow Locked
                </span>
                <p className="text-xl font-black text-amber-400 mt-1">
                  ৳{(metrics?.totalEscrowHeld || 0).toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-500">Awaiting trip completion</span>
              </div>

              <div className="bg-[#181A38] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Total Users
                </span>
                <p className="text-xl font-black text-white mt-1">{metrics?.totalUsers || 0}</p>
                <span className="text-[10px] text-emerald-400">
                  {metrics?.totalVerifiedUsers || 0} KYC verified
                </span>
              </div>

              <div className="bg-[#181A38] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Active Tickets
                </span>
                <p className="text-xl font-black text-white mt-1">{metrics?.activeTickets || 0}</p>
                <span className="text-[10px] text-slate-500">Available on market</span>
              </div>

              <div className="bg-[#181A38] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Open Disputes
                </span>
                <p className="text-xl font-black text-rose-400 mt-1">{metrics?.openDisputes || 0}</p>
                <span className="text-[10px] text-slate-500">Needs review</span>
              </div>

              <div className="bg-[#181A38] border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Fraud Flags
                </span>
                <p className="text-xl font-black text-red-400 mt-1">{metrics?.openFraudAlerts || 0}</p>
                <span className="text-[10px] text-slate-500">Security warnings</span>
              </div>
            </div>

            {/* Category Listing Distribution Breakdown */}
            <div className="bg-[#181A38] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Ticket size={16} className="text-teal-400" />
                  <span>Category-wise Listing Inventory</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Real-time marketplace distribution</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#111327] rounded-xl border border-indigo-900/40">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase">Train Tickets</span>
                  <p className="text-lg font-black text-white mt-1">
                    {tickets.filter(t => (t.title || "").toUpperCase().includes("TRAIN") || (t.title || "").toUpperCase().includes("EXPRESS")).length}
                  </p>
                </div>
                <div className="p-3 bg-[#111327] rounded-xl border border-teal-900/40">
                  <span className="text-[10px] text-teal-400 font-bold uppercase">Bus Tickets</span>
                  <p className="text-lg font-black text-white mt-1">
                    {tickets.filter(t => (t.title || "").toUpperCase().includes("BUS") || (t.title || "").toUpperCase().includes("PARIBAHAN") || (t.title || "").toUpperCase().includes("TRAVELS")).length}
                  </p>
                </div>
                <div className="p-3 bg-[#111327] rounded-xl border border-sky-900/40">
                  <span className="text-[10px] text-sky-400 font-bold uppercase">Air Flights</span>
                  <p className="text-lg font-black text-white mt-1">
                    {tickets.filter(t => (t.title || "").toUpperCase().includes("AIR") || (t.title || "").toUpperCase().includes("FLIGHT") || (t.title || "").toUpperCase().includes("BIMAN")).length}
                  </p>
                </div>
                <div className="p-3 bg-[#111327] rounded-xl border border-amber-900/40">
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Events & Shows</span>
                  <p className="text-lg font-black text-white mt-1">
                    {tickets.filter(t => (t.title || "").toUpperCase().includes("CONCERT") || (t.title || "").toUpperCase().includes("EVENT") || (t.title || "").toUpperCase().includes("PASS")).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Operations Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders Overview */}
              <div className="bg-[#181A38] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <ShoppingBag size={16} className="text-teal-400" />
                    <span>Recent Escrow Transactions</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs text-teal-400 hover:underline cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="p-3 bg-[#111327] border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">Order #{order.id.slice(-6)}</p>
                        <p className="text-slate-400 text-[11px]">
                          Buyer: {order.buyer.fullName || order.buyer.email} • {order.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-teal-400">৳{order.orderTotal.toLocaleString()}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Security Incidents */}
              <div className="bg-[#181A38] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <ShieldAlert size={16} className="text-rose-400" />
                    <span>Fraud & Risk Monitoring</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("fraud")}
                    className="text-xs text-rose-400 hover:underline cursor-pointer"
                  >
                    View All Flags →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {fraudAlerts.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No active security fraud alerts. Platform status healthy.
                    </div>
                  ) : (
                    fraudAlerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 bg-[#111327] border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-rose-300">{alert.alertType}</p>
                          <p className="text-slate-400 text-[11px]">
                            {alert.relatedUser?.fullName || "User Incident"}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            alert.severity === "HIGH"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: USER MANAGEMENT
        ======================================================== */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-[#181A38] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadAllData()}
                  className="w-full pl-10 pr-4 py-2 bg-[#101226] border border-slate-700/80 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-[#101226] border border-slate-700/80 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="BUYER">Buyers</option>
                  <option value="SELLER">Sellers</option>
                  <option value="ADMIN">Admins</option>
                </select>

                <button
                  onClick={loadAllData}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#181A38] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#121327] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">KYC State</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4">Market Activity</th>
                      <th className="p-4 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {users.map((user) => {
                      const isVerified = user.profile?.identityVerified;
                      const isBanned = user.accountStatus === "BANNED";
                      const isSuspended = user.accountStatus === "SUSPENDED";

                      return (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4">
                            <div>
                              <p className="font-bold text-white">{user.fullName || "Unspecified Name"}</p>
                              <p className="text-[11px] text-slate-400">{user.email}</p>
                              {user.phone && <p className="text-[11px] text-teal-400">{user.phone}</p>}
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                user.role === "ADMIN"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : user.role === "SELLER"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-slate-700/60 text-slate-300"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td className="p-4">
                            <button
                              onClick={() =>
                                handleUserAction(user.id, "VERIFY_KYC", {
                                  identityVerified: !isVerified,
                                })
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                isVerified
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                              }`}
                            >
                              <ShieldCheck size={12} />
                              <span>{isVerified ? "KYC Approved" : "Unverified"}</span>
                            </button>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isBanned
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : isSuspended
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              {user.accountStatus}
                            </span>
                          </td>

                          <td className="p-4 text-[11px] text-slate-400">
                            {user._count?.tickets || 0} tickets • {user._count?.orders || 0} orders
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {user.accountStatus === "ACTIVE" ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUserAction(user.id, "UPDATE_STATUS", {
                                        accountStatus: "SUSPENDED",
                                      })
                                    }
                                    title="Suspend User"
                                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                  >
                                    Suspend
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUserAction(user.id, "UPDATE_STATUS", {
                                        accountStatus: "BANNED",
                                      })
                                    }
                                    title="Ban User"
                                    className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                  >
                                    Ban
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleUserAction(user.id, "UPDATE_STATUS", {
                                      accountStatus: "ACTIVE",
                                    })
                                  }
                                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Activate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: TICKET LISTING MODERATION
        ======================================================== */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            <div className="bg-[#181A38] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#121327] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Ticket & Route</th>
                      <th className="p-4">Seller</th>
                      <th className="p-4">Price & Stock</th>
                      <th className="p-4">AI Score</th>
                      <th className="p-4">Doc Proof</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {tickets.map((t) => {
                      const ver = t.verifications?.[0];
                      const score = ver?.aiConfidenceScore ?? 80;

                      return (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4">
                            <p className="font-bold text-white">
                              {t.from} ➔ {t.to}
                            </p>
                            <p className="text-[11px] text-slate-400">{t.title}</p>
                          </td>

                          <td className="p-4">
                            <p className="font-bold text-white">{t.seller?.fullName || "Seller"}</p>
                            <p className="text-[11px] text-slate-400">{t.seller?.email}</p>
                          </td>

                          <td className="p-4">
                            <p className="font-bold text-teal-400">৳{(t.price || 0).toLocaleString()}</p>
                            <span className="text-[10px] text-slate-400">{t.quantity} available</span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                score >= 85
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : score >= 60
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-red-500/20 text-red-300 border border-red-500/30"
                              }`}
                            >
                              {score}% {ver?.decision || "AI SCREEN"}
                            </span>
                          </td>

                          <td className="p-4">
                            {ver?.documentUrl ? (
                              <a
                                href={ver.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:underline"
                              >
                                <span>Inspect Doc</span>
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-500">None</span>
                            )}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                t.ticketStatus === "AVAILABLE"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : t.ticketStatus === "SUSPENDED"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {t.ticketStatus}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {t.ticketStatus === "AVAILABLE" ? (
                                <button
                                  onClick={() => handleTicketAction(t.id, "SUSPEND")}
                                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Pause
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleTicketAction(t.id, "ACTIVATE")}
                                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleTicketAction(t.id, "REJECT_AI")}
                                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: ESCROW & ORDERS
        ======================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="bg-[#181A38] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#121327] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Order ID & Date</th>
                      <th className="p-4">Buyer</th>
                      <th className="p-4">Ticket</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Payment & Escrow</th>
                      <th className="p-4">Order Status</th>
                      <th className="p-4 text-right">Escrow Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {orders.map((o) => {
                      const hasDispute = o.disputes && o.disputes.length > 0;

                      return (
                        <tr key={o.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4">
                            <p className="font-bold text-white">#{o.id.slice(-8).toUpperCase()}</p>
                            <p className="text-[10px] text-slate-500">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </p>
                          </td>

                          <td className="p-4">
                            <p className="font-bold text-white">{o.buyer?.fullName || "Buyer"}</p>
                            <p className="text-[11px] text-slate-400">{o.buyer?.email}</p>
                          </td>

                          <td className="p-4">
                            <p className="font-bold text-white">
                              {o.ticket?.from} ➔ {o.ticket?.to}
                            </p>
                            <p className="text-[10px] text-slate-400">{o.ticket?.title}</p>
                          </td>

                          <td className="p-4">
                            <p className="font-bold text-teal-400">৳{o.orderTotal.toLocaleString()}</p>
                            <span className="text-[10px] text-slate-400">{o.paymentMethod}</span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                o.payment?.paymentStatus === "PAID"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : o.payment?.paymentStatus === "REFUNDED"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {o.payment?.paymentStatus || "PENDING"}
                            </span>
                            {o.payment?.gatewayReference && (
                              <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-teal-300 bg-slate-900/90 border border-teal-500/30 px-2 py-0.5 rounded-md w-fit">
                                <span className="text-slate-400">TrxID:</span>
                                <span className="font-bold text-white select-all">{o.payment.gatewayReference}</span>
                              </div>
                            )}
                            {hasDispute && (
                              <span className="block mt-1 text-[10px] text-rose-400 font-bold">
                                ⚠ Dispute Open
                              </span>
                            )}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                o.orderStatus === "CONFIRMED"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : o.orderStatus === "COMPLETED"
                                  ? "bg-teal-500/20 text-teal-300"
                                  : o.orderStatus === "CANCELLED"
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {o.orderStatus}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {o.payment?.paymentStatus !== "PAID" && o.orderStatus !== "CANCELLED" && (
                                <button
                                  onClick={() => handleOrderAction(o.id, "APPROVE_PAYMENT")}
                                  className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Approve Payment
                                </button>
                              )}
                              {o.orderStatus === "CONFIRMED" || o.orderStatus === "REFUND_REQUESTED" ? (
                                <>
                                  <button
                                    onClick={() => handleOrderAction(o.id, "FORCE_REFUND")}
                                    className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                  >
                                    Force Refund
                                  </button>
                                  <button
                                    onClick={() => handleOrderAction(o.id, "FORCE_COMPLETE")}
                                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                  >
                                    Release Escrow
                                  </button>
                                </>
                              ) : (
                                o.payment?.paymentStatus === "PAID" && (
                                  <span className="text-[11px] text-slate-500">Settled</span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: FRAUD & SECURITY ALERTS
        ======================================================== */}
        {activeTab === "fraud" && (
          <div className="space-y-4">
            <div className="bg-[#181A38] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#121327] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Alert Type</th>
                      <th className="p-4">Severity</th>
                      <th className="p-4">Target / Entity</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {fraudAlerts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                          No fraud flags logged. TicketLagbe security checks all clear.
                        </td>
                      </tr>
                    ) : (
                      fraudAlerts.map((fa) => (
                        <tr key={fa.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 font-bold text-white">{fa.alertType}</td>

                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                fa.severity === "HIGH"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {fa.severity}
                            </span>
                          </td>

                          <td className="p-4 text-[11px] text-slate-300">
                            {fa.relatedUser?.fullName ? `User: ${fa.relatedUser.fullName}` : ""}
                            {fa.relatedTicket?.title ? ` • Listing: ${fa.relatedTicket.title}` : ""}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                fa.alertStatus === "OPEN"
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-emerald-500/20 text-emerald-300"
                              }`}
                            >
                              {fa.alertStatus}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            {fa.alertStatus === "OPEN" ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleFraudAction(fa.id, "RESOLVE")}
                                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Resolve
                                </button>
                                <button
                                  onClick={() => handleFraudAction(fa.id, "DISMISS")}
                                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Dismiss
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500">Addressed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: AUDIT LEDGER (COMPLIANCE & TRACEABILITY)
        ======================================================== */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="bg-[#181A38] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 bg-[#121327] flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <FileText size={16} className="text-teal-400" />
                    <span>Immutable Administrative Audit Ledger</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cryptographic record of every administrative action, user ban, KYC status change, and escrow override.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-xl">
                  {auditLogs.length} Logged Interventions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#121327] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Administrator</th>
                      <th className="p-4">Action Taken</th>
                      <th className="p-4">Target Entity</th>
                      <th className="p-4">Target ID</th>
                      <th className="p-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                          No administrative actions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition font-mono">
                          <td className="p-4 text-[11px] text-slate-400 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString("en-BD", {
                              dateStyle: "short",
                              timeStyle: "medium",
                            })}
                          </td>

                          <td className="p-4">
                            <span className="font-bold text-white">
                              {log.admin?.fullName || "Admin"}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {log.admin?.email}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-bold">
                              {log.actionType}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="text-slate-300 uppercase font-semibold text-[10px]">
                              {log.targetType}
                            </span>
                          </td>

                          <td className="p-4 text-slate-400 text-[11px]">
                            #{log.targetId.slice(-8)}
                          </td>

                          <td className="p-4 text-right text-slate-300 text-[11px]">
                            {log.details || "Standard intervention"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F1123] flex items-center justify-center text-white">
          <Loader2 size={36} className="animate-spin text-teal-400" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}