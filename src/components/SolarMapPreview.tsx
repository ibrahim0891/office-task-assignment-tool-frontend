"use client";

import React from "react";
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Handle,
    Position,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CheckCircle2, Clock, AlertCircle, Sparkles } from "lucide-react";

// ─── Custom Node 1: Leader Node ───
function LeaderNode({ data }: { data: { name: string; role: string; team: string } }) {
    return (
        <div className="px-5 py-4 rounded-[4px] border border-[var(--app-border-strong)] bg-gradient-to-b from-[var(--app-card)] to-[var(--app-select-bg)] shadow-md text-center min-w-[170px] relative corner-brackets font-sans flex flex-col items-center gap-2">
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <div className="w-9 h-9 rounded-full bg-[var(--app-card)] border border-[var(--app-border)] flex items-center justify-center text-sm shadow-xs shrink-0">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div className="text-xs font-bold text-[var(--app-text)] leading-tight">
                {data.team}
            </div>
        </div>
    );
}

// ─── Custom Node 2: Member Node ───
function MemberNode({ data }: { data: { name: string; initials: string; role: string; taskCount: number } }) {
    return (
        <div className="px-3.5 py-2 rounded-[3px] border border-[var(--app-border-strong)] bg-[var(--app-card)] hover:border-[var(--app-text)] shadow-xs flex items-center gap-2.5 min-w-[170px] transition-all relative corner-brackets font-sans">
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <div className="w-7 h-7 rounded-full bg-[var(--app-select-bg)] flex items-center justify-center text-[10px] font-bold text-[var(--app-text)] border border-[var(--app-border)] shrink-0">
                {data.initials}
            </div>
            <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-semibold text-[var(--app-text)] truncate leading-tight">
                    {data.name}
                </span>
                <span className="text-[9px] text-[var(--app-muted)] font-medium">
                    {data.role} • {data.taskCount} tasks
                </span>
            </div>
        </div>
    );
}

// ─── Custom Node 3: Task Node ───
function TaskNode({ data }: { data: { title: string; priority: string; status: string; statusType: "done" | "progress" | "urgent" } }) {
    const statusBadges = {
        done: {
            bg: "bg-[#22863A]/10 text-[#22863A] border-[#22863A]/20",
            icon: <CheckCircle2 className="w-2.5 h-2.5" />,
        },
        progress: {
            bg: "bg-[#B08800]/10 text-[#B08800] border-[#B08800]/20",
            icon: <Clock className="w-2.5 h-2.5" />,
        },
        urgent: {
            bg: "bg-[#CB2431]/10 text-[#CB2431] border-[#CB2431]/20",
            icon: <AlertCircle className="w-2.5 h-2.5" />,
        },
    };

    const currentBadge = statusBadges[data.statusType] || statusBadges.progress;

    return (
        <div className="px-3 py-2 rounded-[3px] border border-[var(--app-border)] bg-[var(--app-card)] hover:border-[var(--app-text)] shadow-xs min-w-[165px] max-w-[180px] transition-all relative corner-brackets font-sans">
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <div className="flex flex-col gap-1 text-left">
                <div className="text-[11px] font-semibold text-[var(--app-text)] leading-snug line-clamp-2">
                    {data.title}
                </div>
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-[var(--app-border)]">
                    <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] border ${currentBadge.bg}`}>
                        {currentBadge.icon}
                        <span>{data.status}</span>
                    </span>
                    <span className="text-[8px] font-mono text-[var(--app-muted)] font-medium">
                        {data.priority}
                    </span>
                </div>
            </div>
        </div>
    );
}

const nodeTypes = {
    leader: LeaderNode,
    member: MemberNode,
    task: TaskNode,
};

const initialNodes: Node[] = [
    // 1. Leader (Root)
    {
        id: "leader",
        type: "leader",
        position: { x: 260, y: 15 },
        data: {
            name: "Mohammad Ibrahim",
            role: "Engineering Lead",
            team: "AI Department",
        },
    },

    // 2. Team Members (Level 1)
    {
        id: "member-hasib",
        type: "member",
        position: { x: 30, y: 120 },
        data: {
            name: "Md Hasibul Islam",
            initials: "HI",
            role: "Full-Stack Dev",
            taskCount: 2,
        },
    },
    {
        id: "member-sarah",
        type: "member",
        position: { x: 260, y: 120 },
        data: {
            name: "Sarah Jenkins",
            initials: "SJ",
            role: "Frontend Engineer",
            taskCount: 1,
        },
    },
    {
        id: "member-david",
        type: "member",
        position: { x: 490, y: 120 },
        data: {
            name: "David Chen",
            initials: "DC",
            role: "DevOps & QA",
            taskCount: 1,
        },
    },

    // 3. Tasks (Level 2)
    {
        id: "task-1",
        type: "task",
        position: { x: 10, y: 220 },
        data: {
            title: "Solar Map React Flow Graph",
            priority: "URGENT",
            status: "IN PROGRESS",
            statusType: "progress",
        },
    },
    {
        id: "task-2",
        type: "task",
        position: { x: 10, y: 310 },
        data: {
            title: "Multi-Theme Dark Architecture",
            priority: "HIGH",
            status: "VERIFIED",
            statusType: "done",
        },
    },
    {
        id: "task-3",
        type: "task",
        position: { x: 260, y: 220 },
        data: {
            title: "WYSIWYG TipTap Knowledge Hub",
            priority: "MEDIUM",
            status: "IN REVIEW",
            statusType: "progress",
        },
    },
    {
        id: "task-4",
        type: "task",
        position: { x: 490, y: 220 },
        data: {
            title: "Role Governance & Security Matrix",
            priority: "CRITICAL",
            status: "DEPLOYED",
            statusType: "done",
        },
    },
];

const initialEdges: Edge[] = [
    // Leader -> Members
    {
        id: "e-leader-hasib",
        source: "leader",
        target: "member-hasib",
        animated: true,
        type: "smoothstep",
        style: { stroke: "var(--color-accent)", strokeWidth: 1.5 },
    },
    {
        id: "e-leader-sarah",
        source: "leader",
        target: "member-sarah",
        animated: true,
        type: "smoothstep",
        style: { stroke: "var(--color-accent)", strokeWidth: 1.5 },
    },
    {
        id: "e-leader-david",
        source: "leader",
        target: "member-david",
        animated: true,
        type: "smoothstep",
        style: { stroke: "var(--color-accent)", strokeWidth: 1.5 },
    },

    // Members -> Tasks
    {
        id: "e-hasib-t1",
        source: "member-hasib",
        target: "task-1",
        type: "smoothstep",
        style: { stroke: "var(--app-border-strong)", strokeWidth: 1.5 },
    },
    {
        id: "e-hasib-t2",
        source: "member-hasib",
        target: "task-2",
        type: "smoothstep",
        style: { stroke: "var(--app-border-strong)", strokeWidth: 1.5 },
    },
    {
        id: "e-sarah-t3",
        source: "member-sarah",
        target: "task-3",
        type: "smoothstep",
        style: { stroke: "var(--app-border-strong)", strokeWidth: 1.5 },
    },
    {
        id: "e-david-t4",
        source: "member-david",
        target: "task-4",
        type: "smoothstep",
        style: { stroke: "var(--app-border-strong)", strokeWidth: 1.5 },
    },
];

export default function SolarMapPreview() {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    return (
        <div className="relative w-full h-[400px] bg-[var(--app-bg)] rounded-[3px] border border-[var(--app-border)] overflow-hidden animate-fade-in select-none">
            {/* Top Toolbar overlay */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <div className="bg-[var(--app-card)]/90 backdrop-blur-xs border border-[var(--app-border)] px-2.5 py-1 rounded-[3px] text-[10px] font-semibold text-[var(--app-text)] shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-error)] animate-pulse" />
                    <span>Solar Relational Map Node Topology</span>
                </div>
                <div className="hidden sm:inline-flex bg-[var(--app-card)]/90 backdrop-blur-xs border border-[var(--app-border)] px-2 py-1 rounded-[3px] text-[10px] text-[var(--app-muted)] shadow-xs">
                    Drag nodes to rearrange
                </div>
            </div>

            {/* Bottom Status overlay */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
                <div className="bg-[var(--app-card)]/90 backdrop-blur-xs border border-[var(--app-border)] px-2.5 py-1 rounded-[3px] text-[10px] text-[var(--app-muted)] shadow-xs flex items-center gap-2">
                    <span className="text-[var(--app-text)] font-semibold">1 Leader</span>
                    <span>•</span>
                    <span className="text-[var(--app-text)] font-semibold">3 Members</span>
                    <span>•</span>
                    <span className="text-[var(--app-text)] font-semibold">4 Active Tasks</span>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.6}
                maxZoom={1.4}
                attributionPosition="bottom-right"
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={16}
                    size={1}
                    color="var(--app-border-strong)"
                />
                <Controls
                    showInteractive={false}
                    className="!bg-[var(--app-card)] !border-[var(--app-border)] !shadow-xs !rounded-[3px] [&>button]:!bg-[var(--app-card)] [&>button]:!border-b-[var(--app-border)] [&>button]:!text-[var(--app-text)] [&>button:hover]:!bg-[var(--app-hover-bg)]"
                />
            </ReactFlow>
        </div>
    );
}
