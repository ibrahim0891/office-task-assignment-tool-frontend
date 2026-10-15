"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Loader2 } from "lucide-react";

export interface PriorityOption {
    value: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
    label: string;
    dotCls: string;
    badgeCls: string;
}

export const PRIORITY_CONFIGS: Record<string, PriorityOption> = {
    URGENT: {
        value: "URGENT",
        label: "Urgent",
        dotCls: "bg-[var(--priority-urgent,#CB2431)]",
        badgeCls: "text-[var(--priority-urgent,#CB2431)] bg-[var(--priority-urgent,#CB2431)]/10 border-[var(--priority-urgent,#CB2431)]/25 hover:bg-[var(--priority-urgent,#CB2431)]/15",
    },
    HIGH: {
        value: "HIGH",
        label: "High",
        dotCls: "bg-[var(--priority-high,#EA580C)]",
        badgeCls: "text-[var(--priority-high,#EA580C)] bg-[var(--priority-high,#EA580C)]/10 border-[var(--priority-high,#EA580C)]/25 hover:bg-[var(--priority-high,#EA580C)]/15",
    },
    MEDIUM: {
        value: "MEDIUM",
        label: "Medium",
        dotCls: "bg-[var(--priority-medium,#CA8A04)]",
        badgeCls: "text-[var(--priority-medium,#CA8A04)] bg-[var(--priority-medium,#CA8A04)]/10 border-[var(--priority-medium,#CA8A04)]/25 hover:bg-[var(--priority-medium,#CA8A04)]/15",
    },
    LOW: {
        value: "LOW",
        label: "Low",
        dotCls: "bg-[var(--priority-low,#6B7280)]",
        badgeCls: "text-[var(--priority-low,#6B7280)] bg-[var(--priority-low,#6B7280)]/10 border-[var(--priority-low,#6B7280)]/25 hover:bg-[var(--priority-low,#6B7280)]/15",
    },
};

const ORDERED_PRIORITIES: PriorityOption[] = [
    PRIORITY_CONFIGS.URGENT,
    PRIORITY_CONFIGS.HIGH,
    PRIORITY_CONFIGS.MEDIUM,
    PRIORITY_CONFIGS.LOW,
];

interface PrioritySelectBadgeProps {
    priority: string;
    onUpdate?: (newPriority: string) => Promise<void> | void;
    canEdit?: boolean;
    size?: "xs" | "sm" | "md";
    className?: string;
    showChevron?: boolean;
}

export default function PrioritySelectBadge({
    priority,
    onUpdate,
    canEdit = true,
    size = "sm",
    className = "",
    showChevron = true,
}: PrioritySelectBadgeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean }>({
        top: 0,
        left: 0,
        openUp: false,
    });

    const normKey = (priority || "MEDIUM").toUpperCase();
    const currentConfig = PRIORITY_CONFIGS[normKey] || PRIORITY_CONFIGS.LOW;

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const dropdownHeight = 155;
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

            let left = rect.left;
            const dropdownWidth = 140;
            if (left + dropdownWidth > window.innerWidth - 12) {
                left = Math.max(12, window.innerWidth - dropdownWidth - 12);
            }

            setCoords({
                top: openUp ? rect.top : rect.bottom,
                left,
                openUp,
            });
        }
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen) {
            updateCoords();
        }
        setIsOpen(!isOpen);
    };

    // Close on outside click, window resize, scroll, or escape key
    useEffect(() => {
        if (!isOpen) return;

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
            setIsOpen(false);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScrollOrResize, true);
        window.addEventListener("resize", handleScrollOrResize);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const handleSelect = async (p: PriorityOption, e: React.MouseEvent) => {
        e.stopPropagation();
        if (p.value === normKey) {
            setIsOpen(false);
            return;
        }
        if (!onUpdate) {
            setIsOpen(false);
            return;
        }

        try {
            setIsUpdating(true);
            await onUpdate(p.value);
            setIsOpen(false);
        } catch {
            // Handled in parent callback
        } finally {
            setIsUpdating(false);
        }
    };

    const sizeClasses =
        size === "xs"
            ? "text-[9px] px-1.5 py-0.5 rounded-[2px]"
            : size === "md"
            ? "text-[12px] px-2.5 py-1 rounded-[3px]"
            : "text-[11px] px-2 py-0.5 rounded-[2px]";

    const dotSizeClass = size === "xs" ? "w-1.5 h-1.5" : "w-2 h-2";
    const chevronSizeClass = size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3";

    if (!canEdit || !onUpdate) {
        return (
            <span
                className={`inline-flex items-center gap-1.5 font-semibold border ${currentConfig.badgeCls} ${sizeClasses} ${className}`}
                title={`Priority: ${currentConfig.label}`}
            >
                <span className={`${dotSizeClass} rounded-full ${currentConfig.dotCls} shrink-0`} />
                <span>{currentConfig.label}</span>
            </span>
        );
    }

    return (
        <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                disabled={isUpdating}
                className={`group inline-flex items-center gap-1.5 font-semibold border transition-all cursor-pointer select-none ${
                    currentConfig.badgeCls
                } ${sizeClasses} ${
                    isOpen ? "ring-1 ring-[var(--app-border-strong)] shadow-xs" : ""
                } ${className}`}
                title="Click to change priority"
            >
                {isUpdating ? (
                    <Loader2 className={`${chevronSizeClass} animate-spin shrink-0`} />
                ) : (
                    <span className={`${dotSizeClass} rounded-full ${currentConfig.dotCls} shrink-0`} />
                )}
                <span>{currentConfig.label}</span>
                {showChevron && (
                    <ChevronDown
                        className={`${chevronSizeClass} opacity-60 group-hover:opacity-100 transition-transform duration-150 shrink-0 ${
                            isOpen ? "rotate-180" : ""
                        }`}
                    />
                )}
            </button>

            {/* Portal-rendered floating dropdown menu to avoid overflow clipping and z-index overlap */}
            {isOpen &&
                typeof window !== "undefined" &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                            position: "fixed",
                            left: `${coords.left}px`,
                            top: coords.openUp ? "auto" : `${coords.top + 4}px`,
                            bottom: coords.openUp
                                ? `${window.innerHeight - coords.top + 4}px`
                                : "auto",
                            minWidth: "135px",
                            zIndex: 1000000,
                            boxShadow: "var(--shadow-float, 0 10px 25px -5px rgba(0,0,0,0.25))",
                        }}
                        className="rounded-[3px] bg-[var(--app-card)] border border-[var(--app-border-strong)] shadow-2xl py-1 select-none animate-in fade-in zoom-in-95 duration-100 text-[var(--app-text)]"
                    >
                        <div className="px-2.5 py-1 border-b border-[var(--app-border)] text-[9.5px] uppercase font-bold text-[var(--app-muted)] tracking-wider">
                            Set Priority
                        </div>
                        {ORDERED_PRIORITIES.map((p) => {
                            const isCurrent = p.value === normKey;
                            return (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={(e) => handleSelect(p, e)}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer text-left ${
                                        isCurrent
                                            ? "bg-[var(--app-hover-bg)] text-[var(--app-text)] font-semibold"
                                            : "text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${p.dotCls} shrink-0`} />
                                        <span>{p.label}</span>
                                    </div>
                                    {isCurrent && (
                                        <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>,
                    document.body
                )}
        </div>
    );
}
