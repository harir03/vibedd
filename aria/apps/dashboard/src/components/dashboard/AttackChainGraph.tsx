// [ARIA] Attack Chain Graph — Interactive React Flow visualization of kill chain stages.
// Feature 12: Maps incidents to MITRE ATT&CK kill chain stages as an interactive node-edge graph.
// Uses @xyflow/react (React Flow v12) with custom AttackNode components.

"use client";

import React, { useMemo, useCallback, useState } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    type Node,
    type Edge,
    type NodeTypes,
    useNodesState,
    useEdgesState,
    ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import {
    Crosshair,
    Shield,
    Send,
    Bug,
    Download,
    Radio,
    FileOutput,
    AlertTriangle,
} from "lucide-react";

// [ARIA] Kill chain stage config — position, colors, icon
const STAGES = [
    { key: "reconnaissance", label: "Reconnaissance", icon: Crosshair, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", y: 0 },
    { key: "weaponization", label: "Weaponization", icon: Shield, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", y: 1 },
    { key: "delivery", label: "Delivery", icon: Send, color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", y: 2 },
    { key: "exploitation", label: "Exploitation", icon: Bug, color: "#f97316", bg: "#fff7ed", border: "#fed7aa", y: 3 },
    { key: "installation", label: "Installation", icon: Download, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", y: 4 },
    { key: "command_control", label: "Command & Control", icon: Radio, color: "#ef4444", bg: "#fef2f2", border: "#fecaca", y: 5 },
    { key: "exfiltration", label: "Exfiltration", icon: FileOutput, color: "#e11d48", bg: "#fff1f2", border: "#fecdd3", y: 6 },
] as const;

// [ARIA] Severity → color mapping for incident nodes
const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    critical: { bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c" },
    high: { bg: "#fff7ed", border: "#fdba74", text: "#c2410c" },
    medium: { bg: "#fffbeb", border: "#fcd34d", text: "#a16207" },
    low: { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
    info: { bg: "#f8fafc", border: "#cbd5e1", text: "#475569" },
};

// [ARIA] Incident data shape from the API
interface ChainIncident {
    _id: string;
    title: string;
    category: string;
    severity: string;
    status: string;
    attackStage: string;
    alertCount: number;
    avgFidelity: number;
    sourceIPs: string[];
    targetEndpoints: string[];
    createdAt: string;
}

// [ARIA] Custom node data types
interface StageNodeData {
    label: string;
    count: number;
    color: string;
    bg: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
    [key: string]: unknown;
}

interface IncidentNodeData {
    title: string;
    category: string;
    severity: string;
    fidelity: number;
    alertCount: number;
    sourceIPs: string[];
    status: string;
    createdAt: string;
    [key: string]: unknown;
}

// ─── Stage Node ─────────────────────────────────────────────────
// [ARIA] Represents a kill chain stage with incident count
function StageNode({ data }: { data: StageNodeData }) {
    const Icon = data.icon;
    return (
        <div
            className={cn(
                "rounded-xl border-2 px-5 py-3 min-w-[160px] text-center shadow-sm transition-all",
                data.isActive ? "shadow-md" : "opacity-60"
            )}
            style={{
                backgroundColor: data.isActive ? data.bg : "#f8fafc",
                borderColor: data.isActive ? data.border : "#e2e8f0",
            }}
        >
            <Handle type="target" position={Position.Left} className="!bg-slate-300 !w-2 !h-2" />
            <div className="flex items-center justify-center gap-2 mb-1">
                <Icon
                    className="w-4 h-4"
                    style={{ color: data.isActive ? data.color : "#94a3b8" }}
                />
                <span
                    className="text-xs font-bold uppercase tracking-tight"
                    style={{ color: data.isActive ? data.color : "#94a3b8" }}
                >
                    {data.label}
                </span>
            </div>
            <span
                className="text-2xl font-black leading-none"
                style={{ color: data.isActive ? data.color : "#cbd5e1" }}
            >
                {data.count}
            </span>
            <Handle type="source" position={Position.Right} className="!bg-slate-300 !w-2 !h-2" />
        </div>
    );
}

// ─── Incident Node ──────────────────────────────────────────────
// [ARIA] Represents an individual incident within a stage
function IncidentNode({ data }: { data: IncidentNodeData }) {
    const sev = SEVERITY_COLORS[data.severity] ?? SEVERITY_COLORS.info;
    return (
        <div
            className="rounded-lg border-2 px-3 py-2 min-w-[150px] max-w-[200px] shadow-sm cursor-pointer hover:shadow-md transition-all"
            style={{ backgroundColor: sev.bg, borderColor: sev.border }}
        >
            <Handle type="target" position={Position.Left} className="!bg-slate-300 !w-1.5 !h-1.5" />
            <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: sev.text }} />
                <span className="text-[10px] font-bold truncate" style={{ color: sev.text }}>
                    {data.title}
                </span>
            </div>
            <div className="flex items-center gap-2 text-[9px]" style={{ color: sev.text }}>
                <span className="font-mono bg-white/60 px-1 rounded">{data.category}</span>
                <span className="font-bold">F:{data.fidelity}</span>
                <span>{data.alertCount} alerts</span>
            </div>
            {data.sourceIPs?.length > 0 && (
                <div className="text-[8px] mt-1 opacity-70 truncate" style={{ color: sev.text }}>
                    {data.sourceIPs.slice(0, 2).join(", ")}
                    {data.sourceIPs.length > 2 && ` +${data.sourceIPs.length - 2}`}
                </div>
            )}
            <Handle type="source" position={Position.Right} className="!bg-slate-300 !w-1.5 !h-1.5" />
        </div>
    );
}

// [ARIA] Register custom node types
const nodeTypes: NodeTypes = {
    stageNode: StageNode,
    incidentNode: IncidentNode,
};

interface AttackChainGraphProps {
    stages: Record<string, number>;
    incidents: ChainIncident[];
}

export default function AttackChainGraph({ stages, incidents }: AttackChainGraphProps) {
    // [ARIA] Build nodes and edges from stage counts + incident data
    const { initialNodes, initialEdges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        const stageX = 60;
        const stageYSpacing = 140;
        const incidentXOffset = 280;
        const incidentYSpacing = 80;

        // Create stage nodes (vertical column on the left)
        STAGES.forEach((stage, idx) => {
            const count = stages[stage.key] ?? 0;
            nodes.push({
                id: `stage-${stage.key}`,
                type: "stageNode",
                position: { x: stageX, y: idx * stageYSpacing },
                data: {
                    label: stage.label,
                    count,
                    color: stage.color,
                    bg: stage.bg,
                    border: stage.border,
                    icon: stage.icon,
                    isActive: count > 0,
                } satisfies StageNodeData,
                draggable: false,
            });

            // Connect stages sequentially
            if (idx > 0) {
                edges.push({
                    id: `stage-edge-${idx}`,
                    source: `stage-${STAGES[idx - 1].key}`,
                    target: `stage-${stage.key}`,
                    type: "smoothstep",
                    animated: count > 0 && (stages[STAGES[idx - 1].key] ?? 0) > 0,
                    style: {
                        stroke: count > 0 ? stage.color : "#e2e8f0",
                        strokeWidth: count > 0 ? 2 : 1,
                    },
                });
            }
        });

        // Group incidents by stage
        const incidentsByStage: Record<string, ChainIncident[]> = {};
        for (const inc of incidents) {
            if (!inc.attackStage || inc.attackStage === "unknown") continue;
            if (!incidentsByStage[inc.attackStage]) incidentsByStage[inc.attackStage] = [];
            incidentsByStage[inc.attackStage].push(inc);
        }

        // Create incident nodes (to the right of each stage)
        STAGES.forEach((stage, stageIdx) => {
            const stageIncidents = incidentsByStage[stage.key] ?? [];
            stageIncidents.slice(0, 5).forEach((inc, incIdx) => {
                const nodeId = `incident-${inc._id}`;
                nodes.push({
                    id: nodeId,
                    type: "incidentNode",
                    position: {
                        x: incidentXOffset + incIdx * 220,
                        y: stageIdx * stageYSpacing - 10,
                    },
                    data: {
                        title: inc.title ?? "Untitled",
                        category: inc.category ?? "—",
                        severity: inc.severity ?? "info",
                        fidelity: Math.round(inc.avgFidelity ?? 0),
                        alertCount: inc.alertCount ?? 0,
                        sourceIPs: inc.sourceIPs ?? [],
                        status: inc.status ?? "open",
                        createdAt: inc.createdAt ?? "",
                    } satisfies IncidentNodeData,
                });

                // Connect stage → incident
                edges.push({
                    id: `edge-${stage.key}-${inc._id}`,
                    source: `stage-${stage.key}`,
                    target: nodeId,
                    type: "smoothstep",
                    animated: true,
                    style: {
                        stroke: stage.color,
                        strokeWidth: 1.5,
                        strokeDasharray: "5 3",
                    },
                });
            });
        });

        return { initialNodes: nodes, initialEdges: edges };
    }, [stages, incidents]);

    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edgesState, , onEdgesChange] = useEdgesState(initialEdges);

    // [ARIA] Check if there's any data to display
    const hasData = Object.values(stages).some((v) => v > 0) || incidents.length > 0;

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                <AlertTriangle className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs font-medium">No attack chain data to visualize</p>
                <p className="text-[10px] mt-1">Incidents will appear here when detected</p>
            </div>
        );
    }

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-100">
            <ReactFlow
                nodes={nodes}
                edges={edgesState}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                connectionLineType={ConnectionLineType.SmoothStep}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.3}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#e2e8f0" gap={20} size={1} />
                <Controls
                    showInteractive={false}
                    className="!bg-white !border-gray-200 !rounded-lg !shadow-sm"
                />
                <MiniMap
                    nodeStrokeWidth={3}
                    nodeColor={(node) => {
                        if (node.type === "stageNode") return (node.data as StageNodeData).color;
                        if (node.type === "incidentNode") {
                            const sev = (node.data as IncidentNodeData).severity;
                            return SEVERITY_COLORS[sev]?.border ?? "#cbd5e1";
                        }
                        return "#cbd5e1";
                    }}
                    className="!bg-white !border-gray-200 !rounded-lg !shadow-sm"
                    maskColor="rgba(248,250,252,0.8)"
                />
            </ReactFlow>
        </div>
    );
}
