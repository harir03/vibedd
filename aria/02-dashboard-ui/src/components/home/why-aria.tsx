"use client";

import { SlideIn } from "@/components/ui/effects/slide-in";
import { Badge } from "@/components/ui/primitives/badge";
import { cn } from "@/lib/utils";

const slides = [
    {
        id: 1,
        title: "1. Request Interception",
        subtitle: "Every request is paused before execution. We analyze headers, payload, and fingerprint against session history in Redis.",
        badge: "Ingestion",
    },
    {
        id: 2,
        title: "2. Limit & Risk Scoring",
        subtitle: "Deterministic rules evaluate velocity and entropy. AI agents flag high-risk anomalies for deeper inspection.",
        badge: "Analysis",
    },
    {
        id: 3,
        title: "3. Enforcement & Audit",
        subtitle: "Malicious actors are blocked instantly. All decisions are logged to Postgres with optional blockchain anchoring.",
        badge: "Decision",
    },
];

export function WhyAria() {
    return (
        <section id="how-it-works" className="relative w-full py-24 border-t border-border/10">
            <div className="container mx-auto px-6">
                <div className="flex flex-col gap-24">
                    {slides.map((slide, index) => (
                        <SlideIn
                            key={slide.id}
                            delay={index * 100}
                            className="w-full max-w-4xl mx-auto flex flex-col items-center text-center"
                        >
                            <Badge variant="outline" className="mb-4 font-mono text-xs text-blue-400 border-blue-400/20">{slide.badge}</Badge>
                            <h2 className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-slate-500 dark:from-white dark:to-slate-400">
                                {slide.title}
                            </h2>
                            <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl">
                                {slide.subtitle}
                            </p>
                        </SlideIn>
                    ))}
                </div>
            </div>
        </section>
    );
}
