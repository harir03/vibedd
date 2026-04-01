"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart2,
    Search,
    MessageSquare,
    Globe2,
    AlertTriangle,
    Database,
    FileText,
    ClipboardList,
    Settings,
    HelpCircle,
    Activity,
    Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { name: "Dashboard", icon: BarChart2, href: "/" },
    { name: "Graph Explorer", icon: Globe2, href: "/graph-explorer" },
    { name: "Ask TATVA", icon: MessageSquare, href: "/ask-tatva" },
    { name: "Domains", icon: Search, href: "/domains" },
    { name: "Alerts", icon: AlertTriangle, href: "/alerts" },
    { name: "Sources", icon: Database, href: "/sources" },
    { name: "Reports", icon: FileText, href: "/reports" },
    { name: "Audit Log", icon: ClipboardList, href: "/audit" },
    { name: "Watchlist", icon: Eye, href: "/watchlist" },
];

const footerItems = [
    { name: "System Health", icon: Activity, href: "/system-health" },
    { name: "Settings", icon: Settings, href: "/settings" },
    { name: "Help & Docs", icon: HelpCircle, href: "/docs" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-screen overflow-hidden">
            <div className="h-16 flex items-center px-6 gap-3 flex-shrink-0 bg-white border-b border-slate-100">
                <div className="w-8 h-8 flex items-center justify-center text-2xl">
                    🔱
                </div>
                <span className="text-slate-800 font-bold text-lg tracking-tight">TATVA</span>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <div className="px-3 mb-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all mb-1 group",
                                    isActive
                                        ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 shrink-0",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                                )} />
                                <span className="flex-1">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-auto pt-8 border-t border-slate-200 px-3">
                    <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">TATVA v0.1</p>
                    {footerItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <item.icon className="w-4 h-4 text-slate-400" />
                            {item.name}
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    );
}
