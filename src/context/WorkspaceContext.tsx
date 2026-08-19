"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import {
    api,
    User,
    Team,
    Task,
    TaskColumn,
    Notification,
} from "../api";
import { APP_CONFIG } from "../config/appConfig";

const clientId = typeof window !== "undefined"
    ? Math.random().toString(36).substring(2) + Date.now().toString(36)
    : "";

interface WorkspaceContextType {
    users: User[];
    currentUser: User | null;
    isClient: boolean;
    isInitialized: boolean;
    teams: Team[];
    currentTeam: Team | null;
    setCurrentTeam: (team: Team) => void;
    teamMembers: { user: User; role: string }[];
    userRole: string;
    tasks: Task[];
    columns: TaskColumn[];
    notifications: Notification[];
    isNotificationsLoading: boolean;
    activeDateStr: string;
    setActiveDateStr: (date: string) => void;
    currentView: string;
    selectedTaskId: string | null;
    setSelectedTaskId: (id: string | null) => void;
    selectedMemberFilter: string;
    setSelectedMemberFilter: (memberId: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    // Modals
    isNotificationsOpen: boolean;
    setIsNotificationsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isConfigModalOpen: boolean;
    setIsConfigModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isAddTaskOpen: boolean;
    setIsAddTaskOpen: React.Dispatch<React.SetStateAction<boolean>>;
    addTaskColId: string;
    setAddTaskColId: (colId: string) => void;
    isCreateTeamModalOpen: boolean;
    setIsCreateTeamModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    profileModalUser: User | null;
    setProfileModalUser: (user: User | null) => void;
    openMemberProfile: (user: User) => void;

    // Handlers
    loadTasks: () => Promise<void>;
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    loadTeamMetadata: () => Promise<void>;
    loadNotifications: () => Promise<void>;
    handleUpdateTaskColumn: (taskId: string, targetColumnId: string) => Promise<void>;
    handleToggleComplete: (taskId: string, isCompleted: boolean) => Promise<void>;
    handleArchiveTask: (taskId: string) => Promise<void>;
    handleAddQuickTask: (title: string, columnId: string, assignedToId?: string) => Promise<void>;
    handleCreateTeam: (teamName: string, emoji?: string) => Promise<void>;
    handleUpdateTeam: (teamId: string, name: string, emoji?: string) => Promise<void>;
    handleDeleteTeam: (teamId: string, password: string, confirmationText: string) => Promise<void>;
    handleLeaveTeam: (teamId: string) => Promise<void>;
    handleLogout: () => void;
    handleMarkNotificationRead: (id: string) => Promise<void>;
    handleClearAllNotifications: () => Promise<void>;
    handleArchiveNotification: (id: string) => Promise<void>;
    handleLoginSuccess: (user: User, token: string) => void;
    setDraggingCardId: (cardId: string | null) => void;
    toasts: any[];
    removeToast: (id: string) => void;
    hasMoreNotifications: boolean;
    isLoadingMoreNotifications: boolean;
    loadMoreNotifications: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const useWorkspace = () => {
    const ctx = useContext(WorkspaceContext);
    if (!ctx) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return ctx;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const pathname = usePathname();
    const router = useRouter();

    const getViewFromPath = (path: string) => {
        if (path.includes("/dashboard")) return "dashboard";
        if (path.includes("/list")) return "list";
        if (path.includes("/calendar")) return "calendar";
        if (path.includes("/myday")) return "myday";
        if (path.includes("/reports")) return "reports";
        if (path.includes("/trash")) return "trash";
        if (path.includes("/profile")) return "profile";
        if (path.includes("/map")) return "map";
        return "kanban";
    };

    const currentView = getViewFromPath(pathname || "/");

    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const [teams, setTeams] = useState<Team[]>([]);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [teamMembers, setTeamMembers] = useState<{ user: User; role: string }[]>([]);

    const handleSetCurrentTeam = (team: Team) => {
        setCurrentTeam(team);
    };

    useEffect(() => {
        if (typeof window !== "undefined" && currentTeam?.id) {
            localStorage.setItem("selected_team_id", currentTeam.id);
        }
    }, [currentTeam?.id]);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [columns, setColumns] = useState<TaskColumn[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const [activeDateStr, setActiveDateStr] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [addTaskColId, setAddTaskColId] = useState<string>("");
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [profileModalUser, setProfileModalUser] = useState<User | null>(null);

    const openMemberProfile = (user: User) => {
        setProfileModalUser(user);
    };

    const activeMembership = teamMembers.find((tm) => tm.user.id === currentUser?.id);
    const userRole = activeMembership ? activeMembership.role : "MEMBER";

    useEffect(() => {
        setIsClient(true);
        let userObj: User | null = null;
        const cachedUser = localStorage.getItem("sessionUser") || localStorage.getItem("task_user");
        const cachedToken = localStorage.getItem("sessionToken");

        if (cachedUser && cachedToken) {
            try {
                userObj = JSON.parse(cachedUser);
                setCurrentUser(userObj);
            } catch (e) {}
        } else {
            setCurrentUser(null);
            if (pathname !== "/login" && pathname !== "/") {
                router.push("/login");
            }
        }

        async function init() {
            if (!userObj || !cachedToken) {
                setIsInitialized(true);
                return;
            }

            try {
                const u = await api.getUsers();
                if (Array.isArray(u)) {
                    setUsers(u);
                }
                const t = await api.getTeams(userObj.id);
                if (Array.isArray(t)) {
                    setTeams(t);
                    const savedTeamId = localStorage.getItem("selected_team_id");
                    const matched = t.find((team) => team.id === savedTeamId);
                    if (matched) {
                        setCurrentTeam(matched);
                    } else if (t.length > 0) {
                        setCurrentTeam(t[0]);
                        localStorage.setItem("selected_team_id", t[0].id);
                    }
                }
            } catch (err: any) {
                console.error("Error bootstrapping application:", err);
            } finally {
                setIsInitialized(true);
            }
        }
        init();
    }, [pathname, router]);



    const loadTeamMetadata = async () => {
        if (!currentTeam) return;
        try {
            const allTeams = await api.getTeams(currentUser?.id);
            if (Array.isArray(allTeams)) {
                const match = allTeams.find((t) => t.id === currentTeam.id);
                if (match && match.members && Array.isArray(match.members)) {
                    setTeamMembers(match.members);
                }
            }

            const cols = await api.getColumns(currentTeam.id);
            if (Array.isArray(cols)) {
                setColumns(cols);
            }
        } catch (err) {
            console.error("Error loading team metadata:", err);
        }
    };

    useEffect(() => {
        loadTeamMetadata();
    }, [currentTeam?.id]);

    const latestTasksRequestIdRef = React.useRef(0);

    const loadTasks = React.useCallback(async () => {
        if (!currentTeam) return;
        const requestId = ++latestTasksRequestIdRef.current;
        try {
            const params: any = { teamId: currentTeam.id };
            if (
                currentView === "kanban" ||
                currentView === "myday" ||
                currentView === "dashboard" ||
                currentView === "map"
            ) {
                params.date = activeDateStr;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }

            const data = await api.getTasks(params, currentUser?.id);
            if (requestId !== latestTasksRequestIdRef.current) {
                return;
            }

            if (Array.isArray(data)) {
                setTasks(data);
            } else {
                console.error("loadTasks received non-array data:", data);
                setTasks([]);
            }
        } catch (err) {
            if (requestId === latestTasksRequestIdRef.current) {
                console.error("Error loading tasks:", err);
            }
        }
    }, [currentTeam?.id, activeDateStr, currentView, searchQuery, currentUser]);

    const pendingColumnUpdatesRef = React.useRef<Record<string, { timeoutId: NodeJS.Timeout; previousTasks: any[]; targetColumnId: string }>>({});
    const moveVersionRef = useRef<Record<string, number>>({});
    const draggingCardIdRef = useRef<string | null>(null);
    const deferredSocketEventsRef = useRef<Array<{ action: string; taskId: string; columnId?: string; actingUserId?: string; timestamp?: number }>>([]);
    const socketRef = useRef<any | null>(null);

    const setDraggingCardId = React.useCallback((cardId: string | null) => {
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
                            break;
                        }
                    }
                }
            }
        }
    }, [loadTasks]);

    useEffect(() => {
        return () => {
            Object.values(pendingColumnUpdatesRef.current).forEach((pending) => {
                clearTimeout(pending.timeoutId);
            });
            pendingColumnUpdatesRef.current = {};
        };
    }, []);



    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const selectedTaskIdRef = useRef<string | null>(null);
    selectedTaskIdRef.current = selectedTaskId;

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
            if (currentUser?.id) {
                console.log(`[Socket Client] Emitting register_user for user ${currentUser.id}`);
                socket.emit("register_user", currentUser.id);
            }
            console.log(`[Socket Client] Emitting join_team for team ${currentTeam.id}`);
            socket.emit("join_team", currentTeam.id);
        });

        socket.on("new_notification", (notification: any) => {
            console.log("[Socket Client] Received new_notification:", notification);
            
            // Avoid showing toast banners/chimes if the details modal for this specific task is already open
            const isTaskModalOpenForThisTask = selectedTaskIdRef.current && notification.taskId === selectedTaskIdRef.current;
            if (!isTaskModalOpenForThisTask) {
                addNotificationToastRef.current?.(notification);
            }

            setNotifications((prev) => {
                if (prev.some((n) => n.id === notification.id)) return prev;
                return [notification, ...prev];
            });
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
            
            const isSelfEcho = data.clientId 
                ? data.clientId === clientId 
                : (data.actingUserId && data.actingUserId === currentUser?.id);

            if (isSelfEcho) {
                console.debug(`[DragSync] Ignoring self-originated socket echo for task ${data.taskId}, action=${data.action}`);
                return;
            }

            const { action, taskId, columnId } = data;

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

            // For comment actions, just reload to refresh comment list on the task
            if (action === "comment_created" || action === "comment_deleted" || action === "comment_resolved" || action === "comment_reopened") {
                loadTasks();
                return;
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
    }, [currentTeam?.id, loadTasks, currentUser?.id]);



    const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
    const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
    const [notificationsPage, setNotificationsPage] = useState(1);
    const [isLoadingMoreNotifications, setIsLoadingMoreNotifications] = useState(false);
    const [toasts, setToasts] = useState<any[]>([]);

    const playNotificationChime = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            
            // First chime note (D5)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = "sine";
            osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
            gain1.gain.setValueAtTime(0.15, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start();
            osc1.stop(ctx.currentTime + 0.15);

            // Second chime note (A5 - perfect fifth higher, slightly delayed)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1);
            gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime + 0.1);
            osc2.stop(ctx.currentTime + 0.25);
        } catch (e) {
            console.error("Failed to play notification chime:", e);
        }
    };

    const addNotificationToast = (notification: any) => {
        const id = Math.random().toString();
        setToasts((prev) => [...prev, { id, notification }]);
        playNotificationChime();
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const addNotificationToastRef = useRef<((n: any) => void) | undefined>(undefined);
    addNotificationToastRef.current = addNotificationToast;

    const loadNotifications = async () => {
        if (!currentUser) return;
        setIsNotificationsLoading(true);
        try {
            const data = await api.getNotifications(currentUser.id, 1, 10);
            setNotifications(data);
            setNotificationsPage(1);
            setHasMoreNotifications(data.length === 10);
        } catch (err) {
            console.error("Error loading notifications:", err);
        } finally {
            setIsNotificationsLoading(false);
        }
    };

    const loadMoreNotifications = async () => {
        if (!currentUser || isLoadingMoreNotifications || !hasMoreNotifications) return;
        setIsLoadingMoreNotifications(true);
        const nextPage = notificationsPage + 1;
        try {
            const data = await api.getNotifications(currentUser.id, nextPage, 10);
            if (data.length > 0) {
                setNotifications((prev) => {
                    const existingIds = new Set(prev.map((n) => n.id));
                    const newItems = data.filter((n) => !existingIds.has(n.id));
                    return [...prev, ...newItems];
                });
                setNotificationsPage(nextPage);
            }
            setHasMoreNotifications(data.length === 10);
        } catch (err) {
            console.error("Error loading more notifications:", err);
        } finally {
            setIsLoadingMoreNotifications(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, [currentUser?.id]);

    const handleMarkNotificationRead = async (id: string) => {
        try {
            await api.markNotificationRead(id);
            loadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearAllNotifications = async () => {
        if (!currentUser) return;
        try {
            await api.clearAllNotifications(currentUser.id);
            toast.success("All notifications moved to 30-day Archive.");
            loadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleArchiveNotification = async (id: string) => {
        try {
            await api.archiveNotification(id);
            toast.success("Notification archived.");
            loadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateTaskColumn = async (taskId: string, targetColumnId: string) => {
        if (!currentTeam || !currentUser) return;

        // Increment move version for this card
        const currentVersion = (moveVersionRef.current[taskId] || 0) + 1;
        moveVersionRef.current[taskId] = currentVersion;

        // Immediately update local state optimistically
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, columnId: targetColumnId } : t))
        );

        let previousTasks = tasks;
        const pending = pendingColumnUpdatesRef.current[taskId];

        if (pending) {
            clearTimeout(pending.timeoutId);
            previousTasks = pending.previousTasks; // Keep original state from before the first move
            console.debug(`[DragSync] Debounce reset for card ${taskId}, version ${currentVersion} (superseding previous)`);
        }

        const timeoutId = setTimeout(async () => {
            delete pendingColumnUpdatesRef.current[taskId];
            try {
                const updatedTask = await api.updateTask(
                    taskId,
                    { columnId: targetColumnId, clientId },
                    { userId: currentUser.id, teamId: currentTeam.id }
                );

                // Version guard: only apply server response if no newer move happened
                if (moveVersionRef.current[taskId] === currentVersion) {
                    setTasks((prev) =>
                        prev.map((t) => (t.id === taskId ? updatedTask : t))
                    );
                    // Clean up version tracking — no pending moves for this card
                    delete moveVersionRef.current[taskId];
                    console.debug(`[DragSync] API response applied for card ${taskId}, version ${currentVersion}`);
                } else {
                    console.debug(
                        `[DragSync] Discarding stale API response for card ${taskId}: ` +
                        `response version=${currentVersion}, current version=${moveVersionRef.current[taskId]}`
                    );
                }
            } catch (err: any) {
                // Only revert if this is still the latest version (no newer drag superseded it)
                if (moveVersionRef.current[taskId] === currentVersion) {
                    setTasks(previousTasks);
                    toast.error(err.message || "Failed to move task");
                    delete moveVersionRef.current[taskId];
                } else {
                    console.debug(`[DragSync] Suppressing error toast for stale move of card ${taskId} (superseded by newer drag)`);
                }
            }
        }, 400); // 400ms debounce — slightly reduced for snappier feel

        pendingColumnUpdatesRef.current[taskId] = {
            timeoutId,
            previousTasks,
            targetColumnId
        };
    };


    const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
        if (!currentTeam || !currentUser) return;
        const taskToToggle = tasks.find((t) => t.id === taskId);
        const isObserver = userRole === "OBSERVER";
        if (!taskToToggle || isObserver) {
            toast.error("Observers cannot update task status.");
            return;
        }

        const isLeader = userRole === "LEADER";
        const isCreator = taskToToggle.createdById === currentUser.id;
        const isAssignee = taskToToggle.assignedToId === currentUser.id;
        if (!isLeader && !isCreator && !isAssignee) {
            toast.error("Only the workspace leader, task creator, or assignee can update status.");
            return;
        }



        try {
            const completeCol =
                columns.find((c) => c.isComplete) || columns[columns.length - 1];
            const incompleteCol =
                columns.find((c) => !c.isComplete) || columns[0];
            const targetColumnId = isCompleted ? completeCol.id : incompleteCol.id;

            await api.updateTask(
                taskId,
                { columnId: targetColumnId, clientId },
                { userId: currentUser.id, teamId: currentTeam.id }
            );
            loadTasks();
            toast.success("Task status updated");
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleArchiveTask = async (taskId: string) => {
        if (!currentTeam || !currentUser) return;
        const taskToArchive = tasks.find((t) => t.id === taskId);
        if (!taskToArchive) return;

        const isLeader = userRole === "LEADER";
        const isCreator = taskToArchive.createdById === currentUser.id;

        if (!isLeader && !isCreator) {
            toast.error("Only the workspace leader or task creator can delete/archive this task.");
            return;
        }

        try {
            await api.deleteTask(taskId, currentUser.id);
            toast.success(`"${taskToArchive.title}" moved to trash`);
            loadTasks();
        } catch (err: any) {
            toast.error(err.message || "Failed to archive task.");
        }
    };

    const handleAddQuickTask = async (title: string, columnId: string, assignedToId?: string) => {
        if (!currentTeam || !currentUser) return;

        if (title.trim().length > APP_CONFIG.MAX_TASK_TITLE_LENGTH) {
            toast.error(`Task title must not exceed ${APP_CONFIG.MAX_TASK_TITLE_LENGTH} characters.`);
            return;
        }

        const tempId = `temp-${Date.now()}`;
        const targetAssigneeId = assignedToId || currentUser.id;
        const optimisticTask = {
            id: tempId,
            title,
            description: "",
            columnId,
            priority: "MEDIUM",
            status: "TODO",
            teamId: currentTeam.id,
            createdById: currentUser.id,
            assignedToId: targetAssigneeId,
            isArchived: false,
            isSoftDeleted: false,
            carryCount: 0,
            dueDate: activeDateStr || new Date().toISOString().split("T")[0],
            createdBy: currentUser,
            assignedTo: users.find((u) => u.id === targetAssigneeId) || currentUser,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const previousTasks = tasks;
        setTasks((prev) => [...prev, optimisticTask as any]);

        try {
            const createdTask = await api.createTask({
                title,
                columnId,
                teamId: currentTeam.id,
                createdById: currentUser.id,
                assignedToId: targetAssigneeId,
                dueDate: optimisticTask.dueDate,
                clientId,
            });
            setTasks((prev) =>
                prev.map((t) => (t.id === tempId ? createdTask : t))
            );
            toast.success("Task created");
        } catch (err: any) {
            setTasks(previousTasks);
            toast.error(err.message || "Failed to create task");
        }
    };

    const handleCreateTeam = async (teamName: string, emoji?: string) => {
        if (!currentUser) return;
        try {
            const newTeam = await api.createTeam(teamName, currentUser.id, emoji);
            toast.success(`Workspace "${newTeam.name}" created!`);
            const updatedTeams = await api.getTeams(currentUser.id);
            setTeams(updatedTeams);
            setCurrentTeam(newTeam);
            setIsCreateTeamModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to create workspace");
        }
    };

    const handleUpdateTeam = async (teamId: string, name: string, emoji?: string) => {
        if (!currentUser) return;
        try {
            const updatedTeam = await api.updateTeam(teamId, name, currentUser.id, emoji);
            toast.success(`Workspace updated successfully`);
            const updatedTeams = await api.getTeams(currentUser.id);
            setTeams(updatedTeams);
            if (currentTeam?.id === teamId) {
                setCurrentTeam(updatedTeam);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update workspace");
            throw err;
        }
    };

    const handleDeleteTeam = async (teamId: string, password: string, confirmationText: string) => {
        if (!currentUser) return;
        try {
            await api.deleteTeam(teamId, password, confirmationText, currentUser.id);
            toast.success("Workspace deleted successfully");
            const updatedTeams = await api.getTeams(currentUser.id);
            setTeams(updatedTeams);
            
            if (currentTeam?.id === teamId) {
                if (updatedTeams.length > 0) {
                    setCurrentTeam(updatedTeams[0]);
                } else {
                    const defaultTeam = await api.createTeam(
                        `${currentUser.name.split(" ")[0]}'s Personal Space`,
                        currentUser.id
                    );
                    const finalTeams = await api.getTeams(currentUser.id);
                    setTeams(finalTeams);
                    setCurrentTeam(defaultTeam);
                }
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to delete workspace");
            throw err;
        }
    };

    const handleLeaveTeam = async (teamId: string) => {
        if (!currentUser) return;
        try {
            await api.removeTeamMember(teamId, currentUser.id, currentUser.id);
            toast.success("Left workspace successfully");
            const updatedTeams = await api.getTeams(currentUser.id);
            setTeams(updatedTeams);
            
            if (currentTeam?.id === teamId) {
                if (updatedTeams.length > 0) {
                    setCurrentTeam(updatedTeams[0]);
                    localStorage.setItem("selected_team_id", updatedTeams[0].id);
                } else {
                    const defaultTeam = await api.createTeam(
                        `${currentUser.name.split(" ")[0]}'s Personal Space`,
                        currentUser.id
                    );
                    const finalTeams = await api.getTeams(currentUser.id);
                    setTeams(finalTeams);
                    setCurrentTeam(defaultTeam);
                    localStorage.setItem("selected_team_id", defaultTeam.id);
                }
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to leave workspace");
            throw err;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("sessionUser");
        localStorage.removeItem("task_user");
        localStorage.removeItem("selected_team_id");
        setCurrentUser(null);
        setTeams([]);
        setCurrentTeam(null);
        setIsInitialized(true);
        router.push("/login");
    };

    const handleLoginSuccess = async (user: User, token: string) => {
        localStorage.setItem("sessionToken", token);
        localStorage.setItem("sessionUser", JSON.stringify(user));
        localStorage.setItem("task_user", JSON.stringify(user));
        setCurrentUser(user);
        setIsInitialized(false);
        try {
            const t = await api.getTeams(user.id);
            setTeams(t);
            const savedTeamId = localStorage.getItem("selected_team_id");
            const matched = t.find((team) => team.id === savedTeamId);
            if (matched) {
                setCurrentTeam(matched);
            } else if (t.length > 0) {
                setCurrentTeam(t[0]);
                localStorage.setItem("selected_team_id", t[0].id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsInitialized(true);
        }
    };

    return (
        <WorkspaceContext.Provider
            value={{
                users,
                currentUser,
                isClient,
                isInitialized,
                teams,
                currentTeam,
                setCurrentTeam: handleSetCurrentTeam,
                teamMembers,
                userRole,
                tasks,
                columns,
                notifications,
                isNotificationsLoading,
                activeDateStr,
                setActiveDateStr,
                currentView,
                selectedTaskId,
                setSelectedTaskId,
                selectedMemberFilter,
                setSelectedMemberFilter,
                searchQuery,
                setSearchQuery,
                isNotificationsOpen,
                setIsNotificationsOpen,
                isConfigModalOpen,
                setIsConfigModalOpen,
                isAddTaskOpen,
                setIsAddTaskOpen,
                addTaskColId,
                setAddTaskColId,
                isCreateTeamModalOpen,
                setIsCreateTeamModalOpen,
                profileModalUser,
                setProfileModalUser,
                openMemberProfile,
                loadTasks,
                setTasks,
                loadTeamMetadata,
                loadNotifications,
                handleUpdateTaskColumn,
                handleToggleComplete,
                handleArchiveTask,
                handleAddQuickTask,
                handleCreateTeam,
                handleUpdateTeam,
                handleDeleteTeam,
                handleLeaveTeam,
                handleLogout,
                handleMarkNotificationRead,
                handleClearAllNotifications,
                handleArchiveNotification,
                handleLoginSuccess,
                setDraggingCardId,
                toasts,
                removeToast,
                hasMoreNotifications,
                isLoadingMoreNotifications,
                loadMoreNotifications,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
};
