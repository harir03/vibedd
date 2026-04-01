"use client";

import { SlideIn } from "@/components/ui/effects/slide-in";
import { Badge } from "@/components/ui/primitives/badge";
import { cn } from "@/lib/utils";

const features = [
    {
        id: 1,
        title: "Cinematic Motion",
        description: "Scroll-driven animations that feel like a movie, not a website. Every pixel has a purpose.",
        badge: "Motion",
    },
    {
        id: 2,
        title: "Developer First",
        description: "Built with the tools you love. React, Tailwind, and GSAP. Type-safe and production ready.",
        badge: "Tech",
    },
    {
        id: 3,
        title: "Accessible",
        description: "Inclusive by design. Keyboard navigation, screen readers, and reduced motion support built-in.",
        badge: "A11y",
    },
];

export function FeatureStory() {
    return (
        <section className="relative w-full bg-muted/20 py-24">
            <div className="container mx-auto px-6">
                <div className="flex flex-col gap-24">
                    {features.map((feature, index) => (
                        <SlideIn
                            key={feature.id}
                            delay={index * 100}
                            className="w-full max-w-2xl mx-auto flex flex-col items-center text-center"
                        >
                            <Badge variant="outline" className="mb-4 font-mono text-xs">{feature.badge}</Badge>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                {feature.title}
                            </h2>
                            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </SlideIn>
                    ))}
                </div>
            </div>
        </section>
    );
}
