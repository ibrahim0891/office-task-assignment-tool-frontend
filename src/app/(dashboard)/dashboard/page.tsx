"use client";

import React from "react";
import LeaderDashboard from "@/components/LeaderDashboard";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SkeletonBoard } from "@/components/ui/SkeletonLoader";
import AccessRestrictedModal from "@/components/ui/AccessRestrictedModal";

export default function DashboardPage() {
    const {
        currentTeam,
        currentUser,
        userRole,
        tasks,
        columns,
        teamMembers,
        users,
        loadTasks,
        loadTeamMetadata,
        setSelectedTaskId,
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
                description="The Dashboard is exclusive to Workspace Leaders and Observers. Standard members do not have permission to view workspace analytics and leader controls."
                currentRole={userRole}
                returnPath="/task-board"
                returnLabel="Return to Task Board"
            />
        );
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
