"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Plus, Settings, Search, Users } from "lucide-react";
import { Team } from "../../api";

interface DesktopWorkspaceMenuProps {
    teams: Team[];
    currentTeam: Team | null;
    setCurrentTeam: (team: Team) => void;
    onManageWorkspacesClick: () => void;
}

export function DesktopWorkspaceMenu({
    teams,
    currentTeam,
    setCurrentTeam,
    onManageWorkspacesClick,
}: DesktopWorkspaceMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [coords, setCoords] = useState<{ top: number; left: number }>({
        top: 0,
        left: 0,
    });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 6,
                left: Math.max(12, Math.min(rect.left, window.innerWidth - 272)),
            });
        }
    };

    const handleToggle = () => {
        if (!isOpen) {
            updateCoords();
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearch("");
            }
        };

        const handleScrollOrResize = () => {
            if (isOpen) {
                updateCoords();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
                setSearch("");
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScrollOrResize, true);
            window.addEventListener("resize", handleScrollOrResize);
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const filteredTeams = teams.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[3px] border transition-all cursor-pointer select-none ${
                    isOpen
                        ? "border-[var(--color-accent)] bg-[var(--app-hover-bg)] ring-1 ring-[var(--color-accent)]/20 shadow-xs"
                        : "border-[var(--app-border)] hover:border-[var(--app-border-strong)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)]"
                }`}
                title="Switch workspace"
            >
                <span className="emoji-font text-sm shrink-0">
                    {currentTeam?.emoji || "🧑‍💻"}
                </span>
                <span className="font-medium text-[12px] text-[var(--app-text)] max-w-[150px] sm:max-w-[180px] truncate text-left">
                    {currentTeam?.name || "Select Workspace"}
                </span>
                <ChevronDown
                    className={`w-3.5 h-3.5 text-[var(--app-muted)] transition-transform duration-150 ${
                        isOpen ? "rotate-180 text-[var(--app-text)]" : ""
                    }`}
                />
            </button>

            {/* Portal Dropdown Menu */}
            {isOpen &&
                typeof window !== "undefined" &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={{
                            position: "fixed",
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                            width: "260px",
                            zIndex: 999999,
                        }}
                        className="bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets shadow-float rounded-[3px] p-1.5 flex flex-col gap-1 animate-fade-in text-left select-none text-[var(--app-text)]"
                    >
                        {/* Header with Search if many teams */}
                        <div className="px-2 py-1 flex items-center justify-between border-b border-[var(--app-border)]/60 mb-0.5">
                            <span className="eyebrow text-[9px] font-bold text-[var(--app-muted)] tracking-wider">
                                WORKSPACES ({teams.length})
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    onManageWorkspacesClick();
                                }}
                                className="text-[10px] text-[var(--color-accent)] hover:underline font-medium cursor-pointer"
                            >
                                Manage
                            </button>
                        </div>

                        {teams.length > 5 && (
                            <div className="relative px-1 py-0.5">
                                <Search className="w-3 h-3 text-[var(--app-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Filter workspaces..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] pl-6 pr-2 py-1 text-[11px] text-[var(--app-text)] focus:outline-none focus:border-[var(--color-accent)]"
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* Team List */}
                        <div className="max-h-60 overflow-y-auto flex flex-col gap-0.5 custom-scrollbar">
                            {filteredTeams.length === 0 ? (
                                <div className="py-3 px-2 text-center text-[11px] text-[var(--app-muted)] italic">
                                    No workspaces found.
                                </div>
                            ) : (
                                filteredTeams.map((team) => {
                                    const isSelected = currentTeam?.id === team.id;
                                    return (
                                        <button
                                            key={team.id}
                                            type="button"
                                            onClick={() => {
                                                setCurrentTeam(team);
                                                setIsOpen(false);
                                                setSearch("");
                                            }}
                                            className={`flex items-center justify-between px-2.5 py-2 rounded-[2px] text-[12px] transition-all cursor-pointer text-left w-full ${
                                                isSelected
                                                    ? "bg-[var(--app-select-bg,#F0F0EE)] text-[var(--app-text)] font-semibold border-l-2 border-[var(--color-accent)]"
                                                    : "text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 truncate">
                                                <span className="emoji-font text-sm shrink-0">
                                                    {team.emoji || "🧑‍💻"}
                                                </span>
                                                <span className="truncate">
                                                    {team.name}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0 ml-1.5" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="border-t border-[var(--app-border)]/70 pt-1 mt-1 flex flex-col gap-0.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    onManageWorkspacesClick();
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-[11px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors w-full text-left cursor-pointer"
                            >
                                <Settings className="w-3.5 h-3.5 shrink-0" />
                                <span>Manage All Workspaces</span>
                            </button>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
