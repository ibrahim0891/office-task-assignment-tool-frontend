"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { getLocalDateString } from "../utils/date";
import { api } from "../api";
import { APP_CONFIG } from "../config/appConfig";
import { CustomSelect } from "./ui/CustomSelect";
import { CustomDatePicker } from "./ui/CustomDatePicker";
import { TipTapEditor } from "./ui/TipTapEditor";

const inputClass =
    "px-2.5 py-1.5 border border-[#E5E5E3] focus:border-[#1A1A1A] focus:outline-none text-[11px] bg-white rounded-[3px] transition-colors w-full";

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddTaskModal({ isOpen, onClose }: AddTaskModalProps) {
    const {
        currentTeam,
        currentUser,
        userRole,
        teamMembers,
        columns,
        addTaskColId,
        activeDateStr,
        loadTasks,
    } = useWorkspace();

    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newAssigneeId, setNewAssigneeId] = useState("");
    const [newPriority, setNewPriority] = useState<string>("MEDIUM");
    const [newDueDate, setNewDueDate] = useState("");
    const [newEstTime, setNewEstTime] = useState("");
    const [newIsRecurring, setNewIsRecurring] = useState(false);
    const [newRecurrence, setNewRecurrence] = useState("WEEKLY");
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    if (!isOpen) return null;

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentTeam || !currentUser || !newTitle.trim()) return;

        if (newTitle.trim().length > APP_CONFIG.MAX_TASK_TITLE_LENGTH) {
            toast.error(
                `Task title must not exceed ${APP_CONFIG.MAX_TASK_TITLE_LENGTH} characters.`,
            );
            return;
        }

        setIsCreatingTask(true);
        try {
            await api.createTask({
                title: newTitle.trim(),
                description: newDesc.trim() || undefined,
                priority: newPriority,
                columnId: addTaskColId || columns[0]?.id,
                teamId: currentTeam.id,
                createdById: currentUser.id,
                assignedToId: newAssigneeId || undefined,
                date: activeDateStr || getLocalDateString(),
                dueDate: newDueDate || undefined,
                estimatedTime:
                    newEstTime !== ""
                        ? Math.max(0, Number(newEstTime))
                        : undefined,
                isRecurring: newIsRecurring,
                recurrence: newIsRecurring ? newRecurrence : undefined,
            });

            toast.success("Task created successfully");
            onClose();
            setNewTitle("");
            setNewDesc("");
            setNewAssigneeId("");
            setNewDueDate("");
            setNewEstTime("");
            setNewIsRecurring(false);
            loadTasks();
        } catch (err: any) {
            toast.error(err.message || "Failed to create task");
        } finally {
            setIsCreatingTask(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <div
                className="relative bg-white border border-[#E5E5E3] p-5 w-full max-w-xl flex flex-col gap-3.5 animate-fade-in text-left rounded-[3px] corner-brackets max-h-[90vh] overflow-y-auto scrollbar-none"
                style={{ boxShadow: "var(--shadow-float)" }}
            >
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
                    <h2 className="font-heading text-base text-[#1A1A1A]">
                        Create New Task
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[#888883] hover:text-[#1A1A1A] text-[14px] font-bold px-1 transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <form
                    onSubmit={handleCreateTask}
                    className="flex flex-col gap-3"
                >
                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">Title *</label>
                        <input
                            type="text"
                            placeholder="Task title…"
                            value={newTitle}
                            onChange={(e) =>
                                setNewTitle(e.target.value)
                            }
                            maxLength={APP_CONFIG.MAX_TASK_TITLE_LENGTH}
                            className={inputClass}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">Description</label>
                        <TipTapEditor
                            value={newDesc}
                            onChange={(html) => setNewDesc(html)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">Assignee</label>
                            <CustomSelect
                                options={
                                    userRole === "MEMBER" && currentUser
                                        ? [
                                              {
                                                  value: currentUser.id,
                                                  label: `${currentUser.fullName} (You)`,
                                                  avatarUrl:
                                                      currentUser.avatarUrl ||
                                                      null,
                                              },
                                          ]
                                        : [
                                              {
                                                  value: "",
                                                  label: "Unassigned",
                                              },
                                              ...teamMembers.map(
                                                  ({ user }) => ({
                                                      value: user.id,
                                                      label:
                                                          user.id ===
                                                          currentUser?.id
                                                              ? `${user.fullName} (You)`
                                                              : user.fullName,
                                                      avatarUrl:
                                                          user.avatarUrl ||
                                                          null,
                                                  }),
                                              ),
                                          ]
                                }
                                value={newAssigneeId}
                                onChange={(val) =>
                                    setNewAssigneeId(val)
                                }
                                className="w-full"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">Priority</label>
                            <CustomSelect
                                options={[
                                    { value: "LOW", label: "Low" },
                                    {
                                        value: "MEDIUM",
                                        label: "Medium",
                                    },
                                    { value: "HIGH", label: "High" },
                                    {
                                        value: "URGENT",
                                        label: "Urgent",
                                    },
                                ]}
                                value={newPriority}
                                onChange={(val) => setNewPriority(val)}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">Due Date</label>
                            <CustomDatePicker
                                value={newDueDate}
                                onChange={(val) => setNewDueDate(val)}
                                className="w-full"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">
                                Est. Hours
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="0"
                                value={newEstTime}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (
                                        val === "" ||
                                        (Number(val) >= 0 &&
                                            !val.includes("-"))
                                    ) {
                                        setNewEstTime(val);
                                    }
                                }}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="isRecurring"
                            checked={newIsRecurring}
                            onChange={(e) =>
                                setNewIsRecurring(e.target.checked)
                            }
                            className="rounded-[2px] border-[#DADAD6] text-[#1A1A1A] bg-white focus:ring-0 cursor-pointer"
                        />
                        <label
                            htmlFor="isRecurring"
                            className="text-[11px] text-[#1A1A1A] cursor-pointer"
                        >
                            Recurring Task
                        </label>
                    </div>

                    {newIsRecurring && (
                        <div className="flex flex-col gap-1 animate-fade-in">
                            <label className="eyebrow">Interval</label>
                            <CustomSelect
                                options={[
                                    { value: "DAILY", label: "Daily" },
                                    {
                                        value: "WEEKLY",
                                        label: "Weekly",
                                    },
                                    {
                                        value: "MONTHLY",
                                        label: "Monthly",
                                    },
                                ]}
                                value={newRecurrence}
                                onChange={(val) =>
                                    setNewRecurrence(val)
                                }
                                className="w-full"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isCreatingTask}
                            className="relative corner-brackets-4 px-3.5 py-1.5 border border-[#E5E5E3] bg-white hover:bg-[#FAFAF9] text-[11px] font-medium text-[#888883] rounded-[2px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreatingTask}
                            className="relative corner-brackets-4 px-4 py-1.5 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] font-medium text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreatingTask ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                            ) : (
                                <span className="w-1.5 h-1.5 bg-[#555555] rounded-[0.5px] inline-block" />
                            )}
                            <span>
                                {isCreatingTask
                                    ? "Creating Task…"
                                    : "Create Task"}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
