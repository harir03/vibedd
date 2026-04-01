"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/primitives/card";
import { Check, Shield, Zap, Users, Building } from "lucide-react";
import { SlideIn } from "@/components/ui/effects/slide-in";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pricing() {
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

    const isYearly = billingPeriod === "yearly";

    return (
        <section id="pricing" className="py-24 bg-background">
            <div className="container mx-auto px-6">
                <SlideIn>
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                            Secure Every Request with <br className="hidden md:block" /> Context-Aware Risk Scoring
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                            From developers to enterprises, ARIA provides backend request intelligence to block threats before they reach your app.
                        </p>

                        <div className="flex justify-center mb-8">
                            <Tabs defaultValue="monthly" className="w-[400px]" onValueChange={(v) => setBillingPeriod(v as "monthly" | "yearly")}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                    <TabsTrigger value="yearly">Yearly <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">-20%</span></TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </SlideIn>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {/* Free Tier */}
                    <SlideIn delay={100} className="h-full">
                        <Card className="border-border/40 relative h-full flex flex-col hover:border-border transition-colors">
                            <CardHeader>
                                <div className="mb-4 text-primary p-2 bg-primary/10 w-fit rounded-lg">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl">Free</CardTitle>
                                <div className="text-3xl font-bold mt-2">$0 <span className="text-sm font-normal text-muted-foreground">/ month</span></div>
                                <p className="text-sm text-muted-foreground mt-2">Ideal for developers & small projects.</p>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Basic Monitoring</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Read-only Risk Insights</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> 3-Day Risk Retention</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Community Support</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline" asChild>
                                    <Link href="/dashboard">Start Free</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </SlideIn>

                    {/* Pro Tier */}
                    <SlideIn delay={200} className="h-full relative z-10">
                        <Card className="border-primary/50 bg-primary/5 relative scale-105 shadow-xl h-full flex flex-col">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                                MOST POPULAR
                            </div>
                            <CardHeader>
                                <div className="mb-4 text-primary p-2 bg-background w-fit rounded-lg border border-primary/20">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl">Pro</CardTitle>
                                <div className="text-3xl font-bold mt-2">
                                    ${isYearly ? "39" : "49"} 
                                    <span className="text-sm font-normal text-muted-foreground">/ month</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">For production apps requiring active protection.</p>
                                {isYearly && <p className="text-xs text-primary font-medium mt-1">Billed ${39 * 12} yearly</p>}
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 text-primary" /> <strong>Everything in Free</strong></li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 text-primary" /> Real-time Risk Blocking</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 text-primary" /> Session Profiling</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 text-primary" /> Request Replay Tools</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 text-primary" /> 30-Day Risk Retention</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" asChild>
                                    <Link href="/signup?plan=pro">Get Started</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </SlideIn>

                    {/* Team Tier */}
                    <SlideIn delay={300} className="h-full">
                        <Card className="border-border/40 h-full flex flex-col hover:border-border transition-colors">
                            <CardHeader>
                                <div className="mb-4 text-primary p-2 bg-primary/10 w-fit rounded-lg">
                                    <Users className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl">Team</CardTitle>
                                <div className="text-3xl font-bold mt-2">
                                    ${isYearly ? "159" : "199"} 
                                    <span className="text-sm font-normal text-muted-foreground">/ month</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">Collaborative workflows for security teams.</p>
                                {isYearly && <p className="text-xs text-primary font-medium mt-1">Billed ${159 * 12} yearly</p>}
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> <strong>Everything in Pro</strong></li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Shared Tuning & Rules</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Shared Dashboards</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Risk Annotation</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> 90-Day Risk Retention</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline" asChild>
                                    <Link href="/signup?plan=team">Start Free Trial</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </SlideIn>

                    {/* Enterprise Tier */}
                    <SlideIn delay={400} className="h-full">
                        <Card className="border-border/40 h-full flex flex-col hover:border-border transition-colors">
                            <CardHeader>
                                <div className="mb-4 text-primary p-2 bg-primary/10 w-fit rounded-lg">
                                    <Building className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl">Enterprise</CardTitle>
                                <div className="text-3xl font-bold mt-2">Custom</div>
                                <p className="text-sm text-muted-foreground mt-2">Advanced control & compliance integration.</p>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> <strong>Everything in Team</strong></li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Custom Security SLAs</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> SSO / SAML / SCIM</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Audit Logs Integration</li>
                                    <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Dedicated Support</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline" asChild>
                                    <Link href="/contact">Contact Sales</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </SlideIn>
                </div>
            </div>
        </section>
    );
}
