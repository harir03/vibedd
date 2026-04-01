"use client";

import { CheckCircle2 } from "lucide-react";

const benefits = [
    "Runs as middleware or SDK",
    "Rules-first, AI-optional",
    "No latency spikes",
    "Circuit breaker for AI",
    "Zod-based config validation",
    "Replayable security decisions",
    "On-prem and Docker support",
    "Privacy-safe logging (no secrets or tokens)"
];

export function DevBenefits() {
  return (
    <section className="px-6 py-20 bg-white/5">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">Why Developers Love ARIA</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-black/40">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-lg text-gray-200">{benefit}</span>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}
