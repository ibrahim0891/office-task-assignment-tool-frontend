"use client";

import React from "react";
import KanbanBoard from "@/components/KanbanBoard";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SkeletonBoard } from "@/components/ui/SkeletonLoader";

export default function KanbanPage() {
    const {
        tasks,
        columns,
        currentUser,
        userRole,
        teamMembers,
        selectedMemberFilter,
        setSelectedMemberFilter,
        handleUpdateTaskColumn,
        handleArchiveTask,
        setSelectedTaskId,
        setAddTaskColId,
        setIsAddTaskOpen,
        handleAddQuickTask,
        currentTeam,
        setDraggingCardId,
    } = useWorkspace();

    if (!currentTeam || columns.length === 0) {
        return <SkeletonBoard />;
    }

    return (
        <KanbanBoard
            tasks={tasks}
            columns={columns}
            currentUser={currentUser!}
            userRole={userRole}
            teamMembers={teamMembers}
            selectedMemberFilter={selectedMemberFilter}
            onMemberFilterChange={setSelectedMemberFilter}
            onUpdateTaskColumn={handleUpdateTaskColumn}
            onSelectTask={setSelectedTaskId}
            onAddTaskClick={(colId) => {
                setAddTaskColId(colId);
                setIsAddTaskOpen(true);
            }}
            onAddQuickTask={handleAddQuickTask}
            onArchiveTask={handleArchiveTask}
            onDragStartNotify={setDraggingCardId}
            onDragEndNotify={() => setDraggingCardId(null)}
        />
    );
}
