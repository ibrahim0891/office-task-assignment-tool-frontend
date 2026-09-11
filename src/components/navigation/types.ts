import React from "react";
import { User, Team } from "../../api";

export interface NavItem {
    id: string;
    href: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    leaderOnly?: boolean;
    leaderOrObserverOnly?: boolean;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface DesktopTopbarProps {
    currentUser: User;
    onLogout: () => void;
    teams: Team[];
    currentTeam: Team | null;
    setCurrentTeam: (team: Team) => void;
    onCreateTeamClick: () => void;
    currentView: string;
    setCurrentView?: (view: string) => void;
    toggleConfigModal: () => void;
    userRole: string;
    theme: string;
    onToggleTheme: (e?: React.MouseEvent) => void;
    onOpenSystemSettings: () => void;
    onOpenSpotlight: () => void;
    isStandalone?: boolean;
    onOpenPwaInstall?: () => void;
}
