"use client";

import FallingText from "@/components/ui/effects/falling-text";

export function DevIntro() {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl text-center h-[400px]">
        <h2 className="text-sm font-semibold tracking-wide text-blue-400 uppercase mb-8">What is ARIA?</h2>
        <FallingText
          text="ARIA is an AI-powered request security layer that runs inside your backend, intercepts every HTTP request, understands session continuity, device consistency, and behavioral patterns, and enforces security decisions in real time."
          highlightWords={["ARIA", "AI-powered", "security", "backend", "HTTP", "session"]}
          trigger="hover"
          backgroundColor="transparent"
          wireframes={false}
          gravity={0.56}
          fontSize="2rem"
          mouseConstraintStiffness={0.9}
        />
      </div>
    </section>
  );
}
