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

const AVATAR_PALETTES = [
    { bg: "bg-blue-500/15 dark:bg-blue-500/25", text: "text-blue-700 dark:text-blue-300", border: "border-blue-500/30" },
    { bg: "bg-emerald-500/15 dark:bg-emerald-500/25", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/30" },
    { bg: "bg-violet-500/15 dark:bg-violet-500/25", text: "text-violet-700 dark:text-violet-300", border: "border-violet-500/30" },
    { bg: "bg-amber-500/15 dark:bg-amber-500/25", text: "text-amber-700 dark:text-amber-300", border: "border-amber-500/30" },
    { bg: "bg-rose-500/15 dark:bg-rose-500/25", text: "text-rose-700 dark:text-rose-300", border: "border-rose-500/30" },
    { bg: "bg-cyan-500/15 dark:bg-cyan-500/25", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-500/30" },
    { bg: "bg-indigo-500/15 dark:bg-indigo-500/25", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-500/30" },
    { bg: "bg-orange-500/15 dark:bg-orange-500/25", text: "text-orange-700 dark:text-orange-300", border: "border-orange-500/30" },
    { bg: "bg-teal-500/15 dark:bg-teal-500/25", text: "text-teal-700 dark:text-teal-300", border: "border-teal-500/30" },
];

function getAvatarColor(name?: string | null) {
    if (!name) return { bg: "bg-[var(--app-hover-bg)]", text: "text-[var(--app-text)]", border: "border-[var(--app-border-strong)]" };
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[index];
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

    const colorScheme = getAvatarColor(name);

    const borderClass = showBorder
        ? (colorScheme.border ? `border ${colorScheme.border}` : "border border-[var(--app-border-strong)]")
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
                className={`rounded-full object-cover shrink-0 bg-[var(--app-bg)] ${sizeClasses} ${borderClass} ${className}`}
            />
        );
    }

    return (
        <div
            className={`rounded-full ${colorScheme.bg} ${colorScheme.text} flex items-center justify-center font-bold shrink-0 select-none shadow-2xs ${sizeClasses} ${borderClass} ${className}`}
            title={displayTitle}
        >
            {initials || "U"}
        </div>
    );
}

export default UserAvatar;
