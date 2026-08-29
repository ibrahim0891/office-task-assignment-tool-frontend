"use client";

import React, { useState, useRef, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import {
    Calendar,
    Clock,
    User as UserIcon,
    MoreVertical,
    Edit2,
    Trash2,
    AlertTriangle,
    MessageSquare,
    CheckSquare,
    Paperclip,
} from "lucide-react";
import { UserAvatar } from "../ui/UserAvatar";
import { canModifySubtask } from "../../utils/projectPermissions";

function getInitials(name: string) {
    if (!name) return "";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getPriorityBadge(priority: string) {
    const p = (priority || "MEDIUM").toUpperCase();
    switch (p) {
        case "URGENT":
            return (
                <span className="text-[9px] font-medium text-[var(--priority-urgent)] bg-[var(--priority-urgent)]/10 border border-[var(--priority-urgent)]/20 px-1.5 py-0.5 rounded-[2px] leading-none">
                    Urgent
                </span>
            );
        case "HIGH":
            return (
                <span className="text-[9px] font-medium text-[var(--priority-high)] bg-[var(--priority-high)]/10 border border-[var(--priority-high)]/20 px-1.5 py-0.5 rounded-[2px] leading-none">
                    High
                </span>
            );
        case "MEDIUM":
            return (
                <span className="text-[9px] font-medium text-[var(--priority-medium)] bg-[var(--priority-medium)]/10 border border-[var(--priority-medium)]/20 px-1.5 py-0.5 rounded-[2px] leading-none">
                    Medium
                </span>
            );
        default:
            return (
                <span className="text-[9px] font-medium text-[var(--priority-low)] bg-[var(--priority-low)]/10 border border-[var(--priority-low)]/20 px-1.5 py-0.5 rounded-[2px] leading-none">
                    Low
                </span>
            );
    }
}

function getPriorityStyle(priority: string) {
    const p = (priority || "MEDIUM").toUpperCase();
    switch (p) {
        case "URGENT":
            return "border-l-[3px] border-l-[var(--priority-urgent)]";
        case "HIGH":
            return "border-l-[3px] border-l-[var(--priority-high)]";
        case "MEDIUM":
            return "border-l-[3px] border-l-[var(--priority-medium)]";
        default:
            return "border-l-[3px] border-l-[var(--priority-low)]";
    }
}

interface SubtaskKanbanCardProps {
    subtask: any;
    index: number;
    currentUser: any;
    canManageTasks: boolean;
    candidateAssignees: any[];
    onSelectSubtask: (subtask: any) => void;
    onEditSubtask?: (subtask: any) => void;
    onDeleteSubtask?: (subtaskId: string) => void;
    onReassignSubtask?: (subtaskId: string, newAssigneeId: string) => Promise<void>;
    onToggleComplete?: (subtask: any) => void;
}

export const SubtaskKanbanCard: React.FC<SubtaskKanbanCardProps> = ({
    subtask,
    index,
    currentUser,
    canManageTasks,
    candidateAssignees,
    onSelectSubtask,
    onEditSubtask,
    onDeleteSubtask,
    onReassignSubtask,
    onToggleComplete,
}) => {
    const [cardMenuId, setCardMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const isMySubtask =
        subtask.assignedToId === currentUser?.id ||
        subtask.assignedTo?.id === currentUser?.id;
    const canModifyThisSubtask = canModifySubtask(subtask, currentUser, canManageTasks);
    const isDragDisabled = !canModifyThisSubtask;

    const assigneeName =
        subtask.assignedTo?.name ||
        subtask.assignedTo?.fullName ||
        "Unassigned";

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setCardMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isOverdue =
        subtask.dueDate &&
        !subtask.isCompleted &&
        new Date(subtask.dueDate).getTime() < Date.now();

    const cleanDescription = subtask.description
        ? subtask.description.replace(/<[^>]*>/g, "").trim()
        : "";

    const commentsCount =
        subtask.commentsCount ||
        (Array.isArray(subtask.comments) ? subtask.comments.length : 0);
    const checklistCount =
        subtask.checklistCount ||
        (Array.isArray(subtask.checklist) ? subtask.checklist.length : 0);
    const attachmentsCount =
        subtask.attachmentsCount ||
        (Array.isArray(subtask.attachments) ? subtask.attachments.length : 0);

    return (
        <Draggable
            draggableId={subtask.id}
            index={index}
            isDragDisabled={isDragDisabled}
        >
            {(dragProvided, dragSnapshot) => (
                <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    data-task-card-id={subtask.id}
                    onClick={() => onSelectSubtask(subtask)}
                    style={{
                        ...dragProvided.draggableProps.style,
                        ...(dragSnapshot.isDragging
                            ? {
                                  transform: `${
                                      dragProvided.draggableProps.style?.transform || ""
                                  } scale(1.035)`,
                                  boxShadow:
                                      "0 18px 32px -4px rgba(0,0,0,0.18), 0 8px 12px -6px rgba(0,0,0,0.1)",
                                  zIndex: 99999,
                              }
                            : {}),
                    }}
                    className={`kanban-task-card group relative p-2.5 bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] flex flex-col gap-2 transition-all text-left corner-brackets-4 ${getPriorityStyle(
                        subtask.priority || "MEDIUM"
                    )} ${
                        dragSnapshot.isDragging
                            ? "border-[var(--app-text)] bg-[var(--app-bg)] ring-1 ring-[var(--app-border-strong)]"
                            : ""
                    } ${
                        subtask.isCompleted ? "opacity-75" : ""
                    } ${
                        !isDragDisabled
                            ? "cursor-grab active:cursor-grabbing"
                            : "cursor-pointer"
                    }`}
                >
                    {/* Section 1: Title & 3-dot Menu */}
                    <div className="flex items-start justify-between gap-2">
                        <h4
                            className={`text-[14px] font-semibold text-[var(--app-text)] leading-snug line-clamp-2 min-w-0 flex-1 capitalize ${
                                subtask.isCompleted
                                    ? "line-through text-[var(--app-muted)] font-normal"
                                    : ""
                            }`}
                        >
                            {subtask.title}
                        </h4>

                        {/* 3-dot menu trigger visible on hover */}
                        {canModifyThisSubtask && (
                            <div
                                className="relative shrink-0 -mt-0.5 -mr-1"
                                ref={menuRef}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCardMenuId(
                                            cardMenuId === subtask.id ? null : subtask.id
                                        )
                                    }
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--app-hover-bg)] rounded-[2px] border border-transparent hover:border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-all cursor-pointer"
                                    title="Subtask options"
                                >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {cardMenuId === subtask.id && (
                                    <div className="absolute right-0 top-6 z-50 w-36 bg-[var(--app-card)] border border-[var(--app-border-strong)] rounded-[2px] shadow-lg py-1 flex flex-col text-[11px] select-none animate-fade-in">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCardMenuId(null);
                                                onSelectSubtask(subtask);
                                            }}
                                            className="w-full text-left px-3 py-1.5 hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] flex items-center gap-2 transition-colors cursor-pointer"
                                        >
                                            <Edit2 className="w-3 h-3 text-[var(--app-muted)]" />
                                            <span>Open Details</span>
                                        </button>

                                        {onDeleteSubtask && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCardMenuId(null);
                                                    onDeleteSubtask(subtask.id);
                                                }}
                                                className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-error)]/10 text-[var(--color-error)] flex items-center gap-2 transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="w-3 h-3 text-[var(--color-error)]" />
                                                <span>Delete</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section 2: Description snippet (single line clamp) */}
                    {cleanDescription && (
                        <p
                            className="text-[11px] text-[var(--app-muted)] -mt-0.5 line-clamp-1 leading-relaxed"
                            title={cleanDescription}
                        >
                            {cleanDescription}
                        </p>
                    )}

                    {/* Section 3: Priority Badge & Reviewer Attribution */}
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                            {getPriorityBadge(subtask.priority)}
                        </div>

                        {subtask.reviewer?.name && (
                            <span
                                className="text-[9px] text-[var(--app-muted)] truncate max-w-[50%] text-right shrink-0"
                                title={`Reviewer: ${subtask.reviewer.name}`}
                            >
                                rev by <span className="capitalize font-medium">{subtask.reviewer.name}</span>
                            </span>
                        )}
                    </div>

                    {/* Section 4: Footer (Assignee on Left, Checklist / Comments / Attachments / Est Days / Dates on Right) */}
                    <div className="pt-2 border-t border-[var(--app-border)] flex justify-between items-center gap-2 text-[10px] text-[var(--app-muted)]">
                        {/* Assignee Badge with (You) chip */}
                        <div
                            className="flex items-center gap-1.5 min-w-0 max-w-[55%]"
                            title={isMySubtask ? `Assigned to you (${assigneeName})` : `Assigned to ${assigneeName}`}
                        >
                            <UserAvatar
                                name={assigneeName}
                                avatarUrl={subtask.assignedTo?.avatarUrl}
                                size="xs"
                                title={assigneeName}
                            />
                            <span
                                className="truncate font-medium text-[var(--app-text)] text-[10px]"
                                title={assigneeName}
                            >
                                {assigneeName}
                            </span>
                            {isMySubtask && (
                                <span className="text-[7.5px] font-semibold px-1 py-0.2 bg-[var(--app-text)] text-[var(--app-bg)] rounded-[1px] shrink-0">
                                    You
                                </span>
                            )}
                        </div>

                        {/* Opposite side: Checklist, Comment Count, Attachments, Est Days & Due Date */}
                        <div className="flex items-center gap-2 text-[10px] text-[var(--app-muted)] shrink-0">
                            {checklistCount > 0 && (
                                <div
                                    className="inline-flex items-center gap-1 leading-none"
                                    title={`Checklist items: ${checklistCount}`}
                                >
                                    <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                                    <span className="text-[10px] font-medium leading-none tabular-nums">
                                        {checklistCount}
                                    </span>
                                </div>
                            )}

                            {commentsCount > 0 && (
                                <div
                                    className="inline-flex items-center gap-1 leading-none"
                                    title={`${commentsCount} comment${commentsCount === 1 ? "" : "s"}`}
                                >
                                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                    <span className="text-[10px] font-medium leading-none tabular-nums">
                                        {commentsCount}
                                    </span>
                                </div>
                            )}

                            {attachmentsCount > 0 && (
                                <div
                                    className="inline-flex items-center gap-1 leading-none"
                                    title={`${attachmentsCount} attachment${attachmentsCount === 1 ? "" : "s"}`}
                                >
                                    <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                    <span className="text-[10px] font-medium leading-none tabular-nums">
                                        {attachmentsCount}
                                    </span>
                                </div>
                            )}

                            {subtask.estimatedDays > 0 && (
                                <span
                                    className="inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums"
                                    title={`Estimated days: ${subtask.estimatedDays}d`}
                                >
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span>{subtask.estimatedDays}d</span>
                                </span>
                            )}

                            {subtask.dueDate && (
                                <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-medium tabular-nums px-1 py-0.2 rounded-[1px] ${
                                        isOverdue
                                            ? "text-[var(--color-error)] bg-[var(--color-error)]/10 font-semibold"
                                            : ""
                                    }`}
                                    title={`Due date: ${new Date(subtask.dueDate).toLocaleDateString()}`}
                                >
                                    {isOverdue && <AlertTriangle className="w-2.5 h-2.5" />}
                                    <Calendar className="w-3 h-3 shrink-0" />
                                    <span>
                                        {new Date(subtask.dueDate).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};
