import React from "react";
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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-center items-center p-4 select-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Dialog Box with Corner Decoration */}
            <div
                className="relative bg-white border border-[#E5E5E3] p-5 w-full max-w-sm flex flex-col gap-3.5 animate-fade-in corner-brackets text-left shadow-2xl z-10"
            >
                <div className="flex flex-col gap-1">
                    <h3 className="font-heading text-base text-[#1A1A1A]">
                        {title}
                    </h3>
                    <p className="text-[11px] text-[#888883] leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-3.5 py-1.5 border border-[#E5E5E3] hover:bg-[#FAFAF9] text-[11px] font-medium text-[#888883] rounded-[3px] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-1.5 text-white font-medium text-[11px] rounded-[3px] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                            isDanger
                                ? "bg-[#CB2431] hover:bg-[#A01B26]"
                                : "bg-[#1A1A1A] hover:bg-[#333]"
                        }`}
                    >
                        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                        <span>{isLoading ? "Processing…" : confirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
