"use client";

import React, { useState } from "react";

interface UserAvatarProps {
    name?: string | null;
    avatarUrl?: string | null;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
    className?: string;
    title?: string;
    showBorder?: boolean;
}

function getInitials(name?: string | null) {
    if (!name) return "";
    return name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function UserAvatar({
    name = "",
    avatarUrl,
    size = "sm",
    className = "",
    title,
    showBorder = true,
}: UserAvatarProps) {
    const [imgError, setImgError] = useState(false);

    let sizeClasses = "w-5 h-5 text-[8px]";
    if (size === "xs") sizeClasses = "w-4 h-4 text-[7px]";
    else if (size === "sm") sizeClasses = "w-5 h-5 text-[8px]";
    else if (size === "md") sizeClasses = "w-6 h-6 text-[9px]";
    else if (size === "lg") sizeClasses = "w-8 h-8 text-[11px]";
    else if (size === "xl") sizeClasses = "w-11 h-11 text-xs";

    const borderClass = showBorder
        ? "border border-[var(--app-border-strong)]"
        : "";

    const initials = getInitials(name);
    const displayTitle = title || name || "User";

    if (avatarUrl && !imgError) {
        return (
            <img
                src={avatarUrl}
                alt={displayTitle}
                title={displayTitle}
                onError={() => setImgError(true)}
                className={`rounded-full object-cover shrink-0 bg-[var(--app-card)] ${sizeClasses} ${borderClass} ${className}`}
            />
        );
    }

    return (
        <div
            className={`rounded-full bg-[var(--app-card)] flex items-center justify-center font-semibold text-[var(--app-text)] shrink-0 select-none ${sizeClasses} ${borderClass} ${className}`}
            title={displayTitle}
        >
            {initials || "U"}
        </div>
    );
}

export default UserAvatar;
