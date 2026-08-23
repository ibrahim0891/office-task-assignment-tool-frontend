import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "./ui/Button";

interface PWAInstallPromptBannerProps {
    isStandalone: boolean;
    hasDeferredPrompt: boolean;
    isIOS: boolean;
    onOpenModal: () => void;
    onInstall: () => Promise<any>;
}

export default function PWAInstallPromptBanner({
    isStandalone,
    hasDeferredPrompt,
    isIOS,
    onOpenModal,
    onInstall,
}: PWAInstallPromptBannerProps) {
    const [isDismissed, setIsDismissed] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (isStandalone) {
            setIsDismissed(true);
            return;
        }

        const dismissedTime = localStorage.getItem("pwa_banner_dismissed_at");
        if (dismissedTime) {
            const timePassed = Date.now() - parseInt(dismissedTime, 10);
            if (timePassed < 3 * 24 * 60 * 60 * 1000) {
                setIsDismissed(true);
                return;
            }
        }
        setIsDismissed(false);
    }, [isStandalone]);

    if (isStandalone || isDismissed) return null;

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem("pwa_banner_dismissed_at", Date.now().toString());
    };

    const handleActionClick = async () => {
        if (hasDeferredPrompt) {
            await onInstall();
        } else {
            onOpenModal();
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-2rem)] bg-white border border-[#E5E5E3] p-3 shadow-sm flex items-center justify-between gap-3 text-[#1A1A1A] animate-fade-in corner-brackets-4">
            <div className="flex items-center gap-2.5 min-w-0">
                <img
                    src="/icon.png"
                    alt="OfficeTask Logo"
                    className="w-7 h-7 object-contain rounded-[2px] shrink-0 border border-[#E5E5E3] p-0.5"
                />
                <div className="flex flex-col min-w-0">
                    <span className="font-heading font-semibold text-xs text-[#1A1A1A] truncate">
                        Install OfficeTask App
                    </span>
                    <span className="eyebrow text-[9px] text-[#888883] truncate">
                        Desktop & mobile app access
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                <Button
                    size="sm"
                    onClick={handleActionClick}
                    icon={<Download className="w-3 h-3" />}
                >
                    Install
                </Button>
                <button
                    onClick={handleDismiss}
                    className="p-1 text-[#888883] hover:text-[#1A1A1A] transition-colors rounded-[2px] cursor-pointer"
                    title="Dismiss prompt"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
