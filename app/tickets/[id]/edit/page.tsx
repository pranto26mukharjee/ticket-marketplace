"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  Trash2,
  PauseCircle,
  PlayCircle,
  DollarSign,
  Ticket,
} from "lucide-react";

export default function EditTicketPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [quantity, setQuantity] = useState<number | string>("");
  const [seatNumber, setSeatNumber] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [ticketStatus, setTicketStatus] = useState("AVAILABLE");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!ticketId) return;

    async function loadTicket() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/tickets/${ticketId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load ticket for editing.");
        }

        const t = data.ticket;
        setTitle(t.title || "");
        setDescription(t.description || "");
        setPrice(t.price ?? "");
        setQuantity(t.quantity ?? 1);
        setSeatNumber(t.seatNumber || "");
        setTravelTime(t.travelTime || "");
        setTicketStatus(t.ticketStatus || "AVAILABLE");
        setFrom(t.from || "");
        setTo(t.to || "");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load ticket.");
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [ticketId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || Number(price) <= 0 || Number(quantity) < 0) {
      setError("Please ensure title, valid price, and non-negative quantity are provided.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          quantity: Number(quantity),
          seatNumber,
          travelTime,
          ticketStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save changes.");
      }

      setSuccess("Ticket listing updated successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete or cancel this ticket listing?")) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete ticket.");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete ticket.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-[#0D9488]" />
          <p className="text-sm font-semibold text-slate-500">Loading ticket for editing...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Seller Dashboard</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Edit Ticket Listing</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Route: <strong className="text-slate-700">{from} ➔ {to}</strong>
              </p>
            </div>

            {/* Status Indicator */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                ticketStatus === "AVAILABLE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : ticketStatus === "PAUSED"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {ticketStatus}
            </span>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Ticket Title / Journey Name
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            {/* Price and Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Asking Price (৳ BDT)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Available Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            {/* Seat Number & Travel Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Seat Number / Coach
                </label>
                <input
                  type="text"
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  placeholder="e.g. G-12 or Snigdha"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Departure Time
                </label>
                <input
                  type="text"
                  value={travelTime}
                  onChange={(e) => setTravelTime(e.target.value)}
                  placeholder="e.g. 07:30 AM"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            {/* Listing Status Toggle */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Marketplace Visibility Status
              </label>
              <select
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488] cursor-pointer"
              >
                <option value="AVAILABLE">AVAILABLE — Live in Public Marketplace</option>
                <option value="PAUSED">PAUSED — Temporarily Hidden from Search</option>
                <option value="CANCELLED">CANCELLED — Marked Cancelled</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Description / Handover Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={16} />
                <span>{deleting ? "Deleting..." : "Delete Listing"}</span>
              </button>

              <button
                type="submit"
                disabled={saving || deleting}
                className="px-6 py-3 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold rounded-xl text-xs transition shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>{saving ? "Saving Changes..." : "Save Listing"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
