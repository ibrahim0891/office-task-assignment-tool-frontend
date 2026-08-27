"use client";

import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { api, User, Team, Task, Notification } from "../api";
import { APP_CONFIG } from "../config/appConfig";

const clientId = typeof window !== "undefined"
    ? Math.random().toString(36).substring(2) + Date.now().toString(36)
    : "";

export function useWorkspaceSockets(
    currentTeam: Team | null,
    currentUser: User | null,
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    loadTasks: () => Promise<void>,
    selectedTaskId: string | null,
    addNotificationToast: (notification: any) => void,
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
    pendingColumnUpdatesRef: React.MutableRefObject<Record<string, { timeoutId: NodeJS.Timeout; previousTasks: any[]; targetColumnId: string }>>,
    moveVersionRef: React.MutableRefObject<Record<string, number>>,
    setCommentUpdateTrigger?: React.Dispatch<React.SetStateAction<number>>,
    loadProjects?: () => Promise<void>,
    loadProjectInvitations?: () => Promise<void>,
) {
    const draggingCardIdRef = useRef<string | null>(null);
    const deferredSocketEventsRef = useRef<Array<{ action: string; taskId: string; columnId?: string; actingUserId?: string; timestamp?: number }>>([]);
    const socketRef = useRef<any | null>(null);

    const selectedTaskIdRef = useRef<string | null>(null);
    selectedTaskIdRef.current = selectedTaskId;

    const currentUserRef = useRef<User | null>(null);
    currentUserRef.current = currentUser;

    const setDraggingCardId = useCallback((cardId: string | null) => {
        const previousCardId = draggingCardIdRef.current;
        draggingCardIdRef.current = cardId;

        if (cardId === null && previousCardId !== null) {
            const deferred = [...deferredSocketEventsRef.current];
            deferredSocketEventsRef.current = [];

            if (deferred.length > 0) {
                for (const event of deferred) {
                    if (event.taskId !== previousCardId) {
                        if (event.action === "update" && event.columnId) {
                            setTasks((prev) =>
                                prev.map((t) =>
                                    t.id === event.taskId ? { ...t, columnId: event.columnId! } : t
                                )
                            );
                        } else {
                            loadTasks();
                        }
                    }
                }
            }
        }
    }, [loadTasks, setTasks]);

    // Socket.IO Realtime Kanban Synchronization — hardened against race conditions
    useEffect(() => {
        if (!currentTeam?.id) return;

        const socketUrl = APP_CONFIG.API_URL.replace("/api", "");

        console.log(`[Socket Client] Initializing connection to ${socketUrl}`);

        const socket = io(socketUrl, {
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log(`[Socket Client] Connected successfully with ID: ${socket.id}`);
            // Register user identity so backend can exclude our sockets from broadcasts
            if (currentUserRef.current?.id) {
                console.log(`[Socket Client] Emitting register_user for user ${currentUserRef.current.id}`);
                socket.emit("register_user", currentUserRef.current.id);
            }
            console.log(`[Socket Client] Emitting join_team for team ${currentTeam.id}`);
            socket.emit("join_team", currentTeam.id);
        });

        socket.on("new_notification", (notification: any) => {
            console.log("[Socket Client] Received new_notification:", notification);
            
            if (notification.type === "PROJECT_INVITATION" && loadProjects) {
                loadProjects();
            }

            // Avoid showing toast banners/chimes if the details modal for this specific task is already open
            const isTaskModalOpenForThisTask = selectedTaskIdRef.current && notification.taskId === selectedTaskIdRef.current;
            if (!isTaskModalOpenForThisTask) {
                addNotificationToast(notification);
            }

            setNotifications((prev) => {
                if (prev.some((n) => n.id === notification.id)) return prev;
                return [notification, ...prev];
            });
        });

        socket.on("project_updated", (data: any) => {
            console.log("[Socket Client] Received project_updated:", data);
            if (loadProjects) {
                loadProjects();
            }
            if (loadProjectInvitations) {
                loadProjectInvitations();
            }
        });

        socket.on("project_invitation", (data: any) => {
            console.log("[Socket Client] Received project_invitation:", data);
            if (loadProjects) {
                loadProjects();
            }
            if (loadProjectInvitations) {
                loadProjectInvitations();
            }
        });

        socket.on("project_invitation_accepted", (data: any) => {
            console.log("[Socket Client] Received project_invitation_accepted:", data);
            if (loadProjects) {
                loadProjects();
            }
            if (loadProjectInvitations) {
                loadProjectInvitations();
            }
        });

        socket.on("project_invitation_rejected", (data: any) => {
            console.log("[Socket Client] Received project_invitation_rejected:", data);
            if (loadProjectInvitations) {
                loadProjectInvitations();
            }
        });

        socket.on("project_invitation_cancelled", (data: any) => {
            console.log("[Socket Client] Received project_invitation_cancelled:", data);
            if (loadProjectInvitations) {
                loadProjectInvitations();
            }
        });

        socket.on("invitation_sent", (data: any) => {
            console.log("[Socket Client] Received invitation_sent:", data);
            if (loadProjectInvitations) {
                loadProjectInvitations();
            }
        });

        socket.on("project_task_comment_created", (data: any) => {
            console.log("[Socket Client] Received project_task_comment_created:", data);
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("project_task_comment_created", { detail: data }));
            }
        });

        socket.on("project_task_comment_updated", (data: any) => {
            console.log("[Socket Client] Received project_task_comment_updated:", data);
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("project_task_comment_updated", { detail: data }));
            }
        });

        socket.on("project_task_comment_resolved", (data: any) => {
            console.log("[Socket Client] Received project_task_comment_resolved:", data);
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("project_task_comment_resolved", { detail: data }));
            }
        });

        socket.on("project_task_comment_deleted", (data: any) => {
            console.log("[Socket Client] Received project_task_comment_deleted:", data);
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("project_task_comment_deleted", { detail: data }));
            }
        });

        socket.on("connect_error", (err) => {
            console.error("[Socket Client] Connection error:", err);
        });

        socket.on("task_updated", (data?: {
            action?: string;
            taskId?: string;
            columnId?: string;
            actingUserId?: string;
            clientId?: string;
            timestamp?: number;
        }) => {
            console.log("[Socket Client] Received task_updated event:", data);
            // Safety: skip if no data or if this event was initiated by this specific client tab
            if (!data) return;
            
            const { action, taskId, columnId } = data;

            // Handle real-time comment synchronization for all users
            if (action && (action.startsWith("comment_") || action === "comment_created" || action === "comment_deleted" || action === "comment_resolved" || action === "comment_reopened")) {
                if (setCommentUpdateTrigger) {
                    setCommentUpdateTrigger((prev) => prev + 1);
                }
                loadTasks();
                return;
            }

            const isSelfEcho = data.clientId 
                ? data.clientId === clientId 
                : (data.actingUserId && data.actingUserId === currentUserRef.current?.id);

            if (isSelfEcho) {
                console.debug(`[DragSync] Ignoring self-originated socket echo for task ${data.taskId}, action=${data.action}`);
                return;
            }

            // If the card being updated is currently being dragged by us, defer the event
            if (taskId && draggingCardIdRef.current === taskId) {
                console.debug(`[DragSync] Deferring socket event for actively-dragged card ${taskId}, action=${action}`);
                deferredSocketEventsRef.current.push({
                    action: action || "update",
                    taskId,
                    columnId,
                    actingUserId: data.actingUserId,
                    timestamp: data.timestamp,
                });
                return;
            }

            // Version guard: if we have a pending local move for this card, our version is newer
            if (taskId && moveVersionRef.current[taskId] !== undefined) {
                const hasPendingMove = !!pendingColumnUpdatesRef.current[taskId];
                if (hasPendingMove) {
                    console.debug(`[DragSync] Discarding socket event for task ${taskId} — local move version is newer (pending debounce)`);
                    return;
                }
            }

            // Granular update: for column moves caused by drag-drop where we have a
            // pending local version, just update columnId locally to avoid flicker.
            // For all other updates (title, description, priority, assignee, etc.)
            // from another user, do a full reload so every field stays in sync.
            if (action === "update" && taskId && columnId) {
                const hasPendingLocalMove = !!pendingColumnUpdatesRef.current[taskId];
                if (hasPendingLocalMove) {
                    // Our local drag is still in flight — apply the column update locally
                    setTasks((prev) => {
                        const taskExists = prev.some((t) => t.id === taskId);
                        if (taskExists) {
                            return prev.map((t) =>
                                t.id === taskId ? { ...t, columnId } : t
                            );
                        }
                        loadTasks();
                        return prev;
                    });
                    return;
                }
                // No pending local move — full reload to pick up title and any other changes
                loadTasks();
                return;
            }

            // For create/delete actions, we need the full task data — reload
            if (action === "create" || action === "delete") {
                loadTasks();
                return;
            }

            // Fallback: unknown action shape, reload to be safe
            loadTasks();
        });

        return () => {
            console.log(`[Socket Client] Disconnecting socket for team ${currentTeam.id}`);
            socket.emit("leave_team", currentTeam.id);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [currentTeam?.id, loadTasks, setTasks, addNotificationToast, setNotifications, pendingColumnUpdatesRef, moveVersionRef]);

    // Register user on socket reconnect/mount
    useEffect(() => {
        if (socketRef.current && currentUser?.id) {
            socketRef.current.emit("register_user", currentUser.id);
        }
    }, [currentUser?.id]);

    return {
        setDraggingCardId,
        socketRef,
    };
}
