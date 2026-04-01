"use client";

export const dynamic = "force-dynamic";

import {
  Globe2,
  AlertTriangle,
  Database,
  BarChart2,
  TrendingUp,
  Shield,
  Search,
  Zap,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { cn } from "@/lib/utils";
import { useState } from "react";

const DOMAIN_CARDS = [
  {
    name: "Geopolitics",
    icon: "🌍",
    color: "bg-blue-500",
    entities: 12847,
    newToday: 42,
    trending: "India-China Border Dialogue",
  },
  {
    name: "Economics",
    icon: "📈",
    color: "bg-green-500",
    entities: 9234,
    newToday: 38,
    trending: "BRICS Currency Initiative",
  },
  {
    name: "Defense",
    icon: "🛡️",
    color: "bg-red-500",
    entities: 7892,
    newToday: 25,
    trending: "INS Arighat Commissioning",
  },
  {
    name: "Technology",
    icon: "💻",
    color: "bg-purple-500",
    entities: 6543,
    newToday: 67,
    trending: "ISRO Gaganyaan Update",
  },
  {
    name: "Climate",
    icon: "🌡️",
    color: "bg-orange-500",
    entities: 4321,
    newToday: 18,
    trending: "Himalayan Glacier Report",
  },
  {
    name: "Society",
    icon: "👥",
    color: "bg-yellow-500",
    entities: 5678,
    newToday: 31,
    trending: "Digital India Expansion",
  },
];

const RECENT_CHANGES = [
  { type: "entity", text: "New entity: INS Tushil (Defense)", time: "2 min ago", icon: "🆕" },
  { type: "relation", text: "New link: India → TRADES_WITH → UAE", time: "8 min ago", icon: "🔗" },
  { type: "credibility", text: "Credibility updated: CHIPS Act impact (0.72 → 0.85)", time: "15 min ago", icon: "📊" },
  { type: "contradiction", text: "Contradiction: India GDP growth (7.2% vs 6.8%)", time: "22 min ago", icon: "⚠️" },
  { type: "anomaly", text: "Anomaly: Unusual spike in South China Sea mentions", time: "35 min ago", icon: "🔍" },
  { type: "entity", text: "New entity: Quad Summit 2026 (Geopolitics)", time: "1h ago", icon: "🆕" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto bg-slate-50/30 min-h-screen">
      {/* Top Header Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex bg-white rounded-lg p-0.5 shadow-sm border border-slate-100">
          {["OVERVIEW", "INGESTION", "SYSTEM HEALTH"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-md text-[11px] font-black transition-all flex items-center gap-1.5",
                activeTab === tab
                  ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Globe2} label="Total Entities" value="46,515" variant="teal" />
        <StatCard icon={TrendingUp} label="Ingestion Rate" value="142/min" variant="teal" />
        <StatCard icon={AlertTriangle} label="Active Alerts" value="7" variant="orange" />
        <StatCard icon={Shield} label="Credibility Avg" value="0.78" variant="teal" />
      </div>

      {/* Domain Cards Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Intelligence Domains</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOMAIN_CARDS.map((domain) => (
            <div
              key={domain.name}
              className="sl-card p-4 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-xl", domain.color + "/10")}>
                  {domain.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                    {domain.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">{domain.entities.toLocaleString()} entities</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                  +{domain.newToday} today
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] font-medium text-slate-500 truncate">
                  Trending: {domain.trending}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What's New Panel */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">What&apos;s New (Last 24h)</h2>
        <div className="sl-card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {RECENT_CHANGES.map((change, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <span className="text-lg">{change.icon}</span>
                <span className="text-sm text-slate-700 flex-1">{change.text}</span>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{change.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
