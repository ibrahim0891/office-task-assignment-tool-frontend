"use client";

import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Users, FolderKanban, RotateCcw } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { api, User } from "@/api";

// Subcomponents
import { SkeletonTeamDetails } from "./SkeletonTeamDetails";
import { TeamDetailsHeader } from "./TeamDetailsHeader";
import { TeamStatsRibbon } from "./TeamStatsRibbon";
import { TeamMembersToolbar, RoleFilterType, SortOptionType } from "./TeamMembersToolbar";
import { TeamMembersTable } from "./TeamMembersTable";
import { TeamMembersGrid } from "./TeamMembersGrid";
import { TeamProjectsSection } from "./TeamProjectsSection";
import { TeamSidebarSummary } from "./TeamSidebarSummary";
import { AddTeamMemberModal } from "./AddTeamMemberModal";
import { EditTeamModal } from "./EditTeamModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function TeamDetailsView() {
    const {
        currentTeam,
        currentUser,
        userRole,
        teamMembers,
        tasks,
        columns,
        projects,
        isProjectsLoading,
        isTasksLoading,
        loadTeamMetadata,
        openMemberProfile,
        setSelectedTaskId,
    } = useWorkspace();

    // Local UI states
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleFilterType>("ALL");
    const [sortOption, setSortOption] = useState<SortOptionType>("name-asc");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [activeTab, setActiveTab] = useState<"members" | "projects">("members");

    // Modal states
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
    const [isRemovingMember, setIsRemovingMember] = useState(false);

    // Initial loading skeleton check
    if (!currentTeam || !currentUser || isTasksLoading) {
        return <SkeletonTeamDetails />;
    }

    const isCurrentUserLeader = userRole === "LEADER";

    // Completed column identification (defensive name check matching ListView standard)
    const completedColumnIds = useMemo(() => {
        return new Set(
            columns
                .filter((c) => {
                    if (c.isComplete) return true;
                    const name = (c.name || "").toLowerCase().trim();
                    return name.includes("done") || name.includes("complete");
                })
                .map((c) => c.id)
        );
    }, [columns]);

    // Active workspace tasks (excluding soft deleted and archived)
    const activeTasks = useMemo(() => {
        return tasks.filter((t) => !t.isSoftDeleted && !t.isArchived);
    }, [tasks]);

    // Categorize members by role
    const leaders = useMemo(() => {
        return teamMembers.filter((m) => m.role === "LEADER");
    }, [teamMembers]);

    const observers = useMemo(() => {
        return teamMembers.filter((m) => m.role === "OBSERVER");
    }, [teamMembers]);

    const regularMembers = useMemo(() => {
        return teamMembers.filter((m) => m.role !== "LEADER" && m.role !== "OBSERVER");
    }, [teamMembers]);

    // Precalculate member task stats in a single $O(T)$ scan
    const statsMap = useMemo(() => {
        const map: Record<string, { active: number; completed: number; total: number }> = {};
        for (const tm of teamMembers) {
            map[tm.user.id] = { active: 0, completed: 0, total: 0 };
        }

        for (const t of activeTasks) {
            const uid = t.assignedToId;
            if (uid && map[uid]) {
                map[uid].total += 1;
                if (completedColumnIds.has(t.columnId) || t.column?.isComplete) {
                    map[uid].completed += 1;
                } else {
                    map[uid].active += 1;
                }
            }
        }
        return map;
    }, [teamMembers, activeTasks, completedColumnIds]);

    // Collective Team Metrics
    const teamMetrics = useMemo(() => {
        const total = activeTasks.length;
        const completed = activeTasks.filter(
            (t) => completedColumnIds.has(t.columnId) || t.column?.isComplete
        ).length;
        const active = total - completed;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const teamProjects = projects.filter((p) => !p.teamId || p.teamId === currentTeam.id);
        const activeProjects = teamProjects.filter((p) => {
            const s = (p.status || "").toUpperCase();
            return s !== "COMPLETED" && s !== "DONE";
        });

        return {
            totalMembers: teamMembers.length,
            leadersCount: leaders.length,
            membersCount: regularMembers.length,
            observersCount: observers.length,
            totalTeamTasks: total,
            activeTeamTasks: active,
            completedTeamTasks: completed,
            teamCompletionRate: rate,
            projectsCount: teamProjects.length,
            activeProjectsCount: activeProjects.length,
        };
    }, [activeTasks, completedColumnIds, currentTeam.id, projects, teamMembers.length, leaders.length, regularMembers.length, observers.length]);

    // Personal Metrics for Current User
    const personalMetrics = useMemo(() => {
        const userTasks = activeTasks.filter((t) => t.assignedToId === currentUser.id);
        const total = userTasks.length;
        const completed = userTasks.filter(
            (t) => completedColumnIds.has(t.columnId) || t.column?.isComplete
        ).length;
        const active = total - completed;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const carry = userTasks.reduce((sum, t) => sum + (t.carryCount || 0), 0);

        return {
            myTotalTasks: total,
            myActiveTasks: active,
            myCompletedTasks: completed,
            myCompletionRate: rate,
            myCarryOverCount: carry,
        };
    }, [activeTasks, completedColumnIds, currentUser.id]);

    // Filtered & Sorted Members
    const displayedMembers = useMemo(() => {
        let result = teamMembers.filter((m) => {
            // Role filter
            if (roleFilter !== "ALL") {
                if (roleFilter === "LEADER" && m.role !== "LEADER") return false;
                if (roleFilter === "OBSERVER" && m.role !== "OBSERVER") return false;
                if (roleFilter === "MEMBER" && (m.role === "LEADER" || m.role === "OBSERVER")) return false;
            }

            // Search query
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            const name = (m.user.fullName || m.user.name || "").toLowerCase();
            const email = (m.user.email || "").toLowerCase();
            const designation = (m.user.designation || "").toLowerCase();
            const role = (m.role || "").toLowerCase();
            return name.includes(q) || email.includes(q) || designation.includes(q) || role.includes(q);
        });

        // Sorting
        result.sort((a, b) => {
            const nameA = (a.user.fullName || a.user.name || "").toLowerCase();
            const nameB = (b.user.fullName || b.user.name || "").toLowerCase();
            const statsA = statsMap[a.user.id] || { active: 0, completed: 0, total: 0 };
            const statsB = statsMap[b.user.id] || { active: 0, completed: 0, total: 0 };

            switch (sortOption) {
                case "name-desc":
                    return nameB.localeCompare(nameA);
                case "tasks-desc":
                    return statsB.active - statsA.active;
                case "completed-desc":
                    return statsB.completed - statsA.completed;
                case "role": {
                    const roleWeight: Record<string, number> = { LEADER: 3, MEMBER: 2, OBSERVER: 1 };
                    const weightA = roleWeight[(a.role || "").toUpperCase()] || 0;
                    const weightB = roleWeight[(b.role || "").toUpperCase()] || 0;
                    if (weightA !== weightB) return weightB - weightA;
                    return nameA.localeCompare(nameB);
                }
                case "name-asc":
                default:
                    return nameA.localeCompare(nameB);
            }
        });

        return result;
    }, [teamMembers, roleFilter, searchQuery, sortOption, statsMap]);

    // Handlers
    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await api.updateTeamMemberRole(currentTeam.id, userId, newRole, currentUser.id);
            toast.success("Member role updated");
            await loadTeamMetadata();
        } catch (err: any) {
            toast.error(err.message || "Failed to update member role");
        }
    };

    const handleConfirmRemoveMember = async () => {
        if (!memberToRemove) return;
        setIsRemovingMember(true);
        try {
            await api.removeTeamMember(currentTeam.id, memberToRemove, currentUser.id);
            toast.success("Member removed from team");
            setMemberToRemove(null);
            await loadTeamMetadata();
        } catch (err: any) {
            toast.error(err.message || "Failed to remove member");
        } finally {
            setIsRemovingMember(false);
        }
    };

    const handleResetFilters = () => {
        setSearchQuery("");
        setRoleFilter("ALL");
    };

    const memberToRemoveObj = teamMembers.find((m) => m.user.id === memberToRemove);
    const memberToRemoveName = memberToRemoveObj
        ? memberToRemoveObj.user.fullName || memberToRemoveObj.user.name || "this member"
        : "this member";

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)] select-text">
            {/* Tier 1 Header */}
            <TeamDetailsHeader
                currentTeam={currentTeam}
                membersCount={teamMembers.length}
                projectsCount={teamMetrics.projectsCount}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                userRole={userRole}
                onOpenAddMember={() => setIsAddMemberModalOpen(true)}
                onOpenEditTeam={() => setIsEditTeamModalOpen(true)}
            />

            {/* Tier 2 KPI Ribbon */}
            <TeamStatsRibbon
                teamMetrics={teamMetrics}
                personalMetrics={personalMetrics}
            />

            {/* Tier 3 Filter Bar (Shown when viewing members directory) */}
            {activeTab === "members" && (
                <TeamMembersToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    roleFilter={roleFilter}
                    onRoleFilterChange={setRoleFilter}
                    sortOption={sortOption}
                    onSortChange={setSortOption}
                    counts={{
                        all: teamMembers.length,
                        leaders: leaders.length,
                        members: regularMembers.length,
                        observers: observers.length,
                    }}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                {/* Tab Switcher: Directory vs Projects */}
                <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2 select-none">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("members")}
                            className={`px-3 py-1.5 rounded-[var(--radius-sm,4px)] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === "members"
                                    ? "bg-[var(--app-card)] text-[var(--color-accent)] border border-[var(--app-border)] shadow-3xs"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Member Directory</span>
                            <span className="px-1.5 py-0.2 rounded-[var(--radius-xs,2px)] bg-[var(--app-bg)] text-[9px] tabular-nums font-semibold border border-[var(--app-border)]">
                                {teamMembers.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("projects")}
                            className={`px-3 py-1.5 rounded-[var(--radius-sm,4px)] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeTab === "projects"
                                    ? "bg-[var(--app-card)] text-[var(--color-accent)] border border-[var(--app-border)] shadow-3xs"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                            }`}
                        >
                            <FolderKanban className="w-3.5 h-3.5" />
                            <span>Team Projects</span>
                            <span className="px-1.5 py-0.2 rounded-[var(--radius-xs,2px)] bg-[var(--app-bg)] text-[9px] tabular-nums font-semibold border border-[var(--app-border)]">
                                {teamMetrics.projectsCount}
                            </span>
                        </button>
                    </div>

                    {activeTab === "members" && (searchQuery || roleFilter !== "ALL") && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Clear Filters</span>
                        </button>
                    )}
                </div>

                {/* 3-Column Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                    {/* Left 2 Cols: Main Tab Content */}
                    <div className="lg:col-span-2 flex flex-col gap-4 min-w-0">
                        {activeTab === "members" ? (
                            viewMode === "list" ? (
                                <TeamMembersTable
                                    members={displayedMembers}
                                    currentUserId={currentUser.id}
                                    isCurrentUserLeader={isCurrentUserLeader}
                                    statsMap={statsMap}
                                    onSelect={openMemberProfile}
                                    onResetFilters={handleResetFilters}
                                    onRoleChange={isCurrentUserLeader ? handleRoleChange : undefined}
                                    onRemoveMember={isCurrentUserLeader ? (uid) => setMemberToRemove(uid) : undefined}
                                />
                            ) : (
                                <TeamMembersGrid
                                    members={displayedMembers}
                                    currentUserId={currentUser.id}
                                    isCurrentUserLeader={isCurrentUserLeader}
                                    statsMap={statsMap}
                                    onSelect={openMemberProfile}
                                    onResetFilters={handleResetFilters}
                                    onRoleChange={isCurrentUserLeader ? handleRoleChange : undefined}
                                    onRemoveMember={isCurrentUserLeader ? (uid) => setMemberToRemove(uid) : undefined}
                                />
                            )
                        ) : (
                            <TeamProjectsSection
                                projects={projects}
                                isLoading={isProjectsLoading}
                                teamId={currentTeam.id}
                                teamName={currentTeam.name}
                            />
                        )}
                    </div>

                    {/* Right 1 Col: Team Overview & Tasks Sidebar */}
                    <div className="min-w-0">
                        <TeamSidebarSummary
                            currentTeam={currentTeam}
                            currentUser={currentUser}
                            userRole={userRole}
                            leaders={leaders}
                            teamMembersCount={teamMembers.length}
                            columns={columns}
                            projectsCount={teamMetrics.projectsCount}
                            userTasks={activeTasks.filter((t) => t.assignedToId === currentUser.id)}
                            onTaskSelect={(taskId) => setSelectedTaskId(taskId)}
                            onMemberSelect={openMemberProfile}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isAddMemberModalOpen && (
                <AddTeamMemberModal
                    isOpen={isAddMemberModalOpen}
                    onClose={() => setIsAddMemberModalOpen(false)}
                    currentTeam={currentTeam}
                    currentUser={currentUser}
                    teamMembers={teamMembers}
                    onMemberAdded={loadTeamMetadata}
                />
            )}

            {isEditTeamModalOpen && (
                <EditTeamModal
                    isOpen={isEditTeamModalOpen}
                    onClose={() => setIsEditTeamModalOpen(false)}
                    currentTeam={currentTeam}
                    currentUser={currentUser}
                    onTeamUpdated={loadTeamMetadata}
                />
            )}

            {memberToRemove && (
                <ConfirmDialog
                    isOpen={!!memberToRemove}
                    title="Remove Team Member"
                    description={`Are you sure you want to remove ${memberToRemoveName} from ${currentTeam.name}? Their active tasks will be unassigned or reassigned.`}
                    confirmText="Remove Member"
                    isDanger={true}
                    isLoading={isRemovingMember}
                    onConfirm={handleConfirmRemoveMember}
                    onClose={() => setMemberToRemove(null)}
                />
            )}
        </div>
    );
}
