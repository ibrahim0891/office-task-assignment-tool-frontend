"use client";

import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    ControlButton,
    MiniMap,
    Panel,
    useNodesState,
    useEdgesState,
    useReactFlow,
    ReactFlowProvider,
    Node,
    Edge,
    Handle,
    Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    RotateCcw,
    Plus,
    Minus,
    Maximize2,
    Lock,
    Unlock,
    Network,
    Users,
    Kanban,
    FolderKanban,
    ListChecks,
    CheckCircle2,
    Circle,
    AlertTriangle,
    Clock,
    Zap,
    X,
    Folder,
    ChevronDown,
    ChevronUp,
    ChevronRight,
} from "lucide-react";
import { Task, Team, User, TaskColumn } from "../api";

// Helper to clean leading emojis from workspace name
const cleanWorkspaceName = (name: string, emoji?: string) => {
    let clean = name.trim();
    if (emoji && clean.startsWith(emoji)) {
        clean = clean.slice(emoji.length).trim();
    }
    clean = clean.replace(/^\p{Emoji_Presentation}\s*/u, "");
    return clean;
};

// Format date helper
const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Check if a task is overdue
const checkIsOverdue = (task: Task) => {
    if (!task.dueDate) return false;
    if (task.column?.isComplete) return false;
    const due = new Date(task.dueDate);
    const now = new Date();
    due.setHours(23, 59, 59, 999);
    return due < now;
};

// ─── 1. Custom Node: Leader Node ───
function LeaderNode({
    data,
}: {
    data: { name: string; teamName: string; emoji?: string; faded?: boolean };
}) {
    const cleanTeam = cleanWorkspaceName(data.teamName, data.emoji);

    return (
        <div
            className={`px-4 py-3 rounded-[2px] bg-[var(--app-card)] shadow-xs text-center min-w-[200px] border border-[var(--app-border-strong)] relative corner-brackets font-sans select-none transition-opacity duration-300 ${
                data.faded ? "opacity-25" : "opacity-100"
            }`}
        >
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <div className="flex items-center justify-center gap-1.5 mb-1">
                {data.emoji && <span className="text-sm emoji-font">{data.emoji}</span>}
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-accent)]">
                    {cleanTeam} Leader
                </span>
            </div>
            <div className="font-semibold text-sm text-[var(--app-text)] leading-snug truncate">
                {data.name}
            </div>
            <div className="text-[10px] text-[var(--app-muted)] mt-0.5 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] inline-block" />
                <span>Active Commander</span>
            </div>
        </div>
    );
}

// ─── 2. Custom Node: Member Node (Click to Focus) ───
function MemberNode({
    data,
}: {
    data: {
        id: string;
        name: string;
        initials: string;
        role: string;
        taskCount: number;
        overdueCount?: number;
        isSelected?: boolean;
        faded?: boolean;
        onToggleSelect?: (id: string) => void;
    };
}) {
    const isLeader = data.role === "LEADER";
    const hasOverdue = (data.overdueCount || 0) > 0;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                data.onToggleSelect?.(data.id);
            }}
            className={`px-3.5 py-2.5 rounded-[2px] bg-[var(--app-card)] shadow-xs text-left min-w-[170px] max-w-[190px] border transition-all duration-300 relative corner-brackets font-sans cursor-pointer select-none ${
                data.isSelected
                    ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 shadow-sm"
                    : hasOverdue
                    ? "border-[var(--color-error)]/60"
                    : "border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
            } ${data.faded ? "opacity-25" : "opacity-100"}`}
        >
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />

            <div className="flex items-center gap-2">
                <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                        data.isSelected
                            ? "bg-[var(--color-accent)] text-white border-transparent"
                            : isLeader
                            ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]/30"
                            : "bg-[var(--app-select-bg)] text-[var(--app-text)] border-[var(--app-border)]"
                    }`}
                >
                    {data.initials}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[var(--app-text)] truncate leading-tight flex items-center justify-between gap-1">
                        <span className="truncate">{data.name}</span>
                    </div>
                    <div className="text-[10px] text-[var(--app-muted)] flex items-center gap-1.5 mt-0.5">
                        <span className="tabular-nums font-medium">
                            {data.taskCount} {data.taskCount === 1 ? "task" : "tasks"}
                        </span>
                        {hasOverdue && (
                            <span className="text-[9px] text-[var(--color-error)] font-bold flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                {data.overdueCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── 3. Custom Node: Stage (Column) Node ───
function StageNode({
    data,
}: {
    data: { name: string; count: number; isComplete?: boolean; faded?: boolean };
}) {
    return (
        <div
            className={`px-3.5 py-2 rounded-[2px] bg-[var(--app-card)] shadow-xs text-left min-w-[170px] border border-[var(--app-border-strong)] relative corner-brackets font-sans select-none transition-opacity duration-300 ${
                data.faded ? "opacity-25" : "opacity-100"
            }`}
        >
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--app-text)] truncate">
                    {data.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-muted)] font-bold tabular-nums">
                    {data.count}
                </span>
            </div>
        </div>
    );
}

// ─── 4. Custom Node: Project Node ───
function ProjectNode({
    data,
}: {
    data: { title: string; emoji?: string; count: number; progress?: number; faded?: boolean };
}) {
    return (
        <div
            className={`px-3.5 py-2.5 rounded-[2px] bg-[var(--app-card)] shadow-xs text-left min-w-[180px] max-w-[210px] border border-[var(--app-border-strong)] relative corner-brackets font-sans select-none transition-opacity duration-300 ${
                data.faded ? "opacity-25" : "opacity-100"
            }`}
        >
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <div className="flex items-center gap-2 mb-1.5">
                {data.emoji ? (
                    <span className="text-sm emoji-font">{data.emoji}</span>
                ) : (
                    <Folder className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                )}
                <span className="text-xs font-semibold text-[var(--app-text)] truncate flex-1">
                    {data.title}
                </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[var(--app-muted)]">
                <span>{data.count} tasks</span>
                {typeof data.progress === "number" && (
                    <span className="tabular-nums font-semibold">{data.progress}%</span>
                )}
            </div>
        </div>
    );
}

// Helper to extract clean text from HTML descriptions
const parseHtmlDescription = (html?: string | null): string => {
    if (!html) return "";
    return html
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
};

// ─── 5. Custom Node: Task Node with Bottleneck & Overdue Highlighting ───
function TaskNode({
    data,
}: {
    data: {
        id: string;
        title: string;
        description?: string | null;
        priority: string;
        column: string;
        dueDate?: string;
        carryCount?: number;
        isOverdue?: boolean;
        checklistStats?: { total: number; completed: number };
        isChecklistExpanded?: boolean;
        onToggleExpand?: (taskId: string) => void;
        assignee?: { id: string; name: string; initials: string; avatarUrl?: string | null } | null;
        showAssignee?: boolean;
        faded?: boolean;
    };
}) {
    const [isTitleExpanded, setIsTitleExpanded] = useState(false);

    const priorityColors: Record<string, string> = {
        URGENT: "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20 font-bold",
        HIGH: "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20",
        MEDIUM: "text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20",
        LOW: "text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20",
    };

    const priorityStyle =
        priorityColors[data.priority.toUpperCase()] ||
        "text-[var(--app-muted)] bg-[var(--app-select-bg)] border-[var(--app-border)]";

    const hasChecklist = data.checklistStats && data.checklistStats.total > 0;
    const hasCarried = (data.carryCount || 0) > 0;
    const cleanDesc = useMemo(() => parseHtmlDescription(data.description), [data.description]);
    const isTitleLong = data.title.length > 42;

    return (
        <div
            className={`px-3 py-2 rounded-[2px] bg-[var(--app-card)] shadow-xs min-w-[185px] max-w-[220px] transition-all duration-300 relative corner-brackets cursor-pointer font-sans select-none border ${
                data.isOverdue
                    ? "border-[var(--color-error)]/80 shadow-[0_0_8px_rgba(244,63,94,0.15)] ring-1 ring-[var(--color-error)]/30"
                    : hasCarried && data.carryCount! >= 2
                    ? "border-[var(--color-warning)]/70 ring-1 ring-[var(--color-warning)]/30"
                    : "border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
            } ${data.faded ? "opacity-25" : "opacity-100"}`}
        >
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <Handle type="source" position={Position.Right} id="checklist" className="opacity-0" />

            <div className="flex flex-col gap-1.5 text-left">
                {/* 1. Top: Member Assignee Badge (First) & Overdue/Carried Badges */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    {data.showAssignee && (
                        <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded-[2px] bg-[var(--app-bg)] border border-[var(--app-border)]/70 text-[9.5px] max-w-full min-w-0">
                            {data.assignee ? (
                                <>
                                    <div className="w-3.5 h-3.5 rounded-full bg-[var(--app-select-bg)] border border-[var(--app-border)] text-[7px] font-bold text-[var(--app-text)] flex items-center justify-center shrink-0 overflow-hidden">
                                        {data.assignee.avatarUrl ? (
                                            <img
                                                src={data.assignee.avatarUrl}
                                                alt={data.assignee.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>{data.assignee.initials}</span>
                                        )}
                                    </div>
                                    <span className="font-medium text-[var(--app-text)] truncate max-w-[110px]">
                                        {data.assignee.name}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="w-3.5 h-3.5 rounded-full border border-dashed border-[var(--app-border-strong)] text-[7px] text-[var(--app-muted)] flex items-center justify-center shrink-0 font-bold">
                                        ?
                                    </div>
                                    <span className="text-[var(--app-muted)] italic truncate">
                                        Unassigned
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Alert Badges (Overdue / High Carry) */}
                    {(data.isOverdue || hasCarried) && (
                        <div className="flex items-center gap-1 flex-wrap ml-auto">
                            {data.isOverdue && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/25 px-1 py-0.2 rounded-[2px]">
                                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                    <span>Overdue</span>
                                </span>
                            )}
                            {!data.isOverdue && hasCarried && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 px-1 py-0.2 rounded-[2px] tabular-nums">
                                    <Zap className="w-2.5 h-2.5 shrink-0" />
                                    <span>x{data.carryCount}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Title with 2-Line Truncation & Expand Chevron */}
                <div className="flex items-start justify-between gap-1 group/title">
                    <div
                        className={`text-xs font-medium text-[var(--app-text)] leading-snug break-words ${
                            isTitleExpanded ? "" : "line-clamp-2"
                        }`}
                    >
                        {data.title}
                    </div>
                    {isTitleLong && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsTitleExpanded(!isTitleExpanded);
                            }}
                            className="p-0.5 -mt-0.5 rounded-[2px] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] shrink-0 transition-colors cursor-pointer"
                            title={isTitleExpanded ? "Collapse title" : "Expand full title"}
                        >
                            {isTitleExpanded ? (
                                <ChevronUp className="w-3 h-3 shrink-0" />
                            ) : (
                                <ChevronDown className="w-3 h-3 shrink-0" />
                            )}
                        </button>
                    )}
                </div>

                {/* 3. Parsed Description Excerpt (1-2 lines) */}
                {cleanDesc && (
                    <p
                        className="text-[10px] text-[var(--app-muted)] line-clamp-2 leading-relaxed break-words -mt-0.5"
                        title={cleanDesc}
                    >
                        {cleanDesc}
                    </p>
                )}

                {/* 4. Footer Metadata */}
                <div className="flex items-center justify-between gap-1.5 shrink-0 pt-0.5">
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-[2px] border ${priorityStyle}`}>
                        {data.priority}
                    </span>

                    <div className="flex items-center gap-1.5 text-[9px] text-[var(--app-muted)] font-medium ml-auto">
                        {hasChecklist && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    data.onToggleExpand?.(data.id);
                                }}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border text-[9.5px] font-semibold transition-all cursor-pointer select-none tabular-nums ${
                                    data.isChecklistExpanded
                                        ? "bg-[var(--app-select-bg)] border-[var(--color-accent)]/50 text-[var(--color-accent)] shadow-3xs"
                                        : "bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border-[var(--app-border)] text-[var(--app-text)] hover:border-[var(--app-border-strong)]"
                                }`}
                                title={data.isChecklistExpanded ? "Collapse subtasks on canvas" : "Expand subtasks on canvas"}
                            >
                                <CheckCircle2 className="w-2.5 h-2.5 text-[var(--color-success)] shrink-0" />
                                <span>
                                    {data.checklistStats!.completed}/{data.checklistStats!.total}
                                </span>
                                {data.isChecklistExpanded ? (
                                    <ChevronDown className="w-2.5 h-2.5 text-[var(--color-accent)] shrink-0" />
                                ) : (
                                    <ChevronRight className="w-2.5 h-2.5 text-[var(--app-muted)] shrink-0" />
                                )}
                            </button>
                        )}
                        <span className="truncate max-w-[70px]">{data.column}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── 6. Custom Node: Checklist Sub-Node ───
function ChecklistNode({
    data,
}: {
    data: { title: string; isCompleted: boolean; faded?: boolean };
}) {
    return (
        <div
            className={`px-2.5 py-1.5 rounded-[2px] border bg-[var(--app-card)] shadow-3xs flex items-center gap-1.5 min-w-[150px] max-w-[190px] text-left select-none text-[10.5px] font-medium transition-opacity duration-300 ${
                data.isCompleted
                    ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/5 text-[var(--color-success)]"
                    : "border-[var(--app-border)] text-[var(--app-text)]"
            } ${data.faded ? "opacity-25" : "opacity-100"}`}
        >
            <Handle type="target" position={Position.Left} id="target" className="opacity-0" />
            {data.isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
            ) : (
                <Circle className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
            )}
            <span
                className={`truncate ${
                    data.isCompleted ? "line-through opacity-70" : ""
                }`}
            >
                {data.title}
            </span>
        </div>
    );
}

// ─── 7. Custom Node: Unassigned Header Node ───
function UnassignedHeaderNode({ data }: { data: { count: number; faded?: boolean } }) {
    return (
        <div
            className={`px-4 py-2.5 rounded-[2px] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-bg)] text-center min-w-[160px] relative corner-brackets font-sans transition-opacity duration-300 ${
                data.faded ? "opacity-25" : "opacity-100"
            }`}
        >
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
            <div className="text-[9px] capitalize font-bold text-[var(--app-muted)] mb-0.5">
                Unassigned ({data.count})
            </div>
            <div className="text-xs font-semibold text-[var(--app-muted)] leading-tight">
                No Owner Tasks
            </div>
        </div>
    );
}

// ─── 8. Custom Node: Task Assignee Member Node (for Projects Layout) ───
function TaskAssigneeNode({
    data,
}: {
    data: {
        name: string;
        initials: string;
        avatarUrl?: string | null;
        isUnassigned?: boolean;
        faded?: boolean;
    };
}) {
    return (
        <div
            className={`px-3 py-2 rounded-[2px] bg-[var(--app-card)] shadow-3xs min-w-[145px] max-w-[175px] border text-left select-none relative corner-brackets transition-opacity duration-300 flex items-center gap-2 ${
                data.isUnassigned
                    ? "border-dashed border-[var(--app-border-strong)] bg-[var(--app-bg)]/80"
                    : "border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
            } ${data.faded ? "opacity-25" : "opacity-100"}`}
        >
            <Handle type="target" position={Position.Left} id="target" className="opacity-0" />
            <Handle type="source" position={Position.Right} id="subtasks" className="opacity-0" />

            <div className="w-5.5 h-5.5 rounded-full bg-[var(--app-select-bg)] border border-[var(--app-border-strong)] text-[8px] font-bold text-[var(--app-text)] flex items-center justify-center shrink-0 overflow-hidden">
                {data.avatarUrl ? (
                    <img src={data.avatarUrl} alt={data.name} className="w-full h-full object-cover" />
                ) : data.isUnassigned ? (
                    <span className="text-[9px] text-[var(--app-muted)]">?</span>
                ) : (
                    <span>{data.initials}</span>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="text-[8px] text-[var(--app-muted)] font-bold uppercase tracking-wider">
                    Assignee
                </div>
                <div
                    className={`text-[11px] font-semibold truncate leading-tight ${
                        data.isUnassigned ? "text-[var(--app-muted)] italic" : "text-[var(--app-text)]"
                    }`}
                >
                    {data.name}
                </div>
            </div>
        </div>
    );
}

const nodeTypes = {
    leader: LeaderNode,
    member: MemberNode,
    stage: StageNode,
    project: ProjectNode,
    task: TaskNode,
    assignee: TaskAssigneeNode,
    checklist: ChecklistNode,
    unassigned: UnassignedHeaderNode,
    spacer: () => <div style={{ width: 1, height: 1, opacity: 0 }} />,
};

type LayoutMode = "hierarchy" | "stages" | "projects";

interface SolarMapViewProps {
    currentTeam: Team;
    currentUser: User;
    userRole: string;
    teamMembers: { user: User; role: string }[];
    tasks: Task[];
    columns?: TaskColumn[];
    projects?: any[];
    onSelectTask: (taskId: string) => void;
    onSelectMember: (user: User) => void;
}

// Helper to extract checklist/subtask items from task object
const getTaskChecklists = (task: any): any[] => {
    if (Array.isArray(task.checklist) && task.checklist.length > 0) return task.checklist;
    if (Array.isArray(task.checklists) && task.checklists.length > 0) return task.checklists;
    if (Array.isArray(task.subtasks) && task.subtasks.length > 0) return task.subtasks;
    if (Array.isArray(task.checklistItems) && task.checklistItems.length > 0) return task.checklistItems;
    return [];
};

function SolarMapInner({
    currentTeam,
    currentUser,
    userRole,
    teamMembers,
    tasks,
    columns = [],
    projects = [],
    onSelectTask,
    onSelectMember,
}: SolarMapViewProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [isInteractive, setIsInteractive] = useState(true);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("solarmap_layout_mode");
                if (saved === "hierarchy" || saved === "stages" || saved === "projects") {
                    return saved;
                }
            } catch {}
        }
        return "hierarchy";
    });
    const [showChecklists, setShowChecklists] = useState(true);
    const [collapsedTaskIds, setCollapsedTaskIds] = useState<Set<string>>(new Set());
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem("solarmap_layout_mode", layoutMode);
            } catch {}
        }
    }, [layoutMode]);

    const { fitView, zoomIn, zoomOut } = useReactFlow();

    // Check if a task's checklists are expanded
    const isTaskExpanded = useCallback(
        (taskId: string) => {
            if (!showChecklists) return false;
            return !collapsedTaskIds.has(taskId);
        },
        [showChecklists, collapsedTaskIds]
    );

    // Toggle individual task checklist expand/collapse
    const handleToggleTaskExpand = useCallback((taskId: string) => {
        setCollapsedTaskIds((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    }, []);

    // Toggle member selection for focus
    const handleToggleMemberSelect = useCallback((id: string) => {
        setSelectedMemberId((prev) => (prev === id ? null : id));
    }, []);

    // All active tasks with checklists
    const allTasksWithChecklists = useMemo(() => {
        return tasks.filter(
            (t) => !t.isSoftDeleted && !t.isArchived && getTaskChecklists(t).length > 0
        );
    }, [tasks]);

    const isAnyExpanded = useMemo(() => {
        if (!showChecklists) return false;
        return allTasksWithChecklists.some((t) => !collapsedTaskIds.has(t.id));
    }, [showChecklists, allTasksWithChecklists, collapsedTaskIds]);

    const handleToggleAllChecklists = () => {
        if (isAnyExpanded) {
            setCollapsedTaskIds(new Set(allTasksWithChecklists.map((t) => t.id)));
        } else {
            setShowChecklists(true);
            setCollapsedTaskIds(new Set());
        }
        setTimeout(() => fitView({ duration: 300, padding: 0.22 }), 50);
    };

    // ─── KPI Stats Summary ───
    const stats = useMemo(() => {
        const activeTasks = tasks.filter((t) => !t.isSoftDeleted && !t.isArchived);
        const overdueTasks = activeTasks.filter(checkIsOverdue);
        const highCarryTasks = activeTasks.filter((t) => (t.carryCount || 0) >= 2);
        const riskCount = new Set([...overdueTasks.map((t) => t.id), ...highCarryTasks.map((t) => t.id)]).size;

        let totalSubtasks = 0;
        let completedSubtasks = 0;
        activeTasks.forEach((t) => {
            const chk = getTaskChecklists(t);
            if (chk.length > 0) {
                totalSubtasks += chk.length;
                completedSubtasks += chk.filter((c: any) => Boolean(c.isCompleted || c.completed || c.status === "Completed" || c.status === "Done")).length;
            }
        });

        return {
            totalActive: activeTasks.length,
            overdueCount: overdueTasks.length,
            riskCount,
            memberCount: teamMembers.length,
            totalSubtasks,
            completedSubtasks,
            subtaskRate: totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0,
        };
    }, [tasks, teamMembers]);

    // ─── Layout Generation Engine ───
    const generateLayout = useCallback(() => {
        const activeTasks = tasks.filter((t) => !t.isSoftDeleted && !t.isArchived);
        const tempNodes: Node[] = [];
        const tempEdges: Edge[] = [];

        const colWidth = showChecklists
            ? layoutMode === "projects"
                ? 660
                : 420
            : 260;
        const taskGapY = 135;
        const checklistOffsetY = 45;

        // Helper to resolve assignee user details for task cards
        const getTaskAssignee = (task: any) => {
            const userObj = task.assignedTo || teamMembers.find((m) => m.user.id === task.assignedToId)?.user;
            if (userObj) {
                const initials = (userObj.fullName || "User")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                return {
                    id: userObj.id,
                    name: userObj.fullName,
                    initials,
                    avatarUrl: userObj.avatarUrl,
                };
            }
            return null;
        };

        // ═════════════════════════════════════════════════════════════════
        // MODE 1: HIERARCHY (Leader → Members → Tasks → Checklists)
        // ═════════════════════════════════════════════════════════════════
        if (layoutMode === "hierarchy") {
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

            const leaderMembership = teamMembers.find((m) => m.role === "LEADER");
            const leaderUser = leaderMembership?.user;
            const leaderId = leaderUser?.id || currentUser?.id || "leader";
            const leaderName = leaderUser?.fullName || currentUser?.fullName || "Workspace Leader";

            const sortedMembers = [...teamMembers].sort((a, b) => {
                if (a.role === "LEADER") return -1;
                if (b.role === "LEADER") return 1;
                return 0;
            });

            const hasUnassigned = unassignedTasks.length > 0;
            const columnCount = sortedMembers.length + (hasUnassigned ? 1 : 0);

            const startX = 0;
            const leaderY = 50;
            const level2Y = 200;
            const taskStartY = 350;

            const totalWidth = (columnCount - 1) * colWidth;
            const leaderX = startX + totalWidth / 2;

            const isLeaderFaded = selectedMemberId !== null && selectedMemberId !== leaderId;

            // 1. Leader Node
            tempNodes.push({
                id: `top-leader-${leaderId}`,
                type: "leader",
                position: { x: leaderX, y: leaderY },
                data: {
                    name: leaderName,
                    teamName: currentTeam.name,
                    emoji: currentTeam.emoji || "🧑‍💻",
                    faded: isLeaderFaded,
                },
            });

            // 2. Member Columns & Tasks
            sortedMembers.forEach((member, colIdx) => {
                const colX = startX + colIdx * colWidth;
                const memberTasks = tasksByAssignee[member.user.id] || [];
                const isSelected = selectedMemberId === member.user.id;
                const isFaded = selectedMemberId !== null && !isSelected;

                const initials = member.user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                // Member Node
                tempNodes.push({
                    id: member.user.id,
                    type: "member",
                    position: { x: colX, y: level2Y },
                    data: {
                        id: member.user.id,
                        name: member.user.fullName,
                        initials,
                        role: member.role,
                        taskCount: memberTasks.length,
                        overdueCount: memberTasks.filter(checkIsOverdue).length,
                        isSelected,
                        faded: isFaded,
                        onToggleSelect: handleToggleMemberSelect,
                    },
                });

                // Edge Leader -> Member
                tempEdges.push({
                    id: `edge-top-leader-${member.user.id}`,
                    source: `top-leader-${leaderId}`,
                    target: member.user.id,
                    style: {
                        stroke: isSelected ? "var(--color-accent)" : "var(--app-border-strong)",
                        strokeWidth: isSelected ? 2 : 1.2,
                        opacity: isFaded ? 0.2 : 1.0,
                    },
                });

                // Member Tasks
                let currentY = taskStartY;
                memberTasks.forEach((task) => {
                    const isOverdue = checkIsOverdue(task);
                    const checklistItems = getTaskChecklists(task);
                    const checklistStats = {
                        total: checklistItems.length,
                        completed: checklistItems.filter((c: any) => Boolean(c.isCompleted || c.completed || c.status === "Completed" || c.status === "Done")).length,
                    };

                    const isExpanded = isTaskExpanded(task.id);

                    tempNodes.push({
                        id: task.id,
                        type: "task",
                        position: { x: colX, y: currentY },
                        data: {
                            id: task.id,
                            title: task.title,
                            description: task.description,
                            priority: task.priority || "MEDIUM",
                            column: task.column?.name || "To Do",
                            dueDate: task.dueDate,
                            carryCount: task.carryCount,
                            isOverdue,
                            checklistStats,
                            isChecklistExpanded: isExpanded,
                            onToggleExpand: handleToggleTaskExpand,
                            assignee: null,
                            showAssignee: false,
                            faded: isFaded,
                        },
                    });

                    // Edge Member -> Task
                    tempEdges.push({
                        id: `edge-${member.user.id}-${task.id}`,
                        source: member.user.id,
                        target: task.id,
                        style: {
                            stroke: "var(--app-border)",
                            strokeWidth: 1.2,
                            opacity: isFaded ? 0.2 : 1.0,
                        },
                    });

                    // Subtask Checklist Nodes
                    if (isExpanded && checklistItems.length > 0) {
                        checklistItems.forEach((cItem: any, cIdx: number) => {
                            const cNodeId = `chk-${task.id}-${cItem.id || cIdx}`;
                            const cTitle = cItem.title || cItem.name || cItem.text || `Item ${cIdx + 1}`;
                            const cIsCompleted = Boolean(cItem.isCompleted || cItem.completed || cItem.status === "Completed" || cItem.status === "Done");

                            tempNodes.push({
                                id: cNodeId,
                                type: "checklist",
                                position: { x: colX + 225, y: currentY + cIdx * checklistOffsetY },
                                data: {
                                    title: cTitle,
                                    isCompleted: cIsCompleted,
                                    faded: isFaded,
                                },
                            });

                            tempEdges.push({
                                id: `edge-${task.id}-${cNodeId}`,
                                source: task.id,
                                sourceHandle: "checklist",
                                target: cNodeId,
                                targetHandle: "target",
                                type: "smoothstep",
                                style: {
                                    stroke: cIsCompleted ? "var(--color-success)" : "var(--app-border-strong)",
                                    strokeWidth: 1.2,
                                    strokeDasharray: cIsCompleted ? "none" : "3 3",
                                    opacity: isFaded ? 0.2 : 0.85,
                                },
                            });
                        });
                        const chkHeight = checklistItems.length * checklistOffsetY;
                        currentY += Math.max(taskGapY, chkHeight + 20);
                    } else {
                        currentY += taskGapY;
                    }
                });
            });

            // Unassigned Column
            if (hasUnassigned) {
                const colIdx = sortedMembers.length;
                const colX = startX + colIdx * colWidth;
                const isFaded = selectedMemberId !== null;

                tempNodes.push({
                    id: "unassigned-header",
                    type: "unassigned",
                    position: { x: colX, y: level2Y },
                    data: { count: unassignedTasks.length, faded: isFaded },
                });

                tempEdges.push({
                    id: "edge-top-leader-unassigned",
                    source: `top-leader-${leaderId}`,
                    target: "unassigned-header",
                    style: {
                        stroke: "var(--app-border)",
                        strokeWidth: 1.2,
                        opacity: isFaded ? 0.2 : 0.8,
                    },
                });

                let currentY = taskStartY;
                unassignedTasks.forEach((task) => {
                    const isOverdue = checkIsOverdue(task);
                    const checklistItems = getTaskChecklists(task);
                    const checklistStats = {
                        total: checklistItems.length,
                        completed: checklistItems.filter((c: any) => Boolean(c.isCompleted || c.completed || c.status === "Completed" || c.status === "Done")).length,
                    };
                    const isExpanded = isTaskExpanded(task.id);

                    tempNodes.push({
                        id: task.id,
                        type: "task",
                        position: { x: colX, y: currentY },
                        data: {
                            id: task.id,
                            title: task.title,
                            description: task.description,
                            priority: task.priority || "MEDIUM",
                            column: task.column?.name || "To Do",
                            dueDate: task.dueDate,
                            carryCount: task.carryCount,
                            isOverdue,
                            checklistStats,
                            isChecklistExpanded: isExpanded,
                            onToggleExpand: handleToggleTaskExpand,
                            assignee: null,
                            showAssignee: false,
                            faded: isFaded,
                        },
                    });

                    tempEdges.push({
                        id: `edge-unassigned-${task.id}`,
                        source: "unassigned-header",
                        target: task.id,
                        style: {
                            stroke: "var(--app-border)",
                            strokeWidth: 1.2,
                            opacity: isFaded ? 0.2 : 1.0,
                        },
                    });

                    if (isExpanded && checklistItems.length > 0) {
                        checklistItems.forEach((cItem: any, cIdx: number) => {
                            const cNodeId = `chk-${task.id}-${cItem.id || cIdx}`;
                            const cTitle = cItem.title || cItem.name || cItem.text || `Item ${cIdx + 1}`;
                            const cIsCompleted = Boolean(cItem.isCompleted || cItem.completed || cItem.status === "Completed" || cItem.status === "Done");

                            tempNodes.push({
                                id: cNodeId,
                                type: "checklist",
                                position: { x: colX + 225, y: currentY + cIdx * checklistOffsetY },
                                data: {
                                    title: cTitle,
                                    isCompleted: cIsCompleted,
                                    faded: isFaded,
                                },
                            });

                            tempEdges.push({
                                id: `edge-${task.id}-${cNodeId}`,
                                source: task.id,
                                sourceHandle: "checklist",
                                target: cNodeId,
                                targetHandle: "target",
                                type: "smoothstep",
                                style: {
                                    stroke: cIsCompleted ? "var(--color-success)" : "var(--app-border-strong)",
                                    strokeWidth: 1.2,
                                    strokeDasharray: cIsCompleted ? "none" : "3 3",
                                    opacity: isFaded ? 0.2 : 0.85,
                                },
                            });
                        });
                        const chkHeight = checklistItems.length * checklistOffsetY;
                        currentY += Math.max(taskGapY, chkHeight + 20);
                    } else {
                        currentY += taskGapY;
                    }
                });
            }
        }

        // ═════════════════════════════════════════════════════════════════
        // MODE 2: STAGES (Columns / Pipelines → Tasks)
        // ═════════════════════════════════════════════════════════════════
        else if (layoutMode === "stages") {
            const activeCols = columns.length > 0
                ? columns
                : [
                      { id: "col-todo", name: "To Do", order: 0, isComplete: false, teamId: currentTeam.id, wipLimit: null, triggersCarryForward: false },
                      { id: "col-progress", name: "In Progress", order: 1, isComplete: false, teamId: currentTeam.id, wipLimit: null, triggersCarryForward: false },
                      { id: "col-done", name: "Done", order: 2, isComplete: true, teamId: currentTeam.id, wipLimit: null, triggersCarryForward: false },
                  ];

            const startX = 0;
            const stageY = 60;
            const taskStartY = 200;

            activeCols.forEach((col, colIdx) => {
                const colX = startX + colIdx * colWidth;
                const colTasks = activeTasks.filter((t) => t.columnId === col.id || t.column?.name === col.name);

                tempNodes.push({
                    id: `stage-${col.id}`,
                    type: "stage",
                    position: { x: colX, y: stageY },
                    data: {
                        name: col.name,
                        count: colTasks.length,
                        isComplete: col.isComplete,
                        faded: false,
                    },
                });

                let currentY = taskStartY;
                colTasks.forEach((task) => {
                    const isOverdue = checkIsOverdue(task);
                    const isFaded = selectedMemberId !== null && task.assignedToId !== selectedMemberId;
                    const checklistItems = getTaskChecklists(task);
                    const checklistStats = {
                        total: checklistItems.length,
                        completed: checklistItems.filter((c: any) => Boolean(c.isCompleted || c.completed || c.status === "Completed" || c.status === "Done")).length,
                    };
                    const isExpanded = isTaskExpanded(task.id);
                    const assignee = getTaskAssignee(task);

                    tempNodes.push({
                        id: task.id,
                        type: "task",
                        position: { x: colX, y: currentY },
                        data: {
                            id: task.id,
                            title: task.title,
                            description: task.description,
                            priority: task.priority || "MEDIUM",
                            column: col.name,
                            dueDate: task.dueDate,
                            carryCount: task.carryCount,
                            isOverdue,
                            checklistStats,
                            isChecklistExpanded: isExpanded,
                            onToggleExpand: handleToggleTaskExpand,
                            assignee,
                            showAssignee: true,
                            faded: isFaded,
                        },
                    });

                    tempEdges.push({
                        id: `edge-stage-${col.id}-${task.id}`,
                        source: `stage-${col.id}`,
                        target: task.id,
                        style: {
                            stroke: "var(--app-border)",
                            strokeWidth: 1.2,
                            opacity: isFaded ? 0.2 : 1.0,
                        },
                    });

                    if (isExpanded && checklistItems.length > 0) {
                        checklistItems.forEach((cItem: any, cIdx: number) => {
                            const cNodeId = `chk-${task.id}-${cItem.id || cIdx}`;
                            const cTitle = cItem.title || cItem.name || cItem.text || `Item ${cIdx + 1}`;
                            const cIsCompleted = Boolean(cItem.isCompleted || cItem.completed || cItem.status === "Completed" || cItem.status === "Done");

                            tempNodes.push({
                                id: cNodeId,
                                type: "checklist",
                                position: { x: colX + 225, y: currentY + cIdx * checklistOffsetY },
                                data: {
                                    title: cTitle,
                                    isCompleted: cIsCompleted,
                                    faded: isFaded,
                                },
                            });

                            tempEdges.push({
                                id: `edge-${task.id}-${cNodeId}`,
                                source: task.id,
                                sourceHandle: "checklist",
                                target: cNodeId,
                                targetHandle: "target",
                                type: "smoothstep",
                                style: {
                                    stroke: cIsCompleted ? "var(--color-success)" : "var(--app-border-strong)",
                                    strokeWidth: 1.2,
                                    strokeDasharray: cIsCompleted ? "none" : "3 3",
                                    opacity: isFaded ? 0.2 : 0.85,
                                },
                            });
                        });
                        const chkHeight = checklistItems.length * checklistOffsetY;
                        currentY += Math.max(taskGapY, chkHeight + 20);
                    } else {
                        currentY += taskGapY;
                    }
                });
            });
        }

        // ═════════════════════════════════════════════════════════════════
        // MODE 3: PROJECTS (Projects → Tasks → Assigned Member → Subtasks)
        // ═════════════════════════════════════════════════════════════════
        else if (layoutMode === "projects") {
            const startX = 0;
            const projY = 60;
            const taskStartY = 200;

            const teamProjects = projects.length > 0
                ? projects
                : [{ id: "general", title: "General Tasks", emoji: "📋", progress: 0 }];

            teamProjects.forEach((proj, colIdx) => {
                const colX = startX + colIdx * colWidth;
                const projTasks = activeTasks.filter((t: any) => t.projectId === proj.id || (proj.id === "general" && !t.projectId));

                tempNodes.push({
                    id: `proj-${proj.id}`,
                    type: "project",
                    position: { x: colX, y: projY },
                    data: {
                        title: proj.title,
                        emoji: proj.emoji,
                        count: projTasks.length,
                        progress: proj.progress,
                        faded: false,
                    },
                });

                let currentY = taskStartY;
                projTasks.forEach((task) => {
                    const isOverdue = checkIsOverdue(task);
                    const isFaded = selectedMemberId !== null && task.assignedToId !== selectedMemberId;
                    const checklistItems = getTaskChecklists(task);
                    const checklistStats = {
                        total: checklistItems.length,
                        completed: checklistItems.filter((c: any) => Boolean(c.isCompleted || c.completed || c.status === "Completed" || c.status === "Done")).length,
                    };
                    const isExpanded = isTaskExpanded(task.id);
                    const assignee = getTaskAssignee(task);

                    // 1. Main Task Node
                    tempNodes.push({
                        id: task.id,
                        type: "task",
                        position: { x: colX, y: currentY },
                        data: {
                            id: task.id,
                            title: task.title,
                            description: task.description,
                            priority: task.priority || "MEDIUM",
                            column: task.column?.name || "To Do",
                            dueDate: task.dueDate,
                            carryCount: task.carryCount,
                            isOverdue,
                            checklistStats,
                            isChecklistExpanded: isExpanded,
                            onToggleExpand: handleToggleTaskExpand,
                            assignee,
                            showAssignee: false,
                            faded: isFaded,
                        },
                    });

                    // Edge: Project -> Main Task
                    tempEdges.push({
                        id: `edge-proj-${proj.id}-${task.id}`,
                        source: `proj-${proj.id}`,
                        target: task.id,
                        style: {
                            stroke: "var(--app-border)",
                            strokeWidth: 1.2,
                            opacity: isFaded ? 0.2 : 1.0,
                        },
                    });

                    // 2. Assigned Member Node -> 3. Subtask Checklist Nodes
                    if (isExpanded) {
                        const assigneeNodeId = `assignee-${task.id}`;
                        const isUnassigned = !assignee;
                        const assigneeName = assignee ? assignee.name : "Unassigned";
                        const assigneeInitials = assignee ? assignee.initials : "?";
                        const assigneeAvatar = assignee?.avatarUrl || null;

                        // Level 3: Assigned Member Node
                        tempNodes.push({
                            id: assigneeNodeId,
                            type: "assignee",
                            position: { x: colX + 230, y: currentY + 8 },
                            data: {
                                name: assigneeName,
                                initials: assigneeInitials,
                                avatarUrl: assigneeAvatar,
                                isUnassigned,
                                faded: isFaded,
                            },
                        });

                        // Edge: Main Task -> Assigned Member Node
                        tempEdges.push({
                            id: `edge-${task.id}-${assigneeNodeId}`,
                            source: task.id,
                            sourceHandle: "checklist",
                            target: assigneeNodeId,
                            targetHandle: "target",
                            type: "smoothstep",
                            style: {
                                stroke: "var(--color-accent)",
                                strokeWidth: 1.3,
                                opacity: isFaded ? 0.2 : 0.85,
                            },
                        });

                        // Level 4: Subtask Nodes branching from Assigned Member
                        if (checklistItems.length > 0) {
                            checklistItems.forEach((cItem: any, cIdx: number) => {
                                const cNodeId = `chk-${task.id}-${cItem.id || cIdx}`;
                                const cTitle = cItem.title || cItem.name || cItem.text || `Item ${cIdx + 1}`;
                                const cIsCompleted = Boolean(cItem.isCompleted || cItem.completed || cItem.status === "Completed" || cItem.status === "Done");

                                tempNodes.push({
                                    id: cNodeId,
                                    type: "checklist",
                                    position: { x: colX + 430, y: currentY + cIdx * checklistOffsetY },
                                    data: {
                                        title: cTitle,
                                        isCompleted: cIsCompleted,
                                        faded: isFaded,
                                    },
                                });

                                tempEdges.push({
                                    id: `edge-${assigneeNodeId}-${cNodeId}`,
                                    source: assigneeNodeId,
                                    sourceHandle: "subtasks",
                                    target: cNodeId,
                                    targetHandle: "target",
                                    type: "smoothstep",
                                    style: {
                                        stroke: cIsCompleted ? "var(--color-success)" : "var(--app-border-strong)",
                                        strokeWidth: 1.2,
                                        strokeDasharray: cIsCompleted ? "none" : "3 3",
                                        opacity: isFaded ? 0.2 : 0.85,
                                    },
                                });
                            });
                            const chkHeight = checklistItems.length * checklistOffsetY;
                            currentY += Math.max(taskGapY, chkHeight + 25);
                        } else {
                            currentY += taskGapY;
                        }
                    } else {
                        currentY += taskGapY;
                    }
                });
            });
        }

        // Spacer at bottom
        if (tempNodes.length > 0) {
            const maxY = Math.max(...tempNodes.map((n) => n.position.y));
            tempNodes.push({
                id: "bottom-spacer",
                type: "spacer",
                position: { x: 0, y: maxY + 200 },
                data: {},
                draggable: false,
                selectable: false,
            });
        }

        return { tempNodes, tempEdges };
    }, [
        tasks,
        teamMembers,
        columns,
        projects,
        currentUser,
        currentTeam,
        layoutMode,
        showChecklists,
        collapsedTaskIds,
        isTaskExpanded,
        handleToggleTaskExpand,
        selectedMemberId,
        handleToggleMemberSelect,
    ]);

    useEffect(() => {
        const { tempNodes, tempEdges } = generateLayout();
        setNodes(tempNodes);
        setEdges(tempEdges);
    }, [generateLayout, setNodes, setEdges]);

    const handleResetLayout = () => {
        setSelectedMemberId(null);
        setCollapsedTaskIds(new Set());
        setShowChecklists(true);
        const { tempNodes, tempEdges } = generateLayout();
        setNodes(tempNodes);
        setEdges(tempEdges);
        fitView({ duration: 400, padding: 0.22 });
    };

    const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
        if (node.type === "task") {
            onSelectTask(node.id);
        } else if (node.type === "member") {
            const memberObj = teamMembers.find((m) => m.user.id === node.id)?.user;
            if (memberObj) {
                handleToggleMemberSelect(memberObj.id);
            }
        }
    };

    const focusedMemberName = useMemo(() => {
        if (!selectedMemberId) return null;
        return teamMembers.find((m) => m.user.id === selectedMemberId)?.user.fullName || "Member";
    }, [selectedMemberId, teamMembers]);

    return (
        <div className="w-full h-full flex flex-col bg-[var(--app-bg)] text-[var(--app-text)] select-none overflow-hidden">
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* Level 1: Top Header & Primary Action Toolbar                     */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-5 py-3 flex items-center justify-between gap-4 select-none flex-wrap">
                {/* Left Title */}
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-[4px] bg-[var(--app-select-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-text)] shrink-0">
                        <Network className="w-4 h-4 text-[var(--color-accent)]" />
                    </div>
                    <div>
                        <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[var(--app-text)] leading-tight flex items-center gap-2">
                            Team Flow
                            {currentTeam.emoji && (
                                <span className="text-base emoji-font shrink-0">{currentTeam.emoji}</span>
                            )}
                        </h1>
                        <p className="text-[11px] text-[var(--app-muted)]">
                            Interactive hierarchy, task distribution & execution pipeline
                        </p>
                    </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Checklists Sub-nodes Toggle */}
                    <button
                        type="button"
                        onClick={handleToggleAllChecklists}
                        className={`relative border text-xs font-medium px-3 py-1.5 rounded-[var(--radius-sm,4px)] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-3xs ${
                            isAnyExpanded
                                ? "bg-[var(--app-select-bg)] border-[var(--color-accent)]/50 text-[var(--color-accent)] font-semibold"
                                : "bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)]"
                        }`}
                        title={isAnyExpanded ? "Collapse all subtask branches" : "Expand all subtask branches"}
                    >
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>Checklists</span>
                        {stats.totalSubtasks > 0 && (
                            <span className="px-1.5 py-0.2 rounded-[var(--radius-xs,2px)] text-[10px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold tabular-nums">
                                {stats.completedSubtasks}/{stats.totalSubtasks}
                            </span>
                        )}
                    </button>

                    {/* Clear Focus Button */}
                    {selectedMemberId && (
                        <button
                            type="button"
                            onClick={() => setSelectedMemberId(null)}
                            className="bg-[var(--app-select-bg)] hover:bg-[var(--app-hover-bg)] border border-[var(--color-accent)]/40 text-[var(--color-accent)] text-xs font-semibold px-2.5 py-1.5 rounded-[var(--radius-sm,4px)] shadow-3xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Focus: {focusedMemberName}</span>
                        </button>
                    )}

                    {/* Reset Button */}
                    <button
                        type="button"
                        onClick={handleResetLayout}
                        title="Reset Layout & Camera"
                        className="bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] text-xs font-medium px-3 py-1.5 rounded-[var(--radius-sm,4px)] shadow-3xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                        <span>Reset</span>
                    </button>
                </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* Level 2: Compact KPI Stats Ribbon                                 */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] select-none">
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[var(--app-border)]">
                    {/* 1. Active Tasks */}
                    <div className="px-5 py-2.5 flex items-center justify-between gap-3 bg-[var(--app-card)]">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-medium text-[var(--app-muted)]">Active Tasks</span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-xl font-heading font-bold tracking-tight text-[var(--app-text)] tabular-nums">
                                    {stats.totalActive}
                                </span>
                                <span className="text-[11px] text-[var(--app-muted)]">in flow</span>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-[4px] bg-[var(--app-select-bg)] flex items-center justify-center text-[var(--app-muted)] shrink-0 border border-[var(--app-border)]">
                            <Kanban className="w-4 h-4" />
                        </div>
                    </div>

                    {/* 2. Team Capacity */}
                    <div className="px-5 py-2.5 flex items-center justify-between gap-3 bg-[var(--app-card)]">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-medium text-[var(--app-muted)]">Team Members</span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-xl font-heading font-bold tracking-tight text-[var(--app-text)] tabular-nums">
                                    {stats.memberCount}
                                </span>
                                <span className="text-[11px] text-[var(--app-muted)]">
                                    {selectedMemberId ? "1 focused" : "assigned"}
                                </span>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-[4px] bg-[var(--app-select-bg)] flex items-center justify-center text-[var(--app-muted)] shrink-0 border border-[var(--app-border)]">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>

                    {/* 3. Bottlenecks & Risk */}
                    <div className="px-5 py-2.5 flex items-center justify-between gap-3 bg-[var(--app-card)]">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-medium text-[var(--app-muted)]">Risks & Bottlenecks</span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span
                                    className={`text-xl font-heading font-bold tracking-tight tabular-nums ${
                                        stats.riskCount > 0 ? "text-[var(--color-error)]" : "text-[var(--app-text)]"
                                    }`}
                                >
                                    {stats.riskCount}
                                </span>
                                <span className="text-[11px] text-[var(--app-muted)]">
                                    ({stats.overdueCount} overdue)
                                </span>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-[4px] bg-[var(--color-error)]/10 flex items-center justify-center text-[var(--color-error)] shrink-0 border border-[var(--color-error)]/20">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>

                    {/* 4. Subtasks Execution */}
                    <div className="px-5 py-2.5 flex items-center justify-between gap-3 bg-[var(--app-card)]">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-medium text-[var(--app-muted)]">Checklist Execution</span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-xl font-heading font-bold tracking-tight text-[var(--app-text)] tabular-nums">
                                    {stats.subtaskRate}%
                                </span>
                                <span className="text-[11px] text-[var(--app-muted)]">
                                    ({stats.completedSubtasks}/{stats.totalSubtasks})
                                </span>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-[4px] bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)] shrink-0 border border-[var(--color-success)]/20">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* Main Interactive ReactFlow Canvas                                  */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 min-h-0 w-full relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodeClick={handleNodeClick}
                    onPaneClick={() => setSelectedMemberId(null)}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodesDraggable={isInteractive}
                    nodesConnectable={isInteractive}
                    elementsSelectable={isInteractive}
                    fitView
                    fitViewOptions={{ padding: 0.22 }}
                    minZoom={0.1}
                    maxZoom={1.5}
                    className="w-full h-full"
                >
                    <Background color="var(--app-border-strong)" gap={16} size={1} />

                    {/* Floating Top-Center Layout Mode Switcher */}
                    <Panel position="top-center" className="!m-3 select-none">
                        <div className="inline-flex items-center bg-[var(--app-card)]/90 backdrop-blur-md border border-[var(--app-border)] rounded-[var(--radius-sm,6px)] p-1 gap-1 shadow-md">
                            <button
                                type="button"
                                onClick={() => {
                                    setLayoutMode("hierarchy");
                                    setTimeout(() => fitView({ duration: 300, padding: 0.22 }), 50);
                                }}
                                className={`px-3 py-1.5 rounded-[var(--radius-xs,4px)] text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                    layoutMode === "hierarchy"
                                        ? "bg-[var(--app-text)] text-[var(--app-bg)] font-semibold shadow-xs"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                }`}
                                title="Hierarchy View (Leader → Members → Tasks)"
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>Hierarchy</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setLayoutMode("stages");
                                    setTimeout(() => fitView({ duration: 300, padding: 0.22 }), 50);
                                }}
                                className={`px-3 py-1.5 rounded-[var(--radius-xs,4px)] text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                    layoutMode === "stages"
                                        ? "bg-[var(--app-text)] text-[var(--app-bg)] font-semibold shadow-xs"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                }`}
                                title="Stages View (Columns → Tasks)"
                            >
                                <Kanban className="w-3.5 h-3.5" />
                                <span>Stages</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setLayoutMode("projects");
                                    setTimeout(() => fitView({ duration: 300, padding: 0.22 }), 50);
                                }}
                                className={`px-3 py-1.5 rounded-[var(--radius-xs,4px)] text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                    layoutMode === "projects"
                                        ? "bg-[var(--app-text)] text-[var(--app-bg)] font-semibold shadow-xs"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                }`}
                                title="Projects View (Projects → Tasks)"
                            >
                                <FolderKanban className="w-3.5 h-3.5" />
                                <span>Projects</span>
                            </button>
                        </div>
                    </Panel>

                    <Controls
                        showZoom={false}
                        showFitView={false}
                        showInteractive={false}
                    >
                        <ControlButton onClick={() => zoomIn({ duration: 250 })} title="Zoom In">
                            <Plus />
                        </ControlButton>
                        <ControlButton onClick={() => zoomOut({ duration: 250 })} title="Zoom Out">
                            <Minus />
                        </ControlButton>
                        <ControlButton onClick={() => fitView({ duration: 300, padding: 0.22 })} title="Fit View">
                            <Maximize2 />
                        </ControlButton>
                        <ControlButton
                            onClick={() => setIsInteractive((prev) => !prev)}
                            title={isInteractive ? "Lock View" : "Unlock View"}
                        >
                            {isInteractive ? (
                                <Unlock />
                            ) : (
                                <Lock className="!text-[var(--color-error)]" />
                            )}
                        </ControlButton>
                        <ControlButton onClick={handleResetLayout} title="Reset Layout & Camera">
                            <RotateCcw />
                        </ControlButton>
                    </Controls>

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

export default function SolarMapView(props: SolarMapViewProps) {
    return (
        <ReactFlowProvider>
            <SolarMapInner {...props} />
        </ReactFlowProvider>
    );
}
