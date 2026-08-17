import React, { useState, useRef, useEffect } from "react";
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
}

export function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    className = "",
    disabled = false,
    searchable = false,
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOpt = options.find((o) => o.value === value);

    const filteredOptions = options.filter(
        (o) =>
            o.label.toLowerCase().includes(search.toLowerCase()) ||
            (o.sublabel &&
                o.sublabel.toLowerCase().includes(search.toLowerCase())),
    );

    const showSearch = searchable && options.length > 5;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div
            ref={dropdownRef}
            className={`relative select-none text-left ${className}`}
        >
            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white border border-[#E5E5E3] hover:border-[#1A1A1A] rounded-[3px] px-2.5 py-1.5 text-[11px] text-[#1A1A1A] flex items-center justify-between gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isOpen ? "border-[#1A1A1A] ring-1 ring-[#1A1A1A]/10" : ""
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
                        <span className="font-medium truncate">
                            {selectedOpt.label}
                        </span>
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

            {/* Floating Dropdown Menu */}
            {isOpen && !disabled && (
                <div className="absolute left-0 top-full mt-1 min-w-full w-max max-w-[280px] bg-white border border-[#E5E5E3] rounded-[3px] shadow-2xl z-[9999] p-1 flex flex-col gap-1 corner-brackets animate-fade-in">
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

                    <div className="max-h-48 overflow-y-auto divide-y divide-[#E5E5E3]/40">
                        {filteredOptions.length === 0 ? (
                            <div className="py-2.5 px-2 text-center text-xs text-[#888883] italic">
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
                </div>
            )}
        </div>
    );
}
