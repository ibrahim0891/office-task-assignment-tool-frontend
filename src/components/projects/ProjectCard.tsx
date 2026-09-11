"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
    Calendar,
    Building2,
    FolderKanban,
    MoreVertical,
    Pencil,
    FolderArchive,
    Info,
    ArrowRight,
} from "lucide-react";
import { Button } from "../ui/Button";
import { UserAvatar } from "../ui/UserAvatar";
import {
    calculateRemainingDays,
    extractDateString,
    parseLocalDate,
    calculateDaySpan,
    formatDaySpan,
} from "../../utils/date";
import { calculateProjectHealth, calculateProjectProgress } from "../../utils/projectProgress";

export interface TaskCardProps {
    title: string;
    description?: string | null;
    emoji?: string | null;
    teamName?: string | null;
    teamEmoji?: string | null;
    status?: string;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    completedTasks?: number;
    totalTasks?: number;
    overdueTasks?: number;
    progress?: number;
    tasks?: any[];
    columns?: any[];
    assignees?: Array<{ id: string; name: string; avatarUrl?: string | null; role?: string }>;
    onClick?: () => void;
    href?: string;
    onEdit?: () => void;
    onArchive?: () => void;
    canArchive?: boolean;
    onViewDetails?: () => void;
}

function formatShortDateRange(start?: string | Date | null, end?: string | Date | null): string {
    const sStr = extractDateString(start);
    const eStr = extractDateString(end);
    if (!sStr && !eStr) return "";
    const formatPart = (dStr: string) => {
        const d = parseLocalDate(dStr);
        return isNaN(d.getTime()) ? dStr : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    if (sStr && eStr) return `${formatPart(sStr)} – ${formatPart(eStr)}`;
    return formatPart(sStr || eStr);
}

function getPlainTextPreview(htmlOrText?: string | null): string {
    if (!htmlOrText) return "";
    return htmlOrText
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();
}

export function ProjectCard({
    title,
    description,
    emoji,
    teamName,
    teamEmoji,
    status = "Active",
    startDate,
    endDate,
    completedTasks = 0,
    totalTasks = 0,
    overdueTasks = 0,
    progress,
    tasks,
    columns,
    assignees = [],
    onClick,
    href,
    onEdit,
    onArchive,
    canArchive = false,
    onViewDetails,
}: TaskCardProps) {
    const health = useMemo(() => {
        return calculateProjectHealth({
            status,
            startDate,
            endDate,
            totalTasks,
            doneTasks: completedTasks,
            completedTasks,
            overdueTasks,
            progress,
            tasks,
            columns,
        });
    }, [status, startDate, endDate, totalTasks, completedTasks, overdueTasks, progress, tasks, columns]);

    const calculatedProgress = useMemo(() => {
        if (Array.isArray(tasks) && tasks.length > 0) {
            return calculateProjectProgress(tasks, columns);
        }
        return progress !== undefined ? progress : 0;
    }, [tasks, columns, progress]);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isMenuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

    const dateRange = formatShortDateRange(startDate, endDate);
    const durationDays = useMemo(() => {
        if (!startDate || !endDate) return null;
        return calculateDaySpan(startDate, endDate);
    }, [startDate, endDate]);

    const descriptionPreview = getPlainTextPreview(description);

    return (
        <div
            onClick={onClick}
            className="group relative bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--color-accent)]/80 rounded-[3px] p-4 flex flex-col justify-between gap-3.5 transition-all duration-200 corner-brackets shadow-2xs hover:shadow-float text-left"
        >
            <div className="flex flex-col gap-2.5">
                {/* 1. Header Row: Emoji, Title & Action Menu */}
                <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {emoji ? (
                            <span className="text-xl emoji-font shrink-0 leading-none group-hover:scale-110 transition-transform">
                                {emoji}
                            </span>
                        ) : (
                            <div className="w-6 h-6 rounded-[2px] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center shrink-0">
                                <FolderKanban className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                            </div>
                        )}
                        {href ? (
                            <Link
                                href={href}
                                className="font-heading text-sm font-semibold tracking-tight text-[var(--app-text)] group-hover:text-[var(--color-accent)] truncate transition-colors leading-snug"
                                title={title}
                            >
                                {title}
                            </Link>
                        ) : (
                            <span
                                className="font-heading text-sm font-semibold tracking-tight text-[var(--app-text)] group-hover:text-[var(--color-accent)] truncate transition-colors leading-snug"
                                title={title}
                            >
                                {title}
                            </span>
                        )}
                    </div>

                    {/* Context Action Menu */}
                    {(onEdit || (canArchive && onArchive)) && (
                        <div ref={menuRef} className="relative shrink-0">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsMenuOpen((prev) => !prev);
                                }}
                                className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                title="Project actions"
                            >
                                <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {isMenuOpen && (
                                <div
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    className="absolute right-0 top-full mt-1 z-30 min-w-[150px] bg-[var(--app-card)] border border-[var(--app-border-strong)] rounded-[3px] shadow-float py-1 text-xs select-none animate-fade-in whitespace-nowrap text-nowrap"
                                >
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                onEdit();
                                            }}
                                            className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors cursor-pointer whitespace-nowrap text-nowrap"
                                        >
                                            <Pencil className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                            <span className="whitespace-nowrap text-nowrap">Edit Project</span>
                                        </button>
                                    )}

                                    {canArchive && onArchive && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                onArchive();
                                            }}
                                            className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors cursor-pointer border-t border-[var(--app-border)] mt-0.5 pt-1.5 whitespace-nowrap text-nowrap"
                                        >
                                            <FolderArchive className="w-3.5 h-3.5 text-[var(--color-error)] shrink-0" />
                                            <span className="whitespace-nowrap text-nowrap">Archive Project</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Team Tag & Status Pill */}
                <div className="flex items-center justify-between gap-2 text-xs text-[var(--app-muted)]">
                    {teamName ? (
                        <span
                            className="flex items-center gap-1 font-medium text-[var(--app-muted)] truncate min-w-0"
                            title={`Team: ${teamName}`}
                        >
                            {teamEmoji ? (
                                <span className="emoji-font text-[10px] shrink-0">{teamEmoji}</span>
                            ) : (
                                <Building2 className="w-3 h-3 shrink-0 text-[var(--app-muted)]" />
                            )}
                            <span className="truncate">{teamName}</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 font-medium text-[var(--app-muted)]">
                            <FolderKanban className="w-3 h-3 shrink-0 text-[var(--app-muted)]" />
                            <span>Project</span>
                        </span>
                    )}

                    {/* Dynamic Status Pill */}
                    <span className={`inline-flex items-center gap-1 font-semibold shrink-0 ml-auto text-[11px] ${health.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
                        <span>{health.label}</span>
                    </span>
                </div>

                {/* 3. Description Snippet */}
                {descriptionPreview ? (
                    <p 
                        className="text-xs text-[var(--app-muted)] line-clamp-2 leading-relaxed break-words"
                        title={descriptionPreview}
                    >
                        {descriptionPreview}
                    </p>
                ) : (
                    <p className="text-xs text-[var(--app-muted)]/70 italic">
                        No description provided
                    </p>
                )}

                {/* 4. Timeline, Tasks Count & Assignees */}
                <div className="flex items-center justify-between text-[11px] text-[var(--app-muted)] gap-2 pt-0.5">
                    {dateRange ? (
                        <span
                            className="flex items-center gap-1.5 font-medium text-[var(--app-muted)] shrink-0 text-xs"
                            title={startDate && endDate && durationDays ? `Timeline: ${dateRange} (${formatDaySpan(durationDays)})` : dateRange}
                        >
                            <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                            <span className="truncate">{dateRange}</span>
                            {durationDays && (
                                <span className="font-medium text-[var(--app-text)] tabular-nums ml-0.5">
                                    • {durationDays}d
                                </span>
                            )}
                        </span>
                    ) : (
                        <span className="text-xs text-[var(--app-muted)] italic">No schedule set</span>
                    )}

                    <span className="text-[11px] text-[var(--app-muted)] font-medium tabular-nums shrink-0">
                        <strong className="font-semibold text-[var(--app-text)]">{completedTasks}</strong>/{totalTasks} tasks
                    </span>

                    {assignees.length > 0 && (
                        <div className="flex items-center -space-x-1.5 overflow-visible shrink-0 ml-auto" title={assignees.map((a) => a.name).join(", ")}>
                            {assignees.slice(0, 3).map((a, i) => (
                                <div key={a.id || i} className="relative ring-1.5 ring-[var(--app-card)] rounded-full hover:scale-110 hover:z-20 transition-transform shadow-xs shrink-0">
                                    <UserAvatar name={a.name} avatarUrl={a.avatarUrl} size="xs" showBorder={false} />
                                </div>
                            ))}
                            {assignees.length > 3 && (
                                <div className="w-4 h-4 rounded-full bg-[var(--app-bg)] border border-[var(--app-card)] flex items-center justify-center text-[7.5px] font-bold text-[var(--app-text)] shadow-xs z-10 shrink-0">
                                    +{assignees.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 5. Footer Actions: Reusable Themed Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--app-border)]">
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onViewDetails) onViewDetails();
                    }}
                    icon={<Info className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />}
                    className="w-full text-nowrap whitespace-nowrap"
                    title="View Project Overview & Details"
                >
                    View Details
                </Button>

                {href ? (
                    <Link
                        href={href}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full"
                        title="Open Project Workspace Board"
                    >
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon={<ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                            className="w-full text-nowrap whitespace-nowrap"
                        >
                            Open
                        </Button>
                    </Link>
                ) : (
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={onClick}
                        icon={<ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                        className="w-full text-nowrap whitespace-nowrap"
                        title="Open Project Workspace Board"
                    >
                        Open
                    </Button>
                )}
            </div>
        </div>
    );
}

export default ProjectCard;
