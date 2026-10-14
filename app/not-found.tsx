import Link from "next/link";
import { Search, Home, Ticket, HelpCircle, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center">
        {/* Visual Ticket Graphic */}
        <div className="relative mx-auto w-32 h-32 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 to-indigo-600 rounded-3xl opacity-20 blur-xl animate-pulse" />
          <div className="relative bg-white border-2 border-dashed border-slate-300 shadow-xl rounded-2xl p-6 flex flex-col items-center justify-center">
            <Ticket className="w-12 h-12 text-[#1A1C43] stroke-[1.5]" />
            <span className="text-[10px] font-mono tracking-widest text-rose-500 font-bold uppercase mt-1">
              VOID / 404
            </span>
          </div>
        </div>

        {/* Heading & Notice */}
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 rounded-full mb-4">
          Error 404 • Destination Not Found
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1C43] tracking-tight mb-3">
          This Ticket Has Expired or Does Not Exist
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
          The listing, order, or page you were trying to access may have been sold,
          removed, or never existed in our verified ledger.
        </p>

        {/* Quick Search Form */}
        <div className="max-w-md mx-auto mb-8">
          <form
            action="/tickets"
            method="GET"
            className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all"
          >
            <div className="pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="q"
              placeholder="Search train, bus, or event tickets..."
              className="w-full text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#1A1C43] hover:bg-[#252861] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              Search
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1C43] hover:bg-[#252861] text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-all shadow-sm hover:border-slate-300"
          >
            <Ticket className="w-4 h-4 text-teal-600" />
            Browse Verified Tickets
          </Link>
        </div>

        {/* Help Link */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Need help with a disputed transaction?</span>
          <Link
            href="/dashboard?tab=inquiries"
            className="text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
