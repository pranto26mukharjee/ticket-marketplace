"use client";

import Link from "next/link";
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Users, 
  Ticket, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Eye 
} from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-12">
      {/* Top Admin Sub-Header */}
      <section className="bg-[#1A1C43] text-white px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center space-x-2">
              <span>Admin Mission Control</span>
              <span className="text-xs font-semibold bg-[#0D9488]/30 text-[#5EEAD4] px-2.5 py-1 rounded-full border border-[#0D9488]/50">
                Live
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Platform overview, Escrow vault status & ticket verification monitoring
            </p>
          </div>
          
          <div className="flex items-center space-x-3 text-xs">
            <span className="bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 text-slate-300">
              Admin: <strong className="text-white">Security Ops</strong>
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 md:px-6 -mt-4 space-y-8">
        {/* KPI Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Volume</span>
              <DollarSign size={20} className="text-[#0D9488]" />
            </div>
            <p className="text-2xl font-black text-slate-900">৳ 2,45,800</p>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center space-x-1">
              <TrendingUp size={12} />
              <span>+14.2% from last week</span>
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Active Listings</span>
              <Ticket size={20} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">1,280</p>
            <span className="text-[11px] font-semibold text-slate-500">Across Train, Bus & Concerts</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">AI Suspicious Flags</span>
              <ShieldAlert size={20} className="text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600">12 Pending</p>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Requires Manual Audit
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Verified Users</span>
              <Users size={20} className="text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">8,420</p>
            <span className="text-[11px] font-semibold text-emerald-600">+120 today</span>
          </div>
        </div>

        {/* Verification Queue Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pending Ticket Approvals & AI Audits</h2>
              <p className="text-xs text-slate-500">Inspect seller submissions before listings go live on the marketplace.</p>
            </div>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ticket ID or seller..." 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0D9488] w-full sm:w-64"
              />
            </div>
          </div>

          {/* Verification Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Ticket Details</th>
                  <th className="p-4">Seller</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">AI Security Score</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Row 1 */}
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">Subarna Express (Dhaka to Ctg)</p>
                    <span className="text-[11px] text-slate-400 font-mono">ID: #TK-88392 • Seat: G-14</span>
                  </td>
                  <td className="p-4 font-medium text-slate-700">Abhiman Roy</td>
                  <td className="p-4 font-bold text-slate-900">৳ 950</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      98.4% Match
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition" title="Approve">
                        <CheckCircle size={16} />
                      </button>
                      <button className="p-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition" title="Reject">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Row 2 (Flagged Item) */}
                <tr className="hover:bg-slate-50/80 transition bg-amber-50/30">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">Artcell Live Concert VIP Pass</p>
                    <span className="text-[11px] text-slate-400 font-mono">ID: #TK-11029 • Pass 02</span>
                  </td>
                  <td className="p-4 font-medium text-slate-700">Tanvir Ahmed</td>
                  <td className="p-4 font-bold text-slate-900">৳ 2,500</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-300">
                      72.1% Low Score
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition flex items-center space-x-1 font-semibold text-[11px]">
                        <Eye size={14} />
                        <span>Inspect Barcode</span>
                      </button>
                      <button className="p-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition" title="Reject & Ban Seller">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}