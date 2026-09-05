"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
    Plus, 
    ArrowRight, 
    Folder, 
    Mail, 
    LayoutGrid, 
    List, 
    FolderKanban, 
    Building2, 
    Search, 
    X, 
    Calendar, 
    AlertCircle, 
    Users, 
    TrendingUp,
    CheckCircle2
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import CreateProjectModal from "./CreateProjectModal";
import ManageFoldersTray from "../ManageFoldersTray";
import ProjectInvitationsTray from "./ProjectInvitationsTray";
import { usePortfolioSummary } from "../../hooks/useProjectSWR";
import { UserAvatar } from "../ui/UserAvatar";
import { CustomSelect } from "../ui/CustomSelect";
import { calculateProjectProgress } from "../../utils/projectProgress";
import { calculateDaySpan, formatDaySpan } from "../../utils/date";

function getStatusConfig(status: string) {
    switch (status) {
        case "ON_TRACK":
        case "OnTrack":
            return { 
                label: "On Track", 
                color: "text-[var(--status-on-track,#16A34A)]", 
                bg: "bg-[var(--status-on-track,#16A34A)]/10", 
                border: "border-[var(--status-on-track,#16A34A)]/20", 
                dot: "bg-[var(--status-on-track,#16A34A)]" 
            };
        case "AT_RISK":
        case "AtRisk":
            return { 
                label: "At Risk", 
                color: "text-[var(--status-at-risk,#D97706)]", 
                bg: "bg-[var(--status-at-risk,#D97706)]/10", 
                border: "border-[var(--status-at-risk,#D97706)]/20", 
                dot: "bg-[var(--status-at-risk,#D97706)]" 
            };
        case "ACTIVE":
        case "Active":
            return { 
                label: "Active", 
                color: "text-[var(--status-active,#0284C7)]", 
                bg: "bg-[var(--status-active,#0284C7)]/10", 
                border: "border-[var(--status-active,#0284C7)]/20", 
                dot: "bg-[var(--status-active,#0284C7)]" 
            };
        case "COMPLETED":
        case "Completed":
            return { 
                label: "Completed", 
                color: "text-[var(--status-completed,#15803D)]", 
                bg: "bg-[var(--status-completed,#15803D)]/10", 
                border: "border-[var(--status-completed,#15803D)]/20", 
                dot: "bg-[var(--status-completed,#15803D)]" 
            };
        case "ARCHIVED":
        case "Archived":
            return { 
                label: "Archived", 
                color: "text-[var(--status-archived,#6B7280)]", 
                bg: "bg-[var(--status-archived,#6B7280)]/10", 
                border: "border-[var(--status-archived,#6B7280)]/20", 
                dot: "bg-[var(--status-archived,#6B7280)]" 
            };
        default:
            return { 
                label: status || "Active", 
                color: "text-[var(--status-active,#0284C7)]", 
                bg: "bg-[var(--status-active,#0284C7)]/10", 
                border: "border-[var(--status-active,#0284C7)]/20", 
                dot: "bg-[var(--status-active,#0284C7)]" 
            };
    }
}

function formatDate(dateInput: any) {
    if (!dateInput) return "";
    try {
        const d = new Date(dateInput);
        return d.toISOString().split("T")[0];
    } catch {
        return "";
    }
}

function ProjectCardSkeleton() {
    return (
        <div className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[4px] p-4.5 flex flex-col gap-3.5 animate-pulse">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-[4px] bg-[var(--app-border)]/60 shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="h-3.5 w-3/4 bg-[var(--app-border)]/70 rounded-[2px]" />
                        <div className="h-2.5 w-1/3 bg-[var(--app-border)]/40 rounded-[2px]" />
                    </div>
                </div>
                <div className="w-14 h-4 bg-[var(--app-border)]/50 rounded-[2px]" />
            </div>
            <div className="h-3 w-full bg-[var(--app-border)]/30 rounded-[2px]" />
            <div className="h-3 w-4/5 bg-[var(--app-border)]/30 rounded-[2px]" />
            <div className="h-6 w-full bg-[var(--app-bg)] rounded-[2px] border border-[var(--app-border)]/40" />
            <div className="h-1.5 w-full bg-[var(--app-border)]/50 rounded-full" />
            <div className="pt-2 border-t border-[var(--app-border)] flex items-center justify-between">
                <div className="h-3 w-20 bg-[var(--app-border)]/40 rounded-[2px]" />
                <div className="h-3 w-12 bg-[var(--app-border)]/40 rounded-[2px]" />
            </div>
        </div>
    );
}

function ProjectRowSkeleton() {
    return (
        <tr className="border-b border-[var(--app-border)] animate-pulse">
            <td className="py-3.5 px-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[3px] bg-[var(--app-border)]/60 shrink-0" />
                    <div className="flex flex-col gap-1 flex-1">
                        <div className="h-3 w-40 bg-[var(--app-border)]/70 rounded-[2px]" />
                        <div className="h-2 w-24 bg-[var(--app-border)]/40 rounded-[2px]" />
                    </div>
                </div>
            </td>
            <td className="py-3.5 px-4"><div className="w-16 h-4 bg-[var(--app-border)]/50 rounded-[2px]" /></td>
            <td className="py-3.5 px-4"><div className="w-24 h-4 bg-[var(--app-border)]/40 rounded-[2px]" /></td>
            <td className="py-3.5 px-4"><div className="w-28 h-4 bg-[var(--app-border)]/40 rounded-[2px]" /></td>
            <td className="py-3.5 px-4"><div className="w-32 h-4 bg-[var(--app-border)]/50 rounded-[2px]" /></td>
            <td className="py-3.5 px-4"><div className="w-16 h-4 bg-[var(--app-border)]/40 rounded-[2px]" /></td>
            <td className="py-3.5 px-4 text-right"><div className="w-12 h-5 bg-[var(--app-border)]/50 rounded-[2px] ml-auto" /></td>
        </tr>
    );
}

function ProjectCard({ project }: { project: any }) {
    const totalTasks = project.totalTasks !== undefined ? project.totalTasks : (project.tasks?.length || 0);
    const doneTasks = project.doneTasks !== undefined ? project.doneTasks : (project.tasks?.filter((t: any) => t.column?.isComplete || t.status === "Completed" || t.status === "Done").length || 0);
    const overdueTasks = project.overdueTasks !== undefined ? project.overdueTasks : (project.tasks?.filter((t: any) => t.riskLevel === "OVERDUE" || t.riskLevel === "CRITICAL_SLA" || t.riskLevel === "Overdue" || t.riskLevel === "CriticalSLA").length || 0);
    
    // Aggregate unique project members and manager for the avatar group
    const allMembers = useMemo(() => {
        const list: { id: string; name: string; avatarUrl?: string | null; role?: string }[] = [];
        const seen = new Set<string>();

        if (project.manager) {
            const mId = project.manager.id || project.manager.userId || "manager";
            seen.add(mId);
            list.push({
                id: mId,
                name: project.manager.name || "Manager",
                avatarUrl: project.manager.avatarUrl,
                role: "Manager",
            });
        }

        (project.members || []).forEach((m: any) => {
            const u = m.user || m;
            const id = u.id || m.userId || m.id;
            if (id && !seen.has(id)) {
                seen.add(id);
                list.push({
                    id,
                    name: u.name || u.fullName || "Member",
                    avatarUrl: u.avatarUrl,
                    role: m.role || "Member",
                });
            }
        });

        return list;
    }, [project.manager, project.members]);

    const calculatedProgress = Array.isArray(project.tasks) && project.tasks.length > 0
        ? calculateProjectProgress(project.tasks, project.columns)
        : (project.progress !== undefined ? project.progress : 0);

    const titleLength = (project.title || "").length;
    const titleSizeClass = titleLength <= 22
        ? "text-[20px] sm:text-[22px]"
        : titleLength <= 42
        ? "text-[18px] sm:text-[20px]"
        : "text-[16px] sm:text-[18px]";

    return (
        <Link href={`/projects/${project.id}`} className="block group">
            <div className="relative bg-[var(--app-card)] border border-[var(--app-border)] rounded-[6px] p-5 flex flex-col justify-between gap-4 hover:border-[var(--app-border-strong)] hover:shadow-subtle transition-all duration-200 cursor-pointer min-h-[240px]">
                {/* Card Top: Identity */}
                <div className="flex items-center gap-3">
                    {/* Emoji / Icon Container */}
                    <div className="w-10 h-10 rounded-[6px] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        {project.emoji ? (
                            <span className="emoji-font leading-none">{project.emoji}</span>
                        ) : (
                            <FolderKanban className="w-5 h-5 text-[var(--app-muted)]" />
                        )}
                    </div>

                    {/* Title */}
                    <h3 className={`font-heading ${titleSizeClass} font-bold text-[var(--app-text)] tracking-tight group-hover:text-[var(--color-accent)] transition-colors truncate min-w-0 flex-1`} title={project.title}>
                        {project.title}
                    </h3>
                </div>

                {/* Timeline Date (Minimal, No BG, No Border - Swapped to Below Title) */}
                {(project.startDate || project.endDate) && (
                    <div
                        className="flex items-center gap-1.5 text-xs text-[var(--app-muted)] -mt-1.5 font-medium"
                        title={project.startDate && project.endDate ? `Timeline: ${formatDate(project.startDate)} – ${formatDate(project.endDate)} (${formatDaySpan(calculateDaySpan(project.startDate, project.endDate))})` : undefined}
                    >
                        <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                        <span>{formatDate(project.startDate) || "—"}</span>
                        <span className="text-[var(--app-muted)]/70">→</span>
                        <span>{formatDate(project.endDate) || "—"}</span>
                        {project.startDate && project.endDate && (
                            <span className="ml-0.5">
                                • {calculateDaySpan(project.startDate, project.endDate)}d
                            </span>
                        )}
                    </div>
                )}

                {/* Metadata Row: Member Avatars Group & Owning Team Badge */}
                <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                    {/* Member Group Avatar Stack in reduced size */}
                    <div className="flex items-center gap-2 min-w-0">
                        {allMembers.length > 0 ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center -space-x-2 overflow-visible">
                                    {allMembers.slice(0, 4).map((member, idx) => (
                                        <div
                                            key={member.id || idx}
                                            className="relative ring-2 ring-[var(--app-card)] rounded-full hover:scale-110 hover:z-20 transition-transform shadow-xs shrink-0"
                                            title={`${member.name}${member.role ? ` (${member.role})` : ""}`}
                                        >
                                            <UserAvatar
                                                name={member.name}
                                                avatarUrl={member.avatarUrl}
                                                size="md"
                                                showBorder={false}
                                            />
                                        </div>
                                    ))}
                                    {allMembers.length > 4 && (
                                        <div
                                            className="w-6 h-6 rounded-full bg-[var(--app-bg)] border-2 border-[var(--app-card)] flex items-center justify-center text-[9px] font-bold text-[var(--app-text)] shadow-xs z-10 shrink-0"
                                            title={`+${allMembers.length - 4} more members`}
                                        >
                                            +{allMembers.length - 4}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-semibold text-[var(--app-text)] truncate max-w-[120px]" title={allMembers.map(m => m.name).join(", ")}>
                                    {allMembers.length === 1
                                        ? allMembers[0].name.split(" ")[0]
                                        : `${allMembers.length} members`}
                                </span>
                            </div>
                        ) : (
                            <span className="text-xs text-[var(--app-muted)] italic">No members</span>
                        )}
                    </div>

                    {/* Owning Team Badge (Swapped to Right Side) */}
                    {project.team && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] px-2 py-0.5 rounded-[3px] border border-[var(--app-border)] flex items-center gap-1.5 w-fit max-w-full truncate" title={`Owning Team: ${project.team.name}`}>
                                {project.team.emoji ? (
                                    <span className="emoji-font text-[10px] shrink-0">{project.team.emoji}</span>
                                ) : (
                                    <Building2 className="w-3 h-3 shrink-0 text-[var(--app-muted)]" />
                                )}
                                <span className="truncate max-w-[130px]">{project.team.name}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Progress Bar Section (Moved Up) */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs sm:text-[13px]">
                        <span className="text-[var(--app-muted)] font-semibold">Progress</span>
                        <span className="font-bold text-sm text-[var(--app-text)] tabular-nums">
                            {calculatedProgress}%
                        </span>
                    </div>
                    <div className="w-full h-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--app-text)] transition-all duration-300 rounded-full"
                            style={{ width: `${calculatedProgress}%` }}
                        />
                    </div>
                </div>

                {/* Description (Moved Down & HTML Parsed, Clamped to 2 lines) */}
                {project.description ? (
                    <div
                        className="text-[13px] text-[var(--app-text)]/85 leading-relaxed line-clamp-2 min-h-[40px] break-words [&_p]:inline [&_p]:m-0 [&_div]:inline [&_div]:m-0 [&_span]:inline"
                        dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                ) : (
                    <p className="text-[13px] italic text-[var(--app-muted)] leading-relaxed line-clamp-2 min-h-[40px]">
                        No description provided
                    </p>
                )}

                {/* Card Footer: Tasks, Members & Overdue Tag */}
                <div className="flex items-center justify-between pt-3.5 border-t border-[var(--app-border)] text-xs sm:text-[13px]">
                    <div className="flex items-center gap-4">
                        <span className="text-[var(--app-muted)] flex items-center gap-1 font-medium">
                            <span className="font-bold text-sm text-[var(--app-text)] tabular-nums">{doneTasks}</span>
                            <span className="opacity-70">/{totalTasks}</span> tasks
                        </span>
                        <span className="text-[var(--app-muted)] flex items-center gap-1.5 font-medium">
                            <Users className="w-4 h-4 text-[var(--app-muted)]" />
                            <span className="font-bold text-sm text-[var(--app-text)] tabular-nums">{project.members?.length || 0}</span>
                            <span>members</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {overdueTasks > 0 && (
                            <span className="text-xs font-semibold text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-2.5 py-1 rounded-[4px] flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{overdueTasks} overdue</span>
                            </span>
                        )}
                        <span className="text-xs sm:text-[13px] text-[var(--app-text)] group-hover:text-[var(--color-accent)] flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-all">
                            <span>Open</span>
                            <ArrowRight className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function ProjectListItem({ project }: { project: any }) {
    const status = getStatusConfig(project.status);
    const totalTasks = project.totalTasks !== undefined ? project.totalTasks : (project.tasks?.length || 0);
    const doneTasks = project.doneTasks !== undefined ? project.doneTasks : (project.tasks?.filter((t: any) => t.column?.isComplete || t.status === "Completed" || t.status === "Done").length || 0);
    const overdueTasks = project.overdueTasks !== undefined ? project.overdueTasks : (project.tasks?.filter((t: any) => t.riskLevel === "OVERDUE" || t.riskLevel === "CRITICAL_SLA" || t.riskLevel === "Overdue" || t.riskLevel === "CriticalSLA").length || 0);
    
    const allMembers = useMemo(() => {
        const list: { id: string; name: string; avatarUrl?: string | null; role?: string }[] = [];
        const seen = new Set<string>();

        if (project.manager) {
            const mId = project.manager.id || project.manager.userId || "manager";
            seen.add(mId);
            list.push({
                id: mId,
                name: project.manager.name || "Manager",
                avatarUrl: project.manager.avatarUrl,
                role: "Manager",
            });
        }

        (project.members || []).forEach((m: any) => {
            const u = m.user || m;
            const id = u.id || m.userId || m.id;
            if (id && !seen.has(id)) {
                seen.add(id);
                list.push({
                    id,
                    name: u.name || u.fullName || "Member",
                    avatarUrl: u.avatarUrl,
                    role: m.role || "Member",
                });
            }
        });

        return list;
    }, [project.manager, project.members]);

    const calculatedProgress = Array.isArray(project.tasks) && project.tasks.length > 0
        ? calculateProjectProgress(project.tasks, project.columns)
        : (project.progress !== undefined ? project.progress : 0);

    return (
        <tr className="group border-b border-[var(--app-border)] hover:bg-[var(--app-hover-bg)] transition-colors text-xs sm:text-[13px]">
            {/* Project & Owning Team */}
            <td className="py-4 px-4 min-w-[260px]">
                <Link href={`/projects/${project.id}`} className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[4px] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-lg shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        {project.emoji ? (
                            <span className="emoji-font leading-none">{project.emoji}</span>
                        ) : (
                            <FolderKanban className="w-4.5 h-4.5 text-[var(--app-muted)]" />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-heading font-bold text-[16px] text-[var(--app-text)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                            {project.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {project.team && (
                                <span className="text-[11px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] px-2 py-0.5 rounded-[3px] border border-[var(--app-border)] flex items-center gap-1 shrink-0" title={`Owning Team: ${project.team.name}`}>
                                    {project.team.emoji ? (
                                        <span className="emoji-font text-[10px] shrink-0">{project.team.emoji}</span>
                                    ) : (
                                        <Building2 className="w-3 h-3 shrink-0 text-[var(--app-muted)]" />
                                    )}
                                    <span className="truncate max-w-[130px]">{project.team.name}</span>
                                </span>
                            )}
                            {project.description && (
                                <span
                                    className="text-[13px] text-[var(--app-text)]/80 line-clamp-1 max-w-[240px] [&_p]:inline [&_p]:m-0 [&_div]:inline"
                                    dangerouslySetInnerHTML={{ __html: project.description }}
                                />
                            )}
                        </div>
                    </div>
                </Link>
            </td>

            {/* Status */}
            <td className="py-4 px-4 whitespace-nowrap">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-[3px] border inline-flex items-center gap-1.5 ${status.color} ${status.bg} ${status.border}`}>
                    <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                    {status.label}
                </span>
            </td>

            {/* Members Group Avatars */}
            <td className="py-4 px-4 whitespace-nowrap">
                <div className="flex items-center gap-2" title={allMembers.map(m => m.name).join(", ")}>
                    {allMembers.length > 0 ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-2 overflow-visible">
                                {allMembers.slice(0, 3).map((member, idx) => (
                                    <div
                                        key={member.id || idx}
                                        className="relative ring-2 ring-[var(--app-card)] rounded-full hover:scale-110 hover:z-20 transition-transform shadow-xs shrink-0"
                                        title={`${member.name}${member.role ? ` (${member.role})` : ""}`}
                                    >
                                        <UserAvatar
                                            name={member.name}
                                            avatarUrl={member.avatarUrl}
                                            size="md"
                                            showBorder={false}
                                        />
                                    </div>
                                ))}
                                {allMembers.length > 3 && (
                                    <div
                                        className="w-6 h-6 rounded-full bg-[var(--app-bg)] border-2 border-[var(--app-card)] flex items-center justify-center text-[9px] font-bold text-[var(--app-text)] shadow-xs z-10 shrink-0"
                                        title={`+${allMembers.length - 3} more members`}
                                    >
                                        +{allMembers.length - 3}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-semibold text-[var(--app-text)] truncate max-w-[100px]">
                                {allMembers.length === 1
                                    ? allMembers[0].name.split(" ")[0]
                                    : `${allMembers.length} members`}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs text-[var(--app-muted)] italic">—</span>
                    )}
                </div>
            </td>

            {/* Timeline & Span */}
            <td className="py-4 px-4 whitespace-nowrap text-xs text-[var(--app-text)]">
                {(project.startDate || project.endDate) ? (
                    <div
                        className="flex items-center gap-1.5 bg-[var(--app-bg)] px-2.5 py-1 rounded-[3px] border border-[var(--app-border)] w-fit font-medium"
                        title={project.startDate && project.endDate ? `Timeline: ${formatDate(project.startDate)} – ${formatDate(project.endDate)} (${formatDaySpan(calculateDaySpan(project.startDate, project.endDate))})` : undefined}
                    >
                        <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                        <span>{formatDate(project.startDate) || "—"}</span>
                        <span>→</span>
                        <span>{formatDate(project.endDate) || "—"}</span>
                        {project.startDate && project.endDate && (
                            <span className="font-bold text-[var(--app-text)] ml-0.5">
                                • {calculateDaySpan(project.startDate, project.endDate)}d
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-[var(--app-muted)]">—</span>
                )}
            </td>

            {/* Progress & Tasks */}
            <td className="py-4 px-4 min-w-[190px]">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--app-muted)]">
                            <span className="font-bold text-[var(--app-text)] tabular-nums">{doneTasks}</span>
                            <span className="opacity-70">/{totalTasks}</span> tasks
                        </span>
                        <span className="font-bold text-sm text-[var(--app-text)] tabular-nums">
                            {calculatedProgress}%
                        </span>
                    </div>
                    <div className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] h-2.5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--app-text)] transition-all duration-300 rounded-full"
                            style={{ width: `${calculatedProgress}%` }}
                        />
                    </div>
                </div>
            </td>

            {/* Members / Overdue */}
            <td className="py-4 px-4 whitespace-nowrap text-xs text-[var(--app-muted)]">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[var(--app-muted)]" />
                        <span className="font-bold text-sm text-[var(--app-text)] tabular-nums">{project.members?.length || 0}</span>
                    </span>
                    {overdueTasks > 0 && (
                        <span className="text-[11px] font-semibold text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-2.5 py-0.5 rounded-[3px]">
                            {overdueTasks} overdue
                        </span>
                    )}
                </div>
            </td>

            {/* Action */}
            <td className="py-4 px-4 text-right whitespace-nowrap">
                <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] hover:text-[var(--color-accent)] text-xs font-semibold rounded-[3px] transition-colors"
                >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </td>
        </tr>
    );
}

export default function ProjectsPortfolio() {
    const { 
        projects, 
        isProjectsLoading, 
        loadProjects,
        userRole, 
        currentTeam, 
        currentUser, 
        folders, 
        isManageFoldersOpen, 
        setIsManageFoldersOpen,
        projectInvitations,
        isManageInvitationsOpen,
        setIsManageInvitationsOpen 
    } = useWorkspace();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const { summary, isLoading: isSummaryLoading } = usePortfolioSummary(currentTeam?.id, currentUser?.id);
    
    // Filter & Search states
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFolderId, setActiveFolderId] = useState<string>("ALL");
    const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<string>("recent");

    // Initialize preferred viewMode from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("projects_portfolio_view_mode");
            if (saved === "list" || saved === "grid") {
                setViewMode(saved);
            }
        } catch (e) {}
    }, []);

    const handleViewModeChange = (mode: "grid" | "list") => {
        setViewMode(mode);
        try {
            localStorage.setItem("projects_portfolio_view_mode", mode);
        } catch (e) {}
    };

    // Extract unique teams represented in user assigned projects
    const uniqueTeams = useMemo(() => {
        const map = new Map<string, { id: string; name: string; emoji: string }>();
        projects.forEach((p) => {
            if (p.team && !map.has(p.team.id)) {
                map.set(p.team.id, p.team);
            }
        });
        return Array.from(map.values());
    }, [projects]);

    const foldersWithProjects = folders.filter((folder) =>
        projects.some((p) => p.folderId === folder.id)
    );

    const isLeader = userRole === "LEADER";

    // Filter & Sort projects
    const filteredProjects = useMemo(() => {
        return projects
            .filter((p) => {
                // Team Filter
                if (selectedTeamFilter !== "ALL" && p.teamId !== selectedTeamFilter && p.team?.id !== selectedTeamFilter) {
                    return false;
                }
                // Folder Filter
                if (activeFolderId !== "ALL" && p.folderId !== activeFolderId) {
                    return false;
                }
                // Status Filter
                if (statusFilter !== "ALL") {
                    const statusUpper = (p.status || "").toUpperCase();
                    if (statusFilter === "ACTIVE" && statusUpper !== "ACTIVE") return false;
                    if (statusFilter === "ON_TRACK" && statusUpper !== "ON_TRACK" && statusUpper !== "ONTRACK") return false;
                    if (statusFilter === "AT_RISK" && statusUpper !== "AT_RISK" && statusUpper !== "ATRISK") return false;
                    if (statusFilter === "COMPLETED" && statusUpper !== "COMPLETED") return false;
                    if (statusFilter === "ARCHIVED" && statusUpper !== "ARCHIVED") return false;
                }
                // Search Query Filter (Title, Description, Team, Manager)
                if (searchQuery.trim()) {
                    const query = searchQuery.toLowerCase().trim();
                    const titleMatch = (p.title || "").toLowerCase().includes(query);
                    const descMatch = (p.description || "").toLowerCase().includes(query);
                    const teamMatch = (p.team?.name || "").toLowerCase().includes(query);
                    const managerMatch = (p.manager?.name || "").toLowerCase().includes(query);
                    if (!titleMatch && !descMatch && !teamMatch && !managerMatch) {
                        return false;
                    }
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === "title") {
                    return (a.title || "").localeCompare(b.title || "");
                }
                if (sortBy === "progress") {
                    const progA = a.progress || 0;
                    const progB = b.progress || 0;
                    return progB - progA;
                }
                if (sortBy === "dueDate") {
                    const dateA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
                    const dateB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
                    return dateA - dateB;
                }
                // Default: Recent / Created / ID
                return (b.id || "").localeCompare(a.id || "");
            });
    }, [projects, selectedTeamFilter, activeFolderId, statusFilter, searchQuery, sortBy]);

    const hasActiveFilters = searchQuery.trim() !== "" || activeFolderId !== "ALL" || selectedTeamFilter !== "ALL" || statusFilter !== "ALL";

    const handleClearFilters = () => {
        setSearchQuery("");
        setActiveFolderId("ALL");
        setSelectedTeamFilter("ALL");
        setStatusFilter("ALL");
        setSortBy("recent");
    };

    return (
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col gap-6 select-none">
                
                {/* 1. Header & Primary Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight text-[var(--app-text)]">
                            Projects
                        </h1>
                        <p className="text-xs text-[var(--app-muted)] mt-0.5">
                            Portfolio overview across all assigned workspace projects
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* View Switcher: Grid vs List */}
                        <div className="flex items-center bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] p-0.5 text-[10px] font-medium shrink-0">
                            <button
                                type="button"
                                onClick={() => handleViewModeChange("grid")}
                                className={`p-1.5 rounded-[1px] transition-colors cursor-pointer flex items-center justify-center ${
                                    viewMode === "grid"
                                        ? "bg-[var(--app-bg)] text-[var(--app-text)] shadow-xs border border-[var(--app-border-strong)]"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                                }`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleViewModeChange("list")}
                                className={`p-1.5 rounded-[1px] transition-colors cursor-pointer flex items-center justify-center ${
                                    viewMode === "list"
                                        ? "bg-[var(--app-bg)] text-[var(--app-text)] shadow-xs border border-[var(--app-border-strong)]"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                                }`}
                                title="List View"
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Invitations Button */}
                        <button
                            type="button"
                            onClick={() => setIsManageInvitationsOpen(!isManageInvitationsOpen)}
                            className={`relative corner-brackets-4 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border ${
                                isManageInvitationsOpen
                                    ? "border-[var(--app-border-strong)] bg-[var(--app-hover-bg)] text-[var(--app-text)] font-semibold"
                                    : "border-[var(--app-border)] text-[var(--app-text)]"
                            } text-[11px] font-medium px-3 py-1.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs`}
                        >
                            <Mail className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                            <span>Invitations</span>
                            {projectInvitations.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-[2px] text-[9px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold tabular-nums">
                                    {projectInvitations.length}
                                </span>
                            )}
                        </button>

                        {/* Manage Folders (Leader Only) */}
                        {isLeader && !isManageFoldersOpen && (
                            <button
                                type="button"
                                onClick={() => setIsManageFoldersOpen(true)}
                                className="relative corner-brackets-4 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] text-[11px] font-medium px-3 py-1.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                            >
                                <Folder className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                <span>Manage Folders</span>
                            </button>
                        )}

                        {/* Primary Action Button: New Project */}
                        {isLeader && (
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(true)}
                                className="relative corner-brackets-4 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] text-[11px] font-semibold px-3.5 py-1.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                            >
                                <Plus className="w-3.5 h-3.5 text-[var(--app-text)]" />
                                <span>New Project</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Pending Invitations Alert Banner */}
                {projectInvitations.length > 0 && (
                    <div
                        onClick={() => setIsManageInvitationsOpen(true)}
                        className="border border-[var(--app-border)] hover:border-[var(--app-border-strong)] bg-[var(--app-card)] rounded-[4px] p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors shadow-subtle"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-full bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-text)] shrink-0">
                                <Mail className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs text-[var(--app-text)] font-semibold truncate">
                                    You have {projectInvitations.length} pending project invitation{projectInvitations.length > 1 ? 's' : ''} awaiting response
                                </p>
                                <p className="text-[10.5px] text-[var(--app-muted)] mt-0.5">
                                    Click here to review project details, assigned roles, and accept or decline.
                                </p>
                            </div>
                        </div>
                        <span className="text-[11px] text-[var(--app-text)] font-semibold flex items-center gap-1 shrink-0 hover:underline">
                            Open Invitations →
                        </span>
                    </div>
                )}

                {/* 3. Hero KPI Metrics Bar */}
                <div className="corner-brackets grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--app-border)] border border-[var(--app-border)] rounded-[3px] overflow-hidden shadow-2xs">
                    <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                        <span className="eyebrow flex items-center justify-between">
                            <span>Active Projects</span>
                            <FolderKanban className="w-3.5 h-3.5 text-[var(--app-muted)] opacity-60" />
                        </span>
                        <span className="text-2xl lg:text-3xl font-heading font-medium tracking-tight text-[var(--app-text)] tabular-nums">
                            {summary.activeProjects}
                        </span>
                    </div>

                    <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                        <span className="eyebrow flex items-center justify-between">
                            <span>On-Time Rate</span>
                            <TrendingUp className="w-3.5 h-3.5 text-[var(--app-muted)] opacity-60" />
                        </span>
                        <span className={`text-2xl lg:text-3xl font-heading font-medium tracking-tight tabular-nums ${
                            summary.onTimeRate < 50
                                ? "text-[var(--color-error)]"
                                : summary.onTimeRate < 80
                                ? "text-[var(--color-warning)]"
                                : "text-[var(--color-success)]"
                        }`}>
                            {summary.onTimeRate}%
                        </span>
                    </div>

                    <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                        <span className="eyebrow flex items-center justify-between">
                            <span>Overdue Tasks</span>
                            <AlertCircle className="w-3.5 h-3.5 text-[var(--app-muted)] opacity-60" />
                        </span>
                        <span className={`text-2xl lg:text-3xl font-heading font-medium tracking-tight tabular-nums ${
                            summary.criticalSLABreaches > 0 ? "text-[var(--color-error)]" : "text-[var(--app-text)]"
                        }`}>
                            {summary.criticalSLABreaches}
                        </span>
                    </div>

                    <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                        <span className="eyebrow flex items-center justify-between">
                            <span>Total Projects</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--app-muted)] opacity-60" />
                        </span>
                        <span className="text-2xl lg:text-3xl font-heading font-medium tracking-tight text-[var(--app-text)] tabular-nums">
                            {summary.totalProjects}
                        </span>
                    </div>
                </div>

                {/* 4. Search, Filter & Navigation Controls */}
                <div className="flex flex-col gap-3">
                    {/* Top Row: Search Input + Status Filter + Sort + Team Filter */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[220px] max-w-md">
                            <Search className="w-3.5 h-3.5 text-[var(--app-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects by title, description, team..."
                                className="w-full bg-[var(--app-card)] border border-[var(--app-border)] focus:border-[var(--app-border-strong)] focus:outline-none text-[11.5px] text-[var(--app-text)] placeholder-[var(--app-muted)] pl-8 pr-7 py-1.5 rounded-[2px] transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* Controls Group */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px]">
                            {/* Status Filter */}
                            <CustomSelect
                                options={[
                                    { value: "ALL", label: "All Statuses" },
                                    { value: "ACTIVE", label: "Active" },
                                    { value: "ON_TRACK", label: "On Track" },
                                    { value: "AT_RISK", label: "At Risk" },
                                    { value: "COMPLETED", label: "Completed" },
                                    { value: "ARCHIVED", label: "Archived" },
                                ]}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                buttonClassName="corner-brackets-4 text-[10.5px] h-[28px] !py-0 px-2.5 bg-[var(--app-card)]"
                                className="w-32 h-[28px] shrink-0"
                            />

                            {/* Sort Selector */}
                            <CustomSelect
                                options={[
                                    { value: "recent", label: "Sort: Recent" },
                                    { value: "dueDate", label: "Sort: Due Date" },
                                    { value: "progress", label: "Sort: Progress" },
                                    { value: "title", label: "Sort: Title" },
                                ]}
                                value={sortBy}
                                onChange={setSortBy}
                                buttonClassName="corner-brackets-4 text-[10.5px] h-[28px] !py-0 px-2.5 bg-[var(--app-card)]"
                                className="w-34 h-[28px] shrink-0"
                            />

                            {/* Cross-Team Filter (if >1 team exists) */}
                            {uniqueTeams.length > 1 && (
                                <CustomSelect
                                    options={[
                                        { value: "ALL", label: `All Teams (${projects.length})` },
                                        ...uniqueTeams.map((t) => ({
                                            value: t.id,
                                            label: `${t.emoji || "🏢"} ${t.name}`,
                                            sublabel: `${projects.filter((p) => p.teamId === t.id || p.team?.id === t.id).length}`,
                                        })),
                                    ]}
                                    value={selectedTeamFilter}
                                    onChange={setSelectedTeamFilter}
                                    buttonClassName="corner-brackets-4 text-[10.5px] h-[28px] !py-0 px-2.5 bg-[var(--app-card)]"
                                    className="w-38 h-[28px] shrink-0"
                                />
                            )}

                            {/* Reset Filter Button */}
                            {hasActiveFilters && (
                                <button
                                    onClick={handleClearFilters}
                                    className="text-[10px] text-[var(--app-muted)] hover:text-[var(--app-text)] underline cursor-pointer px-1 py-1"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row: Folder Tabs */}
                    <div className="border-b border-[var(--app-border)] flex items-center justify-between gap-3 overflow-x-auto scrollbar-none pb-0.5">
                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* All Folders Tab */}
                            <button
                                onClick={() => setActiveFolderId("ALL")}
                                className={`py-1.5 px-3 flex items-center gap-1.5 text-[11.5px] font-medium border-b-2 transition-colors cursor-pointer ${
                                    activeFolderId === "ALL"
                                        ? "border-[var(--app-text)] text-[var(--app-text)] font-semibold"
                                        : "border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                }`}
                            >
                                <span>All Folders</span>
                                <span className={`px-1.5 py-0.2 rounded-[2px] text-[9.5px] tabular-nums border transition-colors ${
                                    activeFolderId === "ALL"
                                        ? "bg-[var(--app-card)] border-[var(--app-border-strong)] text-[var(--app-text)] font-semibold"
                                        : "bg-[var(--app-bg)] border-[var(--app-border)] text-[var(--app-muted)] font-medium"
                                }`}>
                                    {projects.length}
                                </span>
                            </button>

                            {/* Custom Folder Tabs */}
                            {foldersWithProjects.map((folder) => {
                                const isSelected = activeFolderId === folder.id;
                                const folderProjects = projects.filter((p) => p.folderId === folder.id);
                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => setActiveFolderId(folder.id)}
                                        className={`py-1.5 px-3 flex items-center gap-1.5 text-[11.5px] font-medium border-b-2 transition-colors cursor-pointer ${
                                            isSelected
                                                ? "border-[var(--app-text)] text-[var(--app-text)] font-semibold"
                                                : "border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                        }`}
                                    >
                                        {folder.emoji ? (
                                            <span className="emoji-font text-xs">{folder.emoji}</span>
                                        ) : (
                                            <Folder className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                        )}
                                        <span>{folder.name}</span>
                                        <span className={`px-1.5 py-0.2 rounded-[2px] text-[9.5px] tabular-nums border transition-colors ${
                                            isSelected
                                                ? "bg-[var(--app-card)] border-[var(--app-border-strong)] text-[var(--app-text)] font-semibold"
                                                : "bg-[var(--app-bg)] border-[var(--app-border)] text-[var(--app-muted)] font-medium"
                                        }`}>
                                            {folderProjects.length}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Result Counter */}
                        <span className="text-[10px] text-[var(--app-muted)] shrink-0 hidden sm:inline">
                            Showing <span className="font-semibold text-[var(--app-text)]">{filteredProjects.length}</span> of {projects.length} projects
                        </span>
                    </div>
                </div>

                {/* 5. Main Content: Grid View or List / Table View */}
                <div className="flex flex-col gap-4">
                    {isProjectsLoading ? (
                        viewMode === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <ProjectCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="border border-[var(--app-border)] rounded-[3px] bg-[var(--app-card)] overflow-hidden shadow-xs">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)] text-[10px] font-medium text-[var(--app-muted)]">
                                            <th className="py-2.5 px-4 font-semibold">Project & Team</th>
                                            <th className="py-2.5 px-4 font-semibold">Status</th>
                                            <th className="py-2.5 px-4 font-semibold">Manager & Leads</th>
                                            <th className="py-2.5 px-4 font-semibold">Timeline</th>
                                            <th className="py-2.5 px-4 font-semibold">Progress</th>
                                            <th className="py-2.5 px-4 font-semibold">Members</th>
                                            <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...Array(5)].map((_, i) => (
                                            <ProjectRowSkeleton key={i} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : filteredProjects.length === 0 ? (
                        /* Empty State */
                        <div className="border border-dashed border-[var(--app-border)] rounded-[4px] py-16 text-center flex flex-col items-center justify-center gap-3 bg-[var(--app-card)]/50">
                            <div className="w-10 h-10 rounded-full bg-[var(--app-card)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shadow-subtle">
                                <FolderKanban className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-sm font-semibold text-[var(--app-text)]">
                                    {hasActiveFilters ? "No matching projects found" : "No projects created yet"}
                                </p>
                                <p className="text-[11px] text-[var(--app-muted)] mt-0.5 max-w-sm">
                                    {hasActiveFilters 
                                        ? "Try adjusting your search query, status, or folder filter to find what you're looking for." 
                                        : "Get started by creating your first project to organize tasks, assign teammates, and track milestones."}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="relative corner-brackets-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer shadow-2xs"
                                    >
                                        <X className="w-3 h-3" />
                                        <span>Reset Filters</span>
                                    </button>
                                )}
                                {isLeader && (
                                    <button
                                        onClick={() => setIsCreateOpen(true)}
                                        className="relative corner-brackets-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] text-[11px] font-semibold rounded-[2px] transition-colors cursor-pointer shadow-2xs"
                                    >
                                        <Plus className="w-3.5 h-3.5 text-[var(--app-text)]" />
                                        <span>Create Project</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : viewMode === "grid" ? (
                        /* Grid View */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    ) : (
                        /* List / Table View */
                        <div className="border border-[var(--app-border)] rounded-[3px] bg-[var(--app-card)] overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)] text-[10px] font-medium text-[var(--app-muted)]">
                                            <th className="py-2.5 px-4 font-semibold">Project & Team</th>
                                            <th className="py-2.5 px-4 font-semibold">Status</th>
                                            <th className="py-2.5 px-4 font-semibold">Manager & Leads</th>
                                            <th className="py-2.5 px-4 font-semibold">Timeline</th>
                                            <th className="py-2.5 px-4 font-semibold">Progress</th>
                                            <th className="py-2.5 px-4 font-semibold">Members</th>
                                            <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProjects.map((project) => (
                                            <ProjectListItem key={project.id} project={project} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Project Modal */}
                <CreateProjectModal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                />
            </div>

            {/* Trays */}
            <ManageFoldersTray
                isOpen={isManageFoldersOpen}
                onClose={() => setIsManageFoldersOpen(false)}
            />
            
            <ProjectInvitationsTray
                isOpen={isManageInvitationsOpen}
                onClose={() => setIsManageInvitationsOpen(false)}
                onRefresh={loadProjects}
            />
        </div>
    );
}
