import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check } from "lucide-react";

export interface SelectOption {
    value: string;
    label: string;
    sublabel?: string;
    avatarUrl?: string | null;
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
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
                className={`w-full h-full bg-white border border-[#E5E5E3] hover:border-[#1A1A1A] rounded-[3px] px-2.5 py-1.5 text-[11px] text-[#1A1A1A] flex items-center justify-between gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isOpen ? "border-[#1A1A1A] ring-1 ring-[#1A1A1A]/10" : ""
                    }`}
            >
                {selectedOpt ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                        {selectedOpt.avatarUrl !== undefined &&
                            (selectedOpt.avatarUrl ? (
                                <img
                                    src={selectedOpt.avatarUrl}
                                    alt={selectedOpt.label}
                                    className="w-4 h-4 rounded-[2px] object-cover border border-[#E5E5E3] shrink-0"
                                />
                            ) : (
                                <div className="w-4 h-4 rounded-[2px] border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-[7px] font-bold text-[#1A1A1A] shrink-0">
                                    {selectedOpt.label
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)}
                                </div>
                            ))}
                        {renderSelected ? (
                            renderSelected(selectedOpt)
                        ) : (
                            <span className="font-medium truncate">
                                {selectedOpt.label}
                            </span>
                        )}
                        {selectedOpt.sublabel && (
                            <span className="text-[9px] text-[#888883] truncate">
                                ({selectedOpt.sublabel})
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-[#888883] text-[11px] truncate">
                        {placeholder}
                    </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-[#888883] shrink-0" />
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
                            bottom: coords.openUp ? `${window.innerHeight - coords.top + 4}px` : "auto",
                            minWidth: `${coords.width}px`,
                            maxWidth: "280px",
                            zIndex: 99999,
                        }}
                        className="bg-white border border-[#E5E5E3] rounded-[3px] shadow-2xl p-1 flex flex-col gap-1 animate-fade-in text-left select-none"
                    >
                        {showSearch && (
                            <div className="relative p-1">
                                <Search className="w-3 h-3 text-[#888883] absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Filter..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[2px] pl-7 pr-2 py-1 text-[11px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="max-h-48 overflow-y-auto divide-y divide-[#E5E5E3]/40 scrollbar-none">
                            {filteredOptions.length === 0 ? (
                                <div className="py-2.5 px-2 text-center text-base text-[#888883] italic">
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
                                            className={`px-2 py-1.5 text-[11px] rounded-[2px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${isSelected
                                                    ? "bg-[#FAFAF9] font-semibold text-[#1A1A1A]"
                                                    : "text-[#1A1A1A] hover:bg-[#FAFAF9]"
                                                }`}
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {opt.avatarUrl !== undefined &&
                                                    (opt.avatarUrl ? (
                                                        <img
                                                            src={opt.avatarUrl}
                                                            alt={opt.label}
                                                            className="w-4 h-4 rounded-[2px] object-cover border border-[#E5E5E3] shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-[2px] border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-[7px] font-bold text-[#1A1A1A] shrink-0">
                                                            {opt.label
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .toUpperCase()
                                                                .slice(0, 2)}
                                                        </div>
                                                    ))}
                                                <div className="min-w-0">
                                                    <span className="block truncate">
                                                        {opt.label}
                                                    </span>
                                                    {opt.sublabel && (
                                                        <span className="block text-[9px] text-[#888883] truncate font-normal">
                                                            {opt.sublabel}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" />
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
