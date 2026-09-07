"use client";

import React, { useEffect } from "react";
import CalendarView from "@/components/CalendarView";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SkeletonList } from "@/components/ui/SkeletonLoader";

export default function CalendarPage() {
    const {
        tasks,
        setSelectedTaskId,
        activeDateStr,
        setActiveDateStr,
        currentTeam,
        loadTasks,
    } = useWorkspace();

    useEffect(() => {
        if (currentTeam?.id) {
            loadTasks();
        }
    }, [currentTeam?.id, loadTasks]);

    if (!currentTeam) {
        return <SkeletonList />;
    }

    return (
        <CalendarView
            tasks={tasks}
            onSelectTask={setSelectedTaskId}
            activeDateStr={activeDateStr}
            setActiveDateStr={setActiveDateStr}
        />
    );
}
