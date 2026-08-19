"use client";

import React from "react";
import Link from "next/link";

export default function LandingFooter() {
    return (
        <footer className="bg-[var(--app-card)] border-t border-[var(--app-border)] py-8 px-6 text-xs text-[var(--app-muted)]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-[var(--app-text)]">
                        SM Technology
                    </span>
                    <span>
                        © 2026 Office Task Assignment Tool. All rights reserved.
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    <Link
                        href="/login"
                        className="hover:text-[var(--app-text)] transition-colors"
                    >
                        Sign In
                    </Link>
                    <a
                        href="#features"
                        onClick={(e) => {
                            e.preventDefault();
                            const elem = document.getElementById("features");
                            if (elem) {
                                elem.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                });
                                window.history.pushState(null, "", "#features");
                            }
                        }}
                        className="hover:text-[var(--app-text)] transition-colors cursor-pointer"
                    >
                        Features
                    </a>
                    <a
                        href="#roles"
                        onClick={(e) => {
                            e.preventDefault();
                            const elem = document.getElementById("roles");
                            if (elem) {
                                elem.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                });
                                window.history.pushState(null, "", "#roles");
                            }
                        }}
                        className="hover:text-[var(--app-text)] transition-colors cursor-pointer"
                    >
                        Security
                    </a>
                    <span className="flex items-center gap-1 text-[#22863A]">
                        <span className="w-2 h-2 rounded-full bg-[#22863A]  " />
                        Systems Operational
                    </span>
                </div>
            </div>
        </footer>
    );
}
