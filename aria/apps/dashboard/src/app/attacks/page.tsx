"use client";

import React, { useState } from "react";
import { SecurityFilters } from "@/components/security/SecurityFilters";
import { SecurityTable } from "@/components/security/SecurityTable";
import { formatLocalTime } from "@/lib/utils";

const mockEvents = [
    { ip: "180.93.228.84", country: "Vietnam", apps: "http://47.242.104.253/", count: 1, duration: "0 minutes", time: "2026-01-24 19:19:20" },
    { ip: "180.93.228.84", country: "Vietnam", apps: "http://47.242.104.253/", count: 1, duration: "0 minutes", time: "2026-01-24 18:59:47" },
    { ip: "170.64.130.96", country: "Australia", apps: "https://47.242.104.253/", count: 1, duration: "0 minutes", time: "2026-01-24 18:31:39" },
    { ip: "152.56.3.8", country: "India", apps: "https://demo.aria-security.com:10084/", count: 4, duration: "3 minutes", time: "2026-01-24 15:26:18" },
    { ip: "170.64.130.96", country: "Australia", apps: "http://47.242.104.253/", count: 1, duration: "0 minutes", time: "2026-01-24 14:13:07" },
    { ip: "14.2.106.61", country: "Australia", apps: "https://demo.aria-security.com:10084/", count: 5, duration: "1 minutes", time: "2026-01-24 10:39:14" },
    { ip: "185.187.78.200", country: "Iraq", apps: "https://demo.aria-security.com:10084/", count: 1, duration: "0 minutes", time: "2026-01-24 04:13:41" },
];

const mockLogs = [
    { url: "http://47.242.104.253/vendor/phpunit/src/Util/PHP/eval-stdin.php", type: "Code Inj", ip: "180.93.228.84", country: "Vietnam", time: "2026-01-24 19:19:20" },
    { url: "http://47.242.104.253/vendor/phpunit/src/Util/PHP/eval-stdin.php", type: "Code Inj", ip: "180.93.228.84", country: "Vietnam", time: "2026-01-24 18:59:47" },
    { url: "https://47.242.104.253/.git/config", type: "Leaking", ip: "170.64.130.96", country: "Australia", time: "2026-01-24 18:31:39" },
    { url: "https://demo.aria-security.com:10084/hello.html?payload=1+and+1%3D1", type: "SQL Inj", ip: "152.56.3.8", country: "India", time: "2026-01-24 15:27:42" },
];

export default function AttacksPage() {
    const [view, setView] = useState<"EVENTS" | "LOGS">("EVENTS");
    const [data, setData] = useState<any[]>([]);

    // Pagination & Filter State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<any>({});

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                let url = "";
                const params = new URLSearchParams();
                params.set("page", page.toString());
                params.set("limit", "20");

                if (filters.search) params.set("search", filters.search);
                if (filters.from) params.set("from", filters.from);
                if (filters.to) params.set("to", filters.to);

                if (view === "EVENTS") {
                    url = `/api/events?action=BLOCKED&${params.toString()}`;
                } else {
                    // [ARIA] REMOVED: Old Log-based fetch with HTTP status codes
                    // url = `/api/logs?status=467,468,403,429&${params.toString()}`;
                    // [ARIA] NEW: Fetch blocked/escalated alerts from Alert model
                    url = `/api/alerts?decision=block,escalate&${params.toString()}`;
                    if (filters.severity) params.set("severity", filters.severity);
                    if (filters.triageStatus) params.set("triageStatus", filters.triageStatus);
                    url = `/api/alerts?decision=block,escalate&${params.toString()}`;
                }

                const res = await fetch(url);
                if (res.ok) {
                    const response = await res.json();

                    const rawData = response.data || response;
                    const meta = response.meta || { totalPages: 1 };

                    setTotalPages(meta.totalPages || 1);

                    if (view === "EVENTS") {
                        const transformed = rawData.map((e: any) => ({
                            ip: e.ip,
                            country: "Unknown",
                            apps: "demo.aria-security.com",
                            count: 1,
                            duration: "0 minutes",
                            time: formatLocalTime(e.time || e.createdAt)
                        }));
                        setData(transformed);
                    } else {
                        // [ARIA] REMOVED: Old Log-based transform with HTTP status codes
                        // const transformed = rawData.map((l: any) => ({
                        //     id: l.id || l._id,
                        //     url: l.uri,
                        //     method: l.method,
                        //     type: l.attackType || "MAF Block",
                        //     action: "BLOCKED",
                        //     analysis: l.aiAnalysis,
                        //     ip: l.ip,
                        //     country: "Unknown",
                        //     time: formatLocalTime(l.time || l.createdAt)
                        // }));
                        // [ARIA] NEW: Alert-based transform with fidelity, severity, triage, detection source
                        const transformed = rawData.map((l: any) => ({
                            id: l.id || l._id,
                            url: l.uri,
                            method: l.method,
                            type: l.attackType || "Unknown",
                            action: (l.decision || 'pending').toUpperCase(),
                            analysis: l.aiAnalysis,
                            fidelityScore: l.fidelityScore,
                            fidelityBreakdown: l.fidelityBreakdown,
                            severity: l.severity,
                            triageStatus: l.triageStatus,
                            detectionSource: l.detectionSource,
                            regexMatches: l.regexMatches,
                            ip: l.ip,
                            country: l.country || "Unknown",
                            time: formatLocalTime(l.time || l.createdAt)
                        }));
                        setData(transformed);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch attack data", e);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [view, page, filters]);

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        setPage(1);
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <SecurityFilters
                view={view}
                onViewChange={setView}
                pageType="ATTACKS"
                onFilterChange={handleFilterChange}
            />
            <SecurityTable
                view={view}
                data={data}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}
