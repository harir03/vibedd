"use client";

import { Search, Zap } from "lucide-react";

const DOMAINS = [
  {
    name: "Geopolitics",
    icon: "🌍",
    color: "border-blue-500",
    bgColor: "bg-blue-50",
    description: "International relations, diplomacy, alliances, treaties, sanctions, and territorial disputes.",
    entityCount: 12847,
    recentEvents: 42,
  },
  {
    name: "Economics",
    icon: "📈",
    color: "border-green-500",
    bgColor: "bg-green-50",
    description: "Trade agreements, GDP metrics, market trends, financial systems, and economic policies.",
    entityCount: 9234,
    recentEvents: 38,
  },
  {
    name: "Defense",
    icon: "🛡️",
    color: "border-red-500",
    bgColor: "bg-red-50",
    description: "Military capabilities, defense procurement, strategic assets, and security operations.",
    entityCount: 7892,
    recentEvents: 25,
  },
  {
    name: "Technology",
    icon: "💻",
    color: "border-purple-500",
    bgColor: "bg-purple-50",
    description: "Space programs, cyber capabilities, AI developments, semiconductor industry, and patents.",
    entityCount: 6543,
    recentEvents: 67,
  },
  {
    name: "Climate",
    icon: "🌡️",
    color: "border-orange-500",
    bgColor: "bg-orange-50",
    description: "Environmental treaties, climate change impact, resource scarcity, and sustainability.",
    entityCount: 4321,
    recentEvents: 18,
  },
  {
    name: "Society",
    icon: "👥",
    color: "border-yellow-500",
    bgColor: "bg-yellow-50",
    description: "Demographics, migration, education, public health, and cultural developments.",
    entityCount: 5678,
    recentEvents: 31,
  },
];

export default function DomainsPage() {
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto min-h-screen">
      {/* Search */}
      <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 border border-slate-200 shadow-sm max-w-lg">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter domains..."
          className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
          readOnly
        />
      </div>

      {/* Domain Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DOMAINS.map((domain) => (
          <div
            key={domain.name}
            className={`bg-white rounded-xl border-l-4 ${domain.color} border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${domain.bgColor} flex items-center justify-center text-2xl flex-shrink-0`}>
                {domain.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800 group-hover:text-teal-700 transition-colors mb-1">
                  {domain.name}
                </h3>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{domain.description}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">
                    <span className="font-bold text-slate-700">{domain.entityCount.toLocaleString()}</span> entities
                  </span>
                  <span className="flex items-center gap-1 text-xs text-emerald-500">
                    <Zap className="w-3 h-3" />
                    <span className="font-bold">+{domain.recentEvents}</span> today
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
