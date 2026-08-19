"use client";

import React from "react";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "danger" | "ghost" | "secondary";
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
    showDot?: boolean;
    children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "default",
            size = "md",
            icon,
            showDot = false,
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
                    "bg-white hover:bg-[#FFF5F5] border border-[#E5E5E3] hover:border-[#CB2431] text-[#CB2431]";
                break;
            case "ghost":
                variantClasses =
                    "bg-transparent hover:bg-[#FAFAF9] border border-transparent hover:border-[#E5E5E3] text-[#888883] hover:text-[#1A1A1A]";
                break;
            case "secondary":
                variantClasses =
                    "bg-[#FAFAF9] hover:bg-[#F0F0EE] border border-[#E5E5E3] text-[#1A1A1A]";
                break;
            default:
                variantClasses =
                    "bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A]";
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
                disabled={disabled}
                className={`relative corner-brackets-4 font-medium rounded-[2px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
                {...props}
            >
                {showDot && (
                    <span className="w-1.5 h-1.5 bg-[#555555] rounded-[0.5px] inline-block shrink-0" />
                )}
                {icon}
                {children && <span>{children}</span>}
            </button>
        );
    },
);

Button.displayName = "Button";
