"use client";

import { Check, Minus } from "lucide-react";
import { SlideIn } from "@/components/ui/effects/slide-in";

const features = [
    {
        category: "Real-Time Risk Engine",
        items: [
            { name: "Global Threat Intelligence", free: true, pro: true, team: true, ent: true },
            { name: "Device Profiling", free: false, pro: true, team: true, ent: true },
            { name: "Behavioral Analysis", free: false, pro: true, team: true, ent: true },
            { name: "Custom Risk Rules", free: "Basic", pro: "Standard", team: "Advanced", ent: "Unlimited" },
        ]
    },
    {
        category: "Session Security",
        items: [
            { name: "Session Profiling", free: false, pro: true, team: true, ent: true },
            { name: "Active Blocking", free: false, pro: true, team: true, ent: true },
            { name: "Challenge Flows (CAPTCHA/Bio)", free: false, pro: true, team: true, ent: true },
            { name: "Request Replay", free: false, pro: true, team: true, ent: true },
        ]
    },
    {
        category: "Collaboration & Management",
        items: [
            { name: "Team Members", free: "1", pro: "3", team: "10", ent: "Unlimited" },
            { name: "Shared Dashboards", free: false, pro: false, team: true, ent: true },
            { name: "Risk Annotation", free: false, pro: false, team: true, ent: true },
            { name: "Role-Based Access Control", free: false, pro: false, team: "Basic", ent: "Advanced" },
        ]
    },
    {
        category: "Enterprise Controls",
        items: [
            { name: "Audit Log Retention", free: "3 Days", pro: "30 Days", team: "90 Days", ent: "1 Year" },
            { name: "SSO / SAML / SCIM", free: false, pro: false, team: false, ent: true },
            { name: "On-Premise Deployment", free: false, pro: false, team: false, ent: "Optional" },
            { name: "Dedicated Support", free: "Community", pro: "Email", team: "Priority", ent: "Dedicated" },
        ]
    }
];

export function PricingFeatures() {
    return (
        <section className="py-24 bg-background/50">
            <div className="container mx-auto px-6 max-w-7xl">
                <SlideIn>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Compare Features</h2>
                        <p className="text-muted-foreground">Detailed breakdown of what's included in each plan.</p>
                    </div>
                </SlideIn>

                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Header */}
                        <div className="grid grid-cols-5 gap-4 py-4 border-b border-border font-semibold text-sm md:text-base sticky top-0 bg-background/95 backdrop-blur z-10">
                            <div className="col-span-1 px-4">Features</div>
                            <div className="col-span-1 text-center px-4">Free</div>
                            <div className="col-span-1 text-center px-4 text-primary">Pro</div>
                            <div className="col-span-1 text-center px-4">Team</div>
                            <div className="col-span-1 text-center px-4">Enterprise</div>
                        </div>

                        {features.map((category, idx) => (
                            <div key={idx} className="mb-8">
                                <div className="py-4 px-4 font-bold text-lg border-b border-border/50 bg-muted/20 mt-4">
                                    {category.category}
                                </div>
                                {category.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="grid grid-cols-5 gap-4 py-3 border-b border-border/30 hover:bg-muted/10 transition-colors text-sm items-center">
                                        <div className="col-span-1 px-4 font-medium text-muted-foreground">{item.name}</div>
                                        
                                        {/* Free */}
                                        <div className="col-span-1 px-4 text-center flex justify-center text-muted-foreground">
                                            {typeof item.free === 'boolean' ? (
                                                item.free ? <Check className="h-4 w-4 text-primary" /> : <Minus className="h-4 w-4 opacity-30" />
                                            ) : (
                                                <span>{item.free}</span>
                                            )}
                                        </div>

                                        {/* Pro */}
                                        <div className="col-span-1 px-4 text-center flex justify-center font-medium">
                                            {typeof item.pro === 'boolean' ? (
                                                item.pro ? <Check className="h-4 w-4 text-primary" /> : <Minus className="h-4 w-4 opacity-30" />
                                            ) : (
                                                <span>{item.pro}</span>
                                            )}
                                        </div>

                                        {/* Team */}
                                        <div className="col-span-1 px-4 text-center flex justify-center text-muted-foreground">
                                            {typeof item.team === 'boolean' ? (
                                                item.team ? <Check className="h-4 w-4 text-primary" /> : <Minus className="h-4 w-4 opacity-30" />
                                            ) : (
                                                <span>{item.team}</span>
                                            )}
                                        </div>

                                        {/* Enterprise */}
                                        <div className="col-span-1 px-4 text-center flex justify-center text-muted-foreground">
                                            {typeof item.ent === 'boolean' ? (
                                                item.ent ? <Check className="h-4 w-4 text-primary" /> : <Minus className="h-4 w-4 opacity-30" />
                                            ) : (
                                                <span>{item.ent}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
