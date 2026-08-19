"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
    Kanban,
    Network,
    LayoutDashboard,
    BookOpen,
    Bookmark,
    Calendar,
    CheckCircle2,
    Shield,
    Users,
    Eye,
    ArrowRight,
    Sparkles,
    SlidersHorizontal,
    Layers,
    Clock,
    Flame,
    Zap,
    ChevronRight,
    Sun,
    Moon,
    Check,
    HelpCircle
} from "lucide-react";

export default function PublicLandingPage() {
    const { currentUser } = useWorkspace();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"kanban" | "map" | "dashboard" | "docs">("kanban");
    const [faqOpen, setFaqOpen] = useState<number | null>(0);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleTheme = () => {
        const next = !isDarkMode;
        setIsDarkMode(next);
        const themeVal = next ? "lws-dark" : "light";
        document.documentElement.setAttribute("data-theme", themeVal);
        localStorage.setItem("sys_theme", themeVal);
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans flex flex-col selection:bg-[#1A1A1A] selection:text-white">

            {/* Top Announcement Bar */}
            <div className="bg-[#1A1A1A] text-white text-[12px] py-2 px-4 text-center flex items-center justify-center gap-2 border-b border-[#333]">
                <span className="inline-flex items-center gap-1 bg-white/15 text-white font-semibold text-[10px] px-2 py-0.5 rounded-[2px]   capitalize">
                    v1.1.0 Release
                </span>
                <span>Role-based task assignment, Solar Map visualization are live.</span>
                <Link href={currentUser ? "/kanban" : "/login"} className="underline font-medium hover:text-[#ECEFF4] ml-1 flex items-center gap-0.5">
                    {currentUser ? "Open Workspace" : "Try Now"} <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            {/* Navigation Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E5E3] px-6 lg:px-12 py-3.5 transition-colors">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Brand Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-[3px] bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm font-heading group-hover:scale-105 transition-transform">
                            SM
                        </div>
                        <div className="flex flex-col">
                            <span className="font-heading font-bold text-base    text-[#1A1A1A]">
                                SM Technology
                            </span>
                            <span className="text-[10px] text-[#888883]    capitalize font-medium">
                                Assignment Core
                            </span>
                        </div>
                    </Link>

                    {/* Nav Links */}
                    <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#666663]">
                        <a href="#features" className="hover:text-[#1A1A1A] transition-colors">Features</a>
                        <a href="#showcase" className="hover:text-[#1A1A1A] transition-colors">Live Preview</a>
                        <a href="#roles" className="hover:text-[#1A1A1A] transition-colors">Roles & Security</a>
                        <a href="#faq" className="hover:text-[#1A1A1A] transition-colors">FAQ</a>
                    </nav>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 border border-[#E5E5E3] rounded-[3px] bg-white hover:bg-[#FAFAF9] text-[#1A1A1A] transition-colors cursor-pointer"
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Sun className="w-4 h-4 text-[#EBCB8B]" /> : <Moon className="w-4 h-4" />}
                        </button>

                        {currentUser ? (
                            <Link
                                href="/kanban"
                                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[12px] font-semibold rounded-[3px] shadow-sm transition-all flex items-center gap-1.5"
                            >
                                <span>Go to Dashboard</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="px-3.5 py-1.5 border border-[#E5E5E3] hover:border-[#1A1A1A] text-[#1A1A1A] text-[12px] font-semibold rounded-[3px] transition-colors bg-white"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/login"
                                    className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[12px] font-semibold rounded-[3px] shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    <span>Get Started</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-[#E5E5E3]">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#E5E5E3_1px,transparent_1px),linear-gradient(to_bottom,#E5E5E3_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

                <div className="relative max-w-5xl mx-auto px-6 text-center flex flex-col items-center">

                    {/* Pill Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E5E5E3] bg-white text-[11px] font-medium text-[#666663] mb-6 shadow-xs animate-fade-in">
                        <span>Precision Workflow & Team Assignment Platform</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold    text-[#1A1A1A] max-w-4xl leading-[1.12]">
                        Effortless task delegation.<br />
                        <span className="font-serif italic font-normal text-[#555555]">Uncompromised team clarity.</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="mt-6 text-base sm:text-lg text-[#666663] max-w-2xl leading-relaxed">
                        A bespoke workspace engineered for modern teams. Role-based execution, dynamic Kanban, interactive Solar maps, and unified document management in one high-velocity system.
                    </p>

                    {/* CTA Actions */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
                        <Link
                            href={currentUser ? "/kanban" : "/login"}
                            className="w-full sm:w-auto px-7 py-3 bg-[#1A1A1A] hover:bg-[#333] text-white text-sm font-semibold rounded-[3px] shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                            <span>{currentUser ? "Open Workspace" : "Launch Workspace Free"}</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a
                            href="#showcase"
                            className="w-full sm:w-auto px-6 py-3 border border-[#E5E5E3] hover:border-[#1A1A1A] bg-white text-[#1A1A1A] text-sm font-medium rounded-[3px] transition-colors flex items-center justify-center gap-2"
                        >
                            <span>Explore Interactive Demo</span>
                        </a>
                    </div>

                    {/* Metrics Bar */}
                    <div className="mt-14 pt-8 border-t border-[#E5E5E3] grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl text-left">
                        <div className="flex flex-col gap-1 border-l-2 border-[#1A1A1A] pl-3">
                            <span className="font-heading text-2xl font-bold text-[#1A1A1A]">3-Tier</span>
                            <span className="text-[11px] text-[#888883] capitalize  ">Role Governance</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-[#1A1A1A] pl-3">
                            <span className="font-heading text-2xl font-bold text-[#1A1A1A]">0.1s</span>
                            <span className="text-[11px] text-[#888883] capitalize  ">Realtime Sync</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-[#1A1A1A] pl-3">
                            <span className="font-heading text-2xl font-bold text-[#1A1A1A]">Solar</span>
                            <span className="text-[11px] text-[#888883] capitalize  ">Orbital Workload Map</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-[#1A1A1A] pl-3">
                            <span className="font-heading text-2xl font-bold text-[#1A1A1A]">Integrated</span>
                            <span className="text-[11px] text-[#888883] capitalize  ">Docs & Bookmarks</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Showcase Preview */}
            <section id="showcase" className="py-20 bg-white border-b border-[#E5E5E3]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="eyebrow capitalize text-[#888883]    text-[11px] font-semibold">
                            Live Interface Showcase
                        </span>
                        <h2 className="font-heading text-3xl font-bold text-[#1A1A1A] mt-2">
                            Engineered for Clarity & Momentum
                        </h2>
                        <p className="text-sm text-[#666663] mt-2">
                            Toggle between primary views to see how SM Technology powers modern engineering and operations.
                        </p>
                    </div>

                    {/* View Switcher Tabs */}
                    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                        <button
                            onClick={() => setActiveTab("kanban")}
                            className={`px-4 py-2 text-xs font-semibold rounded-[3px] border transition-all flex items-center gap-2 cursor-pointer ${activeTab === "kanban"
                                ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs"
                                : "bg-[#FAFAF9] text-[#666663] border-[#E5E5E3] hover:border-[#1A1A1A]"
                                }`}
                        >
                            <Kanban className="w-3.5 h-3.5" />
                            <span>Task Board (Kanban)</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("map")}
                            className={`px-4 py-2 text-xs font-semibold rounded-[3px] border transition-all flex items-center gap-2 cursor-pointer ${activeTab === "map"
                                ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs"
                                : "bg-[#FAFAF9] text-[#666663] border-[#E5E5E3] hover:border-[#1A1A1A]"
                                }`}
                        >
                            <Network className="w-3.5 h-3.5" />
                            <span>Solar Relational Map</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("dashboard")}
                            className={`px-4 py-2 text-xs font-semibold rounded-[3px] border transition-all flex items-center gap-2 cursor-pointer ${activeTab === "dashboard"
                                ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs"
                                : "bg-[#FAFAF9] text-[#666663] border-[#E5E5E3] hover:border-[#1A1A1A]"
                                }`}
                        >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>Leader Dashboard</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("docs")}
                            className={`px-4 py-2 text-xs font-semibold rounded-[3px] border transition-all flex items-center gap-2 cursor-pointer ${activeTab === "docs"
                                ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs"
                                : "bg-[#FAFAF9] text-[#666663] border-[#E5E5E3] hover:border-[#1A1A1A]"
                                }`}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Docs & Knowledge Base</span>
                        </button>
                    </div>

                    {/* Showcase Mockup Window */}
                    <div className="relative border border-[#E5E5E3] rounded-[4px] bg-[#FAFAF9] p-4 lg:p-6 shadow-md corner-brackets">

                        {/* Top Window Bar */}
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5E3] text-[11px] text-[#888883]">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#CB2431]" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#B08800]" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#22863A]" />
                                <span className="ml-2 font-mono text-[10px] text-[#666663]">workspace.smtechnology.internal / {activeTab}</span>
                            </div>
                            <span className="font-medium bg-white px-2 py-0.5 border border-[#E5E5E3] rounded-[2px]">
                                Interactive Demonstration
                            </span>
                        </div>

                        {/* Tab Content 1: Kanban */}
                        {activeTab === "kanban" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                                {/* Col 1 */}
                                <div className="bg-white border border-[#E5E5E3] rounded-[3px] p-3.5 flex flex-col gap-3">
                                    <div className="flex items-center justify-between border-b border-[#F0F0EE] pb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[#888883]" />
                                            <span className="text-xs font-bold text-[#1A1A1A]">BACKLOG</span>
                                        </div>
                                        <span className="text-[10px] font-mono bg-[#FAFAF9] px-1.5 py-0.5 border border-[#E5E5E3] rounded">2</span>
                                    </div>
                                    <div className="p-3 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[2px] flex flex-col gap-2 hover:border-[#1A1A1A] transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-[#B08800] bg-[#B08800]/10 px-1.5 py-0.5 rounded">HIGH</span>
                                            <span className="text-[10px] text-[#888883]">Est: 4h</span>
                                        </div>
                                        <h4 className="text-xs font-semibold text-[#1A1A1A]">API Rate Limiting & Proxy Middleware</h4>
                                        <p className="text-[10px] text-[#888883]">Implement token bucket algorithms for internal service requests.</p>
                                    </div>
                                    <div className="p-3 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[2px] flex flex-col gap-2 hover:border-[#1A1A1A] transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-[#22863A] bg-[#22863A]/10 px-1.5 py-0.5 rounded">MEDIUM</span>
                                            <span className="text-[10px] text-[#888883]">Est: 2h</span>
                                        </div>
                                        <h4 className="text-xs font-semibold text-[#1A1A1A]">Export Reports to CSV / PDF</h4>
                                        <p className="text-[10px] text-[#888883]">Weekly summary sheet download for team leaders.</p>
                                    </div>
                                </div>

                                {/* Col 2 */}
                                <div className="bg-white border border-[#E5E5E3] rounded-[3px] p-3.5 flex flex-col gap-3">
                                    <div className="flex items-center justify-between border-b border-[#F0F0EE] pb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[#B08800]" />
                                            <span className="text-xs font-bold text-[#1A1A1A]">IN PROGRESS</span>
                                        </div>
                                        <span className="text-[10px] font-mono bg-[#FAFAF9] px-1.5 py-0.5 border border-[#E5E5E3] rounded">1</span>
                                    </div>
                                    <div className="p-3 bg-white border border-[#1A1A1A] shadow-xs rounded-[2px] flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-bold text-[#CB2431] bg-[#CB2431]/10 px-1.5 py-0.5 rounded">URGENT</span>
                                            <span className="text-[10px] font-semibold text-[#CB2431]">Due Today</span>
                                        </div>
                                        <h4 className="text-xs font-semibold text-[#1A1A1A]">Route Groups & Architecture Refactor</h4>
                                        <p className="text-[10px] text-[#888883]">Organize (auth), (dashboard) and (public) folders cleanly.</p>
                                        <div className="flex items-center justify-between pt-2 border-t border-[#F0F0EE]">
                                            <span className="text-[10px] text-[#1A1A1A] font-medium">Assigned to: Lead Engineer</span>
                                            <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[9px] flex items-center justify-center font-bold">LE</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 3 */}
                                <div className="bg-white border border-[#E5E5E3] rounded-[3px] p-3.5 flex flex-col gap-3">
                                    <div className="flex items-center justify-between border-b border-[#F0F0EE] pb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-[#22863A]" />
                                            <span className="text-xs font-bold text-[#1A1A1A]">COMPLETED</span>
                                        </div>
                                        <span className="text-[10px] font-mono bg-[#FAFAF9] px-1.5 py-0.5 border border-[#E5E5E3] rounded">2</span>
                                    </div>
                                    <div className="p-3 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[2px] opacity-80 flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5 text-[#22863A] text-[10px] font-semibold">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Task Verified</span>
                                        </div>
                                        <h4 className="text-xs font-medium line-through text-[#888883]">Google Docs / Sheets Live Embedding</h4>
                                    </div>
                                    <div className="p-3 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[2px] opacity-80 flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5 text-[#22863A] text-[10px] font-semibold">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Task Verified</span>
                                        </div>
                                        <h4 className="text-xs font-medium line-through text-[#888883]">Nord & LWS Dark Themes Engine</h4>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content 2: Solar Map */}
                        {activeTab === "map" && (
                            <div className="h-72 bg-[#1A1A1A] rounded-[3px] text-white relative flex items-center justify-center overflow-hidden animate-fade-in">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-64 h-64 rounded-full border border-dashed border-white/20 animate-spin [animation-duration:40s]" />
                                    <div className="w-44 h-44 rounded-full border border-white/15" />
                                    <div className="w-24 h-24 rounded-full border border-white/10" />
                                </div>
                                <div className="z-10 flex flex-col items-center gap-2 text-center p-4">
                                    <div className="w-14 h-14 rounded-full bg-white text-[#1A1A1A] flex items-center justify-center font-bold text-xs font-heading shadow-lg">
                                        TEAM HUB
                                    </div>
                                    <p className="text-xs text-white/80 font-medium max-w-sm">
                                        Concentric relational gravity map calculating member capacity, active workload orbits, and real-time task density.
                                    </p>
                                </div>
                                <div className="absolute top-6 left-8 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-[2px] border border-white/20 text-[10px]">
                                    Active Nodes: 6
                                </div>
                                <div className="absolute bottom-6 right-8 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-[2px] border border-white/20 text-[10px]">
                                    Orbital Workload: Balanced (84%)
                                </div>
                            </div>
                        )}

                        {/* Tab Content 3: Dashboard */}
                        {activeTab === "dashboard" && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                                <div className="bg-white border border-[#E5E5E3] p-4 rounded-[3px] flex flex-col gap-1">
                                    <span className="text-[10px] text-[#888883] capitalize font-bold  ">Completion Velocity</span>
                                    <span className="text-2xl font-bold font-heading text-[#1A1A1A]">94.2%</span>
                                    <span className="text-[10px] text-[#22863A] font-medium">+12% vs previous sprint</span>
                                </div>
                                <div className="bg-white border border-[#E5E5E3] p-4 rounded-[3px] flex flex-col gap-1">
                                    <span className="text-[10px] text-[#888883] capitalize font-bold  ">Active Assignments</span>
                                    <span className="text-2xl font-bold font-heading text-[#1A1A1A]">18 Tasks</span>
                                    <span className="text-[10px] text-[#888883]">Spread across 6 engineers</span>
                                </div>
                                <div className="bg-white border border-[#E5E5E3] p-4 rounded-[3px] flex flex-col gap-1">
                                    <span className="text-[10px] text-[#888883] capitalize font-bold  ">Overdue Tasks</span>
                                    <span className="text-2xl font-bold font-heading text-[#22863A]">0</span>
                                    <span className="text-[10px] text-[#22863A] font-medium">All milestones on track</span>
                                </div>
                            </div>
                        )}

                        {/* Tab Content 4: Docs & Knowledge */}
                        {activeTab === "docs" && (
                            <div className="bg-white border border-[#E5E5E3] rounded-[3px] p-5 flex flex-col md:flex-row gap-5 animate-fade-in">
                                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[#E5E5E3] pr-4 flex flex-col gap-2">
                                    <span className="text-[10px] font-bold text-[#888883] capitalize  ">Documentation Index</span>
                                    <div className="p-2 bg-[#FAFAF9] border-l-2 border-[#1A1A1A] text-xs font-semibold text-[#1A1A1A]">
                                        Architecture Blueprint & Schemas
                                    </div>
                                    <div className="p-2 hover:bg-[#FAFAF9] text-xs text-[#888883]">
                                        Deployment Guide & CI/CD
                                    </div>
                                    <div className="p-2 hover:bg-[#FAFAF9] text-xs text-[#888883]">
                                        Security Policies & Token Access
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <h3 className="font-heading text-base font-bold text-[#1A1A1A]">Architecture Blueprint & Schemas</h3>
                                    <p className="text-xs text-[#666663] leading-relaxed">
                                        Dual-pane WYSIWYG TipTap editor with markdown support, instantaneous autosave, and inline document printing.
                                    </p>
                                    <div className="mt-3 p-3 bg-[#FAFAF9] border border-[#E5E5E3] rounded-[2px] font-mono text-[10px] text-[#555]">
                                        // Auto-generated team documentation and knowledge repository
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Core Features Grid */}
            <section id="features" className="py-20 max-w-7xl mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <span className="eyebrow capitalize text-[#888883]    text-[11px] font-semibold">
                        Core Capabilities
                    </span>
                    <h2 className="font-heading text-3xl font-bold text-[#1A1A1A] mt-2">
                        Everything Required for High-Impact Delivery
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Feature 1 */}
                    <div className="bg-white border border-[#E5E5E3] p-6 rounded-[3px] flex flex-col gap-3 hover:border-[#1A1A1A] transition-all corner-brackets">
                        <div className="w-10 h-10 rounded-[3px] bg-[#1A1A1A] text-white flex items-center justify-center">
                            <Kanban className="w-5 h-5" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-[#1A1A1A]">Dynamic Kanban & List Views</h3>
                        <p className="text-xs text-[#666663] leading-relaxed">
                            Drag and drop tasks across customizable columns. Filter by assignee, priority, due date, and recurring status.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white border border-[#E5E5E3] p-6 rounded-[3px] flex flex-col gap-3 hover:border-[#1A1A1A] transition-all corner-brackets">
                        <div className="w-10 h-10 rounded-[3px] bg-[#1A1A1A] text-white flex items-center justify-center">
                            <Network className="w-5 h-5" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-[#1A1A1A]">Solar Relational Map</h3>
                        <p className="text-xs text-[#666663] leading-relaxed">
                            A relational solar visualization representing team nodes and active task gravitational density in real-time.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white border border-[#E5E5E3] p-6 rounded-[3px] flex flex-col gap-3 hover:border-[#1A1A1A] transition-all corner-brackets">
                        <div className="w-10 h-10 rounded-[3px] bg-[#1A1A1A] text-white flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-[#1A1A1A]">Strict Role-Based Security</h3>
                        <p className="text-xs text-[#666663] leading-relaxed">
                            Granular permissions separating Workspace Leaders, Members, and Observers with protected action boundaries.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white border border-[#E5E5E3] p-6 rounded-[3px] flex flex-col gap-3 hover:border-[#1A1A1A] transition-all corner-brackets">
                        <div className="w-10 h-10 rounded-[3px] bg-[#1A1A1A] text-white flex items-center justify-center">
                            <Bookmark className="w-5 h-5" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-[#1A1A1A]">Google Docs & Bookmark Hub</h3>
                        <p className="text-xs text-[#666663] leading-relaxed">
                            Embed Google Sheets, Docs, and web links directly in a split-screen preview without ever leaving the workspace.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="bg-white border border-[#E5E5E3] p-6 rounded-[3px] flex flex-col gap-3 hover:border-[#1A1A1A] transition-all corner-brackets">
                        <div className="w-10 h-10 rounded-[3px] bg-[#1A1A1A] text-white flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-[#1A1A1A]">Personal 'My Day' Focus</h3>
                        <p className="text-xs text-[#666663] leading-relaxed">
                            Tailored personal dashboard for team members to focus on today's assignments and mark subtasks complete.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="bg-white border border-[#E5E5E3] p-6 rounded-[3px] flex flex-col gap-3 hover:border-[#1A1A1A] transition-all corner-brackets">
                        <div className="w-10 h-10 rounded-[3px] bg-[#1A1A1A] text-white flex items-center justify-center">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-[#1A1A1A]">Typography & Dark Modes</h3>
                        <p className="text-xs text-[#666663] leading-relaxed">
                            Customize your view with Outfit, Lora, or Monospace typography, plus Nord, AMOLED, and LWS Dark Modes.
                        </p>
                    </div>
                </div>
            </section>

            {/* Role Governance Matrix */}
            <section id="roles" className="py-20 bg-[#F5F5F4] border-y border-[#E5E5E3]">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="eyebrow capitalize text-[#888883]    text-[11px] font-semibold">
                            Permission Governance
                        </span>
                        <h2 className="font-heading text-3xl font-bold text-[#1A1A1A] mt-2">
                            Tailored for Every Stakeholder
                        </h2>
                    </div>

                    <div className="bg-white border border-[#E5E5E3] rounded-[3px] overflow-hidden shadow-xs">
                        <div className="grid grid-cols-4 p-4 bg-[#FAFAF9] border-b border-[#E5E5E3] text-xs font-bold text-[#1A1A1A]">
                            <span>Capability</span>
                            <span className="text-center">Leader</span>
                            <span className="text-center">Member</span>
                            <span className="text-center">Observer</span>
                        </div>

                        {[
                            { name: "Create & Delegate Tasks", leader: true, member: true, observer: false },
                            { name: "Reorder & Customize Board Columns", leader: true, member: false, observer: false },
                            { name: "Manage Workspace Members & Roles", leader: true, member: false, observer: false },
                            { name: "Solar Relational Map Access", leader: true, member: false, observer: true },
                            { name: "Leader Dashboard & Analytics", leader: true, member: false, observer: false },
                            { name: "Personalized 'My Day' Workflow", leader: true, member: true, observer: false },
                            { name: "Docs, Articles & Bookmarks", leader: true, member: true, observer: true },
                        ].map((row, idx) => (
                            <div
                                key={idx}
                                className={`grid grid-cols-4 p-3.5 text-xs items-center ${idx % 2 === 1 ? "bg-[#FAFAF9]" : "bg-white"
                                    } border-b border-[#F0F0EE]`}
                            >
                                <span className="font-medium text-[#1A1A1A]">{row.name}</span>
                                <span className="flex justify-center">
                                    {row.leader ? <Check className="w-4 h-4 text-[#22863A]" /> : <span className="text-[#888883]">—</span>}
                                </span>
                                <span className="flex justify-center">
                                    {row.member ? <Check className="w-4 h-4 text-[#22863A]" /> : <span className="text-[#888883]">—</span>}
                                </span>
                                <span className="flex justify-center">
                                    {row.observer ? <Check className="w-4 h-4 text-[#22863A]" /> : <span className="text-[#888883]">—</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Accordion */}
            <section id="faq" className="py-20 max-w-4xl mx-auto px-6 w-full">
                <div className="text-center mb-12">
                    <span className="eyebrow capitalize text-[#888883]    text-[11px] font-semibold">
                        Frequently Asked Questions
                    </span>
                    <h2 className="font-heading text-3xl font-bold text-[#1A1A1A] mt-2">
                        Common Questions & Answers
                    </h2>
                </div>

                <div className="flex flex-col gap-3">
                    {[
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
                    ].map((item, idx) => {
                        const isOpen = faqOpen === idx;
                        return (
                            <div key={idx} className="border border-[#E5E5E3] bg-white rounded-[3px] overflow-hidden">
                                <button
                                    onClick={() => setFaqOpen(isOpen ? null : idx)}
                                    className="w-full p-4 text-left flex items-center justify-between text-sm font-bold text-[#1A1A1A] hover:bg-[#FAFAF9] transition-colors cursor-pointer"
                                >
                                    <span>{item.q}</span>
                                    <ChevronRight className={`w-4 h-4 text-[#888883] transition-transform ${isOpen ? "rotate-90" : ""}`} />
                                </button>
                                {isOpen && (
                                    <div className="px-4 pb-4 text-xs text-[#666663] leading-relaxed border-t border-[#F0F0EE] pt-3 animate-fade-in">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Bottom Call to Action */}
            <section className="bg-[#1A1A1A] text-white py-16 px-6 border-t border-[#333]">
                <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
                    <h2 className="font-heading text-3xl sm:text-4xl font-bold   ">
                        Transform Your Team's Daily Velocity Today.
                    </h2>
                    <p className="text-sm text-white/70 max-w-xl leading-relaxed">
                        Start assigning tasks, organizing knowledge, and tracking orbital workflow progress in minutes.
                    </p>
                    <Link
                        href={currentUser ? "/kanban" : "/login"}
                        className="px-8 py-3.5 bg-white text-[#1A1A1A] hover:bg-[#FAFAF9] font-bold text-sm rounded-[3px] shadow-sm transition-all flex items-center gap-2"
                    >
                        <span>{currentUser ? "Go to Workspace" : "Get Started — Free"}</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* Public Footer */}
            <footer className="bg-white border-t border-[#E5E5E3] py-8 px-6 text-xs text-[#888883]">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-[#1A1A1A]">SM Technology</span>
                        <span>© 2026 Office Task Assignment Tool. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="hover:text-[#1A1A1A] transition-colors">Sign In</Link>
                        <a href="#features" className="hover:text-[#1A1A1A] transition-colors">Features</a>
                        <a href="#roles" className="hover:text-[#1A1A1A] transition-colors">Security</a>
                        <span className="flex items-center gap-1 text-[#22863A]">
                            <span className="w-2 h-2 rounded-full bg-[#22863A] animate-pulse" />
                            Systems Operational
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
