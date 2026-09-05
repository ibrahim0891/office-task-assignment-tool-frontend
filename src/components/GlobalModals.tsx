"use client";

import React from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { api } from "../api";
import TaskModal from "./TaskModal";
import MemberProfileModal from "./MemberProfileModal";
import ManageTeamsModal from "./ManageTeamsModal";
import AddTaskModal from "./AddTaskModal";
import ConfigureColumnsModal from "./ConfigureColumnsModal";
import NotificationsTray from "./NotificationsTray";
import NotificationToasts from "./NotificationToasts";

export default function GlobalModals() {
    const {
        currentUser,
        currentTeam,
        userRole,
        teamMembers,
        teams,
        tasks,
        columns,
        notifications,
        isNotificationsLoading,
        selectedTaskId,
        setSelectedTaskId,
        directTask,
        setDirectTask,
        taskModalTab,
        setTaskModalTab,
        isAddTaskOpen,
        setIsAddTaskOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        profileModalUser,
        setProfileModalUser,
        isCreateTeamModalOpen,
        setIsCreateTeamModalOpen,
        isConfigModalOpen,
        setIsConfigModalOpen,
        toasts,
        removeToast,
        hasMoreNotifications,
        isLoadingMoreNotifications,
        loadMoreNotifications,
        handleMarkNotificationRead,
        handleClearAllNotifications,
        handleArchiveNotification,
        handleDeleteArchivedNotifications,
        handleCreateTeam,
        handleUpdateTeam,
        handleDeleteTeam,
        handleLeaveTeam,
        loadTasks,
        loadTeamMetadata,
        setCurrentTeam,
    } = useWorkspace();

    const activeTask = tasks.find((t) => t.id === selectedTaskId);
    const modalTask = directTask?.id === selectedTaskId ? directTask : activeTask;

    const handleSelectTaskFromNotification = async (id: string, initialTab?: "details" | "comments" | "attachments") => {
        try {
            const updatedTask = await api.getTask(id, currentTeam?.id);
            setDirectTask(updatedTask);
            setTaskModalTab(initialTab || "details");
            setSelectedTaskId(id);
        } catch (err) {
            console.error("Failed to select task from notification:", err);
        }
    };

    return (
        <>
            <NotificationsTray
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                isLoading={isNotificationsLoading}
                onMarkRead={handleMarkNotificationRead}
                onClearAll={handleClearAllNotifications}
                onArchiveNotification={handleArchiveNotification}
                onSelectTask={handleSelectTaskFromNotification}
                onDeleteArchived={handleDeleteArchivedNotifications}
                hasMore={hasMoreNotifications}
                isLoadingMore={isLoadingMoreNotifications}
                onLoadMore={loadMoreNotifications}
                teams={teams}
                onSelectTeam={setCurrentTeam}
            />

            <NotificationToasts
                toasts={toasts}
                onDismiss={removeToast}
                onSelectTask={handleSelectTaskFromNotification}
            />

            {/* Task Detail Modal Overlay */}
            {selectedTaskId && modalTask && (
                <TaskModal
                    task={modalTask}
                    isOpen={!!selectedTaskId}
                    onClose={() => {
                        setSelectedTaskId(null);
                        setDirectTask(null);
                    }}
                    columns={columns}
                    teamMembers={teamMembers}
                    currentUser={currentUser!}
                    userRole={userRole}
                    onRefresh={async () => {
                        loadTasks();
                        loadTeamMetadata();
                        if (directTask?.id === selectedTaskId) {
                            try {
                                const refreshed = await api.getTask(selectedTaskId, currentTeam?.id);
                                setDirectTask(refreshed);
                            } catch {}
                        }
                    }}
                    initialTab={taskModalTab}
                />
            )}

            {/* LinkedIn-Style Member Profile Popup */}
            {profileModalUser && (
                <MemberProfileModal
                    user={profileModalUser}
                    userRole={
                        teamMembers.find(
                            (tm) => tm.user.id === profileModalUser.id,
                        )?.role || "MEMBER"
                    }
                    isOpen={!!profileModalUser}
                    onClose={() => setProfileModalUser(null)}
                    tasks={tasks}
                    onSelectTask={(id) => setSelectedTaskId(id)}
                />
            )}

            {/* Manage Workspaces & Teams Modal */}
            <ManageTeamsModal
                isOpen={isCreateTeamModalOpen}
                onClose={() => setIsCreateTeamModalOpen(false)}
                teams={teams}
                currentTeam={currentTeam}
                currentUser={currentUser}
                userRole={userRole}
                onSelectTeam={(team) => setCurrentTeam(team)}
                onCreateTeam={handleCreateTeam}
                onUpdateTeam={handleUpdateTeam}
                onDeleteTeam={handleDeleteTeam}
                onLeaveTeam={handleLeaveTeam}
            />

            {/* Create Task Modal */}
            <AddTaskModal
                isOpen={isAddTaskOpen}
                onClose={() => setIsAddTaskOpen(false)}
            />

            {/* Columns Configuration Modal */}
            <ConfigureColumnsModal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
            />
        </>
    );
}
