"use client";

import React from "react";
import developersData from "@/data/developers.json";
import { ExternalLink } from "lucide-react";

function GithubIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
        </svg>
    );
}

export default function DeveloperCredits() {
    return (
        <section className="border-t border-[var(--app-border)] bg-[var(--app-bg)] py-6 px-4">
            <div className="max-w-5xl mx-auto flex flex-col gap-3.5">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[var(--app-border)] pb-2">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-text)]" />
                        <h2 className="text-xs font-semibold text-[var(--app-text)]">
                            Engineering & Architecture Credits
                        </h2>
                        <span className="text-[11px] text-[var(--app-muted)]">— SM Technology (AI Department)</span>
                    </div>
                    <span className="text-[10px] text-[var(--app-muted)]">
                        Task Assignment & Orchestration Platform
                    </span>
                </div>

                {/* Developer Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {developersData.map((dev) => (
                        <div
                            key={dev.id}
                            className="group relative mono-gradient-border bg-[var(--app-card)] p-3.5 rounded-[4px] shadow-2xs flex flex-col justify-between gap-3 hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={`https://github.com/${dev.githubUsername}.png`}
                                            alt={dev.name}
                                            className="w-7 h-7 rounded-full object-cover border border-[var(--app-border)] shrink-0 transition-transform duration-300 group-hover:scale-110"
                                        />
                                        <div>
                                            <h3 className="text-xs font-semibold text-[var(--app-text)] transition-colors group-hover:opacity-90">
                                                {dev.name}
                                            </h3>
                                            <p className="text-[10px] text-[var(--app-muted)]">
                                                {dev.role}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-medium bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] px-1.5 py-0.5 rounded shrink-0 transition-colors duration-200 group-hover:bg-[var(--app-text)] group-hover:text-[var(--app-card)] group-hover:border-[var(--app-text)]">
                                        {dev.department}
                                    </span>
                                </div>

                                <p className="text-[11px] text-[var(--app-muted)] leading-relaxed">
                                    {dev.bio}
                                </p>

                                <div className="flex items-center gap-1 flex-wrap">
                                    {dev.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-1.5 py-0.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded text-[9px] text-[var(--app-muted)] transition-colors duration-150 hover:bg-[var(--app-text)] hover:text-[var(--app-card)] hover:border-[var(--app-text)]"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-[var(--app-border)] flex items-center justify-between">
                                <span className="text-[10px] text-[var(--app-muted)]">{dev.company}</span>
                                <a
                                    href={`https://github.com/${dev.githubUsername}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-glass-shimmer inline-flex items-center gap-1.5 text-[10.5px] font-medium text-[var(--app-text)] hover:bg-[var(--app-text)] hover:text-[var(--app-card)] bg-[var(--app-bg)] px-2.5 py-1 rounded border border-[var(--app-border)] hover:border-[var(--app-text)] transition-all active:scale-95"
                                >
                                    <GithubIcon className="w-2.5 h-2.5" />
                                    <span>github.com/{dev.githubUsername}</span>
                                    <ExternalLink className="w-2 h-2 opacity-70" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
