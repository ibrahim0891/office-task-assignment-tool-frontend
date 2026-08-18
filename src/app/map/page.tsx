"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "../../context/WorkspaceContext";
import SolarMapView from "../../components/SolarMapView";
import { SkeletonBoard } from "../../components/ui/SkeletonLoader";
import { Button } from "../../components/ui/Button";
import { ShieldAlert } from "lucide-react";

export default function SolarMapRoute() {
    const router = useRouter();
    const {
        currentTeam,
        currentUser,
        userRole,
        teamMembers,
        tasks,
        setSelectedTaskId,
        openMemberProfile,
    } = useWorkspace();

    if (!currentTeam || !currentUser || teamMembers.length === 0) {
        return <SkeletonBoard />;
    }

    // Restrict access to leaders and observers only
    const isAllowed = userRole === "LEADER" || userRole === "OBSERVER";

    if (!isAllowed) {
        return (
            <div className="w-full h-full flex flex-col justify-center items-center p-6 bg-[var(--app-bg)] text-center select-none font-sans">
                <div 
                    className="bg-[var(--app-card)] border border-[var(--app-border)] p-8 sm:p-10 rounded-[3px] max-w-md flex flex-col items-center gap-4.5 shadow-md corner-brackets"
                >
                    <div className="w-12 h-12 rounded-full bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 flex items-center justify-center text-[var(--color-error)] shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        <h3 className="font-heading text-lg font-bold text-[var(--app-text)] leading-snug">
                            Access Restricted
                        </h3>
                        <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                            The Solar Map is exclusive to Workspace Leaders and Observers. Standard members do not have permission to view this relational workspace visualization.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={() => router.replace("/kanban")}
                        showDot
                        className="mt-2 px-6 py-2"
                    >
                        Return to Task Board
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <SolarMapView
            currentTeam={currentTeam}
            currentUser={currentUser}
            userRole={userRole}
            teamMembers={teamMembers}
            tasks={tasks}
            onSelectTask={setSelectedTaskId}
            onSelectMember={openMemberProfile}
        />
    );
}
