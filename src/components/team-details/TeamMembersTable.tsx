"use client";

import React from "react";
import { Mail, MessageSquare, Phone, Trash2, ArrowUpDown, Users, RotateCcw } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { User } from "@/api";
import { RoleBadge, formatGithubUrl, formatTelegramUrl, formatWhatsappUrl } from "./TeamMemberCard";

function GithubIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
        </svg>
    );
}

interface MemberTaskStats {
    active: number;
    completed: number;
    total: number;
}

interface TeamMembersTableProps {
    members: { user: User; role: string }[];
    currentUserId: string;
    isCurrentUserLeader: boolean;
    statsMap: Record<string, MemberTaskStats>;
    onSelect: (user: User) => void;
    onResetFilters?: () => void;
    onRoleChange?: (userId: string, newRole: string) => void;
    onRemoveMember?: (userId: string) => void;
}

export function TeamMembersTable({
    members,
    currentUserId,
    isCurrentUserLeader,
    statsMap,
    onSelect,
    onResetFilters,
    onRoleChange,
    onRemoveMember,
}: TeamMembersTableProps) {
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
        <div className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[var(--radius-card,8px)] overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)]/60 text-[11px] font-semibold text-[var(--app-muted)] select-none">
                            <th className="py-2.5 px-4 min-w-[220px]">Member</th>
                            <th className="py-2.5 px-4 min-w-[180px]">Email</th>
                            <th className="py-2.5 px-4 w-[120px]">Role</th>
                            <th className="py-2.5 px-4 min-w-[180px]">Workload & Velocity</th>
                            <th className="py-2.5 px-4 w-[130px] text-right">Contact</th>
                            {isCurrentUserLeader && (
                                <th className="py-2.5 px-3 w-[50px] text-center">Action</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--app-border)] select-text">
                        {members.map(({ user, role }) => {
                            const name = user.fullName || user.name || "Unknown";
                            const isSelf = user.id === currentUserId;
                            const stats = statsMap[user.id] || { active: 0, completed: 0, total: 0 };
                            const completionPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                            const githubUrl = formatGithubUrl(user.github);
                            const telegramUrl = formatTelegramUrl(user.telegram);
                            const whatsappUrl = formatWhatsappUrl(user.whatsapp);

                            return (
                                <tr
                                    key={user.id}
                                    onClick={() => onSelect(user)}
                                    className="hover:bg-[var(--app-hover-bg)]/50 transition-colors cursor-pointer group"
                                >
                                    {/* Member Info */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <UserAvatar
                                                name={name}
                                                avatarUrl={user.avatarUrl}
                                                size="md"
                                                showBorder={false}
                                            />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-[var(--app-text)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                                                        {name}
                                                    </span>
                                                    {isSelf && (
                                                        <span className="text-[10px] text-[var(--app-muted)] font-normal shrink-0">
                                                            (You)
                                                        </span>
                                                    )}
                                                </div>
                                                {user.designation && (
                                                    <span className="text-[11px] text-[var(--app-muted)] truncate block mt-0.5">
                                                        {user.designation}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Email */}
                                    <td className="py-3 px-4">
                                        <a
                                            href={`mailto:${user.email}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] hover:underline truncate block"
                                            title={user.email}
                                        >
                                            {user.email}
                                        </a>
                                    </td>

                                    {/* Role */}
                                    <td className="py-3 px-4" onClick={(e) => isCurrentUserLeader && !isSelf && e.stopPropagation()}>
                                        {isCurrentUserLeader && !isSelf && onRoleChange ? (
                                            <select
                                                value={role.toUpperCase()}
                                                onChange={(e) => onRoleChange(user.id, e.target.value)}
                                                className="text-[10px] font-semibold uppercase bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-xs,2px)] text-[var(--app-text)] px-1.5 py-0.5 focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                                            >
                                                <option value="MEMBER">Member</option>
                                                <option value="LEADER">Leader</option>
                                                <option value="OBSERVER">Observer</option>
                                            </select>
                                        ) : (
                                            <RoleBadge role={role} />
                                        )}
                                    </td>

                                    {/* Workload */}
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col gap-1 max-w-[200px]">
                                            <div className="flex items-center justify-between text-[11px] text-[var(--app-muted)]">
                                                <div>
                                                    <span className="font-semibold text-[var(--app-text)]">{stats.active}</span> active
                                                    <span className="mx-1 opacity-40">•</span>
                                                    <span className="font-semibold text-[var(--color-success)]">{stats.completed}</span> done
                                                </div>
                                                <span className="text-[10px] font-medium tabular-nums">{completionPercent}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-[var(--app-bg)] rounded-full overflow-hidden border border-[var(--app-border)]">
                                                <div
                                                    className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
                                                    style={{ width: `${completionPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contacts */}
                                    <td className="py-3 px-4 text-right">
                                        <div
                                            className="flex items-center justify-end gap-1 select-none"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <a
                                                href={`mailto:${user.email}`}
                                                title={`Email ${user.email}`}
                                                className="p-1.5 rounded-[var(--radius-xs,2px)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-bg)] border border-transparent hover:border-[var(--app-border)] transition-colors"
                                            >
                                                <Mail className="w-3.5 h-3.5" />
                                            </a>
                                            {githubUrl && (
                                                <a
                                                    href={githubUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title={`GitHub profile`}
                                                    className="p-1.5 rounded-[var(--radius-xs,2px)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-bg)] border border-transparent hover:border-[var(--app-border)] transition-colors"
                                                >
                                                    <GithubIcon className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                            {telegramUrl && (
                                                <a
                                                    href={telegramUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title={`Telegram`}
                                                    className="p-1.5 rounded-[var(--radius-xs,2px)] text-[var(--app-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--app-bg)] border border-transparent hover:border-[var(--app-border)] transition-colors"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                            {whatsappUrl && (
                                                <a
                                                    href={whatsappUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title={`WhatsApp`}
                                                    className="p-1.5 rounded-[var(--radius-xs,2px)] text-[var(--app-muted)] hover:text-[var(--color-success)] hover:bg-[var(--app-bg)] border border-transparent hover:border-[var(--app-border)] transition-colors"
                                                >
                                                    <Phone className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </td>

                                    {/* Action Column for Leaders */}
                                    {isCurrentUserLeader && (
                                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            {!isSelf && onRemoveMember ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveMember(user.id)}
                                                    title="Remove member from team"
                                                    className="p-1.5 rounded-[var(--radius-xs,2px)] text-[var(--app-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 border border-transparent hover:border-[var(--color-error)]/20 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-[var(--app-muted)]">—</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
