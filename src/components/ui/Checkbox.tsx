"use client";

import React from "react";
import { Check } from "lucide-react";

export interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: React.ReactNode;
    disabled?: boolean;
    className?: string;
    id?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    checked,
    onChange,
    label,
    disabled = false,
    className = "",
    id,
}) => {
    return (
        <label
            htmlFor={id}
            className={`inline-flex items-center gap-2 cursor-pointer select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""
                } ${className}`}
        >
            <div className="relative inline-flex items-center justify-center shrink-0">
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    className="sr-only peer"
                />
                {/* Custom Box */}
                <div
                    className={`w-4 h-4 rounded-[2px] border transition-all duration-150 flex items-center justify-center ${
                        checked
                            ? "bg-[var(--app-text)] border-[var(--app-text)] text-[var(--app-card)]"
                            : "bg-[var(--app-card)] border-[var(--app-border)] hover:border-[var(--app-text)]"
                    }`}
                >
                    {checked && (
                        <Check className="w-3 h-3 text-[var(--app-card)] stroke-[2.5] animate-fade-in" />
                    )}
                </div>
            </div>
            {label && (
                <span className="text-xs text-[var(--app-text)] font-medium">
                    {label}
                </span>
            )}
        </label>
    );
};
