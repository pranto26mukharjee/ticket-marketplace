"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  Ticket,
  Search,
  Filter,
  Loader2,
  ArrowLeft,
  Check,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "ORDERS" | "INQUIRIES">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=50");
      if (!res.ok) throw new Error("Failed to load notifications.");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all your notification history?")) return;
    try {
      setActionLoading(true);
      await fetch("/api/notifications?clearAll=true", { method: "DELETE" });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSingle = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "PAYMENT_SUCCESS":
        return <CheckCircle2 size={18} className="text-emerald-500" />;
      case "ESCROW_HOLD":
        return <ShieldCheck size={18} className="text-teal-500" />;
      case "REFUND_COMPLETED":
      case "ORDER_REFUNDED":
        return <RotateCcw size={18} className="text-amber-500" />;
      case "INQUIRY_RECEIVED":
      case "INQUIRY_SENT":
        return <MessageSquare size={18} className="text-blue-500" />;
      case "TICKET_LISTED":
      case "TICKET_VERIFIED":
        return <Ticket size={18} className="text-purple-500" />;
      default:
        return <Bell size={18} className="text-slate-400" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "UNREAD" && n.isRead) return false;
    if (
      filter === "ORDERS" &&
      !["PAYMENT_SUCCESS", "ESCROW_HOLD", "REFUND_COMPLETED", "ORDER_REFUNDED"].includes(
        n.type
      )
    ) {
      return false;
    }
    if (
      filter === "INQUIRIES" &&
      !["INQUIRY_RECEIVED", "INQUIRY_SENT"].includes(n.type)
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      return n.message.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2 transition"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Notification Center</span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live escrow updates, ticket verification approvals, and buyer inquiry logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCheck size={14} className="text-teal-600" />
                <span>Mark All Read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-red-50 text-red-600 font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {[
              { id: "ALL", label: `All (${notifications.length})` },
              { id: "UNREAD", label: `Unread (${unreadCount})` },
              { id: "ORDERS", label: "Orders & Escrow" },
              { id: "INQUIRIES", label: "Inquiries" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? "bg-[#1A1C43] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 size={32} className="animate-spin text-[#0D9488] mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-semibold">Synchronizing notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell size={28} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No notifications found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You don&apos;t have any notifications matching your current filter. Real-time updates about ticket purchases and disputes will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 md:p-5 flex items-start justify-between gap-4 transition hover:bg-slate-50/80 ${
                    !n.isRead ? "bg-teal-50/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {n.type.replace(/_/g, " ")}
                        </span>
                        {!n.isRead && (
                          <span className="px-2 py-0.5 rounded-full bg-teal-500 text-white text-[9px] font-black uppercase">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[11px] text-slate-400 block">
                        {new Date(n.createdAt).toLocaleString("en-BD", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkSingle(n.id)}
                        title="Mark as read"
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSingle(n.id)}
                      title="Delete notification"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-[#0D9488]" />
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
