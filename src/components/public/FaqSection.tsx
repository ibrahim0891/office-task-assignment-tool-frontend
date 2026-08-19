"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

const faqItems = [
    {
        q: "How does workspace isolation work?",
        a: "Each workspace operates as an independent container with its own Kanban boards, team memberships, bookmarks, and knowledge base. Leaders can provision multiple workspaces without data bleeding."
    },
    {
        q: "Can I preview Google Sheets and Google Docs directly?",
        a: "Yes! In the Bookmarks manager, clicking any Google Docs or Sheets link opens a live split-screen preview pane, allowing you to edit and review documents without context switching."
    },
    {
        q: "What makes the Solar Map unique?",
        a: "The Solar Map uses orbital gravitation mechanics to display team workloads. Concentric rings dynamically reflect task completion rates and prevent member burnout."
    },
    {
        q: "Is there offline support or local caching?",
        a: "Authentication tokens and user preferences (fonts, theme mode, zoom scale) are automatically cached locally for instantaneous restoration across browser restarts."
    }
];

export default function FaqSection() {
    const [faqOpen, setFaqOpen] = useState<number | null>(0);

    return (
        <section id="faq" className="py-20 max-w-4xl mx-auto px-6 w-full">
            <div className="text-center mb-12">
                <span className="eyebrow capitalize text-[var(--app-muted)] text-[11px] font-semibold">
                    Frequently Asked Questions
                </span>
                <h2 className="font-heading text-3xl font-bold text-[var(--app-text)] mt-2">
                    Common Questions & Answers
                </h2>
            </div>

            <div className="flex flex-col gap-3">
                {faqItems.map((item, idx) => {
                    const isOpen = faqOpen === idx;
                    return (
                        <div key={idx} className="border border-[var(--app-border)] bg-[var(--app-card)] rounded-[3px] overflow-hidden">
                            <button
                                onClick={() => setFaqOpen(isOpen ? null : idx)}
                                className="w-full p-4 text-left flex items-center justify-between text-sm font-bold text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors cursor-pointer"
                            >
                                <span>{item.q}</span>
                                <ChevronRight className={`w-4 h-4 text-[var(--app-muted)] transition-transform ${isOpen ? "rotate-90" : ""}`} />
                            </button>
                            {isOpen && (
                                <div className="px-4 pb-4 text-xs text-[var(--app-muted)] leading-relaxed border-t border-[var(--app-border)] pt-3 animate-fade-in">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
