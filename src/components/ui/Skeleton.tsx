"use client";

import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    variant?: "rectangular" | "rounded" | "circular" | "text";
}

export function Skeleton({
    className = "",
    variant = "rounded",
    ...props
}: SkeletonProps) {
    const variantClass =
        variant === "circular"
            ? "rounded-full"
            : variant === "text"
            ? "rounded-[2px] h-3.5"
            : variant === "rounded"
            ? "rounded-[3px]"
            : "rounded-none";

    return (
        <div
            className={`skeleton-shimmer ${variantClass} ${className}`}
            {...props}
        />
    );
}

export default Skeleton;
