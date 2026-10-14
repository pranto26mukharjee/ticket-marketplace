"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors for client monitoring
    console.error("TicketLagbe Application Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white border border-slate-200/80 shadow-xl rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Subtle top decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

        {/* Warning Icon Badge */}
        <div className="relative mx-auto w-16 h-16 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping" />
          <div className="relative w-14 h-14 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-7 h-7" />
          </div>
        </div>

        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 rounded-full mb-3">
          Runtime Exception Caught
        </span>

        <h1 className="text-2xl font-bold text-[#1A1C43] mb-2 tracking-tight">
          Something Went Unexpectedly Wrong
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          We encountered an issue processing your secure request. Your account and escrow funds remain completely secure.
        </p>

        {error.digest && (
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Incident Reference Code
            </div>
            <code className="text-xs font-mono text-slate-700 select-all block break-all">
              {error.digest}
            </code>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1A1C43] hover:bg-[#252861] text-white text-sm font-semibold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            Marketplace Home
          </Link>
        </div>

        {/* Help footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
          Persistent issue? Contact our 24/7 Escrow Support desk at{" "}
          <a
            href="mailto:support@ticketlagbe.com"
            className="text-teal-600 hover:underline font-medium"
          >
            support@ticketlagbe.com
          </a>
        </div>
      </div>
    </div>
  );
}
