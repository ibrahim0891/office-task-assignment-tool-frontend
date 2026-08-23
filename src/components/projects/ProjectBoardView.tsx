"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Calendar, ChevronRight, CheckCircle2, AlertTriangle, Layers, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Button } from "../ui/Button";
import { CustomSelect, SelectOption } from "../ui/CustomSelect";
import CreateProjectTaskModal from "./CreateProjectTaskModal";

const PRIORITY_OPTIONS: SelectOption[] = [
    { value: "ALL", label: "All Priorities" },
    { value: "URGENT", label: "Urgent" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

function getInitials(name: string) {
    if (!name) return "";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function stripHtml(html: string) {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function getPriorityStyle(priority: string) {
    const p = (priority || "").toUpperCase();
    switch (p) {
        case "URGENT":
        case "Urgent": return "text-[var(--priority-urgent)] bg-[var(--priority-urgent)]/10 border-[var(--priority-urgent)]/20";
        case "HIGH":
        case "High": return "text-[var(--priority-high)] bg-[var(--priority-high)]/10 border-[var(--priority-high)]/20";
        case "MEDIUM":
        case "Medium": return "text-[var(--priority-medium)] bg-[var(--priority-medium)]/10 border-[var(--priority-medium)]/20";
        default: return "text-[var(--priority-low)] bg-[var(--priority-low)]/10 border-[var(--priority-low)]/20";
    }
}

function getRiskBadge(riskLevel: string) {
    switch (riskLevel) {
        case "AT_RISK":
        case "AtRisk": return { label: "At Risk", cls: "text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20" };
        case "OVERDUE":
        case "Overdue": return { label: "Overdue", cls: "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20" };
        case "CRITICAL_SLA":
        case "CriticalSLA": return { label: "SLA Breach", cls: "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20" };
        default: return null;
    }
}

function getDerivedStatus(task: any, columnMap: Record<string, any>) {
    const subtasks = task.subtasks || [];
    const total = subtasks.length;
    const done = subtasks.filter((s: any) => s.isCompleted || s.status === "Completed" || s.status === "Done").length;

    if (total > 0) {
        if (done === total) {
            return {
                label: "Completed",
                cls: "text-[#22863A] bg-[#22863A]/10 border-[#22863A]/20",
                dotCls: "bg-[#22863A]"
            };
        }
        if (done > 0 || subtasks.some((s: any) => s.status === "In Progress" || s.status === "IN_PROGRESS")) {
            return {
                label: "In Progress",
                cls: "text-[#0284C7] bg-[#0284C7]/10 border-[#0284C7]/20",
                dotCls: "bg-[#0284C7]"
            };
        }
        return {
            label: "To Do",
            cls: "text-[var(--app-muted)] bg-[var(--app-bg)] border-[var(--app-border)]",
            dotCls: "bg-[var(--app-muted)]"
        };
    }

    // Fallback based on task column or completion state
    const col = columnMap[task.columnId];
    if (col?.isComplete || task.isCompleted) {
        return {
            label: "Completed",
            cls: "text-[#22863A] bg-[#22863A]/10 border-[#22863A]/20",
            dotCls: "bg-[#22863A]"
        };
    }
    return {
        label: col?.name || "To Do",
        cls: "text-[var(--app-muted)] bg-[var(--app-bg)] border-[var(--app-border)]",
        dotCls: "bg-[var(--app-muted)]"
    };
}

function MainTaskGridCard({
    task,
    projectId,
    columnMap,
}: {
    task: any;
    projectId: string;
    columnMap: Record<string, any>;
}) {
    const router = useRouter();
    const subtasks = task.subtasks || [];
    const doneSubtasks = subtasks.filter((s: any) => s.isCompleted || s.status === "Completed" || s.status === "Done").length;
    const totalSubtasks = subtasks.length;
    const progressPercent = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : (task.isCompleted ? 100 : 0);

    const statusConfig = getDerivedStatus(task, columnMap);
    const riskBadge = getRiskBadge(task.riskLevel);
    const column = columnMap[task.columnId];

    // Clean description HTML tags
    const cleanDescription = stripHtml(task.description || "");

    // Normalize assignees list
    const assigneesList: any[] = [];
    if (Array.isArray(task.assignees)) {
        task.assignees.forEach((a: any) => {
            if (a.user) assigneesList.push(a.user);
            else assigneesList.push(a);
        });
    }

    return (
        <div
            className="group relative corner-brackets-4 bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] rounded-[2px] p-4 flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
            onClick={() => router.push(`/projects/${projectId}/tasks/${task.id}`)}
        >
            {/* Top Row: Derived Status + Priority & Risk Badges */}
            <div className="flex items-center justify-between gap-2">
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-[2px] border flex items-center gap-1.5 ${statusConfig.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotCls}`} />
                    {statusConfig.label}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-[2px] border ${getPriorityStyle(task.priority)}`}>
                        {task.priority || "MEDIUM"}
                    </span>
                    {riskBadge && (
                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-[2px] border ${riskBadge.cls}`}>
                            {riskBadge.label}
                        </span>
                    )}
                </div>
            </div>

            {/* Content Section: Category/Column + Title + Cleaned Description */}
            <div className="flex flex-col gap-1.5">
                {column?.name && (
                    <span className="text-[9px] font-medium text-[var(--app-muted)] uppercase tracking-wider">
                        {column.name}
                    </span>
                )}
                <h3 className="font-heading text-sm font-semibold text-[var(--app-text)] line-clamp-2 leading-snug">
                    {task.title}
                </h3>
                {cleanDescription && (
                    <p className="text-[11px] text-[var(--app-muted)] line-clamp-2 leading-relaxed">
                        {cleanDescription}
                    </p>
                )}
            </div>

            {/* Cumulative Progress Section */}
            <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--app-muted)] flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[var(--app-muted)] shrink-0" />
                        <span>Subtask Progress</span>
                    </span>
                    <span className="font-medium text-[var(--app-text)] tabular-nums">
                        {totalSubtasks > 0 ? `${doneSubtasks}/${totalSubtasks} Done (${progressPercent}%)` : (task.isCompleted ? "100%" : "No Subtasks")}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] h-2 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 rounded-full ${
                            progressPercent === 100
                                ? "bg-[#22863A]"
                                : progressPercent > 0
                                ? "bg-[#0284C7]"
                                : "bg-[var(--app-border-strong)]"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Footer Row: Avatars, Due Date & Navigation Arrow */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--app-border)] text-[10px]">
                {/* Left: Assignees + Date */}
                <div className="flex items-center gap-2.5">
                    {/* Avatars Stack */}
                    <div className="flex -space-x-1.5">
                        {assigneesList.length > 0 ? (
                            assigneesList.slice(0, 3).map((user, idx) => {
                                const name = user.name || user.fullName || "User";
                                return (
                                    <div
                                        key={user.id || idx}
                                        className="w-5 h-5 rounded-full border border-[var(--app-border-strong)] bg-[var(--app-bg)] flex items-center justify-center text-[7px] font-semibold text-[var(--app-text)] shrink-0"
                                        title={name}
                                    >
                                        {getInitials(name)}
                                    </div>
                                );
                            })
                        ) : (
                            <span className="text-[9px] text-[var(--app-muted)] italic">Unassigned</span>
                        )}
                        {assigneesList.length > 3 && (
                            <div className="w-5 h-5 rounded-full border border-[var(--app-border)] bg-[var(--app-bg)] flex items-center justify-center text-[7px] text-[var(--app-muted)] shrink-0">
                                +{assigneesList.length - 3}
                            </div>
                        )}
                    </div>

                    {/* Due Date */}
                    {task.dueDate && (
                        <div className="flex items-center gap-1 text-[9px] text-[var(--app-muted)] shrink-0">
                            <Calendar className="w-3 h-3 text-[var(--app-muted)]" />
                            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        </div>
                    )}
                </div>

                {/* Right: Action link */}
                <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--app-muted)] group-hover:text-[var(--app-text)] transition-colors">
                    <span>View Subtasks</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </div>
    );
}

interface ProjectBoardViewProps {
    project: any;
    onRefresh?: (silent?: boolean) => void;
}

export default function ProjectBoardView({ project, onRefresh }: ProjectBoardViewProps) {
    const { currentUser } = useWorkspace();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

    const tasks = project?.tasks || [];
    const columns = project?.columns || [];

    // Map column ID to column object
    const columnMap: Record<string, any> = {};
    columns.forEach((col: any) => {
        columnMap[col.id] = col;
    });

    // Filter tasks based on search & priority
    const filteredTasks = tasks.filter((t: any) => {
        const matchesSearch = searchQuery === "" || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = selectedPriority === "ALL" || (t.priority || "").toUpperCase() === selectedPriority;
        return matchesSearch && matchesPriority;
    });

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--app-bg)]">
            {/* Header Toolbar */}
            <div className="shrink-0 px-5 py-3 border-b border-[var(--app-border)] bg-[var(--app-card)] flex flex-wrap items-center justify-between gap-3">
                {/* Search & Priority Filter */}
                <div className="flex items-center gap-2.5 flex-1 min-w-[240px] max-w-lg">
                    <div className="relative flex-1 corner-brackets-4">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
                        <input
                            type="text"
                            placeholder="Filter main tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] pl-8 pr-3 py-1 text-[11px] text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none focus:border-[var(--app-border-strong)] transition-colors"
                        />
                    </div>

                    <CustomSelect
                        options={PRIORITY_OPTIONS}
                        value={selectedPriority}
                        onChange={setSelectedPriority}
                        buttonClassName="corner-brackets-4 text-[10px] h-[28px] py-0.5"
                        className="w-36 shrink-0"
                    />
                </div>

                {/* Right: Task Count */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[var(--app-muted)]">
                        Showing <span className="font-semibold text-[var(--app-text)] tabular-nums">{filteredTasks.length}</span> main tasks
                    </span>
                </div>
            </div>

            {/* Main Tasks Grid View */}
            <div className="flex-1 overflow-y-auto p-5">
                {filteredTasks.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[var(--app-border)] rounded-[3px] text-center p-6 bg-[var(--app-card)] relative corner-brackets-4">
                        <Layers className="w-8 h-8 text-[var(--app-muted)] mb-2" />
                        <h4 className="font-heading text-sm text-[var(--app-text)] mb-1">No Main Tasks Found</h4>
                        <p className="text-[11px] text-[var(--app-muted)] max-w-sm mb-4">
                            {searchQuery ? "No tasks matched your search query or filter." : "Get started by creating your first main task for this project."}
                        </p>
                        <Button
                            size="sm"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => setIsCreateTaskModalOpen(true)}
                        >
                            Create Main Task
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
                        {filteredTasks.map((task: any) => (
                            <MainTaskGridCard
                                key={task.id}
                                task={task}
                                projectId={project.id}
                                columnMap={columnMap}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Project Main Task Modal */}
            <CreateProjectTaskModal
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                project={project}
                onRefresh={onRefresh}
            />
        </div>
    );
}
