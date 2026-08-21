"use client";

import React from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import SolarMapView from "@/components/SolarMapView";
import { SkeletonBoard } from "@/components/ui/SkeletonLoader";
import AccessRestrictedModal from "@/components/ui/AccessRestrictedModal";

export default function TeamMapRoute() {
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
            <AccessRestrictedModal
                title="Access Restricted"
                description="The Team Flow map is exclusive to Workspace Leaders and Observers. Standard members do not have permission to view this hierarchical workspace visualization."
                currentRole={userRole}
                returnPath="/task-board"
                returnLabel="Return to Task Board"
            />
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
