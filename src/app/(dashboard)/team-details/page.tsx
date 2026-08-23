"use client";

import React from "react";
import Link from "next/link";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { 
    Mail, 
    MessageSquare,
    Phone
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
    } = useWorkspace();

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
    const userTasks = tasks.filter((t) => t.assignedToId === currentUser.id);
    const totalTasks = userTasks.length;

    // Build completed column IDs set
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

    const getInitials = (fullName: string) => {
        return fullName
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    const renderMemberCard = (member: { user: any; role: string }) => {
        const { user, role } = member;
        const initials = getInitials(user.fullName);
        
        return (
            <div 
                key={user.id}
                className="bg-[var(--app-card)] border border-[var(--app-border)] p-3.5 flex flex-col justify-between gap-2.5 rounded-[2px]"
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {user.avatarUrl ? (
                            <img 
                                src={user.avatarUrl} 
                                alt={user.fullName}
                                className="w-8 h-8 rounded-[3px] object-cover border border-[var(--app-border)] shrink-0"
                            />
                        ) : (
                            <div className="w-8 h-8 bg-[var(--app-select-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold text-xs rounded-[3px] flex items-center justify-center shrink-0">
                                {initials}
                            </div>
                        )}
                        
                        <div className="min-w-0">
                            <h4 className="text-[12px] font-semibold text-[var(--app-text)] truncate">
                                {user.fullName}
                            </h4>
                            <p className="text-[10px] text-[var(--app-muted)] truncate">
                                {user.designation || "Team Contributor"}
                            </p>
                        </div>
                    </div>

                    <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-[2px] border shrink-0 ${
                            role === "LEADER"
                                ? "text-[#CB2431] bg-[#CB2431]/10 border-[#CB2431]/20"
                                : role === "OBSERVER"
                                ? "text-[#B08800] bg-[#B08800]/10 border-[#B08800]/20"
                                : "text-[#22863A] bg-[#22863A]/10 border-[#22863A]/20"
                        }`}
                    >
                        {role}
                    </span>
                </div>

                <div className="border-t border-[var(--app-border)] pt-2 flex flex-col gap-1.5 text-[11px] text-[var(--app-muted)]">
                    {user.bio && (
                        <p className="text-[10px] italic text-[var(--app-text)] line-clamp-2">
                            "{user.bio}"
                        </p>
                    )}
                    
                    <div className="flex items-center gap-1.5 text-[10px] truncate">
                        <Mail className="w-3 h-3 text-[var(--app-muted)] shrink-0" />
                        <span className="truncate">{user.email}</span>
                    </div>

                    {(user.telegram || user.github || user.whatsapp) && (
                        <div className="flex items-center gap-3 pt-1 text-[10px]">
                            {user.github && (
                                <a 
                                    href={`https://github.com/${user.github.replace('@', '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-[var(--app-text)] flex items-center gap-1 transition-colors"
                                >
                                    <GithubIcon className="w-3 h-3" />
                                    <span>{user.github.replace('@', '')}</span>
                                </a>
                            )}
                            {user.telegram && (
                                <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3 text-sky-500" />
                                    <span>{user.telegram}</span>
                                </span>
                            )}
                            {user.whatsapp && (
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-emerald-500" />
                                    <span>{user.whatsapp}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto p-5 bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col gap-5 select-none scrollbar-none">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                <div>
                    <h1 className="font-heading text-xl font-bold text-[var(--app-text)]">
                        {currentTeam.emoji ? <span className="mr-2 emoji-font">{currentTeam.emoji}</span> : null}
                        {currentTeam.name} Directory
                    </h1>
                    <p className="text-base text-[var(--app-muted)] mt-0.5">
                        Personnel directory and work statistics for{" "}
                        <span className="text-[var(--app-text)] font-medium">
                            {currentTeam.name}
                        </span>
                    </p>
                </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 flex flex-col gap-1 corner-brackets rounded-[2px]">
                    <span className="eyebrow">Assigned Tasks</span>
                    <span className="text-2xl font-heading text-[var(--app-text)]">
                        {totalTasks}
                    </span>
                </div>

                <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 flex flex-col gap-1 corner-brackets rounded-[2px]">
                    <span className="eyebrow">Completion Rate</span>
                    <span className="text-2xl font-heading text-[var(--app-text)]">
                        {completionRate}%
                    </span>
                </div>

                <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 flex flex-col gap-1 corner-brackets rounded-[2px]">
                    <span className="eyebrow">Active Pending</span>
                    <span className="text-2xl font-heading text-[var(--app-text)]">
                        {pendingCount}
                    </span>
                </div>

                <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 flex flex-col gap-1 corner-brackets rounded-[2px]">
                    <span className="eyebrow">Avg Carry Over</span>
                    <span className="text-2xl font-heading text-[var(--app-text)]">
                        {averageCarryCount}
                    </span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Left (2 cols): Team Directory */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                    
                    {/* Leaders Group */}
                    <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 flex flex-col gap-3 corner-brackets rounded-[2px]">
                        <h2 className="text-[13px] font-semibold text-[var(--app-text)]">
                            ▪ Leaders ({leaders.length})
                        </h2>
                        {leaders.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {leaders.map((m) => renderMemberCard(m))}
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--app-muted)] italic">No leaders designated.</p>
                        )}
                    </div>

                    {/* Observers Group */}
                    {observers.length > 0 && (
                        <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 flex flex-col gap-3 corner-brackets rounded-[2px]">
                            <h2 className="text-[13px] font-semibold text-[var(--app-text)]">
                                ▪ Observers ({observers.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {observers.map((m) => renderMemberCard(m))}
                            </div>
                        </div>
                    )}

                    {/* Members Group */}
                    <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 flex flex-col gap-3 corner-brackets rounded-[2px]">
                        <h2 className="text-[13px] font-semibold text-[var(--app-text)]">
                            ▪ Team Members ({members.length})
                        </h2>
                        {members.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {members.map((m) => renderMemberCard(m))}
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--app-muted)] italic">No additional team members in this workspace.</p>
                        )}
                    </div>
                </div>

                {/* Right (1 col): Work Statistics & Active Tasks */}
                <div className="flex flex-col gap-5">
                    
                    {/* Priority Breakdown */}
                    <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 flex flex-col gap-3 corner-brackets rounded-[2px]">
                        <h2 className="text-[13px] font-semibold text-[var(--app-text)]">
                            ▪ Priority Distribution
                        </h2>
                        
                        <div className="flex flex-col gap-2.5">
                            {/* Urgent */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-[var(--priority-urgent)] font-medium">Urgent</span>
                                    <span className="text-[var(--app-text)] font-semibold">{urgentCount}</span>
                                </div>
                                <div className="w-full h-1.5 bg-[var(--app-select-bg)] rounded-[2px] overflow-hidden">
                                    <div 
                                        className="h-full bg-[var(--priority-urgent)]"
                                        style={{ width: `${totalTasks > 0 ? (urgentCount / totalTasks) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* High */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-[var(--priority-high)] font-medium">High</span>
                                    <span className="text-[var(--app-text)] font-semibold">{highCount}</span>
                                </div>
                                <div className="w-full h-1.5 bg-[var(--app-select-bg)] rounded-[2px] overflow-hidden">
                                    <div 
                                        className="h-full bg-[var(--priority-high)]"
                                        style={{ width: `${totalTasks > 0 ? (highCount / totalTasks) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Medium */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-[var(--priority-medium)] font-medium">Medium</span>
                                    <span className="text-[var(--app-text)] font-semibold">{mediumCount}</span>
                                </div>
                                <div className="w-full h-1.5 bg-[var(--app-select-bg)] rounded-[2px] overflow-hidden">
                                    <div 
                                        className="h-full bg-[var(--priority-medium)]"
                                        style={{ width: `${totalTasks > 0 ? (mediumCount / totalTasks) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Low */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-[var(--priority-low)] font-medium">Low</span>
                                    <span className="text-[var(--app-text)] font-semibold">{lowCount}</span>
                                </div>
                                <div className="w-full h-1.5 bg-[var(--app-select-bg)] rounded-[2px] overflow-hidden">
                                    <div 
                                        className="h-full bg-[var(--priority-low)]"
                                        style={{ width: `${totalTasks > 0 ? (lowCount / totalTasks) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* My Active Tasks */}
                    <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 flex flex-col gap-3 corner-brackets rounded-[2px]">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[13px] font-semibold text-[var(--app-text)]">
                                ▪ My Active Tasks ({pendingCount})
                            </h2>
                            <Link href="/task-board" className="text-[10px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:underline">
                                View Board →
                            </Link>
                        </div>
                        {pendingCount > 0 ? (
                            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto scrollbar-none pr-0.5">
                                {pendingTasks.map((t) => (
                                    <div 
                                        key={t.id}
                                        className="p-2.5 bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] rounded-[2px] flex flex-col gap-1 text-[11px]"
                                    >
                                        <div className="font-medium text-[var(--app-text)] truncate">
                                            {t.title}
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-[var(--app-muted)]">
                                            <span className={`px-1 rounded-[1.5px] border ${getPriorityColor(t.priority)}`}>
                                                {t.priority}
                                            </span>
                                            {t.dueDate && (
                                                <span>Due: {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--app-muted)] italic py-2">
                                No active tasks assigned to you.
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
