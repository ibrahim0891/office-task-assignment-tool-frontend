"use client";

import React from "react";
import {
    Kanban,
    Network,
    Shield,
    Bookmark,
    Clock,
    SlidersHorizontal
} from "lucide-react";

export default function CoreFeatures() {
    return (
        <section id="features" className="py-20 max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="eyebrow capitalize text-[var(--app-muted)] text-[11px] font-semibold">
                    Core Capabilities
                </span>
                <h2 className="font-heading text-3xl font-bold text-[var(--app-text)] mt-2">
                    Everything Required for High-Impact Delivery
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="bg-[var(--app-card)] mono-gradient-border p-6 rounded-[3px] flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-[3px] bg-[var(--app-text)] text-[var(--app-bg)] flex items-center justify-center">
                        <Kanban className="w-5 h-5" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[var(--app-text)]">Dynamic Kanban & List Views</h3>
                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        Drag and drop tasks across customizable columns. Filter by assignee, priority, due date, and recurring status.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-[var(--app-card)] mono-gradient-border p-6 rounded-[3px] flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-[3px] bg-[var(--app-text)] text-[var(--app-bg)] flex items-center justify-center">
                        <Network className="w-5 h-5" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[var(--app-text)]">Solar Relational Map</h3>
                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        A relational solar visualization representing team nodes and active task gravitational density in real-time.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-[var(--app-card)] mono-gradient-border p-6 rounded-[3px] flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-[3px] bg-[var(--app-text)] text-[var(--app-bg)] flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[var(--app-text)]">Strict Role-Based Security</h3>
                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        Granular permissions separating Workspace Leaders, Members, and Observers with protected action boundaries.
                    </p>
                </div>

                {/* Feature 4 */}
                <div className="bg-[var(--app-card)] mono-gradient-border p-6 rounded-[3px] flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-[3px] bg-[var(--app-text)] text-[var(--app-bg)] flex items-center justify-center">
                        <Bookmark className="w-5 h-5" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[var(--app-text)]">Google Docs & Bookmark Hub</h3>
                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        Embed Google Sheets, Docs, and web links directly in a split-screen preview without ever leaving the workspace.
                    </p>
                </div>

                {/* Feature 5 */}
                <div className="bg-[var(--app-card)] mono-gradient-border p-6 rounded-[3px] flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-[3px] bg-[var(--app-text)] text-[var(--app-bg)] flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[var(--app-text)]">Personal 'My Day' Focus</h3>
                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        Tailored personal dashboard for team members to focus on today's assignments and mark subtasks complete.
                    </p>
                </div>

                {/* Feature 6 */}
                <div className="bg-[var(--app-card)] mono-gradient-border p-6 rounded-[3px] flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-[3px] bg-[var(--app-text)] text-[var(--app-bg)] flex items-center justify-center">
                        <SlidersHorizontal className="w-5 h-5" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[var(--app-text)]">Typography & Dark Modes</h3>
                    <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                        Customize your view with Outfit, Lora, or Monospace typography, plus Nord, AMOLED, and LWS Dark Modes.
                    </p>
                </div>
            </div>
        </section>
    );
}
