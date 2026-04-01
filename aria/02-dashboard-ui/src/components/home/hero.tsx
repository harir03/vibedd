"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/primitives/badge";
import { Check, X, Copy, Terminal, ChevronRight, BarChart3, Activity, Shield, Zap, Search, Lock, Info, AlertTriangle, FileWarning, Globe, ShieldAlert, ShieldCheck, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DecryptedText from "../DecryptedText";
import PixelBlast from "./background/PixelBlast";
import { cn } from "@/lib/utils";
import { SiStripe, SiVercel, SiCloudflare, SiSupabase, SiOpenai, SiGithub } from "react-icons/si";

const tabs = [
    { id: "express", label: "Express", command: "app.use(ariaExpress(..configs)) " },
    { id: "fastify", label: "Fastify", command: "fastify.register(ariaFastify(..configs)) " },
    { id: "next", label: "Nextapi", command: "next-api-route-handler(ariaNext(..configs)) " },
];

// --- Dynamic Threat Simulation Types & Data ---

type ThreatType = "SQL Injection" | "XSS Payload" | "Bot Attack" | "API Abuse" | "Credential Stuffing" | "DDoS Probe";
type WafStatus = "Missed" | "False Positive" | "Log Only";
type AriaStatus = "Blocked" | "Challenge" | "Verified";

interface ThreatEvent {
    id: string;
    timestamp: number;
    type: ThreatType;
    payload: string;
    waf_status: WafStatus;
    aria_status: AriaStatus;
    aria_context: string;
    origin: string;
}

const THREAT_TYPES: { type: ThreatType; payload: string; context: string }[] = [
    { type: "SQL Injection", payload: "' OR 1=1 --", context: "Pattern Match" },
    { type: "XSS Payload", payload: "<script>alert(1)</script>", context: "Heuristic Analysis" },
    { type: "Bot Attack", payload: "User-Agent: curl/7.64.1", context: "Device Fingerprint" },
    { type: "API Abuse", payload: "Rate Limit > 500/s", context: "Velocity Check" },
    { type: "Credential Stuffing", payload: "admin / P@ssword1", context: "Behavioral Auth" },
    { type: "DDoS Probe", payload: "SYN Flood (443)", context: "Flow Analysis" },
];

const ORIGINS = ["US-East", "EU-West", "AP-South", "SA-East", "CN-North"];

const generateThreat = (): ThreatEvent => {
    const template = THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)];
    const id = Math.random().toString(36).substring(7);
    
    // Simulate WAF failures vs ARIA success
    let waf_status: WafStatus = "Missed";
    let aria_status: AriaStatus = "Blocked";
    
    // Randomize some outcomes
    const rand = Math.random();
    if (rand > 0.7) {
        waf_status = "False Positive";
        aria_status = "Verified"; // ARIA correctly identifies valid traffic that WAF blocked
    } else if (rand > 0.5) {
         waf_status = "Log Only";
         aria_status = "Challenge"; // ARIA steps up auth
    }

    return {
        id,
        timestamp: Date.now(),
        type: template.type,
        payload: template.payload,
        waf_status: waf_status,
        aria_status: aria_status,
        aria_context: template.context,
        origin: ORIGINS[Math.floor(Math.random() * ORIGINS.length)]
    };
};

export function Hero() {
    const bgRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState("node");
    const [copied, setCopied] = useState(false);
    
    // Dynamic Threat State
    const [events, setEvents] = useState<ThreatEvent[]>([]);
    const [stats, setStats] = useState({ requests: 1240, blocked: 89, latency: 2 });

    // Initial population
    useEffect(() => {
        const initialEvents = Array.from({ length: 4 }).map(generateThreat);
        setEvents(initialEvents);
    }, []);

    // Simulation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            const newEvent = generateThreat();
            setEvents(prev => [newEvent, ...prev.slice(0, 3)]); // Keep last 4
            setStats(prev => ({
                requests: prev.requests + Math.floor(Math.random() * 5),
                blocked: prev.blocked + (newEvent.aria_status === "Blocked" ? 1 : 0),
                latency: Math.floor(Math.random() * 5) + 1 // varies 1-6ms
            }));
        }, 3500); // New event every 3.5s (slower)
        return () => clearInterval(interval);
    }, []);

    const handleCopy = () => {
        const cmd = tabs.find(t => t.id === activeTab)?.command;
        if (cmd) {
            navigator.clipboard.writeText(cmd);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <section className="relative h-screen w-full overflow-hidden flex items-center justify-center pt-24 lg:pt-32">
            <div className="absolute inset-0 -z-10 bg-[#05050A]" ref={bgRef}>
                <PixelBlast
                    variant="square"
                    pixelSize={4}
                    color="#B19EEF"
                    patternScale={2}

                    patternDensity={1}
                    pixelSizeJitter={0}
                    enableRipples={true}
                    rippleSpeed={0.4}
                    rippleThickness={0.12}
                    rippleIntensityScale={1.5}
                    liquid={false}
                    liquidStrength={0.12}
                    liquidRadius={1.2}
                    liquidWobbleSpeed={5}
                    speed={0.5}
                    edgeFade={0.25}
                    transparent={true}
                    className="absolute inset-0 z-0 opacity-40"
                    noiseAmount={0}
                />
            </div>

            <div className="container mx-auto px-6 h-full flex items-center z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 w-full h-full max-h-[800px] py-4">

                    {/* Left Content */}
                    <div className="flex-[1.2] text-left w-full max-w-3xl flex flex-col justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <Badge
                                variant="outline"
                                className="mb-6 px-3 py-1 text-[10px] font-mono border-violet-500/30 bg-violet-500/10 text-violet-300 uppercase tracking-wide rounded-full shadow-[0_0_20px_-5px_rgba(109,40,217,0.5)] backdrop-blur-md w-fit"
                            >
                                <Shield className="w-3 h-3 mr-1.5 text-violet-400" /> SECURITY MIDDLEWARE SDK
                            </Badge>

                            <h1 className="mb-6 text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1]">
                                <DecryptedText
                                    text="Application-level request security"
                                    animateOn="view"
                                    revealDirection="start"
                                    speed={100}
                                    maxIterations={15}
                                    characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                                    className="bg-gradient-to-br from-white via-white/90 to-[#8B5CF6] bg-clip-text text-transparent jersey-20-regular drop-shadow-[0_5px_15px_rgba(139,92,246,0.3)]"
                                    parentClassName="inline-block"
                                    sequential={true}
                                />
                            </h1>

                            <p className="mb-8 text-lg md:text-xl text-gray-200 leading-relaxed max-w-xl">
                                Intercept malicious requests before they reach your business logic. Prevent session hijacking, device spoofing, and API abuse with a single robust SDK.
                            </p>

                            {/* Bun-style Install Block */}
                            <div className="w-full max-w-2xl mb-6">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-white" /> npm install aria-sdk
                                    </h3>
                                    <span className="text-[10px] text-gray-400 font-mono">v1.104.3</span>
                                </div>
                                <div className="relative group rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/5 hover:ring-primary/50 transition-all duration-300">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                    
                                    {/* Tabs */}
                                    <div className="flex items-center border-b border-white/10 bg-white/5">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={cn(
                                                    "relative px-5 py-3 text-xs font-medium transition-colors hover:text-white focus:outline-none",
                                                    activeTab === tab.id ? "text-white" : "text-muted-foreground"
                                                )}
                                            >
                                                {tab.label}
                                                {activeTab === tab.id && (
                                                    <motion.div
                                                        layoutId="activeTab"
                                                        className="absolute inset-0 border-b-2 border-primary bg-white/5"
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Command Content */}
                                    <div className="p-4 flex items-center justify-between relative pl-5">
                                        <div className="flex items-center gap-3 font-mono text-sm text-white/90 overflow-x-auto no-scrollbar">
                                            <ChevronRight className="w-4 h-4 text-primary shrink-0" /> 
                                            <AnimatePresence mode="wait">
                                                <motion.span
                                                    key={activeTab}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {tabs.find(t => t.id === activeTab)?.command}
                                                </motion.span>
                                            </AnimatePresence>
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className="ml-4 p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white group/copy"
                                            title="Copy to clipboard"
                                        >
                                            <AnimatePresence mode="wait" initial={false}>
                                                {copied ? (
                                                    <motion.div
                                                        key="check"
                                                        initial={{ scale: 0.5, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0.5, opacity: 0 }}
                                                    >
                                                        <Check className="w-4 h-4 text-emerald-400" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="copy"
                                                        initial={{ scale: 0.5, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0.5, opacity: 0 }}
                                                    >
                                                        <Copy className="w-4 h-4 group-hover/copy:text-white transition-colors" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Used By Section */}
                             <motion.div 
                                className="w-full max-w-lg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                            >
                            <div className="text-[10px] font-bold tracking-widest text-gray-400 mb-3 uppercase flex items-center gap-2">
                                     Built for modern attacks
                                </div>
                                {/* <div className="flex items-center gap-6 md:gap-8 flex-wrap grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                    <SiStripe className="h-5 w-auto" />
                                    <SiVercel className="h-4 w-auto" />
                                    <SiCloudflare className="h-6 w-auto" />
                                    <SiSupabase className="h-5 w-auto" />
                                    <SiOpenai className="h-5 w-auto" />
                                </div> */}
                            </motion.div>

                        </motion.div>
                    </div>

                    {/* Right Visual Panel - Dynamic Live Threat Console */}
                    <div className="flex-1 w-full max-w-lg lg:max-w-none lg:flex-[1.0] flex flex-col items-center lg:items-end gap-4 mt-8 lg:mt-0">
                         {/* Live Log Badge */}
                         <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            className="w-full flex justify-end"
                        >
                             <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-[0_0_10px_-2px_rgba(16,185,129,0.3)]">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE TRAFFIC MONITOR
                            </div>
                        </motion.div>

                        <motion.div
                            className="w-full"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        >
                             <motion.div 
                                className="relative rounded-2xl border border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl overflow-hidden shadow-2xl group"
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.4 }}
                            >
                                 {/* Animated Gradient Border */}
                                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-primary/5 to-transparent opacity-30 pointer-events-none" />

                                 <div className="p-6 md:p-8 flex flex-col relative w-full h-[500px]">
                                    
                                    {/* Console Header */}
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-400 flex items-center gap-4">
                                            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> us-east-1</span>
                                            <span className="text-white/40">|</span>
                                            <span>Inbound: {stats.requests}/s</span>
                                            <span className="text-white/40">|</span>
                                            <span className="text-red-400">Blocked: {stats.blocked}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Table Header */}
                                    <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-4 mb-4 text-[10px] font-bold text-gray-500 tracking-widest uppercase px-1">
                                        <div>Request Type</div>
                                        <div>Legacy WAF</div>
                                        <div className="text-right">ARIA Response</div>
                                    </div>

                                    {/* Live Threat Rows - Animated Stream */}
                                    <div className="flex flex-col space-y-3 font-mono text-xs overflow-hidden relative flex-1">
                                        <AnimatePresence initial={false}>
                                            {events.map((threat) => (
                                                <motion.div 
                                                    key={threat.id}
                                                    initial={{ opacity: 0, x: 20, height: 0 }}
                                                    animate={{ opacity: 1, x: 0, height: "auto" }}
                                                    exit={{ opacity: 0, x: -20, height: 0, transition: { duration: 0.2 } }}
                                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                                    className="grid grid-cols-[1.5fr_1fr_1fr] gap-4 items-center p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    {/* Request Type */}
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-gray-200 font-medium">
                                                            <FileWarning className="w-3 h-3 text-red-400" />
                                                            <span className="truncate">{threat.type}</span>
                                                        </div>
                                                        <span className="text-[9px] text-muted-foreground truncate opacity-50">{threat.payload}</span>
                                                    </div>
                                                    
                                                    {/* WAF Status */}
                                                    <div className="flex items-center gap-2">
                                                        {threat.waf_status === "Missed" ? (
                                                             <Badge variant="outline" className="text-[9px] px-2 py-0 h-5 border-red-500/30 text-red-500 bg-red-500/5">
                                                                <X className="w-2.5 h-2.5 mr-1" /> Missed
                                                             </Badge>
                                                        ) : threat.waf_status === "False Positive" ? (
                                                            <Badge variant="outline" className="text-[9px] px-2 py-0 h-5 border-yellow-500/30 text-yellow-500 bg-yellow-500/5">
                                                                <AlertTriangle className="w-2.5 h-2.5 mr-1" /> False Pos
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-[9px] text-gray-600">--</span>
                                                        )}
                                                    </div>

                                                    {/* ARIA Status */}
                                                    <div className="flex flex-col items-end gap-1">
                                                        {threat.aria_status === "Blocked" ? (
                                                            <Badge variant="outline" className="text-[9px] px-2 py-0.5 h-6 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_-3px_rgba(16,185,129,0.2)]">
                                                                <Shield className="w-2.5 h-2.5 mr-1.5" /> Blocked
                                                            </Badge>
                                                        ) : threat.aria_status === "Verified" ? (
                                                             <Badge variant="outline" className="text-[9px] px-2 py-0.5 h-6 border-blue-500/30 text-blue-400 bg-blue-500/10">
                                                                <Check className="w-2.5 h-2.5 mr-1.5" /> Verified
                                                            </Badge>
                                                        ) : (
                                                             <Badge variant="outline" className="text-[9px] px-2 py-0.5 h-6 border-orange-500/30 text-orange-400 bg-orange-500/10">
                                                                <Lock className="w-2.5 h-2.5 mr-1.5" /> Challenge
                                                            </Badge>
                                                        )}
                                                        <span className="text-[9px] text-muted-foreground">{threat.aria_context}</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        
                                        {/* Fade out bottom */}
                                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
                                    </div>

                                    {/* Console Footer */}
                                    <div className="pt-4 flex items-center justify-between pointer-events-none border-t border-white/10 mt-2">
                                        <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden mr-4">
                                            <motion.div 
                                                className="h-full bg-primary/50"
                                                animate={{ width: ["0%", "100%"] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-3">
                                            <span>Scanning...</span>
                                            <span className="w-px h-3 bg-white/10" />
                                            <span className="tabular-nums">Latency: {stats.latency}ms</span>
                                        </div>
                                    </div>
                                 </div>

                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
