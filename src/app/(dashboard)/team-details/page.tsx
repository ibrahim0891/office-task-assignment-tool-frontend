"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { 
    Mail, 
    MessageSquare, 
    Phone, 
    Users, 
    TrendingUp, 
    CheckCircle2, 
    AlertCircle, 
    RotateCcw,
    Search,
    List,
    LayoutGrid,
    ArrowUpRight
} from "lucide-react";

function GithubIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
        </svg>
    );
}

export default function TeamDetailsPage() {
    const {
        currentTeam,
        currentUser,
        teamMembers,
        tasks,
        columns,
        openMemberProfile,
    } = useWorkspace();

    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"ALL" | "LEADER" | "MEMBER" | "OBSERVER">("ALL");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    if (!currentTeam || !currentUser) {
        return (
            <div className="p-5">
                <SkeletonList />
            </div>
        );
    }

    // Categorize team members by role
    const leaders = teamMembers.filter((m) => m.role === "LEADER");
    const observers = teamMembers.filter((m) => m.role === "OBSERVER");
    const members = teamMembers.filter((m) => m.role !== "LEADER" && m.role !== "OBSERVER");

    // Statistics for the currently logged-in user
    const userTasks = tasks.filter((t) => t.assignedToId === currentUser.id && !t.isSoftDeleted && !t.isArchived);
    const totalTasks = userTasks.length;

    // Completed column IDs
    const completedColumnIds = new Set(
        columns.filter((c) => c.isComplete).map((c) => c.id)
    );

    const completedTasks = userTasks.filter(
        (t) => completedColumnIds.has(t.columnId) || t.column?.isComplete
    );
    const completedCount = completedTasks.length;
    const pendingTasks = userTasks.filter(
        (t) => !completedColumnIds.has(t.columnId) && !t.column?.isComplete
    );
    const pendingCount = pendingTasks.length;

    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    // Carry forward impact
    const totalCarryOver = userTasks.reduce((sum, t) => sum + (t.carryCount || 0), 0);
    const averageCarryCount = totalTasks > 0 ? (totalCarryOver / totalTasks).toFixed(1) : "0.0";

    // Priorities count
    const urgentCount = userTasks.filter((t) => t.priority === "URGENT").length;
    const highCount = userTasks.filter((t) => t.priority === "HIGH").length;
    const mediumCount = userTasks.filter((t) => t.priority === "MEDIUM").length;
    const lowCount = userTasks.filter((t) => t.priority === "LOW").length;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "URGENT": return "text-[var(--priority-urgent)] bg-[var(--priority-urgent)]/10 border-[var(--priority-urgent)]/20";
            case "HIGH": return "text-[var(--priority-high)] bg-[var(--priority-high)]/10 border-[var(--priority-high)]/20";
            case "MEDIUM": return "text-[var(--priority-medium)] bg-[var(--priority-medium)]/10 border-[var(--priority-medium)]/20";
            default: return "text-[var(--priority-low)] bg-[var(--priority-low)]/10 border-[var(--priority-low)]/20";
        }
    };

    const getMemberTaskStats = (userId: string) => {
        const mTasks = tasks.filter((t) => t.assignedToId === userId && !t.isSoftDeleted && !t.isArchived);
        const active = mTasks.filter((t) => !completedColumnIds.has(t.columnId) && !t.column?.isComplete).length;
        const completed = mTasks.filter((t) => completedColumnIds.has(t.columnId) || t.column?.isComplete).length;
        return { active, completed, total: mTasks.length };
    };

    const filterMember = (m: { user: any; role: string }) => {
        if (roleFilter !== "ALL") {
            if (roleFilter === "LEADER" && m.role !== "LEADER") return false;
            if (roleFilter === "OBSERVER" && m.role !== "OBSERVER") return false;
            if (roleFilter === "MEMBER" && (m.role === "LEADER" || m.role === "OBSERVER")) return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const name = (m.user.fullName || m.user.name || "").toLowerCase();
        const email = (m.user.email || "").toLowerCase();
        const designation = (m.user.designation || "").toLowerCase();
        const role = (m.role || "").toLowerCase();
        return name.includes(q) || email.includes(q) || designation.includes(q) || role.includes(q);
    };

    const displayedMembers = teamMembers.filter(filterMember);

    const getRoleBadge = (role: string) => {
        const r = (role || "MEMBER").toUpperCase();
        if (r === "LEADER") {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                    Leader
                </span>
            );
        }
        if (r === "OBSERVER") {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Observer
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--app-bg)] text-[var(--app-muted)] border border-[var(--app-border)]">
                Member
            </span>
        );
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)] select-none">
            {/* Header */}
            <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-lg shrink-0 shadow-xs">
                        {currentTeam.emoji ? (
                            <span className="emoji-font leading-none">{currentTeam.emoji}</span>
                        ) : (
                            <Users className="w-5 h-5 text-[var(--app-muted)]" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-[var(--app-text)] leading-tight">
                            {currentTeam.name} Directory
                        </h1>
                        <p className="text-xs text-[var(--app-muted)] mt-0.5">
                            Personnel directory and work statistics for {currentTeam.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-[var(--app-bg)] border border-[var(--app-border)] rounded-md p-0.5 text-xs">
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                                viewMode === "list"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs font-medium"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                            title="Table / List View"
                        >
                            <List className="w-3.5 h-3.5" />
                            <span>List</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                                viewMode === "grid"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs font-medium"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                            title="Card / Grid View"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>Cards</span>
                        </button>
                    </div>

                    {/* Member Count Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-md text-xs text-[var(--app-muted)]">
                        <Users className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                        <span className="font-semibold text-[var(--app-text)]">{teamMembers.length}</span>
                        <span>members</span>
                    </div>
                </div>
            </div>

            {/* KPI Stats Ribbon */}
            <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)]">
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[var(--app-border)]">
                    {/* Assigned Tasks */}
                    <div className="px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs text-[var(--app-muted)]">My Assigned Tasks</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl font-semibold text-[var(--app-text)]">
                                    {totalTasks}
                                </span>
                                <span className="text-xs text-[var(--app-muted)]">in queue</span>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs text-[var(--app-muted)]">Completion Rate</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className={`text-2xl font-semibold ${
                                    completionRate < 50
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-emerald-600 dark:text-emerald-400"
                                }`}>
                                    {completionRate}%
                                </span>
                                <span className="text-xs text-[var(--app-muted)]">completed</span>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Active Pending */}
                    <div className="px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs text-[var(--app-muted)]">Active Pending</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className={`text-2xl font-semibold ${
                                    pendingCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-[var(--app-text)]"
                                }`}>
                                    {pendingCount}
                                </span>
                                <span className="text-xs text-[var(--app-muted)]">tasks pending</span>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0">
                            <AlertCircle className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Avg Carry Over */}
                    <div className="px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs text-[var(--app-muted)]">Average Carry Over</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-2xl font-semibold text-[var(--app-text)]">
                                    {averageCarryCount}
                                </span>
                                <span className="text-xs text-[var(--app-muted)]">days carried</span>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0">
                            <RotateCcw className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Directory */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        {/* Search and Role Filter Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--app-card)] border border-[var(--app-border)] p-3 rounded-lg shadow-xs">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or designation..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] rounded-md text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-1 shrink-0 overflow-x-auto text-xs">
                                {(["ALL", "LEADER", "MEMBER", "OBSERVER"] as const).map((r) => {
                                    const count = r === "ALL"
                                        ? teamMembers.length
                                        : r === "LEADER"
                                        ? leaders.length
                                        : r === "MEMBER"
                                        ? members.length
                                        : observers.length;
                                    const label = r === "ALL" ? "All" : r === "LEADER" ? "Leaders" : r === "MEMBER" ? "Members" : "Observers";
                                    return (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setRoleFilter(r)}
                                            className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                                                roleFilter === r
                                                    ? "bg-[var(--app-select-bg)] text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]/20"
                                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                            }`}
                                        >
                                            <span>{label}</span>
                                            <span className="text-[11px] opacity-75">({count})</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* List / Table View */}
                        {viewMode === "list" ? (
                            <div className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-lg overflow-hidden shadow-xs">
                                {displayedMembers.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-[var(--app-muted)]">
                                        No members found matching your search.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)]/50 text-[11px] font-medium text-[var(--app-muted)]">
                                                    <th className="py-2.5 px-4 min-w-[220px]">Member</th>
                                                    <th className="py-2.5 px-4 min-w-[180px]">Email</th>
                                                    <th className="py-2.5 px-4 w-[110px]">Role</th>
                                                    <th className="py-2.5 px-4 w-[150px]">Current Tasks</th>
                                                    <th className="py-2.5 px-4 w-[130px] text-right">Contact</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--app-border)]">
                                                {displayedMembers.map((member) => {
                                                    const { user, role } = member;
                                                    const name = user.fullName || user.name || "Unknown";
                                                    const taskStats = getMemberTaskStats(user.id);
                                                    const isSelf = user.id === currentUser.id;

                                                    return (
                                                        <tr 
                                                            key={user.id}
                                                            onClick={() => openMemberProfile(user)}
                                                            className="hover:bg-[var(--app-hover-bg)]/50 transition-colors cursor-pointer group"
                                                        >
                                                            {/* Member Info */}
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <UserAvatar
                                                                        name={name}
                                                                        avatarUrl={user.avatarUrl}
                                                                        size="md"
                                                                        showBorder={false}
                                                                    />
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="font-semibold text-[var(--app-text)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                                                                                {name}
                                                                            </span>
                                                                            {isSelf && (
                                                                                <span className="text-[11px] text-[var(--app-muted)] font-normal">
                                                                                    (You)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {user.designation && (
                                                                            <span className="text-[11px] text-[var(--app-muted)] truncate block mt-0.5">
                                                                                {user.designation}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Email */}
                                                            <td className="py-3 px-4">
                                                                <a 
                                                                    href={`mailto:${user.email}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] hover:underline truncate block"
                                                                    title={user.email}
                                                                >
                                                                    {user.email}
                                                                </a>
                                                            </td>

                                                            {/* Role Badge */}
                                                            <td className="py-3 px-4">
                                                                {getRoleBadge(role)}
                                                            </td>

                                                            {/* Tasks */}
                                                            <td className="py-3 px-4">
                                                                <div className="text-xs text-[var(--app-muted)]">
                                                                    <span className="font-medium text-[var(--app-text)]">{taskStats.active}</span> active
                                                                    <span className="mx-1.5 opacity-40">•</span>
                                                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{taskStats.completed}</span> done
                                                                </div>
                                                            </td>

                                                            {/* Contacts */}
                                                            <td className="py-3 px-4 text-right">
                                                                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                                    <a 
                                                                        href={`mailto:${user.email}`}
                                                                        title={`Email ${user.email}`}
                                                                        className="p-1.5 rounded text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors"
                                                                    >
                                                                        <Mail className="w-3.5 h-3.5" />
                                                                    </a>
                                                                    {user.github && (
                                                                        <a 
                                                                            href={`https://github.com/${user.github.replace('@', '')}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            title={`GitHub: ${user.github}`}
                                                                            className="p-1.5 rounded text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors"
                                                                        >
                                                                            <GithubIcon className="w-3.5 h-3.5" />
                                                                        </a>
                                                                    )}
                                                                    {user.telegram && (
                                                                        <a 
                                                                            href={`https://t.me/${user.telegram.replace('@', '')}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            title={`Telegram: ${user.telegram}`}
                                                                            className="p-1.5 rounded text-[var(--app-muted)] hover:text-sky-500 hover:bg-[var(--app-hover-bg)] transition-colors"
                                                                        >
                                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                                        </a>
                                                                    )}
                                                                    {user.whatsapp && (
                                                                        <a 
                                                                            href={`https://wa.me/${user.whatsapp.replace(/[^0-9]/g, '')}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            title={`WhatsApp: ${user.whatsapp}`}
                                                                            className="p-1.5 rounded text-[var(--app-muted)] hover:text-emerald-500 hover:bg-[var(--app-hover-bg)] transition-colors"
                                                                        >
                                                                            <Phone className="w-3.5 h-3.5" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Card View */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {displayedMembers.length === 0 ? (
                                    <div className="col-span-full p-8 text-center bg-[var(--app-card)] border border-[var(--app-border)] rounded-lg text-xs text-[var(--app-muted)]">
                                        No members found matching your search.
                                    </div>
                                ) : (
                                    displayedMembers.map((member) => {
                                        const { user, role } = member;
                                        const name = user.fullName || user.name || "Unknown";
                                        const taskStats = getMemberTaskStats(user.id);
                                        const isSelf = user.id === currentUser.id;

                                        return (
                                            <div
                                                key={user.id}
                                                onClick={() => openMemberProfile(user)}
                                                className="group bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] p-4 rounded-lg transition-all hover:bg-[var(--app-hover-bg)]/40 cursor-pointer shadow-xs flex flex-col justify-between gap-3 min-w-0"
                                            >
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <UserAvatar
                                                        name={name}
                                                        avatarUrl={user.avatarUrl}
                                                        size="lg"
                                                        showBorder={false}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <h4 className="text-sm font-semibold text-[var(--app-text)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                                                                    {name}
                                                                </h4>
                                                                {isSelf && (
                                                                    <span className="text-[11px] text-[var(--app-muted)] shrink-0">
                                                                        (You)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {getRoleBadge(role)}
                                                        </div>

                                                        <a
                                                            href={`mailto:${user.email}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] hover:underline truncate block mt-0.5"
                                                        >
                                                            {user.email}
                                                        </a>

                                                        {user.designation && (
                                                            <p className="text-xs text-[var(--app-muted)] truncate mt-0.5">
                                                                {user.designation}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {user.bio && (
                                                    <p className="text-xs italic text-[var(--app-muted)] line-clamp-2 leading-relaxed">
                                                        "{user.bio}"
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[var(--app-border)]/60 text-xs text-[var(--app-muted)] mt-auto">
                                                    <div>
                                                        <span className="font-semibold text-[var(--app-text)]">{taskStats.active}</span> active
                                                        <span className="mx-1.5 opacity-40">•</span>
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{taskStats.completed}</span> done
                                                    </div>

                                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <a 
                                                            href={`mailto:${user.email}`}
                                                            title={`Email: ${user.email}`}
                                                            className="p-1 rounded text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors"
                                                        >
                                                            <Mail className="w-3.5 h-3.5" />
                                                        </a>
                                                        {user.github && (
                                                            <a 
                                                                href={`https://github.com/${user.github.replace('@', '')}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                title={`GitHub: ${user.github}`}
                                                                className="p-1 rounded text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors"
                                                            >
                                                                <GithubIcon className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                        {user.telegram && (
                                                            <a 
                                                                href={`https://t.me/${user.telegram.replace('@', '')}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                title={`Telegram: ${user.telegram}`}
                                                                className="p-1 rounded text-[var(--app-muted)] hover:text-sky-500 hover:bg-[var(--app-hover-bg)] transition-colors"
                                                            >
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                        {user.whatsapp && (
                                                            <a 
                                                                href={`https://wa.me/${user.whatsapp.replace(/[^0-9]/g, '')}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                title={`WhatsApp: ${user.whatsapp}`}
                                                                className="p-1 rounded text-[var(--app-muted)] hover:text-emerald-500 hover:bg-[var(--app-hover-bg)] transition-colors"
                                                            >
                                                                <Phone className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right 1 Col: Statistics & Tasks Panel */}
                    <div className="flex flex-col gap-5">
                        {/* Priority Breakdown */}
                        <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-5 rounded-lg flex flex-col gap-4 shadow-xs">
                            <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
                                <h3 className="text-sm font-semibold text-[var(--app-text)]">
                                    Priority Breakdown
                                </h3>
                                <span className="text-xs text-[var(--app-muted)]">
                                    {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3">
                                {/* Urgent */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--priority-urgent)] font-medium">Urgent</span>
                                        <span className="font-semibold text-[var(--app-text)]">{urgentCount}</span>
                                    </div>
                                    <div className="w-full h-2 bg-[var(--app-bg)] rounded-full overflow-hidden border border-[var(--app-border)]">
                                        <div 
                                            className="h-full bg-[var(--priority-urgent)] rounded-full transition-all"
                                            style={{ width: `${totalTasks > 0 ? (urgentCount / totalTasks) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                                {/* High */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--priority-high)] font-medium">High</span>
                                        <span className="font-semibold text-[var(--app-text)]">{highCount}</span>
                                    </div>
                                    <div className="w-full h-2 bg-[var(--app-bg)] rounded-full overflow-hidden border border-[var(--app-border)]">
                                        <div 
                                            className="h-full bg-[var(--priority-high)] rounded-full transition-all"
                                            style={{ width: `${totalTasks > 0 ? (highCount / totalTasks) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Medium */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--priority-medium)] font-medium">Medium</span>
                                        <span className="font-semibold text-[var(--app-text)]">{mediumCount}</span>
                                    </div>
                                    <div className="w-full h-2 bg-[var(--app-bg)] rounded-full overflow-hidden border border-[var(--app-border)]">
                                        <div 
                                            className="h-full bg-[var(--priority-medium)] rounded-full transition-all"
                                            style={{ width: `${totalTasks > 0 ? (mediumCount / totalTasks) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Low */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[var(--priority-low)] font-medium">Low</span>
                                        <span className="font-semibold text-[var(--app-text)]">{lowCount}</span>
                                    </div>
                                    <div className="w-full h-2 bg-[var(--app-bg)] rounded-full overflow-hidden border border-[var(--app-border)]">
                                        <div 
                                            className="h-full bg-[var(--priority-low)] rounded-full transition-all"
                                            style={{ width: `${totalTasks > 0 ? (lowCount / totalTasks) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* My Active Tasks */}
                        <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-5 rounded-lg flex flex-col gap-3 shadow-xs">
                            <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
                                <h3 className="text-sm font-semibold text-[var(--app-text)]">
                                    My Active Tasks
                                </h3>
                                <Link 
                                    href="/task-board" 
                                    className="text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] flex items-center gap-1 hover:underline"
                                >
                                    <span>Board</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {pendingCount > 0 ? (
                                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-0.5">
                                    {pendingTasks.map((t) => (
                                        <div 
                                            key={t.id}
                                            className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] rounded-md flex flex-col gap-1.5 text-xs transition-colors"
                                        >
                                            <div className="font-medium text-[var(--app-text)] truncate">
                                                {t.title}
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-[var(--app-muted)]">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getPriorityColor(t.priority)}`}>
                                                    {t.priority}
                                                </span>
                                                {t.dueDate && (
                                                    <span>Due {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-[var(--app-muted)] py-4 text-center">
                                    No active tasks assigned to you.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
