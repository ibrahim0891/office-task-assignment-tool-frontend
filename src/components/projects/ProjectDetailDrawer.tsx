"use client";

import React from "react";
import {
    X,
    Calendar,
    Users,
    CheckCircle2,
    Building2,
    FolderKanban,
    Edit2,
    AlignLeft,
    BarChart2,
    Clock,
    ShieldAlert,
    Folder,
    Sparkles,
} from "lucide-react";
import SideSheetWrapper from "../ui/SideSheetWrapper";
import { Button } from "../ui/Button";
import { UserAvatar } from "../ui/UserAvatar";
import {
    calculateProjectProgress,
    calculateProjectHealth,
} from "../../utils/projectProgress";
import {
    calculateRemainingDays,
    calculateDaySpan,
    formatDaySpan,
} from "../../utils/date";

interface ProjectDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    currentUser: any;
    userRole: string;
    canEdit?: boolean;
    onEditClick?: () => void;
}

export default function ProjectDetailDrawer({
    isOpen,
    onClose,
    project,
    currentUser,
    userRole,
    canEdit = false,
    onEditClick,
}: ProjectDetailDrawerProps) {
    if (!project) return null;

    const status = calculateProjectHealth(project);
    const remainingDays = calculateRemainingDays(project.endDate);

    const calculatedProgress =
        Array.isArray(project.tasks) && project.tasks.length > 0
            ? calculateProjectProgress(project.tasks, project.columns)
            : (project.progress !== undefined ? project.progress : 0);

    const members = project.members || [];
    const tasks = project.tasks || [];
    const completedTasksCount = tasks.filter((t: any) => {
        const stage = t.stageTag || "";
        return (
            stage === "DONE" ||
            t.column?.name?.toLowerCase().includes("done") ||
            t.column?.name?.toLowerCase().includes("completed")
        );
    }).length;

    // Format dates to YYYY-MM-DD
    const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        try {
            const d = new Date(dateInput);
            return d.toISOString().split("T")[0];
        } catch {
            return String(dateInput);
        }
    };

    return (
        <SideSheetWrapper
            isOpen={isOpen}
            onClose={onClose}
            width="lg"
            className="flex flex-col h-full bg-[var(--app-card)] border-l border-[var(--app-border)] text-left select-none text-[var(--app-text)]"
        >
            {/* ── Top Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--app-border)] bg-[var(--app-card)] shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl emoji-font shrink-0">
                        {project.emoji || "📁"}
                    </span>
                    <div className="flex flex-col min-w-0">
                        <span className="eyebrow text-[9px] text-[var(--app-muted)] tracking-wider">
                            PROJECT OVERVIEW & DETAILS
                        </span>
                        <h2 className="text-base font-bold text-[var(--app-text)] truncate leading-tight">
                            {project.title}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {canEdit && onEditClick && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                onClose();
                                onEditClick();
                            }}
                            icon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                            Edit
                        </Button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] w-7 h-7 rounded-[3px] flex items-center justify-center transition-colors cursor-pointer"
                        title="Close Drawer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 custom-scrollbar select-text">
                {/* ── Hero Status & Progress Card ── */}
                <div className="p-4 rounded-[3px] bg-[var(--app-bg)] border border-[var(--app-border)] flex flex-col gap-3.5 shadow-2xs">
                    {/* Top Row: Status Badge & Owning Team */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border text-xs font-semibold ${status.color} ${status.bg} ${status.border}`}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full ${status.dot}`}
                                />
                                <span>{status.label}</span>
                            </span>

                            {project.team && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-[var(--app-border)] bg-[var(--app-card)] text-xs text-[var(--app-text)] font-medium">
                                    <span className="emoji-font text-xs">
                                        {project.team.emoji || "🧑‍💻"}
                                    </span>
                                    <span>{project.team.name}</span>
                                </span>
                            )}

                            {project.folder && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-[var(--app-border)] bg-[var(--app-card)] text-xs text-[var(--app-muted)]">
                                    <Folder className="w-3.5 h-3.5" />
                                    <span>{project.folder.name}</span>
                                </span>
                            )}
                        </div>

                        {remainingDays && (
                            <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-[2px] border ${
                                    remainingDays.isOverdue
                                        ? "text-[#CB2431] bg-[#CB2431]/10 border-[#CB2431]/20"
                                        : "text-[var(--app-muted)] bg-[var(--app-card)] border-[var(--app-border)]"
                                }`}
                            >
                                {remainingDays.isOverdue
                                    ? `${remainingDays.days}d Overdue`
                                    : `${remainingDays.days}d Remaining`}
                            </span>
                        )}
                    </div>

                    {/* Progress Bar & Stats */}
                    <div className="flex flex-col gap-1.5 pt-1 border-t border-[var(--app-border)]/60">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--app-muted)] font-medium">
                                Overall Progress
                            </span>
                            <span className="font-semibold text-[var(--app-text)]">
                                {calculatedProgress}% ({completedTasksCount}/{tasks.length} tasks)
                            </span>
                        </div>
                        <div className="w-full h-2 bg-[var(--app-border)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--color-accent,#00D26A)] rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, calculatedProgress))}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Key Project Metrics Grid ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Start Date */}
                    <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[var(--app-muted)] text-[11px] font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Start Date</span>
                        </div>
                        <span className="text-xs font-semibold text-[var(--app-text)] font-mono">
                            {formatDate(project.startDate) || "—"}
                        </span>
                    </div>

                    {/* Target Deadline */}
                    <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[var(--app-muted)] text-[11px] font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Target Deadline</span>
                        </div>
                        <span className="text-xs font-semibold text-[var(--app-text)] font-mono">
                            {formatDate(project.endDate) || "—"}
                        </span>
                    </div>

                    {/* Timeline Span */}
                    <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[var(--app-muted)] text-[11px] font-medium">
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>Duration</span>
                        </div>
                        <span className="text-xs font-semibold text-[var(--app-text)]">
                            {project.startDate && project.endDate
                                ? formatDaySpan(
                                      calculateDaySpan(
                                          project.startDate,
                                          project.endDate,
                                      ),
                                  )
                                : "—"}
                        </span>
                    </div>
                </div>

                {/* ── Description Section ── */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-[var(--app-border)]/60">
                        <AlignLeft className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        <h3 className="eyebrow text-[10px] tracking-wider text-[var(--app-text)] font-bold">
                            Description & Scope
                        </h3>
                    </div>

                    {project.description ? (
                        <div className="p-4 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] text-xs leading-relaxed text-[var(--app-text)]/90 prose prose-xs sm:prose-sm dark:prose-invert max-w-none break-words select-text [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[var(--app-border)] [&_th]:p-2 [&_th]:bg-[var(--app-card)] [&_td]:border [&_td]:border-[var(--app-border)] [&_td]:p-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-accent)] [&_blockquote]:pl-3 [&_blockquote]:italic">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: project.description,
                                }}
                            />
                        </div>
                    ) : (
                        <div className="p-4 bg-[var(--app-bg)] border border-dashed border-[var(--app-border)] rounded-[3px] text-center text-xs text-[var(--app-muted)] italic">
                            No description provided for this project.
                        </div>
                    )}
                </div>

                {/* ── Project Members & Roles ── */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--app-border)]/60">
                        <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                            <h3 className="eyebrow text-[10px] tracking-wider text-[var(--app-text)] font-bold">
                                Project Members ({members.length})
                            </h3>
                        </div>
                    </div>

                    {members.length === 0 ? (
                        <div className="p-3 bg-[var(--app-bg)] border border-dashed border-[var(--app-border)] rounded-[3px] text-center text-xs text-[var(--app-muted)] italic">
                            No individual members assigned yet.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                            {members.map((m: any) => {
                                const isLeader =
                                    m.role === "Leader" || m.role === "LEADER";
                                const memberUser = m.user || m;

                                return (
                                    <div
                                        key={m.id || memberUser.id}
                                        className="flex items-center justify-between p-2.5 rounded-[3px] bg-[var(--app-bg)] border border-[var(--app-border)]"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <UserAvatar
                                                name={memberUser.fullName}
                                                avatarUrl={memberUser.avatarUrl}
                                                size="sm"
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-semibold text-[var(--app-text)] truncate">
                                                    {memberUser.fullName}
                                                </span>
                                                <span className="text-[10px] text-[var(--app-muted)] truncate">
                                                    {memberUser.email}
                                                </span>
                                            </div>
                                        </div>

                                        <span
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-[2px] border ${
                                                isLeader
                                                    ? "text-[#CB2431] bg-[#CB2431]/10 border-[#CB2431]/20"
                                                    : "text-[var(--app-muted)] bg-[var(--app-card)] border-[var(--app-border)]"
                                            }`}
                                        >
                                            {isLeader ? "Project Leader" : "Member"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Bottom Sticky Footer ── */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-[var(--app-border)] bg-[var(--app-card)] shrink-0">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                >
                    Close
                </Button>
                {canEdit && onEditClick && (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                            onClose();
                            onEditClick();
                        }}
                        icon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                        Edit Project Details
                    </Button>
                )}
            </div>
        </SideSheetWrapper>
    );
}
