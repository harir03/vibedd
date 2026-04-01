// [ARIA] Natural Language Query page — chat-style interface for querying alerts.
// Feature 16: Users type NL questions, system maps them to MongoDB queries.
// Pre-built suggestion chips, scrollable chat area, mini-tables in responses.
// POSTs to /api/query for deterministic keyword-based query resolution.

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    Search,
    Send,
    Loader2,
    Info,
    MessageCircle,
    Sparkles,
    X,
} from "lucide-react";

export const dynamic = "force-dynamic";

// [ARIA] Pre-built query suggestions shown as clickable chips
const SUGGESTIONS = [
    "Show all critical alerts from today",
    "Top 10 attacked endpoints this week",
    "SQLi attacks in the last 24 hours",
    "Most active attacker IPs",
    "False positive rate by detection source",
    "Blocked requests",
    "Open incidents",
    "How many alerts total",
] as const;

// [ARIA] Message type for the chat display
interface ChatMessage {
    id: string;
    role: "user" | "system";
    content: string;
    timestamp: Date;
    // [ARIA] System responses include structured data
    data?: {
        interpretation?: string;
        results?: Record<string, unknown>[];
        resultType?: "table" | "stat" | "list";
        suggestions?: string[];
    };
    loading?: boolean;
}

export default function QueryPage() {
    // [ARIA] State: chat messages, input, loading, tooltip
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // [ARIA] Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // [ARIA] Send query to the API
    const sendQuery = useCallback(async (queryText: string) => {
        const trimmed = queryText.trim();
        if (!trimmed || loading) return;

        // [ARIA] Add user message to chat
        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: trimmed,
            timestamp: new Date(),
        };

        // [ARIA] Add loading placeholder for system response
        const loadingMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            role: "system",
            content: "",
            timestamp: new Date(),
            loading: true,
        };

        setMessages((prev) => [...prev, userMsg, loadingMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: trimmed }),
            });

            const json = await res.json();

            // [ARIA] Replace loading message with actual response
            const sysMsg: ChatMessage = {
                id: loadingMsg.id,
                role: "system",
                content: json.interpretation ?? "Query processed",
                timestamp: new Date(),
                data: {
                    interpretation: json.interpretation,
                    results: json.results ?? [],
                    resultType: json.resultType ?? "list",
                    suggestions: json.suggestions,
                },
            };

            setMessages((prev) =>
                prev.map((m) => (m.id === loadingMsg.id ? sysMsg : m))
            );
        } catch (err) {
            // [ARIA] Replace loading message with error
            const errMsg: ChatMessage = {
                id: loadingMsg.id,
                role: "system",
                content: `Error: ${err instanceof Error ? err.message : "Failed to process query"}`,
                timestamp: new Date(),
            };
            setMessages((prev) =>
                prev.map((m) => (m.id === loadingMsg.id ? errMsg : m))
            );
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }, [loading]);

    // [ARIA] Handle form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendQuery(input);
    };

    // [ARIA] Handle suggestion chip click
    const handleSuggestion = (suggestion: string) => {
        sendQuery(suggestion);
    };

    // [ARIA] Clear chat history
    const handleClear = () => {
        setMessages([]);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
            {/* [ARIA] Page header with title and info tooltip */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-800">Natural Language Query</h1>
                    <div
                        className="relative"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <Info className="w-4 h-4 text-slate-400 cursor-help" />
                        {showTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-800 text-white text-[10px] font-medium rounded-lg shadow-xl z-50 pointer-events-none">
                                Ask questions in plain English. The system maps your query to database
                                aggregations deterministically — no LLM latency.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-slate-800" />
                            </div>
                        )}
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                        <X className="w-3 h-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* [ARIA] Suggestion chips — shown when chat is empty or always at top */}
            <div className="flex flex-wrap gap-2 mb-4">
                {SUGGESTIONS.map((suggestion) => (
                    <button
                        key={suggestion}
                        onClick={() => handleSuggestion(suggestion)}
                        disabled={loading}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border",
                            "bg-white border-gray-200 text-slate-600",
                            "hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200",
                            loading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Sparkles className="w-3 h-3 inline mr-1 -mt-0.5" />
                        {suggestion}
                    </button>
                ))}
            </div>

            {/* [ARIA] Chat area — scrollable message list */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[400px] max-h-[calc(100vh-280px)]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* [ARIA] Empty state */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <MessageCircle className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-sm font-medium text-slate-400">Ask a question about your security data</p>
                            <p className="text-[11px] text-slate-300 mt-1">
                                Try clicking a suggestion chip above, or type your own query
                            </p>
                        </div>
                    )}

                    {/* [ARIA] Message bubbles */}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[85%] rounded-xl px-4 py-3",
                                    msg.role === "user"
                                        ? "bg-teal-500 text-white"
                                        : "bg-slate-50 border border-gray-100 text-gray-800"
                                )}
                            >
                                {/* [ARIA] Loading indicator — typing dots */}
                                {msg.loading ? (
                                    <div className="flex items-center gap-1.5 py-1">
                                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                ) : (
                                    <>
                                        {/* [ARIA] Message text */}
                                        <p className={cn(
                                            "text-xs font-medium",
                                            msg.role === "user" ? "text-white" : "text-gray-700"
                                        )}>
                                            {msg.content}
                                        </p>

                                        {/* [ARIA] System response data — mini-table */}
                                        {msg.data?.results && (msg.data.results.length ?? 0) > 0 && (
                                            <div className="mt-3 overflow-x-auto">
                                                <MiniResultTable
                                                    results={msg.data.results}
                                                    resultType={msg.data.resultType ?? "table"}
                                                />
                                            </div>
                                        )}

                                        {/* [ARIA] Show suggestions if returned by API */}
                                        {msg.data?.suggestions && (msg.data.suggestions.length ?? 0) > 0 && (
                                            <div className="mt-3 space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Try these queries:</p>
                                                {msg.data.suggestions.map((s, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSuggestion(s)}
                                                        disabled={loading}
                                                        className="block text-[11px] text-teal-600 hover:text-teal-800 font-medium transition-colors"
                                                    >
                                                        &rarr; {s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* [ARIA] No results message */}
                                        {msg.data && (msg.data.results?.length ?? 0) === 0 && !msg.data.suggestions && (
                                            <p className="mt-1 text-[10px] text-slate-400">No results found.</p>
                                        )}
                                    </>
                                )}

                                {/* [ARIA] Timestamp */}
                                {!msg.loading && (
                                    <p className={cn(
                                        "text-[9px] mt-1.5",
                                        msg.role === "user" ? "text-teal-200" : "text-slate-300"
                                    )}>
                                        {msg.timestamp.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* [ARIA] Scroll anchor */}
                    <div ref={chatEndRef} />
                </div>

                {/* [ARIA] Input bar at bottom */}
                <form
                    onSubmit={handleSubmit}
                    className="border-t border-gray-100 p-3 flex items-center gap-2"
                >
                    <Search className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your security data..."
                        disabled={loading}
                        className={cn(
                            "flex-1 text-xs text-gray-700 placeholder-slate-300 bg-transparent outline-none",
                            loading && "opacity-50"
                        )}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                            input.trim() && !loading
                                ? "bg-teal-500 text-white hover:bg-teal-600"
                                : "bg-gray-100 text-gray-300 cursor-not-allowed"
                        )}
                    >
                        {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Send className="w-3.5 h-3.5" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

// [ARIA] Mini result table component — renders structured data inside chat bubbles
function MiniResultTable({
    results,
    resultType,
}: {
    results: Record<string, unknown>[];
    resultType: string;
}) {
    if (!results || results.length === 0) return null;

    // [ARIA] Extract column headers from first result object
    const columns = Object.keys(results[0]).filter(
        (k) => k !== "_id" && k !== "__v"
    );

    // [ARIA] For 'stat' type, render as key-value pairs
    if (resultType === "stat") {
        return (
            <div className="space-y-1.5">
                {results.map((row, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">
                            {row.metric != null ? String(row.metric) : row.severity != null ? String(row.severity) : `Item ${i + 1}`}
                        </span>
                        <span className="font-bold text-gray-800">
                            {row.value != null ? String(row.value) : row.count != null ? String(row.count) : "—"}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    // [ARIA] For 'table' and 'list' types, render as a mini table
    return (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50">
                        {columns.map((col) => (
                            <th
                                key={col}
                                className="px-2 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap"
                            >
                                {col.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {results.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                            {columns.map((col) => (
                                <td key={col} className="px-2 py-1 text-[10px] text-gray-700 whitespace-nowrap max-w-[160px] truncate">
                                    {formatCellValue(row[col])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {results.length > 20 && (
                <div className="px-2 py-1 text-[9px] text-slate-400 text-center bg-gray-50 border-t border-gray-100">
                    Showing 20 of {results.length} results
                </div>
            )}
        </div>
    );
}

// [ARIA] Format cell values for display — handles dates, numbers, objects
function formatCellValue(value: unknown): string {
    if (value == null) return "—";
    if (typeof value === "number") return value.toLocaleString();
    if (typeof value === "string") {
        // [ARIA] Detect ISO date strings and format them
        if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
            try {
                return new Date(value).toLocaleString(undefined, {
                    month: "short", day: "2-digit",
                    hour: "2-digit", minute: "2-digit", hour12: false,
                });
            } catch { return value; }
        }
        return value;
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}
