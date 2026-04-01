"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { BrainCircuit, Database, HeadphonesIcon } from "lucide-react";
import { SlideIn } from "@/components/ui/effects/slide-in";

export function PricingAddons() {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-6 max-w-6xl">
                 <SlideIn>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Optional Add-ons</h2>
                        <p className="text-muted-foreground">Enhance your security stack with specialized modules.</p>
                    </div>
                </SlideIn>

                <div className="grid md:grid-cols-3 gap-6">
                    <SlideIn delay={100} className="h-full">
                        <Card className="h-full border-border/40 hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <BrainCircuit className="h-8 w-8 text-primary mb-4" />
                                <CardTitle>AI Risk Adapter</CardTitle>
                                <CardDescription>Usage-based pricing</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Plug in your own AI models or use advanced behavioral analysis for zero-day threat detection.
                                </p>
                                <div className="text-sm font-medium">From $20/month + usage</div>
                            </CardContent>
                        </Card>
                    </SlideIn>

                    <SlideIn delay={200} className="h-full">
                        <Card className="h-full border-border/40 hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <Database className="h-8 w-8 text-primary mb-4" />
                                <CardTitle>Audit Log Anchoring</CardTitle>
                                <CardDescription>Blockchain Verification</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Cryptographically anchor audit logs to a public ledger for immutable proof of integrity.
                                </p>
                                <div className="text-sm font-medium">Contact Sales</div>
                            </CardContent>
                        </Card>
                    </SlideIn>

                    <SlideIn delay={300} className="h-full">
                        <Card className="h-full border-border/40 hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <HeadphonesIcon className="h-8 w-8 text-primary mb-4" />
                                <CardTitle>Premium Support</CardTitle>
                                <CardDescription>24/7 SLA</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Get dedicated onboarding, priority ticket resolution, and 24/7 emergency response.
                                </p>
                                <div className="text-sm font-medium">From $500/month</div>
                            </CardContent>
                        </Card>
                    </SlideIn>
                </div>
            </div>
        </section>
    );
}
