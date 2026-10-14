"use client";

import { useState } from "react";
import { Star, Loader2, CheckCircle2, MessageSquare } from "lucide-react";

interface ReviewFormProps {
  orderId: string;
  sellerName: string;
  onSuccess?: () => void;
}

export function ReviewForm({ orderId, sellerName, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to submit review.");
        return;
      }
      setSubmitted(true);
      onSuccess?.();
    } catch {
      setError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-teal-500 mx-auto mb-3" />
        <p className="font-bold text-teal-800">Review Submitted!</p>
        <p className="text-xs text-teal-600 mt-1">Thank you for your honest feedback about {sellerName}.</p>
      </div>
    );
  }

  const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <p className="font-bold text-slate-900 text-sm">Rate Your Experience</p>
          <p className="text-[11px] text-slate-500">Reviewing seller: <strong>{sellerName}</strong></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-2">Your Rating *</label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    (hovered || rating) >= star
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-200 fill-slate-200"
                  }`}
                />
              </button>
            ))}
            {(hovered || rating) > 0 && (
              <span className="ml-2 text-xs font-bold text-amber-600">
                {LABELS[hovered || rating]}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-2">
            <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
            Your Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this seller..."
            rows={3}
            maxLength={500}
            className="w-full text-xs text-slate-700 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition placeholder:text-slate-400"
          />
          <div className="text-right text-[10px] text-slate-400 mt-1">{comment.length}/500</div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A1C43] hover:bg-[#252861] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            <><Star className="w-4 h-4" /> Submit Review</>
          )}
        </button>
      </form>
    </div>
  );
}

interface SellerRatingProps {
  avgRating: number;
  totalReviews: number;
}

export function SellerRatingBadge({ avgRating, totalReviews }: SellerRatingProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= Math.round(avgRating)
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200 fill-slate-200"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-slate-700">{avgRating.toFixed(1)}</span>
      <span className="text-xs text-slate-400">({totalReviews} reviews)</span>
    </div>
  );
}
