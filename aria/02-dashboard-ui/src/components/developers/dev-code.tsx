"use client";

import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

const codeSnippet = `const express = require('express');
const { ariaExpress } = require('aria-sdk');

const app = express();

app.use(express.json());

app.use(ariaExpress({
    apiKey: "YOUR_ARIA_APP_KEY",
    engineUrl: "http://your-engine-ip:3001/evaluate"
}));`;

export function DevCode() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="px-6 py-32 bg-linear-to-b from-black to-slate-950/50">
      <div className="mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-medium font-mono uppercase tracking-wider">
                 Developer First
             </div>
             <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Drop-in middleware. <br/>
                <span className="text-transparent bg-clip-text bg-linear-to-r from-gray-500 to-gray-700">Zero redesign.</span>
             </h2>
             <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                Integrate ARIA into your existing Node.js or Express backend in minutes. No complex setup, sidecars, or architecture overhaul required.
             </p>
             
             <ul className="space-y-4 pt-4">
                 {['Type-safe configuration', 'Zero-latency by default with "monitor" mode', 'Works with all major Node.js frameworks'].map((item, i) => (
                     <li key={i} className="flex items-center gap-3 text-gray-300">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                         {item}
                     </li>
                 ))}
             </ul>
        </div>

        <div className="flex-1 w-full relative group perspective-1000">
           {/* Glow Effect */}
           <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           
           {/* IDE Window */}
           <motion.div 
                initial={{ transform: "rotateY(-5deg)" }}
                whileHover={{ transform: "rotateY(0deg)" }}
                transition={{ duration: 0.5 }}
                className="relative rounded-xl bg-[#0d1117] border border-white/10 shadow-2xl overflow-hidden"
           >
               {/* IDE Titlebar */}
               <div className="flex items-center justify-between px-4 py-3 bg-[#010409] border-b border-white/5">
                   <div className="flex items-center gap-2">
                       <div className="flex gap-1.5">
                           <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                           <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                           <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                       </div>
                       <span className="ml-4 text-xs text-muted-foreground font-mono">server.ts — ARIA Integration</span>
                   </div>
                   <button onClick={copyToClipboard} className="text-gray-500 hover:text-white transition-colors">
                       {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                   </button>
               </div>

               {/* Editor Content */}
               <div className="p-6 font-mono text-sm md:text-base leading-relaxed overflow-x-auto relative">
                   {/* Line Numbers */}
                   <div className="absolute left-0 top-6 bottom-6 w-12 flex flex-col text-right pr-4 text-gray-700 select-none">
                       {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <span key={n}>{n}</span>)}
                   </div>
                   
                   <div className="pl-12">
                       <div className="text-gray-400">
                           <span className="text-purple-400">const</span> express = <span className="text-yellow-400">require</span>(<span className="text-green-400">'express'</span>);
                       </div>
                       <div className="text-gray-400">
                           <span className="text-purple-400">const</span> {"{ ariaExpress }"} = <span className="text-yellow-400">require</span>(<span className="text-green-400">'aria-sdk'</span>);
                       </div>
                       <div className="h-4" />
                       <div className="text-gray-400">
                           <span className="text-purple-400">const</span> app = <span className="text-blue-400">express</span>();
                       </div>
                       <div className="h-4" />
                       <div className="text-gray-400">
                           <span className="text-blue-400">app</span>.<span className="text-yellow-400">use</span>(<span className="text-blue-400">express</span>.<span className="text-yellow-400">json</span>());
                       </div>
                       <div className="h-4" />
                       <div className="text-gray-300">
                            <span className="text-blue-400">app</span>.<span className="text-yellow-400">use</span>(ariaExpress({"{"}
                            {"\n  "}apiKey: <span className="text-green-400">"YOUR_ARIA_APP_KEY"</span>,
                            {"\n  "}engineUrl: <span className="text-green-400">"http://your-engine-ip:3001/evaluate"</span>
                            {"\n"}{"}"}));
                       </div>
                   </div>
               </div>
               
               {/* Status Bar */}
               <div className="flex items-center justify-between px-4 py-1.5 bg-[#010409] border-t border-white/5 text-[10px] text-gray-500 font-mono">
                    <div className="flex gap-4">
                        <span>master*</span>
                        <span>TypeScript JSX</span>
                    </div>
                     <div className="flex gap-4">
                        <span>Ln 7, Col 12</span>
                        <span>UTF-8</span>
                    </div>
               </div>
           </motion.div>
        </div>
      </div>
    </section>
  );
}
