"use client";

import React from "react";
import { DesktopAppTier } from "./DesktopAppTier";
import { DesktopNavTier } from "./DesktopNavTier";
import { DesktopTopbarProps } from "./types";

interface ExtendedDesktopTopbarProps extends DesktopTopbarProps {
    viewLabel: string;
}

export default function DesktopTopbar({
    currentUser,
    onLogout,
    teams,
    currentTeam,
    setCurrentTeam,
    onCreateTeamClick,
    currentView,
    setCurrentView,
    toggleConfigModal,
    userRole,
    theme,
    onToggleTheme,
    onOpenSystemSettings,
    onOpenSpotlight,
    isStandalone,
    onOpenPwaInstall,
    viewLabel,
}: ExtendedDesktopTopbarProps) {
    return (
        <header className="w-full flex flex-col shrink-0 select-none print:hidden shadow-xs z-30">
            {/* Tier 1: Application Titlebar & Global Tools */}
            <DesktopAppTier
                currentUser={currentUser}
                teams={teams}
                currentTeam={currentTeam}
                setCurrentTeam={setCurrentTeam}
                onCreateTeamClick={onCreateTeamClick}
                toggleConfigModal={toggleConfigModal}
                userRole={userRole}
                theme={theme}
                onToggleTheme={onToggleTheme}
                onOpenSystemSettings={onOpenSystemSettings}
                onOpenSpotlight={onOpenSpotlight}
                onLogout={onLogout}
                isStandalone={isStandalone}
                onOpenPwaInstall={onOpenPwaInstall}
            />

            {/* Tier 2: Navigation Ribbon & Context Tools */}
            <DesktopNavTier
                userRole={userRole}
                viewLabel={viewLabel}
                onItemClick={setCurrentView}
            />
        </header>
    );
}
