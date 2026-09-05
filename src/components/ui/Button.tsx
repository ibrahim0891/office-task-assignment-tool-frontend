"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "danger" | "ghost" | "secondary";
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
            case "danger":
                variantClasses =
                    "bg-[var(--app-card)] hover:bg-[var(--color-error)]/10 border border-[var(--app-border)] hover:border-[var(--color-error)] text-[var(--color-error)]";
                break;
            case "ghost":
                variantClasses =
                    "bg-transparent hover:bg-[var(--app-hover-bg)] border border-transparent hover:border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)]";
                break;
            case "secondary":
                variantClasses =
                    "bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)]";
                break;
            default:
                variantClasses =
                    "bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)]";
                break;
        }

        let sizeClasses = "";
        switch (size) {
            case "sm":
                sizeClasses = "h-[32px] px-3.5 text-xs";
                break;
            case "lg":
                sizeClasses = "h-[46px] px-5 text-base";
                break;
            default:
                sizeClasses = "h-[36px] px-4 text-xs";
                break;
        }

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={`relative corner-brackets-4 font-medium rounded-[2px] transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
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
                            <span className="w-1.5 h-1.5 bg-[var(--app-muted)] rounded-[0.5px] inline-block shrink-0" />
                        )}
                        {icon}
                        {children && (
                            <span className="inline-flex items-center gap-1.5 leading-none">
                                {children}
                            </span>
                        )}
                    </>
                )}
            </button>
        );
    },
);

Button.displayName = "Button";
