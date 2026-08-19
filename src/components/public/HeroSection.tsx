"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { User } from "@/api";

interface HeroSectionProps {
    currentUser: User | null;
}

export default function HeroSection({ currentUser }: HeroSectionProps) {
    return (
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-[var(--app-border)]">
            {/* Crisp Architectural Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--app-border-strong)_1px,transparent_1px),linear-gradient(to_bottom,var(--app-border-strong)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_85%_70%_at_50%_25%,#000_75%,transparent_100%)] opacity-70 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(var(--app-border-strong)_1px,transparent_1px)] bg-[size:1.75rem_1.75rem] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_30%,#000_65%,transparent_100%)] opacity-45 pointer-events-none" />

            <div className="relative max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-[var(--app-border)] bg-[var(--app-card)]/20 backdrop-blur-md text-[11px] font-medium text-[var(--app-muted)] mb-6 shadow-xs animate-fade-in">
                    <span>Precision Workflow & Team Assignment Platform</span>
                </div>

                {/* Main Headline */}
                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--app-text)] max-w-4xl leading-[1.12]">
                    Effortless task delegation.
                    <br />
                    <span className="font-serif italic font-normal opacity-70">
                        Uncompromised team clarity.
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="mt-6 text-base sm:text-lg text-[var(--app-muted)] max-w-2xl leading-relaxed">
                    A bespoke workspace engineered for modern teams. Role-based
                    execution, dynamic Kanban, interactive Solar maps, and
                    unified document management in one high-velocity system.
                </p>

                {/* CTA Actions */}
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <Link
                        href={currentUser ? "/task-board" : "/login"}
                        className="target-bracket-btn group w-full sm:w-auto px-8 py-3.5 bg-[var(--app-text)] hover:opacity-95 text-[var(--app-bg)] text-[14.5px] font-semibold rounded-[3px] shadow-sm transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95"
                    >
                        <span className="btn-shimmer-beam" />
                        <span>
                            {currentUser
                                ? "Open Workspace"
                                : "Launch Workspace Free"}
                        </span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" />
                    </Link>
                    <a
                        href="#showcase"
                        onClick={(e) => {
                            e.preventDefault();
                            const lenis = (window as any).__lenis;
                            if (lenis) {
                                lenis.scrollTo("#showcase", { offset: -70 });
                                window.history.pushState(null, "", "#showcase");
                            } else {
                                const elem =
                                    document.getElementById("showcase");
                                if (elem) {
                                    elem.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                    });
                                    window.history.pushState(
                                        null,
                                        "",
                                        "#showcase",
                                    );
                                }
                            }
                        }}
                        className="target-bracket-btn-secondary group w-full sm:w-auto px-7 py-3.5 border border-[var(--app-border)]/35 hover:border-[var(--app-border)]/60 bg-[var(--app-card)] text-[var(--app-text)] text-[14.5px] font-medium rounded-[3px] transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                    >
                        <span className="btn-shimmer-beam" />
                        <span className="relative z-10">
                            Explore Interactive Demo
                        </span>
                    </a>
                </div>

                {/* Metrics Bar */}
                <div className="mt-14 pt-8 border-t border-[var(--app-border)] grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl text-left">
                    <div className="flex flex-col gap-1 border-l-2 border-[var(--app-text)] pl-3">
                        <span className="font-heading text-2xl font-bold text-[var(--app-text)]">
                            3-Tier
                        </span>
                        <span className="text-[11px] text-[var(--app-muted)] capitalize">
                            Role Governance
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 border-l-2 border-[var(--app-text)] pl-3">
                        <span className="font-heading text-2xl font-bold text-[var(--app-text)]">
                            0.1s
                        </span>
                        <span className="text-[11px] text-[var(--app-muted)] capitalize">
                            Realtime Sync
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 border-l-2 border-[var(--app-text)] pl-3">
                        <span className="font-heading text-2xl font-bold text-[var(--app-text)]">
                            Solar
                        </span>
                        <span className="text-[11px] text-[var(--app-muted)] capitalize">
                            Orbital Workload Map
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 border-l-2 border-[var(--app-text)] pl-3">
                        <span className="font-heading text-2xl font-bold text-[var(--app-text)]">
                            Integrated
                        </span>
                        <span className="text-[11px] text-[var(--app-muted)] capitalize">
                            Docs & Bookmarks
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
