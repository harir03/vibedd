"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { Card, CardContent } from "@/components/ui/primitives/card";
import { Badge } from "@/components/ui/primitives/badge";
import { Check, Clipboard, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

import { SlideIn } from "@/components/ui/effects/slide-in";

// ... existing code ...

export function CodePreview() {
    const [copied, setCopied] = useState(false);

    const onCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className="py-24">
            <div className="container mx-auto px-6 flex flex-col items-center">
                <SlideIn className="mb-12 text-center max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">
                        Designed for Real-World Systems
                    </h2>
                    <p className="text-muted-foreground">
                        ARIA adapts to startups, teams, and enterprises without forcing rigid structures.
                    </p>
                </SlideIn>

                <SlideIn delay={200} className="w-full max-w-4xl relative">
                    {/* Decorative gradient glow behind the card */}
                    <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-primary/30 to-purple-500/30 blur-2xl opacity-50" />

                    <Tabs defaultValue="code" className="relative w-full">
                        <div className="flex items-center justify-between mb-4">
                            <TabsList className="bg-muted/50">
                                <TabsTrigger value="code" className="gap-2">
                                    <Terminal className="h-4 w-4" /> Code
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-500" /> Preview
                                </TabsTrigger>
                            </TabsList>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs gap-2"
                                onClick={onCopy}
                            >
                                {copied ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
                                {copied ? "Copied" : "Copy Code"}
                            </Button>
                        </div>

                        <TabsContent value="code" className="mt-0">
                            <Card className="bg-slate-950 border-border/50 text-slate-50 font-mono text-sm overflow-hidden">
                                <div className="p-4 border-b border-border/10 bg-slate-900/50 flex gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500/20" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-500/20" />
                                    <div className="h-3 w-3 rounded-full bg-green-500/20" />
                                </div>
                                <CardContent className="p-6 overflow-x-auto">
                                    <pre>
                                        <code className="language-tsx">{`import { ARIA } from "@aria/core";

// Initialize your system
const app = new ARIA({
  mode: "scalable",
  modules: ["auth", "database", "analytics"],
  security: "enterprise"
});

// Deploy instantly
await app.deploy({
  target: "edge",
  region: "global"
});`}</code>
                                    </pre>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="preview" className="mt-0">
                            <Card className="border-border/50 bg-background/90">
                                <CardContent className="flex flex-col items-center justify-center p-20 min-h-[400px] gap-4">
                                    <div className="text-center space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Status: <span className="text-green-500 font-medium">Operational</span>
                                        </p>
                                        <div className="flex gap-2 justify-center">
                                            <Badge variant="outline">Auto-Scaling</Badge>
                                            <Badge variant="outline">Secure</Badge>
                                        </div>
                                        <h3 className="text-2xl font-bold">System Active</h3>
                                        <Button>View Dashboard</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </SlideIn>
            </div>
        </section>
    );
}
