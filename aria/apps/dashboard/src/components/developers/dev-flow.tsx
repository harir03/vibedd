"use client";

import { motion } from "framer-motion";
import { Box, ShieldAlert, Database, Cpu, Lock, CheckCircle, XCircle, AlertTriangle, UserX, ArrowRight } from "lucide-react";

export function DevFlow() {
  const steps = [
    { name: "Request", icon: Box, color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20" },
    { name: "ARIA Middleware", icon: ShieldAlert, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: true },
    { name: "Context", icon: Database, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
    { name: "Risk Engine", icon: Cpu, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
    { name: "Decision", icon: Lock, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
  ];

  return (
    <section className="px-6 py-32 bg-black relative border-y border-white/5 overflow-hidden">
        
       {/* Ambient glow behind flow */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-blue-900/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-20">How ARIA Works</h2>
        
        {/* Animated Flow Visualization */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 mt-12 mb-24">
          
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[50%] left-0 w-full h-[2px] -translate-y-1/2">
             <div className="absolute inset-0 bg-white/10" />
             <div className="absolute inset-x-0 h-full bg-linear-to-r from-transparent via-blue-500 to-transparent w-1/3 animate-scan-fast opactiy-50 blur-[2px]" />
          </div>

          <div className="absolute hidden md:flex w-full justify-between px-10 top-1/2 -translate-y-1/2 pointer-events-none z-0">
               {/* Arrows between steps */}
               <ArrowRight className="text-white/20 translate-x-[50px]" />
               <ArrowRight className="text-white/20 translate-x-[50px]" />
               <ArrowRight className="text-white/20 translate-x-[50px]" />
               <ArrowRight className="text-white/20 translate-x-[50px]" />
               <ArrowRight className="text-white/20 translate-x-[50px]" />
          </div>

          {steps.map((step, index) => (
            <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative z-10 flex flex-col items-center gap-6 group"
            >
               <div className={`relative p-6 rounded-2xl border ${step.border} ${step.bg} backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]`}>
                 {step.glow && <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-50 animate-pulse" />}
                 <step.icon className={`w-8 h-8 ${step.color} relative z-10`} />
                 
                 {/* Connection dot */}
                 <div className="absolute -bottom-[20px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/20 md:hidden" />
                 <div className="absolute top-1/2 -right-[20px] -translate-y-1/2 w-2 h-2 rounded-full bg-white/20 hidden md:block" />
               </div>
               <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{step.name}</span>
            </motion.div>
          ))}
          
          {/* Backend destination */}
          <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ delay: 0.6 }}
               className="relative z-10 flex flex-col items-center gap-6"
          >
             <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 shadow-[0_0_30px_-5px_theme(colors.green.500/0.3)]">
                 <Box className="w-8 h-8 text-green-500" />
             </div>
             <span className="text-sm font-bold text-white uppercase tracking-wider">Backend</span>
          </motion.div>

        </div>

        {/* Decisions Grid - Refined */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
             <DecisionCard type="ALLOW" icon={CheckCircle} color="text-emerald-400" bg="bg-emerald-400/5" border="border-emerald-400/10" description="Legitimate traffic passed to backend with zero latency." />
             <DecisionCard type="BLOCK" icon={XCircle} color="text-red-500" bg="bg-red-500/5" border="border-red-500/10" description="Malicious requests rejected immediately at the edge." />
             <DecisionCard type="CHALLENGE" icon={AlertTriangle} color="text-orange-400" bg="bg-orange-400/5" border="border-orange-400/10" description="Suspicious activity triggered implicit/explicit challenges." />
             <DecisionCard type="DROP_SESSION" icon={UserX} color="text-gray-400" bg="bg-gray-500/5" border="border-gray-500/10" description="Session invalidated silently due to behavioral anomaly." />
        </div>
      </div>
    </section>
  );
}

function DecisionCard({ type, icon: Icon, color, bg, border, description }: any) {
    return (
        <div className={`p-8 rounded-xl border ${border} ${bg} backdrop-blur-sm text-left hover:border-white/20 transition-colors group h-full`}>
            <div className={`flex items-center gap-3 mb-4`}>
                <div className={`p-2 rounded-lg ${color} bg-black/50`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`font-bold tracking-tight ${color}`}>{type}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-gray-300 transition-colors">{description}</p>
        </div>
    )
}
