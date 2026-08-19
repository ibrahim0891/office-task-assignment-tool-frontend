"use client";

import React from "react";
import {
    Kanban,
    Network,
    Shield,
    Bookmark,
    Clock,
    SlidersHorizontal,
    Sparkles,
    ArrowDown
} from "lucide-react";

const features = [
    {
        step: "01",
        title: "Intelligent Task Delegation",
        subtitle: "Dynamic Kanban & Multi-Filter Boards",
        description: "Drag and drop tasks across custom columns. Filter seamlessly by assignee, urgency, due date, and recurring intervals.",
        icon: Kanban,
        tag: "Task Engine",
    },
    {
        step: "02",
        title: "Orbital Workload Balancing",
        subtitle: "Solar Relational Node Map",
        description: "Relational solar visualization calculating active task gravitational density. Balances capacity and prevents burnout.",
        icon: Network,
        tag: "Visual Topology",
    },
    {
        step: "03",
        title: "Strict Permission Governance",
        subtitle: "Role-Based Access Control",
        description: "Granular access tiers separating Leaders, Members, and Observers with protected action boundaries and isolated containers.",
        icon: Shield,
        tag: "Security",
    },
    {
        step: "04",
        title: "Unified Knowledge & Bookmarks",
        subtitle: "WYSIWYG TipTap & Live Embeds",
        description: "Dual-pane TipTap documentation with markdown formatting, instant auto-save, and split-screen Google Docs/Sheets previews.",
        icon: Bookmark,
        tag: "Docs & Hub",
    },
    {
        step: "05",
        title: "Personal 'My Day' Focus",
        subtitle: "Sprint Execution & Checklists",
        description: "Tailored individual dashboard designed for engineers to isolate today's assignments and maintain high momentum.",
        icon: Clock,
        tag: "Productivity",
    },
    {
        step: "06",
        title: "Personalized Ergonomics",
        subtitle: "Multi-Theme & Typography Scale",
        description: "Customize your environment with Outfit, Lora, or Mono typography, plus Nord Dark, AMOLED Black, and LWS themes.",
        icon: SlidersHorizontal,
        tag: "Aesthetics",
    },
];

export default function CoreFeatures() {
    return (
        <section id="features" className="scroll-mt-20 py-14 max-w-5xl mx-auto px-6">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-8">
                <span className="eyebrow capitalize text-[var(--app-muted)] text-[10px] font-semibold flex items-center justify-center gap-1.5">
                    <Sparkles className="w-2.5 h-2.5 text-[var(--app-text)]" />
                    <span>Lifecycle & Architecture</span>
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--app-text)] mt-1.5">
                    Engineered for End-to-End High Velocity
                </h2>
                <p className="text-xs text-[var(--app-muted)] mt-1.5 leading-relaxed">
                    A cohesive, multi-stage workflow pipeline from initial task assignment to focused daily execution.
                </p>
            </div>

            {/* SVG Path Connected Timeline */}
            <div className="relative">
                {/* Central Connected SVG Line (Desktop) */}
                <div className="hidden md:block absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-0.5 pointer-events-none">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                        <line
                            x1="50%"
                            y1="0"
                            x2="50%"
                            y2="100%"
                            stroke="var(--app-border-strong)"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                        />
                    </svg>
                </div>

                {/* Left Connected SVG Line (Mobile) */}
                <div className="md:hidden absolute top-4 bottom-4 left-5 w-0.5 pointer-events-none">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                        <line
                            x1="50%"
                            y1="0"
                            x2="50%"
                            y2="100%"
                            stroke="var(--app-border-strong)"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                        />
                    </svg>
                </div>

                {/* Timeline Items */}
                <div className="flex flex-col gap-4 sm:gap-5 relative z-10">
                    {features.map((item, idx) => {
                        const isEven = idx % 2 === 0;
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.step}
                                className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 ${
                                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                                }`}
                            >
                                {/* Content Card */}
                                <div className="w-full md:w-1/2 pl-10 md:pl-0">
                                    <div
                                        className={`group mono-gradient-border bg-[var(--app-card)] p-3.5 sm:p-4 rounded-[4px] shadow-2xs hover:-translate-y-0.5 hover:shadow-sm transition-all ${
                                            isEven ? "md:mr-3" : "md:ml-3"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-[2px] bg-[var(--app-text)] text-[var(--app-bg)] flex items-center justify-center shadow-xs shrink-0">
                                                    <Icon className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <h3 className="font-heading text-xs font-bold text-[var(--app-text)] leading-tight">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-[9.5px] text-[var(--app-muted)] font-medium">
                                                        {item.subtitle}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[8.5px] font-mono font-semibold bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] px-1.5 py-0.5 rounded shrink-0">
                                                {item.tag}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Center Node Milestone Indicator */}
                                <div className="absolute md:relative left-5 md:left-auto -translate-x-1/2 md:translate-x-0 flex items-center justify-center shrink-0">
                                    <div className="w-6 h-6 rounded-full bg-[var(--app-card)] border-[1.5px] border-[var(--app-text)] shadow-xs flex items-center justify-center font-mono font-bold text-[8.5px] text-[var(--app-text)] transition-transform duration-200 hover:scale-110">
                                        {item.step}
                                    </div>
                                </div>

                                {/* Empty Spacer for alternating desktop balance */}
                                <div className="hidden md:block w-1/2" />
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Timeline Indicator */}
                <div className="flex justify-center mt-6 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--app-card)] border border-[var(--app-border)] text-[10px] text-[var(--app-muted)] font-medium shadow-2xs">
                        <span>Workflow Cycle Complete</span>
                        <ArrowDown className="w-2.5 h-2.5 text-[var(--app-text)] animate-bounce" />
                    </div>
                </div>
            </div>
        </section>
    );
}
