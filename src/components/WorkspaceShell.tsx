"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import toast from "react-hot-toast";
import { useWorkspace } from "../context/WorkspaceContext";
import { RotateCcw, Loader2 } from "lucide-react";
import WorkspaceHeader from "./WorkspaceHeader";
import GlobalModals from "./GlobalModals";
import SystemPreferenceModal from "./SystemPreferenceModal";
import TopLoadingBar from "./ui/TopLoadingBar";
import { fontMap } from "../config/fontConfig";
import { usePushNotifications } from "../hooks/usePushNotifications";

export default function WorkspaceShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const {
        currentUser,
        isClient,
        isInitialized,
        teams,
        currentTeam,
        isSwitchingTeam,
        switchingToTeam,
        setCurrentTeam,
        userRole,
        handleCreateTeam,
        handleLogout,
        setIsCreateTeamModalOpen,
        setIsConfigModalOpen,
    } = useWorkspace();

    usePushNotifications(currentUser);

    const [cubeState, setCubeState] = useState<"IDLE" | "ROTATING" | "REVERSING">("IDLE");
    const [switchingMessage, setSwitchingMessage] = useState("");

    useEffect(() => {
        if (isSwitchingTeam) {
            setCubeState("ROTATING");
            if (currentTeam && switchingToTeam) {
                setSwitchingMessage(`Switching ${currentTeam.name} to ${switchingToTeam.name}`);
            } else {
                setSwitchingMessage("Switching Workspace...");
            }
        } else if (cubeState === "ROTATING") {
            setCubeState("REVERSING");
            const timer = setTimeout(() => {
                setCubeState("IDLE");
                setSwitchingMessage("");
            }, 800); // 800ms transition duration
            return () => clearTimeout(timer);
        }
    }, [isSwitchingTeam]);

    const pathname = usePathname();

    // Loading states for async operations
    const [isProvisioning, setIsProvisioning] = useState(false);

    // Appearance Preferences Local States
    const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState<"theme" | "typography">(
        "theme",
    );
    const [primaryFont, setPrimaryFont] = useState("Outfit");
    const [secondaryFont, setSecondaryFont] = useState("Lora");
    const [fontScale, setFontScale] = useState(1.25);

    const scaleOptions = [
        { value: "0.85", label: "85% (Very Small)" },
        { value: "1.00", label: "100% (Normal)" },
        { value: "1.15", label: "115% (Large)" },
        { value: "1.25", label: "125% (Extra Large - Default)" },
        { value: "1.40", label: "140% (Double XL)" },
        { value: "1.50", label: "150% (Huge)" },
    ];

    const closestScaleOption = scaleOptions.reduce((prev, curr) => {
        return Math.abs(parseFloat(curr.value) - fontScale) <
            Math.abs(parseFloat(prev.value) - fontScale)
            ? curr
            : prev;
    }, scaleOptions[3]);

    // Reset settings handler
    const handleResetSettings = () => {
        setPrimaryFont("Outfit");
        setSecondaryFont("Lora");
        setFontScale(1.25);
        localStorage.setItem("sys_primary_font", "Outfit");
        localStorage.setItem("sys_secondary_font", "Lora");
        localStorage.setItem("sys_font_scale", "1.25");
        const root = document.documentElement;
        root.style.zoom = "100%";
        root.style.setProperty("--font-scale", "1.25");
        toast.success("Settings reset to Outfit & Lora");
    };

    // Load saved preferences from localStorage on initial render
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const savedPrimary = localStorage.getItem("sys_primary_font");
        const savedSecondary = localStorage.getItem("sys_secondary_font");
        const savedScale = localStorage.getItem("sys_font_scale");
        if (savedPrimary) setPrimaryFont(savedPrimary);
        if (savedSecondary) setSecondaryFont(savedSecondary);
        if (savedScale) {
            setFontScale(parseFloat(savedScale));
        } else {
            setFontScale(1.25);
        }
    }, []);

    const [theme, setTheme] = useState<
        "light" | "nord-dark" | "amoled-dark" | "lws-dark"
    >("light");

    // Load saved theme preference on mount
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const savedTheme = localStorage.getItem("sys_theme") as any;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute("data-theme", savedTheme);
        }
    }, []);

    const handleToggleTheme = () => {
        const nextTheme = theme === "light" ? "lws-dark" : "light";
        setTheme(nextTheme);
        document.documentElement.setAttribute("data-theme", nextTheme);
        localStorage.setItem("sys_theme", nextTheme);
        toast.success(
            `Switched to ${nextTheme === "lws-dark" ? "LWS Dark Mode" : "Light Mode"}`,
        );
    };

    // Keyboard shortcuts: Ctrl + (increase font scale) / Ctrl - (decrease font scale)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === "=" || e.key === "+") {
                    e.preventDefault();
                    setFontScale((prev) => {
                        const next = Math.min(1.5, prev + 0.05);
                        return Math.round(next * 100) / 100;
                    });
                    toast.success("Font scale increased", {
                        id: "font-scale-toast",
                    });
                } else if (e.key === "-") {
                    e.preventDefault();
                    setFontScale((prev) => {
                        const next = Math.max(0.85, prev - 0.05);
                        return Math.round(next * 100) / 100;
                    });
                    toast.success("Font scale decreased", {
                        id: "font-scale-toast",
                    });
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    // Apply font family dynamically to root element and persist in localStorage
    React.useEffect(() => {
        const root = document.documentElement;

        if (fontMap[primaryFont]) {
            root.style.setProperty("--font-primary", fontMap[primaryFont]);
            root.style.setProperty("--font-sans", fontMap[primaryFont]);
            document.body.style.setProperty(
                "font-family",
                fontMap[primaryFont],
                "important",
            );
            localStorage.setItem("sys_primary_font", primaryFont);
        }

        if (fontMap[secondaryFont]) {
            root.style.setProperty("--font-secondary", fontMap[secondaryFont]);
            root.style.setProperty("--font-serif", fontMap[secondaryFont]);
            root.style.setProperty(
                "--font-instrument-serif",
                fontMap[secondaryFont],
            );
            localStorage.setItem("sys_secondary_font", secondaryFont);
        }

        // Apply dynamic font scale
        root.style.setProperty("--font-scale", fontScale.toString());
        localStorage.setItem("sys_font_scale", fontScale.toString());
        root.style.zoom = "100%";
    }, [primaryFont, secondaryFont, fontScale]);

    if (!isClient || !isInitialized) return null;

    const isLoginPage = pathname === "/login";
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (!currentUser) {
        return null;
    }

    if (teams.length === 0) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAF9] text-[#1A1A1A] p-6">
                <div className="corner-brackets w-full max-w-md bg-white border border-[#E5E5E3] p-6 flex flex-col gap-5 text-center">
                    <div>
                        <h1 className="font-heading text-2xl text-[#1A1A1A]">
                            Welcome to OfficeTask
                        </h1>
                        <p className="eyebrow mt-1">
                            Initialize your first workspace
                        </p>
                    </div>

                    <div className="border border-[#E5E5E3] p-4 flex flex-col gap-2.5 text-left">
                        <h3 className="text-base font-semibold text-[#1A1A1A]">
                            Create a New Workspace
                        </h3>
                        <p className="text-base text-[#888883] leading-relaxed">
                            Standard Kanban boards will be provisioned
                            automatically. You will be designated as Workspace
                            Leader.
                        </p>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const tName = formData.get(
                                    "teamName",
                                ) as string;
                                if (tName && tName.trim()) {
                                    setIsProvisioning(true);
                                    try {
                                        await handleCreateTeam(tName.trim());
                                    } finally {
                                        setIsProvisioning(false);
                                    }
                                }
                            }}
                            className="flex gap-2 mt-1"
                        >
                            <input
                                type="text"
                                name="teamName"
                                placeholder="Workspace Name (e.g. Core Engineering)"
                                className="px-2.5 py-1.5 border border-[#E5E5E3] focus:border-[#1A1A1A] focus:outline-none text-[11px] bg-white rounded-[3px] transition-colors w-full"
                                required
                                disabled={isProvisioning}
                            />
                            <button
                                type="submit"
                                disabled={isProvisioning}
                                className="px-3 py-1.5 bg-[#1A1A1A] text-white text-[11px] font-medium rounded-[3px] shrink-0 hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                            >
                                {isProvisioning && (
                                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                )}
                                <span>
                                    {isProvisioning
                                        ? "Provisioning…"
                                        : "Provision"}
                                </span>
                            </button>
                        </form>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="text-base text-[#CB2431] hover:underline font-medium mt-1"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        );
    }

    const viewLabel = (() => {
        if (pathname === "/profile") return "Profile Settings";
        if (pathname === "/bookmarks") return "Bookmarks";
        if (pathname === "/knowledge") return "Docs & Knowledge Base";
        if (pathname === "/reports") return "Reports";
        if (pathname === "/calendar") return "Calendar";
        if (pathname === "/myday") return "My Day Focus";
        if (pathname === "/trash") return "Trash Archive";
        if (pathname === "/dashboard") return "Analytics Dashboard";
        if (pathname === "/map") return "Task Geolocation Map";
        if (pathname === "/list") return "Task List View";
        if (pathname === "/task-board")
            return "Task Board";
        return "Workspace";
    })();

    const renderAppContent = () => (
        <div className="flex h-screen bg-[#FAFAF9] font-sans text-[#1A1A1A] overflow-hidden">
            {/* Sidebar navigation — Persistent at Layout level */}
            <Sidebar
                currentUser={currentUser}
                onLogout={handleLogout}
                teams={teams}
                currentTeam={currentTeam}
                setCurrentTeam={setCurrentTeam}
                onCreateTeamClick={() => setIsCreateTeamModalOpen(true)}
                currentView={pathname.replace("/", "") || "kanban"}
                toggleConfigModal={() => setIsConfigModalOpen(true)}
                userRole={userRole}
                theme={theme}
                onToggleTheme={handleToggleTheme}
            />

            {/* Main Workspace Frame */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Global Header Toolbar */}
                <WorkspaceHeader
                    viewLabel={viewLabel}
                    theme={theme}
                    onToggleTheme={handleToggleTheme}
                    onOpenSystemSettings={() => setIsSystemSettingsOpen(true)}
                />

                {/* Page Content Slot */}
                <div className="flex-1 flex flex-col overflow-hidden relative border border-[#E5E5E3] bg-white corner-brackets">
                    {children}
                </div>
            </main>
        </div>
    );

    const is3DActive = cubeState !== "IDLE";

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-[#FAFAF9]" style={{ perspective: "1500px" }}>
            <TopLoadingBar />
            <div
                className="w-full h-full relative"
                style={{
                    transformStyle: "preserve-3d",
                    transform: cubeState === "ROTATING"
                        ? "translateZ(-50vw) rotateY(-90deg)"
                        : cubeState === "REVERSING"
                        ? "translateZ(-50vw) rotateY(-180deg)"
                        : "translateZ(-50vw) rotateY(0deg)",
                    transition: cubeState === "IDLE"
                        ? "none"
                        : "transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)",
                }}
            >
                {/* Front Face (Persistent App Content) */}
                <div
                    className="w-full h-full absolute top-0 left-0"
                    style={{
                        transform: cubeState === "REVERSING"
                            ? "rotateY(180deg) translateZ(50vw)"
                            : "rotateY(0deg) translateZ(50vw)",
                        backfaceVisibility: "hidden",
                    }}
                >
                    {renderAppContent()}
                </div>

                {/* Right Face (Switcher Loader) */}
                {(cubeState === "ROTATING" || cubeState === "REVERSING") && (
                    <div
                        className="w-full h-full absolute top-0 left-0 bg-[var(--app-bg,#FAFAF9)] flex flex-col items-center justify-center gap-4 select-none"
                        style={{
                            transform: "rotateY(90deg) translateZ(50vw)",
                            backfaceVisibility: "hidden",
                        }}
                    >
                        <div className="flex flex-col items-center gap-1.5 text-center px-6 max-w-xs">
                            <span className="text-3xl">🧑‍💻</span>
                            <h1 className="font-heading text-lg text-[var(--app-text,#1A1A1A)] tracking-tight">
                                {switchingMessage || "Switching Workspace..."}
                            </h1>
                        </div>
                        {/* Custom sliding line loader */}
                        <div className="w-12 h-0.5 bg-[var(--app-border,#E5E5E3)] overflow-hidden relative">
                            <div className="absolute top-0 bottom-0 left-0 bg-[var(--color-accent,#00D26A)] w-1/3 animate-loading-bar" />
                        </div>
                    </div>
                )}
            </div>

            {/* Global Modal Overlays */}
            <GlobalModals />

            {/* System Appearance & Preferences Popup Modal */}
            <SystemPreferenceModal
                isOpen={isSystemSettingsOpen}
                onClose={() => setIsSystemSettingsOpen(false)}
                theme={theme}
                setTheme={setTheme}
                primaryFont={primaryFont}
                setPrimaryFont={setPrimaryFont}
                secondaryFont={secondaryFont}
                setSecondaryFont={setSecondaryFont}
                fontScale={fontScale}
                setFontScale={setFontScale}
                onReset={handleResetSettings}
            />
        </div>
    );
}
