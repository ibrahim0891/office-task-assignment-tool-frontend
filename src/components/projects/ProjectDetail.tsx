"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
    LayoutGrid, Users, Calendar, BarChart2, 
    Settings, ChevronLeft, FolderKanban, 
    Building2, Edit2, FolderGit2
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
import { Button } from "../ui/Button";
import { calculateProjectProgress, calculateProjectHealth } from "../../utils/projectProgress";
import { getProjectPermissions } from "../../utils/projectPermissions";
import { calculateDaySpan, formatDaySpan, calculateRemainingDays } from "../../utils/date";

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

    const status = calculateProjectHealth(project);
    const leaders = (project.members || []).filter((m: any) => m.role === "Leader" || m.role === "LEADER");

    // Format dates to YYYY-MM-DD for display
    const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        return d.toISOString().split("T")[0];
    };


    const permissions = getProjectPermissions(project, currentUser, userRole, currentTeam);
    const canManageTasks = permissions.canManageTasks;

    const calculatedProgress = Array.isArray(project.tasks) && project.tasks.length > 0
        ? calculateProjectProgress(project.tasks, project.columns)
        : (project.progress !== undefined ? project.progress : 0);

    const remainingDays = calculateRemainingDays(project.endDate);

    return (
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
                {/* Level 1: Clean Project Header (Single focused row) */}
                <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-5 py-3 flex items-center justify-between gap-4 select-none">
                    {/* Left: Back Link, Emoji, Title, Team & Status */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Back to Projects link */}
                        <Link
                            href="/projects"
                            className="p-1.5 -ml-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] border border-transparent hover:border-[var(--app-border)] rounded-[4px] transition-colors shrink-0"
                            title="Back to Projects"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Link>

                        {/* Project Emoji */}
                        {project.emoji ? (
                            <span className="text-xl emoji-font shrink-0 leading-none">{project.emoji}</span>
                        ) : (
                            <FolderKanban className="w-5 h-5 text-[var(--app-muted)] shrink-0" />
                        )}

                        {/* Title & Inline Metadata (Status + Team) */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                            <h1
                                className="font-heading text-base sm:text-lg font-bold tracking-tight text-[var(--app-text)] truncate leading-snug max-w-[280px] sm:max-w-[400px] lg:max-w-[600px]"
                                title={project.title}
                            >
                                {project.title}
                            </h1>

                            {/* Dynamic Status Indicator next to Title */}
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${status.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                <span>{status.label}</span>
                            </span>

                            {/* Owning Team Tag */}
                            {project.team && (
                                <span className="text-[11px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] px-2 py-0.5 rounded-[3px] border border-[var(--app-border)] flex items-center gap-1 shrink-0" title={`Owning Team: ${project.team.name}`}>
                                    {project.team.emoji ? (
                                        <span className="emoji-font text-[10px] shrink-0">{project.team.emoji}</span>
                                    ) : (
                                        <Building2 className="w-3 h-3 shrink-0 text-[var(--app-muted)]" />
                                    )}
                                    <span className="truncate max-w-[120px]">{project.team.name}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Dates & Primary Action */}
                    <div className="flex items-center gap-3 shrink-0 text-xs text-[var(--app-muted)]">
                        {/* Timeline Date Range */}
                        {(project.startDate || project.endDate) && (
                            <div
                                className="hidden md:flex items-center gap-1.5 bg-[var(--app-bg)] px-2.5 py-1 rounded-[3px] border border-[var(--app-border)] font-medium text-[11px]"
                                title={project.startDate && project.endDate ? `Timeline: ${formatDate(project.startDate)} – ${formatDate(project.endDate)} (${formatDaySpan(calculateDaySpan(project.startDate, project.endDate))})` : "Project Timeline"}
                            >
                                <Calendar className="w-3 h-3 text-[var(--app-muted)] shrink-0" />
                                <span>{formatDate(project.startDate) || "—"}</span>
                                <span>–</span>
                                <span>{formatDate(project.endDate) || "—"}</span>
                            </div>
                        )}

                        {/* Edit Project Button */}
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
                                Edit Project
                            </Button>
                        )}
                    </div>
                </div>

                {/* Project Description (Dynamic TipTap HTML with Max Height and Scroll) */}
                {project.description && (
                    <div className="shrink-0 px-5 py-2.5 bg-[var(--app-card)]/30 border-b border-[var(--app-border)] select-text">
                        <div
                            className="max-h-24 sm:max-h-28 overflow-y-auto pr-2 text-xs leading-relaxed text-[var(--app-text)]/85 prose prose-xs dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: project.description }}
                        />
                    </div>
                )}

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
                                    className={`relative flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap rounded-none ${
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
