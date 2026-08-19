"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { User } from "@/api";

interface AnnouncementBarProps {
    currentUser: User | null;
}

export default function AnnouncementBar({ currentUser }: AnnouncementBarProps) {
    return (
        <div className="bg-[var(--app-hover-bg)] text-[var(--app-text)] text-[12px] py-2 px-4 text-center flex items-center justify-center gap-2 border-b border-[var(--app-border)] transition-colors">
            <span className="inline-flex items-center gap-1 bg-[var(--app-card)] text-[var(--app-text)] border border-[var(--app-border)] font-semibold text-[10px] px-2 py-0.5 rounded-[2px] capitalize">
                v1.1.0 Release
            </span>
            <span className="text-[var(--app-muted)]">
                Role-based task assignment, Solar Map visualization are live.
            </span>
            <Link
                href={currentUser ? "/task-board" : "/login"}
                className="underline font-medium hover:text-[var(--app-text)] ml-1 flex items-center gap-0.5 text-[var(--app-text)]"
            >
                {currentUser ? "Open Workspace" : "Try Now"}{" "}
                <ChevronRight className="w-3 h-3" />
            </Link>
        </div>
    );
}
