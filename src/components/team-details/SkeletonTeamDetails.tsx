"use client";

import React from "react";

export function SkeletonTeamDetails() {
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)] animate-pulse">
            {/* Tier 1 Header Skeleton */}
            <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)]" />
                    <div className="flex flex-col gap-1.5">
                        <div className="w-36 h-5 bg-[var(--app-border)]/60 rounded-[var(--radius-xs,2px)]" />
                        <div className="w-56 h-3 bg-[var(--app-border)]/40 rounded-[var(--radius-xs,2px)]" />
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-20 h-7 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)]" />
                    <div className="w-24 h-7 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)]" />
                    <div className="w-28 h-7 bg-[var(--app-border)]/70 rounded-[var(--radius-sm,4px)]" />
                </div>
            </div>

            {/* Tier 2 KPI Metric Ribbon Skeleton */}
            <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)]">
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[var(--app-border)]">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-1.5">
                                <div className="w-20 h-3 bg-[var(--app-border)]/50 rounded-[var(--radius-xs,2px)]" />
                                <div className="flex items-baseline gap-2">
                                    <div className="w-12 h-6 bg-[var(--app-border)]/70 rounded-[var(--radius-xs,2px)]" />
                                    <div className="w-14 h-3 bg-[var(--app-border)]/40 rounded-[var(--radius-xs,2px)]" />
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)]" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Tier 3 Filter Bar Skeleton */}
            <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-bg)] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="w-64 sm:w-80 h-[32px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)]" />
                <div className="flex items-center gap-2">
                    <div className="w-16 h-[28px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)]" />
                    <div className="w-16 h-[28px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)]" />
                    <div className="w-16 h-[28px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)]" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left 2 Cols: Member Cards/Table Skeleton */}
                    <div className="lg:col-span-2 flex flex-col gap-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 rounded-[var(--radius-card,8px)] flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[var(--app-border)]/60" />
                                    <div className="flex flex-col gap-1.5">
                                        <div className="w-32 h-4 bg-[var(--app-border)]/60 rounded-[var(--radius-xs,2px)]" />
                                        <div className="w-44 h-3 bg-[var(--app-border)]/40 rounded-[var(--radius-xs,2px)]" />
                                    </div>
                                </div>
                                <div className="w-16 h-5 bg-[var(--app-border)]/40 rounded-full" />
                            </div>
                        ))}
                    </div>

                    {/* Right 1 Col: Sidebar Widgets Skeleton */}
                    <div className="flex flex-col gap-5">
                        <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-5 rounded-[var(--radius-card,8px)] flex flex-col gap-3">
                            <div className="w-28 h-4 bg-[var(--app-border)]/60 rounded-[var(--radius-xs,2px)]" />
                            <div className="h-2 bg-[var(--app-bg)] rounded-full border border-[var(--app-border)]" />
                            <div className="flex flex-col gap-2 pt-2">
                                <div className="w-full h-8 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)]" />
                                <div className="w-full h-8 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)]" />
                            </div>
                        </div>

                        <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-5 rounded-[var(--radius-card,8px)] flex flex-col gap-3">
                            <div className="w-32 h-4 bg-[var(--app-border)]/60 rounded-[var(--radius-xs,2px)]" />
                            <div className="w-full h-12 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)]" />
                            <div className="w-full h-12 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
