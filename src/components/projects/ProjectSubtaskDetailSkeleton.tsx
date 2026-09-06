"use client";

import React from "react";
import { Skeleton } from "../ui/Skeleton";

export default function ProjectSubtaskDetailSkeleton() {
    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--app-bg)] text-[var(--app-text)] animate-fade-in">
            {/* Top Navigation & Task Metadata Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[var(--app-border)] bg-[var(--app-card)] flex flex-col gap-3">
                {/* Breadcrumbs Skeleton */}
                <div className="flex items-center gap-2">
                    <Skeleton className="w-12 h-3 rounded-[2px]" />
                    <span className="text-[10px] text-[var(--app-muted)]">/</span>
                    <Skeleton className="w-24 h-3 rounded-[2px]" />
                    <span className="text-[10px] text-[var(--app-muted)]">/</span>
                    <Skeleton className="w-32 h-3 rounded-[2px]" />
                </div>

                {/* Task Identity & Metadata Group */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <Skeleton className="w-7 h-7 rounded-[2px] shrink-0" />
                            <Skeleton className="w-48 sm:w-64 h-6 rounded-[2px]" />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Skeleton className="w-14 h-5 rounded-[2px]" />
                            <Skeleton className="w-20 h-6 rounded-[2px]" />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-4 flex-wrap">
                            <Skeleton className="w-36 h-3.5" />
                            <div className="flex items-center gap-1.5">
                                <Skeleton className="w-24 h-3.5" />
                                <div className="flex -space-x-1">
                                    <Skeleton variant="circular" className="w-4 h-4" />
                                    <Skeleton variant="circular" className="w-4 h-4" />
                                    <Skeleton variant="circular" className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Skeleton className="w-12 h-3.5" />
                            <Skeleton className="w-24 h-2 rounded-[1px]" />
                            <Skeleton className="w-16 h-3.5" />
                        </div>
                    </div>
                </div>

                {/* Subtask Controls Bar */}
                <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-[var(--app-border)]/60 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Date Navigation Skeleton */}
                        <Skeleton className="w-48 h-6 rounded-[2px]" />
                        {/* Member Filter Select */}
                        <Skeleton className="w-28 h-6 rounded-[2px]" />
                    </div>

                    {/* New Subtask Button */}
                    <Skeleton className="w-24 h-6 rounded-[2px]" />
                </div>
            </div>

            {/* Kanban Columns Grid Skeleton */}
            <div className="flex-1 p-4 flex gap-4 overflow-x-auto overflow-y-hidden">
                {[1, 2, 3, 4].map((colIndex) => (
                    <div
                        key={colIndex}
                        className="w-72 sm:w-80 shrink-0 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-3 flex flex-col gap-3 max-h-full"
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-[var(--app-border)]">
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-20 h-4 rounded-[2px]" />
                                <Skeleton variant="circular" className="w-5 h-4" />
                            </div>
                            <div className="flex items-center gap-1">
                                <Skeleton className="w-5 h-5 rounded-[2px]" />
                                <Skeleton className="w-5 h-5 rounded-[2px]" />
                            </div>
                        </div>

                        {/* Subtask Cards */}
                        <div className="flex-1 flex flex-col gap-2.5 overflow-hidden">
                            {[1, 2, 3].slice(0, colIndex === 4 ? 1 : colIndex === 3 ? 2 : 3).map((cardIndex) => (
                                <div
                                    key={cardIndex}
                                    className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] flex flex-col gap-2.5"
                                >
                                    {/* Card Header & Title */}
                                    <div className="flex items-start gap-2">
                                        <Skeleton variant="circular" className="w-4 h-4 shrink-0 mt-0.5" />
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <Skeleton className="w-full h-4 rounded-[2px]" />
                                            <Skeleton className="w-3/4 h-3.5 rounded-[2px]" />
                                        </div>
                                    </div>

                                    {/* Assignee, Priority & Est. Days */}
                                    <div className="flex items-center justify-between pt-1 border-t border-[var(--app-border)]/60">
                                        <div className="flex items-center gap-1.5">
                                            <Skeleton variant="circular" className="w-4 h-4" />
                                            <Skeleton className="w-16 h-3 rounded-[2px]" />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Skeleton className="w-12 h-3.5 rounded-[2px]" />
                                            <Skeleton className="w-10 h-3.5 rounded-[2px]" />
                                        </div>
                                    </div>

                                    {/* Comments & Date */}
                                    <div className="flex items-center justify-between pt-0.5">
                                        <Skeleton className="w-10 h-3 rounded-[2px]" />
                                        <Skeleton className="w-16 h-3 rounded-[2px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
