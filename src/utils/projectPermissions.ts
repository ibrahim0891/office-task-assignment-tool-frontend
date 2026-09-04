export interface ProjectPermissions {
    isWorkspaceLeader: boolean;
    isProjectManager: boolean;
    isProjectLeader: boolean;
    isProjectMember: boolean;
    canManageProject: boolean;      // Rename project, configure settings, manage members
    canManageTasks: boolean;        // Create/edit main tasks, configure workflow stages/columns
    canCreateSubtask: boolean;      // Create subtasks in main task
    canManageInvitations: boolean;  // Send and manage project invitations
    userRoleLabel: string;          // "Manager" | "Leader" | "Member" | "Viewer"
    userRoleDescription: string;    // Human-readable permissions summary
}

/**
 * Centrally calculates consistent role-based permissions for a project across all views.
 */
export function getProjectPermissions(
    project: any,
    currentUser: any,
    userRole?: string,
    currentTeam?: any
): ProjectPermissions {
    if (!currentUser || !project) {
        return {
            isWorkspaceLeader: false,
            isProjectManager: false,
            isProjectLeader: false,
            isProjectMember: false,
            canManageProject: false,
            canManageTasks: false,
            canCreateSubtask: false,
            canManageInvitations: false,
            userRoleLabel: "Viewer",
            userRoleDescription: "View-only access to this project.",
        };
    }

    const currentProjectMember = (project.members || []).find(
        (m: any) => m.userId === currentUser.id || m.user?.id === currentUser.id
    );

    const memberRole = (currentProjectMember?.role || "").toUpperCase();
    const globalRole = (userRole || currentUser.role || "").toUpperCase();

    // Workspace Leader in the owning team or global Leader
    const isWorkspaceLeader =
        globalRole === "LEADER" &&
        (!project.teamId || !currentTeam?.id || currentTeam.id === project.teamId);

    // Project Manager: creator/manager assigned to project or manager role
    const isProjectManager =
        project.managerId === currentUser.id ||
        project.manager?.id === currentUser.id ||
        memberRole === "MANAGER";

    // Project Leader: Manager, Workspace Leader, or Leader member role
    const isProjectLeader =
        isProjectManager ||
        isWorkspaceLeader ||
        memberRole === "LEADER";

    // Project Member: any valid assigned member or leader
    const isProjectMember = Boolean(currentProjectMember) || isProjectLeader;

    let userRoleLabel = "Viewer";
    let userRoleDescription = "View-only access to this project.";

    if (isProjectManager) {
        userRoleLabel = "Manager";
        userRoleDescription = "Full project management, member management, and task creation rights.";
    } else if (isProjectLeader) {
        userRoleLabel = "Leader";
        userRoleDescription = "Full task management, workflow customization, and member invitation rights.";
    } else if (isProjectMember) {
        userRoleLabel = "Member";
        userRoleDescription = "Can collaborate on tasks and create/manage subtasks.";
    }

    return {
        isWorkspaceLeader,
        isProjectManager,
        isProjectLeader,
        isProjectMember,
        canManageProject: isProjectManager || isWorkspaceLeader,
        canManageTasks: isProjectLeader,
        canCreateSubtask: isProjectMember,
        canManageInvitations: isProjectLeader,
        userRoleLabel,
        userRoleDescription,
    };
}

/**
 * Checks if the current user has permission to modify/drag/delete a specific subtask.
 */
export function canModifySubtask(
    subtask: any,
    currentUser: any,
    canManageTasks: boolean
): boolean {
    if (!currentUser || !subtask) return false;
    if (canManageTasks) return true;
    return (
        subtask.assignedToId === currentUser.id ||
        subtask.assignedTo?.id === currentUser.id
    );
}
