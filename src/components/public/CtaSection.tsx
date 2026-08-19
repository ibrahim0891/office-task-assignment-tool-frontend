"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { User } from "@/api";

interface CtaSectionProps {
    currentUser: User | null;
}

export default function CtaSection({ currentUser }: CtaSectionProps) {
    return (
        <section className="bg-[var(--app-card)] text-[var(--app-text)] py-16 px-6 border-t border-[var(--app-border)] transition-colors">
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-5">
                <span className="eyebrow capitalize text-[var(--app-muted)] text-[11px] font-semibold">
                    Get Started
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[var(--app-text)]">
                    Transform Your Team's Daily Velocity Today.
                </h2>
                <p className="text-sm text-[var(--app-muted)] max-w-xl leading-relaxed">
                    Start assigning tasks, organizing knowledge, and tracking orbital workflow progress in minutes.
                </p>
                <Link
                    href={currentUser ? "/kanban" : "/login"}
                    className="btn-glass-shimmer mt-2 px-9 py-4 bg-[var(--app-text)] text-[var(--app-bg)] hover:opacity-95 font-bold text-[14.5px] rounded-[3px] shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-95"
                >
                    <span>{currentUser ? "Go to Workspace" : "Get Started — Free"}</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </section>
    );
}
