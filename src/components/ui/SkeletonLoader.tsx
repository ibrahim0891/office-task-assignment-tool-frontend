"use client";

import React from "react";

export const SkeletonBox: React.FC<{
    className?: string;
    style?: React.CSSProperties;
}> = ({ className = "", style }) => (
    <div
        className={`shimmer rounded-[3px] ${className}`}
        style={style}
    />
);

export const SkeletonBoard: React.FC = () => (
    <div className="flex gap-4 p-5 overflow-x-auto h-full w-full">
        {[1, 2, 3, 4].map((col) => (
            <div
                key={col}
                className="w-72 shrink-0 bg-white border border-[#E5E5E3] p-3 flex flex-col gap-3 rounded-[4px]"
            >
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
                    <SkeletonBox className="h-4 w-28" />
                    <SkeletonBox className="h-4 w-6 rounded-full" />
                </div>
                <div className="flex flex-col gap-2.5">
                    {[1, 2, 3].map((card) => (
                        <div
                            key={card}
                            className="p-3 border border-[#E5E5E3] bg-[#FAFAF9] flex flex-col gap-2 rounded-[3px]"
                        >
                            <SkeletonBox className="h-4 w-3/4" />
                            <SkeletonBox className="h-3 w-1/2" />
                            <div className="flex justify-between items-center pt-2 mt-1 border-t border-[#E5E5E3]">
                                <SkeletonBox className="h-3 w-16" />
                                <SkeletonBox className="h-5 w-5 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonList: React.FC = () => (
    <div className="p-5 flex flex-col gap-3 w-full">
        <div className="flex justify-between items-center mb-2">
            <SkeletonBox className="h-6 w-40" />
            <SkeletonBox className="h-8 w-32" />
        </div>
        <div className="bg-white border border-[#E5E5E3] rounded-[4px] p-4 flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((row) => (
                <div
                    key={row}
                    className="flex items-center justify-between p-3 border-b border-[#E5E5E3] last:border-0"
                >
                    <div className="flex items-center gap-3 w-1/3">
                        <SkeletonBox className="h-4 w-4 rounded-[2px]" />
                        <SkeletonBox className="h-4 w-full" />
                    </div>
                    <SkeletonBox className="h-4 w-20" />
                    <SkeletonBox className="h-4 w-24" />
                    <SkeletonBox className="h-6 w-6 rounded-full" />
                </div>
            ))}
        </div>
    </div>
);

export const SkeletonProfile: React.FC = () => (
    <div className="p-5 flex flex-col gap-5 w-full">
        <div className="bg-white border border-[#E5E5E3] p-5 rounded-[4px] flex items-center gap-4">
            <SkeletonBox className="w-14 h-14 rounded-full shrink-0" />
            <div className="flex flex-col gap-2 w-full">
                <SkeletonBox className="h-5 w-48" />
                <SkeletonBox className="h-3 w-64" />
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="bg-white border border-[#E5E5E3] p-5 rounded-[4px] flex flex-col gap-4">
                <SkeletonBox className="h-4 w-36 mb-2" />
                <SkeletonBox className="h-8 w-full" />
                <SkeletonBox className="h-8 w-full" />
                <SkeletonBox className="h-20 w-full" />
            </div>
            <div className="bg-white border border-[#E5E5E3] p-5 rounded-[4px] flex flex-col gap-4">
                <SkeletonBox className="h-4 w-36 mb-2" />
                <SkeletonBox className="h-8 w-full" />
                <SkeletonBox className="h-8 w-full" />
                <SkeletonBox className="h-8 w-full" />
            </div>
        </div>
    </div>
);

export const SkeletonReport: React.FC = () => (
    <div className="flex flex-col gap-4 w-full animate-fade-in">
        {/* 1. Executive Performance & Progress Card Skeleton */}
        <div className="border border-[var(--app-border)] bg-[var(--app-card)] rounded-[2px] corner-brackets p-4 flex flex-col gap-4 shadow-xs">
            {/* Header row: Avatar + Name */}
            <div className="flex items-center gap-3">
                <SkeletonBox className="w-9 h-9 rounded-[2px] shrink-0" />
                <div className="flex flex-col gap-1.5">
                    <SkeletonBox className="h-4 w-36" />
                    <SkeletonBox className="h-3 w-48" />
                </div>
            </div>

            {/* 4 Metric Stat Boxes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-[var(--app-bg)] border border-[var(--app-border)] p-3 rounded-[2px] flex flex-col gap-1.5"
                    >
                        <SkeletonBox className="h-2.5 w-16" />
                        <SkeletonBox className="h-6 w-14" />
                    </div>
                ))}
            </div>

            {/* Sleek Progress Bar Ribbon Skeleton */}
            <div className="flex flex-col gap-2 pt-1 border-t border-[var(--app-border)]">
                <SkeletonBox className="h-2 w-full rounded-[2px]" />
                <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-4">
                        <SkeletonBox className="h-3 w-14" />
                        <SkeletonBox className="h-3 w-16" />
                        <SkeletonBox className="h-3 w-20" />
                    </div>
                    <SkeletonBox className="h-3 w-24" />
                </div>
            </div>
        </div>

        {/* 2. Daily Activity Stream Card Skeleton */}
        <div className="border border-[var(--app-border)] bg-[var(--app-card)] rounded-[2px] corner-brackets p-3.5 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between">
                <SkeletonBox className="h-3.5 w-36" />
                <SkeletonBox className="h-3 w-28" />
            </div>

            {[1, 2].map((group) => (
                <div
                    key={group}
                    className="border border-[var(--app-border)] rounded-[2px] overflow-hidden flex flex-col bg-[var(--app-card)]"
                >
                    <div className="bg-[var(--app-bg)] px-3.5 py-1.5 border-b border-[var(--app-border)] flex items-center justify-between">
                        <SkeletonBox className="h-3 w-32" />
                        <SkeletonBox className="h-3 w-20" />
                    </div>
                    <div className="divide-y divide-[var(--app-border)]">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="p-2.5 flex items-center justify-between gap-3 border-l-2 border-l-[var(--app-border)]"
                            >
                                <div className="flex items-center gap-2 flex-1">
                                    <SkeletonBox className="h-4 w-12 rounded-[2px]" />
                                    <SkeletonBox className="h-3.5 w-1/2" />
                                </div>
                                <SkeletonBox className="h-3 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

