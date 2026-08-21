"use client";

import React, { useState, useEffect } from "react";
import { ArrowRightLeft, CalendarClock, RotateCcw, Loader2 } from "lucide-react";
import { api } from "../../api";

function getInitials(name: string) {
    if (!name) return "";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getUtilizationCell(val: number) {
    if (val <= 0) return { bg: "bg-[var(--app-bg)]", text: "text-[var(--app-muted)]", label: "—" };
    if (val <= 1.0) return { bg: "bg-[var(--color-success)]/10", text: "text-[var(--color-success)]", label: val.toFixed(1) };
    if (val <= 1.25) return { bg: "bg-[var(--color-warning)]/10", text: "text-[var(--color-warning)]", label: val.toFixed(1) };
    return { bg: "bg-[var(--color-error)]/10", text: "text-[var(--color-error)]", label: val.toFixed(1) };
}

interface ProjectAnalyticsViewProps {
    project: any;
}

export default function ProjectAnalyticsView({ project }: ProjectAnalyticsViewProps) {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadAnalytics = async () => {
        if (!project?.id) return;
        setLoading(true);
        try {
            const data = await api.getProjectAnalytics(project.id);
            setAnalytics(data);
        } catch (err) {
            console.error("Failed to load project analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [project?.id]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--app-muted)]" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-12 text-[var(--app-muted)] text-[11px]">
                Failed to load project analytics.
            </div>
        );
    }

    const {
        completionPct,
        totalTasks,
        doneTasks,
        totalSubtasks,
        doneSubtasks,
        reworkRate,
        incidents = [],
        reworkEntries = [],
        capacityHeatmap = [],
    } = analytics;

    return (
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 select-none">
            {/* KPI Stats Row */}
            <div className="corner-brackets grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--app-border)] border border-[var(--app-border)]">
                <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                    <span className="eyebrow">Completion</span>
                    <span className="text-2xl font-heading text-[var(--app-text)]">
                        {completionPct}%
                    </span>
                    <span className="text-[9px] text-[var(--app-muted)]">
                        {doneTasks}/{totalTasks} super tasks
                    </span>
                </div>
                <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                    <span className="eyebrow">Subtask Progress</span>
                    <span className="text-2xl font-heading text-[var(--app-text)]">
                        {totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0}%
                    </span>
                    <span className="text-[9px] text-[var(--app-muted)]">
                        {doneSubtasks}/{totalSubtasks} subtasks
                    </span>
                </div>
                <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                    <span className="eyebrow">SLA Incidents</span>
                    <span className={`text-2xl font-heading ${incidents.length > 0 ? "text-[var(--color-error)]" : "text-[var(--app-text)]"}`}>
                        {incidents.length}
                    </span>
                    <span className="text-[9px] text-[var(--app-muted)]">
                        active incidents
                    </span>
                </div>
                <div className="bg-[var(--app-card)] p-4 flex flex-col gap-1">
                    <span className="eyebrow">Rework Rate</span>
                    <span className={`text-2xl font-heading ${reworkRate > 0 ? "text-[var(--color-warning)]" : "text-[var(--app-text)]"}`}>
                        {reworkRate}%
                    </span>
                    <span className="text-[9px] text-[var(--app-muted)]">
                        {reworkRate}% tasks reworked
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Capacity Heatmap */}
                <div className="lg:col-span-2 relative bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets rounded-[2px] p-4 flex flex-col gap-3">
                    <div>
                        <h2 className="text-[13px] font-semibold text-[var(--app-text)]">
                            ▪ Team Capacity Heatmap
                        </h2>
                        <p className="text-base text-[var(--app-muted)] mt-0.5">
                            Daily utilization across the next 7 working days
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--app-border)] text-[9px] font-medium text-[var(--app-muted)]">
                                    <th className="pb-2 px-3 w-48">Member</th>
                                    {capacityHeatmap[0]?.days.map((d: any) => (
                                        <th key={d.date} className="pb-2 px-2 text-center w-24">
                                            <div>{d.dayLabel}</div>
                                            <div className="text-[8px] text-[var(--app-muted)] mt-0.5">{d.date.split("-").slice(1).join("/")}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {capacityHeatmap.map((member: any) => (
                                    <tr key={member.userId} className="border-b border-[var(--app-border)]/50 hover:bg-[var(--app-card)] transition-colors">
                                        <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full border border-[var(--app-border-strong)] bg-[var(--app-bg)] flex items-center justify-center text-[8px] font-semibold">
                                                    {getInitials(member.user?.name || "")}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-[var(--app-text)]">{member.user?.name}</div>
                                                    <div className="text-[9px] text-[var(--app-muted)] mt-0.5">{member.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {member.days.map((d: any) => {
                                            const cell = getUtilizationCell(d.utilization);
                                            return (
                                                <td key={d.date} className="py-2.5 px-2 text-center">
                                                    <div className={`py-1 rounded-[2px] font-mono font-medium ${cell.bg} ${cell.text}`}>
                                                        {cell.label}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center gap-4 text-[9px] text-[var(--app-muted)] pt-2 border-t border-[var(--app-border)]/50">
                        <div className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded-[2px] bg-[var(--app-bg)] border border-[var(--app-border)]" />
                            <span>Available (0.0)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded-[2px] bg-[var(--color-success)]/10 border border-[var(--color-success)]/20" />
                            <span>Optimal (≤ 1.0)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded-[2px] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20" />
                            <span>1.0–1.25 (Tight)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded-[2px] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20" />
                            <span>&gt; 1.25 (Overbooked)</span>
                        </div>
                    </div>
                </div>

                {/* Incident Log */}
                <div className="relative bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets rounded-[2px] p-4 flex flex-col gap-3">
                    <div>
                        <h2 className="text-[13px] font-semibold text-[var(--color-error)]">
                            ▪ Need Attention — Incidents
                        </h2>
                        <p className="text-base text-[var(--app-muted)] mt-0.5">
                            Tasks exceeding SLA thresholds requiring leader action.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        {incidents.length === 0 ? (
                            <div className="text-center py-6 text-[var(--app-muted)] text-[11px] border border-dashed border-[var(--app-border)]">
                                No active incidents for this project.
                            </div>
                        ) : (
                            incidents.map((inc: any) => (
                                <div
                                    key={inc.id}
                                    className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] flex flex-col gap-2 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h4 className="text-[11px] font-medium text-[var(--app-text)] truncate">
                                                {inc.taskTitle}
                                            </h4>
                                            <p className="text-[9px] text-[var(--app-muted)] mt-0.5">
                                                {inc.assignee?.name || "Unassigned"} · {inc.daysLate}d overdue
                                            </p>
                                        </div>
                                        <span className={`shrink-0 text-[8px] font-medium px-1.5 py-0.5 rounded-[2px] border ${
                                            inc.escalationLevel === "LEVEL_2"
                                                ? "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20"
                                                : "text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20"
                                        }`}>
                                            {inc.escalationLevel === "LEVEL_2" ? "Level 2 — Exec" : "Level 1"}
                                        </span>
                                    </div>
                                    {inc.leaderInaction && (
                                        <div className="text-[8px] text-[var(--color-error)] font-medium">
                                            ⚠ Leader inaction detected (&gt;24h without response)
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <button type="button" className="text-[9px] text-[var(--app-text)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1">
                                            Reassign
                                        </button>
                                        <button type="button" className="text-[9px] text-[var(--app-text)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1">
                                            Extend
                                        </button>
                                        <button type="button" className="text-[9px] text-[var(--color-success)] border border-[var(--color-success)]/20 hover:bg-[var(--color-success)]/10 px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer">
                                            Resolve
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Rework & Quality */}
                <div className="relative bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets rounded-[2px] p-4 flex flex-col gap-3">
                    <div>
                        <h2 className="text-[13px] font-semibold text-[var(--color-warning)]">
                            ▪ Rework & Quality Log
                        </h2>
                        <p className="text-base text-[var(--app-muted)] mt-0.5">
                            Tasks requiring multiple review cycles.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        {reworkEntries.length === 0 ? (
                            <div className="text-center py-6 text-[var(--app-muted)] text-[11px] border border-dashed border-[var(--app-border)]">
                                No rework entries for this project.
                            </div>
                        ) : (
                            reworkEntries.map((entry: any) => (
                                <div
                                    key={entry.id || (entry.taskId + entry.cycleNumber)}
                                    className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-between gap-3"
                                >
                                    <div className="min-w-0">
                                        <h4 className="text-[11px] font-medium text-[var(--app-text)] truncate">
                                            {entry.taskTitle}
                                        </h4>
                                        <p className="text-[9px] text-[var(--app-muted)] mt-0.5">
                                            Rejected by {entry.rejectedBy?.name || "Reviewer"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[8px] text-[var(--app-muted)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-[2px] bg-[var(--app-card)]">
                                            {entry.defectCategory}
                                        </span>
                                        <span className="text-[9px] font-medium text-[var(--color-warning)] flex items-center gap-1">
                                            <RotateCcw className="w-2.5 h-2.5" />
                                            Cycle {entry.cycleNumber}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
