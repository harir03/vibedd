"use client";

import { SlideIn } from "@/components/ui/effects/slide-in";
import { Badge } from "@/components/ui/primitives/badge";
import { cn } from "@/lib/utils";
import {FileLock, Fingerprint, Bot } from "lucide-react"; // Icons for use cases

const capabilities = [
    {
        id: 1,
        title: "Session Hijacking & Replay",
        description: "Detects inconsistencies in cookie signatures and IP variance. Prevents attackers from using stolen auth tokens.",
        badge: "Identity Defense",
        icon: <Fingerprint className="w-full h-full " />
    },
    {
        id: 2,
        title: "Credential Stuffing",
        description: "Identifies and blocks high-velocity login attempts across distributed request sources. Protects user accounts from takeover.",
        badge: "Auth Security",
        icon: <FileLock className="w-full h-full " />
    },
    {
        id: 3,
        title: "API Abuse & Automation",
        description: "Rate limits malicious bots based on behavioral fingerprints, not just IP addresses. Stops scrapers and brute-force agents.",
        badge: "Bot Mitigation",
        icon: <Bot className="w-full h-full " />
    },
];

export function CoreCapabilities() {
    return (
        <section id="use-cases" className="relative w-full bg-background border-t border-border/10 py-24">
            <div className="container mx-auto px-6">
                <div className="flex flex-col gap-24">
                    {capabilities.map((cap, index) => (
                        <SlideIn
                            key={cap.id}
                            direction={index % 2 === 0 ? "left" : "right"}
                            className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-24"
                        >
                            {/* Visual Part (Left/Top) */}
                            <div className="flex-1 w-full flex justify-center md:justify-end">
                                <div className="h-48 w-48 md:h-80 md:w-80 rounded-2xl bg-black backdrop-opacity-65 from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center p-12 shadow-2xl">
                                    {cap.icon}
                                </div>
                            </div>

                            {/* Text Part (Right/Bottom) */}
                            <div className="flex-1 w-full text-center md:text-left">
                                <Badge variant="secondary" className="mb-4">{cap.badge}</Badge>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-foreground">
                                    {cap.title}
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    {cap.description}
                                </p>
                            </div>
                        </SlideIn>
                    ))}
                </div>
            </div>
        </section>
    );
}
