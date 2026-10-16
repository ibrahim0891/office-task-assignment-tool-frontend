"use client";

import React, { useState, useEffect } from "react";
import { CalendarRange, X, Loader2, ChevronRight, Users, UserPlus, UserMinus, Check } from "lucide-react";
import ModalWrapper from "../ui/ModalWrapper";
import { Button } from "../ui/Button";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { UserAvatar } from "../ui/UserAvatar";
import { extractDateString } from "../../utils/date";
import toast from "react-hot-toast";

interface BulkUpdateTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskCount: number;
    /** project.members — each item has { userId, user: { id, name, fullName, avatarUrl } } */
    members: any[];
    projectStartDate?: string | null;
    projectEndDate?: string | null;
    onUpdate: (data: {
        startDate?: string;
        dueDate?: string;
        assigneeIds?: string[];
        assignMode?: "assign" | "unassign";
    }) => Promise<void>;
}

type ActiveTab = "dates" | "assignees";

export default function BulkUpdateTasksModal({
    isOpen,
    onClose,
    taskCount,
    members,
    projectStartDate,
    projectEndDate,
    onUpdate,
}: BulkUpdateTasksModalProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("dates");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dates tab state
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");

    // Assignees tab state
    const [assignMode, setAssignMode] = useState<"assign" | "unassign">("assign");
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    const projMin = projectStartDate ? (extractDateString(projectStartDate) ?? undefined) : undefined;
    const projMax = projectEndDate ? (extractDateString(projectEndDate) ?? undefined) : undefined;

    useEffect(() => {
        if (isOpen) {
            setActiveTab("dates");
            setStartDate("");
            setDueDate("");
            setAssignMode("assign");
            setSelectedUserIds(new Set());
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const toggleUser = (userId: string) => {
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            next.has(userId) ? next.delete(userId) : next.add(userId);
            return next;
        });
    };

    // Whether the current tab has something valid to submit
    const canSubmitDates = Boolean(startDate || dueDate);
    const canSubmitAssignees = selectedUserIds.size > 0;
    const canSubmit = activeTab === "dates" ? canSubmitDates : canSubmitAssignees;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (activeTab === "dates") {
            if (!canSubmitDates) { toast.error("Set at least one date to update."); return; }
            if (startDate && dueDate && startDate > dueDate) {
                toast.error("Start date cannot be later than due date.");
                return;
            }
            const payload: { startDate?: string; dueDate?: string } = {};
            if (startDate) payload.startDate = startDate;
            if (dueDate) payload.dueDate = dueDate;
            setIsSubmitting(true);
            try { await onUpdate(payload); onClose(); }
            catch { /* caller shows toast */ }
            finally { setIsSubmitting(false); }
        } else {
            if (!canSubmitAssignees) { toast.error("Select at least one member."); return; }
            setIsSubmitting(true);
            try {
                await onUpdate({
                    assigneeIds: Array.from(selectedUserIds),
                    assignMode,
                });
                onClose();
            } catch { /* caller shows toast */ }
            finally { setIsSubmitting(false); }
        }
    };

    const submitLabel = () => {
        if (isSubmitting) return "Updating...";
        const t = `${taskCount} ${taskCount === 1 ? "task" : "tasks"}`;
        if (activeTab === "dates") return `Update ${t}`;
        const u = selectedUserIds.size;
        const p = `${u} ${u === 1 ? "person" : "people"}`;
        return assignMode === "assign" ? `Assign ${p} to ${t}` : `Unassign ${p} from ${t}`;
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
            <div className="flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--app-border)] bg-[var(--app-bg)]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[3px] bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center shrink-0">
                            {activeTab === "dates"
                                ? <CalendarRange className="w-4 h-4" />
                                : <Users className="w-4 h-4" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[var(--app-text)]">
                                Bulk Update — {taskCount} {taskCount === 1 ? "Task" : "Tasks"}
                            </h3>
                            <p className="text-[11px] text-[var(--app-muted)]">
                                Update dates or assignees for all selected tasks
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tab Bar */}
                <div className="flex border-b border-[var(--app-border)] bg-[var(--app-bg)] shrink-0">
                    {(["dates", "assignees"] as ActiveTab[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                                activeTab === tab
                                    ? "border-[var(--color-accent)] text-[var(--app-text)]"
                                    : "border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                        >
                            {tab === "dates" ? <CalendarRange className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                            {tab === "dates" ? "Dates" : "Assignees"}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ── Dates tab ── */}
                    {activeTab === "dates" && (
                        <div className="p-5 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wide">
                                    Start Date
                                </label>
                                <CustomDatePicker
                                    value={startDate}
                                    onChange={setStartDate}
                                    minDate={projMin}
                                    maxDate={dueDate || projMax}
                                    align="left"
                                    placeholder="Leave blank to keep existing"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wide">
                                    Due Date
                                </label>
                                <CustomDatePicker
                                    value={dueDate}
                                    onChange={setDueDate}
                                    minDate={startDate || projMin}
                                    maxDate={projMax}
                                    align="left"
                                    placeholder="Leave blank to keep existing"
                                />
                            </div>
                            {projMin && projMax && (
                                <p className="text-[10px] text-[var(--app-muted)] bg-[var(--app-hover-bg)] border border-[var(--app-border)] rounded-[3px] px-3 py-2">
                                    Must be within project range:{" "}
                                    <span className="font-semibold text-[var(--app-text)]">{projMin}</span>
                                    {" – "}
                                    <span className="font-semibold text-[var(--app-text)]">{projMax}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Assignees tab ── */}
                    {activeTab === "assignees" && (
                        <div className="p-5 flex flex-col gap-4">
                            {/* Assign / Unassign mode toggle */}
                            <div className="flex items-center bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-0.5 gap-0.5 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setAssignMode("assign")}
                                    className={`flex-1 flex items-center justify-center gap-1.5 h-7 rounded-[2px] transition-colors cursor-pointer ${
                                        assignMode === "assign"
                                            ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs border border-[var(--app-border)]"
                                            : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                    }`}
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    Assign
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAssignMode("unassign")}
                                    className={`flex-1 flex items-center justify-center gap-1.5 h-7 rounded-[2px] transition-colors cursor-pointer ${
                                        assignMode === "unassign"
                                            ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs border border-[var(--app-border)]"
                                            : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                    }`}
                                >
                                    <UserMinus className="w-3.5 h-3.5" />
                                    Unassign
                                </button>
                            </div>

                            {/* Member list */}
                            {members.length === 0 ? (
                                <p className="text-xs text-[var(--app-muted)] text-center py-4">
                                    No members in this project.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                                    {members.map((member: any) => {
                                        const user = member.user ?? member;
                                        const userId = member.userId ?? user.id;
                                        const name = user.name || user.fullName || "Unknown";
                                        const isSelected = selectedUserIds.has(userId);
                                        return (
                                            <button
                                                key={userId}
                                                type="button"
                                                onClick={() => toggleUser(userId)}
                                                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-[3px] border text-left transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-[var(--color-accent)]/5 border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20"
                                                        : "bg-[var(--app-card)] border-[var(--app-border)] hover:bg-[var(--app-hover-bg)]"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <UserAvatar
                                                        name={name}
                                                        avatarUrl={user.avatarUrl}
                                                        size="md"
                                                        showBorder={false}
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-semibold text-[var(--app-text)] truncate">
                                                            {name}
                                                        </span>
                                                        {user.designation && (
                                                            <span className="text-[10px] text-[var(--app-muted)] truncate">
                                                                {user.designation}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                                    isSelected
                                                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                                                        : "border-[var(--app-border)] bg-[var(--app-card)]"
                                                }`}>
                                                    {isSelected && <Check className="w-2.5 h-2.5" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {selectedUserIds.size > 0 && (
                                <p className="text-[11px] text-[var(--app-muted)] text-center">
                                    {selectedUserIds.size} {selectedUserIds.size === 1 ? "person" : "people"} selected
                                    {assignMode === "assign"
                                        ? ` will be added to all ${taskCount} tasks`
                                        : ` will be removed from all ${taskCount} tasks`}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--app-border)] bg-[var(--app-bg)]">
                        <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isSubmitting || !canSubmit}
                            icon={isSubmitting
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <ChevronRight className="w-3.5 h-3.5" />}
                        >
                            {submitLabel()}
                        </Button>
                    </div>
                </form>
            </div>
        </ModalWrapper>
    );
}
