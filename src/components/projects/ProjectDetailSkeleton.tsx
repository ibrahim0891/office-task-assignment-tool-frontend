"use client";

import React from "react";
import { Skeleton } from "../ui/Skeleton";

export default function ProjectDetailSkeleton() {
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
                                <Skeleton className="w-24 h-4 rounded-[2px]" />
                                <Skeleton variant="circular" className="w-5 h-4" />
                            </div>
                            <Skeleton className="w-4 h-4 rounded-[2px]" />
                        </div>

                        {/* Task Cards */}
                        <div className="flex-1 flex flex-col gap-2.5 overflow-hidden">
                            {[1, 2, 3].slice(0, colIndex === 4 ? 1 : colIndex === 3 ? 2 : 3).map((cardIndex) => (
                                <div
                                    key={cardIndex}
                                    className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] flex flex-col gap-2.5"
                                >
                                    {/* Card Header & Title */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <Skeleton className="w-14 h-3.5 rounded-[2px]" />
                                            <Skeleton className="w-full h-4 rounded-[2px]" />
                                            <Skeleton className="w-3/4 h-3.5 rounded-[2px]" />
                                        </div>
                                    </div>

                                    {/* Date & SLA row */}
                                    <div className="flex items-center justify-between pt-1 border-t border-[var(--app-border)]/60">
                                        <Skeleton className="w-28 h-3 rounded-[2px]" />
                                        <Skeleton className="w-14 h-3 rounded-[2px]" />
                                    </div>

                                    {/* Assignee & Subtask progress */}
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex -space-x-1">
                                            <Skeleton variant="circular" className="w-5 h-5" />
                                            <Skeleton variant="circular" className="w-5 h-5" />
                                        </div>
                                        <Skeleton className="w-16 h-3 rounded-[2px]" />
                                    </div>
                                    <Skeleton className="w-full h-1.5 rounded-[1px]" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
