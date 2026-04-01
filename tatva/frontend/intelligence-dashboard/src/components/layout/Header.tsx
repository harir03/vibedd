"use client";

import { Power, ChevronRight, Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";

const pageNames: Record<string, string> = {
    "/": "Intelligence Dashboard",
    "/graph-explorer": "Graph Explorer",
    "/ask-tatva": "Ask TATVA",
    "/domains": "Domains",
    "/alerts": "Alerts & Anomalies",
    "/sources": "Data Sources",
    "/reports": "Reports",
    "/audit": "Audit Log",
    "/watchlist": "Entity Watchlist",
    "/settings": "Settings",
    "/system-health": "System Health",
};

export function Header() {
    const pathname = usePathname();
    const pageName = pageNames[pathname] || "TATVA";

    return (
        <div className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-slate-800 font-bold text-sm whitespace-nowrap">TATVA</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <span className="text-slate-500 font-medium text-sm whitespace-nowrap">{pageName}</span>
            </div>

            <div className="flex items-center gap-2">
                {/* NL Query Quick Search */}
                <div className="hidden md:flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 mr-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Ask TATVA anything..."
                        className="bg-transparent text-sm text-slate-600 placeholder:text-slate-400 outline-none w-48"
                        readOnly
                    />
                </div>

                {/* Panel Toggle Stub (Live/Mock) */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 mr-2">
                    <button className="px-3 py-1.5 rounded-md text-[10px] font-black bg-emerald-500 text-white">
                        🟢 LIVE
                    </button>
                    <button className="px-3 py-1.5 rounded-md text-[10px] font-black text-slate-400 hover:text-slate-600">
                        🔵 MOCK
                    </button>
                </div>

                <button
                    className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer relative"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                <button
                    onClick={() => alert("Logout clicked")}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                >
                    <Power className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
