"use client";

import React, { useEffect } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Handle,
    Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Task, Team, User } from "../api";

// Helper to clean leading emojis from workspace name
const cleanWorkspaceName = (name: string, emoji?: string) => {
    let clean = name.trim();
    if (emoji && clean.startsWith(emoji)) {
        clean = clean.slice(emoji.length).trim();
    }
    // Remove any leading emoji character safely
    clean = clean.replace(/^\p{Emoji_Presentation}\s*/u, "");
    return clean;
};

// ─── 1. Custom Node: Leader Node ───
function LeaderNode({ data }: { data: { label?: string; name?: string; teamName?: string; emoji?: string } }) {
    const displayName = cleanWorkspaceName(data.teamName || "Workspace", data.emoji);

    return (
        <div className="px-5 py-4 rounded-[4px] border border-[var(--app-border-strong)] bg-gradient-to-b from-[var(--app-card)] to-[var(--app-select-bg)] shadow-[var(--shadow-float)] text-center min-w-[170px] relative corner-brackets font-sans flex flex-col items-center gap-2">
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <div className="w-10 h-10 rounded-full bg-[var(--app-card)] border border-[var(--app-border)] flex items-center justify-center text-lg shadow-sm emoji-font shrink-0">
                {data.emoji || "🧑‍💻"}
            </div>
            <div className="text-xs font-bold text-[var(--app-text)] leading-tight">
                {displayName}
            </div>
        </div>
    );
}

// ─── 2. Custom Node: Member Node ───
function MemberNode({ data }: { data: { name: string; initials: string; role: string } }) {
    return (
        <div className="px-4 py-2.5 rounded-[2px] border border-[var(--app-border)] bg-[var(--app-card)] hover:border-[var(--color-accent)] shadow-md flex items-center gap-2.5 min-w-[160px] transition-colors relative corner-brackets cursor-pointer font-sans font-medium">
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <div className="w-8 h-8 rounded-full bg-[var(--app-select-bg)] flex items-center justify-center text-xs font-semibold text-[var(--app-text)] border border-[var(--app-border)] shrink-0">
                {data.initials}
            </div>
            <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-medium text-[var(--app-text)] truncate leading-tight">
                    {data.name}
                </span>
                <span className="text-[9px] text-[var(--app-muted)] font-semibold capitalize mt-0.5">
                    {data.role}
                </span>
            </div>
        </div>
    );
}

// ─── 3. Custom Node: Task Node ───
function TaskNode({ data }: { data: { title: string; priority: string; column: string } }) {
    const priorityColors: Record<string, string> = {
        HIGH: "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20",
        MEDIUM: "text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20",
        LOW: "text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20",
    };

    const colColors: Record<string, string> = {
        "need attention": "border-[var(--color-error)]",
        "need attention later": "border-[var(--color-warning)]",
        "done": "border-[var(--color-success)]",
    };

    const borderClass = colColors[data.column.toLowerCase().trim()] || "border-[var(--app-border-strong)]";
    const priorityStyle = priorityColors[data.priority.toUpperCase()] || "text-[var(--app-muted)] bg-[var(--app-select-bg)] border-[var(--app-border)]";

    return (
        <div className="px-3 py-2 rounded-[2px] border border-[var(--app-border)] bg-[var(--app-card)] hover:border-[var(--color-accent)] shadow-sm min-w-[180px] max-w-[200px] transition-colors relative corner-brackets cursor-pointer font-sans">
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <div className="flex flex-col gap-1.5 text-left">
                <div className="text-xs font-medium text-[var(--app-text)] leading-snug line-clamp-2">
                    {data.title}
                </div>
                <div className="flex items-center justify-between gap-2 shrink-0">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] border ${priorityStyle}`}>
                        {data.priority}
                    </span>
                    <span className="text-[9px] text-[var(--app-muted)] font-medium truncate">
                        {data.column}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── 4. Custom Node: Unassigned Header Node ───
function UnassignedHeaderNode() {
    return (
        <div className="px-4 py-2.5 rounded-[2px] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-bg)] text-center min-w-[160px] relative corner-brackets font-sans">
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <div className="text-[9px] capitalize font-bold   text-[var(--app-muted)] mb-0.5">
                Unassigned
            </div>
            <div className="text-xs font-semibold text-[var(--app-muted)] leading-tight">
                No Owner Tasks
            </div>
        </div>
    );
}

const nodeTypes = {
    leader: LeaderNode,
    member: MemberNode,
    task: TaskNode,
    unassigned: UnassignedHeaderNode,
    spacer: () => <div style={{ width: 1, height: 1, opacity: 0 }} />,
};

interface SolarMapViewProps {
    currentTeam: Team;
    currentUser: User;
    userRole: string;
    teamMembers: { user: User; role: string }[];
    tasks: Task[];
    onSelectTask: (taskId: string) => void;
    onSelectMember: (user: User) => void;
}

export default function SolarMapView({
    currentTeam,
    currentUser,
    userRole,
    teamMembers,
    tasks,
    onSelectTask,
    onSelectMember,
}: SolarMapViewProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        const activeTasks = tasks.filter((t) => !t.isSoftDeleted && !t.isArchived);

        // Group tasks by assignee
        const tasksByAssignee: Record<string, typeof activeTasks> = {};
        const unassignedTasks: typeof activeTasks = [];

        activeTasks.forEach((task) => {
            if (task.assignedToId) {
                if (!tasksByAssignee[task.assignedToId]) {
                    tasksByAssignee[task.assignedToId] = [];
                }
                tasksByAssignee[task.assignedToId].push(task);
            } else {
                unassignedTasks.push(task);
            }
        });

        // Find leader in teamMembers
        const leaderMembership = teamMembers.find((m) => m.role === "LEADER");
        const leaderUser = leaderMembership?.user;
        const leaderId = leaderUser?.id || currentUser?.id || "leader";
        const leaderName = leaderUser?.name || currentUser?.name || "Workspace Leader";

        const tempNodes: Node[] = [];
        const tempEdges: Edge[] = [];

        // Sort team members so the Leader is always the first column
        const sortedMembers = [...teamMembers].sort((a, b) => {
            if (a.role === "LEADER") return -1;
            if (b.role === "LEADER") return 1;
            return 0;
        });

        const hasUnassigned = unassignedTasks.length > 0;
        const columnCount = sortedMembers.length + (hasUnassigned ? 1 : 0);

        // Grid/Tree layout configuration
        const colWidth = 240;
        const startX = 0;
        const leaderY = 50;
        const level2Y = 200;
        const taskStartY = 350;
        const taskGapY = 110;

        // Centered horizontal coordinate for the leader node
        const totalWidth = (columnCount - 1) * colWidth;
        const leaderX = startX + totalWidth / 2;

        // 1. Center Top Node: Leader Role Header
        tempNodes.push({
            id: `top-leader-${leaderId}`,
            type: "leader",
            position: { x: leaderX, y: leaderY },
            data: {
                label: "Leader",
                name: leaderName,
                teamName: currentTeam.name,
                emoji: currentTeam.emoji || "🧑‍💻"
            },
        });

        // 2. Member Columns (Level 2 Headers & Level 3 Tasks)
        sortedMembers.forEach((member, colIdx) => {
            const colX = startX + colIdx * colWidth;
            const initials = member.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

            // Render Level 2 Node: Member header card
            tempNodes.push({
                id: member.user.id,
                type: "member",
                position: { x: colX, y: level2Y },
                data: {
                    name: member.user.name,
                    initials,
                    role: member.role,
                    userObj: member.user,
                },
            });

            // Connect Top Leader to Member Card
            tempEdges.push({
                id: `edge-top-leader-${member.user.id}`,
                source: `top-leader-${leaderId}`,
                target: member.user.id,
                style: { stroke: "var(--color-accent)", strokeWidth: 1.5 },
            });

            // Render Level 3 Nodes: Tasks stacked vertically below their assignee card
            const memberTasks = tasksByAssignee[member.user.id] || [];
            memberTasks.forEach((task, taskIdx) => {
                const taskY = taskStartY + taskIdx * taskGapY;

                tempNodes.push({
                    id: task.id,
                    type: "task",
                    position: { x: colX, y: taskY },
                    data: {
                        title: task.title,
                        priority: task.priority || "MEDIUM",
                        column: task.column?.name || "To Do",
                    },
                });

                // Connect Member Node to Task Node
                tempEdges.push({
                    id: `edge-${member.user.id}-${task.id}`,
                    source: member.user.id,
                    target: task.id,
                    style: { stroke: "var(--app-border)", strokeWidth: 1.2 },
                });
            });
        });

        // 3. Unassigned Column (if there are unassigned tasks)
        if (hasUnassigned) {
            const colIdx = sortedMembers.length;
            const colX = startX + colIdx * colWidth;

            // Render Level 2 Node: Unassigned header card
            tempNodes.push({
                id: "unassigned-header",
                type: "unassigned",
                position: { x: colX, y: level2Y },
                data: {},
            });

            // Connect Top Leader to Unassigned Header card
            tempEdges.push({
                id: "edge-top-leader-unassigned",
                source: `top-leader-${leaderId}`,
                target: "unassigned-header",
                style: { stroke: "var(--color-accent)", strokeWidth: 1.5 },
            });

            // Render Level 3 Nodes: Unassigned tasks stacked vertically
            unassignedTasks.forEach((task, taskIdx) => {
                const taskY = taskStartY + taskIdx * taskGapY;

                tempNodes.push({
                    id: task.id,
                    type: "task",
                    position: { x: colX, y: taskY },
                    data: {
                        title: task.title,
                        priority: task.priority || "MEDIUM",
                        column: task.column?.name || "To Do",
                    },
                });

                // Connect Unassigned Header card to Task Node
                tempEdges.push({
                    id: `edge-unassigned-${task.id}`,
                    source: "unassigned-header",
                    target: task.id,
                    style: { stroke: "var(--app-border)", strokeWidth: 1.2 },
                });
            });
        }

        // Add dummy bottom spacer to lift the entire layout up on startup
        if (tempNodes.length > 0) {
            const maxY = Math.max(...tempNodes.map((n) => n.position.y));
            tempNodes.push({
                id: "bottom-spacer",
                type: "spacer",
                position: { x: leaderX, y: maxY + 240 },
                data: {},
                draggable: false,
                selectable: false,
            });
        }

        setNodes(tempNodes);
        setEdges(tempEdges);
    }, [teamMembers, tasks, currentUser, currentTeam, setNodes, setEdges]);

    const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
        if (node.type === "task") {
            onSelectTask(node.id);
        } else if (node.type === "member" && node.data.userObj) {
            onSelectMember(node.data.userObj as User);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[var(--app-bg)] relative select-none">


            {/* React Flow Container */}
            <div className="flex-1 min-h-0 w-full relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodeClick={handleNodeClick}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    fitViewOptions={{ padding: 0.22 }}
                    minZoom={0.1}
                    maxZoom={1.5}
                    className="w-full h-full"
                >
                    <Background color="var(--app-border-strong)" gap={16} size={1} />
                    <Controls className="bg-[var(--app-card)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[3px]" />
                    <MiniMap
                        nodeStrokeColor="var(--app-border-strong)"
                        nodeColor="var(--app-card)"
                        bgColor="var(--app-bg)"
                        maskColor="rgba(0, 0, 0, 0.05)"
                        className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px]"
                    />
                </ReactFlow>
            </div>
        </div>
    );
}
