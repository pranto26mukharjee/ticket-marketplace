"use client";

import { useState } from "react";
import { 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  UserX, 
  Search, 
  Filter, 
  MoreVertical,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

export default function AdminUserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-12">
      {/* Admin Header */}
      <section className="bg-[#1A1C43] text-white px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center space-x-2">
              <Users className="text-[#5EEAD4]" size={24} />
              <span>User & Trust Operations</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              KYC verification statuses, identity checks, and fraud flag resolution.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-xs">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-medium flex items-center space-x-1">
              <ShieldCheck size={14} />
              <span>Identity Guard Active</span>
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 md:px-6 -mt-4 space-y-6">
        
        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone or NID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer">
              <Filter size={14} />
              <span>Filter: All Users</span>
            </button>
          </div>
        </div>

        {/* Users & Risk Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Verification State</th>
                  <th className="p-4">Completed Deals</th>
                  <th className="p-4">Trust Rating</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                
                {/* User Row 1 - Verified High Trust */}
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        AR
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Abhiman Roy</p>
                        <span className="text-[11px] text-slate-400">abhiman@example.com • NID Verified</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                      <CheckCircle2 size={12} />
                      <span>KYC Passed</span>
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-800">14 Tickets Sold</td>
                  <td className="p-4 font-bold text-emerald-600">4.9 / 5.0</td>
                  <td className="p-4">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Low Risk
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>

                {/* User Row 2 - Flagged / Suspicious */}
                <tr className="hover:bg-slate-50/80 transition bg-rose-50/30">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-xs">
                        TA
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Tanvir Ahmed</p>
                        <span className="text-[11px] text-slate-400">+880 1712-XXXXXX • Pending NID</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                      <AlertTriangle size={12} />
                      <span>Unverified</span>
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-800">1 Refund Disputed</td>
                  <td className="p-4 font-bold text-rose-600">2.1 / 5.0</td>
                  <td className="p-4">
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      <ShieldAlert size={12} />
                      <span>High Fraud Risk</span>
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition flex items-center space-x-1 ml-auto cursor-pointer">
                      <UserX size={14} />
                      <span>Ban User</span>
                    </button>
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