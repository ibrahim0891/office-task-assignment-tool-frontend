"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, LayoutGrid, Users, Calendar, BarChart2, Loader2, Mail, Settings, Plus, ChevronRight, FolderKanban, Building2 } from "lucide-react";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import ProjectBoardView from "./ProjectBoardView";
import ProjectMembersView from "./ProjectMembersView";
import ProjectTimelineView from "./ProjectTimelineView";
import ProjectAnalyticsView from "./ProjectAnalyticsView";
import ProjectSettingsView from "./ProjectSettingsView";
import ProjectInvitationsTray from "./ProjectInvitationsTray";
import CreateProjectTaskModal from "./CreateProjectTaskModal";
import { useProjectDetail } from "../../hooks/useProjectSWR";
import ProjectDetailSkeleton from "./ProjectDetailSkeleton";
import { UserAvatar } from "../ui/UserAvatar";

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

type Tab = "main-board" | "members" | "timeline" | "analytics" | "settings";

const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "main-board", label: "Main Tasks", icon: LayoutGrid },
    { id: "members", label: "Members", icon: Users },
    { id: "timeline", label: "Timeline", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "settings", label: "Settings", icon: Settings },
];

export default function ProjectDetail() {
    const params = useParams();
    const projectId = params.id as string;
    const { currentTeam, currentUser, userRole, isManageInvitationsOpen, setIsManageInvitationsOpen, projectInvitations } = useWorkspace();

    const { project, isLoading, mutate: refreshProject } = useProjectDetail(projectId, currentTeam?.id);
    const [activeTab, setActiveTab] = useState<Tab>("main-board");
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

    const loadProjectDetail = React.useCallback(async () => {
        await refreshProject();
    }, [refreshProject]);

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

    const currentProjectMember = (project.members || []).find(
        (m: any) => m.userId === currentUser?.id || m.user?.id === currentUser?.id
    );
    const isOwningWorkspaceLeader =
        userRole === "LEADER" && currentTeam?.id === project.teamId;
    const isProjectManager =
        project.managerId === currentUser?.id ||
        project.manager?.id === currentUser?.id ||
        (currentProjectMember?.role || "").toUpperCase() === "MANAGER";
    const isProjectLeader =
        isProjectManager ||
        isOwningWorkspaceLeader ||
        (currentProjectMember?.role || "").toUpperCase() === "LEADER";

    const canManageTasks = isProjectManager || isProjectLeader;
    const canManageInvitations = isProjectManager || isProjectLeader;

    const pendingProjectInvitesCount = (project.invitations?.length || 0) + (projectInvitations?.length || 0);

    return (
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
                {/* Project Header Bar */}
                <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-5 py-3 flex flex-col gap-2.5 select-none">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--app-muted)]">
                        <Link href="/projects" className="hover:text-[var(--app-text)] transition-colors">
                            Projects
                        </Link>
                        <ChevronRight className="w-3 h-3 text-[var(--app-muted)]" />
                        <span className="font-medium text-[var(--app-text)] truncate max-w-[280px]">
                            {project.title}
                        </span>
                    </div>

                    {/* Top Row: Back button, Title, Status */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link
                                href="/projects"
                                className="p-1.5 border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] rounded-[2px] transition-colors shrink-0"
                                title="Back to Projects"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            {project.emoji ? (
                                <span className="text-lg emoji-font shrink-0">{project.emoji}</span>
                            ) : (
                                <FolderKanban className="w-5 h-5 text-[var(--app-muted)] shrink-0" />
                            )}
                            <h1 className="text-lg font-semibold tracking-tight text-[var(--app-text)] truncate">
                                {project.title}
                            </h1>
                            {project.team && (
                                <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] bg-[var(--app-bg)] text-[var(--app-text)] flex items-center gap-1.5" title={`Owning Team: ${project.team.name}`}>
                                    {project.team.emoji ? (
                                        <span className="emoji-font text-xs shrink-0">{project.team.emoji}</span>
                                    ) : (
                                        <Building2 className="w-2.5 h-2.5 shrink-0 text-[var(--app-muted)]" />
                                    )}
                                    <span className="truncate">{project.team.name}</span>
                                </span>
                            )}
                            <span
                                className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-[2px] border flex items-center gap-1 ${status.color} ${status.bg} ${status.border}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                {status.label}
                            </span>
                        </div>

                        {/* Progress & Timeline */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 text-[10px] text-[var(--app-muted)]">
                                <span>{formatDate(project.startDate)}</span>
                                <ArrowRight className="w-3 h-3" />
                                <span>{formatDate(project.endDate)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 border border-[var(--app-border)] px-2 py-1 rounded-[2px] bg-[var(--app-bg)]">
                                <span className="text-[9px] text-[var(--app-muted)]">Progress</span>
                                <span className="text-[11px] font-medium text-[var(--app-text)] tabular-nums">
                                    {project.progress}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Manager, Leaders, Members count */}
                    <div className="flex items-center gap-4 text-[10px]">
                        {/* Manager */}
                        {project.manager && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[var(--app-muted)]">Manager:</span>
                                <UserAvatar
                                    name={project.manager.name}
                                    avatarUrl={project.manager.avatarUrl}
                                    size="sm"
                                    title={project.manager.name}
                                />
                                <span className="font-medium text-[var(--app-text)]">
                                    {project.manager.name}
                                </span>
                            </div>
                        )}

                        {/* Divider */}
                        {project.manager && <div className="w-px h-4 bg-[var(--app-border)]" />}

                        {/* Leaders */}
                        {leaders.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[var(--app-muted)]">
                                    {leaders.length === 1 ? "Lead:" : "Leads:"}
                                </span>
                                <div className="flex -space-x-1">
                                    {leaders.map((l: any) => (
                                        <UserAvatar
                                            key={l.userId}
                                            name={l.user?.name || ""}
                                            avatarUrl={l.user?.avatarUrl}
                                            size="sm"
                                            title={l.user?.name || ""}
                                        />
                                    ))}
                                </div>
                                <span className="font-medium text-[var(--app-text)]">
                                    {leaders.map((l: any) => l.user?.name?.split(" ")[0]).join(", ")}
                                </span>
                            </div>
                        )}

                        {/* Divider */}
                        {leaders.length > 0 && <div className="w-px h-4 bg-[var(--app-border)]" />}

                        {/* Member Count */}
                        <span className="text-[var(--app-muted)]">
                            <span className="font-medium text-[var(--app-text)] tabular-nums">
                                {project.members?.length || 0}
                            </span>{" "}
                            members
                        </span>
                    </div>
                </div>

                {/* Tab Switcher & Invitations Drawer Trigger */}
                <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-5 flex items-center justify-between select-none">
                    <div className="flex items-center gap-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium transition-colors cursor-pointer border-b-2 ${
                                        isActive
                                            ? "text-[var(--app-text)] border-[var(--app-text)]"
                                            : "text-[var(--app-muted)] border-transparent hover:text-[var(--app-text)] hover:border-[var(--app-border)]"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 py-1.5">
                        {/* Right Sidebar Invitations Toggle */}
                        {canManageInvitations && (
                            <button
                                type="button"
                                onClick={() => setIsManageInvitationsOpen(!isManageInvitationsOpen)}
                                className={`relative corner-brackets-4 text-[11px] font-medium px-3.5 py-1.5 rounded-[2px] border transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                    isManageInvitationsOpen
                                        ? "bg-[var(--app-hover-bg)] text-[var(--app-text)] border-[var(--app-border-strong)] font-semibold"
                                        : "bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
                                }`}
                                title="Toggle Invitations Right Sidebar"
                            >
                                <Mail className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                <span>Invitations</span>
                                {pendingProjectInvitesCount > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-[2px] text-[9px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold tabular-nums">
                                        {pendingProjectInvitesCount}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {activeTab === "main-board" && <ProjectBoardView project={project} onRefresh={loadProjectDetail} />}
                    {activeTab === "members" && <ProjectMembersView project={project} onRefresh={loadProjectDetail} />}
                    {activeTab === "timeline" && <ProjectTimelineView project={project} />}
                    {activeTab === "analytics" && <ProjectAnalyticsView project={project} />}
                    {activeTab === "settings" && <ProjectSettingsView project={project} onRefresh={loadProjectDetail} />}
                </div>
            </div>

            {/* Project Invitations Sidebar Tray */}
            <ProjectInvitationsTray
                isOpen={isManageInvitationsOpen}
                onClose={() => setIsManageInvitationsOpen(false)}
                activeProjectId={project.id}
                onRefresh={loadProjectDetail}
            />

            {/* Create Project Main Task Modal */}
            <CreateProjectTaskModal
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                project={project}
                onRefresh={loadProjectDetail}
            />
        </div>
    );
}
