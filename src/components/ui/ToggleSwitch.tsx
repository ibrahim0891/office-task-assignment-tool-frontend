"use client";

import React from "react";
import { playFeedback } from "../../utils/feedback";

export interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: React.ReactNode;
    description?: React.ReactNode;
    disabled?: boolean;
    size?: "sm" | "md";
    className?: string;
    id?: string;
    enableSound?: boolean;
    title?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    size = "sm",
    className = "",
    id,
    enableSound = true,
    title,
}) => {
    const handleToggle = () => {
        if (disabled) return;
        const next = !checked;
        if (enableSound) {
            playFeedback("toggle");
        }
        onChange(next);
    };

    const isSm = size === "sm";

    // sm: 34x20px with 16px thumb, md: 42x24px with 20px thumb
    const trackWidth = isSm ? "w-[34px] h-[20px]" : "w-[42px] h-[24px]";
    const thumbSize = isSm ? "w-[16px] h-[16px]" : "w-[20px] h-[20px]";
    const thumbTranslate = isSm
        ? checked
            ? "translate-x-[14px]"
            : "translate-x-[2px]"
        : checked
        ? "translate-x-[18px]"
        : "translate-x-[2px]";

    const switchElement = (
        <button
            type="button"
            role="switch"
            id={id}
            aria-checked={checked}
            disabled={disabled}
            onClick={handleToggle}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggle();
                }
            }}
            title={title || (typeof label === "string" ? label : undefined)}
            className={`relative inline-flex items-center shrink-0 cursor-pointer rounded-full border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent,#1A1A1A)] focus-visible:ring-offset-1 select-none ${trackWidth} ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
            } ${
                checked
                    ? "bg-[var(--color-accent,#1A1A1A)] border-[var(--color-accent,#1A1A1A)] shadow-sm"
                    : "bg-[var(--app-hover-bg,#E5E5E3)] border-[var(--app-border-strong,#DADAD6)] hover:border-[var(--app-muted,#888883)]"
            }`}
        >
            <span
                className={`pointer-events-none inline-block transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-out my-auto ${thumbSize} ${thumbTranslate}`}
            />
        </button>
    );

    if (!label && !description) {
        return <div className={className}>{switchElement}</div>;
    }

    return (
        <div
            className={`flex items-center justify-between gap-3 py-1 ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
            } ${className}`}
        >
            <div className="flex flex-col select-none">
                {label && (
                    <span
                        onClick={!disabled ? handleToggle : undefined}
                        className={`text-[11px] font-medium text-[var(--app-text,#1A1A1A)] transition-colors ${
                            !disabled ? "cursor-pointer" : ""
                        }`}
                    >
                        {label}
                    </span>
                )}
                {description && (
                    <span className="text-[10px] text-[var(--app-muted,#888883)] leading-snug">
                        {description}
                    </span>
                )}
            </div>
            {switchElement}
        </div>
    );
};
