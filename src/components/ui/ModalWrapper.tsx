"use client";

import React, { useEffect, useRef } from "react";

interface ModalWrapperProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string; // e.g. "max-w-4xl", "max-w-lg", "max-w-md"
    className?: string;
    closeOnEsc?: boolean;
    closeOnClickOutside?: boolean;
    zIndex?: string; // default "z-50"
}

export default function ModalWrapper({
    isOpen,
    onClose,
    children,
    maxWidth = "max-w-4xl",
    className = "",
    closeOnEsc = true,
    closeOnClickOutside = true,
    zIndex = "z-50",
}: ModalWrapperProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

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

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (closeOnClickOutside && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className={`fixed inset-0 ${zIndex} overflow-hidden flex justify-center items-center p-4 backdrop-blur-xs animate-fade-in`}
            onClick={handleBackdropClick}
        >
            {/* Dark Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={closeOnClickOutside ? onClose : undefined}
            />

            {/* Modal Dialog Content Container */}
            <div
                ref={dialogRef}
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full ${maxWidth} bg-[var(--app-card)] border border-[var(--app-border-strong)] text-[var(--app-text)] rounded-[3px] shadow-2xl flex flex-col corner-brackets-4 z-10 ${className}`}
            >
                {children}
            </div>
        </div>
    );
}
