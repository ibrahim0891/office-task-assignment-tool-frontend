"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserMinus, UserPlus, Loader2, Users, Globe, Mail, LogOut, X } from "lucide-react";
import toast from "react-hot-toast";
import { api, User } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import { CustomSelect } from "../ui/CustomSelect";
import UserPickerSelect from "../ui/UserPickerSelect";
import { UserAvatar } from "../ui/UserAvatar";

function AvatarChip({ name, avatarUrl, size = "sm" }: { name: string; avatarUrl?: string | null; size?: "sm" | "md" }) {
    return (
        <UserAvatar
            name={name}
            avatarUrl={avatarUrl}
            size={size === "sm" ? "sm" : "md"}
            title={name}
        />
    );
}

function getRoleBadge(role: string) {
    const normalized = (role || "").toUpperCase();
    switch (normalized) {
        case "MANAGER":
            return { cls: "text-[#7C3AED] border-[#7C3AED]/20 bg-[#7C3AED]/10", label: "Manager" };
        case "LEADER":
            return { cls: "text-[var(--color-error)] border-[var(--color-error)]/20 bg-[var(--color-error)]/10", label: "Leader" };
        case "MEMBER":
            return { cls: "text-[var(--color-success)] border-[var(--color-success)]/20 bg-[var(--color-success)]/10", label: "Member" };
        case "VIEWER":
            return { cls: "text-[var(--app-muted)] border-[var(--app-border)] bg-[var(--app-bg)]", label: "Viewer" };
        default:
            return { cls: "text-[var(--app-muted)] border-[var(--app-border)]", label: role };
    }
}

function getCapacityGauge(capacity: number) {
    const cap = capacity !== undefined ? capacity : 1.0;
    if (cap >= 1.0) return { color: "bg-[var(--color-success)]", text: "text-[var(--color-success)]", label: "1.0", status: "Full-time" };
    if (cap >= 0.5) return { color: "bg-[var(--color-warning)]", text: "text-[var(--color-warning)]", label: `${cap.toFixed(1)}`, status: "Part-time" };
    return { color: "bg-[var(--color-error)]", text: "text-[var(--color-error)]", label: `${cap.toFixed(1)}`, status: "Low" };
}

const ROLE_OPTIONS = [
    { value: "MEMBER", label: "Member" },
    { value: "LEADER", label: "Leader" },
    { value: "VIEWER", label: "Viewer" },
];

interface ProjectMembersViewProps {
    project: any;
    onRefresh?: () => void;
}

export default function ProjectMembersView({ project, onRefresh }: ProjectMembersViewProps) {
    const router = useRouter();
    const { teamMembers, users, currentUser, currentTeam, setIsManageInvitationsOpen, projectInvitations } = useWorkspace();

    // Check project-level leadership (Only Project Manager and Project Leader can update roles / manage members)
    const currentProjectMember = (project.members || []).find(
        (m: any) => m.userId === currentUser?.id
    );
    const isProjectManager =
        project.managerId === currentUser?.id ||
        project.manager?.id === currentUser?.id ||
        (currentProjectMember?.role || "").toUpperCase() === "MANAGER";
    const isProjectLeader =
        isProjectManager ||
        (currentProjectMember?.role || "").toUpperCase() === "LEADER";

    const canManageRoles = isProjectManager || isProjectLeader;

    // Mode: workspace team member | cross-team / all platform users | by email
    const [addMode, setAddMode] = useState<"workspace" | "all" | "email">("workspace");

    // All platform users state (supports cross-team member selection)
    const [allPlatformUsers, setAllPlatformUsers] = useState<User[]>(users || []);

    useEffect(() => {
        if (users && users.length > 0) {
            setAllPlatformUsers(users);
        } else {
            api.getUsers()
                .then((data) => {
                    if (Array.isArray(data)) setAllPlatformUsers(data);
                })
                .catch(() => {});
        }
    }, [users]);

    // Existing user selection state
    const [newMemberId, setNewMemberId] = useState("");
    const [newMemberRole, setNewMemberRole] = useState("MEMBER");
    const [isAddingMember, setIsAddingMember] = useState(false);

    // Email invite state
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("MEMBER");
    const [isInviting, setIsInviting] = useState(false);

    // Confirm remove / leave member state
    const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);
    const [confirmingLeaveId, setConfirmingLeaveId] = useState<string | null>(null);
    const [cancellingInvitationId, setCancellingInvitationId] = useState<string | null>(null);

    // Calculate active tasks per member
    const memberTaskCounts: Record<string, number> = {};
    if (project.tasks && Array.isArray(project.tasks)) {
        project.tasks.forEach((task: any) => {
            if (task.subtasks && Array.isArray(task.subtasks)) {
                task.subtasks.forEach((sub: any) => {
                    if (sub.status !== "Completed" && sub.status !== "Done" && !sub.isCompleted && sub.assignedToId) {
                        memberTaskCounts[sub.assignedToId] = (memberTaskCounts[sub.assignedToId] || 0) + 1;
                    }
                });
            }
        });
    }

    // Available workspace team members not yet in this project
    const availableWorkspaceMembers = (teamMembers || []).filter(
        (tm) => tm.user.id !== project.managerId && !project.members?.some((pm: any) => pm.userId === tm.user.id)
    );

    const workspaceMemberOptions = availableWorkspaceMembers.map((tm) => ({
        value: tm.user.id,
        label: tm.user.name || tm.user.email || "Unknown User",
        sublabel: `${tm.user.email} (${tm.role})`,
        avatarUrl: tm.user.avatarUrl || undefined,
    }));

    // Available users across any team who are not yet members of this project
    const availablePlatformUsers: User[] = allPlatformUsers.filter(
        (u: User) => !project.members?.some((m: any) => m.userId === u.id)
    );

    const recentUsers: User[] = (teamMembers || []).map((tm) => tm.user);

    // Send invitation to existing user
    const handleAddExistingMember = async () => {
        if (!newMemberId || isAddingMember) return;
        setIsAddingMember(true);
        try {
            await api.sendProjectInvitation(project.id, {
                userId: newMemberId,
                role: newMemberRole,
                dailyCapacity: 1.0,
            }, currentTeam?.id);
            toast.success("Project invitation sent successfully!");
            setNewMemberId("");
            setIsManageInvitationsOpen(true);
            if (onRefresh) onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to send invitation");
        } finally {
            setIsAddingMember(false);
        }
    };

    // Send invitation by email
    const handleInviteByEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || isInviting) return;
        setIsInviting(true);
        try {
            await api.sendProjectInvitation(project.id, {
                email: inviteEmail.trim(),
                role: inviteRole,
                dailyCapacity: 1.0,
            }, currentTeam?.id);
            toast.success(`Project invitation sent to "${inviteEmail}"`);
            setInviteEmail("");
            setIsManageInvitationsOpen(true);
            if (onRefresh) onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to send invitation");
        } finally {
            setIsInviting(false);
        }
    };

    // Cancel pending invitation
    const handleCancelInvitation = async (invitationId: string) => {
        setCancellingInvitationId(invitationId);
        try {
            await api.cancelProjectInvitation(invitationId, currentTeam?.id);
            toast.success("Invitation cancelled.");
            if (onRefresh) onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to cancel invitation");
        } finally {
            setCancellingInvitationId(null);
        }
    };

    // Update role using CustomSelect (only for project leaders/managers modifying other members)
    const handleRoleChange = async (memberId: string, newRole: string) => {
        try {
            await api.updateProjectMember(project.id, memberId, { role: newRole });
            toast.success("Member role updated.");
            if (onRefresh) onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to update member role.");
        }
    };

    // Remove member (for project managers and leaders)
    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (confirmingRemoveId !== memberId) {
            setConfirmingRemoveId(memberId);
            return;
        }
        try {
            await api.removeProjectMember(project.id, memberId);
            toast.success(`Removed ${memberName} from project.`);
            setConfirmingRemoveId(null);
            if (onRefresh) onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to remove member.");
        }
    };

    // Leave project (for current user)
    const handleLeaveProject = async (memberId: string) => {
        if (confirmingLeaveId !== memberId) {
            setConfirmingLeaveId(memberId);
            return;
        }
        try {
            await api.removeProjectMember(project.id, memberId);
            toast.success("You have left the project.");
            setConfirmingLeaveId(null);
            router.push("/projects");
        } catch (err: any) {
            toast.error(err.message || "Failed to leave project.");
        }
    };

    const scrollToAddForm = () => {
        const el = document.getElementById("add-project-member-section");
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 select-none">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-[13px] font-semibold text-[var(--app-text)]">
                        ▪ Project Members & Roles
                    </h2>
                    <p className="text-base text-[var(--app-muted)] mt-0.5">
                        {project.members?.length || 0} members collaborating on {project.title}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {canManageRoles && (
                        <button
                            type="button"
                            onClick={scrollToAddForm}
                            className="bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] text-[11px] font-medium px-3.5 py-1.5 rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Add Member</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Pending Invitations Alert Banner (Links directly to Right Sidebar) */}
            {canManageRoles && project.invitations && project.invitations.length > 0 && (
                <div
                    onClick={() => setIsManageInvitationsOpen(true)}
                    className="border border-[var(--app-border)] hover:border-[var(--app-border-strong)] bg-[var(--app-bg)] rounded-[3px] p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-[var(--app-card)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-text)] shrink-0">
                            <Mail className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs text-[var(--app-text)] font-semibold truncate">
                                {project.invitations.length} Pending Invitation{project.invitations.length > 1 ? "s" : ""} for this Project
                            </p>
                            <p className="text-[10px] text-[var(--app-muted)] mt-0.5">
                                Awaiting response from invited members. View details, status, or cancel in the right sidebar.
                            </p>
                        </div>
                    </div>
                    <span className="text-[11px] text-[var(--app-text)] font-medium flex items-center gap-1 shrink-0 hover:underline">
                        Open Sidebar →
                    </span>
                </div>
            )}

            {/* Members Table */}
            <div className="relative bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets rounded-[2px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--app-border)] text-[9px] font-medium text-[var(--app-muted)] capitalize">
                                <th className="pb-2 pt-3 px-4">Member</th>
                                <th className="pb-2 pt-3 px-4 min-w-[130px]">Role</th>
                                <th className="pb-2 pt-3 px-4 text-center">Active Tasks</th>
                                <th className="pb-2 pt-3 px-4 text-center">Capacity</th>
                                <th className="pb-2 pt-3 px-4 text-center">Daily Load</th>
                                <th className="pb-2 pt-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--app-border)]">
                            {(project.members || []).map((member: any) => {
                                const role = getRoleBadge(member.role);
                                const activeTasks = memberTaskCounts[member.userId] || 0;
                                const gauge = getCapacityGauge(member.dailyCapacity);
                                const isManager = (member.role || "").toUpperCase() === "MANAGER";
                                const isSelf = member.userId === currentUser?.id;
                                const canEditThisRowRole = canManageRoles && !isManager && !isSelf;

                                return (
                                    <tr
                                        key={member.id || member.userId}
                                        className="hover:bg-[var(--app-hover-bg)] transition-colors"
                                    >
                                        {/* Member Info */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <UserAvatar
                                                    name={member.user?.name || "User"}
                                                    avatarUrl={member.user?.avatarUrl}
                                                    size="lg"
                                                    title={member.user?.name}
                                                />
                                                <div>
                                                    <span className="font-medium text-[var(--app-text)] block text-[11px]">
                                                        {member.user?.name || "Unknown User"}
                                                        {isSelf && (
                                                            <span className="ml-1.5 text-[9px] text-[var(--app-muted)] font-normal">
                                                                (You)
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-[9px] text-[var(--app-muted)]">
                                                        {member.user?.email || ""}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role Badge / CustomSelect (Only Project Manager/Leader can edit other members' roles) */}
                                        <td className="py-3 px-4">
                                            {canEditThisRowRole ? (
                                                <div className="w-[115px]">
                                                    <CustomSelect
                                                        options={ROLE_OPTIONS}
                                                        value={(member.role || "MEMBER").toUpperCase()}
                                                        onChange={(newRole) => handleRoleChange(member.id, newRole)}
                                                        className="text-[10px]"
                                                    />
                                                </div>
                                            ) : (
                                                <span className={`text-[9px] font-medium px-2 py-0.5 rounded-[2px] border ${role.cls}`}>
                                                    {role.label}
                                                </span>
                                            )}
                                            {member.isPrimaryLeader && (
                                                <span className="text-[8px] text-[var(--app-muted)] ml-1.5 font-medium">Primary</span>
                                            )}
                                        </td>

                                        {/* Active Tasks */}
                                        <td className="py-3 px-4 text-center tabular-nums font-medium text-[var(--app-text)]">
                                            {activeTasks}
                                        </td>

                                        {/* Capacity Setting */}
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-[10px] text-[var(--app-muted)] tabular-nums">
                                                {member.dailyCapacity === 1.0 ? "Full-time" : `${member.dailyCapacity}d/day`}
                                            </span>
                                        </td>

                                        {/* Daily Load Gauge */}
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-1.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[1px] overflow-hidden">
                                                    <div
                                                        className={`h-full ${gauge.color} transition-all`}
                                                        style={{ width: `${Math.min(100, parseFloat(gauge.label) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-[9px] font-medium tabular-nums ${gauge.text}`}>
                                                    {gauge.label}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Actions: "Leave" for Self, "Remove" for Leader/Manager */}
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {!isManager && (
                                                    isSelf ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLeaveProject(member.id)}
                                                            className={`text-[9px] px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 border ${
                                                                confirmingLeaveId === member.id
                                                                    ? "bg-[var(--color-error)] text-white border-[var(--color-error)] font-bold animate-pulse"
                                                                    : "text-[var(--color-error)] hover:bg-[var(--color-error)]/10 border-[var(--app-border)] hover:border-[var(--color-error)]/30"
                                                            }`}
                                                        >
                                                            <LogOut className="w-2.5 h-2.5" />
                                                            {confirmingLeaveId === member.id ? "Confirm Leave?" : "Leave"}
                                                        </button>
                                                    ) : canManageRoles ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveMember(member.id, member.user?.name || "Member")}
                                                            className={`text-[9px] px-2 py-1 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 border ${
                                                                confirmingRemoveId === member.id
                                                                    ? "bg-[var(--color-error)] text-white border-[var(--color-error)] font-bold animate-pulse"
                                                                    : "text-[var(--color-error)] hover:bg-[var(--color-error)]/10 border-[var(--app-border)] hover:border-[var(--color-error)]/30"
                                                            }`}
                                                        >
                                                            <UserMinus className="w-2.5 h-2.5" />
                                                            {confirmingRemoveId === member.id ? "Confirm?" : "Remove"}
                                                        </button>
                                                    ) : null
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Member Section (Visible only to Project Leaders and Managers) */}
            {canManageRoles && (
                <div id="add-project-member-section" className="relative bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets rounded-[2px] p-4 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-[13px] font-semibold text-[var(--app-text)]">
                                ▪ Invite Members & Collaborators
                            </h2>
                            <p className="text-base text-[var(--app-muted)] mt-0.5">
                                Send project invitations to workspace teammates, cross-team colleagues, or by email. They will join upon accepting.
                            </p>
                        </div>

                        {/* Mode Selector Tabs */}
                        <div className="flex items-center gap-1 bg-[var(--app-bg)] border border-[var(--app-border)] p-0.5 rounded-[3px] self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => {
                                    setAddMode("workspace");
                                    setNewMemberId("");
                                }}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    addMode === "workspace"
                                        ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs font-semibold"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                }`}
                            >
                                <Users className="w-3 h-3" />
                                <span>Workspace Team</span>
                                <span className="text-[9px] bg-[var(--app-border)] text-[var(--app-text)] px-1 rounded-[2px] font-mono">
                                    {availableWorkspaceMembers.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setAddMode("all");
                                    setNewMemberId("");
                                }}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    addMode === "all"
                                        ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs font-semibold"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                }`}
                            >
                                <Globe className="w-3 h-3" />
                                <span>All Teams / Platform</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setAddMode("email");
                                    setInviteEmail("");
                                }}
                                className={`px-2.5 py-1 text-[10px] font-medium rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    addMode === "email"
                                        ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs font-semibold"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                }`}
                            >
                                <Mail className="w-3 h-3" />
                                <span>By Email</span>
                            </button>
                        </div>
                    </div>

                    {/* Form based on active addMode */}
                    {addMode === "workspace" && (
                        <div className="border border-[var(--app-border)] p-3.5 flex flex-col gap-3 rounded-[2px] bg-[var(--app-bg)]">
                            <div className="flex items-center justify-between">
                                <h3 className="eyebrow">Select Workspace Team Member</h3>
                                <span className="text-[10px] text-[var(--app-muted)]">
                                    {availableWorkspaceMembers.length} teammate(s) available to invite
                                </span>
                            </div>

                            {availableWorkspaceMembers.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                                        <div className="md:col-span-7 flex flex-col gap-1">
                                            <label className="text-[10px] font-medium text-[var(--app-muted)]">
                                                Choose Teammate
                                            </label>
                                            <CustomSelect
                                                options={workspaceMemberOptions}
                                                value={newMemberId}
                                                onChange={(id) => setNewMemberId(id)}
                                                placeholder="Select a workspace team member…"
                                                searchable={true}
                                            />
                                        </div>
                                        <div className="md:col-span-3 flex flex-col gap-1">
                                            <label className="text-[10px] font-medium text-[var(--app-muted)]">
                                                Project Role
                                            </label>
                                            <CustomSelect
                                                options={ROLE_OPTIONS}
                                                value={newMemberRole}
                                                onChange={(val) => setNewMemberRole(val)}
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex flex-col justify-end">
                                            <button
                                                type="button"
                                                onClick={handleAddExistingMember}
                                                disabled={!newMemberId || isAddingMember}
                                                className="relative corner-brackets-4 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-medium text-[11px] px-3.5 py-1.5 rounded-[2px] transition-all h-[32px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                {isAddingMember ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span>Send Invite</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick selection chips */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--app-border)]/60">
                                        <span className="text-[9px] text-[var(--app-muted)] mr-1">Quick Select:</span>
                                        {availableWorkspaceMembers.slice(0, 6).map((tm) => (
                                            <button
                                                key={tm.user.id}
                                                type="button"
                                                onClick={() => setNewMemberId(tm.user.id)}
                                                className={`px-2 py-1 text-[10px] border rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                                                    newMemberId === tm.user.id
                                                        ? "bg-[var(--app-text)] text-[var(--app-card)] border-[var(--app-text)] font-semibold"
                                                        : "bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] border-[var(--app-border)]"
                                                }`}
                                            >
                                                <UserAvatar
                                                    name={tm.user.name || tm.user.email}
                                                    avatarUrl={tm.user.avatarUrl}
                                                    size="xs"
                                                />
                                                <span>{tm.user.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-[var(--app-muted)] leading-relaxed italic py-2">
                                    All members of this workspace team are already members or invited to this project. Use the "All Teams / Platform" tab above to invite members from other teams!
                                </p>
                            )}
                        </div>
                    )}

                    {addMode === "all" && (
                        <div className="border border-[var(--app-border)] p-3.5 flex flex-col gap-3 rounded-[2px] bg-[var(--app-bg)]">
                            <div className="flex items-center justify-between">
                                <h3 className="eyebrow">Search Any User Across Teams</h3>
                                <span className="text-[10px] text-[var(--app-muted)]">
                                    Cross-team platform directory
                                </span>
                            </div>
                            <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                                Search for any colleague across the organization or other teams to invite them as a collaborator on this project.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                                <div className="md:col-span-7 flex flex-col gap-1 relative z-20">
                                    <label className="text-[10px] font-medium text-[var(--app-muted)]">
                                        Search by Name or Email
                                    </label>
                                    <UserPickerSelect
                                        users={availablePlatformUsers}
                                        selectedUserId={newMemberId}
                                        onSelectUser={(id) => setNewMemberId(id)}
                                        recentUsers={recentUsers}
                                        placeholder="Search colleague by name or email…"
                                    />
                                </div>
                                <div className="md:col-span-3 flex flex-col gap-1 relative z-10">
                                    <label className="text-[10px] font-medium text-[var(--app-muted)]">
                                        Project Role
                                    </label>
                                    <CustomSelect
                                        options={ROLE_OPTIONS}
                                        value={newMemberRole}
                                        onChange={(val) => setNewMemberRole(val)}
                                    />
                                </div>
                                <div className="md:col-span-2 flex flex-col justify-end">
                                    <button
                                        type="button"
                                        onClick={handleAddExistingMember}
                                        disabled={!newMemberId || isAddingMember}
                                        className="relative corner-brackets-4 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-medium text-[11px] px-3.5 py-1.5 rounded-[2px] transition-all h-[32px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {isAddingMember ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <>
                                                <Mail className="w-3.5 h-3.5" />
                                                <span>Send Invite</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {addMode === "email" && (
                        <form
                            onSubmit={handleInviteByEmail}
                            className="border border-[var(--app-border)] p-3.5 flex flex-col gap-3 rounded-[2px] bg-[var(--app-bg)]"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="eyebrow">Invite Registered User by Email</h3>
                            </div>
                            <p className="text-xs text-[var(--app-muted)] leading-relaxed">
                                Enter the email address of any registered user (from your team or another team) to invite them to this project.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                                <div className="md:col-span-7 flex flex-col gap-1">
                                    <label className="text-[10px] font-medium text-[var(--app-muted)]">
                                        User Email Address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="colleague@company.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] px-2.5 py-1.5 text-[11px] text-[var(--app-text)] focus:outline-none focus:border-[var(--app-text)]"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-3 flex flex-col gap-1">
                                    <label className="text-[10px] font-medium text-[var(--app-muted)]">
                                        Project Role
                                    </label>
                                    <CustomSelect
                                        options={ROLE_OPTIONS}
                                        value={inviteRole}
                                        onChange={(val) => setInviteRole(val)}
                                    />
                                </div>
                                <div className="md:col-span-2 flex flex-col justify-end">
                                    <button
                                        type="submit"
                                        disabled={isInviting || !inviteEmail.trim()}
                                        className="relative corner-brackets-4 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-medium text-[11px] px-3.5 py-1.5 rounded-[2px] transition-all h-[32px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {isInviting ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <>
                                                <Mail className="w-3.5 h-3.5" />
                                                <span>Send Invite</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
