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
                    className={`w-4 h-4 rounded-[2px] border transition-all duration-150 flex items-center justify-center ${checked
                        ? "bg-[#1A1A1A] border-[#1A1A1A] dark:bg-[var(--color-accent)] dark:border-[var(--color-accent)] text-white dark:text-[#1A1A1A]"
                        : "bg-white dark:bg-[var(--app-bg)] border-[#E5E5E3] dark:border-[var(--app-border)] hover:border-[#1A1A1A] dark:hover:border-[var(--color-accent)]"
                        }`}
                >
                    {checked && (
                        <Check className="w-3 h-3 text-white dark:text-[#1A1A1A] stroke-[2.5] animate-fade-in" />
                    )}
                </div>
            </div>
            {label && (
                <span className="text-xs text-[#1A1A1A] dark:text-[var(--app-text)] font-medium">
                    {label}
                </span>
            )}
        </label>
    );
};
