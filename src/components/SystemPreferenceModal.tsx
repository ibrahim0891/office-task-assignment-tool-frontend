"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import {
    Palette,
    Type,
    RotateCcw,
    Sparkles,
    Check,
    Pipette,
    Sun,
    Moon,
    X,
    Sliders,
    Volume2,
    SlidersHorizontal,
    PanelLeft,
    PanelTop,
    Layout,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import SideSheetWrapper from "./ui/SideSheetWrapper";
import { Button } from "./ui/Button";
import { CustomSelect } from "./ui/CustomSelect";
import { ToggleSwitch } from "./ui/ToggleSwitch";
import { fontMap, FONT_OPTIONS, FONT_PRESETS } from "../config/fontConfig";
import {
    LIGHT_ACCENT_OPTIONS,
    DARK_ACCENT_OPTIONS,
    MODERN_LIGHT_ACCENT_OPTIONS,
    MODERN_DARK_ACCENT_OPTIONS,
    applyAccentColor,
} from "../config/accentConfig";
import {
    RADIUS_PRESETS,
    DEFAULT_RADIUS_PX,
    applyCornerRadius,
} from "../config/radiusConfig";
import { playFeedback } from "../utils/feedback";

interface SystemPreferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: "light" | "nord-dark" | "amoled-dark" | "lws-dark" | "modern-dark";
    setTheme: (theme: "light" | "nord-dark" | "amoled-dark" | "lws-dark" | "modern-dark") => void;
    uiMode: "editorial" | "modern";
    setUiMode: (mode: "editorial" | "modern") => void;
    modernTheme: "modern-light" | "modern-dark";
    setModernTheme: (theme: "modern-light" | "modern-dark") => void;
    navLayout: "sidebar" | "topbar";
    setNavLayout: (layout: "sidebar" | "topbar") => void;
    primaryFont: string;
    setPrimaryFont: (font: string) => void;
    secondaryFont: string;
    setSecondaryFont: (font: string) => void;
    fontScale: number;
    setFontScale: React.Dispatch<React.SetStateAction<number>>;
    onReset: () => void;
}

export default function SystemPreferenceModal({
    isOpen,
    onClose,
    theme,
    setTheme,
    uiMode,
    setUiMode,
    modernTheme,
    setModernTheme,
    navLayout,
    setNavLayout,
    primaryFont,
    setPrimaryFont,
    secondaryFont,
    setSecondaryFont,
    fontScale,
    setFontScale,
    onReset,
}: SystemPreferenceModalProps) {
    const [enableConfetti, setEnableConfetti] = useState<boolean>(() => {
        if (typeof window === "undefined") return true;
        return localStorage.getItem("sys_enable_confetti") !== "false";
    });
    const [enableSound, setEnableSound] = useState<boolean>(() => {
        if (typeof window === "undefined") return true;
        return localStorage.getItem("sys_enable_sound") !== "false";
    });

    const [lightAccent, setLightAccent] = useState<string>(() => {
        if (typeof window === "undefined") return LIGHT_ACCENT_OPTIONS[0].value;
        return (
            localStorage.getItem("sys_accent_light") ||
            LIGHT_ACCENT_OPTIONS[0].value
        );
    });

    const [darkAccent, setDarkAccent] = useState<string>(() => {
        if (typeof window === "undefined") return DARK_ACCENT_OPTIONS[0].value;
        return (
            localStorage.getItem("sys_accent_dark") ||
            DARK_ACCENT_OPTIONS[0].value
        );
    });

    // Modern-mode specific accent state
    const [modernLightAccent, setModernLightAccent] = useState<string>(() => {
        if (typeof window === "undefined") return MODERN_LIGHT_ACCENT_OPTIONS[0].value;
        return (
            localStorage.getItem("sys_accent_modern_light") ||
            MODERN_LIGHT_ACCENT_OPTIONS[0].value
        );
    });

    const [modernDarkAccent, setModernDarkAccent] = useState<string>(() => {
        if (typeof window === "undefined") return MODERN_DARK_ACCENT_OPTIONS[0].value;
        return (
            localStorage.getItem("sys_accent_modern_dark") ||
            MODERN_DARK_ACCENT_OPTIONS[0].value
        );
    });

    const [cornerRadius, setCornerRadius] = useState<number>(() => {
        if (typeof window === "undefined") return DEFAULT_RADIUS_PX;
        const saved = localStorage.getItem("sys_corner_radius");
        return saved !== null ? parseFloat(saved) : DEFAULT_RADIUS_PX;
    });

    React.useEffect(() => {
        if (isOpen && typeof window !== "undefined") {
            const savedRadius = localStorage.getItem("sys_corner_radius");
            if (savedRadius !== null) setCornerRadius(parseFloat(savedRadius));

            const savedModLight = localStorage.getItem("sys_accent_modern_light");
            if (savedModLight) setModernLightAccent(savedModLight);

            const savedModDark = localStorage.getItem("sys_accent_modern_dark");
            if (savedModDark) setModernDarkAccent(savedModDark);

            const savedLight = localStorage.getItem("sys_accent_light");
            if (savedLight) setLightAccent(savedLight);

            const savedDark = localStorage.getItem("sys_accent_dark");
            if (savedDark) setDarkAccent(savedDark);

            const savedConfetti = localStorage.getItem("sys_enable_confetti");
            if (savedConfetti !== null) setEnableConfetti(savedConfetti !== "false");

            const savedSound = localStorage.getItem("sys_enable_sound");
            if (savedSound !== null) setEnableSound(savedSound !== "false");
        }
    }, [isOpen]);

    const handleSelectRadius = (px: number) => {
        setCornerRadius(px);
        localStorage.setItem("sys_corner_radius", String(px));
        applyCornerRadius(px);
    };

    const colorInputRef = useRef<HTMLInputElement>(null);

    // Derive current accent context from mode
    const isModernMode = uiMode === "modern";
    const isModernDark = modernTheme === "modern-dark";
    const isDarkMode = isModernMode ? isModernDark : theme !== "light";

    const currentAccentList = isModernMode
        ? (isModernDark ? MODERN_DARK_ACCENT_OPTIONS : MODERN_LIGHT_ACCENT_OPTIONS)
        : (isDarkMode ? DARK_ACCENT_OPTIONS : LIGHT_ACCENT_OPTIONS);

    const currentSelectedAccent = isModernMode
        ? (isModernDark ? modernDarkAccent : modernLightAccent)
        : (isDarkMode ? darkAccent : lightAccent);

    const matchedOption = currentAccentList.find(
        (c) =>
            c.value.toLowerCase() === currentSelectedAccent.toLowerCase(),
    );
    const isCustomActive = !matchedOption;

    const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
    const [customHexInput, setCustomHexInput] = useState(currentSelectedAccent);

    React.useEffect(() => {
        setCustomHexInput(currentSelectedAccent);
    }, [currentSelectedAccent]);

    const handleSelectAccent = (colorValue: string) => {
        setCustomHexInput(colorValue);
        if (isModernMode) {
            if (isModernDark) {
                setModernDarkAccent(colorValue);
                localStorage.setItem("sys_accent_modern_dark", colorValue);
                applyAccentColor("modern-dark", undefined, colorValue);
            } else {
                setModernLightAccent(colorValue);
                localStorage.setItem("sys_accent_modern_light", colorValue);
                applyAccentColor("modern-light", colorValue, undefined);
            }
        } else if (isDarkMode) {
            setDarkAccent(colorValue);
            localStorage.setItem("sys_accent_dark", colorValue);
            applyAccentColor(theme, undefined, colorValue);
        } else {
            setLightAccent(colorValue);
            localStorage.setItem("sys_accent_light", colorValue);
            applyAccentColor(theme, colorValue, undefined);
        }
    };

    const handleToggleConfetti = (enabled: boolean) => {
        setEnableConfetti(enabled);
        localStorage.setItem("sys_enable_confetti", String(enabled));
        if (enabled) {
            toast.success("Completion confetti enabled");
        } else {
            toast.success("Completion confetti disabled");
        }
    };

    const handleToggleSound = (enabled: boolean) => {
        setEnableSound(enabled);
        localStorage.setItem("sys_enable_sound", String(enabled));
        if (enabled) {
            playFeedback("click");
            toast.success("Mechanical sounds & haptics enabled");
        } else {
            toast.success("Sounds & haptics muted");
        }
    };

    const handleResetAll = () => {
        localStorage.setItem("sys_enable_confetti", "true");
        localStorage.setItem("sys_enable_sound", "true");
        localStorage.removeItem("sys_accent_light");
        localStorage.removeItem("sys_accent_dark");
        localStorage.removeItem("sys_accent_modern_light");
        localStorage.removeItem("sys_accent_modern_dark");
        localStorage.removeItem("sys_corner_radius");
        localStorage.removeItem("sys_ui_mode");
        localStorage.removeItem("sys_modern_theme");
        localStorage.removeItem("sys_nav_layout");
        setNavLayout("sidebar");
        setLightAccent(LIGHT_ACCENT_OPTIONS[0].value);
        setDarkAccent(DARK_ACCENT_OPTIONS[0].value);
        setModernLightAccent(MODERN_LIGHT_ACCENT_OPTIONS[0].value);
        setModernDarkAccent(MODERN_DARK_ACCENT_OPTIONS[0].value);
        setCornerRadius(DEFAULT_RADIUS_PX);
        applyCornerRadius(DEFAULT_RADIUS_PX);
        setEnableConfetti(true);
        setEnableSound(true);
        setUiMode("editorial");
        applyAccentColor(
            theme,
            LIGHT_ACCENT_OPTIONS[0].value,
            DARK_ACCENT_OPTIONS[0].value,
        );
        onReset();
    };

    const scaleOptions = [
        { value: "0.85", label: "85% (Very Small)" },
        { value: "1.00", label: "100% (Compact)" },
        { value: "1.15", label: "115% (Medium)" },
        { value: "1.30", label: "130% (Default)" },
        { value: "1.40", label: "140% (Large)" },
        { value: "1.50", label: "150% (Extra Large)" },
    ];

    const closestScaleOption = scaleOptions.reduce((prev, curr) => {
        return Math.abs(parseFloat(curr.value) - fontScale) <
            Math.abs(parseFloat(prev.value) - fontScale)
            ? curr
            : prev;
    }, scaleOptions[3]);

    const styledFontOptions = FONT_OPTIONS.map((opt) => ({
        ...opt,
        style: { fontFamily: fontMap[opt.value] || "inherit" },
    }));

    return (
        <SideSheetWrapper
            isOpen={isOpen}
            onClose={onClose}
            width="md"
            className="flex flex-col h-full bg-[var(--app-card,#FFFFFF)] border-l border-[var(--app-border,#E5E5E3)] text-left"
        >
            {/* ── Top Header ── */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4.5 border-b border-[var(--app-border,#E5E5E3)] bg-[var(--app-card,#FFFFFF)] shrink-0">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-[1px] bg-[var(--color-accent)] inline-block shadow-xs" />
                        <h2 className="font-heading text-base sm:text-lg font-bold text-[var(--app-text,#1A1A1A)] tracking-tight">
                            System Preferences
                        </h2>
                    </div>
                    <p className="text-[11px] text-[var(--app-muted,#888883)] leading-tight">
                        Customize layout, design language, color palette, typography & feedback.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)] hover:bg-[var(--app-hover-bg,#F0F0EE)] w-7 h-7 rounded-[3px] flex items-center justify-center transition-colors cursor-pointer"
                    title="Close Preferences"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* ── Scrollable All-in-One Settings Body ── */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-6 custom-scrollbar">

                {/* ── SECTION 0: NAVIGATION & APP SHELL LAYOUT ── */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-[var(--app-border,#E5E5E3)]/50">
                        <Layout className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        <h3 className="eyebrow text-[10px] tracking-wider text-[var(--app-text,#1A1A1A)] font-bold">
                            Navigation Layout
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {/* Sidebar Navigation Card */}
                        <button
                            type="button"
                            onClick={() => {
                                setNavLayout("sidebar");
                                localStorage.setItem("sys_nav_layout", "sidebar");
                                toast.success("Sidebar navigation activated");
                            }}
                            className={`relative flex flex-col gap-2 p-3 border rounded-[3px] text-left cursor-pointer transition-all ${
                                navLayout === "sidebar"
                                    ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--app-card))] shadow-xs"
                                    : "border-[var(--app-border)] hover:border-[var(--app-border-strong)] bg-[var(--app-card)]"
                            }`}
                        >
                            {navLayout === "sidebar" && (
                                <span className="absolute top-2.5 right-2.5">
                                    <Check className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                                </span>
                            )}
                            <div className="flex items-center gap-1.5">
                                <PanelLeft className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                                <span className="text-[12px] font-semibold text-[var(--app-text)]">
                                    Sidebar
                                </span>
                            </div>
                            {/* Visual mini-wireframe */}
                            <div className="w-full h-10 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-bg)] flex p-1 gap-1">
                                <div className="w-1/4 h-full bg-[var(--app-card)] border border-[var(--app-border)] rounded-[1px] flex flex-col gap-0.5 p-0.5">
                                    <div className="w-full h-1 bg-[var(--color-accent)] rounded-[0.5px]" />
                                    <div className="w-2/3 h-1 bg-[var(--app-muted)]/40 rounded-[0.5px]" />
                                    <div className="w-full h-1 bg-[var(--app-muted)]/20 rounded-[0.5px]" />
                                </div>
                                <div className="flex-1 h-full bg-[var(--app-card)] border border-[var(--app-border)] rounded-[1px] p-1 flex flex-col gap-0.5">
                                    <div className="w-full h-1 bg-[var(--app-hover-bg)] rounded-[0.5px]" />
                                    <div className="w-3/4 h-1.5 bg-[var(--app-hover-bg)] rounded-[0.5px]" />
                                </div>
                            </div>
                            <span className="text-[10px] text-[var(--app-muted)] leading-tight">
                                Vertical collapsible sidebar with quick workspace switcher.
                            </span>
                        </button>

                        {/* Desktop Topbar Navigation Card */}
                        <button
                            type="button"
                            onClick={() => {
                                setNavLayout("topbar");
                                localStorage.setItem("sys_nav_layout", "topbar");
                                toast.success("Desktop Topbar layout activated");
                            }}
                            className={`relative flex flex-col gap-2 p-3 border rounded-[3px] text-left cursor-pointer transition-all ${
                                navLayout === "topbar"
                                    ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--app-card))] shadow-xs"
                                    : "border-[var(--app-border)] hover:border-[var(--app-border-strong)] bg-[var(--app-card)]"
                            }`}
                        >
                            {navLayout === "topbar" && (
                                <span className="absolute top-2.5 right-2.5">
                                    <Check className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                                </span>
                            )}
                            <div className="flex items-center gap-1.5">
                                <PanelTop className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                                <span className="text-[12px] font-semibold text-[var(--app-text)]">
                                    Desktop Topbar
                                </span>
                            </div>
                            {/* Visual mini-wireframe */}
                            <div className="w-full h-10 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-bg)] flex flex-col p-1 gap-0.5">
                                <div className="w-full h-2 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[1px] flex items-center px-1 gap-1 justify-between">
                                    <div className="w-2 h-0.5 bg-[var(--color-accent)] rounded-[0.5px]" />
                                    <div className="w-6 h-0.5 bg-[var(--app-muted)]/30 rounded-[0.5px]" />
                                    <div className="w-2 h-0.5 bg-[var(--app-muted)]/40 rounded-[0.5px]" />
                                </div>
                                <div className="w-full flex-1 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[1px] p-0.5 flex gap-1">
                                    <div className="flex-1 h-full bg-[var(--app-hover-bg)] rounded-[0.5px]" />
                                    <div className="flex-1 h-full bg-[var(--app-hover-bg)] rounded-[0.5px]" />
                                    <div className="flex-1 h-full bg-[var(--app-hover-bg)] rounded-[0.5px]" />
                                </div>
                            </div>
                            <span className="text-[10px] text-[var(--app-muted)] leading-tight">
                                2-tier horizontal desktop ribbon. Full-width canvas.
                            </span>
                        </button>
                    </div>
                </section>

                {/* ── SECTION 1: UI DESIGN LANGUAGE & THEME ── */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-[var(--app-border,#E5E5E3)]/50">
                        <Palette className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        <h3 className="eyebrow text-[10px] tracking-wider text-[var(--app-text,#1A1A1A)] font-bold">
                            UI Design Language
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {/* UI Theme 1 Card (Editorial) */}
                        <button
                            type="button"
                            onClick={() => {
                                setUiMode("editorial");
                                toast.success("UI Theme 1 activated");
                            }}
                            className={`relative flex flex-col gap-1.5 p-3.5 border rounded-[3px] text-left cursor-pointer transition-all ${
                                uiMode === "editorial"
                                    ? "border-[var(--app-text)] bg-[var(--app-select-bg,#F5F5F3)] shadow-xs"
                                    : "border-[var(--app-border)] hover:border-[var(--app-border-strong)] bg-[var(--app-card)]"
                            }`}
                        >
                            {uiMode === "editorial" && (
                                <span className="absolute top-2.5 right-2.5">
                                    <Check className="w-3.5 h-3.5 text-[var(--app-text)]" />
                                </span>
                            )}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[12px] font-semibold text-[var(--app-text)]">
                                    UI Theme 1
                                </span>
                                <span className="text-[9px] px-1 py-0.2 font-mono uppercase bg-black/5 dark:bg-white/10 text-[var(--app-muted)] rounded-[2px]">
                                    Editorial
                                </span>
                            </div>
                            <span className="text-[10px] text-[var(--app-muted)] leading-normal">
                                Sharp corners · Monochrome palette · Technical layout
                            </span>
                        </button>

                        {/* UI Theme 2 Card (Modern) */}
                        <button
                            type="button"
                            onClick={() => {
                                setUiMode("modern");
                                toast.success("UI Theme 2 activated");
                            }}
                            className={`relative flex flex-col gap-1.5 p-3.5 border rounded-[3px] text-left cursor-pointer transition-all ${
                                uiMode === "modern"
                                    ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--app-card))] shadow-xs"
                                    : "border-[var(--app-border)] hover:border-[var(--color-accent)]/50 bg-[var(--app-card)]"
                            }`}
                        >
                            {uiMode === "modern" && (
                                <span className="absolute top-2.5 right-2.5">
                                    <Check className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                                </span>
                            )}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[12px] font-semibold text-[var(--app-text)]">
                                    UI Theme 2
                                </span>
                                <span className="text-[9px] px-1 py-0.2 font-mono uppercase bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded-[2px]">
                                    Modern
                                </span>
                            </div>
                            <span className="text-[10px] text-[var(--app-muted)] leading-normal">
                                Rounded corners · Colorful accents · Elevated surfaces
                            </span>
                        </button>
                    </div>

                    {/* Modern Mode Sub-options: Light/Dark + Corner Radius */}
                    {uiMode === "modern" && (
                        <div className="flex flex-col gap-3 p-3 bg-[var(--app-hover-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] rounded-[3px]">
                            {/* Modern Appearance Light / Dark */}
                            <div className="flex flex-col gap-1.5">
                                <label className="eyebrow text-[9px]">Modern Appearance</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModernTheme("modern-light");
                                            toast.success("Modern Light activated");
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium border rounded-[3px] transition-all cursor-pointer ${
                                            modernTheme === "modern-light"
                                                ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--app-card))] text-[var(--color-accent)] font-semibold shadow-xs"
                                                : "border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-muted)] hover:border-[var(--color-accent)]/40"
                                        }`}
                                    >
                                        <Sun className="w-3.5 h-3.5" />
                                        Light
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModernTheme("modern-dark");
                                            toast.success("Modern Dark activated");
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium border rounded-[3px] transition-all cursor-pointer ${
                                            modernTheme === "modern-dark"
                                                ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_16%,var(--app-card))] text-[var(--color-accent)] font-semibold shadow-xs"
                                                : "border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-muted)] hover:border-[var(--color-accent)]/40"
                                        }`}
                                    >
                                        <Moon className="w-3.5 h-3.5" />
                                        Dark (Warm Navy)
                                    </button>
                                </div>
                            </div>

                            {/* Corner Roundness Preset Buttons + Dynamic Slider */}
                            <div className="flex flex-col gap-2 pt-1 border-t border-[var(--app-border,#E5E5E3)]/60">
                                <div className="flex items-center justify-between">
                                    <label className="eyebrow text-[9px] flex items-center gap-1.5">
                                        <span
                                            className="w-2 h-2 inline-block border border-[var(--color-accent)] bg-[var(--color-accent)]/20 transition-all"
                                            style={{ borderRadius: `${Math.min(cornerRadius, 4)}px` }}
                                        />
                                        Corner Roundness
                                    </label>
                                    <span className="font-mono text-[10px] text-[var(--app-muted)]">
                                        {cornerRadius}px
                                    </span>
                                </div>

                                <div className="grid grid-cols-4 gap-1.5">
                                    {RADIUS_PRESETS.map((preset) => {
                                        const isSelected = cornerRadius === preset.basePx;
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => handleSelectRadius(preset.basePx)}
                                                title={preset.description}
                                                className={`flex flex-col items-center justify-center py-2 px-1 border transition-all cursor-pointer text-center relative ${
                                                    isSelected
                                                        ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--app-card))] text-[var(--app-text)] font-semibold shadow-3xs"
                                                        : "border-[var(--app-border)] hover:border-[var(--color-accent)]/50 bg-[var(--app-card)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                                }`}
                                                style={{ borderRadius: preset.previewBorderRadius }}
                                            >
                                                <div
                                                    className={`w-3.5 h-3.5 border transition-all mb-1 ${
                                                        isSelected
                                                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                                                            : "border-[var(--app-border-strong)] bg-[var(--app-hover-bg)]"
                                                    }`}
                                                    style={{ borderRadius: preset.previewBorderRadius }}
                                                />
                                                <span className={`text-[10px] tabular-nums ${isSelected ? "text-[var(--app-text)] font-semibold" : "text-[var(--app-muted)]"}`}>
                                                    {preset.basePx}px
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-3 pt-0.5">
                                    <span className="text-[9px] text-[var(--app-muted)] font-mono">0px</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="16"
                                        step="1"
                                        value={cornerRadius}
                                        onChange={(e) => handleSelectRadius(parseInt(e.target.value, 10))}
                                        className="flex-1 h-1 bg-[var(--app-border,#E5E5E3)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent,#1A1A1A)]"
                                    />
                                    <span className="text-[9px] text-[var(--app-muted)] font-mono">16px</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Editorial Mode: Workspace Color Palette Dropdown */}
                    {uiMode === "editorial" && (
                        <div className="flex flex-col gap-1.5">
                            <label className="eyebrow">
                                Workspace Color Palette
                            </label>
                            <CustomSelect
                                options={[
                                    {
                                        value: "light",
                                        label: "Editorial Light (Default)",
                                    },
                                    {
                                        value: "nord-dark",
                                        label: "Nord Dark Mode",
                                    },
                                    {
                                        value: "amoled-dark",
                                        label: "AMOLED Pitch Black",
                                    },
                                    {
                                        value: "lws-dark",
                                        label: "Learn With Sumit (LWS) Dark",
                                    },
                                ]}
                                value={theme}
                                onChange={(val) => {
                                    setTheme(val as any);
                                    document.documentElement.setAttribute(
                                        "data-theme",
                                        val,
                                    );
                                    localStorage.setItem(
                                        "sys_theme",
                                        val,
                                    );
                                    applyAccentColor(val);
                                    toast.success(`Theme updated`);
                                }}
                                className="w-full"
                            />
                        </div>
                    )}
                </section>

                {/* ── SECTION 2: ACCENT COLOR ── */}
                <section className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--app-border,#E5E5E3)]/50">
                        <div className="flex items-center gap-2">
                            <span
                                className="w-2.5 h-2.5 rounded-[1px] inline-block transition-colors shadow-xs"
                                style={{
                                    backgroundColor: "var(--color-accent)",
                                }}
                            />
                            <h3 className="eyebrow text-[10px] tracking-wider text-[var(--app-text,#1A1A1A)] font-bold">
                                Accent Color
                            </h3>
                        </div>
                        <span className="font-mono text-[10px] text-[var(--app-muted,#888883)]">
                            {matchedOption
                                ? matchedOption.name
                                : `Custom (${currentSelectedAccent.toUpperCase()})`}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-[var(--app-hover-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] rounded-[3px] w-full overflow-hidden">
                        {currentAccentList.map((color) => {
                            const isSelected =
                                currentSelectedAccent.toLowerCase() ===
                                color.value.toLowerCase();
                            return (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() =>
                                        handleSelectAccent(
                                            color.value,
                                        )
                                    }
                                    title={`${color.name} — ${color.description}`}
                                    className={`h-7 flex-1 min-w-0 rounded-[2px] border border-black/10 dark:border-white/10 transition-all duration-150 flex items-center justify-center cursor-pointer relative shrink ${
                                        isSelected
                                            ? "ring-2 ring-[var(--app-text,#1A1A1A)] ring-offset-1 ring-offset-[var(--app-card)] scale-105 shadow-xs z-10"
                                            : "hover:scale-105 hover:shadow-xs opacity-90 hover:opacity-100"
                                    }`}
                                    style={{
                                        backgroundColor:
                                            color.value,
                                    }}
                                >
                                    {isSelected && (
                                        <Check className="w-2.5 h-2.5 text-white stroke-[3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
                                    )}
                                </button>
                            );
                        })}

                        {/* Custom Color Dropper Button (Last in single row) */}
                        <button
                            type="button"
                            onClick={() => setIsCustomPickerOpen((prev) => !prev)}
                            title={
                                isCustomActive
                                    ? `Custom Color: ${currentSelectedAccent} (Click to edit)`
                                    : "Pick a Custom Color…"
                            }
                            className={`h-7 flex-1 min-w-0 rounded-[2px] transition-all duration-150 flex items-center justify-center cursor-pointer relative shrink group ${
                                isCustomActive || isCustomPickerOpen
                                    ? "ring-2 ring-[var(--app-text,#1A1A1A)] ring-offset-1 ring-offset-[var(--app-card)] scale-105 shadow-xs border border-transparent z-10"
                                    : "bg-transparent border border-dashed border-[var(--app-border-strong,#888883)]/60 hover:border-[var(--app-text,#1A1A1A)] hover:scale-105"
                            }`}
                            style={
                                isCustomActive
                                    ? {
                                          backgroundColor:
                                              currentSelectedAccent,
                                      }
                                    : undefined
                            }
                        >
                            <Pipette
                                className={`w-3 h-3 transition-colors pointer-events-none ${
                                    isCustomActive
                                        ? "text-white stroke-[2.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
                                        : "text-[var(--app-muted,#888883)] group-hover:text-[var(--app-text,#1A1A1A)]"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Inline Custom Color Picker Panel */}
                    {isCustomPickerOpen && (
                        <div className="flex flex-col gap-2.5 p-3 bg-[var(--app-hover-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] rounded-[3px] animate-fade-in custom-color-picker">
                            <div className="flex items-center justify-between">
                                <span className="eyebrow text-[9px] font-semibold text-[var(--app-text)]">
                                    Custom Accent Color
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomPickerOpen(false)}
                                    className="text-[var(--app-muted)] hover:text-[var(--app-text)] text-xs px-1 cursor-pointer font-bold leading-none"
                                    title="Close Custom Picker"
                                >
                                    ✕
                                </button>
                            </div>

                            <HexColorPicker
                                color={currentSelectedAccent}
                                onChange={handleSelectAccent}
                            />

                            <div className="flex items-center gap-2 pt-1 border-t border-[var(--app-border)]/60">
                                <span
                                    className="w-6 h-6 rounded-[2px] border border-black/10 dark:border-white/10 shrink-0 shadow-xs"
                                    style={{ backgroundColor: currentSelectedAccent }}
                                />
                                <div className="flex items-center flex-1 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] px-2 py-1 text-xs">
                                    <span className="text-[var(--app-muted)] font-mono mr-1">#</span>
                                    <input
                                        type="text"
                                        value={customHexInput.replace("#", "")}
                                        onChange={(e) => {
                                            const clean = e.target.value.trim().replace("#", "");
                                            setCustomHexInput("#" + clean);
                                            const fullHex = "#" + clean;
                                            if (/^#[0-9A-Fa-f]{6}$/.test(fullHex) || /^#[0-9A-Fa-f]{3}$/.test(fullHex)) {
                                                handleSelectAccent(fullHex);
                                            }
                                        }}
                                        placeholder="8B5CF6"
                                        maxLength={6}
                                        className="w-full bg-transparent font-mono text-[11px] text-[var(--app-text)] uppercase outline-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomPickerOpen(false)}
                                    className="px-2.5 py-1 text-[11px] font-medium bg-[var(--app-card)] hover:bg-[var(--app-select-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[2px] cursor-pointer transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* ── SECTION 3: TYPOGRAPHY & FONTS ── */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-[var(--app-border,#E5E5E3)]/50">
                        <Type className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        <h3 className="eyebrow text-[10px] tracking-wider text-[var(--app-text,#1A1A1A)] font-bold">
                            Typography & Font Scaling
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Primary Interface Font */}
                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">
                                Primary Interface Font
                            </label>
                            <CustomSelect
                                options={styledFontOptions}
                                value={primaryFont}
                                onChange={(val) =>
                                    setPrimaryFont(val)
                                }
                                className="w-full"
                            />
                        </div>

                        {/* Secondary / Title Font */}
                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">
                                Secondary / Title Font
                            </label>
                            <CustomSelect
                                options={styledFontOptions}
                                value={secondaryFont}
                                onChange={(val) =>
                                    setSecondaryFont(val)
                                }
                                align="right"
                                className="w-full"
                            />
                        </div>

                        {/* Preset Pairings */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <label className="eyebrow">
                                    Preset Pairings
                                </label>
                                <span className="text-[10px] text-[var(--app-muted)]">
                                    1-Click Apply
                                </span>
                            </div>
                            <CustomSelect
                                options={FONT_PRESETS.map(
                                    (p) => ({
                                        value: `${p.primary}|${p.secondary}`,
                                        label: p.name,
                                        sublabel: `${p.primary} + ${p.secondary}`,
                                        style: { fontFamily: fontMap[p.primary] || "inherit" },
                                    }),
                                )}
                                value={
                                    FONT_PRESETS.some(
                                        (p) =>
                                            p.primary ===
                                                primaryFont &&
                                            p.secondary ===
                                                secondaryFont,
                                    )
                                        ? `${primaryFont}|${secondaryFont}`
                                        : ""
                                }
                                placeholder="Select a preset combination…"
                                onChange={(val) => {
                                    const [prim, sec] =
                                        val.split("|");
                                    if (prim && sec) {
                                        setPrimaryFont(prim);
                                        setSecondaryFont(sec);
                                    }
                                }}
                                className="w-full"
                            />
                        </div>

                        {/* Font Scale Option Dropdown */}
                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">
                                Font Scale Preset
                            </label>
                            <CustomSelect
                                options={scaleOptions}
                                value={closestScaleOption.value}
                                onChange={(val) =>
                                    setFontScale(
                                        parseFloat(val),
                                    )
                                }
                                align="right"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Font Scale Fine-tuning Slider */}
                    <div className="flex flex-col gap-1.5 p-3 bg-[var(--app-hover-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] rounded-[3px]">
                        <div className="flex justify-between items-center">
                            <label className="eyebrow text-[9px]">
                                System Font Scale
                            </label>
                            <span className="text-[11px] text-[var(--app-text,#1A1A1A)] font-semibold font-mono">
                                {Math.round(fontScale * 100)}%
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-[var(--app-muted,#888883)] font-medium">
                                A
                            </span>
                            <input
                                type="range"
                                min="0.85"
                                max="1.50"
                                step="0.05"
                                value={fontScale}
                                onChange={(e) =>
                                    setFontScale(
                                        parseFloat(
                                            e.target.value,
                                        ),
                                    )
                                }
                                className="flex-1 h-1 bg-[var(--app-border,#E5E5E3)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent,#1A1A1A)]"
                            />
                            <span className="text-sm font-semibold text-[var(--app-text,#1A1A1A)]">
                                A
                            </span>
                        </div>
                    </div>
                </section>

                {/* ── SECTION 4: INTERACTIONS & AUDIO ── */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-[var(--app-border,#E5E5E3)]/50">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        <h3 className="eyebrow text-[10px] tracking-wider text-[var(--app-text,#1A1A1A)] font-bold">
                            Interactions & Feedback
                        </h3>
                    </div>

                    <div className="flex flex-col gap-2 p-3 bg-[var(--app-hover-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] rounded-[3px]">
                        <ToggleSwitch
                            checked={enableConfetti}
                            onChange={handleToggleConfetti}
                            label="Task Completion Confetti"
                            title="Toggle task completion confetti"
                        />

                        <div className="w-full border-t border-[var(--app-border,#E5E5E3)]/60" />

                        <ToggleSwitch
                            checked={enableSound}
                            onChange={handleToggleSound}
                            label="Mechanical Sounds & Haptics"
                            title="Toggle mechanical audio and haptic feedback"
                        />
                    </div>
                </section>

                {/* ── SECTION 5: LIVE INTERFACE & TYPOGRAPHY PREVIEW ── */}
                <section className="flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--app-border,#E5E5E3)]/50">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                            <h3 className="eyebrow text-[10px] tracking-wider text-[var(--app-text,#1A1A1A)] font-bold">
                                Live Interface Preview
                            </h3>
                        </div>
                        {isModernMode && (
                            <span className="text-[9px] font-mono text-[var(--app-muted)]">
                                radius: {cornerRadius}px
                            </span>
                        )}
                    </div>

                    <div
                        className="p-3.5 border border-[var(--app-border,#E5E5E3)] bg-[var(--app-card,#FFFFFF)] flex flex-col gap-2.5 transition-all shadow-xs"
                        style={{ borderRadius: isModernMode ? `${Math.min(cornerRadius * 1.5, 12)}px` : '0px' }}
                    >
                        <div className="flex flex-col gap-0.5">
                            <h4
                                style={{
                                    fontFamily:
                                        fontMap[secondaryFont] || "inherit",
                                }}
                                className="text-sm font-semibold text-[var(--app-text,#1A1A1A)] transition-all"
                            >
                                Workspace & Task Assignment System
                            </h4>
                            <p
                                style={{
                                    fontFamily:
                                        fontMap[primaryFont] || "inherit",
                                }}
                                className="text-xs text-[var(--app-muted,#888883)] transition-all leading-relaxed"
                            >
                                {isModernMode
                                    ? "Configure your team workspace appearance. Corner roundness, typography, and accent colors scale in real time."
                                    : "Configure your team workspace appearance. Typography and accent colors scale in real time."}
                            </p>
                        </div>

                        {/* Interactive UI component preview snippets */}
                        <div className="flex items-center gap-2 pt-1 border-t border-[var(--app-border)]/60">
                            <button
                                type="button"
                                className="px-3 py-1 text-[11px] font-semibold text-white transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                                style={{
                                    backgroundColor: currentSelectedAccent,
                                    borderRadius: isModernMode ? `${cornerRadius}px` : '0px',
                                }}
                            >
                                <span>Button</span>
                            </button>
                            <div
                                className="px-2.5 py-1 text-[11px] font-medium border border-[var(--app-border)] bg-[var(--app-bg)] text-[var(--app-text)] transition-all"
                                style={{
                                    borderRadius: isModernMode ? `${cornerRadius}px` : '0px',
                                }}
                            >
                                <span>Input Field</span>
                            </div>
                            <span
                                className="px-2 py-0.5 text-[10px] font-medium border border-[var(--color-accent)]/30 text-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] transition-all ml-auto"
                                style={{
                                    borderRadius: isModernMode ? `${Math.max(1, cornerRadius - 2)}px` : '0px',
                                }}
                            >
                                Badge Tag
                            </span>
                        </div>
                    </div>
                </section>
            </div>

            {/* ── Sticky Bottom Action Footer ── */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-[var(--app-border,#E5E5E3)] bg-[var(--app-card,#FFFFFF)] shrink-0">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResetAll}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                    Reset Settings
                </Button>
                <Button
                    type="button"
                    onClick={onClose}
                    showDot
                >
                    Done
                </Button>
            </div>
        </SideSheetWrapper>
    );
}
