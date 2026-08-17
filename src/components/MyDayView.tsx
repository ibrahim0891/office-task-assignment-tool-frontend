"use client";

import React, { useState } from "react";
import { Task, TaskColumn, User } from "../api";
import { Button } from "./ui/Button";

interface MyDayViewProps {
    tasks: Task[];
    columns?: TaskColumn[];
    teamMembers?: { user: User; role: string }[];
    currentUser: User;
    onSelectTask: (taskId: string) => void;
    onToggleComplete: (taskId: string, isCompleted: boolean) => void;
}

export default function MyDayView({
    tasks,
    columns = [],
    teamMembers = [],
    currentUser,
    onSelectTask,
    onToggleComplete,
}: MyDayViewProps) {
    const [viewTab, setViewTab] = useState<"my" | "team">("my");
    const todayStr = new Date().toISOString().split("T")[0];

    // Filter today's tasks for current user
    const myTasks = tasks.filter(
        (t) =>
            t.assignedToId === currentUser.id &&
            !t.isSoftDeleted &&
            !t.isArchived &&
            (t.date?.split("T")[0] === todayStr ||
                (t.dueDate && t.dueDate.split("T")[0] === todayStr)),
    );

    const myCompletedTasks = myTasks.filter((t) => t.column?.isComplete);
    const myPendingTasks = myTasks.filter((t) => !t.column?.isComplete);

    // Filter all team tasks for today
    const teamTodayTasks = tasks.filter(
        (t) =>
            !t.isSoftDeleted &&
            !t.isArchived &&
            (t.date?.split("T")[0] === todayStr ||
                (t.dueDate && t.dueDate.split("T")[0] === todayStr)),
    );

    const teamCompletedTasks = teamTodayTasks.filter((t) => t.column?.isComplete);

    const teamCompletionRate =
        teamTodayTasks.length > 0
            ? Math.round((teamCompletedTasks.length / teamTodayTasks.length) * 100)
            : 0;

    // Group tasks dynamically by Kanban Board Columns
    const myTasksByColumn = columns.map((col) => ({
        column: col,
        tasks: myTasks.filter((t) => t.columnId === col.id),
    }));

    const getPriorityBorder = (p: string) => {
        switch (p) {
            case "URGENT":
                return "border-l-2 border-l-[#CB2431]";
            case "HIGH":
                return "border-l-2 border-l-[#B08800]";
            case "MEDIUM":
                return "border-l-2 border-l-[#1A1A1A]";
            default:
                return "border-l-2 border-l-[#DADAD6]";
        }
    };

    // Calculate workload breakdown per member for today
    const memberWorkloads = teamMembers.map(({ user, role }) => {
        const memberTasks = teamTodayTasks.filter((t) => t.assignedToId === user.id);
        const done = memberTasks.filter((t) => t.column?.isComplete).length;
        const pending = memberTasks.filter((t) => !t.column?.isComplete);
        return {
            user,
            role,
            total: memberTasks.length,
            done,
            pending,
        };
    });

    return (
        <div className="flex-1 overflow-y-auto p-4 bg-[#FAFAF9] text-[#1A1A1A] flex flex-col gap-3 select-none">
            {/* Header Box with Corner Brackets */}
            <div className="relative bg-white border border-[#E5E5E3] p-3.5 rounded-[2px] corner-brackets flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="font-heading text-lg text-[#1A1A1A]">My Day & Team Summary</h1>
                    <p className="text-[11px] text-[#888883] mt-0.5">
                        {new Date().toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </p>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewTab === "my" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewTab("my")}
                    >
                        My Tasks ({myPendingTasks.length})
                    </Button>
                    <Button
                        variant={viewTab === "team" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewTab("team")}
                    >
                        Team Summary ({teamTodayTasks.length})
                    </Button>
                </div>
            </div>

            {/* Overall Day Progress & Stats Box */}
            <div className="relative bg-white border border-[#E5E5E3] p-3.5 rounded-[2px] corner-brackets flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[11px]">
                    <span className="eyebrow font-semibold">Today's Overall Team Progress</span>
                    <span className="font-semibold text-[#1A1A1A]">
                        {teamCompletedTasks.length} / {teamTodayTasks.length} completed ({teamCompletionRate}%)
                    </span>
                </div>
                <div className="w-full bg-[#FAFAF9] border border-[#E5E5E3] h-2 rounded-[2px] overflow-hidden">
                    <div
                        className="bg-[#1A1A1A] h-full transition-all duration-300"
                        style={{ width: `${teamCompletionRate}%` }}
                    />
                </div>
            </div>

            {/* TAB 1: MY TASKS (Grouped by Kanban Board Columns) */}
            {viewTab === "my" && (
                <div className="relative bg-white border border-[#E5E5E3] p-3.5 rounded-[2px] corner-brackets flex flex-col gap-3">
                    {myTasks.length === 0 ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center gap-1 text-[#888883]">
                            <span className="text-[11px] font-medium text-[#1A1A1A]">No tasks scheduled for today</span>
                            <span className="text-[10px]">All tasks assigned to you for today will appear here.</span>
                        </div>
                    ) : (
                        myTasksByColumn.map(({ column, tasks: colTasks }) => {
                            if (colTasks.length === 0) return null;

                            return (
                                <div key={column.id} className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 px-0.5">
                                        <span className={`eyebrow ${column.isComplete ? "text-[#22863A]" : "text-[#1A1A1A]"}`}>
                                            {column.name}
                                        </span>
                                        <span className="text-[10px] text-[#888883]">({colTasks.length})</span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        {colTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                onClick={() => onSelectTask(task.id)}
                                                className={`bg-white border border-[#E5E5E3] hover:border-[#1A1A1A] p-2.5 rounded-[2px] flex items-center justify-between gap-3 cursor-pointer transition-colors ${getPriorityBorder(task.priority)} ${column.isComplete ? "opacity-70 hover:opacity-100" : ""}`}
                                            >
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleComplete(task.id, !column.isComplete);
                                                        }}
                                                        className={`w-4.5 h-4.5 rounded-[2px] border flex items-center justify-center shrink-0 transition-colors cursor-pointer text-base font-bold ${column.isComplete
                                                            ? "bg-[#22863A]/10 border-[#22863A] text-[#22863A]"
                                                            : "border-[#DADAD6] hover:border-[#1A1A1A] bg-white text-transparent hover:text-[#888883]"
                                                            }`}
                                                        title={column.isComplete ? "Mark incomplete" : "Mark complete"}
                                                    >
                                                        ✓
                                                    </button>

                                                    <div className="truncate flex-1 min-w-0">
                                                        <h3 className={`text-base font-semibold truncate ${column.isComplete ? "line-through text-[#888883]" : "text-[#1A1A1A]"}`}>
                                                            {task.title}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 text-[10px]">
                                                    <span className="border border-[#E5E5E3] text-[#888883] px-1.5 py-0.5 rounded-[2px] font-medium">
                                                        {task.priority}
                                                    </span>
                                                    {task.estimatedTime ? (
                                                        <span className="text-[#888883] border border-[#E5E5E3] px-1.5 py-0.5 rounded-[2px]">
                                                            {task.estimatedTime}h
                                                        </span>
                                                    ) : null}
                                                    {task.dueDate && (
                                                        <span className="text-[#888883] border border-[#E5E5E3] px-1.5 py-0.5 rounded-[2px]">
                                                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                                        </span>
                                                    )}
                                                    {task.carryCount > 0 && (
                                                        <span className="text-[#B08800] border border-[#B08800]/20 px-1.5 py-0.5 rounded-[2px] font-medium">
                                                            {task.carryCount}d carried
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* TAB 2: TEAM SUMMARY & WORKLOAD */}
            {viewTab === "team" && (
                <div className="flex flex-col gap-3">
                    {/* Team Members Today's Workload Breakdown */}
                    <div className="relative bg-white border border-[#E5E5E3] p-3.5 rounded-[2px] corner-brackets flex flex-col gap-3">
                        <span className="eyebrow">Team Member Workloads Today</span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {memberWorkloads.map(({ user, role, total, done, pending }) => (
                                <div
                                    key={user.id}
                                    className="border border-[#E5E5E3] p-3 rounded-[2px] bg-white flex flex-col gap-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {user.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user.name}
                                                    className="w-5 h-5 rounded-full object-cover border border-[#E5E5E3] shrink-0"
                                                />
                                            ) : (
                                                <div className="w-5 h-5 rounded-[2px] border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-[8px] font-bold shrink-0">
                                                    {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                                </div>
                                            )}
                                            <span className="text-base font-semibold text-[#1A1A1A] truncate">{user.name}</span>
                                        </div>
                                        <span className="text-[10px] text-[#888883] border border-[#E5E5E3] px-1.5 py-0.5 rounded-[2px]">
                                            {done}/{total} done
                                        </span>
                                    </div>

                                    {/* Active Member Tasks */}
                                    <div className="flex flex-col gap-1 pt-1 border-t border-[#E5E5E3]">
                                        {pending.length === 0 ? (
                                            <span className="text-[10px] text-[#888883] italic">No active tasks for today</span>
                                        ) : (
                                            pending.slice(0, 3).map((t) => (
                                                <div
                                                    key={t.id}
                                                    onClick={() => onSelectTask(t.id)}
                                                    className="flex items-center justify-between text-[11px] text-[#1A1A1A] hover:underline cursor-pointer truncate gap-2"
                                                >
                                                    <span className="truncate">• {t.title}</span>
                                                    <span className="text-[9px] text-[#888883] shrink-0">{t.column?.name}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* All Today's Team To-Dos */}
                    <div className="relative bg-white border border-[#E5E5E3] p-3.5 rounded-[2px] corner-brackets flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                            <span className="eyebrow">All Today's Workspace Tasks</span>
                            <span className="text-[10px] text-[#888883]">
                                {teamTodayTasks.length - teamCompletedTasks.length} pending, {teamCompletedTasks.length} completed
                            </span>
                        </div>

                        <div className="flex flex-col gap-1">
                            {teamTodayTasks.length === 0 ? (
                                <span className="text-[11px] text-[#888883] text-center py-4">No workspace tasks assigned for today</span>
                            ) : (
                                teamTodayTasks.map((t) => (
                                    <div
                                        key={t.id}
                                        onClick={() => onSelectTask(t.id)}
                                        className="border border-[#E5E5E3] p-2.5 rounded-[2px] hover:bg-[#FAFAF9] flex items-center justify-between gap-3 cursor-pointer text-left"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.column?.isComplete ? "bg-[#22863A]" : "bg-[#1A1A1A]"}`} />
                                            <span className={`text-base font-medium truncate ${t.column?.isComplete ? "line-through text-[#888883]" : "text-[#1A1A1A]"}`}>
                                                {t.title}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 text-[10px]">
                                            <span className="text-[#888883] font-medium">
                                                {t.assignedTo?.name}
                                            </span>
                                            <span className="border border-[#E5E5E3] px-1.5 py-0.5 rounded-[2px]">
                                                {t.column?.name}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
