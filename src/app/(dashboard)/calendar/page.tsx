"use client";

import React, { useEffect, useState, useCallback } from "react";
import CalendarView from "@/components/CalendarView";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { api, Task } from "@/api";

export default function CalendarPage() {
    const {
        setSelectedTaskId,
        selectedTaskId,
        activeDateStr,
        setActiveDateStr,
        currentTeam,
        currentUser,
    } = useWorkspace();

    const [calendarTasks, setCalendarTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const loadCalendarTasks = useCallback(async () => {
        if (!currentTeam?.id) return;
        try {
            const data = await api.getTasks({ teamId: currentTeam.id }, currentUser?.id);
            if (Array.isArray(data)) {
                setCalendarTasks(data);
            }
        } catch (err) {
            console.error("Error loading calendar tasks:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentTeam?.id, currentUser?.id]);

    useEffect(() => {
        loadCalendarTasks();
    }, [loadCalendarTasks]);

    // Refetch when task modal closes or changes
    const prevSelectedTaskIdRef = React.useRef(selectedTaskId);
    useEffect(() => {
        if (prevSelectedTaskIdRef.current && !selectedTaskId) {
            loadCalendarTasks();
        }
        prevSelectedTaskIdRef.current = selectedTaskId;
    }, [selectedTaskId, loadCalendarTasks]);

    if (!currentTeam || isLoading) {
        return <SkeletonList />;
    }

    return (
        <CalendarView
            tasks={calendarTasks}
            onSelectTask={setSelectedTaskId}
            activeDateStr={activeDateStr}
            setActiveDateStr={setActiveDateStr}
        />
    );
}

