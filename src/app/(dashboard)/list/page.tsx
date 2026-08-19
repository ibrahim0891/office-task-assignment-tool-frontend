"use client";

import React from "react";
import ListView from "@/components/ListView";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SkeletonList } from "@/components/ui/SkeletonLoader";

export default function ListPage() {
    const {
        tasks,
        columns,
        teamMembers,
        currentUser,
        currentTeam,
        loadTasks,
        setSelectedTaskId,
    } = useWorkspace();

    if (!currentTeam || !currentUser) {
        return <SkeletonList />;
    }

    return (
        <ListView
            tasks={tasks}
            columns={columns}
            teamMembers={teamMembers}
            currentUser={currentUser}
            currentTeam={currentTeam}
            onRefresh={loadTasks}
            onSelectTask={setSelectedTaskId}
        />
    );
}
