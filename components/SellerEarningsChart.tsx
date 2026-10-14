"use client";

import { useEffect, useState } from "react";
import {
  Bar, Line
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { TrendingUp, TrendingDown, BarChart2, Loader2 } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EarningsData {
  labels: string[];
  revenue: number[];
  orders: number[];
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  growthPercent: number;
}

export default function SellerEarningsChart() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  useEffect(() => {
    async function fetchEarnings() {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/earnings", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success) setData(json.earnings);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center min-h-[280px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  if (!data || data.labels.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[280px] text-center">
        <BarChart2 className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-slate-500">No sales data yet</p>
        <p className="text-xs text-slate-400 mt-1">Start listing tickets to see your revenue analytics here.</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1A1C43",
        titleColor: "#5EEAD4",
        bodyColor: "#e2e8f0",
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) =>
            `  ${context.dataset?.label || ""}: ৳${Number(context.parsed?.y ?? 0).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#94a3b8" },
      },
      y: {
        grid: { color: "#f1f5f9", lineWidth: 1 },
        ticks: {
          font: { size: 11 },
          color: "#94a3b8",
          callback: (tickValue: number | string) =>
            `৳${Number(tickValue).toLocaleString()}`,
        },
      },
    },
  };

  const barData = {
    labels: data.labels,
    datasets: [
      {
        label: "Revenue (৳)",
        data: data.revenue,
        backgroundColor: "rgba(13, 148, 136, 0.18)",
        borderColor: "#0D9488",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: "rgba(13, 148, 136, 0.35)",
      },
    ],
  };

  const lineData = {
    labels: data.labels,
    datasets: [
      {
        label: "Revenue (৳)",
        data: data.revenue,
        borderColor: "#0D9488",
        backgroundColor: "rgba(13, 148, 136, 0.08)",
        borderWidth: 2.5,
        pointBackgroundColor: "#0D9488",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const isPositiveGrowth = data.growthPercent >= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Revenue Analytics</h3>
          <p className="text-[11px] text-slate-400">Last 6 months earning history</p>
        </div>

        {/* Stats Strip */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Revenue</p>
            <p className="text-sm font-black text-slate-900">৳{data.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Avg / Order</p>
            <p className="text-sm font-black text-slate-900">৳{data.avgOrderValue.toLocaleString()}</p>
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            isPositiveGrowth
              ? "text-emerald-700 bg-emerald-50"
              : "text-red-600 bg-red-50"
          }`}>
            {isPositiveGrowth
              ? <TrendingUp className="w-3.5 h-3.5" />
              : <TrendingDown className="w-3.5 h-3.5" />
            }
            {Math.abs(data.growthPercent).toFixed(1)}%
          </div>
        </div>

        {/* Chart type toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          {(["bar", "line"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                chartType === type
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pb-4 pt-2" style={{ height: "240px" }}>
        {chartType === "bar"
          ? <Bar data={barData} options={chartOptions} />
          : <Line data={lineData} options={chartOptions} />
        }
      </div>
    </div>
  );
}
