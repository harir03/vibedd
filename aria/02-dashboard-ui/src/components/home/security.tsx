"use client";

import { Badge } from "@/components/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Lock, FileJson, Server, Activity } from "lucide-react";
import { SlideIn } from "@/components/ui/effects/slide-in";

const features = [
    {
        title: "Data Handling & Privacy",
        description: "ARIA operates as a pass-through middleware. We do not store request payloads unless explicitly configured for forensic logs. All data at rest is AES-256 encrypted.",
        icon: <Lock className="h-6 w-6 text-primary" />,
    },
    {
        title: "Immutable Audit Logs",
        description: "Every security decision (Block/Flag) is logged to a tamper-proof Postgres database. Optional blockchain anchoring ensures audit trail integrity for compliance.",
        icon: <FileJson className="h-6 w-6 text-primary" />,
    },
    {
        title: "Deployment Flexibility",
        description: "Deploy as a heavy-duty sidecar, a lightweight library, or an edge function. ARIA supports Kubernetes, AWS Lambda, and Vercel Edge Middleware.",
        icon: <Server className="h-6 w-6 text-primary" />,
    },
    {
        title: "Explainable AI",
        description: "No 'black box' blocks. Every AI-driven decision comes with a risk score breakdown and reasoning trace, accessible via the dashboard.",
        icon: <Activity className="h-6 w-6 text-primary" />,
    },
];

export function Security() {
    return (
        <section id="security" className="py-24 border-t border-border/10">
            <div className="container mx-auto px-6">
                <SlideIn>
                    <div className="flex flex-col items-center text-center mb-16">
                        <Badge variant="outline" className="mb-4 border-primary/20 text-primary">
                            Trust & Compliance
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            Built for Security-Critical Systems
                        </h2>
                        <p className="text-muted-foreground max-w-2xl">
                            We prioritize transparency, auditability, and data sovereignty.
                            Your security logic shouldn't be a mystery.
                        </p>
                    </div>
                </SlideIn>

                <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {features.map((feature, index) => (
                        <SlideIn key={feature.title} delay={index * 100} className="h-full">
                            <Card className="bg-background/50 border-border/40 h-full">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                        {feature.icon}
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </SlideIn>
                    ))}
                </div>
            </div>
        </section>
    );
}
