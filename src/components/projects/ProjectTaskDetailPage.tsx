"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    CheckCircle2,
    Calendar,
    Clock,
    User,
    AlertTriangle,
    ShieldAlert,
    RotateCcw,
    Plus,
    ChevronRight,
    Kanban,
    ListFilter,
    Loader2,
} from "lucide-react";
import { api } from "../../api";

function getInitials(name: string) {
    if (!name) return "";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getPriorityBadge(priority: string) {
    switch (priority) {
        case "Urgent":
        case "URGENT":
            return "text-[var(--priority-urgent)] bg-[var(--priority-urgent)]/10 border-[var(--priority-urgent)]/20";
        case "High":
        case "HIGH":
            return "text-[var(--priority-high)] bg-[var(--priority-high)]/10 border-[var(--priority-high)]/20";
        case "Medium":
        case "MEDIUM":
            return "text-[var(--priority-medium)] bg-[var(--priority-medium)]/10 border-[var(--priority-medium)]/20";
        default:
            return "text-[var(--priority-low)] bg-[var(--priority-low)]/10 border-[var(--priority-low)]/20";
    }
}

interface SubtaskColumn {
    id: string;
    name: string;
    status: string;
}

const SUBTASK_COLUMNS: SubtaskColumn[] = [
    { id: "col-todo", name: "To Do", status: "Backlog" },
    { id: "col-progress", name: "In Progress", status: "InProgress" },
    { id: "col-review", name: "Under Review", status: "InReview" },
    { id: "col-done", name: "Done", status: "Done" },
];

export default function ProjectTaskDetailPage() {
    const params = useParams();
    const projectId = params.id as string;
    const taskId = params.taskId as string;

    const [project, setProject] = useState<any>(null);
    const [task, setTask] = useState<any>(null);
    const [subtasks, setSubtasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [addingInColId, setAddingInColId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState("");
    const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
    const [estimatedDays, setEstimatedDays] = useState(1);
    const [memberFilter, setMemberFilter] = useState<string>("");

    const loadProjectDetail = async () => {
        if (!projectId || !taskId) return;
        try {
            const data = await api.getProjectDetail(projectId);
            setProject(data);
            const foundTask = (data.tasks || []).find((t: any) => t.id === taskId);
            setTask(foundTask);
            setSubtasks(foundTask?.subtasks || []);
            if (foundTask?.assignees && foundTask.assignees.length > 0 && !selectedAssigneeId) {
                setSelectedAssigneeId(foundTask.assignees[0].id);
            }
        } catch (err) {
            console.error("Failed to load project details:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjectDetail();
    }, [projectId, taskId]);

    const moveSubtask = async (stId: string, newStatus: any) => {
        // Optimistic update
        setSubtasks((prev) =>
            prev.map((st) => (st.id === stId ? { ...st, status: newStatus } : st))
        );
        try {
            await api.updateProjectSubtask(projectId, taskId, stId, {
                isCompleted: newStatus === "Done",
                acceptanceStatus: newStatus === "PendingAcceptance" ? "PENDING" : "ACCEPTED",
            });
            toast.success("Subtask status updated");
            loadProjectDetail();
        } catch (err: any) {
            toast.error(err.message || "Failed to update subtask");
            loadProjectDetail();
        }
    };

    const handleAddSubtask = async (colStatus: any) => {
        if (!newTitle.trim()) return;

        const assignee = (project?.members || []).find((m: any) => m.userId === selectedAssigneeId)?.user || task?.assignees[0];
        if (!assignee) {
            toast.error("No assignee available.");
            return;
        }

        try {
            await api.createProjectSubtask(projectId, taskId, {
                title: newTitle.trim(),
                assignedToId: assignee.id,
                startDate: task.startDate,
                dueDate: task.dueDate,
                estimatedDays: Number(estimatedDays) || 1,
                isCompleted: colStatus === "Done",
            });
            toast.success("Subtask added successfully");
            setNewTitle("");
            setAddingInColId(null);
            loadProjectDetail();
        } catch (err: any) {
            toast.error(err.message || "Failed to add subtask");
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-5 bg-[var(--app-bg)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--app-muted)]" />
            </div>
        );
    }

    if (!project || !task) {
        return (
            <div className="flex-1 flex items-center justify-center p-5 bg-[var(--app-bg)]">
                <div className="text-center flex flex-col gap-3">
                    <h2 className="font-heading text-lg text-[var(--app-text)]">
                        Task Not Found
                    </h2>
                    <p className="text-base text-[var(--app-muted)]">
                        The requested super task could not be located in this project.
                    </p>
                    <Link
                        href={`/projects/${projectId}`}
                        className="text-[11px] text-[var(--app-text)] underline hover:no-underline"
                    >
                        ← Back to Project Board
                    </Link>
                </div>
            </div>
        );
    }

    const completedCount = subtasks.filter((s) => s.status === "Done").length;
    const progressPct = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

    const filteredSubtasks = memberFilter
        ? subtasks.filter((st) => st.assignedToId === memberFilter)
        : subtasks;

    const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        return d.toISOString().split("T")[0];
    };

    return (
        <div className="flex-1 overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col select-none">
            {/* Top Navigation & Breadcrumb */}
            <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-5 py-3 flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--app-muted)]">
                    <Link href="/projects" className="hover:text-[var(--app-text)] transition-colors">
                        Projects
                    </Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href={`/projects/${project.id}`} className="hover:text-[var(--app-text)] transition-colors">
                        {project.emoji} {project.title}
                    </Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="font-medium text-[var(--app-text)] truncate max-w-[220px]">
                        {task.title}
                    </span>
                </div>

                {/* Super Task Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href={`/projects/${project.id}`}
                            className="p-1.5 border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] rounded-[2px] transition-colors shrink-0"
                            title="Back to Project Board"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-[2px] border ${getPriorityBadge(task.priority)}`}>
                                    {task.priority} Priority
                                </span>
                                <span className="text-[8px] text-[var(--app-muted)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-[2px]">
                                    {task.effortMode} Effort
                                </span>
                                {(task.riskLevel === "AT_RISK" || task.riskLevel === "AtRisk") && (
                                    <span className="text-[8px] text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 px-1.5 py-0.5 rounded-[2px] flex items-center gap-1">
                                        <AlertTriangle className="w-2.5 h-2.5" /> At Risk
                                    </span>
                                )}
                                {(task.riskLevel === "OVERDUE" || task.riskLevel === "Overdue" || task.riskLevel === "CriticalSLA") && (
                                    <span className="text-[8px] text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-1.5 py-0.5 rounded-[2px] flex items-center gap-1">
                                        <ShieldAlert className="w-2.5 h-2.5" /> Overdue
                                    </span>
                                )}
                            </div>
                            <h1 className="font-heading text-lg text-[var(--app-text)] truncate mt-0.5">
                                {task.title}
                            </h1>
                        </div>
                    </div>

                    {/* Progress Bar & Member Filter */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-[var(--app-muted)]">Subtasks:</span>
                            <div className="w-24 h-2 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[1px] overflow-hidden">
                                <div
                                    className="h-full bg-[var(--color-success)] transition-all"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            <span className="font-semibold text-[var(--app-text)] tabular-nums">
                                {completedCount}/{subtasks.length} ({progressPct}%)
                            </span>
                        </div>

                        {/* Filter by Member */}
                        <div className="flex items-center gap-1.5 border border-[var(--app-border)] px-2 py-1 rounded-[2px] bg-[var(--app-bg)] text-[10px]">
                            <ListFilter className="w-3 h-3 text-[var(--app-muted)]" />
                            <select
                                value={memberFilter}
                                onChange={(e) => setMemberFilter(e.target.value)}
                                className="bg-transparent text-[10px] text-[var(--app-text)] focus:outline-none cursor-pointer"
                            >
                                <option value="">All Assignees</option>
                                {(task.assignees || []).map((a: any) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Sub-Header: Dates, Assignee Chips & Description */}
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--app-border)]/60">
                    <div className="flex items-center gap-4 text-[var(--app-muted)]">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(task.startDate)} → {formatDate(task.dueDate)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {task.estimatedDays} days total
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span>Super Task Assignees:</span>
                            <div className="flex -space-x-1">
                                {(task.assignees || []).map((u: any) => (
                                    <div
                                        key={u.id}
                                        className="w-4 h-4 rounded-full bg-[var(--app-card)] border border-[var(--app-border-strong)] flex items-center justify-center text-[7px] font-semibold"
                                        title={u.name}
                                    >
                                        {getInitials(u.name)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanban Columns Grid */}
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-y-auto">
                {SUBTASK_COLUMNS.map((col) => {
                    const colSubtasks = filteredSubtasks.filter((st) => {
                        if (col.status === "Backlog") return st.status === "Backlog" || st.status === "PendingAcceptance";
                        if (col.status === "InProgress") return st.status === "InProgress" || st.status === "AtRisk" || st.status === "Blocked";
                        if (col.status === "InReview") return st.status === "InReview" || st.status === "ReworkRequired";
                        return st.status === "Done";
                    });

                    const isDoneCol = col.status === "Done";

                    return (
                        <div
                            key={col.id}
                            className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-3 flex flex-col gap-3 min-h-[300px]"
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-[var(--app-border)]">
                                <span className="text-[11px] font-semibold text-[var(--app-text)]">
                                    {col.name}
                                </span>
                                <span className="text-[9px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-full tabular-nums">
                                    {colSubtasks.length}
                                </span>
                            </div>

                            {/* Subtask Cards List */}
                            <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                                {colSubtasks.length === 0 ? (
                                    <div className="text-center py-8 text-[var(--app-muted)] text-[10px] border border-dashed border-[var(--app-border)] rounded-[2px]">
                                        No subtasks
                                    </div>
                                ) : (
                                    colSubtasks.map((st) => (
                                        <div
                                            key={st.id}
                                            className="bg-[var(--app-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] p-2.5 rounded-[2px] flex flex-col gap-2 transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="text-[11px] font-medium text-[var(--app-text)] leading-snug break-words">
                                                    {st.title}
                                                </h4>
                                                {st.status === "Done" && (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
                                                )}
                                            </div>

                                            {/* Date range & capacity */}
                                            <div className="flex items-center justify-between text-[9px] text-[var(--app-muted)] pt-1 border-t border-[var(--app-border)]/50">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" /> {st.assignedTo?.name || "Unassigned"}
                                                </span>
                                                <span className="tabular-nums font-medium">
                                                    {st.estimatedDays}d
                                                </span>
                                            </div>

                                            {/* Action buttons (Drag-like dropdown status movement) */}
                                            <div className="flex items-center justify-between pt-1 text-[9px]">
                                                <span className="text-[8px] text-[var(--app-muted)]">Status:</span>
                                                <select
                                                    value={st.status}
                                                    onChange={(e) => moveSubtask(st.id, e.target.value)}
                                                    className="bg-[var(--app-card)] border border-[var(--app-border)] text-[9px] px-1 py-0.5 rounded-[2px] text-[var(--app-text)] focus:outline-none"
                                                >
                                                    <option value="Backlog">To Do</option>
                                                    <option value="InProgress">In Progress</option>
                                                    <option value="InReview">In Review</option>
                                                    <option value="Done">Done</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Subtask Button / Input */}
                            {!isDoneCol && (
                                <div className="mt-auto pt-2 border-t border-[var(--app-border)]/60">
                                    {addingInColId === col.id ? (
                                        <div className="flex flex-col gap-2 p-2 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] animate-fade-in">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Subtask title..."
                                                value={newTitle}
                                                onChange={(e) => setNewTitle(e.target.value)}
                                                className="px-2 py-1 text-[10px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] text-[var(--app-text)] focus:outline-none focus:border-[var(--app-border-strong)] w-full"
                                            />
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <div>
                                                    <label className="text-[8px] text-[var(--app-muted)]">Assignee</label>
                                                    <select
                                                        value={selectedAssigneeId}
                                                        onChange={(e) => setSelectedAssigneeId(e.target.value)}
                                                        className="w-full text-[9px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] p-1 text-[var(--app-text)]"
                                                    >
                                                        {(task.assignees || []).map((a: any) => (
                                                            <option key={a.id} value={a.id}>
                                                                {a.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[8px] text-[var(--app-muted)]">Est. Days</label>
                                                    <input
                                                        type="number"
                                                        min="0.5"
                                                        step="0.5"
                                                        value={estimatedDays}
                                                        onChange={(e) => setEstimatedDays(Number(e.target.value) || 1)}
                                                        className="w-full text-[9px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] p-1 text-[var(--app-text)]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-1.5 pt-1">
                                                <button
                                                    onClick={() => setAddingInColId(null)}
                                                    className="px-2 py-0.5 border border-[var(--app-border)] text-[9px] text-[var(--app-muted)] rounded-[2px] hover:bg-[var(--app-hover-bg)]"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleAddSubtask(col.status)}
                                                    className="px-2 py-0.5 bg-[var(--app-card)] border border-[var(--app-border)] text-[9px] text-[var(--app-text)] rounded-[2px] hover:bg-[var(--app-hover-bg)]"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAddingInColId(col.id);
                                                setNewTitle("");
                                            }}
                                            className="w-full flex items-center justify-center gap-1 py-1 text-[9px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] border border-dashed border-[var(--app-border)] rounded-[2px] transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Subtask
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
