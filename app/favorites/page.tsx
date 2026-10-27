"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Heart, Loader2, MapPin, Trash2 } from "lucide-react";

interface FavoriteTicket {
  id: string;
  title: string | null;
  from: string | null;
  to: string | null;
  travelDate: string | null;
  price: number | null;
  ticketStatus: string;
  category?: { categoryName: string } | null;
}

interface FavoriteRecord {
  id: string;
  ticketId: string;
  ticket: FavoriteTicket;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    async function loadFavorites() {
      try {
        const response = await fetch("/api/favorites", { cache: "no-store" });
        if (response.status === 401) {
          router.replace("/login?redirect=/favorites");
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load saved tickets.");
        if (isCurrent) setFavorites(data.favorites || []);
      } catch (loadError) {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : "Could not load saved tickets.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }
    void loadFavorites();
    return () => { isCurrent = false; };
  }, [router]);

  async function removeFavorite(ticketId: string) {
    setRemovingId(ticketId);
    try {
      const response = await fetch(`/api/favorites?ticketId=${encodeURIComponent(ticketId)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not remove this saved ticket.");
      setFavorites((current) => current.filter((favorite) => favorite.ticketId !== ticketId));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove this saved ticket.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Your account</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold">Saved tickets</h1>
            <p className="mt-2 text-sm text-slate-600">Listings you bookmarked while browsing.</p>
          </div>
          <Link href="/tickets" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-teal-800">Browse tickets <ArrowRight size={15} /></Link>
        </div>

        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        {loading ? (
          <div className="py-16 flex items-center gap-2 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Loading saved tickets</div>
        ) : favorites.length === 0 ? (
          <div className="py-16 border-b border-slate-200">
            <Heart size={26} className="text-rose-600" />
            <h2 className="mt-3 text-lg font-semibold">No saved tickets yet</h2>
            <p className="mt-1 text-sm text-slate-600">Save listings from the marketplace and they will appear here.</p>
            <Link href="/tickets" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-800">Browse tickets <ArrowRight size={15} /></Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {favorites.map(({ ticket }) => (
              <article key={ticket.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-teal-800">{ticket.category?.categoryName || "Ticket"}</span>
                  <h2 className="mt-1 font-semibold text-slate-900">{ticket.title || "Ticket listing"}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><MapPin size={13} />{ticket.from || "Location not listed"} to {ticket.to || "Venue not listed"}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays size={13} />{ticket.travelDate ? new Date(ticket.travelDate).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" }) : "Date not listed"}</span>
                    <span>৳{(ticket.price || 0).toLocaleString()}</span>
                    <span>{ticket.ticketStatus}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/tickets/${ticket.id}`} className="text-sm font-semibold text-teal-800 hover:underline">View listing</Link>
                  <button type="button" onClick={() => void removeFavorite(ticket.id)} disabled={removingId === ticket.id} aria-label="Remove saved ticket" className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:text-red-700 hover:border-red-300 disabled:opacity-50">
                    {removingId === ticket.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}