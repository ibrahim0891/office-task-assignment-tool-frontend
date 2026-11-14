"use client";

import React from "react";
import { Mail, MessageSquare, Phone, MoreHorizontal, Shield, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { User } from "@/api";

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

export function formatGithubUrl(val?: string | null): string {
    if (!val) return "";
    const clean = val.trim();
    if (!clean) return "";
    if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
    if (clean.startsWith("github.com/") || clean.startsWith("www.github.com/")) {
        return `https://${clean}`;
    }
    return `https://github.com/${clean.replace(/^@+/, "")}`;
}

export function formatTelegramUrl(val?: string | null): string {
    if (!val) return "";
    const clean = val.trim();
    if (!clean) return "";
    if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
    if (clean.startsWith("t.me/")) {
        return `https://${clean}`;
    }
    return `https://t.me/${clean.replace(/^@+/, "")}`;
}

export function formatWhatsappUrl(val?: string | null): string {
    if (!val) return "";
    const clean = val.trim();
    if (!clean) return "";
    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("wa.me/")) {
        return clean.startsWith("wa.me/") ? `https://${clean}` : clean;
    }
    const digits = clean.replace(/[^0-9]/g, "");
    return digits ? `https://wa.me/${digits}` : "";
}

export function RoleBadge({ role }: { role: string }) {
    const r = (role || "MEMBER").toUpperCase();
    if (r === "LEADER") {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs,2px)] text-[10px] font-semibold tracking-wide uppercase bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 shadow-3xs">
                Leader
            </span>
        );
    }
    if (r === "OBSERVER") {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs,2px)] text-[10px] font-semibold tracking-wide uppercase bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20 shadow-3xs">
                Observer
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-xs,2px)] text-[10px] font-semibold tracking-wide uppercase bg-[var(--app-bg)] text-[var(--app-muted)] border border-[var(--app-border)] shadow-3xs">
            Member
        </span>
    );
}

interface MemberTaskStats {
    active: number;
    completed: number;
    total: number;
}

interface TeamMemberCardProps {
    user: User;
    role: string;
    isSelf: boolean;
    stats: MemberTaskStats;
    onSelect: (user: User) => void;
    isCurrentUserLeader?: boolean;
    onRoleChange?: (userId: string, newRole: string) => void;
    onRemoveMember?: (userId: string) => void;
}

export function TeamMemberCard({
    user,
    role,
    isSelf,
    stats,
    onSelect,
    isCurrentUserLeader = false,
    onRoleChange,
    onRemoveMember,
}: TeamMemberCardProps) {
    const name = user.fullName || user.name || "Unknown";
    const githubUrl = formatGithubUrl(user.github);
    const telegramUrl = formatTelegramUrl(user.telegram);
    const whatsappUrl = formatWhatsappUrl(user.whatsapp);

    const completionPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
        <div
            onClick={() => onSelect(user)}
            className="group bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] p-4 rounded-[var(--radius-card,8px)] transition-all hover:bg-[var(--app-hover-bg)]/40 cursor-pointer shadow-3xs flex flex-col justify-between gap-3 min-w-0 select-text h-full"
        >
            {/* Top Row: Avatar & Details */}
            <div className="flex items-start gap-3 min-w-0">
                <div className="shrink-0 pt-0.5">
                    <UserAvatar
                        name={name}
                        avatarUrl={user.avatarUrl}
                        size="lg"
                        showBorder={false}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="text-sm font-semibold text-[var(--app-text)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                                {name}
                            </h4>
                            {isSelf && (
                                <span className="text-[10px] text-[var(--app-muted)] font-normal shrink-0">
                                    (You)
                                </span>
                            )}
                        </div>
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
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
                        </div>
                    </div>

                    <a
                        href={`mailto:${user.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] hover:underline truncate block mt-0.5"
                    >
                        {user.email}
                    </a>

                    {user.designation && (
                        <p className="text-xs text-[var(--app-muted)] truncate mt-0.5">
                            {user.designation}
                        </p>
                    )}
                </div>
            </div>

            {/* Middle: Bio if present */}
            {user.bio ? (
                <p className="text-xs italic text-[var(--app-muted)] line-clamp-2 leading-relaxed">
                    "{user.bio}"
                </p>
            ) : (
                <div className="h-0" />
            )}

            {/* Bottom Section: Workload progress + Contact row */}
            <div className="flex flex-col gap-2 pt-2.5 border-t border-[var(--app-border)]/60 text-xs text-[var(--app-muted)] mt-auto select-none">
                {/* Progress bar */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                        <div>
                            <span className="font-semibold text-[var(--app-text)]">{stats.active}</span> active
                            <span className="mx-1.5 opacity-40">•</span>
                            <span className="font-semibold text-[var(--color-success)]">{stats.completed}</span> done
                        </div>
                        <span className="text-[10px] font-medium text-[var(--app-muted)]">
                            {completionPercent}%
                        </span>
                    </div>
                    <div className="w-full h-1 bg-[var(--app-bg)] rounded-full overflow-hidden border border-[var(--app-border)]">
                        <div
                            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                </div>

                {/* Contact Links & Admin remove */}
                <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <a
                            href={`mailto:${user.email}`}
                            title={`Email: ${user.email}`}
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

                    {isCurrentUserLeader && !isSelf && onRemoveMember && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                onClick={() => onRemoveMember(user.id)}
                                title="Remove member from team"
                                className="p-1.5 rounded-[var(--radius-xs,2px)] text-[var(--app-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 border border-transparent hover:border-[var(--color-error)]/20 transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
