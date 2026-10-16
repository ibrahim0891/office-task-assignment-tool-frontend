import React, { useState } from "react";
import { Task, TaskColumn, User, Team, api } from "../api";
import { CustomSelect } from "./ui/CustomSelect";
import UserPickerSelect from "./ui/UserPickerSelect";
import { useWorkspace } from "../context/WorkspaceContext";
import { Button } from "./ui/Button";
import toast from "react-hot-toast";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { UserAvatar } from "./ui/UserAvatar";

interface LeaderDashboardProps {
    currentTeam: Team;
    currentUser: User;
    tasks: Task[];
    columns: TaskColumn[];
    teamMembers: { user: User; role: string }[];
    allUsers: User[];
    onRefresh: () => void;
    onSelectTask: (taskId: string) => void;
}

export default function LeaderDashboard({
    currentTeam,
    currentUser,
    tasks,
    columns,
    teamMembers,
    allUsers,
    onRefresh,
    onSelectTask,
}: LeaderDashboardProps) {
    const { openMemberProfile, userRole } = useWorkspace();
    const [newMemberId, setNewMemberId] = useState("");
    const [newMemberRole, setNewMemberRole] = useState("MEMBER");

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("MEMBER");
    const [isInviting, setIsInviting] = useState(false);
    const [isAddingMember, setIsAddingMember] = useState(false);

    const handleInviteByEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || isInviting) return;
        setIsInviting(true);
        try {
            await api.inviteMemberByEmail(
                currentTeam.id,
                inviteEmail.trim(),
                inviteRole,
                currentUser.id,
            );
            toast.success(`Member "${inviteEmail}" added to team`);
            setInviteEmail("");
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to add member");
        } finally {
            setIsInviting(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMemberId || isAddingMember) return;
        setIsAddingMember(true);
        try {
            await api.addTeamMember(currentTeam.id, newMemberId, newMemberRole);
            toast.success("Team member added successfully");
            setNewMemberId("");
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to add member");
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (userId === currentUser.id) {
            toast.error("You cannot remove yourself from the team.");
            return;
        }
        if (
            !confirm(
                "Are you sure you want to remove this member? Their active tasks will be reassigned to you and flagged as Need Attention.",
            )
        )
            return;

        try {
            await api.removeTeamMember(currentTeam.id, userId, currentUser.id);
            toast.success("Member removed from team");
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to remove member");
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await api.updateTeamMemberRole(
                currentTeam.id,
                userId,
                newRole,
                currentUser.id,
            );
            toast.success("Member role updated");
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to update role");
        }
    };

    const availableUsers = allUsers.filter(
        (u) => !teamMembers.some((tm) => tm.user.id === u.id),
    );

    const activeTasks = tasks.filter((t) => !t.isSoftDeleted && !t.isArchived);
    const totalTasks = activeTasks.length;

    const completedColumn =
        columns.find((c) => c.isComplete) || columns[columns.length - 1];
    const doneTasksCount = activeTasks.filter(
        (t) => t.columnId === completedColumn?.id,
    ).length;
    const completionRate =
        totalTasks > 0 ? Math.round((doneTasksCount / totalTasks) * 100) : 0;

    const staleTasks = activeTasks.filter(
        (t) => t.columnId !== completedColumn?.id && t.carryCount >= 3,
    );

    const memberWorkload = teamMembers.map(({ user, role }) => {
        const userTasks = activeTasks.filter((t) => t.assignedToId === user.id);

        const needAttentionColIds = columns
            .filter((c) => c.name.toLowerCase().trim() === "need attention")
            .map((c) => c.id);
        const doneColIds = columns
            .filter(
                (c) => c.isComplete || c.name.toLowerCase().trim() === "done",
            )
            .map((c) => c.id);
        const activeColIds = columns
            .filter((c) => c.name.toLowerCase().trim() === "in progress")
            .map((c) => c.id);
        const pendingColIds = columns
            .filter((c) => {
                const name = c.name.toLowerCase().trim();
                return (
                    name === "to do" ||
                    name === "todo" ||
                    name === "need attention later"
                );
            })
            .map((c) => c.id);

        const needAttentionCount = userTasks.filter((t) =>
            needAttentionColIds.includes(t.columnId),
        ).length;
        const activeCount = userTasks.filter((t) =>
            activeColIds.includes(t.columnId),
        ).length;
        const pendingCount = userTasks.filter((t) =>
            pendingColIds.includes(t.columnId),
        ).length;
        const doneCount = userTasks.filter((t) =>
            doneColIds.includes(t.columnId),
        ).length;

        const estimatedHours = userTasks.reduce(
            (sum, t) => sum + (t.estimatedTime || 0),
            0,
        );

        return {
            user,
            role,
            needAttention: needAttentionCount,
            active: activeCount,
            pending: pendingCount,
            done: doneCount,
            estimatedHours,
        };
    });

    const getRoleColor = (role: string) => {
        switch (role) {
            case "LEADER":
                return "text-[#CB2431]";
            case "OBSERVER":
                return "text-[#B08800]";
            default:
                return "text-[#22863A]";
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAF9] text-[#1A1A1A] flex flex-col gap-6 select-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A]">Leader Dashboard</h1>
                    <p className="text-sm text-[#888883] mt-0.5">
                        Workload metrics and team management for{" "}
                        <span className="text-[#1A1A1A] font-medium">
                            {currentTeam.name}
                        </span>
                    </p>
                </div>
                <Link href="/task-board" className="shrink-0">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        className="rounded-lg shadow-2xs"
                    >
                        Go to Task Board
                    </Button>
                </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E5E3] rounded-lg p-4 flex flex-col gap-1 shadow-2xs">
                    <span className="text-xs font-medium text-[#888883]">Active Tasks</span>
                    <span className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
                        {totalTasks}
                    </span>
                </div>

                <div className="bg-white border border-[#E5E5E3] rounded-lg p-4 flex flex-col gap-1 shadow-2xs">
                    <span className="text-xs font-medium text-[#888883]">Completion Rate</span>
                    <span className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
                        {completionRate}%
                    </span>
                </div>

                <div className="bg-white border border-[#E5E5E3] rounded-lg p-4 flex flex-col gap-1 shadow-2xs">
                    <span className="text-xs font-medium text-[#888883]">Stale Alerts</span>
                    <span
                        className={`text-2xl font-bold tracking-tight ${staleTasks.length > 0 ? "text-[#B08800]" : "text-[#1A1A1A]"}`}
                    >
                        {staleTasks.length}
                    </span>
                </div>

                <div className="bg-white border border-[#E5E5E3] rounded-lg p-4 flex flex-col gap-1 shadow-2xs">
                    <span className="text-xs font-medium text-[#888883]">Team Size</span>
                    <span className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
                        {teamMembers.length}
                    </span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Workload + Stale */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Workload Table */}
                    <div className="bg-white border border-[#E5E5E3] p-5 flex flex-col gap-4 rounded-lg shadow-2xs">
                        <div>
                            <h2 className="text-sm font-semibold text-[#1A1A1A]">
                                Team Workloads
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E5E5E3] text-xs font-medium text-[#888883]">
                                        <th className="pb-2.5 px-3">Member</th>
                                        <th className="pb-2.5 px-3 text-center">Need Attention</th>
                                        <th className="pb-2.5 px-3 text-center">Active</th>
                                        <th className="pb-2.5 px-3 text-center">Pending</th>
                                        <th className="pb-2.5 px-3 text-center">Done</th>
                                        <th className="pb-2.5 px-3 text-right">Est. Hours</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E5E3]">
                                    {memberWorkload.map(
                                        ({
                                            user,
                                            role,
                                            needAttention,
                                            active,
                                            pending,
                                            done,
                                            estimatedHours,
                                        }) => (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-[#FAFAF9] transition-colors"
                                            >
                                                <td
                                                    onClick={() =>
                                                        openMemberProfile(user)
                                                    }
                                                    className="py-2.5 px-3 flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
                                                >
                                                    <UserAvatar
                                                        name={user.fullName || user.name}
                                                        avatarUrl={user.avatarUrl}
                                                        size="md"
                                                        showBorder={false}
                                                    />
                                                    <div className="min-w-0">
                                                        <span className="font-medium text-[#1A1A1A] block text-xs truncate">
                                                            {user.fullName || user.name}
                                                        </span>
                                                        <span
                                                            className={`text-[10px] font-medium capitalize px-1.5 py-0.2 rounded-full inline-block mt-0.5 border ${
                                                                role === "LEADER"
                                                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                    : role === "OBSERVER"
                                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                    : "bg-gray-50 text-gray-700 border-gray-200"
                                                            }`}
                                                        >
                                                            {role.toLowerCase()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-medium text-[#CB2431]">
                                                    {needAttention}
                                                </td>
                                                <td className="py-2.5 px-3 text-center text-[#1A1A1A] font-medium">
                                                    {active}
                                                </td>
                                                <td className="py-2.5 px-3 text-center text-[#888883] font-medium">
                                                    {pending}
                                                </td>
                                                <td className="py-2.5 px-3 text-center text-[#22863A] font-medium">
                                                    {done}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-medium text-[#1A1A1A]">
                                                    {estimatedHours}h
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Aging Tasks */}
                    <div className="bg-white border border-[#E5E5E3] p-5 flex flex-col gap-4 rounded-lg shadow-2xs">
                        <div>
                            <h2 className="text-sm font-semibold text-[#1A1A1A]">
                                Aging Task Alerts
                            </h2>
                            <p className="text-xs text-[#888883] mt-0.5">
                                Tasks carried forward 3 or more days without completion.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            {staleTasks.length === 0 ? (
                                <div className="text-center py-8 text-[#888883] text-xs border border-dashed border-[#E5E5E3] rounded-md">
                                    No aging tasks found.
                                </div>
                            ) : (
                                staleTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => onSelectTask(task.id)}
                                        className="p-3.5 bg-white border border-[#E5E5E3] hover:border-[#DADAD6] rounded-md flex justify-between items-center cursor-pointer hover:bg-[#FAFAF9] transition-colors text-left"
                                    >
                                        <div className="min-w-0 pr-3">
                                            <h4 className="text-sm font-medium text-[#1A1A1A] truncate">
                                                {task.title}
                                            </h4>
                                            <p className="text-xs text-[#888883] mt-0.5">
                                                {task.assignedTo?.fullName || task.assignedTo?.name || "Unassigned"} ·{" "}
                                                {task.column?.name || "In Progress"}
                                            </p>
                                        </div>

                                        <span className="text-xs font-medium text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 px-2.5 py-0.5 rounded-full shrink-0">
                                            {task.carryCount}d carried
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Team Roster */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white border border-[#E5E5E3] p-5 flex flex-col gap-5 rounded-lg shadow-2xs">
                        <div>
                            <h2 className="text-sm font-semibold text-[#1A1A1A]">
                                Team Roster
                            </h2>
                            <p className="text-xs text-[#888883] mt-0.5">
                                Manage members and add teammates to this workspace.
                            </p>
                        </div>

                        {/* Add member by email */}
                        <form
                            onSubmit={handleInviteByEmail}
                            className="bg-[#FAFAF9] border border-[#E5E5E3] rounded-lg p-3.5 flex flex-col gap-2.5"
                        >
                            <div>
                                <h3 className="text-xs font-semibold text-[#1A1A1A]">Add Member by Email</h3>
                                <p className="text-xs text-[#888883] mt-0.5">
                                    Invite a colleague using their registered email.
                                </p>
                            </div>
                            <input
                                type="email"
                                placeholder="colleague@company.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full bg-white border border-[#E5E5E3] rounded-md px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                                required
                            />
                            <div className="flex gap-2 items-center">
                                <CustomSelect
                                    options={[
                                        { value: "MEMBER", label: "Member" },
                                        { value: "LEADER", label: "Leader" },
                                        {
                                            value: "OBSERVER",
                                            label: "Observer",
                                        },
                                    ]}
                                    value={inviteRole}
                                    onChange={(val) => setInviteRole(val)}
                                    className="flex-1"
                                />
                                <button
                                    type="submit"
                                    disabled={isInviting || !inviteEmail.trim()}
                                    className="bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs px-3.5 py-2 rounded-md transition-colors shrink-0 h-[34px] flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {isInviting && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                    )}
                                    <span>
                                        {isInviting ? "Adding…" : "Add Member"}
                                    </span>
                                </button>
                            </div>
                        </form>

                        {/* Add existing user */}
                        <div className="bg-[#FAFAF9] border border-[#E5E5E3] rounded-lg p-3.5 flex flex-col gap-2.5">
                            <div>
                                <h3 className="text-xs font-semibold text-[#1A1A1A]">Add Existing User</h3>
                                <p className="text-xs text-[#888883] mt-0.5">
                                    Quickly add a user already active in your organization.
                                </p>
                            </div>
                            {availableUsers.length > 0 ? (
                                <>
                                    <div className="relative z-20">
                                        <UserPickerSelect
                                            users={availableUsers}
                                            selectedUserId={newMemberId}
                                            onSelectUser={(id) =>
                                                setNewMemberId(id)
                                            }
                                            recentUsers={teamMembers.map(
                                                (tm) => tm.user,
                                            )}
                                            placeholder="Search or select existing member…"
                                        />
                                    </div>
                                    <div className="flex gap-2 items-center relative z-10">
                                        <CustomSelect
                                            options={[
                                                {
                                                    value: "MEMBER",
                                                    label: "Member",
                                                },
                                                {
                                                    value: "LEADER",
                                                    label: "Leader",
                                                },
                                                {
                                                    value: "OBSERVER",
                                                    label: "Observer",
                                                },
                                            ]}
                                            value={newMemberRole}
                                            onChange={(val) =>
                                                setNewMemberRole(val)
                                            }
                                            className="flex-1"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddMember}
                                            disabled={
                                                !newMemberId || isAddingMember
                                            }
                                            className="bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs px-3.5 py-2 rounded-md transition-colors shrink-0 h-[34px] flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            {isAddingMember && (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                            )}
                                            <span>
                                                {isAddingMember
                                                    ? "Adding…"
                                                    : "Add"}
                                            </span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-[#888883] leading-relaxed italic">
                                    All registered platform users are already
                                    members of this workspace.
                                </p>
                            )}
                        </div>

                        {/* Roster list */}
                        <div className="flex flex-col gap-2">
                            <h3 className="text-xs font-semibold text-[#1A1A1A]">Team Members ({teamMembers.length})</h3>
                            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                                {teamMembers.map(({ user, role }) => (
                                    <div
                                        key={user.id}
                                        className="p-3 border border-[#E5E5E3] rounded-md flex justify-between items-center gap-3 hover:bg-[#FAFAF9] transition-colors"
                                    >
                                        <div
                                            onClick={() =>
                                                openMemberProfile(user)
                                            }
                                            className="flex items-center gap-3 min-w-0 pr-2 cursor-pointer hover:opacity-85 transition-opacity flex-1"
                                        >
                                            <UserAvatar
                                                name={user.fullName || user.name}
                                                avatarUrl={user.avatarUrl}
                                                size="md"
                                                showBorder={false}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <span className="text-xs font-semibold text-[#1A1A1A] block truncate">
                                                    {user.fullName || user.name}
                                                </span>
                                                <span className="text-xs text-[#888883] truncate block">
                                                    {user.email}
                                                </span>

                                                {userRole === "LEADER" &&
                                                user.id !== currentUser.id ? (
                                                    <div
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className="mt-1"
                                                    >
                                                        <select
                                                            value={role}
                                                            onChange={(e) =>
                                                                handleRoleChange(
                                                                    user.id,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="bg-white border border-[#E5E5E3] hover:border-[#1A1A1A] rounded-md px-2 py-0.5 text-xs font-medium text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] cursor-pointer transition-colors"
                                                        >
                                                            <option value="MEMBER">
                                                                Member
                                                            </option>
                                                            <option value="LEADER">
                                                                Leader
                                                            </option>
                                                            <option value="OBSERVER">
                                                                Observer
                                                            </option>
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className={`text-xs font-medium capitalize mt-0.5 inline-block ${getRoleColor(role)}`}
                                                    >
                                                        {role === "LEADER"
                                                            ? "Leader"
                                                            : role.toLowerCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-medium text-[#888883] bg-[#FAFAF9] border border-[#E5E5E3] px-2.5 py-0.5 rounded-full ml-auto shrink-0 hidden sm:block">
                                                {user.designation ||
                                                    "Team Member"}
                                            </span>
                                        </div>

                                        {user.id !== currentUser.id && (
                                            <button
                                                onClick={() =>
                                                    handleRemoveMember(user.id)
                                                }
                                                className="text-xs text-[#CB2431] hover:underline font-medium shrink-0 cursor-pointer"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
