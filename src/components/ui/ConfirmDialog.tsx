"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    isLoading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = true,
    isLoading = false,
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isLoading) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isLoading, onClose]);

    if (!isOpen || !mounted || typeof document === "undefined") return null;

    const content = (
        <div className="fixed inset-0 z-[99999] overflow-hidden flex justify-center items-center p-4 select-none animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Dialog Box with Corner Decoration */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative bg-[var(--app-card)] border border-[var(--app-border-strong)] p-5 w-full max-w-sm flex flex-col gap-3.5 animate-fade-in corner-brackets-4 text-left shadow-2xl z-10 text-[var(--app-text)]"
            >
                <div className="flex flex-col gap-1">
                    <h3 className="font-heading text-base font-bold text-[var(--app-text)] tracking-tight">
                        {title}
                    </h3>
                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--app-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 border border-[var(--app-border)] hover:bg-[var(--app-hover-bg)] text-xs font-medium text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[3px] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-1.5 text-white font-medium text-xs rounded-[3px] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs ${
                            isDanger
                                ? "bg-[var(--color-error,#DC2626)] hover:opacity-90"
                                : "bg-[var(--color-accent)] hover:opacity-90"
                        }`}
                    >
                        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                        <span>{isLoading ? "Processing…" : confirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
