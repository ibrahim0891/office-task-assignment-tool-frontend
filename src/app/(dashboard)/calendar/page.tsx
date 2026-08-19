"use client";

import React from "react";
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
    } = useWorkspace();

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
