"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ArrowRight, Loader2, Folder, Mail, LayoutGrid, List, FolderKanban, Building2 } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { api } from "../../api";
import CreateProjectModal from "./CreateProjectModal";
import ManageFoldersTray from "../ManageFoldersTray";
import ProjectInvitationsTray from "./ProjectInvitationsTray";
import { usePortfolioSummary } from "../../hooks/useProjectSWR";
import { UserAvatar } from "../ui/UserAvatar";
import { calculateProjectProgress } from "../../utils/projectProgress";

function getStatusConfig(status: string) {
    switch (status) {
        case "ON_TRACK":
        case "OnTrack":
            return { label: "On Track", color: "text-[var(--status-on-track,#16A34A)]", bg: "bg-[var(--status-on-track,#16A34A)]/10", border: "border-[var(--status-on-track,#16A34A)]/20", dot: "bg-[var(--status-on-track,#16A34A)]" };
        case "AT_RISK":
        case "AtRisk":
            return { label: "At Risk", color: "text-[var(--status-at-risk,#D97706)]", bg: "bg-[var(--status-at-risk,#D97706)]/10", border: "border-[var(--status-at-risk,#D97706)]/20", dot: "bg-[var(--status-at-risk,#D97706)]" };
        case "ACTIVE":
        case "Active":
            return { label: "Active", color: "text-[var(--status-active,#0284C7)]", bg: "bg-[var(--status-active,#0284C7)]/10", border: "border-[var(--status-active,#0284C7)]/20", dot: "bg-[var(--status-active,#0284C7)]" };
        case "COMPLETED":
        case "Completed":
            return { label: "Completed", color: "text-[var(--status-completed,#15803D)]", bg: "bg-[var(--status-completed,#15803D)]/10", border: "border-[var(--status-completed,#15803D)]/20", dot: "bg-[var(--status-completed,#15803D)]" };
        case "ARCHIVED":
        case "Archived":
            return { label: "Archived", color: "text-[var(--status-archived,#6B7280)]", bg: "bg-[var(--status-archived,#6B7280)]/10", border: "border-[var(--status-archived,#6B7280)]/20", dot: "bg-[var(--status-archived,#6B7280)]" };
        default:
            return { label: status, color: "text-[var(--status-archived,#6B7280)]", bg: "bg-[var(--status-archived,#6B7280)]/10", border: "border-[var(--status-archived,#6B7280)]/20", dot: "bg-[var(--status-archived,#6B7280)]" };
    }
}

function AvatarChip({ name, avatarUrl, size = "sm" }: { name: string; avatarUrl?: string | null; size?: "sm" | "md" }) {
    return (
        <UserAvatar
            name={name}
            avatarUrl={avatarUrl}
            size={size === "sm" ? "sm" : "md"}
            title={name}
        />
    );
}

function ProjectCard({ project }: { project: any }) {
    const status = getStatusConfig(project.status);
    const totalTasks = project.totalTasks !== undefined ? project.totalTasks : (project.tasks?.length || 0);
    const doneTasks = project.doneTasks !== undefined ? project.doneTasks : (project.tasks?.filter((t: any) => t.column?.isComplete || t.status === "Completed" || t.status === "Done").length || 0);
    const overdueTasks = project.overdueTasks !== undefined ? project.overdueTasks : (project.tasks?.filter((t: any) => t.riskLevel === "OVERDUE" || t.riskLevel === "CRITICAL_SLA" || t.riskLevel === "Overdue" || t.riskLevel === "CriticalSLA").length || 0);
    const leaders = (project.members || []).filter((m: any) => m.role === "Leader" || m.role === "LEADER");

    const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        return d.toISOString().split("T")[0];
    };

    const calculatedProgress = Array.isArray(project.tasks) && project.tasks.length > 0
        ? calculateProjectProgress(project.tasks, project.columns)
        : (project.progress !== undefined ? project.progress : 0);

    return (
        <Link href={`/projects/${project.id}`} className="block group">
            <div className="relative bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets p-4 flex flex-col gap-3 hover:border-[var(--app-border-strong)] transition-colors cursor-pointer rounded-[3px]">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {project.emoji ? (
                            <span className="text-lg emoji-font shrink-0">{project.emoji}</span>
                        ) : (
                            <FolderKanban className="w-5 h-5 text-[var(--app-muted)] shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                            <h3 className="text-[13px] font-semibold text-[var(--app-text)] truncate">
                                {project.title}
                            </h3>
                            {project.team && (
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[9px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] px-1.5 py-0.5 rounded-[2px] border border-[var(--app-border)] flex items-center gap-1 w-fit max-w-full truncate" title={`Owning Team: ${project.team.name}`}>
                                        {project.team.emoji ? (
                                            <span className="emoji-font text-[9px] shrink-0">{project.team.emoji}</span>
                                        ) : (
                                            <Building2 className="w-2.5 h-2.5 shrink-0 text-[var(--app-muted)]" />
                                        )}
                                        <span className="truncate">{project.team.name}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <span
                        className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-[2px] border ${status.color} ${status.bg} ${status.border} flex items-center gap-1`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                    </span>
                </div>

                <p className="text-[11px] text-[var(--app-muted)] leading-relaxed line-clamp-2">
                    {project.description}
                </p>

                <div className="flex items-center gap-3 text-[10px]">
                    {project.manager && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[var(--app-muted)]">Mgr:</span>
                            <AvatarChip name={project.manager.name} avatarUrl={project.manager.avatarUrl} />
                            <span className="text-[var(--app-text)] font-medium truncate max-w-[80px]">
                                {project.manager.name.split(" ")[0]}
                            </span>
                        </div>
                    )}
                    {leaders.length > 0 && (
                        <div className="flex items-center gap-1 min-w-0">
                            <span className="text-[var(--app-muted)]">Leads:</span>
                            <div className="flex -space-x-1">
                                {leaders.slice(0, 3).map((m: any) => (
                                    <AvatarChip key={m.id} name={m.user?.name || ""} avatarUrl={m.user?.avatarUrl} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {(project.startDate || project.endDate) && (
                    <div className="flex items-center justify-between text-[9px] text-[var(--app-muted)] bg-[var(--app-bg)] px-2 py-1 rounded-[2px] border border-[var(--app-border)]">
                        <span>{formatDate(project.startDate)}</span>
                        <span>→</span>
                        <span>{formatDate(project.endDate)}</span>
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[9px]">
                        <span className="text-[var(--app-muted)]">Progress</span>
                        <span className="font-semibold text-[var(--app-text)] tabular-nums">
                            {calculatedProgress}%
                        </span>
                    </div>
                    <div className="w-full h-1 bg-[var(--app-border)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--app-text)] transition-all duration-300"
                            style={{ width: `${calculatedProgress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--app-border)] text-[9px]">
                    <div className="flex items-center gap-3">
                        <span className="text-[var(--app-muted)]">
                            <span className="font-medium text-[var(--app-text)] tabular-nums">{doneTasks}</span>/{totalTasks} tasks
                        </span>
                        <span className="text-[var(--app-muted)]">
                            <span className="font-medium text-[var(--app-text)] tabular-nums">{project.members?.length || 0}</span> members
                        </span>
                    </div>
                    {overdueTasks > 0 && (
                        <span className="text-[9px] font-medium text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-1.5 py-0.5 rounded-[2px]">
                            {overdueTasks} overdue
                        </span>
                    )}
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
    const leaders = (project.members || []).filter((m: any) => m.role === "Leader" || m.role === "LEADER");

    const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        return d.toISOString().split("T")[0];
    };

    const calculatedProgress = Array.isArray(project.tasks) && project.tasks.length > 0
        ? calculateProjectProgress(project.tasks, project.columns)
        : (project.progress !== undefined ? project.progress : 0);

    return (
        <tr className="group border-b border-[var(--app-border)] hover:bg-[var(--app-hover-bg)] transition-colors text-xs">
            {/* Project & Owning Team */}
            <td className="py-3.5 px-4 min-w-[240px]">
                <Link href={`/projects/${project.id}`} className="flex items-center gap-2.5 min-w-0">
                    {project.emoji ? (
                        <span className="text-lg emoji-font shrink-0">{project.emoji}</span>
                    ) : (
                        <FolderKanban className="w-4 h-4 text-[var(--app-muted)] shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[13px] text-[var(--app-text)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                            {project.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {project.team && (
                                <span className="text-[9px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] px-1.5 py-0.2 rounded-[2px] border border-[var(--app-border)] flex items-center gap-1 shrink-0" title={`Owning Team: ${project.team.name}`}>
                                    {project.team.emoji ? (
                                        <span className="emoji-font text-[9px] shrink-0">{project.team.emoji}</span>
                                    ) : (
                                        <Building2 className="w-2.5 h-2.5 shrink-0 text-[var(--app-muted)]" />
                                    )}
                                    <span className="truncate max-w-[120px]">{project.team.name}</span>
                                </span>
                            )}
                            {project.description && (
                                <span className="text-[10px] text-[var(--app-muted)] line-clamp-1 max-w-[200px]">
                                    {project.description}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
            </td>

            {/* Status */}
            <td className="py-3.5 px-4 whitespace-nowrap">
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-[2px] border inline-flex items-center gap-1 ${status.color} ${status.bg} ${status.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                </span>
            </td>

            {/* Manager & Leads */}
            <td className="py-3.5 px-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    {project.manager && (
                        <div className="flex items-center gap-1.5 min-w-0" title={`Manager: ${project.manager.name}`}>
                            <AvatarChip name={project.manager.name} avatarUrl={project.manager.avatarUrl} size="sm" />
                            <span className="text-[10px] text-[var(--app-text)] font-medium truncate max-w-[80px]">
                                {project.manager.name.split(" ")[0]}
                            </span>
                        </div>
                    )}
                    {leaders.length > 0 && (
                        <div className="flex -space-x-1" title={leaders.map((l: any) => l.user?.name).join(", ")}>
                            {leaders.slice(0, 2).map((m: any) => (
                                <AvatarChip key={m.id} name={m.user?.name || ""} avatarUrl={m.user?.avatarUrl} size="sm" />
                            ))}
                        </div>
                    )}
                </div>
            </td>

            {/* Timeline */}
            <td className="py-3.5 px-4 whitespace-nowrap text-[10px] text-[var(--app-muted)]">
                {(project.startDate || project.endDate) ? (
                    <div className="flex items-center gap-1">
                        <span>{formatDate(project.startDate)}</span>
                        <span>→</span>
                        <span>{formatDate(project.endDate)}</span>
                    </div>
                ) : (
                    <span>—</span>
                )}
            </td>

            {/* Progress & Tasks */}
            <td className="py-3.5 px-4 min-w-[170px]">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[9px]">
                        <span className="text-[var(--app-muted)]">
                            <span className="font-medium text-[var(--app-text)] tabular-nums">{doneTasks}</span>/{totalTasks} tasks
                        </span>
                        <span className="font-semibold text-[var(--app-text)] tabular-nums">
                            {calculatedProgress}%
                        </span>
                    </div>
                    <div className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] h-1.5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--app-text)] transition-all duration-300 rounded-full"
                            style={{ width: `${calculatedProgress}%` }}
                        />
                    </div>
                </div>
            </td>

            {/* Members / Overdue */}
            <td className="py-3.5 px-4 whitespace-nowrap text-[10px] text-[var(--app-muted)]">
                <div className="flex items-center gap-2">
                    <span>{project.members?.length || 0} members</span>
                    {overdueTasks > 0 && (
                        <span className="text-[8px] font-medium text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-1 py-0.2 rounded-[1px]">
                            {overdueTasks} overdue
                        </span>
                    )}
                </div>
            </td>

            {/* Action */}
            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)] text-[10px] font-medium rounded-[2px] transition-colors"
                >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const { summary } = usePortfolioSummary(currentTeam?.id, currentUser?.id);
    const [activeFolderId, setActiveFolderId] = useState<string>("ALL");
    const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("ALL");

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
    const uniqueTeams = React.useMemo(() => {
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

    // Filter projects by team and folder
    const filteredProjects = projects.filter((p) => {
        if (selectedTeamFilter !== "ALL" && p.teamId !== selectedTeamFilter && p.team?.id !== selectedTeamFilter) {
            return false;
        }
        if (activeFolderId !== "ALL") {
            return p.folderId === activeFolderId;
        }
        return true;
    });

    return (
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col gap-5 select-none">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-[var(--app-text)]">Projects</h1>
                        <p className="text-xs text-[var(--app-muted)] mt-0.5">
                            Portfolio overview across all assigned projects
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* View Switcher: Grid vs List */}
                        <div className="flex items-center bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] p-0.5 text-[10px] font-medium shrink-0">
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
                        </div>

                        {/* Invitations Tray Trigger Button (Secondary) */}
                        <button
                            type="button"
                            onClick={() => {
                                setIsManageInvitationsOpen(!isManageInvitationsOpen);
                            }}
                            className={`bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border ${
                                isManageInvitationsOpen
                                    ? "border-[var(--app-border-strong)] bg-[var(--app-hover-bg)] text-[var(--app-text)] font-semibold"
                                    : "border-[var(--app-border)] text-[var(--app-text)]"
                            } text-[11px] font-medium px-3.5 py-1.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0`}
                        >
                            <Mail className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                            <span>Invitations</span>
                            {projectInvitations.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-[2px] text-[9px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold tabular-nums">
                                    {projectInvitations.length}
                                </span>
                            )}
                        </button>
                        {isLeader && (
                            <>
                                {!isManageFoldersOpen && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsManageFoldersOpen(true);
                                        }}
                                        className="bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] text-[11px] font-medium px-3.5 py-1.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                                    >
                                        <Folder className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                        <span>Manage Folders</span>
                                    </button>
                                )}
                                {/* Primary Action: exactly ONE primary button */}
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(true)}
                                    className="relative corner-brackets-4 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] text-[11px] font-medium px-3.5 py-1.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                                >
                                    <Plus className="w-3.5 h-3.5 text-[var(--app-text)]" />
                                    <span>New Project</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Subtle Pending Invitations Alert Bar */}
                {projectInvitations.length > 0 && (
                    <div
                        onClick={() => {
                            setIsManageInvitationsOpen(true);
                        }}
                        className="border border-[var(--app-border)] hover:border-[var(--app-border-strong)] bg-[var(--app-bg)] rounded-[3px] p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-full bg-[var(--app-card)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-text)] shrink-0">
                                <Mail className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs text-[var(--app-text)] font-semibold truncate">
                                    You have {projectInvitations.length} pending project invitation{projectInvitations.length > 1 ? 's' : ''} awaiting your response
                                </p>
                                <p className="text-[10px] text-[var(--app-muted)] mt-0.5">
                                    Click here to review project details, assigned roles, and accept or decline.
                                </p>
                            </div>
                        </div>
                        <span className="text-[11px] text-[var(--app-text)] font-medium flex items-center gap-1 shrink-0 hover:underline">
                            Open Sidebar →
                        </span>
                    </div>
                )}

                {/* KPI Stats Row — Semantic Colors */}
                <div className="corner-brackets grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--app-border)] border border-[var(--app-border)] rounded-[3px] overflow-hidden">
                    <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                        <span className="eyebrow">Active Projects</span>
                        <span className="text-2xl font-bold tracking-tight text-[var(--app-text)] tabular-nums">
                            {summary.activeProjects}
                        </span>
                    </div>
                    <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                        <span className="eyebrow">On-Time Rate</span>
                        <span className={`text-2xl font-bold tracking-tight tabular-nums ${
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
                        <span className="eyebrow">SLA Breaches</span>
                        <span className={`text-2xl font-bold tracking-tight tabular-nums ${summary.criticalSLABreaches > 0 ? "text-[var(--color-error)]" : "text-[var(--app-text)]"}`}>
                            {summary.criticalSLABreaches}
                        </span>
                    </div>
                    <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                        <span className="eyebrow">Total Projects</span>
                        <span className="text-2xl font-bold tracking-tight text-[var(--app-text)] tabular-nums">
                            {summary.totalProjects}
                        </span>
                    </div>
                </div>

                {/* Filters Row: Team Selector & Folder Tabs */}
                {!isProjectsLoading && (uniqueTeams.length > 1 || foldersWithProjects.length > 0) && (
                    <div className="shrink-0 border-b border-[var(--app-border)] flex flex-wrap items-center justify-between gap-3 select-none pb-1">
                        {/* Folder / All Tabs — Clean Normal-Case Typography */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setActiveFolderId("ALL")}
                                className={`py-1.5 px-3 flex items-center gap-1.5 text-[12px] font-medium border-b-2 transition-colors cursor-pointer ${
                                    activeFolderId === "ALL"
                                        ? "border-[var(--app-text)] text-[var(--app-text)] font-semibold"
                                        : "border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                }`}
                            >
                                <span>All Folders</span>
                                <span className={`px-1.5 py-0.2 rounded-[2px] text-[10px] tabular-nums border transition-colors ${
                                    activeFolderId === "ALL"
                                        ? "bg-[var(--app-card)] border-[var(--app-border-strong)] text-[var(--app-text)] font-semibold"
                                        : "bg-[var(--app-bg)] border-[var(--app-border)] text-[var(--app-muted)] font-medium"
                                }`}>
                                    {projects.length}
                                </span>
                            </button>
                            {foldersWithProjects.map((folder) => {
                                const isSelected = activeFolderId === folder.id;
                                const folderProjects = projects.filter((p) => p.folderId === folder.id);
                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => setActiveFolderId(folder.id)}
                                        className={`py-1.5 px-3 flex items-center gap-1.5 text-[12px] font-medium border-b-2 transition-colors cursor-pointer ${
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
                                        <span className={`px-1.5 py-0.2 rounded-[2px] text-[10px] tabular-nums border transition-colors ${
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

                        {/* Cross-Team Filter */}
                        {uniqueTeams.length > 1 && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="text-[var(--app-muted)] text-[10px]">Team:</span>
                                <select
                                    value={selectedTeamFilter}
                                    onChange={(e) => setSelectedTeamFilter(e.target.value)}
                                    className="px-2 py-1 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] text-[11px] text-[var(--app-text)] focus:outline-none focus:border-[var(--app-border-strong)] cursor-pointer"
                                >
                                    <option value="ALL">All Teams ({projects.length})</option>
                                    {uniqueTeams.map((t) => {
                                        const count = projects.filter((p) => p.teamId === t.id || p.team?.id === t.id).length;
                                        return (
                                            <option key={t.id} value={t.id}>
                                                {t.emoji || "🏢"} {t.name} ({count})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Project List / Grid View */}
                <div className="flex flex-col gap-6">
                    {isProjectsLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" />
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        /* Actionable Empty State */
                        <div className="border border-dashed border-[var(--app-border)] rounded-[4px] py-16 text-center flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--app-card)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)]">
                                <FolderKanban className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-[var(--app-text)]">No projects found</p>
                                <p className="text-[11px] text-[var(--app-muted)] mt-0.5">
                                    {activeFolderId !== "ALL" ? "No projects in this folder yet." : "Get started by creating a new project."}
                                </p>
                            </div>
                            {isLeader && (
                                <button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="relative corner-brackets-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer mt-1 shadow-2xs"
                                >
                                    <Plus className="w-3.5 h-3.5 text-[var(--app-text)]" />
                                    <span>Create Project</span>
                                </button>
                            )}
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    ) : (
                        /* List / Table View — Clean row-based borders & normal-case headers */
                        <div className="border border-[var(--app-border)] rounded-[3px] bg-[var(--app-card)] overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)] text-[10px] font-medium text-[var(--app-muted)]">
                                            <th className="py-3 px-4 font-semibold">Project & Team</th>
                                            <th className="py-3 px-4 font-semibold">Status</th>
                                            <th className="py-3 px-4 font-semibold">Manager & Leads</th>
                                            <th className="py-3 px-4 font-semibold">Timeline</th>
                                            <th className="py-3 px-4 font-semibold">Progress</th>
                                            <th className="py-3 px-4 font-semibold">Members</th>
                                            <th className="py-3 px-4 font-semibold text-right">Action</th>
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
