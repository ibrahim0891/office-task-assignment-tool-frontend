import React from "react";
import { X, Download, Share, MoreVertical, Monitor, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "./ui/Button";

interface PWAInstallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInstall: () => Promise<any>;
    hasDeferredPrompt: boolean;
    isIOS: boolean;
}

export default function PWAInstallModal({
    isOpen,
    onClose,
    onInstall,
    hasDeferredPrompt,
    isIOS,
}: PWAInstallModalProps) {
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleInstallClick = async () => {
        if (hasDeferredPrompt) {
            const res = await onInstall();
            if (res === "accepted") {
                onClose();
            }
        } else {
            toast(
                "Browser prompt not triggered automatically. Please look for the Install icon in your browser address bar or menu.",
                { icon: "ℹ️", duration: 4000 }
            );
        }
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in cursor-pointer"
        >
            <div
                className="relative w-full max-w-sm bg-white border border-[#E5E5E3] p-5 shadow-sm text-[#1A1A1A] flex flex-col gap-4 corner-brackets font-sans cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/icon.png"
                            alt="OfficeTask Logo"
                            className="w-8 h-8 object-contain rounded-[2px] border border-[#E5E5E3] p-0.5 shrink-0"
                        />
                        <div className="flex flex-col">
                            <h3 className="font-heading font-bold text-base text-[#1A1A1A]">
                                Install OfficeTask App
                            </h3>
                            <span className="eyebrow text-[10px] text-[#888883]">
                                Standalone Desktop & Mobile App
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-[#888883] hover:text-[#1A1A1A] transition-colors rounded-[2px] cursor-pointer"
                        title="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Divider */}
                <div className="border-t border-[#E5E5E3]" />

                {/* Description */}
                <p className="text-[11px] text-[#888883] leading-relaxed">
                    Install OfficeTask to run in a clean, dedicated app window with fast loading and push notifications support.
                </p>

                {/* Main Install Button */}
                <div className="flex flex-col gap-2 pt-1">
                    <Button
                        onClick={handleInstallClick}
                        icon={<Download className="w-3.5 h-3.5" />}
                        className="w-full"
                    >
                        Install Application Now
                    </Button>
                </div>

                {/* Optional Instructions Box if deferred prompt is not available */}
                {!hasDeferredPrompt && (
                    isIOS ? (
                        <div className="bg-[#FAFAF9] border border-[#E5E5E3] p-3 rounded-[2px] flex flex-col gap-2 text-[11px]">
                            <div className="font-medium flex items-center gap-1.5 text-[#1A1A1A]">
                                <Smartphone className="w-3.5 h-3.5 text-[#888883]" />
                                <span>iOS Safari Instructions:</span>
                            </div>
                            <ol className="list-decimal list-inside text-[#888883] space-y-1 text-[10px]">
                                <li>
                                    Tap <Share className="w-3 h-3 inline mx-0.5 text-[#1A1A1A]" /> <strong>Share</strong> in toolbar.
                                </li>
                                <li>Select <strong>Add to Home Screen</strong>.</li>
                                <li>Tap <strong>Add</strong> at top right.</li>
                            </ol>
                        </div>
                    ) : (
                        <div className="bg-[#FAFAF9] border border-[#E5E5E3] p-3 rounded-[2px] flex flex-col gap-2 text-[11px]">
                            <div className="font-medium flex items-center gap-1.5 text-[#1A1A1A]">
                                <Monitor className="w-3.5 h-3.5 text-[#888883]" />
                                <span>Browser Install Option:</span>
                            </div>
                            <ul className="text-[#888883] space-y-1 text-[10px]">
                                <li>
                                    Click <Download className="w-3 h-3 inline mx-0.5 text-[#1A1A1A]" /> in address bar or select <strong>Menu (<MoreVertical className="w-3 h-3 inline text-[#1A1A1A]" />) ➔ Install OfficeTask</strong>.
                                </li>
                            </ul>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
