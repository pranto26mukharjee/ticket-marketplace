import { Loader2, Ticket } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="relative flex items-center justify-center mb-6">
        {/* Glowing pulse aura */}
        <div className="absolute w-20 h-20 bg-teal-500/20 rounded-full blur-xl animate-pulse" />
        
        {/* Spinning border ring */}
        <div className="relative w-16 h-16 rounded-2xl bg-white border border-slate-200/80 shadow-lg flex items-center justify-center">
          <Ticket className="w-8 h-8 text-[#1A1C43] animate-pulse" />
          <Loader2 className="absolute -inset-1.5 w-[76px] h-[76px] text-teal-500 animate-spin opacity-60 stroke-[1.5]" />
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-base font-semibold text-[#1A1C43] tracking-tight">
          Securing Marketplace Ledger...
        </h3>
        <p className="text-xs text-slate-400 mt-1 animate-pulse">
          Verifying tickets and escrow status
        </p>
      </div>
    </div>
  );
}
