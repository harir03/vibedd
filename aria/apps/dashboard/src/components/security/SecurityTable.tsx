import React from "react";
import { cn } from "@/lib/utils";

// [ARIA] NEW: Color maps for decision, severity, triage status, and detection source badges
const decisionColors: Record<string, string> = {
    BLOCK: 'bg-red-500', BLOCKED: 'bg-red-500',
    ALLOW: 'bg-emerald-500', ALLOWED: 'bg-emerald-500',
    ESCALATE: 'bg-amber-500', ESCALATED: 'bg-amber-500',
    PENDING: 'bg-slate-400',
};

const severityColors: Record<string, string> = {
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-400 text-yellow-900',
    low: 'bg-blue-400 text-white',
    info: 'bg-gray-300 text-gray-700',
};

const triageColors: Record<string, string> = {
    pending: 'border-gray-300 text-gray-500 bg-gray-50',
    approved: 'border-green-300 text-green-600 bg-green-50',
    rejected: 'border-red-300 text-red-500 bg-red-50',
    'auto-resolved': 'border-blue-300 text-blue-500 bg-blue-50',
};

const detectionSourceColors: Record<string, string> = {
    regex: 'text-purple-600 bg-purple-50',
    ai: 'text-teal-600 bg-teal-50',
    both: 'text-indigo-600 bg-indigo-50',
    none: 'text-gray-500 bg-gray-50',
};

// [ARIA] NEW: Fidelity score color based on score value
function fidelityColor(score: number): string {
    if (score >= 90) return 'text-red-600 bg-red-50';
    if (score >= 70) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    if (score >= 10) return 'text-blue-600 bg-blue-50';
    return 'text-gray-500 bg-gray-50';
}

interface SecurityTableProps {
    view: "EVENTS" | "LOGS";
    data: any[];
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

export function SecurityTable({ view, data, currentPage = 1, totalPages = 1, onPageChange }: SecurityTableProps) {
    const [selectedLog, setSelectedLog] = React.useState<any>(null);

    const PaginationFooter = () => (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs">
            <span className="text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
                <button
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange?.(currentPage - 1)}
                    className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
                >
                    Previous
                </button>
                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange?.(currentPage + 1)}
                    className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
                >
                    Next
                </button>
            </div>
        </div>
    );

    if (view === "EVENTS") {
        return (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">IP Addr</th>
                                <th className="px-6 py-4">Applications</th>
                                <th className="px-6 py-4 text-center">Attack Count</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Start At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors text-xs font-medium">
                                    <td className="px-6 py-4">
                                        <div className="text-slate-800 font-bold">{row.ip}</div>
                                        <div className="text-slate-400 text-[10px]">{row.country}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{row.apps}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <div className="px-4 py-1 border border-red-200 rounded text-red-500 font-black text-[11px] bg-red-50/30">
                                                {row.count}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-800">{row.duration}</td>
                                    <td className="px-6 py-4 text-slate-800">{row.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationFooter />
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        {/* [ARIA] REMOVED: Original LOGS table headers (Action, URL, Attack Type, IP Addr, Time)
                            Replaced with ARIA-specific columns including fidelity, severity, triage status */}
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-4 py-4">Decision</th>
                                <th className="px-4 py-4">URL</th>
                                <th className="px-4 py-4">Attack Type</th>
                                <th className="px-4 py-4">Fidelity</th>
                                <th className="px-4 py-4">Severity</th>
                                <th className="px-4 py-4">Triage</th>
                                <th className="px-4 py-4">IP Addr</th>
                                <th className="px-4 py-4">Time</th>
                                <th className="px-4 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors text-xs font-medium">
                                    <td className="px-4 py-4">
                                        {/* [ARIA] NEW: Decision badge with color mapping */}
                                        <span className={cn(
                                            "px-2.5 py-1 rounded font-black text-[10px] uppercase text-white",
                                            decisionColors[row.action?.toUpperCase()] || 'bg-slate-400'
                                        )}>
                                            {row.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="max-w-[300px] truncate text-slate-600 font-mono text-[11px]">
                                            {row.method && <span className="font-bold mr-2 text-slate-800">{row.method}</span>}
                                            {row.url}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-slate-800 font-bold">{row.type || '—'}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {/* [ARIA] NEW: Fidelity score with color-coded badge */}
                                        {row.fidelityScore != null ? (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded font-black text-[11px]",
                                                fidelityColor(row.fidelityScore)
                                            )}>
                                                {row.fidelityScore}
                                            </span>
                                        ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-4 py-4">
                                        {/* [ARIA] NEW: Severity badge */}
                                        {row.severity ? (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded font-bold text-[10px] uppercase",
                                                severityColors[row.severity] || 'bg-gray-200 text-gray-600'
                                            )}>
                                                {row.severity}
                                            </span>
                                        ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-4 py-4">
                                        {/* [ARIA] NEW: Triage status badge */}
                                        {row.triageStatus ? (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded border font-bold text-[10px]",
                                                triageColors[row.triageStatus] || 'border-gray-200 text-gray-500'
                                            )}>
                                                {row.triageStatus}
                                            </span>
                                        ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-slate-800 font-bold">{row.ip}</div>
                                        <div className="text-slate-400 text-[10px]">{row.country}</div>
                                    </td>
                                    <td className="px-4 py-4 text-slate-800 whitespace-nowrap">{row.time}</td>
                                    <td className="px-4 py-4 text-right">
                                        <span
                                            onClick={() => setSelectedLog(row)}
                                            className="text-teal-500 font-black text-[10px] cursor-pointer hover:text-teal-600 uppercase tracking-wider"
                                        >
                                            Detail
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationFooter />
            </div>

            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Request Details</h3>
                                <div className="text-xs text-slate-500 mt-1 font-mono">{selectedLog.id}</div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        {/* [ARIA] REMOVED: Original detail modal body with simple Status + IP + Request + AI Analysis
                            Replaced with comprehensive ARIA alert detail view including fidelity breakdown,
                            detection source, severity, triage status, regex matches, and AI analysis */}
                        <div className="p-6 space-y-6">
                            {/* Row 1: Decision + Severity + Fidelity + Triage */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Decision</div>
                                    <span className={cn(
                                        "px-2.5 py-1 rounded font-black text-[10px] uppercase text-white inline-block",
                                        decisionColors[selectedLog.action?.toUpperCase()] || 'bg-slate-400'
                                    )}>{selectedLog.action}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Severity</div>
                                    {selectedLog.severity ? (
                                        <span className={cn(
                                            "px-2.5 py-1 rounded font-bold text-[10px] uppercase inline-block",
                                            severityColors[selectedLog.severity] || 'bg-gray-200 text-gray-600'
                                        )}>{selectedLog.severity}</span>
                                    ) : <span className="text-slate-400 text-sm">—</span>}
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fidelity</div>
                                    {selectedLog.fidelityScore != null ? (
                                        <span className={cn(
                                            "px-2.5 py-1 rounded font-black text-sm inline-block",
                                            fidelityColor(selectedLog.fidelityScore)
                                        )}>{selectedLog.fidelityScore}/100</span>
                                    ) : <span className="text-slate-400 text-sm">—</span>}
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Triage</div>
                                    {selectedLog.triageStatus ? (
                                        <span className={cn(
                                            "px-2.5 py-1 rounded border font-bold text-[10px] inline-block",
                                            triageColors[selectedLog.triageStatus] || 'border-gray-200 text-gray-500'
                                        )}>{selectedLog.triageStatus}</span>
                                    ) : <span className="text-slate-400 text-sm">—</span>}
                                </div>
                            </div>

                            {/* Row 2: IP + Detection Source */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">IP Address</div>
                                    <div className="font-bold text-slate-800 text-sm">{selectedLog.ip}</div>
                                    {selectedLog.country && <div className="text-[10px] text-slate-400 mt-0.5">{selectedLog.country}</div>}
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detection Source</div>
                                    {selectedLog.detectionSource ? (
                                        <span className={cn(
                                            "px-2.5 py-1 rounded font-bold text-[10px] uppercase inline-block",
                                            detectionSourceColors[selectedLog.detectionSource] || 'text-gray-500 bg-gray-50'
                                        )}>{selectedLog.detectionSource}</span>
                                    ) : <span className="text-slate-400 text-sm">—</span>}
                                </div>
                            </div>

                            {/* Request */}
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Request</div>
                                <div className="font-mono text-sm break-all text-slate-700">
                                    <span className="font-bold text-slate-900">{selectedLog.method}</span> {selectedLog.url}
                                </div>
                            </div>

                            {/* [ARIA] NEW: Fidelity Breakdown */}
                            {selectedLog.fidelityBreakdown && (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fidelity Breakdown</div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.entries(selectedLog.fidelityBreakdown).map(([key, val]) => (
                                            <div key={key} className="text-center p-2 bg-white rounded border border-slate-100">
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">{key}</div>
                                                <div className="text-sm font-black text-slate-800">{val as number}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* [ARIA] NEW: Regex Matches */}
                            {selectedLog.regexMatches && selectedLog.regexMatches.length > 0 && (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Regex Matches</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedLog.regexMatches.map((match: string | { pattern: string; category: string }, idx: number) => (
                                            <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold border border-purple-200">
                                                {typeof match === 'string' ? match : match.pattern}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Analysis */}
                            {selectedLog.analysis && (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">AI Analysis</div>
                                    <pre className="whitespace-pre-wrap font-mono text-xs text-slate-600 bg-white p-3 rounded border border-slate-200 shadow-sm overflow-x-auto">
                                        {selectedLog.analysis}
                                    </pre>
                                </div>
                            )}

                            {!selectedLog.analysis && !selectedLog.regexMatches?.length && (
                                <div className="text-center text-slate-400 text-sm py-4 italic">
                                    No analysis details available for this alert.
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-right">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
