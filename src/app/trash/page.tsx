"use client";

import React from "react";
import TrashView from "../../components/TrashView";
import { useWorkspace } from "../../context/WorkspaceContext";
import { SkeletonList } from "../../components/ui/SkeletonLoader";

export default function TrashPage() {
    const {
        currentTeam,
        currentUser,
        userRole,
        loadTasks,
        loadTeamMetadata,
    } = useWorkspace();

    if (!currentTeam || !currentUser) {
        return <SkeletonList />;
    }

    return (
        <TrashView
            teamId={currentTeam.id}
            currentUser={currentUser}
            userRole={userRole}
            onRefreshWorkspace={() => {
                loadTasks();
                loadTeamMetadata();
            }}
        />
    );
}
