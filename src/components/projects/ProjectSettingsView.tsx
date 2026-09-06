"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    Trash2, 
    AlertTriangle, 
    Loader2, 
    ShieldAlert, 
    BookOpen, 
    ShieldCheck, 
    Calculator, 
    Clock, 
    Layers, 
    CheckCircle2, 
    TrendingUp, 
    Users, 
    FolderKanban, 
    HelpCircle,
    ChevronDown,
    ChevronRight,
    Info,
    Sparkles,
    Sliders,
    Workflow,
    Calendar,
    FolderGit2,
    Link2,
    Pin,
    FileText,
    Lock
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import { getProjectPermissions } from "../../utils/projectPermissions";

interface ProjectSettingsViewProps {
    project: any;
    onRefresh?: (silent?: boolean) => void;
}

export default function ProjectSettingsView({ project }: ProjectSettingsViewProps) {
    const router = useRouter();
    const { currentUser, userRole, currentTeam } = useWorkspace();
    const permissions = getProjectPermissions(project, currentUser, userRole, currentTeam);
    const isProjectManager = permissions.isProjectManager;

    const [activeSection, setActiveSection] = useState<string>("all");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteProject = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        try {
            setIsDeleting(true);
            await api.deleteProject(project.id);
            toast.success("Project deleted successfully.");
            router.push("/projects");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete project.");
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 select-none bg-[var(--app-bg)] text-[var(--app-text)]">
            <div className="w-full flex flex-col gap-6">
                
                {/* Header Banner */}
                <div className="border-b border-[var(--app-border)] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[var(--app-muted)]" />
                            <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[var(--app-text)]">
                                Project Module Guide & Settings
                            </h2>
                        </div>
                        <p className="text-xs text-[var(--app-muted)] mt-1">
                            Comprehensive documentation on architecture, access levels, deadline tracking, and project configuration.
                        </p>
                    </div>

                    {/* Quick navigation anchor tags */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                        <span className="text-[var(--app-muted)] text-[10px] uppercase font-semibold tracking-wider mr-1">Jump to:</span>
                        <a href="#hierarchy" className="px-2 py-0.5 rounded-[2px] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors">
                            Architecture
                        </a>
                        <a href="#roles" className="px-2 py-0.5 rounded-[2px] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors">
                            Roles & Access
                        </a>
                        <a href="#metrics" className="px-2 py-0.5 rounded-[2px] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors">
                            Deadlines & Metrics
                        </a>
                        <a href="#progress" className="px-2 py-0.5 rounded-[2px] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors">
                            Progress Engine
                        </a>
                    </div>
                </div>

                {/* 1. Structural Architecture & Hierarchy */}
                <section id="hierarchy" className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[4px] p-5 shadow-2xs flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-[var(--app-border)] pb-3">
                        <FolderKanban className="w-4 h-4 text-[var(--app-muted)]" />
                        <h3 className="text-sm font-bold text-[var(--app-text)]">
                            1. Project Module Hierarchy & Structure
                        </h3>
                    </div>

                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        The Project Management system is organized into a four-tiered hierarchy designed for clear delegation, macro-portfolio visibility, and micro-task execution.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3.5 flex flex-col gap-1.5">
                            <span className="text-[10px] font-mono font-semibold text-[var(--app-muted)] uppercase tracking-wider">Level 1</span>
                            <span className="font-semibold text-[var(--app-text)] flex items-center gap-1.5">
                                <span>📁 Folders</span>
                            </span>
                            <p className="text-[11px] text-[var(--app-muted)] leading-relaxed mt-0.5">
                                High-level portfolio grouping (e.g. Q3 Initiatives, Client Accounts, Department Campaigns).
                            </p>
                        </div>

                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3.5 flex flex-col gap-1.5">
                            <span className="text-[10px] font-mono font-semibold text-[var(--app-muted)] uppercase tracking-wider">Level 2</span>
                            <span className="font-semibold text-[var(--app-text)] flex items-center gap-1.5">
                                <span>🚀 Projects</span>
                            </span>
                            <p className="text-[11px] text-[var(--app-muted)] leading-relaxed mt-0.5">
                                Scoped initiatives with a timeline, Project Manager, squad leaders, and health metrics.
                            </p>
                        </div>

                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3.5 flex flex-col gap-1.5">
                            <span className="text-[10px] font-mono font-semibold text-[var(--app-muted)] uppercase tracking-wider">Level 3</span>
                            <span className="font-semibold text-[var(--app-text)] flex items-center gap-1.5">
                                <span>📋 Main Tasks</span>
                            </span>
                            <p className="text-[11px] text-[var(--app-muted)] leading-relaxed mt-0.5">
                                Key milestones and deliverables grouped under workflow columns (Backlog, In Progress, Review, Done).
                            </p>
                        </div>

                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3.5 flex flex-col gap-1.5">
                            <span className="text-[10px] font-mono font-semibold text-[var(--app-muted)] uppercase tracking-wider">Level 4</span>
                            <span className="font-semibold text-[var(--app-text)] flex items-center gap-1.5">
                                <span>⚡ Subtasks</span>
                            </span>
                            <p className="text-[11px] text-[var(--app-muted)] leading-relaxed mt-0.5">
                                Actionable atomic work units managed on the Subtask Kanban board with due dates, assignees, and comments.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 2. Access Levels & Role-Based Permissions (RBAC) */}
                <section id="roles" className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[4px] p-5 shadow-2xs flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[var(--app-muted)]" />
                            <h3 className="text-sm font-bold text-[var(--app-text)]">
                                2. Access Levels & Role Hierarchy
                            </h3>
                        </div>
                        <span className="text-[10px] text-[var(--app-muted)] bg-[var(--app-bg)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)]">
                            Your Current Role: <strong className="text-[var(--app-text)] font-semibold">{permissions.userRoleLabel}</strong>
                        </span>
                    </div>

                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        Access control operates on a hierarchical permission matrix ensuring security and accountability across teams and external contributors.
                    </p>

                    <div className="border border-[var(--app-border)] rounded-[3px] overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)] text-[10.5px] font-semibold text-[var(--app-muted)]">
                                    <th className="py-2.5 px-4">Role</th>
                                    <th className="py-2.5 px-4">Scope & Authority</th>
                                    <th className="py-2.5 px-4">Permissions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--app-border)] text-[11.5px]">
                                <tr className="hover:bg-[var(--app-hover-bg)] transition-colors">
                                    <td className="py-3 px-4 font-semibold text-[var(--app-text)] whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[var(--color-error)]" />
                                            <span>Project Manager</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-[var(--app-muted)]">
                                        Creator or assigned owner of the project.
                                    </td>
                                    <td className="py-3 px-4 text-[var(--app-text)]">
                                        Full project configuration, edit details, manage members/roles, invite external teammates, create/archive tasks, and permanently delete project.
                                    </td>
                                </tr>

                                <tr className="hover:bg-[var(--app-hover-bg)] transition-colors">
                                    <td className="py-3 px-4 font-semibold text-[var(--app-text)] whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[var(--priority-high)]" />
                                            <span>Project Leader</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-[var(--app-muted)]">
                                        Project Squad Leader or Workspace Leader.
                                    </td>
                                    <td className="py-3 px-4 text-[var(--app-text)]">
                                        Create and organize Main Tasks, customize workflow columns, send and manage project invitations, assign deliverables to team members.
                                    </td>
                                </tr>

                                <tr className="hover:bg-[var(--app-hover-bg)] transition-colors">
                                    <td className="py-3 px-4 font-semibold text-[var(--app-text)] whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                                            <span>Project Member</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-[var(--app-muted)]">
                                        Active project team collaborator.
                                    </td>
                                    <td className="py-3 px-4 text-[var(--app-text)]">
                                        Create subtasks, move own subtasks across Kanban columns, log time estimates, add task comments, and check off checklist deliverables.
                                    </td>
                                </tr>

                                <tr className="hover:bg-[var(--app-hover-bg)] transition-colors">
                                    <td className="py-3 px-4 font-semibold text-[var(--app-text)] whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[var(--app-muted)]" />
                                            <span>Viewer / Observer</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-[var(--app-muted)]">
                                        Stakeholder or external reviewer.
                                    </td>
                                    <td className="py-3 px-4 text-[var(--app-text)]">
                                        Read-only access to view task boards, timelines, member rosters, and analytics reports.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 3. Definitions, SLA Breaches & Workload Metrics */}
                <section id="metrics" className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[4px] p-5 shadow-2xs flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-[var(--app-border)] pb-3">
                        <Calculator className="w-4 h-4 text-[var(--app-muted)]" />
                        <h3 className="text-sm font-bold text-[var(--app-text)]">
                            3. Core Formulas, SLA Breach Rules & Calculations
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Estimated Duration / Day Count */}
                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-[var(--app-text)] flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                    <span>Estimated Duration / Days Count</span>
                                </span>
                                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[var(--app-card)] text-[var(--app-text)] border border-[var(--app-border)] font-semibold">
                                    Date Span Formula
                                </span>
                            </div>
                            <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                                <strong>Estimated Date / Duration</strong> is calculated as the <strong className="text-[var(--app-text)]">inclusive day count between the Start Date and Due Date</strong>. Each calendar day in the scheduled window represents billable/working duration.
                            </p>
                            <div className="mt-1 p-2.5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] text-[10.5px] font-mono text-[var(--app-text)] leading-relaxed">
                                <code>EstimatedDays = Math.max(1, Math.ceil((dueDate - startDate) / 86,400,000) + 1)</code>
                            </div>
                            <div className="text-[10.5px] text-[var(--app-muted)] flex flex-col gap-1 pt-1">
                                <span>• <strong>SHARED Mode:</strong> Estimated days divided equally across assigned collaborators.</span>
                                <span>• <strong>PARALLEL Mode:</strong> Each assignee commits the full duration concurrently.</span>
                            </div>
                        </div>

                        {/* 2. SLA Breach & Incident Escalation */}
                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-[var(--color-error)] flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>SLA Breach & Incident Escalation</span>
                                </span>
                                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 font-semibold">
                                    Risk & SLA Rules
                                </span>
                            </div>
                            <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                                When a task remains incomplete past its due date, the SLA engine evaluates risk and triggers automatic incident tracking:
                            </p>
                            <div className="mt-1 p-2.5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] text-[10.5px] font-mono text-[var(--app-text)] flex flex-col gap-1">
                                <div>• <code>OVERDUE</code>: <code>currentDate &gt; dueDate AND isCompleted == false</code></div>
                                <div>• <code>CRITICAL_SLA (Level 1)</code>: <code>daysLate &gt;= 2</code> &rarr; Incident logged</div>
                                <div>• <code>ESCALATION (Level 2)</code>: Unresolved for &ge; 48h (Leader Inaction)</div>
                            </div>
                        </div>

                        {/* 3. Team Workload & Capacity Calculation */}
                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-[var(--app-text)] flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                    <span>Team Workload & Capacity Engine</span>
                                </span>
                                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[var(--app-card)] text-[var(--app-text)] border border-[var(--app-border)] font-semibold">
                                    Allocation %
                                </span>
                            </div>
                            <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                                Workload measures committed daily effort across all overlapping active tasks relative to each member&apos;s assigned <strong className="text-[var(--app-text)]">Daily Capacity</strong> (standard = 1.0 day/day).
                            </p>
                            <div className="mt-1 p-2.5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] text-[10.5px] font-mono text-[var(--app-text)] leading-relaxed">
                                <code>Workload% = (Sum(ActiveTaskDailyEffort) / TotalMemberCapacity) * 100%</code>
                            </div>
                            <span className="text-[10.5px] text-[var(--app-muted)]">
                                Over 100% allocation triggers capacity warning badges on team rosters and timelines.
                            </span>
                        </div>

                        {/* 4. On-Time Completion Rate & Stale Rules */}
                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-[var(--color-success)] flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>On-Time Rate & Stale Detection</span>
                                </span>
                                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 font-semibold">
                                    Velocity Health
                                </span>
                            </div>
                            <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                                Evaluates delivery velocity and flags stagnation. Tasks carried forward across &ge; 3 daily cycles are highlighted for scope or blocker review.
                            </p>
                            <div className="mt-1 p-2.5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] text-[10.5px] font-mono text-[var(--app-text)] flex flex-col gap-1">
                                <div>• <code>OnTimeRate = (OnTimeCompleted / TotalCompleted) * 100%</code></div>
                                <div>• <code>StaleTask = carryCount &gt;= 3 AND isCompleted == false</code></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Fine-Grained 4-Stage Progress Engine */}
                <section id="progress" className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[4px] p-5 shadow-2xs flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-[var(--app-border)] pb-3">
                        <Workflow className="w-4 h-4 text-[var(--app-muted)]" />
                        <h3 className="text-sm font-bold text-[var(--app-text)]">
                            4. 4-Stage Workflow Progress Engine
                        </h3>
                    </div>

                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        Rather than binary 0% vs 100% calculations, the system uses a fine-grained 4-stage progression engine. Subtasks contribute weighted progress based on their workflow column stage:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3 text-center flex flex-col gap-1">
                            <span className="font-mono text-lg font-bold text-[var(--app-muted)]">0%</span>
                            <span className="font-semibold text-[11px] text-[var(--app-text)]">Stage 1: To Do</span>
                            <span className="text-[10px] text-[var(--app-muted)]">Backlog / Open</span>
                        </div>

                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3 text-center flex flex-col gap-1">
                            <span className="font-mono text-lg font-bold text-[var(--status-in-progress,#7C3AED)]">25%</span>
                            <span className="font-semibold text-[11px] text-[var(--app-text)]">Stage 2: In Progress</span>
                            <span className="text-[10px] text-[var(--app-muted)]">Active Dev / Doing</span>
                        </div>

                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3 text-center flex flex-col gap-1">
                            <span className="font-mono text-lg font-bold text-[var(--status-at-risk,#D97706)]">75%</span>
                            <span className="font-semibold text-[11px] text-[var(--app-text)]">Stage 3: In Review</span>
                            <span className="text-[10px] text-[var(--app-muted)]">QA / Testing / Approval</span>
                        </div>

                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3 text-center flex flex-col gap-1">
                            <span className="font-mono text-lg font-bold text-[var(--status-completed,#15803D)]">100%</span>
                            <span className="font-semibold text-[11px] text-[var(--app-text)]">Stage 4: Completed</span>
                            <span className="text-[10px] text-[var(--app-muted)]">Done / Closed</span>
                        </div>
                    </div>

                    <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] text-[11px] text-[var(--app-muted)]">
                        <strong className="text-[var(--app-text)] font-semibold">Cumulative Project Progress:</strong> The average fine-grained score of all subtasks across all main tasks in the project portfolio.
                    </div>
                </section>

                {/* 5. Project Assets & Documentation Governance */}
                <section id="assets-docs" className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[4px] p-5 shadow-2xs flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-[var(--app-border)] pb-3">
                        <FolderGit2 className="w-4 h-4 text-[var(--app-muted)]" />
                        <h3 className="text-sm font-bold text-[var(--app-text)]">
                            5. Project Assets & Documentation Governance
                        </h3>
                    </div>

                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        The <strong>Assets & Docs</strong> tab serves as the central hub for team repositories, design boards, staging URLs, spreadsheets, and markdown specifications. Access and modification rights follow strict ownership boundaries:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-[var(--color-success)] text-[11px]">
                                <Users className="w-3.5 h-3.5" />
                                <span>Members & Contributors</span>
                            </div>
                            <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                                Can add new external links and internal docs. Can edit and delete <strong>only the assets they personally created</strong>. Cannot modify or remove assets created by teammates.
                            </p>
                        </div>

                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-[#7C3AED] text-[11px]">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Leaders & Managers</span>
                            </div>
                            <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                                Elevated moderation rights. Can edit, reorder, delete, or promote/pin <strong>any resource</strong> to the Key Resources hero shelf across the entire project.
                            </p>
                        </div>

                        <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-[var(--app-muted)] text-[11px]">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Viewers & Stakeholders</span>
                            </div>
                            <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                                Read-only access. Can inspect links, copy URLs, and open markdown documentation in the reader drawer, but cannot create or modify assets.
                            </p>
                        </div>
                    </div>

                    <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] flex flex-col gap-1 text-[11px]">
                        <span className="font-semibold text-[var(--app-text)] flex items-center gap-1.5">
                            <Pin className="w-3 h-3 text-[#D97706]" />
                            <span>Pinned "Key Resources" Shelf</span>
                        </span>
                        <p className="text-[var(--app-muted)] leading-relaxed">
                            Critical project anchors (such as primary Figma files, main Git repositories, PRDs, and live staging dashboards) can be pinned to remain persistently visible at the top of the tab for the entire squad.
                        </p>
                    </div>
                </section>

                {/* 6. Danger Zone & Project Deletion */}
                <section className="bg-[var(--app-card)] border border-[var(--color-error)]/30 rounded-[4px] overflow-hidden flex flex-col shadow-2xs mt-2">
                    <div className="px-5 py-3 border-b border-[var(--color-error)]/20 bg-[var(--color-error)]/5 flex items-center justify-between gap-3 min-h-[48px]">
                        <h3 className="text-xs font-bold text-[var(--color-error)] flex items-center gap-1.5 uppercase tracking-wide">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Danger Zone</span>
                        </h3>
                    </div>

                    <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {isProjectManager ? (
                            <>
                                <div className="max-w-md">
                                    <p className="text-xs font-semibold text-[var(--app-text)]">
                                        Delete This Project
                                    </p>
                                    <p className="text-[11px] text-[var(--app-muted)] mt-1 leading-relaxed">
                                        Permanently delete <strong className="text-[var(--app-text)] font-semibold">{project.title || project.name}</strong> and all associated main tasks, subtasks, activity feeds, and comments. This action cannot be undone.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleDeleteProject}
                                    disabled={isDeleting}
                                    className={`relative corner-brackets-4 px-3.5 py-1.5 text-[11px] font-medium rounded-[2px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border h-[32px] ${
                                        confirmDelete
                                            ? "bg-[var(--color-error)] text-white border-[var(--color-error)] font-bold animate-pulse"
                                            : "text-[var(--color-error)] hover:bg-[var(--color-error)]/10 border-[var(--color-error)]/30 hover:border-[var(--color-error)]"
                                    }`}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                    <span>{confirmDelete ? "Confirm Permanent Delete?" : "Delete Project"}</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 text-[var(--app-muted)] text-xs">
                                <ShieldAlert className="w-4 h-4 shrink-0 text-[var(--app-muted)]" />
                                <span>
                                    Destructive project deletion is restricted exclusively to the Project Manager ({project.manager?.name || "Manager"}).
                                </span>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
