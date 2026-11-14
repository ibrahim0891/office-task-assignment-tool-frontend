"use client";

import React from "react";
import { Search, X, ArrowUpDown, Filter } from "lucide-react";

export type RoleFilterType = "ALL" | "LEADER" | "MEMBER" | "OBSERVER";
export type SortOptionType = "name-asc" | "name-desc" | "tasks-desc" | "completed-desc" | "role";

interface TeamMembersToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    roleFilter: RoleFilterType;
    onRoleFilterChange: (role: RoleFilterType) => void;
    sortOption: SortOptionType;
    onSortChange: (sort: SortOptionType) => void;
    counts: {
        all: number;
        leaders: number;
        members: number;
        observers: number;
    };
}

export function TeamMembersToolbar({
    searchQuery,
    onSearchChange,
    roleFilter,
    onRoleFilterChange,
    sortOption,
    onSortChange,
    counts,
}: TeamMembersToolbarProps) {
    const roleTabs: { id: RoleFilterType; label: string; count: number }[] = [
        { id: "ALL", label: "All", count: counts.all },
        { id: "LEADER", label: "Leaders", count: counts.leaders },
        { id: "MEMBER", label: "Members", count: counts.members },
        { id: "OBSERVER", label: "Observers", count: counts.observers },
    ];

    return (
        <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-bg)] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
            {/* Search Input with Instant Clear */}
            <div className="relative w-64 sm:w-80">
                <Search className="w-3.5 h-3.5 text-[var(--app-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search by name, email, or designation..."
                    className="w-full bg-[var(--app-card)] border border-[var(--app-border)] focus:border-[var(--color-accent)] focus:outline-none text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] pl-8 pr-7 py-1 rounded-[var(--radius-sm,4px)] transition-colors h-[32px]"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-text)] p-0.5 cursor-pointer rounded-[var(--radius-xs,2px)]"
                        title="Clear search"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Right Controls: Role filter tabs + Sort dropdown */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Role Filter Tabs */}
                <div className="inline-flex items-center bg-[var(--app-card)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)] p-0.5 text-xs font-medium shrink-0">
                    {roleTabs.map((tab) => {
                        const isActive = roleFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onRoleFilterChange(tab.id)}
                                className={`px-2.5 py-1 rounded-[var(--radius-xs,2px)] transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isActive
                                        ? "bg-[var(--app-bg)] text-[var(--color-accent)] font-semibold shadow-3xs border border-[var(--app-border)]"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={`px-1.5 py-0.2 rounded-[var(--radius-xs,2px)] text-[9px] tabular-nums font-semibold ${
                                        isActive
                                            ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                                            : "bg-[var(--app-bg)] text-[var(--app-muted)] border border-[var(--app-border)]"
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)] px-2 h-[32px]">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                    <select
                        value={sortOption}
                        onChange={(e) => onSortChange(e.target.value as SortOptionType)}
                        className="bg-transparent text-xs text-[var(--app-text)] focus:outline-none cursor-pointer pr-1"
                    >
                        <option value="name-asc">Name (A–Z)</option>
                        <option value="name-desc">Name (Z–A)</option>
                        <option value="tasks-desc">Active Tasks</option>
                        <option value="completed-desc">Completed Tasks</option>
                        <option value="role">Role Priority</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
