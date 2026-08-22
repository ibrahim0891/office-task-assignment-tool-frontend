"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sun, Moon } from "lucide-react";
import { User } from "@/api";

interface LandingHeaderProps {
    currentUser: User | null;
    isDarkMode: boolean;
    onToggleTheme: (e?: React.MouseEvent) => void;
}

export default function LandingHeader({
    currentUser,
    isDarkMode,
    onToggleTheme,
}: LandingHeaderProps) {
    const handleNavClick = (
        e: React.MouseEvent<HTMLAnchorElement>,
        targetId: string,
    ) => {
        e.preventDefault();
        const lenis = (window as any).__lenis;
        if (lenis) {
            lenis.scrollTo(`#${targetId}`, { offset: -70 });
            window.history.pushState(null, "", `#${targetId}`);
        } else {
            const elem = document.getElementById(targetId);
            if (elem) {
                elem.scrollIntoView({ behavior: "smooth", block: "start" });
                window.history.pushState(null, "", `#${targetId}`);
            }
        }
    };

    return (
        <header className="sticky top-0 z-40 bg-[var(--app-card)]/90 backdrop-blur-md border-b border-[var(--app-border)] px-6 lg:px-12 py-3.5 transition-colors">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <img
                        src="/icon.png"
                        alt="OfficeTask Logo"
                        className="w-8 h-8 object-contain rounded-sm overflow-hidden group-hover:scale-105 transition-transform"
                    />
                    <div className="flex flex-col">
                        <span className="font-heading font-bold text-base text-[var(--app-text)]">
                            Office Task
                        </span>
                        <span className="text-[10px] text-[var(--app-muted)] capitalize font-medium">
                            Assignment Core
                        </span>
                    </div>
                </Link>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-1.5 text-[13px] font-medium text-[var(--app-muted)]">
                    <a
                        href="#features"
                        onClick={(e) => handleNavClick(e, "features")}
                        className="px-3 py-1.5 rounded-[3px] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-all duration-200"
                    >
                        Features
                    </a>
                    <a
                        href="#showcase"
                        onClick={(e) => handleNavClick(e, "showcase")}
                        className="px-3 py-1.5 rounded-[3px] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-all duration-200"
                    >
                        Live Preview
                    </a>
                    <a
                        href="#roles"
                        onClick={(e) => handleNavClick(e, "roles")}
                        className="px-3 py-1.5 rounded-[3px] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-all duration-200"
                    >
                        Roles & Security
                    </a>
                    <a
                        href="#faq"
                        onClick={(e) => handleNavClick(e, "faq")}
                        className="px-3 py-1.5 rounded-[3px] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-all duration-200"
                    >
                        FAQ
                    </a>
                </nav>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => onToggleTheme(e)}
                        className="btn-glass-shimmer p-2.5 border border-[var(--app-border)] rounded-[3px] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95"
                        title="Toggle Theme"
                    >
                        {isDarkMode ? (
                            <Sun className="w-4 h-4 text-[#EBCB8B]" />
                        ) : (
                            <Moon className="w-4 h-4" />
                        )}
                    </button>

                    {currentUser ? (
                        <Link
                            href="/task-board"
                            className="btn-glass-shimmer px-4.5 py-2.5 bg-[var(--app-text)] hover:opacity-95 text-[var(--app-bg)] text-[12.5px] font-semibold rounded-[3px] shadow-sm transition-all flex items-center gap-1.5 hover:-translate-y-0.5 active:scale-95"
                        >
                            <span>Go to Dashboard</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="btn-glass-shimmer px-4 py-2 border border-[var(--app-border)] hover:border-[var(--app-text)] text-[var(--app-text)] text-[12.5px] font-semibold rounded-[3px] transition-all bg-[var(--app-card)] hover:-translate-y-0.5 active:scale-95"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/login"
                                className="btn-glass-shimmer px-4.5 py-2.5 bg-[var(--app-text)] hover:opacity-95 text-[var(--app-bg)] text-[12.5px] font-semibold rounded-[3px] shadow-sm transition-all flex items-center gap-1.5 hover:-translate-y-0.5 active:scale-95"
                            >
                                <span>Get Started</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
