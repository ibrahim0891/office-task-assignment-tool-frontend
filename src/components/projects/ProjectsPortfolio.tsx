"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ArrowRight, Loader2, Folder, Mail } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { api } from "../../api";
import CreateProjectModal from "./CreateProjectModal";
import ManageFoldersTray from "../ManageFoldersTray";
import ProjectInvitationsTray from "./ProjectInvitationsTray";

function getStatusConfig(status: string) {
    switch (status) {
        case "ON_TRACK":
        case "OnTrack":
            return { label: "On Track", color: "text-[#22863A]", bg: "bg-[#22863A]/10", border: "border-[#22863A]/20", dot: "bg-[#22863A]" };
        case "AT_RISK":
        case "AtRisk":
            return { label: "At Risk", color: "text-[#B08800]", bg: "bg-[#B08800]/10", border: "border-[#B08800]/20", dot: "bg-[#B08800]" };
        case "ACTIVE":
        case "Active":
            return { label: "Active", color: "text-[#0284C7]", bg: "bg-[#0284C7]/10", border: "border-[#0284C7]/20", dot: "bg-[#0284C7]" };
        case "COMPLETED":
        case "Completed":
            return { label: "Completed", color: "text-[#22863A]", bg: "bg-[#22863A]/10", border: "border-[#22863A]/20", dot: "bg-[#22863A]" };
        case "ARCHIVED":
        case "Archived":
            return { label: "Archived", color: "text-[#888883]", bg: "bg-[#888883]/10", border: "border-[#888883]/20", dot: "bg-[#888883]" };
        default:
            return { label: status, color: "text-[#888883]", bg: "bg-[#888883]/10", border: "border-[#888883]/20", dot: "bg-[#888883]" };
    }
}

function getInitials(name: string) {
    if (!name) return "";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function AvatarChip({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
    const s = size === "sm" ? "w-6 h-6 text-[9px]" : "w-7 h-7 text-[10px]";
    return (
        <div
            className={`${s} rounded-full border border-[var(--app-border-strong)] bg-[var(--app-bg)] flex items-center justify-center font-semibold text-[var(--app-text)] shrink-0`}
            title={name}
        >
            {getInitials(name)}
        </div>
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

    return (
        <Link href={`/projects/${project.id}`} className="block group">
            <div className="relative bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets p-4 flex flex-col gap-3 hover:border-[var(--app-border-strong)] transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg emoji-font shrink-0">{project.emoji || "📁"}</span>
                        <h3 className="text-[12px] font-semibold text-[var(--app-text)] truncate">
                            {project.title}
                        </h3>
                    </div>
                    <span
                        className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-[2px] border ${status.color} ${status.bg} ${status.border} flex items-center gap-1`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                    </span>
                </div>

                <p className="text-[10px] text-[var(--app-muted)] leading-relaxed line-clamp-2">
                    {project.description}
                </p>

                <div className="flex items-center gap-3 text-[10px]">
                    {project.manager && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[var(--app-muted)]">Mgr:</span>
                            <AvatarChip name={project.manager.name} />
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
                                    <AvatarChip key={m.id} name={m.user?.name || ""} />
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
                            {project.progress !== undefined ? project.progress : 0}%
                        </span>
                    </div>
                    <div className="w-full h-1 bg-[var(--app-border)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--app-text)] transition-all duration-300"
                            style={{ width: `${project.progress !== undefined ? project.progress : 0}%` }}
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
    const [summary, setSummary] = useState<any>({
        activeProjects: 0,
        onTimeRate: 100,
        criticalSLABreaches: 0,
        totalProjects: 0,
    });
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

    const foldersWithProjects = folders.filter((folder) =>
        projects.some((p) => p.folderId === folder.id)
    );

    useEffect(() => {
        if (foldersWithProjects.length > 0) {
            if (!activeFolderId || !foldersWithProjects.some((f) => f.id === activeFolderId)) {
                setActiveFolderId(foldersWithProjects[0].id);
            }
        } else {
            setActiveFolderId(null);
        }
    }, [foldersWithProjects, activeFolderId]);

    useEffect(() => {
        if (!currentTeam?.id) return;
        api.getPortfolioSummary(currentTeam.id, currentUser?.id)
            .then(setSummary)
            .catch((err) => console.error("Error loading portfolio summary:", err));
    }, [currentTeam?.id, currentUser?.id, projects]);

    const isLeader = userRole === "LEADER";

    return (
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col gap-5 select-none">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="font-heading text-xl">Projects</h1>
                        <p className="text-base text-[var(--app-muted)] mt-0.5">
                            Portfolio overview across all active projects
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Invitations Tray Trigger Button */}
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
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold">
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
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(true)}
                                    className="bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] text-[11px] font-medium px-3.5 py-1.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                                >
                                    <Plus className="w-3.5 h-3.5" />
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

                {/* KPI Stats Row */}
                <div className="corner-brackets grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--app-border)] border border-[var(--app-border)]">
                    <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                        <span className="eyebrow">Active Projects</span>
                        <span className="text-2xl font-heading text-[var(--app-text)]">
                            {summary.activeProjects}
                        </span>
                    </div>
                    <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                        <span className="eyebrow">On-Time Rate</span>
                        <span className="text-2xl font-heading text-[var(--app-text)]">
                            {summary.onTimeRate}%
                        </span>
                    </div>
                    <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                        <span className="eyebrow">SLA Breaches</span>
                        <span className={`text-2xl font-heading ${summary.criticalSLABreaches > 0 ? "text-[var(--color-error)]" : "text-[var(--app-text)]"}`}>
                            {summary.criticalSLABreaches}
                        </span>
                    </div>
                    <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                        <span className="eyebrow">Total Projects</span>
                        <span className="text-2xl font-heading text-[var(--app-text)]">
                            {summary.totalProjects}
                        </span>
                    </div>
                </div>

                {/* Folder Tabs */}
                {!isProjectsLoading && foldersWithProjects.length > 0 && (
                    <div className="shrink-0 border-b border-[var(--app-border)] flex flex-wrap items-center gap-2 select-none">
                        {foldersWithProjects.map((folder) => {
                            const isSelected = activeFolderId === folder.id;
                            const folderProjects = projects.filter((p) => p.folderId === folder.id);
                            return (
                                <button
                                    key={folder.id}
                                    onClick={() => setActiveFolderId(folder.id)}
                                    className={`py-2 px-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider font-semibold border-b-2 transition-colors cursor-pointer ${
                                        isSelected
                                            ? "border-[var(--app-text)] text-[var(--app-text)]"
                                            : "border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                    }`}
                                >
                                    <span className="emoji-font text-xs">{folder.emoji || "📁"}</span>
                                    <span>{folder.name}</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${isSelected ? "bg-[var(--app-text)] text-[var(--app-bg)] font-bold" : "bg-[var(--app-border)] text-[var(--app-muted)] font-medium"}`}>
                                        {folderProjects.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Project Cards Grid */}
                <div className="flex flex-col gap-6">
                    {isProjectsLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" />
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="border border-dashed border-[var(--app-border)] rounded-[4px] py-16 text-center">
                            <p className="text-base text-[var(--app-muted)] mb-2">No projects found</p>
                            {isLeader && (
                                <button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="text-[11px] font-semibold text-[var(--app-text)] underline hover:no-underline"
                                >
                                    Create your first project
                                </button>
                            )}
                        </div>
                    ) : (
                        (() => {
                            const activeFolder = folders.find((f) => f.id === activeFolderId);
                            if (!activeFolder) return null;
                            const folderProjects = projects.filter((p) => p.folderId === activeFolder.id);
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {folderProjects.map((project) => (
                                        <ProjectCard key={project.id} project={project} />
                                    ))}
                                </div>
                            );
                        })()
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
