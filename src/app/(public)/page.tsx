"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import AnnouncementBar from "@/components/public/AnnouncementBar";
import LandingHeader from "@/components/public/LandingHeader";
import HeroSection from "@/components/public/HeroSection";
import LiveShowcase from "@/components/public/LiveShowcase";
import CoreFeatures from "@/components/public/CoreFeatures";
import RoleGovernance from "@/components/public/RoleGovernance";
import FaqSection from "@/components/public/FaqSection";
import CtaSection from "@/components/public/CtaSection";
import DeveloperCredits from "@/components/public/DeveloperCredits";
import LandingFooter from "@/components/public/LandingFooter";

export default function PublicLandingPage() {
    const { currentUser } = useWorkspace();
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem("sys_theme");
        if (
            savedTheme === "lws-dark" ||
            savedTheme === "nord-dark" ||
            savedTheme === "amoled-dark" ||
            savedTheme === "dark"
        ) {
            setIsDarkMode(true);
            document.documentElement.setAttribute("data-theme", savedTheme);
        } else {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            if (currentTheme && currentTheme !== "light") {
                setIsDarkMode(true);
            }
        }
    }, []);

    const toggleTheme = () => {
        const next = !isDarkMode;
        setIsDarkMode(next);
        const themeVal = next ? "lws-dark" : "light";
        document.documentElement.setAttribute("data-theme", themeVal);
        localStorage.setItem("sys_theme", themeVal);
    };

    return (
        <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] font-sans flex flex-col selection:bg-[var(--app-text)] selection:text-[var(--app-bg)] transition-colors">
            {/* Top Announcement Bar */}
            <AnnouncementBar currentUser={currentUser} />

            {/* Navigation Header */}
            <LandingHeader
                currentUser={currentUser}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
            />

            {/* Hero Section */}
            <HeroSection currentUser={currentUser} />

            {/* Interactive Showcase Preview (with React Flow Solar Map, Kanban, Dashboard, Docs) */}
            <LiveShowcase />

            {/* Core Features Grid */}
            <CoreFeatures />

            {/* Role Governance Matrix */}
            <RoleGovernance />

            {/* FAQ Accordion */}
            <FaqSection />

            {/* Bottom Call to Action */}
            <CtaSection currentUser={currentUser} />

            {/* Developer Credits Section */}
            <DeveloperCredits />

            {/* Public Footer */}
            <LandingFooter />
        </div>
    );
}
