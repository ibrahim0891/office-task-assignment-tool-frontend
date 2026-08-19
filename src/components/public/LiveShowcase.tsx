"use client";

import React, { useState } from "react";
import {
    Kanban,
    Network,
    LayoutDashboard,
    BookOpen,
    CheckCircle2
} from "lucide-react";
import SolarMapPreview from "@/components/SolarMapPreview";

export default function LiveShowcase() {
    const [activeTab, setActiveTab] = useState<"kanban" | "map" | "dashboard" | "docs">("kanban");

    return (
        <section id="showcase" className="py-20 bg-[var(--app-card)] border-b border-[var(--app-border)]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="eyebrow capitalize text-[var(--app-muted)] text-[11px] font-semibold">
                        Live Interface Showcase
                    </span>
                    <h2 className="font-heading text-3xl font-bold text-[var(--app-text)] mt-2">
                        Engineered for Clarity & Momentum
                    </h2>
                    <p className="text-sm text-[var(--app-muted)] mt-2">
                        Toggle between primary views to see how SM Technology powers modern engineering and operations.
                    </p>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex items-center justify-center gap-2.5 mb-8 flex-wrap">
                    <button
                        onClick={() => setActiveTab("kanban")}
                        className={`btn-glass-shimmer px-4.5 py-2.5 text-[12.5px] font-semibold rounded-[3px] border transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${activeTab === "kanban"
                            ? "bg-[var(--app-select-bg)] text-[var(--app-text)] border-[var(--app-border-strong)] shadow-xs ring-1 ring-[var(--app-text)]/20"
                            : "bg-[var(--app-card)] text-[var(--app-muted)] border-[var(--app-border)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-text)]"
                            }`}
                    >
                        <Kanban className="w-3.5 h-3.5" />
                        <span>Task Board (Kanban)</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("map")}
                        className={`btn-glass-shimmer px-4.5 py-2.5 text-[12.5px] font-semibold rounded-[3px] border transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${activeTab === "map"
                            ? "bg-[var(--app-select-bg)] text-[var(--app-text)] border-[var(--app-border-strong)] shadow-xs ring-1 ring-[var(--app-text)]/20"
                            : "bg-[var(--app-card)] text-[var(--app-muted)] border-[var(--app-border)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-text)]"
                            }`}
                    >
                        <Network className="w-3.5 h-3.5" />
                        <span>Solar Relational Map</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className={`btn-glass-shimmer px-4.5 py-2.5 text-[12.5px] font-semibold rounded-[3px] border transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${activeTab === "dashboard"
                            ? "bg-[var(--app-select-bg)] text-[var(--app-text)] border-[var(--app-border-strong)] shadow-xs ring-1 ring-[var(--app-text)]/20"
                            : "bg-[var(--app-card)] text-[var(--app-muted)] border-[var(--app-border)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-text)]"
                            }`}
                    >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Leader Dashboard</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("docs")}
                        className={`btn-glass-shimmer px-4.5 py-2.5 text-[12.5px] font-semibold rounded-[3px] border transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${activeTab === "docs"
                            ? "bg-[var(--app-select-bg)] text-[var(--app-text)] border-[var(--app-border-strong)] shadow-xs ring-1 ring-[var(--app-text)]/20"
                            : "bg-[var(--app-card)] text-[var(--app-muted)] border-[var(--app-border)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-text)]"
                            }`}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Docs & Knowledge Base</span>
                    </button>
                </div>

                {/* Showcase Mockup Window */}
                <div className="relative border border-[var(--app-border)] rounded-[4px] bg-[var(--app-bg)] p-4 lg:p-6 shadow-md corner-brackets">
                    {/* Top Window Bar */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--app-border)] text-[11px] text-[var(--app-muted)]">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#CB2431]" />
                            <span className="w-2.5 h-2.5 rounded-full bg-[#B08800]" />
                            <span className="w-2.5 h-2.5 rounded-full bg-[#22863A]" />
                            <span className="ml-2 font-mono text-[10px] text-[var(--app-muted)]">workspace.smtechnology.internal / {activeTab}</span>
                        </div>
                        <span className="font-medium bg-[var(--app-card)] px-2 py-0.5 border border-[var(--app-border)] text-[var(--app-text)] rounded-[2px]">
                            Interactive Demonstration
                        </span>
                    </div>

                    {/* Tab Content 1: Kanban */}
                    {activeTab === "kanban" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                            {/* Col 1 */}
                            <div className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-3.5 flex flex-col gap-3">
                                <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[var(--app-muted)]" />
                                        <span className="text-xs font-bold text-[var(--app-text)]">BACKLOG</span>
                                    </div>
                                    <span className="text-[10px] font-mono bg-[var(--app-bg)] px-1.5 py-0.5 border border-[var(--app-border)] text-[var(--app-text)] rounded">2</span>
                                </div>
                                <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] flex flex-col gap-2 hover:border-[var(--app-text)] transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-[#B08800] bg-[#B08800]/10 px-1.5 py-0.5 rounded">HIGH</span>
                                        <span className="text-[10px] text-[var(--app-muted)]">Est: 4h</span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-[var(--app-text)]">API Rate Limiting & Proxy Middleware</h4>
                                    <p className="text-[10px] text-[var(--app-muted)]">Implement token bucket algorithms for internal service requests.</p>
                                </div>
                                <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] flex flex-col gap-2 hover:border-[var(--app-text)] transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-[#22863A] bg-[#22863A]/10 px-1.5 py-0.5 rounded">MEDIUM</span>
                                        <span className="text-[10px] text-[var(--app-muted)]">Est: 2h</span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-[var(--app-text)]">Export Reports to CSV / PDF</h4>
                                    <p className="text-[10px] text-[var(--app-muted)]">Weekly summary sheet download for team leaders.</p>
                                </div>
                            </div>

                            {/* Col 2 */}
                            <div className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-3.5 flex flex-col gap-3">
                                <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#B08800]" />
                                        <span className="text-xs font-bold text-[var(--app-text)]">IN PROGRESS</span>
                                    </div>
                                    <span className="text-[10px] font-mono bg-[var(--app-bg)] px-1.5 py-0.5 border border-[var(--app-border)] text-[var(--app-text)] rounded">1</span>
                                </div>
                                <div className="p-3 bg-[var(--app-card)] border border-[var(--app-text)] shadow-xs rounded-[2px] flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-[#CB2431] bg-[#CB2431]/10 px-1.5 py-0.5 rounded">URGENT</span>
                                        <span className="text-[10px] font-semibold text-[#CB2431]">Due Today</span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-[var(--app-text)]">Route Groups & Architecture Refactor</h4>
                                    <p className="text-[10px] text-[var(--app-muted)]">Organize (auth), (dashboard) and (public) folders cleanly.</p>
                                    <div className="flex items-center justify-between pt-2 border-t border-[var(--app-border)]">
                                        <span className="text-[10px] text-[var(--app-text)] font-medium">Assigned to: Lead Engineer</span>
                                        <span className="w-5 h-5 rounded-full bg-[var(--app-text)] text-[var(--app-bg)] text-[9px] flex items-center justify-center font-bold">LE</span>
                                    </div>
                                </div>
                            </div>

                            {/* Col 3 */}
                            <div className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-3.5 flex flex-col gap-3">
                                <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-[#22863A]" />
                                        <span className="text-xs font-bold text-[var(--app-text)]">COMPLETED</span>
                                    </div>
                                    <span className="text-[10px] font-mono bg-[var(--app-bg)] px-1.5 py-0.5 border border-[var(--app-border)] text-[var(--app-text)] rounded">2</span>
                                </div>
                                <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] opacity-80 flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 text-[#22863A] text-[10px] font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Task Verified</span>
                                    </div>
                                    <h4 className="text-xs font-medium line-through text-[var(--app-muted)]">Google Docs / Sheets Live Embedding</h4>
                                </div>
                                <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] opacity-80 flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 text-[#22863A] text-[10px] font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Task Verified</span>
                                    </div>
                                    <h4 className="text-xs font-medium line-through text-[var(--app-muted)]">Nord & LWS Dark Themes Engine</h4>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Content 2: Solar Map */}
                    {activeTab === "map" && (
                        <SolarMapPreview />
                    )}

                    {/* Tab Content 3: Dashboard */}
                    {activeTab === "dashboard" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                            <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 rounded-[3px] flex flex-col gap-1">
                                <span className="text-[10px] text-[var(--app-muted)] capitalize font-bold">Completion Velocity</span>
                                <span className="text-2xl font-bold font-heading text-[var(--app-text)]">94.2%</span>
                                <span className="text-[10px] text-[#22863A] font-medium">+12% vs previous sprint</span>
                            </div>
                            <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 rounded-[3px] flex flex-col gap-1">
                                <span className="text-[10px] text-[var(--app-muted)] capitalize font-bold">Active Assignments</span>
                                <span className="text-2xl font-bold font-heading text-[var(--app-text)]">18 Tasks</span>
                                <span className="text-[10px] text-[var(--app-muted)]">Spread across 6 engineers</span>
                            </div>
                            <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 rounded-[3px] flex flex-col gap-1">
                                <span className="text-[10px] text-[var(--app-muted)] capitalize font-bold">Overdue Tasks</span>
                                <span className="text-2xl font-bold font-heading text-[#22863A]">0</span>
                                <span className="text-[10px] text-[#22863A] font-medium">All milestones on track</span>
                            </div>
                        </div>
                    )}

                    {/* Tab Content 4: Docs & Knowledge */}
                    {activeTab === "docs" && (
                        <div className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-5 flex flex-col md:flex-row gap-5 animate-fade-in">
                            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[var(--app-border)] pr-4 flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-[var(--app-muted)] capitalize">Documentation Index</span>
                                <div className="p-2 bg-[var(--app-bg)] border-l-2 border-[var(--app-text)] text-xs font-semibold text-[var(--app-text)]">
                                    Architecture Blueprint & Schemas
                                </div>
                                <div className="p-2 hover:bg-[var(--app-bg)] text-xs text-[var(--app-muted)]">
                                    Deployment Guide & CI/CD
                                </div>
                                <div className="p-2 hover:bg-[var(--app-bg)] text-xs text-[var(--app-muted)]">
                                    Security Policies & Token Access
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                <h3 className="font-heading text-base font-bold text-[var(--app-text)]">Architecture Blueprint & Schemas</h3>
                                <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                                    Dual-pane WYSIWYG TipTap editor with markdown support, instantaneous autosave, and inline document printing.
                                </p>
                                <div className="mt-3 p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] font-mono text-[10px] text-[var(--app-muted)]">
                                    // Auto-generated team documentation and knowledge repository
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
