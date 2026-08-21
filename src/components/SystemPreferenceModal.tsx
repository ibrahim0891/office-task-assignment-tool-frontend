"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Palette, Type, RotateCcw, Sparkles, Check, Pipette } from "lucide-react";
import { Button } from "./ui/Button";
import { CustomSelect } from "./ui/CustomSelect";
import { Checkbox } from "./ui/Checkbox";
import { ToggleSwitch } from "./ui/ToggleSwitch";
import { fontMap, FONT_OPTIONS, FONT_PRESETS } from "../config/fontConfig";
import {
    LIGHT_ACCENT_OPTIONS,
    DARK_ACCENT_OPTIONS,
    applyAccentColor,
} from "../config/accentConfig";

import { playFeedback } from "../utils/feedback";

interface SystemPreferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: "light" | "nord-dark" | "amoled-dark" | "lws-dark";
    setTheme: (theme: "light" | "nord-dark" | "amoled-dark" | "lws-dark") => void;
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
    primaryFont,
    setPrimaryFont,
    secondaryFont,
    setSecondaryFont,
    fontScale,
    setFontScale,
    onReset,
}: SystemPreferenceModalProps) {
    const [settingsTab, setSettingsTab] = useState<"theme" | "typography">("theme");
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

    const colorInputRef = useRef<HTMLInputElement>(null);

    const isDarkMode = theme !== "light";
    const currentAccentList = isDarkMode
        ? DARK_ACCENT_OPTIONS
        : LIGHT_ACCENT_OPTIONS;
    const currentSelectedAccent = isDarkMode ? darkAccent : lightAccent;
    const matchedOption = currentAccentList.find(
        (c) =>
            c.value.toLowerCase() === currentSelectedAccent.toLowerCase(),
    );
    const isCustomActive = !matchedOption;

    const handleSelectAccent = (colorValue: string) => {
        if (isDarkMode) {
            setDarkAccent(colorValue);
            localStorage.setItem("sys_accent_dark", colorValue);
            applyAccentColor(theme, undefined, colorValue);
        } else {
            setLightAccent(colorValue);
            localStorage.setItem("sys_accent_light", colorValue);
            applyAccentColor(theme, colorValue, undefined);
        }
    };

    if (!isOpen) return null;

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
        setLightAccent(LIGHT_ACCENT_OPTIONS[0].value);
        setDarkAccent(DARK_ACCENT_OPTIONS[0].value);
        setEnableConfetti(true);
        setEnableSound(true);
        applyAccentColor(
            theme,
            LIGHT_ACCENT_OPTIONS[0].value,
            DARK_ACCENT_OPTIONS[0].value,
        );
        onReset();
    };

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

    const styledFontOptions = FONT_OPTIONS.map((opt) => ({
        ...opt,
        style: { fontFamily: fontMap[opt.value] || "inherit" },
    }));

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <div
                className="relative bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] p-5 w-full max-w-md flex flex-col gap-4 animate-fade-in text-left rounded-[3px] corner-brackets shadow-xl"
                style={{ boxShadow: "var(--shadow-float)" }}
            >
                <div className="flex items-center justify-between pb-1">
                    <h2 className="font-heading text-base text-[var(--app-text,#1A1A1A)]">
                        System Preferences
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)] text-[15px] font-bold px-1 transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Settings Tabs */}
                <div className="bg-[var(--app-hover-bg,#FAFAF9)] px-2 py-1.5 flex items-center gap-1 rounded-[2px]">
                    <button
                        type="button"
                        onClick={() => setSettingsTab("theme")}
                        className={`relative px-3 py-1.5 text-[11px] font-medium rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                            settingsTab === "theme"
                                ? "bg-[var(--app-card,#FFFFFF)] text-[var(--app-text,#1A1A1A)] border border-[var(--app-border,#E5E5E3)] corner-brackets-4 shadow-sm"
                                : "text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)] hover:bg-[var(--app-hover-bg,#F0F0EE)]"
                        }`}
                    >
                        <Palette className="w-3 h-3 shrink-0" />
                        <span>Theme & Color</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSettingsTab("typography")}
                        className={`relative px-3 py-1.5 text-[11px] font-medium rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                            settingsTab === "typography"
                                ? "bg-[var(--app-card,#FFFFFF)] text-[var(--app-text,#1A1A1A)] border border-[var(--app-border,#E5E5E3)] corner-brackets-4 shadow-sm"
                                : "text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)] hover:bg-[var(--app-hover-bg,#F0F0EE)]"
                        }`}
                    >
                        <Type className="w-3 h-3 shrink-0" />
                        <span>Typography & Fonts</span>
                    </button>
                </div>

                {/* Section Divider 1 */}
                <div className="relative w-full border-t border-[var(--app-border,#E5E5E3)]">
                    {/* Left T-Bracket ├ */}
                    <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center text-[var(--app-text,#1A1A1A)]">
                        <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M5 0V10M5 5H10"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                        </svg>
                    </div>
                </div>

                <div className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto pr-0.5">
                    {settingsTab === "theme" ? (
                        <div className="flex flex-col gap-3.5">
                            {/* Color Theme Selector */}
                            <div className="flex flex-col gap-1.5">
                                <label className="eyebrow">
                                    Select Workspace Color Palette
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

                            {/* Accent Color 1-Row Square Grid with Custom Dropper */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <label className="eyebrow flex items-center gap-1.5">
                                        <span
                                            className="w-1.5 h-1.5 rounded-[0.5px] inline-block transition-colors shadow-xs"
                                            style={{
                                                backgroundColor:
                                                    "var(--color-accent)",
                                            }}
                                        />
                                        Accent Color
                                    </label>
                                    <span className="font-mono text-[10px] text-[var(--app-muted,#888883)] ">
                                        {matchedOption
                                            ? matchedOption.name
                                            : `Custom (${currentSelectedAccent.toUpperCase()})`}
                                    </span>
                                </div>

                                <div className="grid grid-cols-8 gap-1.5 p-1 bg-[var(--app-hover-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] rounded-[2px] corner-brackets-4">
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
                                                className={`h-6 w-full rounded-[2px] border border-black/10 dark:border-white/10 transition-all duration-150 flex items-center justify-center cursor-pointer relative ${
                                                    isSelected
                                                        ? "ring-2 ring-[var(--app-text,#1A1A1A)] ring-offset-1 ring-offset-[var(--app-card)] scale-105 shadow-xs"
                                                        : "hover:scale-105 hover:shadow-xs opacity-90 hover:opacity-100"
                                                }`}
                                                style={{
                                                    backgroundColor:
                                                        color.value,
                                                }}
                                            >
                                                {isSelected && (
                                                    <Check className="w-3 h-3 text-white stroke-[3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                                                )}
                                            </button>
                                        );
                                    })}

                                    {/* 8th Slot: Custom Color Dropper */}
                                    <div className="relative h-6 w-full">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                colorInputRef.current?.click()
                                            }
                                            title={
                                                isCustomActive
                                                    ? `Custom Color: ${currentSelectedAccent}`
                                                    : "Pick a Custom Color…"
                                            }
                                            className={`h-6 w-full rounded-[2px] transition-all duration-150 flex items-center justify-center cursor-pointer relative group ${
                                                isCustomActive
                                                    ? "ring-2 ring-[var(--app-text,#1A1A1A)] ring-offset-1 ring-offset-[var(--app-card)] scale-105 shadow-xs border border-transparent"
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
                                                className={`w-3 h-3 transition-colors ${
                                                    isCustomActive
                                                        ? "text-white stroke-[2.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
                                                        : "text-[var(--app-muted,#888883)] group-hover:text-[var(--app-text,#1A1A1A)]"
                                                }`}
                                            />
                                        </button>
                                        <input
                                            ref={colorInputRef}
                                            type="color"
                                            value={currentSelectedAccent}
                                            onChange={(e) =>
                                                handleSelectAccent(
                                                    e.target.value,
                                                )
                                            }
                                            className="sr-only"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Reusable Confetti Switch */}
                            <ToggleSwitch
                                checked={enableConfetti}
                                onChange={handleToggleConfetti}
                                label="Task Completion Confetti"
                                title="Toggle task completion confetti"
                            />

                            {/* Reusable Mechanical Audio & Haptics Switch */}
                            <ToggleSwitch
                                checked={enableSound}
                                onChange={handleToggleSound}
                                label="Mechanical Sounds & Haptics"
                                title="Toggle mechanical audio and haptic feedback"
                            />

                            <p className="text-[11px] text-[var(--app-muted,#888883)] leading-relaxed">
                                Choose a visual theme and feedback options for your task
                                workspace. Changes apply instantly across all views.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {/* 2x2 Grid with Primary Font, Secondary Font, and Presets spanning 2 cols */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Row 1, Col 1: Primary Interface Font */}
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

                                {/* Row 1, Col 2: Secondary / Title Font */}
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
                                        className="w-full"
                                    />
                                </div>

                                {/* Row 2, Col 1: Preset Pairings */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <label className="eyebrow">
                                            Preset Pairings
                                        </label>
                                        <span className="text-[10px] text-[#888883]">
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

                                {/* Row 2, Col 2: Font Scale Option Dropdown */}
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
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* System Font Scale Slider */}
                            <div className="flex flex-col gap-1.5 border-t border-[var(--app-border,#E5E5E3)]/60 pt-3">
                                <div className="flex justify-between items-center">
                                    <label className="eyebrow">
                                        System Font Scale
                                    </label>
                                    <span className="text-[11px] text-[var(--app-text,#1A1A1A)] font-semibold">
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
                        </div>
                    )}

                    {/* Sample Preview Box (Visible on both tabs for direct feedback) */}
                    <div className="p-3 border border-[var(--app-border,#E5E5E3)] bg-[var(--app-card,#FAFAF9)] rounded-[2px] flex flex-col gap-1 mt-0.5">
                        <span className="eyebrow text-[9px]">
                            Live Typography Preview
                        </span>
                        <h4
                            style={{
                                fontFamily:
                                    fontMap[secondaryFont] || "inherit",
                            }}
                            className="text-base font-semibold text-[var(--app-text,#1A1A1A)] transition-all"
                        >
                            Workspace & Task Assignment System
                        </h4>
                        <p
                            style={{
                                fontFamily:
                                    fontMap[primaryFont] || "inherit",
                            }}
                            className="text-xs text-[var(--app-muted,#888883)] transition-all"
                        >
                            Configure your team workspace appearance.
                            Settings automatically scale typography and
                            UI components in real time.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-[var(--app-border,#E5E5E3)]">
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
            </div>
        </div>
    );
}
