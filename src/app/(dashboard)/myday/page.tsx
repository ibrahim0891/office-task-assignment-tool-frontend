"use client";

import React from "react";
import MyDayView from "@/components/MyDayView";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SkeletonList } from "@/components/ui/SkeletonLoader";

export default function MyDayPage() {
    const {
        tasks,
        columns,
        teamMembers,
        currentUser,
        setSelectedTaskId,
        handleToggleComplete,
        currentTeam,
    } = useWorkspace();

    if (!currentTeam || !currentUser) {
        return <SkeletonList />;
    }

    return (
        <MyDayView
            tasks={tasks}
            columns={columns}
            teamMembers={teamMembers}
            currentUser={currentUser}
            onSelectTask={setSelectedTaskId}
            onToggleComplete={handleToggleComplete}
        />
    );
}
