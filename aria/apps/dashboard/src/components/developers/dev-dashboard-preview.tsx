"use client";

import { Activity, Shield, Users, Globe, AlertTriangle } from "lucide-react";

export function DevDashboardPreview() {
  return (
    <section className="px-6 py-24 bg-white/5">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">Live Request Intelligence</h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Visualize risk scores, analyze request timelines, and replay sessions to understand attacker behavior.
        </p>

        {/* Dashboard Mockup Container */}
        <div className="rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden shadow-2xl relative">
             
             {/* Simple Header */}
             <div className="border-b border-white/10 p-4 flex items-center gap-4 bg-black/40">
                 <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                     <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                 </div>
                 <div className="ml-4 text-xs font-mono text-muted-foreground">ARIA Dashboard - Live Monitor</div>
             </div>

             {/* Grid Content */}
             <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                 
                 {/* Stat Cards */}
                 <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                     <StatCard title="Active Sessions" value="1,248" icon={Users} color="text-blue-400" />
                     <StatCard title="Threats Blocked" value="142" icon={Shield} color="text-green-400" />
                     <StatCard title="Avg Risk Score" value="12" icon={Activity} color="text-yellow-400" />
                     <StatCard title="Global Traffic" value="23.4k" icon={Globe} color="text-purple-400" />
                 </div>

                 {/* Main Chart Area (Abstract representation) */}
                 <div className="col-span-1 md:col-span-2 h-64 bg-black/40 rounded-lg border border-white/5 p-4 relative overflow-hidden">
                     <div className="absolute inset-0 flex items-end justify-between px-4 pb-0 gap-1 opacity-50">
                {Array.from({ length: 40 }).map((_, i) => {
                            const heights = [20, 45, 75, 50, 30, 85, 60, 90, 25, 65];
                            return (
                                <div 
                                    key={i} 
                                    className="w-full bg-blue-500/20 hover:bg-blue-500/40 transition-colors"
                                    style={{ height: `${heights[i % heights.length]}%` }}
                                /> 
                            );
                        })}
                     </div>
                     <div className="absolute top-4 left-4 text-xs text-muted-foreground">Request Volume (Last 1h)</div>
                 </div>

                 {/* Recent Alerts (Abstract list) */}
                 <div className="col-span-1 h-64 bg-black/40 rounded-lg border border-white/5 p-4 overflow-hidden">
                     <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                         <AlertTriangle className="w-4 h-4 text-red-500" /> Recent Alerts
                     </h4>
                     <div className="space-y-3">
                         <AlertItem time="2m ago" msg="Credential Stuffing detected" ip="192.168.1.104" score={85} />
                         <AlertItem time="5m ago" msg="SQL Injection attempt" ip="10.0.0.42" score={92} />
                         <AlertItem time="12m ago" msg="Abnormal Rate Limit" ip="172.16.0.2" score={65} />
                         <AlertItem time="18m ago" msg="New Device Access" ip="192.168.1.55" score={45} />
                     </div>
                 </div>

             </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-black/40 p-4 rounded-lg border border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{title}</span>
                <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    )
}

function AlertItem({ time, msg, ip, score }: any) {
    return (
        <div className="flex items-start justify-between text-xs p-2 rounded bg-white/5 border border-white/5">
            <div>
                <div className="font-semibold text-red-400">{msg}</div>
                <div className="text-muted-foreground">{ip}</div>
            </div>
            <div className="text-right">
                <div className="text-muted-foreground">{time}</div>
                <div className="font-bold text-red-500">Risk: {score}</div>
            </div>
        </div>
    )
}
