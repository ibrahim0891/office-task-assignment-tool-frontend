"use client";

import React, { useState, useEffect } from "react";
import {
    CalendarRange,
    Users,
    X,
    Loader2,
    ChevronRight,
    Check,
} from "lucide-react";
import ModalWrapper from "../ui/ModalWrapper";
import { Button } from "../ui/Button";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { UserAvatar } from "../ui/UserAvatar";
import { extractDateString } from "../../utils/date";
import toast from "react-hot-toast";

interface BulkUpdateSubtasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    subtaskCount: number;
    /** candidateAssignees — array of { id, name, avatarUrl } */
    candidateAssignees: any[];
    projectStartDate?: string | null;
    projectEndDate?: string | null;
    onUpdate: (data: {
        startDate?: string;
        dueDate?: string;
        assignedToId?: string;
    }) => Promise<void>;
}

type ActiveTab = "dates" | "assignee";

export default function BulkUpdateSubtasksModal({
    isOpen,
    onClose,
    subtaskCount,
    candidateAssignees,
    projectStartDate,
    projectEndDate,
    onUpdate,
}: BulkUpdateSubtasksModalProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("dates");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dates tab
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");

    // Assignee tab — single-select (radio)
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    const projMin = projectStartDate ? (extractDateString(projectStartDate) ?? undefined) : undefined;
    const projMax = projectEndDate ? (extractDateString(projectEndDate) ?? undefined) : undefined;

    useEffect(() => {
        if (isOpen) {
            setActiveTab("dates");
            setStartDate("");
            setDueDate("");
            setSelectedUserId("");
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const canSubmit =
        activeTab === "dates"
            ? Boolean(startDate || dueDate)
            : Boolean(selectedUserId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (activeTab === "dates") {
            if (!startDate && !dueDate) {
                toast.error("Set at least one date to update.");
                return;
            }
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
            if (!selectedUserId) {
                toast.error("Select a member to assign.");
                return;
            }
            setIsSubmitting(true);
            try { await onUpdate({ assignedToId: selectedUserId }); onClose(); }
            catch { /* caller shows toast */ }
            finally { setIsSubmitting(false); }
        }
    };

    const submitLabel = () => {
        if (isSubmitting) return "Updating...";
        const t = `${subtaskCount} ${subtaskCount === 1 ? "subtask" : "subtasks"}`;
        if (activeTab === "dates") return `Update ${t}`;
        const assignee = candidateAssignees.find((a) => a.id === selectedUserId);
        return assignee ? `Assign to ${assignee.name} (${t})` : `Assign ${t}`;
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
                                Bulk Update — {subtaskCount} {subtaskCount === 1 ? "Subtask" : "Subtasks"}
                            </h3>
                            <p className="text-[11px] text-[var(--app-muted)]">
                                Update dates or assignee for all selected subtasks
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tab Bar */}
                <div className="flex border-b border-[var(--app-border)] bg-[var(--app-bg)] shrink-0">
                    {(["dates", "assignee"] as ActiveTab[]).map((tab) => (
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
                            {tab === "dates"
                                ? <CalendarRange className="w-3.5 h-3.5" />
                                : <Users className="w-3.5 h-3.5" />}
                            {tab === "dates" ? "Dates" : "Assignee"}
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

                    {/* ── Assignee tab ── */}
                    {activeTab === "assignee" && (
                        <div className="p-5 flex flex-col gap-3">
                            <p className="text-[11px] text-[var(--app-muted)]">
                                The selected member will be set as the sole assignee for all {subtaskCount} subtasks.
                            </p>

                            {candidateAssignees.length === 0 ? (
                                <p className="text-xs text-[var(--app-muted)] text-center py-4">
                                    No assignable members found.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                                    {candidateAssignees.map((member) => {
                                        const isChosen = selectedUserId === member.id;
                                        return (
                                            <button
                                                key={member.id}
                                                type="button"
                                                onClick={() => setSelectedUserId(member.id)}
                                                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-[3px] border text-left transition-all cursor-pointer ${
                                                    isChosen
                                                        ? "bg-[var(--color-accent)]/5 border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20"
                                                        : "bg-[var(--app-card)] border-[var(--app-border)] hover:bg-[var(--app-hover-bg)]"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <UserAvatar
                                                        name={member.name}
                                                        avatarUrl={member.avatarUrl}
                                                        size="md"
                                                        showBorder={false}
                                                    />
                                                    <span className="text-xs font-semibold text-[var(--app-text)] truncate">
                                                        {member.name}
                                                    </span>
                                                </div>
                                                {/* Radio indicator */}
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                                    isChosen
                                                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                                                        : "border-[var(--app-border)] bg-[var(--app-card)]"
                                                }`}>
                                                    {isChosen && <Check className="w-2.5 h-2.5" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--app-border)] bg-[var(--app-bg)]">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isSubmitting || !canSubmit}
                            icon={
                                isSubmitting
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <ChevronRight className="w-3.5 h-3.5" />
                            }
                        >
                            {submitLabel()}
                        </Button>
                    </div>
                </form>
            </div>
        </ModalWrapper>
    );
}
