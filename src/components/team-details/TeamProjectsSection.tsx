"use client";

import React from "react";
import Link from "next/link";
import { FolderKanban, ArrowUpRight, Calendar, CheckCircle2, Clock, Users } from "lucide-react";
import { extractDateString, parseLocalDate } from "@/utils/date";

interface ProjectItem {
    id: string;
    title: string;
    description?: string;
    emoji?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    progress?: number;
    completedTasks?: number;
    totalTasks?: number;
    teamId?: string;
}

interface TeamProjectsSectionProps {
    projects: ProjectItem[];
    isLoading?: boolean;
    teamId: string;
    teamName: string;
}

function formatShortDateRange(start?: string | Date | null, end?: string | Date | null): string {
    const sStr = extractDateString(start);
    const eStr = extractDateString(end);
    if (!sStr && !eStr) return "";
    const formatPart = (dStr: string) => {
        try {
            const d = parseLocalDate(dStr);
            return isNaN(d.getTime()) ? dStr : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } catch {
            return dStr;
        }
    };
    if (sStr && eStr) return `${formatPart(sStr)} – ${formatPart(eStr)}`;
    return formatPart(sStr || eStr);
}

function getProjectStatusBadge(status?: string) {
    const s = (status || "IN_PROGRESS").toUpperCase();
    switch (s) {
        case "COMPLETED":
        case "DONE":
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs,2px)] text-[10px] font-semibold bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
                    Completed
                </span>
            );
        case "PLANNING":
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs,2px)] text-[10px] font-semibold bg-[var(--app-bg)] text-[var(--app-muted)] border border-[var(--app-border)]">
                    Planning
                </span>
            );
        case "REVIEW":
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs,2px)] text-[10px] font-semibold bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20">
                    In Review
                </span>
            );
        case "ON_HOLD":
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs,2px)] text-[10px] font-semibold bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20">
                    On Hold
                </span>
            );
        case "IN_PROGRESS":
        default:
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs,2px)] text-[10px] font-semibold bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                    In Progress
                </span>
            );
    }
}

export function TeamProjectsSection({
    projects,
    isLoading = false,
    teamId,
    teamName,
}: TeamProjectsSectionProps) {
    const teamProjects = projects.filter((p) => !p.teamId || p.teamId === teamId);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-pulse">
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 rounded-[var(--radius-card,8px)] h-36 flex flex-col justify-between"
                    >
                        <div className="w-32 h-4 bg-[var(--app-border)]/60 rounded" />
                        <div className="w-full h-2 bg-[var(--app-bg)] rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (teamProjects.length === 0) {
        return (
            <div className="bg-[var(--app-card)] border border-dashed border-[var(--app-border)] rounded-[var(--radius-card,8px)] p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)]">
                    <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-[var(--app-text)]">
                        No projects linked yet
                    </h4>
                    <p className="text-xs text-[var(--app-muted)] mt-1 max-w-sm">
                        There are currently no active projects linked to <span className="font-semibold text-[var(--app-text)]">{teamName}</span>.
                    </p>
                </div>
                <Link
                    href="/projects"
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm,4px)] text-xs font-semibold bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
                >
                    <span>View Projects Portfolio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {teamProjects.map((project) => {
                const dateRange = formatShortDateRange(project.startDate, project.endDate);
                const progress = project.progress ?? (
                    project.totalTasks && project.totalTasks > 0
                        ? Math.round(((project.completedTasks || 0) / project.totalTasks) * 100)
                        : 0
                );

                return (
                    <div
                        key={project.id}
                        className="bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] p-4 rounded-[var(--radius-card,8px)] transition-all hover:bg-[var(--app-hover-bg)]/40 shadow-3xs flex flex-col justify-between gap-3 min-w-0"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-lg shrink-0">
                                    {project.emoji ? (
                                        <span className="emoji-font">{project.emoji}</span>
                                    ) : (
                                        <FolderKanban className="w-4 h-4 text-[var(--app-muted)]" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="text-sm font-semibold text-[var(--app-text)] hover:text-[var(--color-accent)] transition-colors truncate block"
                                    >
                                        {project.title}
                                    </Link>
                                    {project.description && (
                                        <p className="text-xs text-[var(--app-muted)] line-clamp-1 mt-0.5">
                                            {project.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="shrink-0">
                                {getProjectStatusBadge(project.status)}
                            </div>
                        </div>

                        {/* Middle info */}
                        <div className="flex items-center justify-between text-xs text-[var(--app-muted)] pt-1">
                            {dateRange ? (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                    <span className="text-[11px]">{dateRange}</span>
                                </div>
                            ) : (
                                <span className="text-[11px] text-[var(--app-muted)]">No date set</span>
                            )}
                            <div className="text-[11px] font-medium text-[var(--app-text)]">
                                {project.completedTasks || 0} / {project.totalTasks || 0} tasks
                            </div>
                        </div>

                        {/* Progress Bar & Footer */}
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--app-border)]/60">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[10px] text-[var(--app-muted)]">Progress</span>
                                <span className="text-[10px] font-semibold text-[var(--app-text)] tabular-nums">{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--app-bg)] rounded-full overflow-hidden border border-[var(--app-border)]">
                                <div
                                    className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-end pt-1">
                                <Link
                                    href={`/projects/${project.id}`}
                                    className="text-xs font-medium text-[var(--app-muted)] hover:text-[var(--color-accent)] inline-flex items-center gap-1 transition-colors"
                                >
                                    <span>Open Details</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
