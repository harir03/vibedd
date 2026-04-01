"use client";

import { Button } from "@/components/ui/primitives/button";
import { ArrowRight, Github } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import DecryptedText from "@/components/DecryptedText";
import Shuffle from "@/components/ui/effects/shuffle";

export function DevHero() {
  return (
    <section className="relative px-6 pt-32 pb-32 md:pt-48 md:pb-40 text-center overflow-hidden max-w-[100vw]">
        <div className="absolute inset-0 -z-10 h-full w-full bg-black">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
             <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-g from-blue-900/30 to-slate-900/0 blur-[120px] rounded-full opacity-60 pointer-events-none" />
             <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full opacity-40 pointer-events-none" />
        </div>

      <div className="mx-auto max-w-5xl space-y-8 relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium font-mono mb-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
             <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
             v2.0 Now Available
        </div>

        <div>
            <Shuffle
                text="Request Intelligence"
                shuffleDirection="right"
                duration={0.35}
                animationMode="evenodd"
                shuffleTimes={1}
                ease="power3.out"
                stagger={0.03}
                threshold={0.1}
                triggerOnce={true}
                triggerOnHover
                respectReducedMotion={true}
                loop={false}
                loopDelay={0}
                className="text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl leading-[1.1] text-white tiny5-regular"
            />
        </div>
        
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto max-w-3xl text-xl text-muted-foreground md:text-2xl font-light leading-relaxed"
        >
          ARIA brings context, continuity, and intent detection to every request.
          <br className="hidden md:block"/>
          <span className="text-white/80">Stop attacks before they execute.</span>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4"
        >
          <Button asChild size="lg" className="h-14 rounded-full px-10 text-lg bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-[0_0_30px_-10px_rgba(37,99,235,0.6)] w-full sm:w-auto transition-all hover:scale-105 active:scale-95 duration-300 group">
            <Link href="/get-started">
              Get Started <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="h-14 rounded-full px-10 text-lg bg-black/50 border-white/10 hover:bg-white/10 text-white w-full sm:w-auto backdrop-blur-md transition-all hover:border-white/20">
            <Link href="/docs">
               <DecryptedText text="View Documentation" animateOn="hover" speed={70} className="font-mono" />
            </Link>
          </Button>

           <div className="flex items-center gap-4 sm:ml-4 text-sm text-muted-foreground">
                <Link href="https://github.com/Jitesh-Yadav01/aria" target="_blank" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Github className="h-5 w-5" />
                    <span>Star on GitHub</span>
                </Link>
           </div>
        </motion.div>
      </div>
    </section>
  );
}
