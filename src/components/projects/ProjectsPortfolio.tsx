"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
    CheckCircle2,
    SlidersHorizontal,
    ChevronDown,
    MoreHorizontal,
    MoreVertical,
    Pencil,
    FolderArchive,
    Info
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import CreateProjectModal from "./CreateProjectModal";
import EditProjectModal from "./EditProjectModal";
import ProjectDetailDrawer from "./ProjectDetailDrawer";
import ConfirmDialog from "../ui/ConfirmDialog";
import ManageFoldersTray from "../ManageFoldersTray";
import ProjectInvitationsTray from "./ProjectInvitationsTray";
import { usePortfolioSummary } from "../../hooks/useProjectSWR";
import { UserAvatar } from "../ui/UserAvatar";
import { CustomSelect } from "../ui/CustomSelect";
import { ProjectCard } from "./ProjectCard";
import { calculateProjectProgress, calculateProjectHealth } from "../../utils/projectProgress";
import { calculateDaySpan, formatDaySpan } from "../../utils/date";

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
        <div className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-4 flex flex-col justify-between gap-3.5 animate-pulse">
            {/* Top Zone */}
            <div className="flex flex-col gap-2.5">
                {/* 1. Header Row */}
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-[2px] bg-[var(--app-border)]/60 shrink-0" />
                    <div className="h-4.5 w-3/4 bg-[var(--app-border)]/70 rounded-[2px]" />
                </div>

                {/* 2. Team & Status */}
                <div className="flex items-center justify-between gap-2">
                    <div className="h-3.5 w-24 bg-[var(--app-border)]/50 rounded-[2px]" />
                    <div className="h-3.5 w-16 bg-[var(--app-border)]/40 rounded-[2px]" />
                </div>

                {/* 3. Description Lines */}
                <div className="flex flex-col gap-1">
                    <div className="h-3 w-full bg-[var(--app-border)]/40 rounded-[2px]" />
                    <div className="h-3 w-4/5 bg-[var(--app-border)]/30 rounded-[2px]" />
                </div>

                {/* 4. Timeline, Tasks & Assignees */}
                <div className="flex items-center justify-between pt-0.5">
                    <div className="h-4 w-28 bg-[var(--app-border)]/40 rounded-[2px]" />
                    <div className="h-3 w-16 bg-[var(--app-border)]/40 rounded-[2px]" />
                    <div className="flex items-center -space-x-1.5 ml-auto">
                        <div className="w-4 h-4 rounded-full bg-[var(--app-border)]/50" />
                        <div className="w-4 h-4 rounded-full bg-[var(--app-border)]/40" />
                    </div>
                </div>
            </div>

            {/* Bottom: Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--app-border)]">
                <div className="h-[32px] bg-[var(--app-border)]/40 rounded-[2px]" />
                <div className="h-[32px] bg-[var(--app-border)]/70 rounded-[2px]" />
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

function ProjectCardWrapper({
    project,
    onEdit,
    onArchive,
    canArchive = false,
    onViewDetails,
}: {
    project: any;
    onEdit?: () => void;
    onArchive?: () => void;
    canArchive?: boolean;
    onViewDetails?: () => void;
}) {
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

    return (
        <ProjectCard
            href={`/projects/${project.id}`}
            title={project.title}
            description={project.description}
            emoji={project.emoji}
            teamName={project.team?.name}
            teamEmoji={project.team?.emoji}
            status={project.status}
            startDate={project.startDate}
            endDate={project.endDate}
            completedTasks={doneTasks}
            totalTasks={totalTasks}
            overdueTasks={overdueTasks}
            progress={project.progress}
            tasks={project.tasks}
            columns={project.columns}
            assignees={allMembers}
            onEdit={onEdit}
            onArchive={onArchive}
            canArchive={canArchive}
            onViewDetails={onViewDetails}
        />
    );
}

function ProjectListItem({
    project,
    onEdit,
    onArchive,
    canArchive = false,
    onViewDetails,
}: {
    project: any;
    onEdit?: () => void;
    onArchive?: () => void;
    canArchive?: boolean;
    onViewDetails?: () => void;
}) {
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
    const status = calculateProjectHealth(project);
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
                    {status.status !== "COMPLETED" && overdueTasks > 0 && (
                        <span className="text-[11px] font-semibold text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-2.5 py-0.5 rounded-[3px]">
                            {overdueTasks} overdue
                        </span>
                    )}
                </div>
            </td>

            {/* Action */}
            <td className="py-4 px-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onViewDetails) onViewDetails();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] text-xs font-medium rounded-[3px] transition-colors cursor-pointer shadow-3xs"
                        title="View Project Details & Scope"
                    >
                        <Info className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        <span>Details</span>
                    </button>

                    <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--app-text)] hover:opacity-90 border border-[var(--app-text)] text-[var(--app-bg)] text-xs font-semibold rounded-[3px] transition-all shadow-xs group/open"
                    >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/open:translate-x-0.5 transition-transform" />
                    </Link>

                    {onEdit && (
                        <div className="relative inline-block text-left" ref={menuRef}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsMenuOpen((prev) => !prev);
                                }}
                                className="p-1.5 rounded-[3px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] border border-transparent hover:border-[var(--app-border)] transition-colors cursor-pointer"
                                title="Project options"
                                aria-label="Project options"
                            >
                                <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {isMenuOpen && (
                                <div
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    className="absolute right-0 top-full mt-1 z-30 min-w-[150px] bg-[var(--app-card)] border border-[var(--app-border-strong)] rounded-[4px] shadow-float py-1 text-xs select-none text-left whitespace-nowrap text-nowrap"
                                >
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
    const [projectToEdit, setProjectToEdit] = useState<any | null>(null);
    const [projectToArchive, setProjectToArchive] = useState<any | null>(null);
    const [projectForDetail, setProjectForDetail] = useState<any | null>(null);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
    const manageMenuRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const { summary, isLoading: isSummaryLoading } = usePortfolioSummary(currentTeam?.id, currentUser?.id);

    const handleConfirmArchive = async () => {
        if (!projectToArchive) return;
        setIsArchiving(true);
        try {
            await api.deleteProject(projectToArchive.id);
            toast.success(`Project "${projectToArchive.title || projectToArchive.name}" moved to archive.`);
            setProjectToArchive(null);
            await loadProjects();
        } catch (err: any) {
            toast.error(err.message || "Failed to archive project.");
        } finally {
            setIsArchiving(false);
        }
    };
    
    // Filter & Search states
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFolderId, setActiveFolderId] = useState<string>("ALL");
    const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<string>("recent");

    // Close Manage dropdown when clicked outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (manageMenuRef.current && !manageMenuRef.current.contains(event.target as Node)) {
                setIsManageMenuOpen(false);
            }
        }
        if (isManageMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isManageMenuOpen]);

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
                    const health = calculateProjectHealth(p);
                    if (statusFilter === "ACTIVE" && health.status !== "ACTIVE") return false;
                    if (statusFilter === "ON_TRACK" && health.status !== "ON_TRACK") return false;
                    if (statusFilter === "AT_RISK" && health.status !== "AT_RISK") return false;
                    if (statusFilter === "COMPLETED" && health.status !== "COMPLETED") return false;
                    if (statusFilter === "ARCHIVED" && health.status !== "ARCHIVED") return false;
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
            <div className="flex-1 flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)] select-none">
                {/* 1. Level 1: Header & Primary Action Toolbar */}
                <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-5 py-3 flex items-center justify-between gap-4 select-none">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <FolderKanban className="w-5 h-5 text-[var(--app-muted)] shrink-0" />
                        <div>
                            <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[var(--app-text)] leading-tight">
                                Projects
                            </h1>
                            <p className="text-[11px] text-[var(--app-muted)]">
                                Portfolio overview across all assigned workspace projects
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* View Switcher: Grid vs List */}
                        <div className="inline-flex items-center bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)] p-0.5 text-xs font-medium shrink-0">
                            <button
                                type="button"
                                onClick={() => handleViewModeChange("grid")}
                                className={`p-1.5 rounded-[2px] transition-all cursor-pointer flex items-center justify-center ${
                                    viewMode === "grid"
                                        ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-3xs font-semibold border border-[var(--app-border)]"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                                }`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleViewModeChange("list")}
                                className={`p-1.5 rounded-[2px] transition-all cursor-pointer flex items-center justify-center ${
                                    viewMode === "list"
                                        ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-3xs font-semibold border border-[var(--app-border)]"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                                }`}
                                title="List View"
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Manage Overflow Menu (Invitations + Folders) */}
                        <div className="relative" ref={manageMenuRef}>
                            <button
                                type="button"
                                onClick={() => setIsManageMenuOpen(!isManageMenuOpen)}
                                className={`relative bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border ${
                                    isManageMenuOpen || isManageInvitationsOpen || isManageFoldersOpen
                                        ? "border-[var(--app-border-strong)] bg-[var(--app-hover-bg)] text-[var(--app-text)] font-semibold"
                                        : "border-[var(--app-border)] text-[var(--app-text)]"
                                } text-xs font-medium px-2.5 py-1.5 rounded-[var(--radius-sm,4px)] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-3xs`}
                                title="Manage workspace & invitations"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                <span>Manage</span>
                                {projectInvitations.length > 0 && (
                                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary,#6366F1)] inline-block" />
                                )}
                                <ChevronDown className={`w-3 h-3 text-[var(--app-muted)] transition-transform ${isManageMenuOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isManageMenuOpen && (
                                <div className="absolute right-0 mt-1 w-52 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[var(--radius-md,6px)] shadow-lg py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsManageMenuOpen(false);
                                            setIsManageInvitationsOpen(true);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                            <span>Invitations</span>
                                        </span>
                                        {projectInvitations.length > 0 ? (
                                            <span className="px-1.5 py-0.2 rounded-[var(--radius-xs,2px)] text-[10px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold tabular-nums">
                                                {projectInvitations.length} new
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-[var(--app-muted)]">0 pending</span>
                                        )}
                                    </button>

                                    {userRole !== "OBSERVER" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsManageMenuOpen(false);
                                                setIsManageFoldersOpen(true);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Folder className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                                <span>Manage Folders</span>
                                            </span>
                                            <span className="text-[10px] text-[var(--app-muted)] tabular-nums">
                                                {folders.length} {folders.length === 1 ? "folder" : "folders"}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Primary Action Button: New Project */}
                        {isLeader && (
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(true)}
                                className="relative bg-[var(--app-text)] hover:opacity-90 text-[var(--app-bg)] border border-[var(--app-text)] text-xs font-semibold px-3.5 py-1.5 rounded-[var(--radius-sm,4px)] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
                            >
                                <Plus className="w-3.5 h-3.5 " />
                                <span>New Project</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Level 2: Compact KPI Stats Ribbon */}
                <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] select-none">
                    <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[var(--app-border)]">
                        {/* 1. Total Projects (Anchor) */}
                        <div className="px-5 py-2.5 flex items-center justify-between gap-3 bg-[var(--app-card)]">
                            <div className="flex flex-col min-w-0">
                                <span className="eyebrow text-[10px] text-[var(--app-muted)] tracking-wider uppercase">Total Projects</span>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <span className="text-xl font-heading font-bold tracking-tight text-[var(--app-text)] tabular-nums">
                                        {summary.totalProjects}
                                    </span>
                                    <span className="text-[11px] text-[var(--app-muted)] font-normal">in portfolio</span>
                                </div>
                            </div>
                            <div className="w-7 h-7 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0">
                                <FolderKanban className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        {/* 2. Active Projects */}
                        <div className="px-5 py-2.5 flex items-center justify-between gap-3 bg-[var(--app-card)]">
                            <div className="flex flex-col min-w-0">
                                <span className="eyebrow text-[10px] text-[var(--app-muted)] tracking-wider uppercase">Active</span>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <span className="text-xl font-heading font-bold tracking-tight text-[var(--app-text)] tabular-nums">
                                        {summary.activeProjects}
                                    </span>
                                    <span className="text-[11px] text-[var(--app-muted)] font-normal">in progress</span>
                                </div>
                            </div>
                            <div className="w-7 h-7 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0">
                                <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        {/* 3. Overdue Tasks */}
                        <div className="px-5 py-2.5 flex items-center justify-between gap-3 bg-[var(--app-card)]">
                            <div className="flex flex-col min-w-0">
                                <span className="eyebrow text-[10px] text-[var(--app-muted)] tracking-wider uppercase">Overdue</span>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <span className={`text-xl font-heading font-bold tracking-tight tabular-nums ${
                                        summary.criticalSLABreaches > 0 ? "text-[var(--color-error)]" : "text-[var(--app-text)]"
                                    }`}>
                                        {summary.criticalSLABreaches}
                                    </span>
                                    <span className="text-[11px] text-[var(--app-muted)] font-normal">
                                        {summary.criticalSLABreaches > 0 ? "needs attention" : "no breaches"}
                                    </span>
                                </div>
                            </div>
                            <div className="w-7 h-7 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0">
                                <AlertCircle className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        {/* 4. On-Time Rate */}
                        <div className="px-5 py-2.5 flex items-center justify-between gap-3 bg-[var(--app-card)]">
                            <div className="flex flex-col min-w-0">
                                <span className="eyebrow text-[10px] text-[var(--app-muted)] tracking-wider uppercase">On-Time Rate</span>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                    {summary.totalProjects === 0 || summary.onTimeRate === null || summary.onTimeRate === undefined ? (
                                        <>
                                            <span className="text-xl font-heading font-bold tracking-tight text-[var(--app-muted)] tabular-nums">
                                                —
                                            </span>
                                            <span className="text-[11px] text-[var(--app-muted)] font-normal">Not enough data yet</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className={`text-xl font-heading font-bold tracking-tight tabular-nums ${
                                                summary.onTimeRate < 50
                                                    ? "text-[var(--color-error)]"
                                                    : summary.onTimeRate < 80
                                                    ? "text-[var(--color-warning)]"
                                                    : "text-[var(--color-success)]"
                                            }`}>
                                                {summary.onTimeRate}%
                                            </span>
                                            <span className="text-[11px] text-[var(--app-muted)] font-normal">
                                                {summary.onTimeRate >= 80 ? "on track" : summary.onTimeRate >= 50 ? "moderate" : "delayed"}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="w-7 h-7 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Level 3: Search, Filters & Sort Unified Toolbar */}
                <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-5 py-2 flex flex-wrap items-center justify-between gap-3 select-none">
                    {/* Left: Search -> Status -> Sort -> Folder -> Team (Natural left-to-right scan) */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Search Input */}
                        <div className="relative w-48 sm:w-56">
                            <Search className="w-3.5 h-3.5 text-[var(--app-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] focus:border-[var(--app-border-strong)] focus:outline-none text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] pl-8 pr-7 py-1 rounded-[var(--radius-sm,4px)] transition-colors h-[30px]"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-text)] p-0.5 cursor-pointer"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

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
                            buttonClassName="text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-bg)] border border-[var(--app-border)]"
                            className="w-32 h-[30px] shrink-0"
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
                            buttonClassName="text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-bg)] border border-[var(--app-border)]"
                            className="w-34 h-[30px] shrink-0"
                        />

                        {/* Folder Filter (Clean dropdown replacing raw / broken pill buttons) */}
                        {folders.length > 0 && (
                            <CustomSelect
                                options={[
                                    { value: "ALL", label: `All Folders (${projects.length})` },
                                    ...folders.map((f) => ({
                                        value: f.id,
                                        label: `${f.emoji ? f.emoji + " " : ""}${f.name}`,
                                        sublabel: `${projects.filter((p) => p.folderId === f.id).length}`,
                                    })),
                                ]}
                                value={activeFolderId}
                                onChange={setActiveFolderId}
                                buttonClassName="text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-bg)] border border-[var(--app-border)]"
                                className="w-36 h-[30px] shrink-0"
                            />
                        )}

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
                                buttonClassName="text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-bg)] border border-[var(--app-border)]"
                                className="w-38 h-[30px] shrink-0"
                            />
                        )}

                        {/* Reset Filter Button */}
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] underline cursor-pointer px-1 py-1"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Right: Result Counter */}
                    <div className="text-xs text-[var(--app-muted)] shrink-0 hidden sm:flex items-center gap-1.5">
                        <span>Showing</span>
                        <span className="font-semibold text-[var(--app-text)] tabular-nums">{filteredProjects.length}</span>
                        <span>of</span>
                        <span className="font-semibold text-[var(--app-text)] tabular-nums">{projects.length}</span>
                        <span>{projects.length === 1 ? "project" : "projects"}</span>
                    </div>
                </div>

                {/* 4. Level 4: Scrollable Content View (Grid or List) */}
                <div className="flex-1 overflow-y-auto p-5 bg-[var(--app-bg)] flex flex-col gap-4 select-none">
                    {/* Pending Invitations Alert Banner */}
                    {projectInvitations.length > 0 && (
                        <div
                            onClick={() => setIsManageInvitationsOpen(true)}
                            className="border border-[var(--app-border)] hover:border-[var(--app-border-strong)] bg-[var(--app-card)] rounded-[var(--radius-md,8px)] p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors shadow-subtle shrink-0"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-7 h-7 rounded-full bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-text)] shrink-0">
                                    <Mail className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs text-[var(--app-text)] font-semibold truncate">
                                        You have {projectInvitations.length} pending project invitation{projectInvitations.length > 1 ? 's' : ''} awaiting response
                                    </p>
                                    <p className="text-[11px] text-[var(--app-muted)] mt-0.5">
                                        Click here to review project details, assigned roles, and accept or decline.
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-[var(--app-text)] font-semibold flex items-center gap-1 shrink-0 hover:underline">
                                Open Invitations →
                            </span>
                        </div>
                    )}
                        {isProjectsLoading ? (
                            viewMode === "grid" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {[...Array(8)].map((_, i) => (
                                        <ProjectCardSkeleton key={i} />
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-[var(--app-border)] rounded-[var(--radius-md,8px)] bg-[var(--app-card)] overflow-hidden shadow-card">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)] text-[11px] font-medium text-[var(--app-muted)]">
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
                                            {[...Array(5)].map((_, i) => (
                                                <ProjectRowSkeleton key={i} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : filteredProjects.length === 0 ? (
                            /* Empty State */
                            <div className="border border-dashed border-[var(--app-border)] rounded-[var(--radius-md,8px)] py-16 text-center flex flex-col items-center justify-center gap-3 bg-[var(--app-card)]/50">
                                <div className="w-10 h-10 rounded-full bg-[var(--app-card)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shadow-subtle">
                                    <FolderKanban className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <p className="text-sm font-semibold text-[var(--app-text)]">
                                        {hasActiveFilters ? "No matching projects found" : "No projects created yet"}
                                    </p>
                                    <p className="text-xs text-[var(--app-muted)] mt-0.5 max-w-sm">
                                        {hasActiveFilters 
                                            ? "Try adjusting your search query, status, or folder filter to find what you're looking for." 
                                            : "Get started by creating your first project to organize tasks, assign teammates, and track milestones."}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={handleClearFilters}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] text-xs font-medium rounded-[var(--radius-sm,4px)] transition-colors cursor-pointer shadow-3xs"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            <span>Clear All Filters</span>
                                        </button>
                                    )}
                                    {isLeader && !hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateOpen(true)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--app-text)] text-[var(--app-bg)] text-xs font-semibold rounded-[var(--radius-sm,4px)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Create Project</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : viewMode === "grid" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProjects.map((project) => {
                                    const isManager = Boolean(
                                        currentUser?.id && (
                                            project.managerId === currentUser.id ||
                                            project.manager?.id === currentUser.id ||
                                            project.creatorId === currentUser.id
                                        )
                                    );

                                    const isLeader = Boolean(
                                        (userRole || "").toUpperCase() === "LEADER" ||
                                        project.members?.some((m: any) => 
                                            (m.userId === currentUser?.id || m.user?.id === currentUser?.id) && 
                                            (m.role === "LEADER" || m.role === "Leader")
                                        )
                                    );

                                    const canEdit = isManager || isLeader;
                                    const canArchive = isManager;

                                    return (
                                        <ProjectCardWrapper
                                            key={project.id}
                                            project={project}
                                            onEdit={canEdit ? () => setProjectToEdit(project) : undefined}
                                            onArchive={canArchive ? () => setProjectToArchive(project) : undefined}
                                            canArchive={canArchive}
                                            onViewDetails={() => setProjectForDetail(project)}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="border border-[var(--app-border)] rounded-[var(--radius-md,8px)] bg-[var(--app-card)] overflow-hidden shadow-card">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)] text-[11px] font-medium text-[var(--app-muted)]">
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
                                        {filteredProjects.map((project) => {
                                            const isManager = Boolean(
                                                currentUser?.id && (
                                                    project.managerId === currentUser.id ||
                                                    project.manager?.id === currentUser.id ||
                                                    project.creatorId === currentUser.id
                                                )
                                            );

                                            const isLeader = Boolean(
                                                (userRole || "").toUpperCase() === "LEADER" ||
                                                project.members?.some((m: any) => 
                                                    (m.userId === currentUser?.id || m.user?.id === currentUser?.id) && 
                                                    (m.role === "LEADER" || m.role === "Leader")
                                                )
                                            );

                                            const canEdit = isManager || isLeader;
                                            const canArchive = isManager;

                                            return (
                                                <ProjectListItem
                                                    key={project.id}
                                                    project={project}
                                                    onEdit={canEdit ? () => setProjectToEdit(project) : undefined}
                                                    onArchive={canArchive ? () => setProjectToArchive(project) : undefined}
                                                    canArchive={canArchive}
                                                    onViewDetails={() => setProjectForDetail(project)}
                                                />
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </div>
            </div>

            {/* Create Project Modal (Slide-out SideSheet) */}
            <CreateProjectModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />

            {/* Edit Project Modal (Slide-out SideSheet) */}
            <EditProjectModal
                isOpen={Boolean(projectToEdit)}
                onClose={() => setProjectToEdit(null)}
                project={projectToEdit}
                onSaved={async () => {
                    setProjectToEdit(null);
                    await loadProjects();
                }}
            />

            {/* Project Details Drawer (Slide-out SideSheet) */}
            <ProjectDetailDrawer
                isOpen={Boolean(projectForDetail)}
                onClose={() => setProjectForDetail(null)}
                project={projectForDetail}
                currentUser={currentUser}
                userRole={userRole || "MEMBER"}
                canEdit={
                    Boolean(
                        currentUser?.id && (
                            projectForDetail?.managerId === currentUser.id ||
                            projectForDetail?.manager?.id === currentUser.id ||
                            projectForDetail?.creatorId === currentUser.id
                        )
                    ) ||
                    Boolean(
                        (userRole || "").toUpperCase() === "LEADER" ||
                        projectForDetail?.members?.some((m: any) => 
                            (m.userId === currentUser?.id || m.user?.id === currentUser?.id) && 
                            (m.role === "LEADER" || m.role === "Leader")
                        )
                    )
                }
                onEditClick={() => {
                    const p = projectForDetail;
                    setProjectForDetail(null);
                    setProjectToEdit(p);
                }}
            />

            {/* Confirm Archive Dialog */}
            <ConfirmDialog
                isOpen={Boolean(projectToArchive)}
                title="Archive Project?"
                description={`Move "${projectToArchive?.title || projectToArchive?.name}" to the workspace archive? It will be removed from active project boards. Only the Project Manager and Workspace Owner can view, restore, or permanently delete it.`}
                confirmText="Move to Archive"
                cancelText="Cancel"
                isDanger={true}
                isLoading={isArchiving}
                onConfirm={handleConfirmArchive}
                onClose={() => setProjectToArchive(null)}
            />

            {/* Manage Folders Tray (Slide-out) */}
            <ManageFoldersTray
                isOpen={isManageFoldersOpen}
                onClose={() => setIsManageFoldersOpen(false)}
            />

            {/* Project Invitations Tray (Slide-out) */}
            <ProjectInvitationsTray
                isOpen={isManageInvitationsOpen}
                onClose={() => setIsManageInvitationsOpen(false)}
                onRefresh={loadProjects}
            />
        </div>
    );
}
