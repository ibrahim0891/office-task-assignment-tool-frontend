"use client";

import React, { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function TopLoadingBar() {
    const { isTasksLoading, isSwitchingTeam } = useWorkspace();
    const [visible, setVisible] = useState(false);

    const shouldShow = isTasksLoading && !isSwitchingTeam;

    useEffect(() => {
        if (shouldShow) {
            setVisible(true);
        } else {
            const timer = setTimeout(() => {
                setVisible(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [shouldShow]);

    if (!visible && !shouldShow) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 h-[2.5px] z-[99999] pointer-events-none overflow-hidden transition-opacity duration-300 ${
                shouldShow ? "opacity-100" : "opacity-0"
            }`}
            style={{
                backgroundColor: "var(--app-border, rgba(229, 229, 227, 0.4))",
            }}
        >
            {/* Primary theme-styled indeterminate beam */}
            <div
                className="google-top-loader-bar rounded-full"
                style={{
                    background: "var(--color-accent, var(--app-text, #1A1A1A))",
                    boxShadow: "0 0 8px var(--color-accent, rgba(26, 26, 26, 0.4))",
                }}
            />
            {/* Secondary follower beam */}
            <div
                className="google-top-loader-bar-secondary rounded-full"
                style={{
                    background: "var(--color-accent, var(--app-text, #1A1A1A))",
                    opacity: 0.7,
                }}
            />
        </div>
    );
}
