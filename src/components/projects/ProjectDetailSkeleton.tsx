"use client";

import React from "react";
import { Skeleton } from "../ui/Skeleton";

export default function ProjectDetailSkeleton() {
    const [viewMode] = React.useState<"grid" | "list">(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("project_main_tasks_view_mode");
                if (saved === "grid" || saved === "list") return saved;
            } catch {}
        }
        return "grid";
    });

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--app-bg)] text-[var(--app-text)] animate-fade-in">
            {/* Top Navigation & Project Metadata Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[var(--app-border)] bg-[var(--app-card)] flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Left: Back button, Emoji, Title, Badges */}
                    <div className="flex items-center gap-3 min-w-0 flex-wrap">
                        <Skeleton className="w-7 h-7 rounded-[2px] shrink-0" />

                        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                            <Skeleton className="w-8 h-8 rounded-[3px] shrink-0" />
                            <Skeleton className="w-44 sm:w-64 h-6 rounded-[2px]" />

                            {/* Owning Team Badge Skeleton */}
                            <Skeleton className="w-24 h-5 rounded-[2px]" />

                            {/* Status Badge Skeleton */}
                            <Skeleton className="w-20 h-5 rounded-[2px]" />
                        </div>
                    </div>

                    {/* Right: Progress bar & Action buttons */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        {/* Progress Meter Skeleton */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-12 h-3.5" />
                            <Skeleton className="w-24 sm:w-28 h-2 rounded-[1px]" />
                            <Skeleton className="w-16 h-3.5" />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-24 sm:w-28 h-7 rounded-[2px]" />
                            <Skeleton className="w-24 sm:w-28 h-7 rounded-[2px]" />
                        </div>
                    </div>
                </div>

                {/* Sub-Header: Dates & Manager */}
                <div className="flex items-center justify-between pt-1 border-t border-[var(--app-border)]/60 flex-wrap gap-2">
                    <div className="flex items-center gap-4 flex-wrap">
                        <Skeleton className="w-36 h-3.5" />
                        <div className="flex items-center gap-1.5">
                            <Skeleton className="w-14 h-3.5" />
                            <Skeleton variant="circular" className="w-4 h-4" />
                            <Skeleton className="w-20 h-3.5" />
                        </div>
                    </div>
                    <Skeleton className="w-28 h-3.5" />
                </div>
            </div>

            {/* Tab Navigation Bar */}
            <div className="flex border-b border-[var(--app-border)] px-5 pt-1.5 gap-2 bg-[var(--app-card)] shrink-0 overflow-x-auto">
                {[
                    "w-24",
                    "w-20",
                    "w-20",
                    "w-20",
                    "w-20",
                ].map((width, idx) => (
                    <div key={idx} className="pb-2.5 px-2 flex items-center gap-1.5">
                        <Skeleton className="w-3.5 h-3.5 rounded-[2px]" />
                        <Skeleton className={`${width} h-3.5 rounded-[2px]`} />
                    </div>
                ))}
            </div>

            {/* Toolbar Filter Bar Skeleton */}
            <div className="shrink-0 px-5 py-2.5 bg-[var(--app-card)] border-b border-[var(--app-border)] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-wrap">
                    {/* Search */}
                    <Skeleton className="w-48 sm:w-60 h-8 rounded-[2px]" />
                    {/* Date mode */}
                    <Skeleton className="w-28 h-8 rounded-[2px]" />
                    {/* Status filter */}
                    <Skeleton className="w-28 sm:w-32 h-8 rounded-[2px]" />
                    {/* Priority filter */}
                    <Skeleton className="w-28 h-8 rounded-[2px]" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="w-28 h-8 rounded-[2px]" />
                    {/* View Switcher Toggle Skeleton */}
                    <Skeleton className="w-16 h-8 rounded-[2px]" />
                </div>
            </div>

            {/* Main Content Area Skeleton: Grid vs List */}
            <div className="flex-1 overflow-y-auto p-5">
                {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-5 flex flex-col justify-between gap-4.5"
                            >
                                <div className="flex flex-col gap-3">
                                    {/* Card Header: Title & Action */}
                                    <div className="flex items-start justify-between gap-2.5">
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <Skeleton className="w-3/4 h-5 rounded-[2px]" />
                                            <Skeleton className="w-1/2 h-3.5 rounded-[2px]" />
                                        </div>
                                        <Skeleton className="w-5 h-5 rounded-[2px] shrink-0" />
                                    </div>

                                    {/* Badges */}
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="w-16 h-5 rounded-[2px]" />
                                        <Skeleton className="w-20 h-5 rounded-[2px]" />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="flex items-center gap-2 pt-1">
                                    <Skeleton className="w-4 h-4 rounded-[2px]" />
                                    <Skeleton className="w-32 h-3.5 rounded-[2px]" />
                                </div>

                                {/* Subtasks Progress */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="w-16 h-3 rounded-[2px]" />
                                        <Skeleton className="w-20 h-3 rounded-[2px]" />
                                    </div>
                                    <Skeleton className="w-full h-1 rounded-full" />
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3.5 border-t border-[var(--app-border)] gap-2">
                                    <div className="flex -space-x-1.5">
                                        <Skeleton variant="circular" className="w-6 h-6" />
                                        <Skeleton variant="circular" className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Skeleton className="w-20 h-7 rounded-[2px]" />
                                        <Skeleton className="w-14 h-7 rounded-[2px]" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Table List Skeleton */
                    <div className="border border-[var(--app-border)] rounded-[3px] bg-[var(--app-card)] overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)] text-[10px] font-medium text-[var(--app-muted)]">
                                        <th className="py-3 px-4 font-semibold">Status</th>
                                        <th className="py-3 px-4 font-semibold">Task & Category</th>
                                        <th className="py-3 px-4 font-semibold">Priority</th>
                                        <th className="py-3 px-4 font-semibold">Members</th>
                                        <th className="py-3 px-4 font-semibold">Due Date</th>
                                        <th className="py-3 px-4 font-semibold">Subtasks Progress</th>
                                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <tr key={i} className="border-b border-[var(--app-border)]">
                                            <td className="py-3.5 px-4">
                                                <Skeleton className="w-20 h-5 rounded-[2px]" />
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col gap-1">
                                                    <Skeleton className="w-48 h-4 rounded-[2px]" />
                                                    <Skeleton className="w-32 h-3 rounded-[2px]" />
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <Skeleton className="w-16 h-4 rounded-[2px]" />
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex -space-x-1">
                                                    <Skeleton variant="circular" className="w-5 h-5" />
                                                    <Skeleton variant="circular" className="w-5 h-5" />
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <Skeleton className="w-24 h-3.5 rounded-[2px]" />
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="w-28 flex flex-col gap-1">
                                                    <Skeleton className="w-16 h-3 rounded-[2px]" />
                                                    <Skeleton className="w-full h-1 rounded-full" />
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Skeleton className="w-16 h-6 rounded-[2px]" />
                                                    <Skeleton className="w-12 h-6 rounded-[2px]" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
