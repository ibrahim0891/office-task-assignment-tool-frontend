"use client";

import React from "react";
import { Users, RotateCcw } from "lucide-react";
import { User } from "@/api";
import { TeamMemberCard } from "./TeamMemberCard";

interface MemberTaskStats {
    active: number;
    completed: number;
    total: number;
}

interface TeamMembersGridProps {
    members: { user: User; role: string }[];
    currentUserId: string;
    isCurrentUserLeader: boolean;
    statsMap: Record<string, MemberTaskStats>;
    onSelect: (user: User) => void;
    onResetFilters?: () => void;
    onRoleChange?: (userId: string, newRole: string) => void;
    onRemoveMember?: (userId: string) => void;
}

export function TeamMembersGrid({
    members,
    currentUserId,
    isCurrentUserLeader,
    statsMap,
    onSelect,
    onResetFilters,
    onRoleChange,
    onRemoveMember,
}: TeamMembersGridProps) {
    if (members.length === 0) {
        return (
            <div className="bg-[var(--app-card)] border border-dashed border-[var(--app-border)] rounded-[var(--radius-card,8px)] p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)]">
                    <Users className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-[var(--app-text)]">
                        No team members found
                    </h4>
                    <p className="text-xs text-[var(--app-muted)] mt-1 max-w-sm">
                        No members match your current search query or role filter. Try resetting your filters.
                    </p>
                </div>
                {onResetFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm,4px)] text-xs font-medium bg-[var(--app-bg)] border border-[var(--app-border)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] transition-colors cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {members.map(({ user, role }) => {
                const stats = statsMap[user.id] || { active: 0, completed: 0, total: 0 };
                return (
                    <TeamMemberCard
                        key={user.id}
                        user={user}
                        role={role}
                        isSelf={user.id === currentUserId}
                        stats={stats}
                        onSelect={onSelect}
                        isCurrentUserLeader={isCurrentUserLeader}
                        onRoleChange={onRoleChange}
                        onRemoveMember={onRemoveMember}
                    />
                );
            })}
        </div>
    );
}
