"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const followerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        // Hide default cursor
        document.body.style.cursor = "none";

        const cursor = cursorRef.current;
        const follower = followerRef.current;

        if (!cursor || !follower) return;

        const moveX = gsap.quickTo(cursor, "x", { duration: 0.1, ease: "power3" });
        const moveY = gsap.quickTo(cursor, "y", { duration: 0.1, ease: "power3" });

        // Follower is slower/smoother
        const followerX = gsap.quickTo(follower, "x", { duration: 0.6, ease: "power3" });
        const followerY = gsap.quickTo(follower, "y", { duration: 0.6, ease: "power3" });

        const onMouseMove = (e: MouseEvent) => {
            moveX(e.clientX);
            moveY(e.clientY);
            followerX(e.clientX);
            followerY(e.clientY);
        };

        // Add listeners for hover states on interactive elements
        const onMouseEnterLink = () => setIsHovering(true);
        const onMouseLeaveLink = () => setIsHovering(false);

        const interactiveElements = document.querySelectorAll("a, button, input, textarea, [role='button']");
        interactiveElements.forEach((el) => {
            el.addEventListener("mouseenter", onMouseEnterLink);
            el.addEventListener("mouseleave", onMouseLeaveLink);
        });

        // Observer to attach listeners to new elements (dynamic content)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    const newElements = (mutation.target as HTMLElement).querySelectorAll("a, button, input, textarea, [role='button']");
                    newElements.forEach((el) => {
                        el.removeEventListener("mouseenter", onMouseEnterLink); // prevent double bind
                        el.removeEventListener("mouseleave", onMouseLeaveLink);
                        el.addEventListener("mouseenter", onMouseEnterLink);
                        el.addEventListener("mouseleave", onMouseLeaveLink);
                    });
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });

        window.addEventListener("mousemove", onMouseMove);

        return () => {
            document.body.style.cursor = "auto";
            window.removeEventListener("mousemove", onMouseMove);
            interactiveElements.forEach((el) => {
                el.removeEventListener("mouseenter", onMouseEnterLink);
                el.removeEventListener("mouseleave", onMouseLeaveLink);
            });
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const follower = followerRef.current;
        if (!follower) return;

        if (isHovering) {
            gsap.to(follower, { scale: 3, opacity: 0.5, duration: 0.3 });
        } else {
            gsap.to(follower, { scale: 1, opacity: 1, duration: 0.3 });
        }
    }, [isHovering]);

    return (
        <div className="pointer-events-none fixed left-0 top-0 z-50 hidden md:block">
            {/* Small dot */}
            <div
                ref={cursorRef}
                className="fixed h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black dark:bg-white"
            />
            {/* Follower ring */}
            <div
                ref={followerRef}
                className="fixed h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/30 dark:border-white/30"
            />
        </div>
    );
}
