"use client";

import { Database, Server, BrainCircuit, Activity, FileText, Blocks, Lock } from "lucide-react";

const stack = [
    { title: "Backend", desc: "Node.js, Express", icon: Server, color: "text-green-400" },
    { title: "Session Store", desc: "Redis", icon: Database, color: "text-red-400" },
    { title: "Logs", desc: "MongoDB", icon: FileText, color: "text-green-500" },
    { title: "AI", desc: "Ollama, OpenRouter", icon: BrainCircuit, color: "text-purple-400" },
    { title: "Dashboard", desc: "React", icon: Activity, color: "text-blue-400" },
    { title: "Orchestration", desc: "n8n", icon: Blocks, color: "text-pink-400" },
    { title: "Audit Integrity", desc: "Blockchain (Optional)", icon: Lock, color: "text-yellow-400" },
];

export function DevStack() {
  return (
    <section className="px-6 py-20 bg-black">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-16 text-white">Architecture Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stack.map((item, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group`}>
                    <div className="mb-4 p-3 w-fit rounded-xl bg-black border border-white/10">
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}
