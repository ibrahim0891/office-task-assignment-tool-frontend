"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
    ArrowLeft, ArrowRight, LayoutGrid, Users, Calendar, BarChart2, 
    Loader2, Mail, Settings, ChevronLeft, ChevronRight, FolderKanban, 
    Building2, Shield, ShieldCheck, User, Eye, Edit2, FolderGit2, Clock
} from "lucide-react";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import ProjectBoardView from "./ProjectBoardView";
import ProjectMembersView from "./ProjectMembersView";
import ProjectTimelineView from "./ProjectTimelineView";
import ProjectAnalyticsView from "./ProjectAnalyticsView";
import ProjectAssetsView from "./ProjectAssetsView";
import ProjectSettingsView from "./ProjectSettingsView";
import ProjectInvitationsTray from "./ProjectInvitationsTray";
import EditProjectModal from "./EditProjectModal";
import { useProjectDetail } from "../../hooks/useProjectSWR";
import ProjectDetailSkeleton from "./ProjectDetailSkeleton";
import { UserAvatar } from "../ui/UserAvatar";
import { Button } from "../ui/Button";
import { calculateProjectProgress } from "../../utils/projectProgress";
import { getProjectPermissions } from "../../utils/projectPermissions";
import { calculateDaySpan, formatDaySpan, calculateRemainingDays } from "../../utils/date";

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

type Tab = "main-board" | "members" | "timeline" | "analytics" | "assets" | "settings";

const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "main-board", label: "Main Tasks", icon: LayoutGrid },
    { id: "members", label: "Members", icon: Users },
    { id: "timeline", label: "Timeline", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "assets", label: "Assets & Docs", icon: FolderGit2 },
    { id: "settings", label: "Settings", icon: Settings },
];

export default function ProjectDetail() {
    const params = useParams();
    const projectId = params.id as string;
    const { currentTeam, currentUser, userRole, isManageInvitationsOpen, setIsManageInvitationsOpen, projectInvitations } = useWorkspace();

    const { project, isLoading, mutate: refreshProject } = useProjectDetail(projectId, currentTeam?.id);
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(`project-active-tab-${projectId}`);
            if (saved) return saved as Tab;
        }
        return "main-board";
    });
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

    const loadProjectDetail = React.useCallback(async () => {
        await refreshProject();
    }, [refreshProject]);

    useEffect(() => {
        localStorage.setItem(`project-active-tab-${projectId}`, activeTab);
    }, [activeTab, projectId]);

    useEffect(() => {
        const handleProjectDataUpdated = (e: any) => {
            const detail = e.detail;
            if (!detail || !detail.projectId || detail.projectId === projectId) {
                refreshProject();
            }
        };
        window.addEventListener("project_data_updated", handleProjectDataUpdated);
        return () => window.removeEventListener("project_data_updated", handleProjectDataUpdated);
    }, [projectId, refreshProject]);

    if (isLoading && !project) {
        return <ProjectDetailSkeleton />;
    }

    if (!project) {
        return (
            <div className="flex-1 flex items-center justify-center p-5 bg-[var(--app-bg)]">
                <div className="text-center flex flex-col gap-3">
                    <h2 className="text-lg font-semibold text-[var(--app-text)]">
                        Project Not Found
                    </h2>
                    <p className="text-xs text-[var(--app-muted)]">
                        The project you are looking for does not exist.
                    </p>
                    <Link
                        href="/projects"
                        className="text-[11px] text-[var(--app-text)] underline hover:no-underline font-medium"
                    >
                        ← Back to Projects
                    </Link>
                </div>
            </div>
        );
    }

    const status = getStatusConfig(project.status);
    const leaders = (project.members || []).filter((m: any) => m.role === "Leader" || m.role === "LEADER");

    // Format dates to YYYY-MM-DD for display
    const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        return d.toISOString().split("T")[0];
    };


    const permissions = getProjectPermissions(project, currentUser, userRole, currentTeam);
    const canManageTasks = permissions.canManageTasks;
    const canManageInvitations = permissions.canManageInvitations;
    const pendingProjectInvitesCount = (project.invitations?.length || 0) + (projectInvitations?.length || 0);

    const calculatedProgress = Array.isArray(project.tasks) && project.tasks.length > 0
        ? calculateProjectProgress(project.tasks, project.columns)
        : (project.progress !== undefined ? project.progress : 0);

    const remainingDays = calculateRemainingDays(project.endDate);

    return (
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
                {/* Level 1: Project Identity, Breadcrumbs & Primary Actions */}
                <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-5 py-3 flex flex-col gap-2 select-none">
                    {/* Row 1: Primary Project Title + Right Actions */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Project Emoji & Prominent Title */}
                        <div className="flex items-center gap-2.5 min-w-0">
                            {project.emoji ? (
                                <span className="text-xl emoji-font shrink-0">{project.emoji}</span>
                            ) : (
                                <FolderKanban className="w-5 h-5 text-[var(--app-muted)] shrink-0" />
                            )}
                            <h1
                                className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[var(--app-text)] truncate max-w-[320px] md:max-w-[500px] lg:max-w-[700px]"
                                title={project.title}
                            >
                                {project.title}
                            </h1>
                        </div>

                        {/* Right: Project Dates, Edit & Invitations Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                            {/* Project Timeline Date Range & Remaining Days */}
                            {(project.startDate || project.endDate) && (
                                <div
                                    className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--app-muted)] font-medium"
                                    title={project.startDate && project.endDate ? `Timeline: ${formatDate(project.startDate)} – ${formatDate(project.endDate)} (${formatDaySpan(calculateDaySpan(project.startDate, project.endDate))})` : "Project Timeline"}
                                >
                                    <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                    <span>{formatDate(project.startDate) || "—"}</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-[var(--app-muted)]/70 shrink-0" />
                                    <span>{formatDate(project.endDate) || "—"}</span>
                                    {project.startDate && project.endDate && (
                                        <span className="font-semibold text-[var(--app-text)] ml-0.5">
                                            • {calculateDaySpan(project.startDate, project.endDate)}d
                                        </span>
                                    )}
                                    {remainingDays && (
                                        <span
                                            className={`font-semibold ml-0.5 ${
                                                remainingDays.isOverdue
                                                    ? "text-[var(--color-error)]"
                                                    : remainingDays.isToday
                                                    ? "text-[var(--color-warning)]"
                                                    : "text-[var(--color-accent)]"
                                            }`}
                                            title={`Timeline Schedule: ${remainingDays.label}`}
                                        >
                                            • {remainingDays.label}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons Group */}
                            <div className="flex items-center gap-2">
                                {/* Edit Project Modal Button */}
                                {canManageTasks && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setIsEditProjectModalOpen(true)}
                                        icon={<Edit2 className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />}
                                        title="Edit Project Configuration"
                                        className="shadow-2xs text-xs"
                                    >
                                        Edit
                                    </Button>
                                )}

                                {/* Invitations Drawer Toggle */}
                                {canManageInvitations && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setIsManageInvitationsOpen(!isManageInvitationsOpen)}
                                        icon={<Mail className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />}
                                        title="Project Invitations"
                                        className={`shadow-2xs text-xs ${
                                            isManageInvitationsOpen
                                                ? "bg-[var(--app-hover-bg)] text-[var(--app-text)] border-[var(--app-border-strong)] font-semibold"
                                                : ""
                                        }`}
                                    >
                                        Invitations
                                        {pendingProjectInvitesCount > 0 && (
                                            <span className="ml-1 px-1.5 py-0.2 rounded-[2px] text-[9px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold tabular-nums">
                                                {pendingProjectInvitesCount}
                                            </span>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Breadcrumb Navigation (Left) + Roles & Metadata Badges (Right) */}
                    <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--app-muted)] flex-wrap pt-0.5">
                        {/* Left: Breadcrumb Navigation in Small Size */}
                        <div className="flex items-center gap-1.5 min-w-0 text-[11px]">
                            <Link
                                href="/projects"
                                className="text-[var(--app-muted)] hover:text-[var(--app-text)] flex items-center gap-1 font-medium transition-colors shrink-0 group"
                                title="Back to Projects"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                                <span>Projects</span>
                            </Link>

                            <span className="text-[var(--app-muted)]/70 text-xs font-medium select-none px-0.5">/</span>

                            <span className="text-[var(--app-text)] font-medium truncate max-w-[220px]" title={project.title}>
                                {project.title}
                            </span>
                        </div>

                        {/* Right: Roles & Metadata Badges */}
                        <div className="flex items-center gap-3 text-[11px] text-[var(--app-muted)] flex-wrap">
                            {/* Status indicator (Dot + Neutral Label - No tint) */}
                            <div className="flex items-center gap-1.5 shrink-0" title={`Project Health: ${status.label}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                <span className="font-medium text-[var(--app-text)]">{status.label}</span>
                            </div>

                            {/* Remaining Days in Metadata Bar (Visible on mobile when top timeline is hidden) */}
                            {remainingDays && (
                                <div className="sm:hidden flex items-center gap-3">
                                    <span className="text-[var(--app-border)] select-none">•</span>
                                    <div className="flex items-center gap-1 shrink-0" title={`Timeline Schedule: ${remainingDays.label}`}>
                                        <Clock className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                        <span className={`font-semibold ${
                                            remainingDays.isOverdue
                                                ? "text-[var(--color-error)]"
                                                : remainingDays.isToday
                                                ? "text-[var(--color-warning)]"
                                                : "text-[var(--app-text)]"
                                        }`}>
                                            {remainingDays.label}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Owning Team */}
                            {project.team && (
                                <>
                                    <span className="text-[var(--app-border)] select-none">•</span>
                                    <div className="flex items-center gap-1.5 shrink-0" title={`Owning Team: ${project.team.name}`}>
                                        {project.team.emoji ? (
                                            <span className="emoji-font text-xs shrink-0">{project.team.emoji}</span>
                                        ) : (
                                            <Building2 className="w-3.5 h-3.5 shrink-0 text-[var(--app-muted)]" />
                                        )}
                                        <span>{project.team.name}</span>
                                    </div>
                                </>
                            )}

                            {/* User Role (Minimal, untinted) */}
                            <span className="text-[var(--app-border)] select-none">•</span>
                            <div className="relative group flex items-center gap-1 shrink-0 cursor-help" title={permissions.userRoleDescription}>
                                {permissions.userRoleLabel === "Manager" ? (
                                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                ) : permissions.userRoleLabel === "Leader" ? (
                                    <Shield className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                ) : permissions.userRoleLabel === "Member" ? (
                                    <User className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                ) : (
                                    <Eye className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                )}
                                <span>Role: <strong className="font-medium text-[var(--app-text)]">{permissions.userRoleLabel}</strong></span>

                                {/* Role Tooltip */}
                                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 w-56 p-2.5 bg-[var(--app-card)] border border-[var(--app-border-strong)] rounded-[3px] shadow-lg text-[10px] text-[var(--app-muted)] pointer-events-none">
                                    <div className="font-semibold text-[var(--app-text)] mb-0.5 flex items-center gap-1.5">
                                        <span>Your Role: {permissions.userRoleLabel}</span>
                                    </div>
                                    <p>{permissions.userRoleDescription}</p>
                                </div>
                            </div>

                            {/* Project Manager */}
                            {project.manager && (
                                <>
                                    <span className="text-[var(--app-border)] select-none">•</span>
                                    <div className="flex items-center gap-1.5 shrink-0" title={`Project Manager: ${project.manager.name}`}>
                                        <UserAvatar
                                            name={project.manager.name}
                                            avatarUrl={project.manager.avatarUrl}
                                            size="sm"
                                        />
                                        <span>Mgr: <strong className="font-medium text-[var(--app-text)]">{project.manager.name}</strong></span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Level 2: Navigation Tabs & Progress Gauge */}
                <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-5 flex items-center justify-between gap-4 select-none">
                    {/* View Tabs */}
                    <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const count =
                                tab.id === "main-board"
                                    ? (project.tasks?.length ?? 0)
                                    : tab.id === "members"
                                    ? (project.members?.length ?? 0)
                                    : tab.id === "assets"
                                    ? (project.metadata?.assets?.length ?? project.assets?.length ?? 0)
                                    : null;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                                        isActive
                                            ? "text-[var(--app-text)] border-[var(--app-text)]"
                                            : "text-[var(--app-muted)] border-transparent hover:text-[var(--app-text)] hover:border-[var(--app-border)]"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{tab.label}</span>
                                    {count !== null && count > 0 && (
                                        <span className={`text-[10px] tabular-nums font-normal transition-colors ${
                                            isActive
                                                ? "text-[var(--app-muted)]"
                                                : "text-[var(--app-muted)]/70"
                                        }`}>
                                            ({count})
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Progress Gauge (Repositioned to the right of tabs for balanced layout) */}
                    <div className="hidden sm:flex items-center gap-2.5 text-[11px] shrink-0" title="Project Completion Progress">
                        <span className="text-[var(--app-muted)]">Progress</span>
                        <div className="w-28 sm:w-36 h-1.5 bg-[var(--app-border)]/60 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--status-completed,#15803D)] rounded-full transition-all duration-300"
                                style={{ width: `${calculatedProgress}%` }}
                            />
                        </div>
                        <span className="font-semibold text-[var(--app-text)] tabular-nums">
                            {calculatedProgress}%
                        </span>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {activeTab === "main-board" && <ProjectBoardView project={project} onRefresh={loadProjectDetail} />}
                    {activeTab === "members" && <ProjectMembersView project={project} onRefresh={loadProjectDetail} />}
                    {activeTab === "timeline" && <ProjectTimelineView project={project} />}
                    {activeTab === "analytics" && <ProjectAnalyticsView project={project} />}
                    {activeTab === "assets" && <ProjectAssetsView project={project} onRefresh={loadProjectDetail} />}
                    {activeTab === "settings" && <ProjectSettingsView project={project} onRefresh={loadProjectDetail} />}
                </div>
            </div>

            {/* Edit Project Configuration Modal */}
            <EditProjectModal
                isOpen={isEditProjectModalOpen}
                onClose={() => setIsEditProjectModalOpen(false)}
                project={project}
                onSaved={loadProjectDetail}
            />

            {/* Project Invitations Sidebar Tray */}
            <ProjectInvitationsTray
                isOpen={isManageInvitationsOpen}
                onClose={() => setIsManageInvitationsOpen(false)}
                activeProjectId={project.id}
                onRefresh={loadProjectDetail}
            />
        </div>
    );
}
