"use client";

import { SlideIn } from "@/components/ui/effects/slide-in";
import { useMagnetic } from "@/hooks/use-magnetic";
import { Button } from "@/components/ui/primitives/button";

export function CTA() {
    const btnRef = useMagnetic();

    return (
        <section className="py-32 border-t border-border/40 bg-gradient-to-b from-muted/10 to-background">
            <div className="container mx-auto px-6 text-center">
                <SlideIn>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                        Secure Your Backend Today
                    </h2>
                    <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
                        Integrate ARIA in minutes. Prevent 99.9% of application-layer attacks with a single SDK.
                    </p>
                    <div ref={btnRef as any} className="inline-block">
                        <Button size="lg" className="rounded-full px-10 h-12 text-base">
                            Get API Keys
                        </Button>
                    </div>
                </SlideIn>
            </div>
        </section>
    );
}
