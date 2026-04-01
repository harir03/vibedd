import Link from "next/link";
import { Separator } from "@/components/ui/primitives/separator";
import CurvedLoop from "./curved-loop";

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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold">Platform</h3>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Architecture</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Automation</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Integrations</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Security</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Performance</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold">Use Cases</h3>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Startups</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">SaaS Products</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Internal Tools</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Enterprise</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold">Docs</h3>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Getting Started</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Core Concepts</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">API Reference</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Examples</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold">Company</h3>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">About ARIA</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Roadmap</Link>
                        <Link href="https://github.com/jrdevadattan/aria" className="text-sm text-muted-foreground hover:text-foreground">GitHub</Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Discord</Link>
                    </div>
                </div>

                <Separator className="mb-8" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-sm text-muted-foreground">
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
