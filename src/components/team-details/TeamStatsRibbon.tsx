"use client";

import React, { useState } from "react";
import { Users, AlertCircle, TrendingUp, FolderKanban, CheckCircle2, RotateCcw, UserCheck, Layers } from "lucide-react";

interface TeamMetrics {
    totalMembers: number;
    leadersCount: number;
    membersCount: number;
    observersCount: number;
    totalTeamTasks: number;
    activeTeamTasks: number;
    completedTeamTasks: number;
    teamCompletionRate: number;
    projectsCount: number;
    activeProjectsCount: number;
}

interface PersonalMetrics {
    myTotalTasks: number;
    myActiveTasks: number;
    myCompletedTasks: number;
    myCompletionRate: number;
    myCarryOverCount: number;
}

interface TeamStatsRibbonProps {
    teamMetrics: TeamMetrics;
    personalMetrics: PersonalMetrics;
}

export function TeamStatsRibbon({ teamMetrics, personalMetrics }: TeamStatsRibbonProps) {
    const [perspective, setPerspective] = useState<"team" | "personal">("team");

    return (
        <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] select-none">
            {/* Perspective Toggle Bar (Subtle header or integrated) */}
            <div className="px-5 py-1.5 bg-[var(--app-bg)]/50 border-b border-[var(--app-border)] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-[var(--app-muted)]">
                    <span className="font-medium text-[var(--app-text)]">Scope:</span>
                    <span>{perspective === "team" ? "Collective Workspace Performance" : "Your Personal Performance & Assigned Queue"}</span>
                </div>
                <div className="inline-flex items-center bg-[var(--app-card)] border border-[var(--app-border)] rounded-[var(--radius-xs,2px)] p-0.5">
                    <button
                        type="button"
                        onClick={() => setPerspective("team")}
                        className={`px-2 py-0.5 rounded-[var(--radius-xs,2px)] transition-all cursor-pointer text-[10px] font-medium ${
                            perspective === "team"
                                ? "bg-[var(--app-bg)] text-[var(--color-accent)] font-semibold shadow-3xs border border-[var(--app-border)]"
                                : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                        }`}
                    >
                        Team Scope
                    </button>
                    <button
                        type="button"
                        onClick={() => setPerspective("personal")}
                        className={`px-2 py-0.5 rounded-[var(--radius-xs,2px)] transition-all cursor-pointer text-[10px] font-medium ${
                            perspective === "personal"
                                ? "bg-[var(--app-bg)] text-[var(--color-accent)] font-semibold shadow-3xs border border-[var(--app-border)]"
                                : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                        }`}
                    >
                        My Contribution
                    </button>
                </div>
            </div>

            {/* 4-KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[var(--app-border)]">
                {perspective === "team" ? (
                    <>
                        {/* 1. Team Roster */}
                        <div className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs text-[var(--app-muted)]">Team Roster</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-2xl font-semibold text-[var(--app-text)]">
                                        {teamMetrics.totalMembers}
                                    </span>
                                    <span className="text-xs text-[var(--app-muted)]">members</span>
                                </div>
                                <span className="text-[10px] text-[var(--app-muted)] mt-0.5 truncate">
                                    {teamMetrics.leadersCount} Lead • {teamMetrics.membersCount} Mbr • {teamMetrics.observersCount} Obs
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0 shadow-3xs">
                                <Users className="w-4 h-4" />
                            </div>
                        </div>

                        {/* 2. Active Team Workload */}
                        <div className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs text-[var(--app-muted)]">Active Team Tasks</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-2xl font-semibold text-[var(--app-text)]">
                                        {teamMetrics.activeTeamTasks}
                                    </span>
                                    <span className="text-xs text-[var(--app-muted)]">in flight</span>
                                </div>
                                <span className="text-[10px] text-[var(--app-muted)] mt-0.5">
                                    {teamMetrics.totalTeamTasks} total tasks in workspace
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--color-warning)] shrink-0 shadow-3xs">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                        </div>

                        {/* 3. Team Velocity (% Complete) */}
                        <div className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs text-[var(--app-muted)]">Team Velocity</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span
                                        className={`text-2xl font-semibold ${
                                            teamMetrics.teamCompletionRate >= 50
                                                ? "text-[var(--color-success)]"
                                                : "text-[var(--color-warning)]"
                                        }`}
                                    >
                                        {teamMetrics.teamCompletionRate}%
                                    </span>
                                    <span className="text-xs text-[var(--app-muted)]">done</span>
                                </div>
                                <span className="text-[10px] text-[var(--app-muted)] mt-0.5">
                                    {teamMetrics.completedTeamTasks} of {teamMetrics.totalTeamTasks} closed
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0 shadow-3xs">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>

                        {/* 4. Team Deliverables / Projects */}
                        <div className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs text-[var(--app-muted)]">Team Projects</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-2xl font-semibold text-[var(--app-text)]">
                                        {teamMetrics.projectsCount}
                                    </span>
                                    <span className="text-xs text-[var(--app-muted)]">deliverables</span>
                                </div>
                                <span className="text-[10px] text-[var(--app-muted)] mt-0.5">
                                    {teamMetrics.activeProjectsCount} currently in progress
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--color-accent)] shrink-0 shadow-3xs">
                                <FolderKanban className="w-4 h-4" />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* 1. My Queue */}
                        <div className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs text-[var(--app-muted)]">My Assigned Tasks</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-2xl font-semibold text-[var(--app-text)]">
                                        {personalMetrics.myTotalTasks}
                                    </span>
                                    <span className="text-xs text-[var(--app-muted)]">assigned</span>
                                </div>
                                <span className="text-[10px] text-[var(--app-muted)] mt-0.5">
                                    {personalMetrics.myActiveTasks} active tasks to complete
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0 shadow-3xs">
                                <UserCheck className="w-4 h-4" />
                            </div>
                        </div>

                        {/* 2. My Completion Rate */}
                        <div className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs text-[var(--app-muted)]">Personal Rate</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span
                                        className={`text-2xl font-semibold ${
                                            personalMetrics.myCompletionRate >= 50
                                                ? "text-[var(--color-success)]"
                                                : "text-[var(--color-warning)]"
                                        }`}
                                    >
                                        {personalMetrics.myCompletionRate}%
                                    </span>
                                    <span className="text-xs text-[var(--app-muted)]">completed</span>
                                </div>
                                <span className="text-[10px] text-[var(--app-muted)] mt-0.5">
                                    {personalMetrics.myCompletedTasks} tasks completed
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0 shadow-3xs">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>

                        {/* 3. My Pending Tasks */}
                        <div className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs text-[var(--app-muted)]">Pending Action</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span
                                        className={`text-2xl font-semibold ${
                                            personalMetrics.myActiveTasks > 0
                                                ? "text-[var(--color-warning)]"
                                                : "text-[var(--app-text)]"
                                        }`}
                                    >
                                        {personalMetrics.myActiveTasks}
                                    </span>
                                    <span className="text-xs text-[var(--app-muted)]">pending</span>
                                </div>
                                <span className="text-[10px] text-[var(--app-muted)] mt-0.5">
                                    Requires attention or in progress
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--color-warning)] shrink-0 shadow-3xs">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                        </div>

                        {/* 4. Carry Over Health */}
                        <div className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs text-[var(--app-muted)]">Total Carry Overs</span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-2xl font-semibold text-[var(--app-text)]">
                                        {personalMetrics.myCarryOverCount}
                                    </span>
                                    <span className="text-xs text-[var(--app-muted)]">days carried</span>
                                </div>
                                <span className="text-[10px] text-[var(--app-muted)] mt-0.5">
                                    Cumulative carry-over count
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shrink-0 shadow-3xs">
                                <RotateCcw className="w-4 h-4" />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
