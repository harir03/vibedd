"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/primitives/avatar";
import { User } from "lucide-react";
import { SlideIn } from "@/components/ui/effects/slide-in";

const testimonials = [
    {
        name: "Alex Chen",
        role: "Staff Engineer @ FinTech Co",
        content: "ARIA caught a credential stuffing attack on day one that our WAF completely missed. The context-aware blocking is a game changer.",
    },
    {
        name: "Sarah Jenkins",
        role: "CTO @ StartupX",
        content: "Integrating the SDK took less than 30 minutes. We finally have visibility into API abuse without slowing down our velocity.",
    },
    {
        name: "David Ross",
        role: "DevSecOps Lead",
        content: "The audit logs are pristine. Being able to trace exactly why a request was blocked makes compliance reviews 10x faster.",
    }
];

export function Testimonials() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="container mx-auto px-6">
                <SlideIn>
                    <h2 className="text-3xl font-bold tracking-tight text-center mb-16">
                        Loved by Engineering Teams
                    </h2>
                </SlideIn>
                <div className="grid md:grid-cols-3 gap-6">
                    {testimonials.map((t, index) => (
                        <SlideIn key={t.name} delay={index * 100} className="h-full">
                            <Card className="bg-background/40 border-border/50 h-full">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Avatar>
                                        <AvatarFallback className="bg-primary/10 text-primary border border-primary/20">
                                            <User className="h-5 w-5" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{t.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground">{t.role}</p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground italic">"{t.content}"</p>
                                </CardContent>
                            </Card>
                        </SlideIn>
                    ))}
                </div>
            </div>
        </section>
    );
}
