"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function useMagnetic() {
  const ref = useRef<HTMLDivElement | HTMLButtonElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const xTo = gsap.quickTo(element, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yTo = gsap.quickTo(element, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = element.getBoundingClientRect();
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);

      // Only magnetize if within reasonable distance (optional, or rely on hover area)
      // Here we assume this event is triggered when hovering the element or close to it
      // But standard magnetic effect usually works on mouse move *over* the element.
      xTo(x * 0.35); // Strength of magnet
      yTo(y * 0.35);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    element.addEventListener("mousemove", handleMouseMove as any);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove as any);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return ref;
}
