"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AccessRestrictedModalProps {
    title?: string;
    description?: string;
    allowedRoles?: string[];
    currentRole?: string;
    returnPath?: string;
    returnLabel?: string;
}

export default function AccessRestrictedModal({
    title = "Access Restricted",
    description = "The Dashboard is exclusive to Workspace Leaders and Observers. Team members do not have permission to view workspace analytics and leader controls.",
    allowedRoles = ["LEADER", "OBSERVER"],
    currentRole = "MEMBER",
    returnPath = "/task-board",
    returnLabel = "Return to Task Board",
}: AccessRestrictedModalProps) {
    const router = useRouter();

    return (
        <div className="w-full h-full min-h-[400px] flex flex-col justify-center items-center p-6 bg-[var(--app-bg)] text-center select-none font-sans">
            <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-8 sm:p-10 rounded-[3px] max-w-md w-full flex flex-col items-center gap-5 shadow-lg corner-brackets animate-fade-in text-center">
                {/* Badge / Icon */}
                <div className="w-14 h-14 rounded-full bg-[#CB2431]/10 border border-[#CB2431]/20 flex items-center justify-center text-[#CB2431] shrink-0">
                    <ShieldAlert className="w-7 h-7 stroke-[1.75]" />
                </div>

                {/* Title & Description */}
                <div className="flex flex-col gap-2">
                    <div className="inline-flex items-center justify-center gap-1.5 self-center px-2.5 py-0.5 rounded-[2px] bg-[#CB2431]/10 text-[#CB2431] border border-[#CB2431]/20 text-[10px] font-semibold uppercase tracking-wider">
                        Permission Denied
                    </div>
                    <h3 className="font-heading text-xl font-bold text-[var(--app-text)] leading-snug">
                        {title}
                    </h3>
                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Role details pill */}
                <div className="w-full bg-[var(--app-hover-bg)] border border-[var(--app-border)] rounded-[2px] p-2.5 flex items-center justify-between text-[11px]">
                    <span className="text-[var(--app-muted)]">Your Role:</span>
                    <span className="font-semibold text-[var(--app-text)] capitalize px-2 py-0.5 rounded bg-[var(--app-card)] border border-[var(--app-border)]">
                        {currentRole.toLowerCase()}
                    </span>
                </div>

                {/* Action button */}
                <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
                    <Button
                        type="button"
                        onClick={() => router.replace(returnPath)}
                        showDot
                        className="w-full py-2 text-xs"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        {returnLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
