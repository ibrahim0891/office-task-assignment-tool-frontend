"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
    showDot?: boolean;
    isLoading?: boolean;
    loadingText?: React.ReactNode;
    children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "default",
            size = "md",
            icon,
            showDot = false,
            isLoading = false,
            loadingText,
            children,
            className = "",
            disabled,
            ...props
        },
        ref,
    ) => {
        let variantClasses = "";
        switch (variant) {
            case "primary":
                variantClasses =
                    "bg-[var(--app-text)] hover:opacity-90 border border-[var(--app-text)] text-[var(--app-bg)] font-semibold shadow-xs";
                break;
            case "danger":
                variantClasses =
                    "bg-[var(--app-card)] hover:bg-[#FFF5F5] border border-[var(--app-border)] hover:border-[var(--color-error)] text-[var(--color-error)]";
                break;
            case "ghost":
                variantClasses =
                    "bg-transparent hover:bg-[var(--app-hover-bg)] border border-transparent hover:border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)]";
                break;
            case "secondary":
            default:
                variantClasses =
                    "bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)]";
                break;
        }

        let sizeClasses = "";
        switch (size) {
            case "sm":
                sizeClasses = "h-[30px] px-3.5 text-[10px]";
                break;
            case "lg":
                sizeClasses = "h-[46px] px-5 text-base";
                break;
            default:
                sizeClasses = "h-[36px] px-4 text-[11px]";
                break;
        }

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={`relative corner-brackets-4 font-medium rounded-[2px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        <span>{loadingText || children || "Loading..."}</span>
                    </>
                ) : (
                    <>
                        {showDot && (
                            <span className="w-1.5 h-1.5 bg-[#555555] rounded-[0.5px] inline-block shrink-0" />
                        )}
                        {icon}
                        {children && <span>{children}</span>}
                    </>
                )}
            </button>
        );
    },
);

Button.displayName = "Button";
