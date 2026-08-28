"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    X,
    Loader2,
    Calendar,
    Clock,
    User,
    Trash2,
    MessageSquare,
    FileText,
    History,
    Paperclip,
    Send,
    CheckCircle2,
    Circle,
    AlertTriangle,
    Upload,
    Maximize2,
    CornerDownRight,
    Edit2,
    Check,
    MoreHorizontal,
    MoreVertical,
    Copy,
    RotateCcw,
    Edit3,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api";
import { useProjectComments } from "../../hooks/useProjectSWR";
import { UserAvatar } from "../ui/UserAvatar";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { CustomSelect, SelectOption } from "../ui/CustomSelect";
import { TipTapEditor } from "../ui/TipTapEditor";
import ModalWrapper from "../ui/ModalWrapper";
import { triggerMicroCelebration } from "../../utils/confetti";
import { playFeedback } from "../../utils/feedback";

interface ProjectSubtaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    parentTask: any;
    subtask?: any | null; // If null, creates a new subtask. If provided, updates existing subtask.
    columns?: any[];
    initialColumnStatus?: string;
    currentUser: any;
    canManageTasks: boolean;
    candidateAssignees: any[];
    onRefresh?: () => void;
}

export default function ProjectSubtaskModal({
    isOpen,
    onClose,
    projectId,
    parentTask,
    subtask,
    columns = [],
    initialColumnStatus = "Backlog",
    currentUser,
    canManageTasks,
    candidateAssignees,
    onRefresh,
}: ProjectSubtaskModalProps) {
    const isEditMode = Boolean(subtask?.id);
    const isMySubtask =
        subtask?.assignedToId === currentUser?.id ||
        subtask?.assignedTo?.id === currentUser?.id;
    const canModifyThisSubtask = !isEditMode || canManageTasks || isMySubtask;

    // Form fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [columnId, setColumnId] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [assignedToId, setAssignedToId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [estimatedDays, setEstimatedDays] = useState(1);
    const [actualDays, setActualDays] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState<
        "description" | "comments" | "activity" | "attachments"
    >("description");

    // Comments state
    const [comments, setComments] = useState<any[]>([]);
    const [newCommentText, setNewCommentText] = useState("");
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [openMenuCommentId, setOpenMenuCommentId] = useState<string | null>(null);
    const commentsListRef = useRef<HTMLDivElement>(null);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Close comment 3-dot menu on click outside
    useEffect(() => {
        const handleOutsideMousedown = (e: MouseEvent) => {
            if (!openMenuCommentId) return;
            const target = e.target as HTMLElement | null;
            if (!target || !target.closest(`[data-comment-menu="${openMenuCommentId}"]`)) {
                setOpenMenuCommentId(null);
            }
        };

        if (openMenuCommentId) {
            document.addEventListener("mousedown", handleOutsideMousedown);
            return () => document.removeEventListener("mousedown", handleOutsideMousedown);
        }
    }, [openMenuCommentId]);

    const scrollToBottom = (smooth = true) => {
        const performScroll = () => {
            if (commentsListRef.current) {
                commentsListRef.current.scrollTo({
                    top: commentsListRef.current.scrollHeight + 5000,
                    behavior: smooth ? "smooth" : "auto",
                });
            }
            if (commentsEndRef.current) {
                commentsEndRef.current.scrollIntoView({
                    behavior: smooth ? "smooth" : "auto",
                    block: "end",
                });
            }
        };

        performScroll();
        if (typeof window !== "undefined") {
            requestAnimationFrame(performScroll);
        }
    };

    // Activity log state
    const [activities, setActivities] = useState<any[]>([]);

    // Attachments state
    const [attachments, setAttachments] = useState<any[]>([]);

    // Format dates helper
    const toYMD = (dateInput: any) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
    };

    const getInitials = (name: string) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    useEffect(() => {
        if (!isOpen) return;

        if (subtask) {
            setTitle(subtask.title || "");
            setDescription(subtask.description || "");
            setPriority(subtask.priority || "MEDIUM");
            setAssignedToId(subtask.assignedToId || subtask.assignedTo?.id || "");
            setColumnId(subtask.columnId || columns[0]?.id || "");
            setStartDate(toYMD(subtask.startDate) || toYMD(parentTask?.startDate) || toYMD(new Date()));
            setDueDate(toYMD(subtask.dueDate) || toYMD(parentTask?.dueDate) || toYMD(new Date()));
            setEstimatedDays(Number(subtask.estimatedDays) || 1);
            setActualDays(Number(subtask.actualDays) || 0);
            setIsCompleted(Boolean(subtask.isCompleted));

            // Populate initial comments from subtask object if available
            if (Array.isArray(subtask.comments) && subtask.comments.length > 0) {
                setComments(
                    subtask.comments.map((c: any) => ({
                        id: c.id,
                        text: c.content || c.text,
                        user: {
                            id: c.user?.id || c.userId,
                            name: c.user?.name || c.user?.fullName || "User",
                            avatarUrl: c.user?.avatarUrl,
                        },
                        createdAt: c.createdAt,
                    }))
                );
            }

            setActivities(
                Array.isArray(subtask.activities) && subtask.activities.length > 0
                    ? subtask.activities
                    : [
                          {
                              id: "act-1",
                              action: "CREATED",
                              description: `Subtask "${subtask.title}" created.`,
                              timestamp: subtask.createdAt || new Date().toISOString(),
                              user: subtask.assignedTo || currentUser,
                          },
                          ...(subtask.isCompleted
                              ? [
                                    {
                                        id: "act-2",
                                        action: "COMPLETED",
                                        description: `Marked subtask as completed.`,
                                        timestamp: subtask.updatedAt || new Date().toISOString(),
                                        user: subtask.assignedTo || currentUser,
                                    },
                                ]
                              : []),
                      ]
            );

            setAttachments(Array.isArray(subtask.attachments) ? subtask.attachments : []);
        } else {
            setTitle("");
            setDescription("");
            setPriority("MEDIUM");
            if (!canManageTasks) {
                setAssignedToId(currentUser?.id || "");
            } else {
                setAssignedToId(candidateAssignees[0]?.id || currentUser?.id || "");
            }
            setColumnId(columns[0]?.id || "");
            setStartDate(toYMD(parentTask?.startDate) || toYMD(new Date()));
            setDueDate(toYMD(parentTask?.dueDate) || toYMD(new Date()));
            setEstimatedDays(1);
            setActualDays(0);
            setIsCompleted(initialColumnStatus === "Completed" || initialColumnStatus === "Done");
            setComments([]);
            setActivities([]);
            setAttachments([]);
        }
    }, [isOpen, subtask?.id]);

    const mapCommentData = (c: any) => ({
        id: c.id,
        text: c.content || c.text,
        user: {
            id: c.user?.id || c.userId,
            name: c.user?.name || c.user?.fullName || "User",
            avatarUrl: c.user?.avatarUrl,
        },
        isResolved: Boolean(c.isResolved),
        resolvedBy: c.resolvedBy
            ? {
                  id: c.resolvedBy.id,
                  name: c.resolvedBy.name || c.resolvedBy.fullName || "User",
                  avatarUrl: c.resolvedBy.avatarUrl,
              }
            : null,
        resolvedAt: c.resolvedAt,
        isEdited: Boolean(c.isEdited),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
    });

    const targetTaskId = parentTask?.id || subtask?.parentTaskId;
    const { comments: fetchedComments, isLoading: swrLoadingComments, mutate: mutateComments } = useProjectComments(
        isOpen ? projectId : undefined,
        isOpen ? targetTaskId : undefined,
        isOpen && subtask?.id ? subtask.id : undefined
    );

    // Sync SWR fetched comments to local state
    useEffect(() => {
        if (fetchedComments && fetchedComments.length >= 0) {
            setComments(fetchedComments.map(mapCommentData));
        }
    }, [fetchedComments]);

    // Auto-scroll to bottom of comments list whenever comments change or when tab switches
    useEffect(() => {
        if (activeTab === "comments" && comments.length > 0) {
            scrollToBottom(false);
            const timer = setTimeout(() => {
                scrollToBottom(true);
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [comments, activeTab]);

    // Real-time socket event listeners for comments
    useEffect(() => {
        if (!isOpen || !subtask?.id) return;

        const handleCommentCreated = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { subtaskId, comment, activity } = customEvent.detail || {};
            if (subtaskId === subtask.id && comment) {
                const mapped = mapCommentData(comment);
                setComments((prev) => {
                    // 1. If real comment already present by ID, ignore
                    if (prev.some((c) => c.id === comment.id)) return prev;

                    // 2. If there is a matching optimistic temp comment, replace it with the real comment
                    const tempIndex = prev.findIndex(
                        (c) =>
                            c.id.startsWith("temp-") &&
                            (c.user?.id === mapped.user.id) &&
                            c.text === mapped.text
                    );

                    if (tempIndex !== -1) {
                        const updated = [...prev];
                        updated[tempIndex] = mapped;
                        return updated;
                    }

                    // 3. Otherwise append as new comment
                    return [...prev, mapped];
                });

                if (activity) {
                    setActivities((prev) => {
                        if (prev.some((a) => a.id === activity.id)) return prev;
                        return [
                            {
                                id: activity.id,
                                action: "COMMENT",
                                description:
                                    JSON.parse(activity.details || "{}").note ||
                                    `Commented: "${comment.content.slice(0, 40)}..."`,
                                timestamp: activity.createdAt,
                                user: activity.user,
                            },
                            ...prev,
                        ];
                    });
                }

                setTimeout(() => {
                    scrollToBottom(true);
                }, 80);
            }
        };

        const handleCommentUpdated = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { subtaskId, comment } = customEvent.detail || {};
            if (subtaskId === subtask.id && comment) {
                const mapped = mapCommentData(comment);
                setComments((prev) =>
                    prev.map((c) => (c.id === comment.id ? mapped : c))
                );
            }
        };

        const handleCommentResolved = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { subtaskId, comment, activity } = customEvent.detail || {};
            if (subtaskId === subtask.id && comment) {
                const mapped = mapCommentData(comment);
                setComments((prev) =>
                    prev.map((c) => (c.id === comment.id ? mapped : c))
                );
                if (activity) {
                    setActivities((prev) => {
                        if (prev.some((a) => a.id === activity.id)) return prev;
                        return [
                            {
                                id: activity.id,
                                action: activity.actionType || "COMMENT",
                                description:
                                    JSON.parse(activity.details || "{}").note ||
                                    (comment.isResolved ? "Resolved comment thread" : "Reopened comment thread"),
                                timestamp: activity.createdAt,
                                user: activity.user,
                            },
                            ...prev,
                        ];
                    });
                }
            }
        };

        const handleCommentDeleted = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { subtaskId, commentId } = customEvent.detail || {};
            if (subtaskId === subtask.id && commentId) {
                setComments((prev) => prev.filter((c) => c.id !== commentId));
            }
        };

        window.addEventListener("project_task_comment_created", handleCommentCreated);
        window.addEventListener("project_task_comment_updated", handleCommentUpdated);
        window.addEventListener("project_task_comment_resolved", handleCommentResolved);
        window.addEventListener("project_task_comment_deleted", handleCommentDeleted);
        return () => {
            window.removeEventListener("project_task_comment_created", handleCommentCreated);
            window.removeEventListener("project_task_comment_updated", handleCommentUpdated);
            window.removeEventListener("project_task_comment_resolved", handleCommentResolved);
            window.removeEventListener("project_task_comment_deleted", handleCommentDeleted);
        };
    }, [isOpen, subtask?.id]);

    const priorityOptions: SelectOption[] = [
        { value: "LOW", label: "Low Priority" },
        { value: "MEDIUM", label: "Medium Priority" },
        { value: "HIGH", label: "High Priority" },
        { value: "URGENT", label: "Urgent Priority" },
    ];

    const assigneeOptions: SelectOption[] = (candidateAssignees || []).map((c) => ({
        value: c.id,
        label: c.name,
        avatarUrl: c.avatarUrl !== undefined ? c.avatarUrl : (c.user?.avatarUrl ?? null),
    }));

    if (subtask?.assignedTo && !assigneeOptions.some((o) => o.value === (subtask.assignedTo.id || subtask.assignedToId))) {
        assigneeOptions.unshift({
            value: subtask.assignedTo.id || subtask.assignedToId,
            label: subtask.assignedTo.name || subtask.assignedTo.fullName || "Assigned Member",
            avatarUrl: subtask.assignedTo.avatarUrl ?? null,
        });
    }

    const columnOptions: SelectOption[] = columns.map((c) => ({
        value: c.id,
        label: c.name,
    }));

    const handleSaveSubtask = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!title.trim()) {
            toast.error("Please enter a subtask title");
            return;
        }

        let targetAssigneeId = assignedToId;
        if (!canManageTasks) {
            targetAssigneeId = currentUser?.id || "";
        }

        const subtaskPayload: any = {
            title: title.trim(),
            description: description.trim(),
            priority,
            assignedToId: targetAssigneeId,
            columnId,
            startDate,
            dueDate,
            estimatedDays,
            actualDays,
            isCompleted,
        };

        try {
            setSubmitting(true);
            if (isEditMode && subtask?.id) {
                await api.updateProjectSubtask(projectId, parentTask.id, subtask.id, subtaskPayload);
                toast.success("Subtask updated successfully!");
            } else {
                await api.createProjectSubtask(projectId, parentTask.id, subtaskPayload);
                toast.success("Subtask created successfully!");
            }
            if (onRefresh) onRefresh();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to save subtask");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;

        const text = newCommentText.trim();
        setNewCommentText("");

        const targetTaskId = parentTask?.id || subtask?.parentTaskId;

        if (!isEditMode || !subtask?.id || !projectId || !targetTaskId) {
            const newComment = {
                id: `c-${Date.now()}`,
                text,
                createdAt: new Date().toISOString(),
                user: {
                    id: currentUser?.id,
                    name: currentUser?.name || currentUser?.fullName || "You",
                    avatarUrl: currentUser?.avatarUrl || null,
                },
            };
            setComments((prev) => [...prev, newComment]);
            return;
        }

        const tempId = `temp-${Date.now()}`;
        const optimisticComment = {
            id: tempId,
            text,
            createdAt: new Date().toISOString(),
            user: {
                id: currentUser?.id,
                name: currentUser?.name || currentUser?.fullName || "You",
                avatarUrl: currentUser?.avatarUrl || null,
            },
        };
        setComments((prev) => [...prev, optimisticComment]);

        try {
            setIsPostingComment(true);
            const result = await api.createProjectTaskComment(
                projectId,
                targetTaskId,
                text,
                subtask.id
            );
            if (result?.comment) {
                setComments((prev) => {
                    const alreadyExists = prev.some((c) => c.id === result.comment.id);
                    if (alreadyExists) {
                        return prev.filter((c) => c.id !== tempId);
                    }
                    return prev.map((c) =>
                        c.id === tempId
                            ? {
                                  id: result.comment.id,
                                  text: result.comment.content,
                                  user: {
                                      id: result.comment.user?.id || result.comment.userId,
                                      name: result.comment.user?.name || result.comment.user?.fullName || "User",
                                      avatarUrl: result.comment.user?.avatarUrl,
                                  },
                                  createdAt: result.comment.createdAt,
                              }
                            : c
                    );
                });

                if (result.activity) {
                    setActivities((prev) => {
                        if (prev.some((a) => a.id === result.activity.id)) return prev;
                        return [
                            {
                                id: result.activity.id,
                                action: "COMMENT",
                                description:
                                    JSON.parse(result.activity.details || "{}").note ||
                                    `Commented: "${text.slice(0, 40)}..."`,
                                timestamp: result.activity.createdAt,
                                user: result.activity.user,
                            },
                            ...prev,
                        ];
                    });
                }
            }
            setTimeout(() => {
                scrollToBottom(true);
            }, 60);
            toast.success("Comment posted");
            mutateComments();
        } catch (err: any) {
            toast.error(err.message || "Failed to post comment");
            setComments((prev) => prev.filter((c) => c.id !== tempId));
        } finally {
            setIsPostingComment(false);
        }
    };

    const handleStartEdit = (comment: any) => {
        setEditingCommentId(comment.id);
        setEditingCommentText(comment.text);
        setOpenMenuCommentId(null);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingCommentText("");
    };

    const handleSaveEdit = async (commentId: string) => {
        const targetTaskId = parentTask?.id || subtask?.parentTaskId;
        if (!editingCommentText.trim() || !projectId || !targetTaskId) return;

        const text = editingCommentText.trim();
        try {
            setIsSavingEdit(true);
            await api.updateProjectTaskComment(projectId, targetTaskId, commentId, text);
            setComments((prev) =>
                prev.map((c) =>
                    c.id === commentId
                        ? {
                              ...c,
                              text,
                              isEdited: true,
                          }
                        : c
                )
            );
            setEditingCommentId(null);
            setEditingCommentText("");
            toast.success("Comment updated");
            mutateComments();
        } catch (err: any) {
            toast.error(err.message || "Failed to update comment");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleToggleResolve = async (comment: any) => {
        const targetTaskId = parentTask?.id || subtask?.parentTaskId;
        if (!projectId || !targetTaskId) return;

        const nextState = !comment.isResolved;
        // Optimistic UI update
        setComments((prev) =>
            prev.map((c) =>
                c.id === comment.id
                    ? {
                          ...c,
                          isResolved: nextState,
                          resolvedBy: nextState
                              ? { id: currentUser?.id, name: currentUser?.name || currentUser?.fullName || "You" }
                              : null,
                          resolvedAt: nextState ? new Date().toISOString() : null,
                      }
                    : c
            )
        );

        if (nextState) {
            triggerMicroCelebration({ intensity: "subtle" });
            playFeedback();
        }

        try {
            await api.toggleResolveProjectTaskComment(projectId, targetTaskId, comment.id, nextState);
            toast.success(nextState ? "Comment marked as resolved" : "Comment reopened");
            mutateComments();
        } catch (err: any) {
            toast.error(err.message || "Failed to update resolution status");
            // Rollback
            setComments((prev) =>
                prev.map((c) =>
                    c.id === comment.id
                        ? { ...c, isResolved: comment.isResolved, resolvedBy: comment.resolvedBy }
                        : c
                )
            );
        }
        setOpenMenuCommentId(null);
    };

    const handleCopyCommentText = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Comment copied to clipboard");
        setOpenMenuCommentId(null);
    };

    const handleDeleteComment = async (commentId: string) => {
        const targetTaskId = parentTask?.id || subtask?.parentTaskId;
        if (!subtask?.id || !projectId || !targetTaskId) return;
        if (!window.confirm("Are you sure you want to delete this comment?")) return;

        try {
            await api.deleteProjectTaskComment(projectId, targetTaskId, commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            toast.success("Comment deleted");
            mutateComments();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete comment");
        }
        setOpenMenuCommentId(null);
    };

    const handleDelete = async () => {
        if (!isEditMode || !subtask?.id) return;
        if (!window.confirm("Are you sure you want to delete this subtask?")) return;

        try {
            setSubmitting(true);
            await api.deleteProjectSubtask(projectId, parentTask.id, subtask.id);
            toast.success("Subtask deleted");
            if (onRefresh) onRefresh();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete subtask");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleComplete = async () => {
        const nextState = !isCompleted;
        setIsCompleted(nextState);
        if (nextState) {
            triggerMicroCelebration({ intensity: "subtle" });
            playFeedback();
        }
    };

    const isOverdue = dueDate && !isCompleted && new Date(dueDate).getTime() < Date.now();

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-4xl"
            className="h-[85vh] max-h-[850px] overflow-hidden text-left"
        >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--app-border)] bg-[var(--app-card)] shrink-0">
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-[var(--app-muted)] flex items-center gap-1.5 truncate">
                            <span>Main Task:</span>
                            <span className="font-semibold text-[var(--app-text)] truncate">
                                {parentTask?.title}
                            </span>
                        </span>
                        <h2 className="text-base font-semibold text-[var(--app-text)] truncate">
                            {isEditMode ? title || "Edit Subtask" : "Create Subtask"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {isEditMode && canManageTasks && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={submitting}
                                className="p-1.5 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-[2px] transition-colors cursor-pointer"
                                title="Delete subtask"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] rounded-[2px] transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Modal Layout: 2-Column Split (Left: Primary Fields, Right: Tabs Content) */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-[var(--app-bg)]">
                    {/* Left Column: Form Attributes */}
                    <div className="w-full md:w-[360px] border-r border-[var(--app-border)] p-5 flex flex-col gap-4 overflow-y-auto bg-[var(--app-card)] shrink-0">
                        {/* Title input */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium text-[var(--app-text)]">
                                Subtask Title <span className="text-[var(--color-error)]">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter subtask title..."
                                autoFocus
                                className="px-3 py-2 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[2px] focus:outline-none focus:border-[var(--app-border-strong)] transition-colors font-medium"
                            />
                        </div>

                        {/* Column / Status */}
                        {columns.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-[var(--app-text)]">
                                    Column / Stage
                                </label>
                                <CustomSelect
                                    options={columnOptions}
                                    value={columnId}
                                    onChange={setColumnId}
                                    buttonClassName="w-full text-xs py-2 bg-[var(--app-bg)]"
                                />
                            </div>
                        )}

                        {/* Priority */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium text-[var(--app-text)]">
                                Priority Level
                            </label>
                            <CustomSelect
                                options={priorityOptions}
                                value={priority}
                                onChange={setPriority}
                                buttonClassName="w-full text-xs py-2 bg-[var(--app-bg)]"
                            />
                        </div>

                        {/* Assignee */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium text-[var(--app-text)]">
                                Assigned Member
                            </label>
                            {canManageTasks ? (
                                <CustomSelect
                                    options={assigneeOptions}
                                    value={assignedToId}
                                    onChange={setAssignedToId}
                                    buttonClassName="w-full text-xs py-2 bg-[var(--app-bg)]"
                                />
                            ) : (
                                <div className="flex items-center gap-2 p-2 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] text-xs text-[var(--app-text)]">
                                    <UserAvatar name={currentUser?.name || "You"} avatarUrl={currentUser?.avatarUrl} size="xs" />
                                    <span>
                                        <span className="font-semibold">{currentUser?.name || "You"}</span> (Self)
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Start Date & Due Date */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-[var(--app-text)] flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>Start Date</span>
                                </label>
                                <CustomDatePicker
                                    value={startDate}
                                    onChange={setStartDate}
                                    className="w-full text-xs"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-[var(--app-text)] flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>Due Date</span>
                                </label>
                                <CustomDatePicker
                                    value={dueDate}
                                    onChange={setDueDate}
                                    className="w-full text-xs"
                                />
                            </div>
                        </div>

                        {/* Estimated Days & Actual Days */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-[var(--app-text)] flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>Est. Days</span>
                                </label>
                                <input
                                    type="number"
                                    min="0.25"
                                    step="0.25"
                                    value={estimatedDays}
                                    onChange={(e) => setEstimatedDays(Number(e.target.value) || 1)}
                                    className="px-2.5 py-1.5 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[2px] focus:outline-none focus:border-[var(--app-border-strong)]"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-[var(--app-text)] flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>Actual Days</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.25"
                                    value={actualDays}
                                    onChange={(e) => setActualDays(Number(e.target.value) || 0)}
                                    className="px-2.5 py-1.5 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[2px] focus:outline-none focus:border-[var(--app-border-strong)]"
                                />
                            </div>
                        </div>

                        {/* Save Action in Left Column */}
                        {canModifyThisSubtask ? (
                            <div className="pt-2 mt-auto border-t border-[var(--app-border)] flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleSaveSubtask()}
                                    disabled={submitting}
                                    className="w-full py-2 bg-[var(--app-text)] hover:opacity-90 border border-[var(--app-text)] text-[var(--app-bg)] font-semibold text-xs rounded-[2px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>{isEditMode ? "Save Changes" : "Create Subtask"}</span>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="pt-2 mt-auto border-t border-[var(--app-border)] text-center text-[10px] text-[var(--app-muted)] italic">
                                View only mode (assigned to another member)
                            </div>
                        )}
                    </div>

                    {/* Right Column: Tabbed Content (Description, Comments, Activity Log, Attachments) */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[var(--app-bg)]">
                        {/* Tabs Bar */}
                        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--app-border)] bg-[var(--app-card)] shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveTab("description")}
                                className={`px-3 py-1.5 text-xs font-medium rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    activeTab === "description"
                                        ? "bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Description</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("comments")}
                                className={`px-3 py-1.5 text-xs font-medium rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    activeTab === "comments"
                                        ? "bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                }`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Comments</span>
                                {comments.length > 0 && (
                                    <span className="text-[10px] bg-[var(--app-hover-bg)] border border-[var(--app-border)] px-1.5 py-0.2 rounded-[2px] tabular-nums">
                                        {comments.length}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("activity")}
                                className={`px-3 py-1.5 text-xs font-medium rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    activeTab === "activity"
                                        ? "bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                }`}
                            >
                                <History className="w-3.5 h-3.5" />
                                <span>Activity Log</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("attachments")}
                                className={`px-3 py-1.5 text-xs font-medium rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    activeTab === "attachments"
                                        ? "bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                }`}
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>Attachments</span>
                            </button>
                        </div>

                        {/* Tab Panes */}
                        <div className="flex-1 p-5 overflow-hidden min-h-0 flex flex-col">
                            {/* TAB 1: DESCRIPTION */}
                            {activeTab === "description" && (
                                <div className="flex-1 overflow-y-auto flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-semibold text-[var(--app-text)]">
                                            Subtask Description & Details
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingDescription(!isEditingDescription)}
                                            className="px-2.5 py-1 text-[11px] font-medium border border-[var(--app-border)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] rounded-[2px] flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <Edit2 className="w-3 h-3 text-[var(--app-muted)]" />
                                            <span>{isEditingDescription ? "Preview" : "Edit Rich Text"}</span>
                                        </button>
                                    </div>

                                    {isEditingDescription ? (
                                        <div className="flex-1 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-card)] p-2">
                                            <TipTapEditor
                                                value={description}
                                                onChange={setDescription}
                                            />
                                        </div>
                                    ) : description ? (
                                        <div
                                            className="flex-1 p-4 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] prose dark:prose-invert max-w-none text-xs leading-relaxed overflow-y-auto"
                                            dangerouslySetInnerHTML={{ __html: description }}
                                        />
                                    ) : (
                                        <div
                                            onClick={() => setIsEditingDescription(true)}
                                            className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-[var(--app-border)] rounded-[2px] text-center text-[var(--app-muted)] hover:text-[var(--app-text)] hover:border-[var(--app-border-strong)] cursor-pointer transition-colors"
                                        >
                                            <FileText className="w-8 h-8 mb-2 opacity-40" />
                                            <span className="text-xs font-medium">No description provided yet</span>
                                            <span className="text-[10px] mt-1 text-[var(--app-muted)]">
                                                Click here to add rich notes, acceptance criteria, or code snippets.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: COMMENTS */}
                            {activeTab === "comments" && (
                                <div className="flex-1 flex flex-col min-h-0 gap-3 overflow-hidden">
                                    {/* Comments list */}
                                    <div ref={commentsListRef} className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                                        {loadingComments ? (
                                            <div className="flex-1 flex items-center justify-center p-8 text-[var(--app-muted)]">
                                                <Loader2 className="w-5 h-5 animate-spin text-[var(--app-muted)]" />
                                            </div>
                                        ) : comments.length === 0 ? (
                                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--app-muted)]">
                                                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                                                <span className="text-xs font-medium">No comments on this subtask</span>
                                                <span className="text-[10px] mt-1">Start the conversation below</span>
                                            </div>
                                        ) : (
                                            comments.map((c) => {
                                                const isCommentAuthor =
                                                    (c.user?.id && c.user?.id === currentUser?.id) ||
                                                    c.user?.id === currentUser?.id;
                                                const isEditingThis = editingCommentId === c.id;
                                                const isMenuOpen = openMenuCommentId === c.id;

                                                return (
                                                    <div
                                                        key={c.id}
                                                        className={`p-3 border rounded-[2px] flex flex-col gap-2 group shrink-0 transition-all ${
                                                            c.isResolved
                                                                ? "bg-[var(--app-card)]/40 border-[var(--app-border)]/60 opacity-85"
                                                                : "bg-[var(--app-card)] border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2 min-h-[22px]">
                                                            {/* Author & Timestamp Info (Left Side) */}
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <UserAvatar
                                                                    name={c.user?.name || "User"}
                                                                    avatarUrl={c.user?.avatarUrl || c.avatarUrl}
                                                                    size="xs"
                                                                    title={c.user?.name || "User"}
                                                                />
                                                                <span className="text-[11px] font-semibold text-[var(--app-text)] truncate">
                                                                    {c.user?.name || "User"}
                                                                </span>
                                                                <span className="text-[9px] text-[var(--app-muted)] shrink-0">
                                                                    {new Date(c.createdAt).toLocaleTimeString([], {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    })}
                                                                </span>
                                                                {c.isEdited && (
                                                                    <span className="text-[9px] text-[var(--app-muted)] italic shrink-0">
                                                                        (edited)
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Right controls: Quick Resolve / Resolved Badge, 3-Dot Menu */}
                                                            <div className="flex items-center gap-1 shrink-0 ml-auto h-5">
                                                                {/* OUTSIDE BUTTON: Resolve / Resolved Badge */}
                                                                {c.isResolved ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleResolve(c)}
                                                                        title={`Resolved by ${c.resolvedBy?.name || "someone"}. Click to reopen.`}
                                                                        className="px-1.5 py-0.5 bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30 rounded-[2px] text-[9px] font-semibold flex items-center gap-1 hover:bg-[var(--color-success)]/20 transition-colors cursor-pointer"
                                                                    >
                                                                        <Check className="w-2.5 h-2.5" />
                                                                        <span>Resolved</span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleResolve(c)}
                                                                        title="Mark comment as resolved"
                                                                        className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-[var(--app-muted)] hover:text-[var(--color-success)] hover:bg-[var(--app-hover-bg)] border border-transparent hover:border-[var(--app-border)] rounded-[2px] transition-all cursor-pointer flex items-center gap-1 text-[9px]"
                                                                    >
                                                                        <Check className="w-3 h-3" />
                                                                        <span>Resolve</span>
                                                                    </button>
                                                                )}

                                                                {/* 3-DOT MENU */}
                                                                <div className="relative" data-comment-menu={c.id}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuCommentId(isMenuOpen ? null : c.id);
                                                                        }}
                                                                        className={`p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] rounded-[2px] transition-colors cursor-pointer ${
                                                                            isMenuOpen
                                                                                ? "bg-[var(--app-hover-bg)] text-[var(--app-text)]"
                                                                                : ""
                                                                        }`}
                                                                        title="Comment actions"
                                                                    >
                                                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                                                    </button>

                                                                    {/* Dropdown Menu Popover */}
                                                                    {isMenuOpen && (
                                                                        <div
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="absolute right-0 top-full mt-1 w-36 bg-[var(--app-card)] border border-[var(--app-border-strong)] shadow-xl rounded-[2px] py-1 z-30 flex flex-col animate-fade-in text-xs"
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleCopyCommentText(c.text)}
                                                                                className="px-3 py-1.5 text-left text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] flex items-center gap-2 cursor-pointer transition-colors"
                                                                            >
                                                                                <Copy className="w-3 h-3 text-[var(--app-muted)]" />
                                                                                <span>Copy text</span>
                                                                            </button>

                                                                            {isCommentAuthor && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleStartEdit(c)}
                                                                                    className="px-3 py-1.5 text-left text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] flex items-center gap-2 cursor-pointer transition-colors"
                                                                                >
                                                                                    <Edit3 className="w-3 h-3 text-[var(--app-muted)]" />
                                                                                    <span>Edit</span>
                                                                                </button>
                                                                            )}

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleToggleResolve(c)}
                                                                                className="px-3 py-1.5 text-left text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] flex items-center gap-2 cursor-pointer transition-colors"
                                                                            >
                                                                                {c.isResolved ? (
                                                                                    <>
                                                                                        <RotateCcw className="w-3 h-3 text-[var(--app-muted)]" />
                                                                                        <span>Reopen</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Check className="w-3 h-3 text-[var(--color-success)]" />
                                                                                        <span>Resolve</span>
                                                                                    </>
                                                                                )}
                                                                            </button>

                                                                            {(isCommentAuthor || canManageTasks) && (
                                                                                <div className="border-t border-[var(--app-border)] my-1 pt-1">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleDeleteComment(c.id)}
                                                                                        className="w-full px-3 py-1.5 text-left text-[var(--color-error)] hover:bg-[var(--color-error)]/10 flex items-center gap-2 cursor-pointer transition-colors"
                                                                                    >
                                                                                        <Trash2 className="w-3 h-3" />
                                                                                        <span>Delete</span>
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Comment Body / Inline Edit */}
                                                        {isEditingThis ? (
                                                            <div className="flex flex-col gap-2 pl-7 pt-1">
                                                                <textarea
                                                                    value={editingCommentText}
                                                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                                                    rows={2}
                                                                    className="w-full p-2 text-xs bg-[var(--app-bg)] border border-[var(--app-border-strong)] text-[var(--app-text)] rounded-[2px] focus:outline-none resize-y"
                                                                    autoFocus
                                                                />
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleCancelEdit}
                                                                        disabled={isSavingEdit}
                                                                        className="px-2.5 py-1 text-xs text-[var(--app-muted)] hover:text-[var(--app-text)] border border-[var(--app-border)] hover:bg-[var(--app-hover-bg)] rounded-[2px] transition-colors cursor-pointer"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSaveEdit(c.id)}
                                                                        disabled={!editingCommentText.trim() || isSavingEdit}
                                                                        className="px-3 py-1 text-xs bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border-strong)] text-[var(--app-text)] font-semibold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                                                                    >
                                                                        {isSavingEdit && <Loader2 className="w-3 h-3 animate-spin" />}
                                                                        <span>Save changes</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p
                                                                className={`text-xs leading-relaxed pl-7 break-words whitespace-pre-wrap ${
                                                                    c.isResolved
                                                                        ? "text-[var(--app-muted)] opacity-80"
                                                                        : "text-[var(--app-text)]"
                                                                }`}
                                                            >
                                                                {c.text}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                        {/* Bottom anchor for smooth auto-scroll */}
                                        <div ref={commentsEndRef} />
                                    </div>

                                    {/* Comment input box pinned at bottom */}
                                    <form
                                        onSubmit={handlePostComment}
                                        className="pt-2 border-t border-[var(--app-border)] flex items-center gap-2 shrink-0 bg-[var(--app-bg)]"
                                    >
                                        <input
                                            type="text"
                                            value={newCommentText}
                                            onChange={(e) => setNewCommentText(e.target.value)}
                                            placeholder="Write a comment or note..."
                                            disabled={isPostingComment}
                                            className="flex-1 px-3 py-2 text-xs bg-[var(--app-card)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[2px] focus:outline-none focus:border-[var(--app-border-strong)]"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newCommentText.trim() || isPostingComment}
                                            className="px-3.5 py-2 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border-strong)] text-[var(--app-text)] rounded-[2px] font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                                        >
                                            {isPostingComment ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Send className="w-3.5 h-3.5" />
                                            )}
                                            <span>Post</span>
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* TAB 3: ACTIVITY LOG */}
                            {activeTab === "activity" && (
                                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
                                    <h4 className="text-xs font-semibold text-[var(--app-text)]">
                                        Audit History & Timeline
                                    </h4>

                                    <div className="flex flex-col gap-3 pl-2 border-l border-[var(--app-border)]">
                                        {activities.map((act) => (
                                            <div key={act.id} className="relative flex flex-col gap-1 pl-4">
                                                <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--app-border-strong)] border-2 border-[var(--app-card)]" />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-semibold text-[var(--app-text)]">
                                                        {act.description}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[9px] text-[var(--app-muted)]">
                                                    <span>by {act.user?.name || "System"}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {new Date(act.timestamp).toLocaleDateString()}{" "}
                                                        {new Date(act.timestamp).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: ATTACHMENTS */}
                            {activeTab === "attachments" && (
                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-semibold text-[var(--app-text)]">
                                            Subtask Files & Deliverables
                                        </h4>
                                    </div>

                                    {/* Upload drop area */}
                                    <div className="p-6 border border-dashed border-[var(--app-border)] hover:border-[var(--app-border-strong)] rounded-[2px] text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-[var(--app-card)] transition-colors">
                                        <Upload className="w-6 h-6 text-[var(--app-muted)]" />
                                        <span className="text-xs font-medium text-[var(--app-text)]">
                                            Click or drop files here to attach
                                        </span>
                                        <span className="text-[10px] text-[var(--app-muted)]">
                                            Supports images, PDFs, diagrams up to 25MB
                                        </span>
                                    </div>

                                    {attachments.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            {attachments.map((att: any) => (
                                                <div
                                                    key={att.id}
                                                    className="p-2.5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] flex items-center justify-between text-xs"
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        <Paperclip className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                                        <span className="truncate">{att.name}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
        </ModalWrapper>
    );
}
