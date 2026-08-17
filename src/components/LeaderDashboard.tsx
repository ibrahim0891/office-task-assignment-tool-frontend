import React, { useState } from "react";
import { Task, TaskColumn, User, api } from "../api";
import { CustomSelect } from "./ui/CustomSelect";
import UserPickerSelect from "./ui/UserPickerSelect";
import { useWorkspace } from "../context/WorkspaceContext";
import { Button } from "./ui/Button";

interface LeaderDashboardProps {
    currentTeam: { id: string; name: string };
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
    const { openMemberProfile } = useWorkspace();
    const [newMemberId, setNewMemberId] = useState("");
    const [newMemberRole, setNewMemberRole] = useState("MEMBER");

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("MEMBER");
    const [isInviting, setIsInviting] = useState(false);

    const handleInviteByEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        setIsInviting(true);
        try {
            await api.inviteMemberByEmail(
                currentTeam.id,
                inviteEmail.trim(),
                inviteRole,
                currentUser.id,
            );
            alert(
                `Member "${inviteEmail}" invited successfully! Password default: password123`,
            );
            setInviteEmail("");
            onRefresh();
        } catch (err: any) {
            alert("Error inviting member: " + err.message);
        } finally {
            setIsInviting(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMemberId) return;
        try {
            await api.addTeamMember(currentTeam.id, newMemberId, newMemberRole);
            setNewMemberId("");
            onRefresh();
        } catch (err: any) {
            alert("Error adding member: " + err.message);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (userId === currentUser.id) {
            alert("You cannot remove yourself from the team.");
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
            onRefresh();
        } catch (err: any) {
            alert("Error removing member: " + err.message);
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
        const completedTasks = userTasks.filter(
            (t) => t.columnId === completedColumn?.id,
        );
        const pendingTasks = userTasks.filter(
            (t) => t.columnId !== completedColumn?.id,
        );
        const estimatedHours = userTasks.reduce(
            (sum, t) => sum + (t.estimatedTime || 0),
            0,
        );

        return {
            user,
            role,
            total: userTasks.length,
            completed: completedTasks.length,
            pending: pendingTasks.length,
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
        <div className="flex-1 overflow-y-auto p-5 bg-[#FAFAF9] text-[#1A1A1A] flex flex-col gap-5 select-none">
            {/* Header */}
            <div>
                <h1 className="font-heading text-xl">Leader Dashboard</h1>
                <p className="text-[12px] text-[#888883] mt-0.5">
                    Workload metrics and team management for{" "}
                    <span className="text-[#1A1A1A] font-medium">
                        {currentTeam.name}
                    </span>
                </p>
            </div>

            {/* Stats Row */}
            <div className="corner-brackets grid grid-cols-2 md:grid-cols-4 gap-px bg-[#E5E5E3] border border-[#E5E5E3]">
                <div className="bg-white p-4 flex flex-col gap-1">
                    <span className="eyebrow">Active Tasks</span>
                    <span className="text-2xl font-heading text-[#1A1A1A]">
                        {totalTasks}
                    </span>
                </div>

                <div className="bg-white p-4 flex flex-col gap-1">
                    <span className="eyebrow">Completion</span>
                    <span className="text-2xl font-heading text-[#1A1A1A]">
                        {completionRate}%
                    </span>
                </div>

                <div className="bg-white p-4 flex flex-col gap-1">
                    <span className="eyebrow">Stale Alerts</span>
                    <span
                        className={`text-2xl font-heading ${staleTasks.length > 0 ? "text-[#B08800]" : "text-[#1A1A1A]"}`}
                    >
                        {staleTasks.length}
                    </span>
                </div>

                <div className="bg-white p-4 flex flex-col gap-1">
                    <span className="eyebrow">Team Size</span>
                    <span className="text-2xl font-heading text-[#1A1A1A]">
                        {teamMembers.length}
                    </span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: Workload + Stale */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* Workload Table */}
                    <div className="relative bg-white border border-[#E5E5E3] p-4 flex flex-col gap-3 corner-brackets rounded-[2px]">
                        <div>
                            <h2 className="text-[13px] font-semibold">
                                ▪ Team Workloads
                            </h2>
                            <p className="text-xs text-[#888883] mt-0.5">
                                Effort and completion per member.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px] border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E5E5E3] text-[9px] font-medium text-[#888883] capitalize tracking-[0.05em]">
                                        <th className="pb-2 px-2">Member</th>
                                        <th className="pb-2 px-2 text-center">
                                            Active
                                        </th>
                                        <th className="pb-2 px-2 text-center">
                                            Done
                                        </th>
                                        <th className="pb-2 px-2 text-center">
                                            Pending
                                        </th>
                                        <th className="pb-2 px-2 text-right">
                                            Est. Hrs
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E5E3]">
                                    {memberWorkload.map(
                                        ({
                                            user,
                                            role,
                                            total,
                                            completed,
                                            pending,
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
                                                    className="py-2.5 px-2 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                                >
                                                    {user.avatarUrl ? (
                                                        <img
                                                            src={user.avatarUrl}
                                                            alt={user.name}
                                                            className="w-5 h-5 rounded-full object-cover border border-[#E5E5E3] shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-[2px] border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-[8px] text-[#1A1A1A] font-semibold shrink-0">
                                                            {user.name
                                                                .split(" ")
                                                                .map(
                                                                    (n) => n[0],
                                                                )
                                                                .join("")}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="font-medium text-[#1A1A1A] block text-[11px]">
                                                            {user.name}
                                                        </span>
                                                        <span
                                                            className={`text-[8px] font-medium capitalize tracking-[0.05em] ${getRoleColor(role)}`}
                                                        >
                                                            {role}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-2 text-center font-medium text-[#1A1A1A] tabular-nums">
                                                    {total}
                                                </td>
                                                <td className="py-2.5 px-2 text-center text-[#22863A] font-medium tabular-nums">
                                                    {completed}
                                                </td>
                                                <td className="py-2.5 px-2 text-center text-[#1A1A1A] font-medium tabular-nums">
                                                    {pending}
                                                </td>
                                                <td className="py-2.5 px-2 text-right font-medium text-[#1A1A1A] tabular-nums">
                                                    {estimatedHours}h
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Stale Tasks */}
                    <div className="relative bg-white border border-[#E5E5E3] p-4 flex flex-col gap-3 corner-brackets rounded-[2px]">
                        <div>
                            <h2 className="text-[13px] font-semibold text-[#B08800]">
                                ▪ Aging Task Alerts
                            </h2>
                            <p className="text-xs text-[#888883] mt-0.5">
                                Carried forward 3+ days without completion.
                            </p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {staleTasks.length === 0 ? (
                                <div className="text-center py-6 text-[#888883] text-[11px] border border-dashed border-[#E5E5E3]">
                                    No stale tasks found.
                                </div>
                            ) : (
                                staleTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => onSelectTask(task.id)}
                                        className="p-3 bg-white border border-[#E5E5E3] hover:border-[#DADAD6] flex justify-between items-center cursor-pointer hover:bg-[#FAFAF9] transition-colors text-left"
                                    >
                                        <div className="min-w-0 pr-3">
                                            <h4 className="text-[11px] font-medium text-[#1A1A1A] truncate">
                                                {task.title}
                                            </h4>
                                            <p className="text-[9px] text-[#888883] mt-0.5">
                                                {task.assignedTo.name} ·{" "}
                                                {task.column.name}
                                            </p>
                                        </div>

                                        <span className="text-[9px] font-medium text-[#B08800] border border-[#B08800]/20 px-1.5 py-0.5 rounded-[2px] shrink-0">
                                            {task.carryCount}d carried
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Team Roster */}
                <div className="flex flex-col gap-4">
                    <div className="relative bg-white border border-[#E5E5E3] p-4 flex flex-col gap-3 corner-brackets rounded-[2px]">
                        <div>
                            <h2 className="text-[13px] font-semibold">
                                ▪ Team Roster
                            </h2>
                            <p className="text-xs text-[#888883] mt-0.5">
                                Invite members by email or add registered users.
                            </p>
                        </div>

                        {/* Invite by email */}
                        <form
                            onSubmit={handleInviteByEmail}
                            className="border border-[#E5E5E3] p-3 flex flex-col gap-2"
                        >
                            <h3 className="eyebrow">Invite by Email</h3>
                            <p className="text-xs text-[#888883] leading-relaxed">
                                New accounts use default password:{" "}
                                <code className="text-[#1A1A1A] font-medium">
                                    password123
                                </code>
                            </p>
                            <input
                                type="email"
                                placeholder="colleague@company.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full bg-white border border-[#E5E5E3] rounded-[3px] px-2.5 py-1.5 text-[11px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                                required
                            />
                            <div className="flex gap-1.5 items-center">
                                <CustomSelect
                                    options={[
                                        { value: "MEMBER", label: "Member" },
                                        { value: "LEADER", label: "Co-Leader" },
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
                                    className="bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-30 text-white font-medium text-xs px-3 py-1.5 rounded-[3px] transition-colors shrink-0 h-[30px] flex items-center justify-center cursor-pointer"
                                >
                                    {isInviting ? "Inviting…" : "Invite"}
                                </button>
                            </div>
                        </form>

                        {/* Add existing user */}
                        {availableUsers.length > 0 && (
                            <div className="border border-[#E5E5E3] p-3 flex flex-col gap-2">
                                <h3 className="eyebrow">Add Existing User</h3>
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
                                <div className="flex gap-1.5 items-center relative z-10">
                                    <CustomSelect
                                        options={[
                                            {
                                                value: "MEMBER",
                                                label: "Member",
                                            },
                                            {
                                                value: "LEADER",
                                                label: "Co-Leader",
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
                                        disabled={!newMemberId}
                                        className="bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-30 text-white font-medium text-xs px-3 py-1.5 rounded-[3px] transition-colors shrink-0 h-[30px] flex items-center justify-center cursor-pointer"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Roster list */}
                        <div className="flex flex-col gap-1">
                            <h3 className="eyebrow mb-1">Members</h3>
                            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                                {teamMembers.map(({ user, role }) => (
                                    <div
                                        key={user.id}
                                        className="p-2.5 border border-[#E5E5E3] flex justify-between items-center"
                                    >
                                        <div
                                            onClick={() =>
                                                openMemberProfile(user)
                                            }
                                            className="flex items-center gap-2.5 min-w-0 pr-2 cursor-pointer hover:opacity-80 transition-opacity flex-1"
                                        >
                                            {user.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user.name}
                                                    className="w-9 h-9 rounded-[3px] object-cover border border-[#E5E5E3] shrink-0"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-[3px] border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-xs text-[#1A1A1A] font-bold shrink-0">
                                                    {user.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[11px] font-medium text-[#1A1A1A] block truncate">
                                                    {user.name}
                                                </span>
                                                <span className="text-[9px] text-[#888883] truncate block">
                                                    {user.email}
                                                </span>
                                                <span
                                                    className={`text-[8px] font-medium capitalize tracking-[0.05em] ${getRoleColor(role)}`}
                                                >
                                                    {role}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-medium text-[#888883] bg-[#FAFAF9] border border-[#E5E5E3] px-2 py-0.5 rounded-[2px] ml-auto shrink-0 hidden sm:block">
                                                {user.designation ||
                                                    "Team Member"}
                                            </span>
                                        </div>

                                        {user.id !== currentUser.id && (
                                            <button
                                                onClick={() =>
                                                    handleRemoveMember(user.id)
                                                }
                                                className="text-[9px] text-[#CB2431] hover:underline font-medium"
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
