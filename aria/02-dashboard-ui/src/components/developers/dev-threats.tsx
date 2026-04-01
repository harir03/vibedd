"use client";

import { Shield, Fingerprint, MousePointerClick, RefreshCw, Terminal, Users, Lock, Zap } from "lucide-react";

const threats = [
  { title: "Session Replay & Cookie Theft", icon: RefreshCw },
  { title: "Credential Stuffing", icon: Lock },
  { title: "API Abuse & Automation", icon: Zap },
  { title: "Device Fingerprint Spoofing", icon: Fingerprint },
  { title: "Prompt Injection", icon: Terminal },
  { title: "CSRF & Replay", icon: MousePointerClick },
  { title: "Insider Misuse", icon: Users },
  { title: "Third-party Abuse", icon: Shield },
];

export function DevThreats() {
  return (
    <section className="px-6 py-24 bg-black">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-center mb-16 text-transparent bg-clip-text bg-linear-to-r from-red-500 to-orange-500">
           Threats ARIA Stops
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {threats.map((threat, i) => (
            <div
              key={i}
              className="group flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-red-500/30 transition-all duration-300"
            >
              <div className="mb-4 p-4 rounded-full bg-black border border-white/10 group-hover:border-red-500/50 group-hover:bg-red-500/10 transition-colors">
                 <threat.icon className="w-8 h-8 text-gray-400 group-hover:text-red-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                {threat.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
