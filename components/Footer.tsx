"use client";

import Link from "next/link";
import { ShieldCheck, Lock, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#1A1C43] text-white pt-12 pb-6 px-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-700/60">
        
        {/* Column 1: Brand & Bio */}
        <div className="space-y-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-white block">
            Ticket<span className="text-[#5EEAD4]">Lagbe</span>
          </Link>
          <p className="text-xs text-slate-300 leading-relaxed">
            The most secure P2P ticket marketplace in Bangladesh. Cryptographically verified tickets with escrow buyer protection.
          </p>
          <div className="flex items-center space-x-2 text-xs text-[#5EEAD4]">
            <ShieldCheck size={16} />
            <span>AI Signature Active</span>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Marketplace</h4>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li><Link href="/tickets" className="hover:text-white transition">Search Tickets</Link></li>
            <li><Link href="/create-listing" className="hover:text-white transition">Sell a Ticket</Link></li>
            <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
          </ul>
        </div>

        {/* Column 3: Trust & Safety */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Trust & Safety</h4>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li><Link href="/verification-result" className="hover:text-white transition">AI Barcode Check</Link></li>
            <li><Link href="/checkout" className="hover:text-white transition">Escrow Checkout</Link></li>
          </ul>
        </div>

        {/* Column 4: Support */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Support</h4>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <Mail size={14} className="text-[#5EEAD4]" />
              <span>support@ticketlagbe.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone size={14} className="text-[#5EEAD4]" />
              <span>+880 9612-XXXXXX</span>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center space-x-1.5 bg-[#5EEAD4]/10 text-[#5EEAD4] border border-[#5EEAD4]/30 px-3 py-1.5 rounded-lg text-xs">
                <Lock size={12} />
                <span>256-Bit SSL Secured</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Copyright Bar */}
      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>© {new Date().getFullYear()} TicketLagbe Technologies. All rights reserved.</p>
        <p className="flex items-center space-x-1">
          <span>Built with high-trust architecture</span>
        </p>
      </div>
    </footer>
  );
}