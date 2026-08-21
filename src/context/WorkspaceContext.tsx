"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
    api,
    User,
    Team,
    Task,
    TaskColumn,
    Notification,
} from "../api";
import { APP_CONFIG } from "../config/appConfig";
import { getLocalDateString } from "../utils/date";
import { useWorkspaceNotifications } from "../hooks/useWorkspaceNotifications";
import { useWorkspaceSockets } from "../hooks/useWorkspaceSockets";

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
    isSwitchingTeam: boolean;
    switchingToTeam: Team | null;
    setCurrentTeam: (team: Team) => void;
    teamMembers: { user: User; role: string }[];
    userRole: string;
    tasks: Task[];
    isTasksLoading: boolean;
    columns: TaskColumn[];
    notifications: Notification[];
    isNotificationsLoading: boolean;
    activeDateStr: string;
    setActiveDateStr: (date: string) => void;
    currentView: string;
    selectedTaskId: string | null;
    setSelectedTaskId: (id: string | null) => void;
    directTask: any | null;
    setDirectTask: React.Dispatch<React.SetStateAction<any>>;
    taskModalTab: "details" | "comments" | "attachments";
    setTaskModalTab: React.Dispatch<React.SetStateAction<"details" | "comments" | "attachments">>;
    selectedMemberFilter: string;
    setSelectedMemberFilter: (memberId: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    commentUpdateTrigger: number;

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
    loadTasks: (opts?: { isDateChange?: boolean }) => Promise<void>;
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
    handleDeleteArchivedNotifications: () => Promise<void>;
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
    const [isSwitchingTeam, setIsSwitchingTeam] = useState(false);
    const [switchingToTeam, setSwitchingToTeam] = useState<Team | null>(null);
    const [teamMembers, setTeamMembers] = useState<{ user: User; role: string }[]>([]);

    const handleSetCurrentTeam = (team: Team) => {
        if (currentTeam?.id === team.id) return;
        setIsSwitchingTeam(true);
        setSwitchingToTeam(team);
        // Delay updating currentTeam for 800ms to allow the 3D cube to rotate to the loader face first
        setTimeout(() => {
            setCurrentTeam(team);
        }, 800);
    };

    useEffect(() => {
        if (typeof window !== "undefined" && currentTeam?.id) {
            localStorage.setItem("selected_team_id", currentTeam.id);
        }
    }, [currentTeam?.id]);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isTasksLoading, setIsTasksLoading] = useState<boolean>(false);
    const [columns, setColumns] = useState<TaskColumn[]>([]);


    const [activeDateStr, setActiveDateStr] = useState<string>(
        getLocalDateString()
    );
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [directTask, setDirectTask] = useState<any>(null);
    const [taskModalTab, setTaskModalTab] = useState<"details" | "comments" | "attachments">("details");
    const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [commentUpdateTrigger, setCommentUpdateTrigger] = useState<number>(0);

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
                setTimeout(() => {
                    setIsInitialized(true);
                }, 1000);
                return;
            }

            try {
                const [u, t] = await Promise.all([
                    api.getUsers().catch(() => []),
                    api.getTeams(userObj.id).catch(() => [])
                ]);

                if (Array.isArray(u)) {
                    setUsers(u);
                }
                if (Array.isArray(t) && t.length > 0) {
                    setTeams(t);
                    const savedTeamId = localStorage.getItem("selected_team_id");
                    const matched = t.find((team) => team.id === savedTeamId) || t[0];
                    if (matched) {
                        setCurrentTeam(matched);
                        localStorage.setItem("selected_team_id", matched.id);
                        if (matched.members) {
                            setTeamMembers(matched.members);
                        }

                        // Load initial columns and tasks for the active workspace before finishing initialization
                        const [cols, initialTasks] = await Promise.all([
                            api.getColumns(matched.id).catch(() => []),
                            api.getTasks(
                                {
                                    teamId: matched.id,
                                    date: activeDateStr || getLocalDateString(),
                                },
                                userObj.id,
                            ).catch(() => [])
                        ]);

                        if (Array.isArray(cols)) setColumns(cols);
                        if (Array.isArray(initialTasks)) setTasks(initialTasks);
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
        if (!currentTeam?.id) return;

        const loadSwitchData = async () => {
            try {
                await Promise.all([
                    loadTeamMetadata(),
                    loadTasks()
                ]);
            } catch (err) {
                console.error("Error loading team data:", err);
            } finally {
                // A small delay for a smooth transition
                setTimeout(() => {
                    setIsSwitchingTeam(false);
                    setSwitchingToTeam(null);
                }, 400);
            }
        };

        loadSwitchData();
    }, [currentTeam?.id]);

    const latestTasksRequestIdRef = React.useRef(0);

    const loadTasks = React.useCallback(async (opts?: { isDateChange?: boolean }) => {
        if (!currentTeam) return;
        const requestId = ++latestTasksRequestIdRef.current;
        if (opts?.isDateChange && !isSwitchingTeamRef.current) {
            setIsTasksLoading(true);
        }
        try {
            const params: any = { teamId: currentTeam.id };
            if (
                currentView === "kanban" ||
                currentView === "list" ||
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
        } finally {
            if (requestId === latestTasksRequestIdRef.current) {
                setIsTasksLoading(false);
            }
        }
    }, [currentTeam?.id, activeDateStr, currentView, searchQuery, currentUser]);

    const pendingColumnUpdatesRef = React.useRef<Record<string, { timeoutId: NodeJS.Timeout; previousTasks: any[]; targetColumnId: string }>>({});
    const moveVersionRef = useRef<Record<string, number>>({});
    const {
        notifications,
        setNotifications,
        isNotificationsLoading,
        hasMoreNotifications,
        isLoadingMoreNotifications,
        toasts,
        removeToast,
        addNotificationToast,
        loadNotifications,
        loadMoreNotifications,
        handleMarkNotificationRead,
        handleClearAllNotifications,
        handleArchiveNotification,
        handleDeleteArchivedNotifications,
    } = useWorkspaceNotifications(currentUser, currentTeam);

    const {
        setDraggingCardId,
        socketRef,
    } = useWorkspaceSockets(
        currentTeam,
        currentUser,
        setTasks,
        loadTasks,
        selectedTaskId,
        addNotificationToast,
        setNotifications,
        pendingColumnUpdatesRef,
        moveVersionRef,
    );

    useEffect(() => {
        return () => {
            Object.values(pendingColumnUpdatesRef.current).forEach((pending) => {
                clearTimeout(pending.timeoutId);
            });
            pendingColumnUpdatesRef.current = {};
        };
    }, []);



    const isSwitchingTeamRef = useRef(false);
    isSwitchingTeamRef.current = isSwitchingTeam;

    const prevDateRef = useRef<string>(activeDateStr);

    useEffect(() => {
        if (isSwitchingTeamRef.current) return;
        const isDateChange = prevDateRef.current !== activeDateStr;
        prevDateRef.current = activeDateStr;
        loadTasks({ isDateChange });
    }, [loadTasks, activeDateStr]);

    // Parse URL search parameters on load/redirect to automatically open task modal (e.g., from desktop notifications)
    useEffect(() => {
        if (typeof window !== "undefined" && tasks.length > 0) {
            const searchParams = new URLSearchParams(window.location.search);
            const taskIdFromUrl = searchParams.get("task");
            if (taskIdFromUrl && taskIdFromUrl !== selectedTaskId) {
                setSelectedTaskId(taskIdFromUrl);
                // Clean up the URL search parameter without reloading the page
                const cleanSearch = window.location.search
                    .replace(/[\?&]task=[^&]+/, "")
                    .replace(/^&/, "?");
                const newUrl = window.location.pathname + cleanSearch;
                window.history.replaceState({}, "", newUrl);
            }
        }
    }, [selectedTaskId, tasks]);

    const selectedTaskIdRef = useRef<string | null>(null);
    selectedTaskIdRef.current = selectedTaskId;

    // Fetch full task details (comments, attachments, etc.) when a task is opened
    useEffect(() => {
        if (selectedTaskId) {
            // Avoid duplicate fetch if directTask is already loaded for this task
            if (directTask?.id === selectedTaskId) return;

            const fetchTaskDetails = async () => {
                try {
                    const fullTask = await api.getTask(selectedTaskId, currentTeam?.id);
                    setDirectTask(fullTask);
                } catch (err) {
                    console.error("Failed to fetch full task details:", err);
                }
            };
            fetchTaskDetails();
        } else {
            setDirectTask(null);
        }
    }, [selectedTaskId, currentTeam?.id, directTask?.id]);

    // Sockets and Notifications logic extracted to hooks

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
        const targetDate = activeDateStr || getLocalDateString();
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
            date: targetDate,
            originalDate: targetDate,
            dueDate: targetDate,
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
                date: targetDate,
                dueDate: targetDate,
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
        // Hard redirect to landing page to clear state and show reveal animation on landing page
        window.location.href = "/";
    };

    const handleLoginSuccess = async (user: User, token: string) => {
        localStorage.setItem("sessionToken", token);
        localStorage.setItem("sessionUser", JSON.stringify(user));
        localStorage.setItem("task_user", JSON.stringify(user));
        // Hard redirect to /task-board to trigger the initial loading overlay reveal animation
        window.location.href = "/task-board";
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
                isSwitchingTeam,
                switchingToTeam,
                setCurrentTeam: handleSetCurrentTeam,
                teamMembers,
                userRole,
                tasks,
                isTasksLoading,
                columns,
                notifications,
                isNotificationsLoading,
                activeDateStr,
                setActiveDateStr,
                currentView,
                selectedTaskId,
                setSelectedTaskId,
                directTask,
                setDirectTask,
                taskModalTab,
                setTaskModalTab,
                selectedMemberFilter,
                setSelectedMemberFilter,
                searchQuery,
                setSearchQuery,
                commentUpdateTrigger,
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
                handleDeleteArchivedNotifications,
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
