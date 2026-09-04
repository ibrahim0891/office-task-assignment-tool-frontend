import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

export interface SelectOption {
    value: string;
    label: string;
    sublabel?: string;
    avatarUrl?: string | null;
    style?: React.CSSProperties;
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    buttonClassName?: string;
    disabled?: boolean;
    searchable?: boolean;
    renderSelected?: (selected: SelectOption) => React.ReactNode;
}

export function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    className = "",
    buttonClassName = "",
    disabled = false,
    searchable = false,
    renderSelected,
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUp: boolean }>({
        top: 0,
        left: 0,
        width: 120,
        openUp: false,
    });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOpt = options.find((o) => o.value === value);

    const filteredOptions = options.filter(
        (o) =>
            o.label.toLowerCase().includes(search.toLowerCase()) ||
            (o.sublabel &&
                o.sublabel.toLowerCase().includes(search.toLowerCase())),
    );

    const showSearch = searchable && options.length > 5;

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUp = spaceBelow < 220 && rect.top > 220;
            setCoords({
                top: openUp ? rect.top : rect.bottom,
                left: rect.left,
                width: Math.max(rect.width, 120),
                openUp,
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

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScrollOrResize, true);
        window.addEventListener("resize", handleScrollOrResize);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
        };
    }, [isOpen]);

    return (
        <div className={`relative select-none text-left ${className}`}>
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={handleToggle}
                className={`w-full h-full bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--color-accent)] rounded-[3px] px-2.5 py-1.5 text-[11px] text-[var(--app-text)] flex items-center justify-between gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isOpen
                        ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20"
                        : ""
                } ${buttonClassName}`}
            >
                {selectedOpt ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                        {selectedOpt.avatarUrl !== undefined && (
                            <UserAvatar
                                name={selectedOpt.label}
                                avatarUrl={selectedOpt.avatarUrl}
                                size="xs"
                            />
                        )}
                        {renderSelected ? (
                            renderSelected(selectedOpt)
                        ) : (
                            <span
                                className="font-medium truncate text-[var(--app-text)]"
                                style={selectedOpt.style}
                            >
                                {selectedOpt.label}
                            </span>
                        )}
                        {selectedOpt.sublabel && (
                            <span className="text-[9px] text-[var(--app-muted)] truncate">
                                ({selectedOpt.sublabel})
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-[var(--app-muted)] text-[11px] truncate">
                        {placeholder}
                    </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
            </button>

            {/* Floating Dropdown Menu via Portal */}
            {isOpen &&
                !disabled &&
                typeof window !== "undefined" &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        style={{
                            position: "fixed",
                            left: `${coords.left}px`,
                            top: coords.openUp ? "auto" : `${coords.top + 4}px`,
                            bottom: coords.openUp
                                ? `${window.innerHeight - coords.top + 4}px`
                                : "auto",
                            minWidth: `${coords.width}px`,
                            maxWidth: "280px",
                            zIndex: 1000000,
                            boxShadow: "var(--shadow-float)",
                        }}
                        className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-1 flex flex-col gap-1 animate-fade-in text-left select-none text-[var(--app-text)] corner-brackets shadow-2xl"
                    >
                        {showSearch && (
                            <div className="relative p-1">
                                <Search className="w-3 h-3 text-[var(--app-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Filter..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] pl-7 pr-2 py-1 text-[11px] text-[var(--app-text)] focus:outline-none focus:border-[var(--color-accent)]"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="max-h-48 overflow-y-auto divide-y divide-[var(--app-border)]/40 scrollbar-none">
                            {filteredOptions.length === 0 ? (
                                <div className="py-2.5 px-2 text-center text-xs text-[var(--app-muted)] italic">
                                    No options.
                                </div>
                            ) : (
                                filteredOptions.map((opt) => {
                                    const isSelected = opt.value === value;
                                    return (
                                        <div
                                            key={opt.value}
                                            onClick={() => {
                                                onChange(opt.value);
                                                setIsOpen(false);
                                                setSearch("");
                                            }}
                                            className={`px-2 py-1.5 text-[11px] rounded-[2px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                                isSelected
                                                    ? "bg-[var(--app-hover-bg)] font-semibold text-[var(--app-text)]"
                                                    : "text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {opt.avatarUrl !== undefined && (
                                                    <UserAvatar
                                                        name={opt.label}
                                                        avatarUrl={opt.avatarUrl}
                                                        size="xs"
                                                    />
                                                )}
                                                <div className="min-w-0">
                                                    <span
                                                        className="block truncate"
                                                        style={opt.style}
                                                    >
                                                        {opt.label}
                                                    </span>
                                                    {opt.sublabel && (
                                                        <span className="block text-[9px] text-[var(--app-muted)] truncate font-normal">
                                                            {opt.sublabel}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
