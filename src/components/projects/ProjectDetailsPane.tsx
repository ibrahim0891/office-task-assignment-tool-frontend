"use client";

import React from "react";
import { X, Edit2, FolderKanban } from "lucide-react";
import { UserAvatar } from "../ui/UserAvatar";
import { useWorkspace } from "../../context/WorkspaceContext";
import {
    calculateProjectProgress,
    calculateProjectHealth,
} from "../../utils/projectProgress";
import {
    calculateRemainingDays,
    calculateDaySpan,
    formatDaySpan,
    extractDateString,
    parseLocalDate,
} from "../../utils/date";

interface ProjectDetailsPaneProps {
    project: any;
    canEdit?: boolean;
    onEditClick?: () => void;
    onOpenManageColumns?: () => void;
    onOpenManageFolders?: () => void;
    onClose: () => void;
}

export default function ProjectDetailsPane({
    project,
    canEdit = false,
    onEditClick,
    onOpenManageColumns,
    onOpenManageFolders,
    onClose,
}: ProjectDetailsPaneProps) {
    const { openMemberProfile } = useWorkspace();

    if (!project) return null;

    const status = calculateProjectHealth(project);
    const remainingDays = calculateRemainingDays(project.endDate);

    const calculatedProgress =
        Array.isArray(project.tasks) && project.tasks.length > 0
            ? calculateProjectProgress(project.tasks, project.columns)
            : project.progress !== undefined
            ? project.progress
            : 0;

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

    const formatReadableDate = (dateInput: any) => {
        const str = extractDateString(dateInput);
        if (!str) return "—";
        return parseLocalDate(str).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const durationLabel =
        project.startDate && project.endDate
            ? formatDaySpan(calculateDaySpan(project.startDate, project.endDate))
            : "—";

    const hasDescription = Boolean(
        project?.description &&
            project.description
                .replace(/<[^>]*>/g, "")
                .replace(/&nbsp;/g, " ")
                .trim().length > 0
    );

    return (
        <aside className="hidden lg:flex flex-col w-[360px] xl:w-[400px] shrink-0 border-l border-[var(--app-border)] bg-[var(--app-card)] select-none overflow-hidden">
            {/* Pane Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--app-border)] shrink-0">
                <span className="text-xs font-semibold text-[var(--app-text)] tracking-tight">
                    Project Details
                </span>
                <div className="flex items-center gap-1">
                    {canEdit && onEditClick && (
                        <button
                            type="button"
                            onClick={onEditClick}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] rounded-[3px] transition-colors cursor-pointer"
                            title="Edit Project Details"
                        >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] rounded-[3px] transition-colors cursor-pointer"
                        title="Hide Details Pane"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 custom-scrollbar select-text">
                {/* Identity & Progress */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                        {project.emoji ? (
                            <span className="text-2xl emoji-font shrink-0 leading-none mt-0.5">
                                {project.emoji}
                            </span>
                        ) : (
                            <FolderKanban className="w-6 h-6 text-[var(--app-muted)] shrink-0 mt-0.5" />
                        )}
                        <div className="flex flex-col gap-1 min-w-0">
                            <h3 className="text-sm font-bold text-[var(--app-text)] leading-snug break-words">
                                {project.title}
                            </h3>
                            <span
                                className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${status.color}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                <span>{status.label}</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--app-muted)]">Progress</span>
                            <span className="font-semibold text-[var(--app-text)] tabular-nums">
                                {calculatedProgress}%{" "}
                                <span className="font-normal text-[var(--app-muted)]">
                                    ({completedTasksCount}/{tasks.length} tasks)
                                </span>
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--app-border)]/70 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--status-completed,#15803D)] rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, Math.max(0, calculatedProgress))}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Explorer-style Key-Value Properties */}
                <div className="border-t border-[var(--app-border)] pt-4 flex flex-col gap-2.5 text-xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                        Information
                    </span>

                    <dl className="grid grid-cols-[84px_1fr] gap-y-2.5 gap-x-3 items-baseline text-[11px]">
                        {project.team && (
                            <>
                                <dt className="text-[var(--app-muted)]">Space</dt>
                                <dd className="text-[var(--app-text)] font-medium truncate flex items-center gap-1.5 min-w-0">
                                    {project.team.emoji && (
                                        <span className="emoji-font text-xs shrink-0">
                                            {project.team.emoji}
                                        </span>
                                    )}
                                    <span className="truncate">{project.team.name}</span>
                                </dd>
                            </>
                        )}

                        {project.folder && (
                            <>
                                <dt className="text-[var(--app-muted)]">Folder</dt>
                                <dd className="text-[var(--app-text)] font-medium truncate">
                                    {project.folder.name}
                                </dd>
                            </>
                        )}

                        <dt className="text-[var(--app-muted)]">Start date</dt>
                        <dd className="text-[var(--app-text)] font-medium tabular-nums">
                            {formatReadableDate(project.startDate)}
                        </dd>

                        <dt className="text-[var(--app-muted)]">Due date</dt>
                        <dd className="text-[var(--app-text)] font-medium tabular-nums flex items-center gap-1.5 flex-wrap">
                            <span>{formatReadableDate(project.endDate)}</span>
                            {remainingDays && (
                                <span
                                    className={`text-[10px] ${
                                        remainingDays.isOverdue
                                            ? "text-[var(--color-error)] font-semibold"
                                            : remainingDays.isToday
                                            ? "text-[var(--color-warning)] font-semibold"
                                            : "text-[var(--app-muted)]"
                                    }`}
                                >
                                    · {remainingDays.label}
                                </span>
                            )}
                        </dd>

                        <dt className="text-[var(--app-muted)]">Duration</dt>
                        <dd className="text-[var(--app-text)] font-medium tabular-nums">
                            {durationLabel}
                        </dd>

                        <dt className="text-[var(--app-muted)]">Columns</dt>
                        <dd className="text-[var(--app-text)] font-medium flex items-center justify-between gap-2">
                            <span className="tabular-nums">
                                {(project.columns || []).length}{" "}
                                {(project.columns || []).length === 1 ? "stage" : "stages"}
                            </span>
                            {onOpenManageColumns && (
                                <button
                                    type="button"
                                    onClick={onOpenManageColumns}
                                    className="text-[11px] font-medium text-[var(--color-accent)] hover:underline cursor-pointer shrink-0"
                                >
                                    Manage
                                </button>
                            )}
                        </dd>

                        <dt className="text-[var(--app-muted)]">Folders</dt>
                        <dd className="text-[var(--app-text)] font-medium flex items-center justify-between gap-2">
                            <span className="tabular-nums">
                                {(project.taskFolders || []).length}{" "}
                                {(project.taskFolders || []).length === 1 ? "folder" : "folders"}
                            </span>
                            {onOpenManageFolders && (
                                <button
                                    type="button"
                                    onClick={onOpenManageFolders}
                                    className="text-[11px] font-medium text-[var(--color-accent)] hover:underline cursor-pointer shrink-0"
                                >
                                    Manage
                                </button>
                            )}
                        </dd>
                    </dl>
                </div>

                {/* Members */}
                <div className="border-t border-[var(--app-border)] pt-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                            Members ({members.length})
                        </span>
                    </div>

                    {members.length === 0 ? (
                        <p className="text-[11px] text-[var(--app-muted)] italic">
                            No members assigned yet.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto overflow-x-hidden custom-scrollbar">
                            {members.map((m: any) => {
                                const isLeader =
                                    m.role === "Leader" || m.role === "LEADER";
                                const memberUser = m.user || m;
                                return (
                                    <button
                                        key={m.id || memberUser.id}
                                        type="button"
                                        onClick={() => openMemberProfile(memberUser)}
                                        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-[3px] hover:bg-[var(--app-hover-bg)] transition-colors cursor-pointer text-left group"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <UserAvatar
                                                name={memberUser.fullName || memberUser.name}
                                                avatarUrl={memberUser.avatarUrl}
                                                size="xs"
                                            />
                                            <span className="text-[11px] font-medium text-[var(--app-text)] group-hover:text-[var(--color-accent)] truncate">
                                                {memberUser.fullName || memberUser.name}
                                            </span>
                                        </div>
                                        {isLeader && (
                                            <span className="text-[10px] font-medium text-[var(--color-accent)] shrink-0">
                                                Leader
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Description & Scope */}
                {hasDescription && (
                    <div className="border-t border-[var(--app-border)] pt-4 flex flex-col gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                            Description
                        </span>
                        <div
                            className="text-[11px] leading-relaxed text-[var(--app-text)]/90 prose prose-xs dark:prose-invert max-w-none break-words [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-accent)] [&_blockquote]:pl-2.5 [&_blockquote]:italic"
                            dangerouslySetInnerHTML={{
                                __html: project.description,
                            }}
                        />
                    </div>
                )}
            </div>
        </aside>
    );
}
