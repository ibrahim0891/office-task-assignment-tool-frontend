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
