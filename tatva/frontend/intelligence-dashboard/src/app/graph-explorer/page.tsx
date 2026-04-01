"use client";

import { Globe2, Search, Filter, Maximize2 } from "lucide-react";

export default function GraphExplorerPage() {
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto min-h-screen">
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-lg px-4 py-3 border border-slate-200 shadow-sm">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search entities by name, alias, or type..."
            className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
            readOnly
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <Filter className="w-4 h-4" />
          Filters
        </button>
        <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <Maximize2 className="w-4 h-4" />
          Fullscreen
        </button>
      </div>

      {/* Graph Canvas Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm" style={{ height: "calc(100vh - 200px)" }}>
        <div className="flex flex-col items-center justify-center h-full text-center p-12">
          <Globe2 className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="text-slate-600 text-lg font-bold mb-2">Knowledge Graph Explorer</h3>
          <p className="text-slate-400 text-sm max-w-md">
            Interactive graph visualization powered by Cytoscape.js will be implemented in Tier 1.
            Explore entities, relationships, and discover hidden connections across intelligence domains.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full bg-blue-500" /> Geopolitics
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full bg-green-500" /> Economics
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full bg-red-500" /> Defense
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full bg-purple-500" /> Technology
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full bg-orange-500" /> Climate
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full bg-yellow-500" /> Society
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
