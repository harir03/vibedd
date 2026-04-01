"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Info, HelpCircle } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: any;
    iconLabel?: string;
    variant?: "teal" | "orange" | "red" | "gray";
}

const TOOLTIP_TEXTS: Record<string, string> = {
    "Total Entities": "Total number of entities tracked across all domains in the knowledge graph.",
    "Ingestion Rate": "Average number of documents ingested per minute from all connected sources.",
    "Active Alerts": "Number of unacknowledged alerts triggered by anomaly detection or watchlist rules.",
    "NLP Accuracy": "Average confidence score of the NLP entity extraction pipeline.",
    "Credibility Avg": "Mean credibility score across all facts in the knowledge graph.",
    "Active Sources": "Number of data sources currently online and ingesting data.",
    "Graph Nodes": "Total number of nodes (entities) in the Neo4j knowledge graph.",
    "Graph Edges": "Total number of relationships between entities in the knowledge graph.",
    "New Today": "Entities discovered and added to the graph in the last 24 hours.",
    "Contradictions": "Number of detected contradictions between sources awaiting review.",
};

export function StatCard({ label, value, subValue, icon: Icon, iconLabel, variant = "teal" }: StatCardProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="sl-card p-3 flex flex-col gap-2 relative transition-all hover:shadow-md h-[112px] bg-white group">
            <div className="flex items-center justify-between">
                <div
                    className="flex items-center gap-1 min-w-0 relative"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap cursor-help transition-colors group-hover:text-slate-600">{label}</span>
                    <HelpCircle className="w-3 h-3 text-slate-200 flex-shrink-0 cursor-help" />

                    {/* Simple Tooltip */}
                    {showTooltip && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] font-bold rounded-lg shadow-xl z-[100] animate-in fade-in slide-in-from-bottom-1 border border-slate-700 pointer-events-none">
                            {TOOLTIP_TEXTS[label] || "Description for " + label}
                            <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-800" />
                        </div>
                    )}
                </div>

                <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center transition-all group-hover:scale-110",
                    variant === "orange" ? "bg-orange-50" : variant === "red" ? "bg-red-50" : "bg-teal-50"
                )}>
                    {Icon ? (
                        <Icon className={cn(
                            "w-3.5 h-3.5",
                            variant === "orange" ? "text-orange-400" : variant === "red" ? "text-red-400" : "text-teal-400"
                        )} strokeWidth={3} />
                    ) : iconLabel ? (
                        <span className={cn(
                            "text-[8px] font-black leading-none",
                            variant === "orange" ? "text-orange-400" : "text-teal-400"
                        )}>{iconLabel}</span>
                    ) : null}
                </div>
            </div>

            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</span>
                {subValue && (
                    <span className="text-[11px] font-bold text-slate-400">{subValue}</span>
                )}
            </div>
        </div>
    );
}
