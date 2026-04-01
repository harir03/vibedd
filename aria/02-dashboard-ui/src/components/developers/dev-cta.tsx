"use client";

import { SlideIn } from "@/components/ui/effects/slide-in";
import { useMagnetic } from "@/hooks/use-magnetic";
import { Button } from "@/components/ui/primitives/button";
import Link from "next/link";
import { ArrowRight, BookOpen, Users } from "lucide-react";

export function DevCTA() {
    const btnRef = useMagnetic();

    return (
        <section className="py-24 border-t border-white/10 relative bg-linear-to-t from-blue-900/10 to-transparent">
             <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500/20 to-transparent" />
            <div className="container mx-auto px-6 text-center">
                <SlideIn>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-white">
                        Give Your Backend Intelligence,<br/> Not Just Filters
                    </h2>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        <div ref={btnRef as any} className="inline-block w-full sm:w-auto">
                            <Button asChild size="lg" className="rounded-full px-10 h-12 text-base bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                                <Link href="/get-started">
                                    Start Securing Requests <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 text-base bg-transparent border-white/10 hover:bg-white/5 w-full sm:w-auto">
                           <Link href="/docs">
                               <BookOpen className="mr-2 h-4 w-4" /> Read Documentation
                           </Link>
                        </Button>
                        <Button asChild variant="ghost" size="lg" className="rounded-full px-8 h-12 text-base text-muted-foreground hover:text-white w-full sm:w-auto">
                           <Link href="/community">
                               <Users className="mr-2 h-4 w-4" /> Join Community
                           </Link>
                        </Button>
                    </div>
                </SlideIn>
            </div>
        </section>
    );
}
