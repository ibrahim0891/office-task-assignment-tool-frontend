"use client";

import React, { useState, useEffect } from "react";
import Lenis from "lenis";
import { useRouter } from "next/navigation";
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
    const { currentUser, isInitialized } = useWorkspace();
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (isInitialized && currentUser) {
            router.replace("/task-board");
        }
    }, [isInitialized, currentUser, router]);

    // 1. Lenis smooth scrolling (isolated strictly to the public landing page)
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        (window as any).__lenis = lenis;

        let rafId: number;
        function raf(time: number) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }

        rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            delete (window as any).__lenis;
            lenis.destroy();
        };
    }, []);

    // 2. Theme detection & synchronization
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

    if (isInitialized && currentUser) {
        return null;
    }

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
            <div className="animate-subtle-fade">
                <HeroSection currentUser={currentUser} />
            </div>

            {/* Interactive Showcase Preview */}
            <div className="animate-subtle-fade">
                <LiveShowcase />
            </div>

            {/* Core Features Grid */}
            <div className="animate-subtle-fade">
                <CoreFeatures />
            </div>

            {/* Role Governance Matrix */}
            <div className="animate-subtle-fade">
                <RoleGovernance />
            </div>

            {/* FAQ Accordion */}
            <div className="animate-subtle-fade">
                <FaqSection />
            </div>

            {/* Bottom Call to Action */}
            <div className="animate-subtle-fade">
                <CtaSection currentUser={currentUser} />
            </div>

            {/* Developer Credits Section */}
            <div className="animate-subtle-fade">
                <DeveloperCredits />
            </div>

            {/* Public Footer */}
            <LandingFooter />
        </div>
    );
}
