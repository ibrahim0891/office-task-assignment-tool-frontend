"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface SideSheetWrapperProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
    className?: string;
    closeOnEsc?: boolean;
    closeOnClickOutside?: boolean;
    zIndex?: string; // default "z-50"
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

const WIDTH_CLASSES = {
    md: "w-full sm:w-[500px] md:w-[600px]",
    lg: "w-full sm:w-[580px] md:w-[720px] lg:w-[800px]",
    xl: "w-full sm:w-[640px] md:w-[780px] lg:w-[880px] xl:w-[960px]",
    "2xl": "w-full sm:w-[700px] md:w-[860px] lg:w-[980px] xl:w-[1100px]",
    "3xl": "w-full md:w-[92vw] lg:w-[90vw] max-w-7xl",
    full: "w-full",
};

export default function SideSheetWrapper({
    isOpen,
    onClose,
    children,
    width = "xl",
    className = "",
    closeOnEsc = true,
    closeOnClickOutside = true,
    zIndex = "z-50",
    isExpanded = false,
}: SideSheetWrapperProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Coordinate mount, slide-in, and exit unmount animations
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender) {
            setIsClosing(true);
            timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, 240);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isOpen, shouldRender]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen || !closeOnEsc) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, closeOnEsc, onClose]);

    // Lock body scroll while side sheet is active
    useEffect(() => {
        if (shouldRender) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [shouldRender]);

    if (!mounted || !shouldRender) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (closeOnClickOutside && e.target === e.currentTarget) {
            onClose();
        }
    };

    const widthClass = isExpanded ? WIDTH_CLASSES["3xl"] : WIDTH_CLASSES[width] || WIDTH_CLASSES.xl;

    const content = (
        <div
            className={`fixed inset-0 ${zIndex} overflow-hidden ${
                !isClosing ? "pointer-events-auto" : "pointer-events-none"
            }`}
            onClick={handleBackdropClick}
        >
            {/* Dark Backdrop Overlay */}
            <div
                className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] ${
                    isClosing ? "animate-sidesheet-backdrop-out" : "animate-sidesheet-backdrop-in"
                }`}
                onClick={closeOnClickOutside ? onClose : undefined}
            />

            {/* Side Sheet Panel: Anchored firmly at the right edge of viewport and slides in from right */}
            <div
                ref={sheetRef}
                onClick={(e) => e.stopPropagation()}
                className={`fixed top-0 right-0 bottom-0 h-full ${widthClass} max-w-full bg-[var(--app-card)] border-l border-[var(--app-border-strong)] text-[var(--app-text)] shadow-2xl flex flex-col z-10 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isClosing ? "animate-sidesheet-out" : "animate-sidesheet-in"
                } ${className}`}
            >
                {children}
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
