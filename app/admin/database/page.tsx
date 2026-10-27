"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Loader2,
  Search,
  X,
} from "lucide-react";

interface TableInfo {
  name: string;
  rows: number;
}

interface TablePage {
  rows: Record<string, unknown>[];
  hiddenFields: string[];
  pagination: { total: number; page: number; totalPages: number; limit: number };
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function AdminDatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selected, setSelected] = useState<string>("User");
  const [data, setData] = useState<TablePage | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailRow, setDetailRow] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/admin/database", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTables(json.tables);
        else setError(json.message || "Failed to load tables.");
      })
      .catch(() => setError("Failed to load tables."));
  }, []);

  // Callers set loading=true when they change selected/page/search.
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ table: selected, page: String(page) });
    if (search) params.set("search", search);

    fetch(`/api/admin/database?${params}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to load rows.");
        if (!cancelled) {
          setError("");
          setData(json);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load rows.");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected, page, search]);

  const goToPage = (next: number) => {
    setLoading(true);
    setPage(next);
  };

  const columns = data ? Array.from(new Set(data.rows.flatMap((row) => Object.keys(row)))) : [];
  const exportHref = `/api/admin/database?${new URLSearchParams({ table: selected, format: "csv", ...(search ? { search } : {}) })}`;

  return (
    <div className="min-h-screen bg-[#0F1123] text-slate-100 font-sans pb-16">
      <header className="border-b border-slate-800 bg-[#14162E] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              aria-label="Back to backoffice"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center">
              <Database size={18} />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white">Database Explorer</span>
              <p className="text-[10px] text-slate-400 font-mono">Read-only · secrets hidden · exports audited</p>
            </div>
          </div>
          <a
            href={exportHref}
            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Table list */}
        <aside className="bg-[#181A38] border border-slate-800 rounded-2xl p-2 h-fit lg:sticky lg:top-24">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Tables</p>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => {
                  setLoading(true);
                  setSelected(table.name);
                  setPage(1);
                  setSearch("");
                  setSearchInput("");
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 whitespace-nowrap transition cursor-pointer ${
                  selected === table.name
                    ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <span>{table.name}</span>
                <span className="font-mono text-[10px] text-slate-500">{table.rows.toLocaleString()}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Rows */}
        <section className="space-y-4 min-w-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setPage(1);
              setSearch(searchInput.trim());
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={`Search ${selected} by id or text fields`}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#181A38] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/60"
              />
            </div>
            <button className="px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer">Search</button>
          </form>

          {data && data.hiddenFields.length > 0 && (
            <p className="text-[11px] text-slate-500">
              Hidden for security: <span className="font-mono">{data.hiddenFields.join(", ")}</span>
            </p>
          )}

          {error && (
            <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="bg-[#181A38] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 size={24} className="animate-spin text-teal-400" />
                </div>
              ) : data && data.rows.length > 0 ? (
                <table className="w-full text-xs">
                  <thead className="bg-[#14162E] text-slate-400">
                    <tr>
                      {columns.map((column) => (
                        <th key={column} className="px-3 py-2.5 text-left font-bold whitespace-nowrap">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data.rows.map((row, index) => (
                      <tr
                        key={String(row.id ?? index)}
                        onClick={() => setDetailRow(row)}
                        className="hover:bg-slate-800/40 cursor-pointer"
                      >
                        {columns.map((column) => (
                          <td key={column} className="px-3 py-2 text-slate-300 whitespace-nowrap max-w-[260px] truncate font-mono">
                            {formatCell(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-12 text-center text-xs text-slate-500">No rows found.</p>
              )}
            </div>
          </div>

          {data && (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {data.pagination.total.toLocaleString()} rows · page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Row detail drawer */}
      {detailRow && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end" onClick={() => setDetailRow(null)}>
          <div
            className="w-full max-w-xl h-full bg-[#14162E] border-l border-slate-800 p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-sm">
                {selected} <span className="font-mono text-slate-500 text-xs">{String(detailRow.id ?? "")}</span>
              </h2>
              <button onClick={() => setDetailRow(null)} className="p-1.5 rounded-lg hover:bg-slate-800" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <dl className="space-y-3">
              {Object.entries(detailRow).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{key}</dt>
                  <dd className="mt-0.5 text-xs font-mono text-slate-200 whitespace-pre-wrap break-all">
                    {typeof value === "string" && value.startsWith("{")
                      ? (() => {
                          try {
                            return JSON.stringify(JSON.parse(value), null, 2);
                          } catch {
                            return value;
                          }
                        })()
                      : typeof value === "object" && value !== null
                        ? JSON.stringify(value, null, 2)
                        : formatCell(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
