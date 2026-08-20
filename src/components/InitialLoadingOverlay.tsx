"use client";

import React, { useEffect, useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";

export default function InitialLoadingOverlay() {
    const { isInitialized } = useWorkspace();
    const [shouldRender, setShouldRender] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (isInitialized) {
            setIsExiting(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 4500); // Matches the 4.5s transition time
            return () => clearTimeout(timer);
        }
    }, [isInitialized]);

    if (!shouldRender) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none select-none">
            {/* SVG mask container */}
            <svg
                className={`absolute inset-0 w-full h-full ${
                    isExiting ? "pointer-events-none" : "pointer-events-auto"
                }`}
                style={{ mixBlendMode: "normal" }}
            >
                <defs>
                    <mask id="circle-mask">
                        {/* Everything in white remains opaque/visible */}
                        <rect width="100%" height="100%" fill="white" />
                        {/* The black circle masks out/reveals content behind it. Starts scaled at 0, grows to 1.5 */}
                        <circle
                            cx="50%"
                            cy="50%"
                            r="120vmax"
                            fill="black"
                            style={{
                                transformOrigin: "center",
                                transform: isExiting ? "scale(1.5)" : "scale(0)",
                                transition: isExiting
                                    ? "transform 4.5s ease"
                                    : "none",
                            }}
                        />
                    </mask>
                </defs>
                {/* The main solid background layer using the mask */}
                <rect
                    width="100%"
                    height="100%"
                    fill="var(--app-bg, #FAFAF9)"
                    mask="url(#circle-mask)"
                />
            </svg>

            {/* Loading text and elements */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 transition-opacity duration-500"
                style={{
                    opacity: isExiting ? 0 : 1,
                    pointerEvents: isExiting ? "none" : "auto",
                }}
            >
                <div className="flex flex-col items-center gap-1.5">
                    <span className="text-3xl">🧑‍💻</span>
                    <h1 className="font-heading text-2xl text-[var(--app-text,#1A1A1A)] tracking-tight">
                        OfficeTask
                    </h1>
                </div>
                {/* Custom sliding line loader */}
                <div className="w-12 h-0.5 bg-[var(--app-border,#E5E5E3)] overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 left-0 bg-[var(--color-accent,#00D26A)] w-1/3 animate-loading-bar" />
                </div>
            </div>
        </div>
    );
}
