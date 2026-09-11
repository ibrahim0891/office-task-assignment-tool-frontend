"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Calendar, Building2, FolderKanban, MoreVertical, Pencil, FolderArchive } from "lucide-react";
import { UserAvatar } from "../ui/UserAvatar";
import { calculateRemainingDays, extractDateString, parseLocalDate, calculateDaySpan, formatDaySpan } from "../../utils/date";

import { calculateProjectHealth } from "../../utils/projectProgress";

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

    const [isExpanded, setIsExpanded] = useState(false);
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
    const cleanDesc = useMemo(() => {
        if (!description) return "";
        return description
            .replace(/<\/(p|li|h[1-6]|div)>/gi, "\n")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }, [description]);
    const isLongDesc = Boolean(cleanDesc && (cleanDesc.length > 85 || cleanDesc.includes("\n")));

    const cardContent = (
        <div
            onClick={onClick}
            className="group relative bg-[var(--app-card)] border border-[var(--app-border)] rounded-[var(--radius-card,6px)] p-4 flex flex-col justify-between gap-3.5 hover:border-[var(--app-border-strong)] hover:shadow-subtle transition-all duration-200 cursor-pointer text-left select-none"
        >
            {/* Top & Middle: Title, Meta (Team & Overdue status) and Description */}
            <div className="flex flex-col gap-2 min-w-0">
                {/* 1. Title Row */}
                <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                        {emoji && <span className="emoji-font text-base shrink-0 leading-none mt-0.5">{emoji}</span>}
                        <h3 className="text-sm sm:text-[14.5px] font-semibold text-[var(--app-text)] tracking-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 min-w-0 flex-1 leading-snug break-words" title={title}>
                            {title}
                        </h3>
                    </div>

                    {/* Ellipsis menu button */}
                    {onEdit && (
                        <div className="relative shrink-0 -mr-1 -mt-0.5" ref={menuRef}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsMenuOpen((prev) => !prev);
                                }}
                                className="p-1 rounded-[3px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors cursor-pointer"
                                title="Project actions"
                                aria-label="Project actions"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                                <div
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    className="absolute right-0 top-full mt-1 z-30 min-w-[140px] bg-[var(--app-card)] border border-[var(--app-border-strong)] rounded-[4px] shadow-float py-1 text-xs select-none"
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsMenuOpen(false);
                                            onEdit();
                                        }}
                                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors cursor-pointer"
                                    >
                                        <Pencil className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                        <span>Edit Project</span>
                                    </button>

                                    {canArchive && onArchive && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsMenuOpen(false);
                                                onArchive();
                                            }}
                                            className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors cursor-pointer border-t border-[var(--app-border)] mt-0.5 pt-1.5"
                                        >
                                            <FolderArchive className="w-3.5 h-3.5 text-[var(--color-error)]" />
                                            <span>Archive Project</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Team Name (Left) & Dynamic Status / Overdue (Right): Simple Minimal Text without background or shadows */}
                <div className="flex items-center justify-between gap-2 text-xs text-[var(--app-muted)]">
                    {teamName ? (
                        <span className="flex items-center gap-1 font-medium text-[var(--app-muted)] truncate min-w-0" title={`Team: ${teamName}`}>
                            {teamEmoji ? <span className="emoji-font text-[10px] shrink-0">{teamEmoji}</span> : <Building2 className="w-3 h-3 shrink-0 text-[var(--app-muted)]" />}
                            <span className="truncate">{teamName}</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 font-medium text-[var(--app-muted)]">
                            <FolderKanban className="w-3 h-3 shrink-0 text-[var(--app-muted)]" />
                            <span>Project</span>
                        </span>
                    )}

                    {/* Simple text dynamic status indicator on the right side */}
                    <span className={`inline-flex items-center gap-1 font-semibold shrink-0 ml-auto ${health.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
                        <span>{health.label}</span>
                    </span>
                </div>

                {/* 3. Description: fixed height with overflow scroll when expanded */}
                {cleanDesc ? (
                    isLongDesc ? (
                        <div className="text-xs text-[var(--app-muted)] leading-relaxed mt-0.5 break-words">
                            {isExpanded ? (
                                <div className="flex flex-col gap-1">
                                    <div
                                        className="h-[80px] overflow-y-auto pr-1 text-xs text-[var(--app-muted)] leading-relaxed break-words select-text [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        dangerouslySetInnerHTML={{ __html: description! }}
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsExpanded(false);
                                        }}
                                        className="text-[var(--color-accent)] font-medium hover:underline text-[11px] cursor-pointer self-start"
                                    >
                                        see less
                                    </button>
                                </div>
                            ) : (
                                <p className="line-clamp-2">
                                    <span>{cleanDesc.slice(0, 85).trim()}... </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsExpanded(true);
                                        }}
                                        className="text-[var(--color-accent)] font-semibold hover:underline text-[11px] cursor-pointer inline"
                                    >
                                        see more
                                    </button>
                                </p>
                            )}
                        </div>
                    ) : (
                        <p
                            className="text-xs text-[var(--app-muted)] leading-relaxed line-clamp-2 break-words mt-0.5"
                            dangerouslySetInnerHTML={{ __html: description! }}
                        />
                    )
                ) : (
                    <p className="text-xs italic text-[var(--app-muted)]/60 leading-relaxed line-clamp-2 mt-0.5">
                        No description provided
                    </p>
                )}
            </div>

            {/* Bottom: Date Range + Task Ratio (Left) & Avatar Stack (Right) */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[var(--app-border)] text-[11px] text-[var(--app-muted)]">
                <div className="flex items-center gap-2.5 min-w-0">
                    {dateRange && (
                        <span
                            className="flex items-center gap-1 font-medium bg-[var(--app-bg)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] shrink-0"
                            title={startDate && endDate && durationDays ? `Timeline: ${dateRange} (${formatDaySpan(durationDays)})` : dateRange}
                        >
                            <Calendar className="w-3 h-3 text-[var(--app-muted)] shrink-0" />
                            <span className="truncate">{dateRange}</span>
                            {durationDays && (
                                <span className="font-semibold text-[var(--app-text)] tabular-nums ml-0.5">
                                    • {durationDays}d
                                </span>
                            )}
                        </span>
                    )}
                    <span className="font-medium shrink-0">
                        <strong className="font-semibold text-[var(--app-text)] tabular-nums">{completedTasks}</strong>/{totalTasks} tasks
                    </span>
                </div>
                {assignees.length > 0 && (
                    <div className="flex items-center -space-x-1.5 overflow-visible shrink-0" title={assignees.map(a => a.name).join(", ")}>
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
    );

    return href ? <Link href={href} className="block group">{cardContent}</Link> : cardContent;
}

export default ProjectCard;
