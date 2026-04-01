"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const sections = [
    { id: "introduction", title: "Introduction" },
    { id: "how-aria-works", title: "How ARIA Works" },
    { id: "core-features", title: "Core Features" },
    { id: "architecture-overview", title: "Architecture Overview" },
    { id: "quick-start", title: "Quick Start" },
    { id: "integration-overview", title: "Integration Overview" },
    { id: "enforcement-modes", title: "Enforcement Modes" },
    { id: "developer-dashboard", title: "Developer Dashboard" },
    { id: "security-privacy", title: "Security & Privacy" },
    { id: "references", title: "Research References" },
    { id: "faqs", title: "FAQs" },
];

export function DocsSidebar({ className }: { className?: string }) {
    const [activeSection, setActiveSection] = useState<string>("introduction");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: "-20% 0px -35% 0px" }
        );

        sections.forEach((section) => {
            const element = document.getElementById(section.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <aside className={cn("hidden lg:block w-64 shrink-0 py-8 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto pr-6", className)}>
            <div className="space-y-6">
                <div className="space-y-2">
                    <h4 className="font-semibold text-lg tracking-tight">Documentation</h4>
                    <nav className="flex flex-col space-y-1">
                        {sections.map((section) => (
                            <Link
                                key={section.id}
                                href={`#${section.id}`}
                                className={cn(
                                    "block px-2 py-1.5 text-sm font-medium transition-colors hover:text-foreground",
                                    activeSection === section.id
                                        ? "text-primary border-l-2 border-primary -ml-px pl-3.5"
                                        : "text-muted-foreground hover:border-l-2 hover:border-muted-foreground/50 hover:-ml-px hover:pl-3.5"
                                )}
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                                    setActiveSection(section.id);
                                }}
                            >
                                {section.title}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </aside>
    );
}
