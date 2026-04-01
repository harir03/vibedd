"use client";

import { Eye, Sliders, ShieldCheck } from "lucide-react";

const workflowSteps = [
    {
        title: "Monitor",
        desc: "Start in monitoring mode to observe traffic without blocking.",
        icon: Eye,
        color: "text-blue-400"
    },
    {
        title: "Tune",
        desc: "Use session replays to fine-tune your security rules.",
        icon: Sliders,
        color: "text-yellow-400"
    },
    {
        title: "Enforce",
        desc: "Turn on blocking mode to stop attacks in real-time.",
        icon: ShieldCheck,
        color: "text-green-400"
    }
];

export function DevWorkflow() {
  return (
    <section className="px-6 py-24 bg-black">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold text-center mb-16 text-white">Developer Workflow</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workflowSteps.map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                    <div className={`mb-6 p-6 rounded-full bg-white/5 border border-white/10 ${step.color}`}>
                        <step.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                    
                     {/* Connector line for desktop */}
                     {i < workflowSteps.length - 1 && (
                        <div className="hidden md:block absolute top-[2.5rem] -right-1/2 w-full h-[1px] bg-linear-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                     )}
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}
