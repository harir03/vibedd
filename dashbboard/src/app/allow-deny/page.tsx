"use client";

import { useState } from "react";
import { SecurityFilters } from "@/components/security/SecurityFilters";
import { SecurityTable } from "@/components/security/SecurityTable";

const mockEvents = [
    { ip: "116.62.147.32", country: "China", apps: "https://demo.maf.chaitin.com/", count: 1, duration: "0 minutes", time: "2026-01-23 23:09:54" },
    { ip: "116.62.147.32", country: "China", apps: "http://47.242.104.253/", count: 4, duration: "1 minutes", time: "2026-01-23 23:09:51" },
    { ip: "116.62.147.32", country: "China", apps: "https://demo.maf.chaitin.com:8443/", count: 2, duration: "0 minutes", time: "2026-01-23 23:09:27" },
    { ip: "116.62.147.32", country: "China", apps: "https://demo.maf.chaitin.com:10085/", count: 14, duration: "1 minutes", time: "2026-01-23 23:09:10" },
];

const mockLogs = [
    { url: "https://demo.maf.chaitin.com/", type: "Deny Rule", ip: "116.62.147.32", country: "China", time: "2026-01-23 23:09:54" },
    { url: "http://47.242.104.253/.svn/entries", type: "Deny Rule", ip: "116.62.147.32", country: "China", time: "2026-01-23 23:09:53" },
    { url: "http://47.242.104.253/", type: "Deny Rule", ip: "116.62.147.32", country: "China", time: "2026-01-23 23:09:53" },
];

export default function AllowDenyPage() {
    const [view, setView] = useState<"EVENTS" | "LOGS">("EVENTS");
    const [page, setPage] = useState(1);
    const [totalPages] = useState(1);

    const data = view === "EVENTS" ? mockEvents : mockLogs;

    const handleFilterChange = (_newFilters: any) => {
        setPage(1);
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <SecurityFilters
                view={view}
                onViewChange={setView}
                pageType="ALLOW_DENY"
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
