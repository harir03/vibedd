import Link from "next/link";
import { Separator } from "@/components/ui/primitives/separator";
import CurvedLoop from "../footer/curved-loop";

export function Footer() {
    return (
        <footer className="py-12 border-t border-border bg-background">
            <div className="container mx-auto px-6">
                <div className="mb-12 overflow-hidden">
                    <CurvedLoop 
                      marqueeText="Built ✦ With ✦ ❤️ ✦ in ✦ Innerve ✦ "
                      speed={2}
                      curveAmount={100}
                      direction="right"
                      interactive
                      className="text-primary/20"
                    />
                </div>
                {/* Responsive Grid: 2 columns on mobile, 4 on tablet/desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mb-12">
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-foreground">Platform</h3>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Architecture</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Automation</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Integrations</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Performance</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-foreground">Use Cases</h3>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Startups</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">SaaS Products</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Internal Tools</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Enterprise</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-foreground">Docs</h3>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Getting Started</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Core Concepts</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Reference</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Examples</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-foreground">Company</h3>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About ARIA</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Roadmap</Link>
                        <Link href="https://github.com/jrdevadattan/aria" className="text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Discord</Link>
                    </div>
                </div>

                <Separator className="mb-8" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-sm text-muted-foreground text-center md:text-left">
                        &copy; {new Date().getFullYear()} ARIA Platform. All rights reserved.
                    </div>

                    <div className="flex gap-8">
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
