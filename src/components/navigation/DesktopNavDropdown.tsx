"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { NavItem } from "./types";

interface DesktopNavDropdownProps {
    title: string;
    items: NavItem[];
    onItemClick?: (id: string) => void;
}

export function DesktopNavDropdown({
    title,
    items,
    onItemClick,
}: DesktopNavDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number }>({
        top: 0,
        left: 0,
    });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const isAnyActive = items.some(
        (item) =>
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(`${item.href}/`)),
    );

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 4,
                left: Math.max(12, Math.min(rect.left, window.innerWidth - 220)),
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
        const handleClickOutside = (e: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
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

    return (
        <div className="relative shrink-0">
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-all rounded-[2px] cursor-pointer select-none ${
                    isAnyActive
                        ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold border border-[var(--app-border)] corner-brackets-4 shadow-3xs"
                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                }`}
            >
                <span>{title}</span>
                <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        isOpen
                            ? "rotate-180 text-[var(--app-text)]"
                            : "text-[var(--app-muted)]"
                    }`}
                />
            </button>

            {isOpen &&
                typeof window !== "undefined" &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={{
                            position: "fixed",
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                            width: "220px",
                            zIndex: 999999,
                        }}
                        className="bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets shadow-float rounded-[3px] py-1.5 z-50 animate-fade-in flex flex-col gap-0.5 text-left"
                    >
                        <div className="px-3 py-1 text-[9px] font-semibold text-[var(--app-muted)] uppercase tracking-wider border-b border-[var(--app-border)]/60 mb-1">
                            {title}
                        </div>
                        {items.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/" &&
                                    pathname?.startsWith(`${item.href}/`));

                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => {
                                        setIsOpen(false);
                                        if (onItemClick) onItemClick(item.id);
                                    }}
                                    className={`flex items-center justify-between px-3 py-2 text-[12px] transition-colors ${
                                        isActive
                                            ? "bg-[var(--app-hover-bg)] text-[var(--app-text)] font-semibold border-l-2 border-[var(--color-accent)]"
                                            : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <Icon className="w-4 h-4 shrink-0 text-[var(--app-muted)]" />
                                        <span className="truncate">{item.name}</span>
                                    </div>
                                    {item.leaderOnly && (
                                        <span className="text-[9px] text-[#CB2431] font-semibold border border-[#CB2431]/20 px-1 py-0.2 rounded-[2px]">
                                            Lead
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>,
                    document.body,
                )}
        </div>
    );
}
