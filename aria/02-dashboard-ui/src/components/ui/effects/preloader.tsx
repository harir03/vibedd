"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function Preloader() {
    const [isComplete, setIsComplete] = useState(false);
    const counterRef = useRef<HTMLSpanElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // PERMANENT FIX: Temporarily comment out session storage check for testing
        // const hasVisited = sessionStorage.getItem("hasVisited");
        // if (hasVisited) {
        //     setIsComplete(true);
        //     return;
        // }

        const startTime = performance.now();
        const duration = 2500; // 2.5 seconds

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 1. Update Counter (Native DOM for performance)
            if (counterRef.current) {
                counterRef.current.innerText = Math.floor(progress * 100).toString();
            }

            // 2. Update Progress Bar
            if (progressRef.current) {
                progressRef.current.style.width = `${progress * 100}%`;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation Complete
                setTimeout(() => {
                    setIsComplete(true);
                    sessionStorage.setItem("hasVisited", "true");
                }, 500);
            }
        };

        const animationId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationId);
    }, []);

    if (isComplete) return null;

    return (
        <AnimatePresence>
            {!isComplete && (
                <motion.div
                    key="preloader"
                    initial={{ y: 0 }}
                    exit={{ y: "-100%", transition: { duration: 0.8, ease: "easeInOut" } }}
                    className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background text-foreground"
                >
                    {/* Large Counter */}
                    <div className="text-9xl font-bold font-mono tracking-tighter tabular-nums mb-8 flex items-end">
                        {/* Initial 0 to prevent flash of empty */}
                        <span ref={counterRef} className="inline-block text-right">0</span>
                        <span className="text-4xl mb-4 ml-2 text-muted-foreground">%</span>
                    </div>

                    {/* Loading text/status */}
                    <div className="flex flex-col items-center gap-2 mb-12">
                        <div className="flex gap-2 items-center text-muted-foreground uppercase tracking-widest text-xs">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                            Initializing ARIA System...
                        </div>
                    </div>

                    {/* Progress Bar container */}
                    <div className="w-64 h-1 bg-border rounded-full overflow-hidden">
                        <div 
                            ref={progressRef}
                            className="h-full bg-primary w-0"
                            style={{ transition: 'width 0.1s linear' }} // Smooth out frame jitters
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
