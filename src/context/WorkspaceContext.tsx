"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
    loadTeamMetadata: () => Promise<void>;
    loadNotifications: () => Promise<void>;
    handleUpdateTaskColumn: (taskId: string, targetColumnId: string) => Promise<void>;
    handleToggleComplete: (taskId: string, isCompleted: boolean) => Promise<void>;
    handleAddQuickTask: (title: string, columnId: string, assignedToId?: string) => Promise<void>;
    handleCreateTeam: (teamName: string) => Promise<void>;
    handleUpdateTeam: (teamId: string, name: string) => Promise<void>;
    handleDeleteTeam: (teamId: string, password: string, confirmationText: string) => Promise<void>;
    handleLogout: () => void;
    handleMarkNotificationRead: (id: string) => Promise<void>;
    handleClearAllNotifications: () => Promise<void>;
    handleArchiveNotification: (id: string) => Promise<void>;
    handleLoginSuccess: (user: User) => void;
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
        if (typeof window !== "undefined" && team?.id) {
            localStorage.setItem("selected_team_id", team.id);
        }
    };

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
        if (cachedUser) {
            try {
                userObj = JSON.parse(cachedUser);
                setCurrentUser(userObj);
            } catch (e) {}
        }

        async function init() {
            try {
                const u = await api.getUsers();
                setUsers(u);
                const t = await api.getTeams(userObj?.id);
                setTeams(t);
                const savedTeamId = localStorage.getItem("selected_team_id");
                const matched = t.find((team) => team.id === savedTeamId);
                if (matched) {
                    setCurrentTeam(matched);
                } else if (t.length > 0) {
                    setCurrentTeam(t[0]);
                    localStorage.setItem("selected_team_id", t[0].id);
                }
            } catch (err: any) {
                console.error("Error bootstrapping application:", err);
            } finally {
                setIsInitialized(true);
            }
        }
        init();
    }, []);

    const loadTeamMetadata = async () => {
        if (!currentTeam) return;
        try {
            const allTeams = await api.getTeams(currentUser?.id);
            const match = allTeams.find((t) => t.id === currentTeam.id);
            if (match && match.members) {
                setTeamMembers(match.members);
            }

            const cols = await api.getColumns(currentTeam.id);
            setColumns(cols);
        } catch (err) {
            console.error("Error loading team metadata:", err);
        }
    };

    useEffect(() => {
        loadTeamMetadata();
    }, [currentTeam?.id]);

    const loadTasks = async () => {
        if (!currentTeam) return;
        try {
            const params: any = { teamId: currentTeam.id };
            if (
                currentView === "kanban" ||
                currentView === "myday" ||
                currentView === "dashboard"
            ) {
                params.date = activeDateStr;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }
            const data = await api.getTasks(params);
            setTasks(data);
        } catch (err) {
            console.error("Error loading tasks:", err);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [currentTeam?.id, activeDateStr, currentView, searchQuery]);

    const loadNotifications = async () => {
        if (!currentUser) return;
        try {
            const data = await api.getNotifications(currentUser.id);
            setNotifications(data);
        } catch (err) {
            console.error("Error loading notifications:", err);
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
        const previousTasks = tasks;
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, columnId: targetColumnId } : t))
        );

        try {
            await api.updateTask(
                taskId,
                { columnId: targetColumnId },
                { userId: currentUser.id, teamId: currentTeam.id }
            );
            loadTasks();
        } catch (err: any) {
            setTasks(previousTasks);
            toast.error(err.message || "Failed to move task");
        }
    };

    const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
        if (!currentTeam || !currentUser) return;
        const taskToToggle = tasks.find((t) => t.id === taskId);
        const isObserver = userRole === "OBSERVER";
        if (!taskToToggle || isObserver) {
            toast.error("Observers cannot update task status.");
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
                { columnId: targetColumnId },
                { userId: currentUser.id, teamId: currentTeam.id }
            );
            loadTasks();
            toast.success("Task status updated");
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleAddQuickTask = async (title: string, columnId: string, assignedToId?: string) => {
        if (!currentTeam || !currentUser) return;
        try {
            await api.createTask({
                title,
                columnId,
                teamId: currentTeam.id,
                createdById: currentUser.id,
                assignedToId: assignedToId || currentUser.id,
            });
            toast.success("Task created");
            loadTasks();
        } catch (err: any) {
            toast.error(err.message || "Failed to create task");
        }
    };

    const handleCreateTeam = async (teamName: string) => {
        if (!currentUser) return;
        try {
            const newTeam = await api.createTeam(teamName, currentUser.id);
            toast.success(`Workspace "${newTeam.name}" created!`);
            const updatedTeams = await api.getTeams(currentUser.id);
            setTeams(updatedTeams);
            setCurrentTeam(newTeam);
            setIsCreateTeamModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to create workspace");
        }
    };

    const handleUpdateTeam = async (teamId: string, name: string) => {
        if (!currentUser) return;
        try {
            const updatedTeam = await api.updateTeam(teamId, name, currentUser.id);
            toast.success(`Workspace renamed to "${updatedTeam.name}"`);
            const updatedTeams = await api.getTeams(currentUser.id);
            setTeams(updatedTeams);
            if (currentTeam?.id === teamId) {
                setCurrentTeam(updatedTeam);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update workspace name");
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

    const handleLogout = () => {
        localStorage.removeItem("sessionUser");
        localStorage.removeItem("task_user");
        localStorage.removeItem("selected_team_id");
        setCurrentUser(null);
        setTeams([]);
        setCurrentTeam(null);
        setIsInitialized(true);
        router.push("/");
    };

    const handleLoginSuccess = async (user: User) => {
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
                loadTeamMetadata,
                loadNotifications,
                handleUpdateTaskColumn,
                handleToggleComplete,
                handleAddQuickTask,
                handleCreateTeam,
                handleUpdateTeam,
                handleDeleteTeam,
                handleLogout,
                handleMarkNotificationRead,
                handleClearAllNotifications,
                handleArchiveNotification,
                handleLoginSuccess,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
};
