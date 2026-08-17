"use client";

import React from "react";
import LeaderDashboard from "../../components/LeaderDashboard";
import { useWorkspace } from "../../context/WorkspaceContext";
import { SkeletonBoard } from "../../components/ui/SkeletonLoader";

export default function DashboardPage() {
    const {
        currentTeam,
        currentUser,
        tasks,
        columns,
        teamMembers,
        users,
        loadTasks,
        loadTeamMetadata,
        setSelectedTaskId,
    } = useWorkspace();

    if (!currentTeam || !currentUser) {
        return <SkeletonBoard />;
    }

    return (
        <LeaderDashboard
            currentTeam={currentTeam}
            currentUser={currentUser}
            tasks={tasks}
            columns={columns}
            teamMembers={teamMembers}
            allUsers={users}
            onRefresh={() => {
                loadTasks();
                loadTeamMetadata();
            }}
            onSelectTask={setSelectedTaskId}
        />
    );
}
