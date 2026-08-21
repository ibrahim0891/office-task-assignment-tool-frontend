import React, { useState, useEffect, useCallback, useLayoutEffect } from "react";
import toast from "react-hot-toast";
import { CustomSelect } from "./ui/CustomSelect";
import { CustomDatePicker } from "./ui/CustomDatePicker";
import ConfirmDialog from "./ui/ConfirmDialog";
import { TipTapEditor } from "./ui/TipTapEditor";
import { Task, TaskColumn, User, Comment, TaskActivity, api } from "../api";
import { triggerMicroCelebration } from "../utils/confetti";
import { playFeedback } from "../utils/feedback";
import { useWorkspace } from "../context/WorkspaceContext";
import { APP_CONFIG } from "../config/appConfig";
import {
    Upload,
    Trash2,
    Maximize2,
    ExternalLink,
    X,
    Loader2,
    Check,
    FileText,
    MessageSquare,
    Paperclip,
    ClipboardList,
    ChevronRight,
} from "lucide-react";

// 30% Image Compression helper (70% quality)
const compressImage30Percent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) return resolve(e.target?.result as string);
                ctx.drawImage(img, 0, 0);
                const compressedBase64 = canvas.toDataURL(
                    "image/jpeg",
                    0.7,
                ); // 30% compression (70% quality)
                resolve(compressedBase64);
            };
            img.onerror = () => reject("Failed to load image");
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject("Failed to read file");
        reader.readAsDataURL(file);
    });
};

interface TaskModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    columns: TaskColumn[];
    teamMembers: { user: User; role: string }[];
    currentUser: User;
    userRole: string;
    onRefresh: () => void;
    initialTab?: "details" | "comments" | "description" | "attachments";
}

export default function TaskModal({
    task,
    isOpen,
    onClose,
    columns,
    teamMembers,
    currentUser,
    userRole,
    onRefresh,
    initialTab = "details",
}: TaskModalProps) {
    const { openMemberProfile, commentUpdateTrigger } = useWorkspace();
    // Form Local State (prevents auto-saving on every keystroke)
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || "");
    const [columnId, setColumnId] = useState(task.columnId);
    const [priority, setPriority] = useState(task.priority);
    const [assignedToId, setAssignedToId] = useState(task.assignedToId);
    const [dateStr, setDateStr] = useState(
        task.date ? task.date.split("T")[0] : "",
    );
    const [dueDateStr, setDueDateStr] = useState(
        task.dueDate ? task.dueDate.split("T")[0] : "",
    );
    const [estimatedTime, setEstimatedTime] = useState<string | number>(
        task.estimatedTime ?? "",
    );
    const [actualTime, setActualTime] = useState<string | number>(
        task.actualTime ?? "",
    );

    const [isSaving, setIsSaving] = useState(false);

    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingDescription, setIsDeletingDescription] = useState(false);
    const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);
    const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
    const [isDeleteDescConfirmOpen, setIsDeleteDescConfirmOpen] =
        useState(false);
    const [isDeleteAttachmentConfirmOpen, setIsDeleteAttachmentConfirmOpen] =
        useState(false);
    const [attachmentToDelete, setAttachmentToDelete] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

    // Modal sub-components state
    const [activeTab, setActiveTab] = useState<
        "details" | "comments" | "description" | "attachments"
    >("comments");
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [comment, setComment] = useState("");
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [hiddenCommentIds, setHiddenCommentIds] = useState<string[]>([]);
    const [newSubtask, setNewSubtask] = useState("");
    const [attachmentName, setAttachmentName] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [showAllAuditLog, setShowAllAuditLog] = useState(false);
    const [expandedActivityId, setExpandedActivityId] = useState<string | null>(
        null,
    );
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const commentInputRef = React.useRef<HTMLInputElement>(null);

    const prevTaskIdRef = React.useRef<string | null>(null);
    const prevIsOpenRef = React.useRef<boolean>(false);
    const prevTaskRef = React.useRef<Task | null>(null);
    const [commentsList, setCommentsList] = useState<Comment[]>([]);
    const [commentsPage, setCommentsPage] = useState(1);
    const [hasMoreComments, setHasMoreComments] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [showLoadMore, setShowLoadMore] = useState(false);
    const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);
    const [resolvingCommentId, setResolvingCommentId] = useState<string | null>(null);
    const [activitiesList, setActivitiesList] = useState<TaskActivity[]>([]);
    const [activitiesPage, setActivitiesPage] = useState(1);
    const [hasMoreActivities, setHasMoreActivities] = useState(false);
    const [isLoadingActivities, setIsLoadingActivities] = useState(false);
    const [isLoadingMoreActivities, setIsLoadingMoreActivities] = useState(false);
    const [isClearActivitiesConfirmOpen, setIsClearActivitiesConfirmOpen] = useState(false);
    const [isClearingActivities, setIsClearingActivities] = useState(false);

    const loadTaskActivities = async (page = 1, append = false) => {
        if (!task?.id) return;
        if (append) {
            setIsLoadingMoreActivities(true);
        } else {
            setIsLoadingActivities(true);
        }
        try {
            const res = await api.getTaskActivities(task.id, page, 15);
            if (append) {
                setActivitiesList((prev) => [...prev, ...res.activities]);
            } else {
                setActivitiesList(res.activities);
            }
            setActivitiesPage(page);
            setHasMoreActivities(res.hasMore);
        } catch (err) {
            console.error("Failed to load task activities:", err);
        } finally {
            setIsLoadingActivities(false);
            setIsLoadingMoreActivities(false);
        }
    };
    const [isDeletingComment, setIsDeletingComment] = useState(false);
    const commentsEndRef = React.useRef<HTMLDivElement>(null);
    const commentsContainerRef = React.useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = React.useRef<number>(0);
    const lastScrollTopRef = React.useRef<number>(0);
    const shouldScrollToBottomRef = React.useRef<boolean>(false);

    const visibleComments = (commentsList || []).filter(
        (c) => !hiddenCommentIds.includes(c.id),
    );

    // Synchronize local form state with incoming task props
    useEffect(() => {
        if (!isOpen) {
            prevTaskIdRef.current = null;
            prevIsOpenRef.current = false;
            prevTaskRef.current = null;
            return;
        }

        const isNewTask = prevTaskIdRef.current !== task.id;
        const wasClosed = !prevIsOpenRef.current;
        const prevTask = prevTaskRef.current;

        if (isNewTask || wasClosed || !prevTask) {
            setTitle(task.title || "");
            setDescription(task.description || "");
            setColumnId(task.columnId || "");
            setPriority(task.priority || "MEDIUM");
            setAssignedToId(task.assignedToId || "");
            setDateStr(task.date ? task.date.split("T")[0] : "");
            setDueDateStr(task.dueDate ? task.dueDate.split("T")[0] : "");
            setEstimatedTime(task.estimatedTime ?? "");
            setActualTime(task.actualTime ?? "");
            setShowUnsavedWarning(false);

            let mappedTab:
                | "details"
                | "comments"
                | "description"
                | "attachments" = "comments";
            if (initialTab === "attachments") mappedTab = "attachments";
            else if (initialTab === "comments") mappedTab = "comments";
            else if (initialTab === "description") mappedTab = "description";
            else if (initialTab === "details") mappedTab = "comments";
            setActiveTab(mappedTab);
            setHiddenCommentIds([]);
            setCommentsList([]);
            setActivitiesList([]);
            setActivitiesPage(1);
            setHasMoreActivities(false);
            setShowLoadMore(false);
        } else {
            // Same task updating. Only update inputs that have not been modified locally!
            if (title === prevTask.title) {
                setTitle(task.title || "");
            }
            if (description === (prevTask.description || "")) {
                setDescription(task.description || "");
            }
            if (columnId === prevTask.columnId) {
                setColumnId(task.columnId || "");
            }
            if (priority === prevTask.priority) {
                setPriority(task.priority || "MEDIUM");
            }
            if (assignedToId === prevTask.assignedToId) {
                setAssignedToId(task.assignedToId || "");
            }
            const prevDate = prevTask.date ? prevTask.date.split("T")[0] : "";
            if (dateStr === prevDate) {
                setDateStr(task.date ? task.date.split("T")[0] : "");
            }
            const prevDueDate = prevTask.dueDate
                ? prevTask.dueDate.split("T")[0]
                : "";
            if (dueDateStr === prevDueDate) {
                setDueDateStr(task.dueDate ? task.dueDate.split("T")[0] : "");
            }
            if (estimatedTime === (prevTask.estimatedTime ?? "")) {
                setEstimatedTime(task.estimatedTime ?? "");
            }
            if (actualTime === (prevTask.actualTime ?? "")) {
                setActualTime(task.actualTime ?? "");
            }
        }

        prevTaskIdRef.current = task.id;
        prevIsOpenRef.current = isOpen;
        prevTaskRef.current = task;
    }, [task, isOpen, initialTab]);

    const loadTaskComments = useCallback(async (page: number, append = false, silent = false) => {
        if (!silent) {
            if (page === 1) {
                setIsLoadingComments(true);
            } else {
                setIsLoadingMore(true);
            }
        }
        try {
            // Check if user was already at or near bottom
            const isNearBottom = commentsContainerRef.current
                ? (commentsContainerRef.current.scrollHeight - commentsContainerRef.current.scrollTop - commentsContainerRef.current.clientHeight <= 100)
                : true;

            // Preserve current scrollTop before updates
            if (commentsContainerRef.current) {
                lastScrollTopRef.current = commentsContainerRef.current.scrollTop;
            }

            const res = await api.getTaskComments(task.id, page, 15);
            if (append) {
                if (commentsContainerRef.current) {
                    prevScrollHeightRef.current = commentsContainerRef.current.scrollHeight;
                }
                shouldScrollToBottomRef.current = false;
                setCommentsList(prev => [...res.comments, ...prev]);
            } else {
                if (page === 1) {
                    shouldScrollToBottomRef.current = !silent || isNearBottom;
                } else {
                    shouldScrollToBottomRef.current = false;
                }
                setCommentsList(res.comments);
            }
            setHasMoreComments(res.hasMore);
            setCommentsPage(page);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to load comments.");
        } finally {
            if (!silent) {
                setIsLoadingComments(false);
                setIsLoadingMore(false);
            }
        }
    }, [task.id]);

    useEffect(() => {
        if (isOpen && activeTab === "comments") {
            const silent = commentsList.length > 0;
            loadTaskComments(1, false, silent);
        }
    }, [isOpen, task.id, activeTab, commentUpdateTrigger, loadTaskComments]);

    useLayoutEffect(() => {
        if (!isOpen || activeTab !== "comments") return;
        if (!commentsContainerRef.current) return;
        
        const container = commentsContainerRef.current;
        
        if (shouldScrollToBottomRef.current) {
            if (commentsEndRef.current) {
                commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
            shouldScrollToBottomRef.current = false;
        } else if (prevScrollHeightRef.current > 0) {
            container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
            prevScrollHeightRef.current = 0;
        } else if (lastScrollTopRef.current > 0) {
            container.scrollTop = lastScrollTopRef.current;
            lastScrollTopRef.current = 0;
        }
    }, [commentsList, isOpen, activeTab]);

    const handleCommentsScroll = () => {
        if (!commentsContainerRef.current) return;
        const { scrollTop } = commentsContainerRef.current;
        setShowLoadMore(scrollTop <= 15);
    };

    // Calculate dirty status (un-saved changes exist)
    const isTitleDirty = title !== task.title;
    const isDescDirty = description !== (task.description || "");
    const isColumnDirty = columnId !== task.columnId;
    const isPriorityDirty = priority !== task.priority;
    const isAssigneeDirty = assignedToId !== task.assignedToId;
    const isDateDirty = dateStr !== (task.date ? task.date.split("T")[0] : "");
    const isDueDateDirty =
        dueDateStr !== (task.dueDate ? task.dueDate.split("T")[0] : "");
    const isEstDirty =
        String(estimatedTime) !== String(task.estimatedTime ?? "");
    const isActDirty = String(actualTime) !== String(task.actualTime ?? "");

    const isDirty =
        isTitleDirty ||
        isDescDirty ||
        isColumnDirty ||
        isPriorityDirty ||
        isAssigneeDirty ||
        isDateDirty ||
        isDueDateDirty ||
        isEstDirty ||
        isActDirty;

    // Browser tab / window close warning (beforeunload prompt)
    useEffect(() => {
        if (!isOpen || !isDirty) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue =
                "You have unsaved changes. Are you sure you want to leave?";
            return e.returnValue;
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isOpen, isDirty]);

    // Handle pasting images from clipboard to upload as task attachments
    useEffect(() => {
        if (!isOpen) return;

        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            let imageFile: File | null = null;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    imageFile = items[i].getAsFile();
                    break;
                }
            }

            if (imageFile) {
                e.preventDefault();
                if (userRole === "OBSERVER") {
                    toast.error("Observers have read-only access and cannot upload attachments.");
                    return;
                }

                setIsUploadingImage(true);
                try {
                    const compressedBase64 = await compressImage30Percent(imageFile);
                    const filename = imageFile.name || `Clipboard_Image_${Date.now()}.png`;
                    await api.uploadTaskImage(
                        task.id,
                        compressedBase64,
                        filename,
                        currentUser.id,
                    );
                    toast.success(`Uploaded clipboard image "${filename}"`);
                    onRefresh();
                    setActiveTab("attachments");
                } catch (err: any) {
                    toast.error(err.message || "Failed to upload clipboard image.");
                } finally {
                    setIsUploadingImage(false);
                }
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => {
            window.removeEventListener("paste", handlePaste);
        };
    }, [isOpen, task.id, currentUser.id, userRole, onRefresh]);

    if (!isOpen) return null;

    const isLeader = userRole === "LEADER";
    const isObserver = userRole === "OBSERVER";
    const isCreator = task.createdById === currentUser.id;
    const isAssignee = task.assignedToId === currentUser.id;

    const canEditDetails = !isObserver;
    const canEditStatus = !isObserver && (isLeader || isCreator || isAssignee);
    const canPostComment = !isObserver;
    const canAddChecklist = !isObserver;
    const canDeleteTask = isLeader || isCreator;
    const canClearActivityLog = isLeader || isCreator;

    // Handle Closing modal with unsaved check
    const handleAttemptClose = () => {
        if (isDirty) {
            setShowUnsavedWarning(true);
        } else {
            onClose();
        }
    };

    // Save batch updates to API
    const handleSaveChanges = async (andClose = false) => {
        if (isObserver) return;
        if (!title.trim()) {
            toast.error("Task title cannot be empty.");
            return;
        }
        if (title.trim().length > APP_CONFIG.MAX_TASK_TITLE_LENGTH) {
            toast.error(
                `Task title must not exceed ${APP_CONFIG.MAX_TASK_TITLE_LENGTH} characters.`,
            );
            return;
        }

        setIsSaving(true);
        try {
            await api.updateTask(
                task.id,
                {
                    title,
                    description,
                    columnId,
                    priority,
                    assignedToId,
                    date: dateStr,
                    dueDate: dueDateStr || null,
                    estimatedTime:
                        estimatedTime !== "" ? Number(estimatedTime) : null,
                    actualTime: actualTime !== "" ? Number(actualTime) : null,
                },
                {
                    userId: currentUser.id,
                    teamId: task.teamId,
                },
            );

            toast.success("Task changes saved!");

            // Trigger micro celebration if status changed to Done/Complete
            const newCol = columns.find((c) => c.id === columnId);
            const isNewDone =
                newCol?.isComplete ||
                newCol?.name.toLowerCase().includes("done") ||
                newCol?.name.toLowerCase().includes("complete");
            const isOldDone =
                task.column?.isComplete ||
                task.column?.name.toLowerCase().includes("done") ||
                task.column?.name.toLowerCase().includes("complete");

            if (isNewDone && !isOldDone) {
                triggerMicroCelebration({ intensity: "medium" });
            }

            onRefresh();
            setShowUnsavedWarning(false);
            if (andClose) {
                onClose();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save task updates.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDescription = async () => {
        setIsDeletingDescription(true);
        try {
            setDescription("");
            setIsEditingDescription(false);
            await api.updateTask(
                task.id,
                { description: null as any },
                { userId: currentUser.id, teamId: task.teamId },
            );
            toast.success("Description deleted");
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete description");
        } finally {
            setIsDeletingDescription(false);
        }
    };

    const parseActivityInfo = (act: any) => {
        let detailsObj: any = {};
        try {
            if (typeof act.details === "string") {
                detailsObj = JSON.parse(act.details);
            } else {
                detailsObj = act.details || {};
            }
        } catch (e) {}

        let statusFrom = "";
        let statusTo = "";

        if (detailsObj.status && typeof detailsObj.status === "object") {
            statusFrom = detailsObj.status.from || "";
            statusTo = detailsObj.status.to || "";
        } else if (
            detailsObj.from !== undefined ||
            detailsObj.to !== undefined
        ) {
            statusFrom = detailsObj.from || "";
            statusTo = detailsObj.to || "";
        }

        const colFrom = columns.find((c) => c.id === statusFrom);
        if (colFrom) statusFrom = colFrom.name;
        const colTo = columns.find((c) => c.id === statusTo);
        if (colTo) statusTo = colTo.name;

        if (
            !statusFrom ||
            statusFrom === "undefined" ||
            statusFrom === "Initial"
        ) {
            statusFrom = columns[0]?.name || "To Do";
        }
        if (!statusTo || statusTo === "undefined") {
            statusTo = columns[columns.length - 1]?.name || "Done";
        }

        const diffs: { field: string; from: string; to: string }[] = [];

        if (act.actionType === "STATUS_CHANGE" || detailsObj.status) {
            diffs.push({
                field: "Status",
                from: String(statusFrom),
                to: String(statusTo),
            });
        }

        const fieldLabels: Record<string, string> = {
            title: "Title",
            priority: "Priority",
            assignedTo: "Assignee",
            dueDate: "Due Date",
            estimatedTime: "Est. Hours",
            actualTime: "Act. Hours",
            description: "Description",
        };

        Object.keys(detailsObj).forEach((key) => {
            if (
                key === "status" ||
                key === "from" ||
                key === "to" ||
                key === "wipLimitWarning"
            )
                return;
            const val = detailsObj[key];
            if (
                val &&
                typeof val === "object" &&
                ("from" in val || "to" in val)
            ) {
                let fromVal = String(val.from ?? "None");
                let toVal = String(val.to ?? "None");

                if (key === "assignedTo") {
                    const uFrom = teamMembers.find((m) => m.user.id === fromVal)
                        ?.user.name;
                    if (uFrom) fromVal = uFrom;
                    const uTo = teamMembers.find((m) => m.user.id === toVal)
                        ?.user.name;
                    if (uTo) toVal = uTo;
                }

                diffs.push({
                    field: fieldLabels[key] || key,
                    from: fromVal,
                    to: toVal,
                });
            } else if (
                val !== undefined &&
                val !== null &&
                typeof val !== "object"
            ) {
                diffs.push({
                    field: fieldLabels[key] || key,
                    from: "Previous",
                    to: String(val),
                });
            }
        });

        let summaryText = "";
        if (act.actionType === "CREATE") {
            summaryText = "Task created.";
        } else if (
            act.actionType === "STATUS_CHANGE" ||
            (diffs.length === 1 && diffs[0].field === "Status")
        ) {
            summaryText = `Status changed: ${statusFrom} → ${statusTo}`;
        } else if (act.actionType === "COMMENT") {
            summaryText = "Added a comment.";
        } else if (act.actionType === "ATTACHMENT") {
            summaryText = `Linked attachment: ${detailsObj.name || ""}`;
        } else if (diffs.length > 0) {
            summaryText = `Updated ${diffs.map((d: any) => d.field).join(", ")}`;
        } else {
            summaryText = "Updated task details.";
        }

        return {
            summaryText,
            diffs,
            statusFrom,
            statusTo,
        };
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isObserver) return;
        if (!comment.trim() || isSendingComment) return;
        setIsSendingComment(true);
        try {
            const newComment = await api.addComment(task.id, currentUser.id, comment);
            setComment("");
            setCommentsList(prev => [...prev, newComment]);
            onRefresh();
            setTimeout(() => {
                commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
                commentInputRef.current?.focus();
            }, 50);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSendingComment(false);
        }
    };

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isObserver) return;
        if (!newSubtask.trim()) return;
        try {
            await api.addChecklistItem(task.id, newSubtask);
            setNewSubtask("");
            onRefresh();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleToggleSubtask = async (itemId: string, checked: boolean) => {
        if (isObserver) {
            toast.error(
                "Observers have read-only access and cannot update checklists.",
            );
            return;
        }
        try {
            await api.updateChecklistItem(task.id, itemId, checked);
            if (checked) {
                const willAllBeCompleted =
                    task.checklist &&
                    task.checklist.filter((c) =>
                        c.id === itemId ? true : c.isCompleted,
                    ).length === task.checklist.length;
                triggerMicroCelebration({
                    intensity: willAllBeCompleted ? "epic" : "subtle",
                });
                playFeedback(willAllBeCompleted ? "complete" : "click");
            } else {
                playFeedback("click");
            }
            onRefresh();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleDeleteSubtask = async (itemId: string) => {
        if (isObserver) return;
        try {
            playFeedback("delete");
            await api.deleteChecklistItem(task.id, itemId);
            onRefresh();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    // Handled clipboard image uploads and standard uploads using the module-level helper

    const handleImageFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file.");
            return;
        }
        setIsUploadingImage(true);
        try {
            const compressedBase64 = await compressImage30Percent(file);
            await api.uploadTaskImage(
                task.id,
                compressedBase64,
                file.name,
                currentUser.id,
            );
            toast.success(`Uploaded "${file.name}"`);
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to upload image.");
        } finally {
            setIsUploadingImage(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleResolveComment = async (commentId: string) => {
        if (commentsContainerRef.current) {
            lastScrollTopRef.current = commentsContainerRef.current.scrollTop;
        }
        shouldScrollToBottomRef.current = false;
        setResolvingCommentId(commentId);
        try {
            await api.resolveComment(task.id, commentId, currentUser.id);
            toast.success("Comment marked as resolved.");
            loadTaskComments(commentsPage, false, true);
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to resolve comment.");
        } finally {
            setResolvingCommentId(null);
        }
    };

    const handleReopenComment = async (commentId: string) => {
        if (commentsContainerRef.current) {
            lastScrollTopRef.current = commentsContainerRef.current.scrollTop;
        }
        shouldScrollToBottomRef.current = false;
        setResolvingCommentId(commentId);
        try {
            await api.reopenComment(task.id, commentId, currentUser.id);
            toast.success("Comment reopened.");
            loadTaskComments(commentsPage, false, true);
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to reopen comment.");
        } finally {
            setResolvingCommentId(null);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        // Optimistically hide the comment
        if (commentsContainerRef.current) {
            lastScrollTopRef.current = commentsContainerRef.current.scrollTop;
        }
        shouldScrollToBottomRef.current = false;
        setHiddenCommentIds((prev) => [...prev, commentId]);

        setIsDeletingComment(true);
        try {
            await api.deleteComment(task.id, commentId, currentUser.id);
            toast.success("Comment deleted.");
            loadTaskComments(commentsPage, false, true);
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete comment.");
            // Revert optimistic deletion if the API call fails
            setHiddenCommentIds((prev) =>
                prev.filter((id) => id !== commentId),
            );
        } finally {
            setIsDeletingComment(false);
        }
    };

    const handleDeleteAttachment = async (
        attachmentId: string,
        name: string,
    ) => {
        if (isObserver) return;
        setIsDeletingAttachment(true);
        try {
            await api.deleteAttachment(task.id, attachmentId, currentUser.id);
            toast.success(`Deleted attachment: "${name}"`);
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete attachment.");
        } finally {
            setIsDeletingAttachment(false);
        }
    };

    const handleClearActivities = async () => {
        if (!task?.id || !canClearActivityLog) return;
        setIsClearingActivities(true);
        try {
            await api.clearTaskActivities(task.id, currentUser.id);
            setActivitiesList([]);
            setHasMoreActivities(false);
            toast.success("Activity logs cleared successfully.");
            playFeedback("delete");
        } catch (err: any) {
            console.error("Failed to clear activity logs:", err);
            toast.error(err.message || "Failed to clear activity logs.");
        } finally {
            setIsClearingActivities(false);
            setIsClearActivitiesConfirmOpen(false);
        }
    };

    const handleAddAttachment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isObserver) return;
        if (!attachmentName.trim() || !attachmentUrl.trim()) return;
        try {
            await api.addAttachment(
                task.id,
                {
                    name: attachmentName,
                    url: attachmentUrl,
                    type:
                        attachmentUrl.includes(".png") ||
                        attachmentUrl.includes(".jpg")
                            ? "image/png"
                            : "document",
                },
                currentUser.id,
            );
            setAttachmentName("");
            setAttachmentUrl("");
            onRefresh();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleDeleteTask = () => {
        if (!canDeleteTask) {
            toast.error(
                "Only the workspace leader or task creator can delete this task.",
            );
            return;
        }
        setIsArchiveConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await api.deleteTask(task.id, currentUser.id);
            toast.success("Task moved to trash.");
            setIsArchiveConfirmOpen(false);
            onClose();
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete task.");
        } finally {
            setIsDeleting(false);
        }
    };

    const inputClass =
        "w-full bg-white border border-[#E5E5E3] rounded-[3px] px-2.5 py-1.5 text-[11px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center select-none p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 transition-opacity"
                onClick={handleAttemptClose}
            />

            {/* Main Modal Dialog */}
            <div
                className="relative w-full max-w-5xl bg-white border border-[#E5E5E3] text-[#1A1A1A] flex flex-col h-[90vh] animate-fade-in corner-brackets"
                style={{ boxShadow: "var(--shadow-float)" }}
            >
                {/* Modal Top Header Bar */}
                <div className="p-4 border-b border-[#E5E5E3] flex justify-between items-center bg-[#FAFAF9]">
                    <div className="flex items-center gap-3">
                        <p className="text-[11px] text-[#888883]">
                            Created by{" "}
                            <span className="text-[#1A1A1A] font-medium">
                                {task.createdBy?.name}
                            </span>{" "}
                            on {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                        {isDirty && (
                            <span className="text-base text-[#B08800] bg-[#B08800]/10 px-2 py-0.5 rounded font-medium  ">
                                Unsaved Changes
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Archive — always visible when permitted */}
                        {canDeleteTask && (
                            <button
                                onClick={handleDeleteTask}
                                className="border border-[#E5E5E3] hover:border-[#CB2431]/30 hover:bg-[#CB2431]/5 text-[#888883] hover:text-[#CB2431] text-[11px] px-2.5 py-1 rounded-[2px] font-medium transition-colors cursor-pointer"
                            >
                                Archive
                            </button>
                        )}

                        {/* Save Changes — only rendered when there are unsaved changes */}
                        {!isObserver && isDirty && (
                            <button
                                onClick={() => handleSaveChanges(true)}
                                disabled={isSaving}
                                className="relative corner-brackets-4 px-3 py-1 text-[11px] font-medium rounded-[2px] transition-colors flex items-center gap-1.5 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                ) : (
                                    <span className="w-1.5 h-1.5 rounded-[0.5px] inline-block bg-[#555555]" />
                                )}
                                <span>
                                    {isSaving ? "Saving…" : "Save Changes"}
                                </span>
                            </button>
                        )}

                        <button
                            onClick={handleAttemptClose}
                            className="text-[#888883] hover:text-[#1A1A1A] transition-colors text-[14px] px-1.5 font-bold"
                            title="Close modal"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-hidden p-3.5 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
                    {/* Left Column (Scrollable without scrollbars) */}
                    <div className="md:col-span-2 flex flex-col gap-3.5 overflow-y-auto scrollbar-none pr-1 max-h-full text-left">
                        {/* Title Section (Always visible) */}
                        <div className="flex flex-col gap-1 shrink-0 px-1 mb-2">
                            <label className="eyebrow">Title *</label>

                            {!canEditDetails || !isCreator ? (
                                <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight font-serif pt-1 select-text">
                                    {title}
                                </h2>
                            ) : (
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Task title…"
                                    maxLength={APP_CONFIG.MAX_TASK_TITLE_LENGTH}
                                    className={`${inputClass} font-sans font-normal text-base`}
                                />
                            )}
                        </div>

                        {/* Tab Navigation Bar - Zero Shift Underline Tabs */}
                        <div className="flex items-center gap-5 border-b border-[#E5E5E3] pb-0 shrink-0 mb-3.5 text-left px-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab("comments")}
                                className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer -mb-[1px] text-[11px] ${
                                    activeTab === "comments"
                                        ? "border-[#1A1A1A] text-[#1A1A1A] font-semibold"
                                        : "border-transparent text-[#888883] hover:text-[#1A1A1A] font-medium"
                                }`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Comments ({visibleComments.length})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("description")}
                                className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer -mb-[1px] text-[11px] ${
                                    activeTab === "description"
                                        ? "border-[#1A1A1A] text-[#1A1A1A] font-semibold"
                                        : "border-transparent text-[#888883] hover:text-[#1A1A1A] font-medium"
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Description</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("attachments")}
                                className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer -mb-[1px] text-[11px] ${
                                    activeTab === "attachments"
                                        ? "border-[#1A1A1A] text-[#1A1A1A] font-semibold"
                                        : "border-transparent text-[#888883] hover:text-[#1A1A1A] font-medium"
                                }`}
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>
                                    Attachments ({task.attachments?.length || 0}
                                    )
                                </span>
                            </button>
                        </div>

                        {/* TAB 1: COMMENTS */}
                        {activeTab === "comments" && (
                            <div className="relative flex flex-col flex-1 min-h-0 h-full gap-3 animate-fade-in border border-[#E5E5E3] bg-[#FAFAF9] p-3 rounded-[3px] corner-brackets">
                                {/* Load More Button at the top */}
                                {hasMoreComments && showLoadMore && (
                                    <div className="flex justify-center shrink-0 mb-1">
                                        <button
                                            type="button"
                                            onClick={() => loadTaskComments(commentsPage + 1, true)}
                                            disabled={isLoadingMore}
                                            className="text-[10px] text-[#888883] hover:text-[#1A1A1A] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border border-[#E5E5E3] bg-white hover:bg-[#FAFAF9] transition-all disabled:opacity-50 cursor-pointer shadow-3xs"
                                        >
                                            {isLoadingMore && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                            <span>Load previous comments</span>
                                        </button>
                                    </div>
                                )}

                                 {/* Comment Thread List filling available height */}
                                <div
                                    ref={commentsContainerRef}
                                    onScroll={handleCommentsScroll}
                                    className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0 pr-1"
                                >
                                    {isLoadingComments ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 text-[#888883] text-[11px] my-auto">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Loading comments...</span>
                                        </div>
                                    ) : visibleComments.length === 0 ? (
                                        <div className="p-8 text-center flex flex-col items-center justify-center gap-1 text-[#888883] my-auto">
                                            <MessageSquare className="w-4 h-4 text-[#DADAD6]" />
                                            <span className="text-[11px] font-medium text-[#1A1A1A] mt-0.5">
                                                No comments yet
                                            </span>
                                            <span className="text-[10px]">
                                                Be the first to share notes or
                                                feedback on this task.
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 pb-2">
                                            {visibleComments.map((c) => {
                                                return (
                                                    <div
                                                        key={c.id}
                                                        className={`border p-2.5 rounded-[3px] text-left transition-colors flex flex-col gap-1 ${c.resolved ? "border-[#DADAD6] bg-[#FAFAF9] opacity-75" : "border-[#E5E5E3] bg-white"}`}
                                                    >
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <div
                                                                onClick={() =>
                                                                    c.user &&
                                                                    openMemberProfile(
                                                                        c.user,
                                                                    )
                                                                }
                                                                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                                                            >
                                                                {c.user?.avatarUrl ? (
                                                                    <img
                                                                        src={c.user.avatarUrl}
                                                                        alt={c.user.name}
                                                                        className="w-4 h-4 rounded-full object-cover border border-[#E5E5E3] shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="w-4 h-4 rounded-[2px] border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-[7px] text-[#1A1A1A] font-semibold shrink-0">
                                                                        {c.user?.name
                                                                            ? c.user.name
                                                                                  .split(" ")
                                                                                  .map((n) => n[0])
                                                                                  .join("")
                                                                                  .toUpperCase()
                                                                                  .slice(0, 2)
                                                                            : "U"}
                                                                    </div>
                                                                )}
                                                                <span className="font-semibold text-[#1A1A1A]">
                                                                    {c.user?.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[#888883]">
                                                                <span>
                                                                    {new Date(
                                                                        c.createdAt,
                                                                    ).toLocaleDateString()}{" "}
                                                                    {new Date(
                                                                        c.createdAt,
                                                                    ).toLocaleTimeString(
                                                                        [],
                                                                        {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        },
                                                                    )}
                                                                </span>
                                                                {c.resolved && (
                                                                    <span className="px-1.5 py-0.5 rounded-[2px] bg-[#22863A]/10 text-[#22863A] text-[9px] font-semibold flex items-center gap-1 shadow-2xs shrink-0">
                                                                        ✓ Resolved
                                                                    </span>
                                                                )}
                                                                {!c.resolved
                                                                    ? (c.userId ===
                                                                          currentUser.id ||
                                                                          task.createdById ===
                                                                              currentUser.id ||
                                                                          task.assignedToId ===
                                                                              currentUser.id) && (
                                                                          <button
                                                                              type="button"
                                                                              disabled={resolvingCommentId !== null}
                                                                              onClick={() =>
                                                                                  handleResolveComment(
                                                                                      c.id,
                                                                                  )
                                                                              }
                                                                              className="px-2 py-0.5 border border-[#CB2431]/30 bg-[#CB2431]/5 hover:bg-[#CB2431] text-[#CB2431] hover:text-white rounded-[2px] text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                              title="Resolve comment"
                                                                          >
                                                                              {resolvingCommentId === c.id ? (
                                                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                                              ) : (
                                                                                  <Check className="w-3 h-3" />
                                                                              )}
                                                                              <span>
                                                                                  {resolvingCommentId === c.id ? "Resolving..." : "Resolve"}
                                                                              </span>
                                                                          </button>
                                                                      )
                                                                    : (c.userId ===
                                                                          currentUser.id ||
                                                                          task.createdById ===
                                                                              currentUser.id ||
                                                                          task.assignedToId ===
                                                                              currentUser.id) && (
                                                                          <button
                                                                              type="button"
                                                                              disabled={resolvingCommentId !== null}
                                                                              onClick={() =>
                                                                                  handleReopenComment(
                                                                                      c.id,
                                                                                  )
                                                                              }
                                                                              className="px-2 py-0.5 border border-[var(--app-border,#E5E5E3)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text,#1A1A1A)] rounded-[2px] text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                              title="Reopen comment"
                                                                          >
                                                                              {resolvingCommentId === c.id && (
                                                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                                              )}
                                                                              <span>
                                                                                  {resolvingCommentId === c.id ? "Reopening..." : "Reopen"}
                                                                              </span>
                                                                          </button>
                                                                      )}
                                                                {c.userId ===
                                                                    currentUser.id && (
                                                                    <button
                                                                        type="button"
                                                                        disabled={isDeletingComment}
                                                                        onClick={() =>
                                                                            setCommentToDeleteId(
                                                                                c.id,
                                                                            )
                                                                        }
                                                                        className="px-2 py-0.5 border border-[var(--color-danger,#CB2431)]/30 bg-[var(--color-danger,#CB2431)]/10 hover:bg-[var(--color-danger,#CB2431)] text-[var(--color-danger,#CB2431)] hover:text-white rounded-[2px] text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        title="Delete comment permanently"
                                                                    >
                                                                        <span>
                                                                            Delete
                                                                        </span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] text-[var(--app-text,#1A1A1A)] leading-relaxed break-words font-sans">
                                                            {c.content
                                                                .split(" ")
                                                                .map(
                                                                    (word, idx) => {
                                                                        if (
                                                                            word.startsWith(
                                                                                "@",
                                                                            )
                                                                        ) {
                                                                            return (
                                                                                <span
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    className="text-[#1A1A1A] font-semibold underline"
                                                                                >
                                                                                    {
                                                                                        word
                                                                                    }{" "}
                                                                                </span>
                                                                            );
                                                                        }
                                                                        return (
                                                                            word +
                                                                            " "
                                                                        );
                                                                    },
                                                                )}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                            <div ref={commentsEndRef} />
                                        </div>
                                    )}
                                </div>

                                {/* Comment Form Pinned at Bottom */}
                                {canPostComment && (
                                    <form
                                        onSubmit={handleAddComment}
                                        className="flex gap-1.5 shrink-0 pt-2 border-t border-[#E5E5E3]"
                                    >
                                        <input
                                            ref={commentInputRef}
                                            type="text"
                                            placeholder="Write a comment..."
                                            value={comment}
                                            disabled={isSendingComment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className={`flex-1 ${inputClass}`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSendingComment || !comment.trim()}
                                            className="relative corner-brackets-4 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] px-3.5 py-1.5 rounded-[2px] text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSendingComment ? (
                                                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                            ) : (
                                                <span className="w-1.5 h-1.5 bg-[#555555] rounded-[0.5px] inline-block" />
                                            )}
                                            <span>{isSendingComment ? "Sending…" : "Send"}</span>
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* TAB 2: DESCRIPTION */}
                        {activeTab === "description" &&
                            (() => {
                                const cleanText = description
                                    ? description.replace(/<[^>]*>/g, "").trim()
                                    : "";
                                const hasDescription = Boolean(
                                    cleanText.length > 0,
                                );

                                return (
                                    <div className="flex flex-col flex-1 min-h-0 h-full gap-3.5 animate-fade-in text-left">
                                        <div className="flex items-center justify-between shrink-0">
                                            <label className="eyebrow">
                                                Description
                                            </label>
                                            {canEditDetails && (
                                                <div className="flex items-center gap-2">
                                                    {isEditingDescription ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDescription(
                                                                    task.description ||
                                                                        "",
                                                                );
                                                                setIsEditingDescription(
                                                                    false,
                                                                );
                                                            }}
                                                            className="relative corner-brackets-4 bg-[var(--app-card,#FFFFFF)] hover:bg-[var(--app-hover-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)] px-2.5 py-1 text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
                                                        >
                                                            <span>Cancel</span>
                                                        </button>
                                                    ) : hasDescription ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setIsDeleteDescConfirmOpen(
                                                                        true,
                                                                    )
                                                                }
                                                                className="relative corner-brackets-4 bg-white hover:bg-[#FFF5F5] border border-[#E5E5E3] hover:border-[#CB2431] text-[#CB2431] px-2.5 py-1 text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
                                                                title="Delete description"
                                                            >
                                                                <Trash2 className="w-3 h-3 text-[#CB2431]" />
                                                                <span>
                                                                    Delete
                                                                </span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setIsEditingDescription(
                                                                        true,
                                                                    )
                                                                }
                                                                className="relative corner-brackets-4 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] px-2.5 py-1 text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
                                                            >
                                                                <span className="w-1.5 h-1.5 bg-[#555555] rounded-[0.5px] inline-block" />
                                                                <span>
                                                                    Edit
                                                                </span>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setIsEditingDescription(
                                                                    true,
                                                                )
                                                            }
                                                            className="relative corner-brackets-4 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] px-2.5 py-1 text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
                                                        >
                                                            <span className="w-1.5 h-1.5 bg-[#555555] rounded-[0.5px] inline-block" />
                                                            <span>+ Add</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {isEditingDescription ? (
                                            <div className="flex-1 min-h-[250px] flex flex-col">
                                                <TipTapEditor
                                                    value={description}
                                                    onChange={(html) =>
                                                        setDescription(html)
                                                    }
                                                    disabled={!canEditDetails}
                                                />
                                            </div>
                                        ) : hasDescription ? (
                                            <div
                                                className="relative flex-1 min-h-[250px] overflow-y-auto scrollbar-none border border-[#E5E5E3] bg-white p-3.5 text-[11px] text-[#1A1A1A] leading-relaxed rounded-[2.5px] corner-brackets prose-content"
                                                dangerouslySetInnerHTML={{
                                                    __html: description,
                                                }}
                                            />
                                        ) : (
                                            <div
                                                onClick={() =>
                                                    canEditDetails &&
                                                    setIsEditingDescription(
                                                        true,
                                                    )
                                                }
                                                className="relative flex-1 min-h-[250px] border border-dashed border-[#E5E5E3] bg-[#FAFAF9] hover:bg-[#F5F5F3] p-8 text-center rounded-[2px] corner-brackets flex flex-col items-center justify-center gap-1 text-[#888883] cursor-pointer transition-colors my-auto"
                                            >
                                                <FileText className="w-5 h-5 text-[#DADAD6]" />
                                                <span className="text-[11px] font-medium text-[#1A1A1A] mt-1">
                                                    No description added
                                                </span>
                                                <span className="text-[10px]">
                                                    Click "+ Add" or click here
                                                    to write notes for this
                                                    task.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                        {/* TAB 3: ATTACHMENTS */}
                        {activeTab === "attachments" && (
                            <div className="relative flex flex-col flex-1 min-h-0 h-full gap-3 animate-fade-in border border-[#E5E5E3] bg-[#FAFAF9] p-3 rounded-[3px] corner-brackets">
                                {/* Masonry Attachments Gallery filling available height */}
                                <div className="flex-1 overflow-y-auto min-h-0 pr-1 flex flex-col">
                                    {!task.attachments ||
                                    task.attachments.length === 0 ? (
                                        <div
                                            onClick={() =>
                                                !isObserver &&
                                                !isUploadingImage &&
                                                fileInputRef.current?.click()
                                            }
                                            className={`border border-dashed border-[#E5E5E3] bg-white p-8 text-center rounded-[3px] flex flex-col items-center justify-center gap-1 text-[#888883] flex-1 min-h-[250px] ${!isObserver && !isUploadingImage ? "cursor-pointer hover:bg-[#FAFAF9] hover:border-[#888883] transition-all" : ""}`}
                                        >
                                            {isUploadingImage ? (
                                                <Loader2 className="w-5 h-5 text-[#DADAD6] animate-spin" />
                                            ) : (
                                                <Paperclip className="w-5 h-5 text-[#DADAD6]" />
                                            )}
                                            <span className="text-[11px] font-medium text-[#1A1A1A] mt-1">
                                                {isUploadingImage
                                                    ? "Uploading image..."
                                                    : "No attachments uploaded"}
                                            </span>
                                            {!isObserver && (
                                                <span className="text-[10px]">
                                                    {isUploadingImage
                                                        ? "Please wait while your image is uploading..."
                                                        : "Click here or paste an image to upload"}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="columns-2 gap-2 space-y-2 text-left">
                                            {task.attachments.map((att) => {
                                                const isImg =
                                                    att.type === "IMAGE" ||
                                                    att.url.includes(
                                                        "cloudinary.com",
                                                    ) ||
                                                    att.url.startsWith(
                                                        "data:image/",
                                                    ) ||
                                                    att.url.match(
                                                        /\.(jpeg|jpg|gif|png|webp|svg)/i,
                                                    );

                                                return (
                                                    <div
                                                        key={att.id}
                                                        className="break-inside-avoid relative group border border-[#E5E5E3] bg-white rounded-[3px] overflow-hidden"
                                                    >
                                                        {/* Tight Full Image Display */}
                                                        {isImg ? (
                                                            <div
                                                                onClick={() =>
                                                                    setFullscreenImage(
                                                                        att.url,
                                                                    )
                                                                }
                                                                className="w-full relative cursor-pointer block overflow-hidden bg-[#FAFAF9]"
                                                            >
                                                                <img
                                                                    src={
                                                                        att.url
                                                                    }
                                                                    alt={
                                                                        att.name
                                                                    }
                                                                    className="w-full h-auto object-cover block"
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 flex items-center justify-center transition-colors">
                                                                    <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <a
                                                                href={att.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="w-full py-3 bg-[#F5F5F3] flex flex-col items-center justify-center gap-1 p-2 text-center text-[#1A1A1A] hover:bg-[#ECECE9] transition-colors"
                                                            >
                                                                <ExternalLink className="w-4 h-4 text-[#888883]" />
                                                                <span className="text-[9px] text-[#888883] truncate w-full font-medium">
                                                                    {att.name ||
                                                                        "Attachment"}
                                                                </span>
                                                            </a>
                                                        )}

                                                        {/* Delete Action Button at Top-Right Corner */}
                                                        {!isObserver && (
                                                            <button
                                                                type="button"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setAttachmentToDelete(
                                                                        {
                                                                            id: att.id,
                                                                            name: att.name,
                                                                        },
                                                                    );
                                                                    setIsDeleteAttachmentConfirmOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-[#CB2431] text-[#888883] hover:text-white border border-[#E5E5E3] hover:border-[#CB2431] p-1 rounded-[2px] shadow-sm transition-colors cursor-pointer z-10 opacity-0 group-hover:opacity-100"
                                                                title="Delete attachment"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Hidden File Input always rendered in DOM */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageFileUpload}
                                    className="hidden"
                                />

                                {/* Upload Action Button Pinned at Bottom (Only visible after a content is uploaded) */}
                                {!isObserver &&
                                    task.attachments &&
                                    task.attachments.length > 0 && (
                                        <div className="shrink-0 pt-2 border-t border-[#E5E5E3]">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                disabled={isUploadingImage}
                                                className="relative w-full bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] text-[11px] font-medium py-2 rounded-[2px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 corner-brackets"
                                            >
                                                {isUploadingImage ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        <span>Uploading…</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-3.5 h-3.5 text-[#1A1A1A]" />
                                                        <span>
                                                            Upload Image
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>

                    {/* Right Column — Sticky Properties */}
                    <div className="flex flex-col gap-4 sticky top-0 self-start md:col-span-1 border-l border-[#E5E5E3] pl-5 h-full overflow-y-visible text-left">
                        {/* Status */}
                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">Status</label>
                            <CustomSelect
                                disabled={!canEditStatus}
                                options={columns.map((col) => ({
                                    value: col.id,
                                    label: col.name,
                                }))}
                                value={columnId}
                                onChange={(val) => setColumnId(val)}
                                className="w-full"
                            />
                            {!canEditStatus && (
                                <span className="text-[9px] text-[#CB2431] font-medium px-0.5 mt-0.5">
                                    {isObserver
                                        ? "Observers have read-only access."
                                        : "Only workspace leader, task creator, or assignee can change status."}
                                </span>
                            )}
                        </div>

                        {/* Priority */}
                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">Priority</label>
                            <CustomSelect
                                disabled={!canEditDetails}
                                options={[
                                    { value: "LOW", label: "Low" },
                                    { value: "MEDIUM", label: "Medium" },
                                    { value: "HIGH", label: "High" },
                                    { value: "URGENT", label: "Urgent" },
                                ]}
                                value={priority}
                                onChange={(val) => setPriority(val)}
                                className="w-full"
                            />
                        </div>

                        {/* Assignee */}
                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">Assignee</label>
                            <CustomSelect
                                disabled={!canEditDetails}
                                options={
                                    userRole === "MEMBER"
                                        ? [
                                              {
                                                  value: currentUser.id,
                                                  label: `${currentUser.name} (You)`,
                                                  avatarUrl:
                                                      currentUser.avatarUrl ||
                                                      null,
                                              },
                                              ...(task.assignedTo &&
                                              task.assignedTo.id !==
                                                  currentUser.id
                                                  ? [
                                                        {
                                                            value: task
                                                                .assignedTo.id,
                                                            label: task
                                                                .assignedTo
                                                                .name,
                                                            avatarUrl:
                                                                task.assignedTo
                                                                    .avatarUrl ||
                                                                null,
                                                        },
                                                    ]
                                                  : []),
                                          ]
                                        : teamMembers.map(({ user }) => ({
                                              value: user.id,
                                              label:
                                                  user.id === currentUser.id
                                                      ? `${user.name} (You)`
                                                      : user.name,
                                              avatarUrl: user.avatarUrl || null,
                                          }))
                                }
                                value={assignedToId}
                                onChange={(val) => setAssignedToId(val)}
                                className="w-full"
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Start</label>
                                <CustomDatePicker
                                    disabled={!canEditDetails}
                                    value={dateStr}
                                    onChange={(val) => setDateStr(val)}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Due</label>
                                <CustomDatePicker
                                    disabled={!canEditDetails}
                                    value={dueDateStr}
                                    onChange={(val) => setDueDateStr(val)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Time Tracking */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Est. Hours</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    disabled={!canEditDetails}
                                    value={estimatedTime}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (
                                            val === "" ||
                                            (Number(val) >= 0 &&
                                                !val.includes("-"))
                                        ) {
                                            setEstimatedTime(val);
                                        }
                                    }}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Act. Hours</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    disabled={isObserver}
                                    value={actualTime}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (
                                            val === "" ||
                                            (Number(val) >= 0 &&
                                                !val.includes("-"))
                                        ) {
                                            setActualTime(val);
                                        }
                                    }}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Activity Log Button — Pushed to the Very End */}
                        <div className="mt-auto pt-3 border-t border-[var(--app-border,#E5E5E3)]">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAllAuditLog(true);
                                    if (activitiesList.length === 0) {
                                        loadTaskActivities(1);
                                    }
                                }}
                                className="w-full py-1.5 px-2.5 bg-[var(--app-card,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] hover:border-[var(--color-accent,#1A1A1A)] hover:bg-[var(--app-hover-bg,white)] text-[11px] text-[var(--app-text,#1A1A1A)] font-medium rounded-[3px] transition-colors flex items-center justify-between group cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5 min-w-0">
                                    <ClipboardList className="w-3.5 h-3.5 text-[var(--app-muted,#888883)] group-hover:text-[var(--app-text,#1A1A1A)] transition-colors shrink-0" />
                                    <span className="truncate">View Activity Logs</span>
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-[var(--app-muted,#888883)] group-hover:text-[var(--app-text,#1A1A1A)] group-hover:translate-x-0.5 transition-all shrink-0" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning Dialog when trying to close modal with unsaved changes */}
            {showUnsavedWarning && (
                <div className="fixed inset-0 z-60 overflow-hidden flex justify-center items-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white border border-[#E5E5E3] p-5 w-full max-w-md flex flex-col gap-4 text-left shadow-2xl rounded-[4px]">
                        <div className="flex flex-col gap-1 border-b border-[#E5E5E3] pb-3">
                            <h3 className="font-heading text-base font-bold text-[#1A1A1A]">
                                Unsaved Changes Warning
                            </h3>
                            <p className="text-base text-[#888883]">
                                You have unsaved changes to this task. What
                                would you like to do before closing?
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowUnsavedWarning(false)}
                                className="px-3 py-1.5 text-[11px] font-medium text-[#888883] hover:text-[#1A1A1A] border border-[#E5E5E3] rounded-[3px] transition-colors"
                            >
                                Keep Editing
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowUnsavedWarning(false);
                                    onClose();
                                }}
                                className="px-3 py-1.5 text-[11px] font-medium text-[#CB2431] border border-[#CB2431]/20 hover:bg-[#CB2431]/10 rounded-[3px] transition-colors"
                            >
                                Discard & Close
                            </button>
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleSaveChanges(true)}
                                className="px-4 py-1.5 text-[11px] font-medium text-white bg-[#1A1A1A] hover:bg-[#333] rounded-[3px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {isSaving && (
                                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                )}
                                <span>
                                    {isSaving ? "Saving…" : "Save & Close"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Log Modal Overlay */}
            {showAllAuditLog && (
                <div className="fixed inset-0 z-60 overflow-hidden flex justify-center items-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowAllAuditLog(false)}
                    />
                    <div
                        className="relative bg-white border border-[#E5E5E3] p-5 w-full max-w-lg flex flex-col gap-3 animate-fade-in text-left max-h-[80vh]"
                        style={{ boxShadow: "var(--shadow-float)" }}
                    >
                        <div className="flex justify-between items-center pb-2 border-b border-[#E5E5E3]">
                            <div>
                                <h3 className="font-heading text-base font-semibold text-[#1A1A1A]">
                                    Task Audit Log
                                </h3>
                                <p className="text-base text-[#888883]">
                                    Click any row to view exact field changes
                                    for "{task.title}"
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAllAuditLog(false)}
                                className="text-[#888883] hover:text-[#1A1A1A] text-base px-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto flex flex-col gap-2 py-1 pr-1">
                            {isLoadingActivities && activitiesList.length === 0 ? (
                                <div className="py-12 text-center text-[#888883] text-base animate-pulse">
                                    Loading activity logs...
                                </div>
                            ) : activitiesList.length === 0 ? (
                                <div className="py-12 text-center text-[#888883] text-base">
                                    No activity logs recorded for this task.
                                </div>
                            ) : (
                                <>
                                    {activitiesList
                                        .filter((act) => {
                                             const { summaryText, diffs } =
                                                parseActivityInfo(act);
                                            return !(
                                                summaryText ===
                                                    "Updated task details." &&
                                                diffs.length === 0
                                            );
                                        })
                                        .map((act) => {
                                            const { summaryText, diffs } =
                                                parseActivityInfo(act);
                                            const isExpanded =
                                                expandedActivityId === act.id;

                                            return (
                                                <div
                                                    key={act.id}
                                                    onClick={() =>
                                                        setExpandedActivityId(
                                                            isExpanded
                                                                ? null
                                                                : act.id,
                                                        )
                                                    }
                                                    className={`p-3 border transition-colors cursor-pointer text-left ${
                                                        isExpanded
                                                            ? "border-[#1A1A1A] bg-white"
                                                            : "border-[#E5E5E3] bg-[#FAFAF9] hover:border-[#DADAD6]"
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center text-base text-[#888883]">
                                                        <span className="font-semibold text-[#1A1A1A]">
                                                            {act.user?.name ||
                                                                "System"}
                                                        </span>
                                                        <span>
                                                            {new Date(
                                                                act.createdAt,
                                                            ).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <div className="text-[#1A1A1A] font-medium text-[11px] mt-1 flex justify-between items-center">
                                                        <span>{summaryText}</span>
                                                        {diffs.length > 0 && (
                                                            <span className="text-base text-[#888883] hover:text-[#1A1A1A] font-semibold">
                                                                {isExpanded
                                                                    ? "Collapse ▲"
                                                                    : "View Details ▼"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {isExpanded &&
                                                        diffs.length > 0 && (
                                                            <div className="mt-2 pt-2 border-t border-[#E5E5E3] flex flex-col gap-1.5 animate-fade-in">
                                                                {diffs.map(
                                                                    (
                                                                        diff,
                                                                        idx,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="bg-[#FAFAF9] p-2 border border-[#E5E5E3] text-base leading-snug"
                                                                        >
                                                                            <span className="font-semibold text-[#1A1A1A]">
                                                                                {
                                                                                    diff.field
                                                                                }
                                                                                :
                                                                            </span>{" "}
                                                                            <span className="line-through text-[#888883] mr-1">
                                                                                {
                                                                                    diff.from
                                                                                }
                                                                            </span>{" "}
                                                                            <span className="text-[#22863A] font-medium">
                                                                                →{" "}
                                                                                {
                                                                                    diff.to
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                            );
                                        })}

                                    {hasMoreActivities && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                loadTaskActivities(
                                                    activitiesPage + 1,
                                                    true,
                                                )
                                            }
                                            disabled={isLoadingMoreActivities}
                                            className="w-full py-2.5 bg-[#FAFAF9] border border-[#E5E5E3] hover:border-[#1A1A1A] hover:bg-white text-base text-[#1A1A1A] font-medium rounded-[2px] transition-colors mt-2"
                                        >
                                            {isLoadingMoreActivities
                                                ? "Loading more..."
                                                : "Load More Logs"}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Modal Footer with Clear Action */}
                        {canClearActivityLog && activitiesList.length > 0 && (
                            <div className="pt-2.5 mt-auto border-t border-[#E5E5E3] flex justify-between items-center">
                                <span className="text-[11px] text-[#888883]">
                                    Task Creator Action
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsClearActivitiesConfirmOpen(true)}
                                    disabled={isClearingActivities}
                                    className="px-3 py-1.5 text-[11px] font-medium text-[#CB2431] border border-[#CB2431]/20 hover:bg-[#CB2431]/10 rounded-[3px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    title="Clear all activity logs for this task"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Clear Activity Logs</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Confirm Dialog for Description Deletion */}
            <ConfirmDialog
                isOpen={isDeleteDescConfirmOpen}
                title="Delete Description"
                description="Are you sure you want to delete the description from this task? This action cannot be undone."
                confirmText="Delete Description"
                cancelText="Cancel"
                isDanger={true}
                isLoading={isDeletingDescription}
                onConfirm={async () => {
                    await handleDeleteDescription();
                    setIsDeleteDescConfirmOpen(false);
                }}
                onClose={() => setIsDeleteDescConfirmOpen(false)}
            />

            {/* Confirm Dialog for Attachment Deletion */}
            <ConfirmDialog
                isOpen={isDeleteAttachmentConfirmOpen}
                title="Delete Attachment"
                description={`Are you sure you want to delete the attachment "${attachmentToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Attachment"
                cancelText="Cancel"
                isDanger={true}
                isLoading={isDeletingAttachment}
                onConfirm={async () => {
                    if (attachmentToDelete) {
                        await handleDeleteAttachment(
                            attachmentToDelete.id,
                            attachmentToDelete.name,
                        );
                    }
                    setIsDeleteAttachmentConfirmOpen(false);
                    setAttachmentToDelete(null);
                }}
                onClose={() => {
                    setIsDeleteAttachmentConfirmOpen(false);
                    setAttachmentToDelete(null);
                }}
            />

            {/* Custom Confirm Dialog with Corner Marks for Archiving */}
            <ConfirmDialog
                isOpen={isArchiveConfirmOpen}
                title="Archive Task"
                description={`Are you sure you want to archive "${task.title}"? It will be moved to the Trash bin.`}
                confirmText="Archive Task"
                cancelText="Cancel"
                isDanger={true}
                isLoading={isDeleting}
                onConfirm={handleConfirmDelete}
                onClose={() => setIsArchiveConfirmOpen(false)}
            />

            {/* Confirm Dialog for Comment Deletion */}
            <ConfirmDialog
                isOpen={!!commentToDeleteId}
                title="Delete Comment"
                description="Are you sure you want to permanently delete this comment? This action cannot be undone."
                confirmText="Delete Comment"
                cancelText="Cancel"
                isDanger={true}
                isLoading={isDeletingComment}
                onConfirm={async () => {
                    if (commentToDeleteId) {
                        await handleDeleteComment(commentToDeleteId);
                    }
                    setCommentToDeleteId(null);
                }}
                onClose={() => setCommentToDeleteId(null)}
            />

            {/* Confirm Dialog for Activity Logs Deletion */}
            <ConfirmDialog
                isOpen={isClearActivitiesConfirmOpen}
                title="Clear Activity Logs"
                description={`Are you sure you want to clear all activity logs for "${task.title}"? This action cannot be undone.`}
                confirmText="Clear Logs"
                cancelText="Cancel"
                isDanger={true}
                isLoading={isClearingActivities}
                onConfirm={handleClearActivities}
                onClose={() => setIsClearActivitiesConfirmOpen(false)}
            />

            {/* Fullscreen Image View Modal with Top-Right X Close Button */}
            {fullscreenImage && (
                <div
                    onClick={() => setFullscreenImage(null)}
                    className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none"
                >
                    {/* Top-Right X Close Button */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenImage(null);
                        }}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer z-50 border border-white/20"
                        title="Close Fullscreen View"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Compressed Full Image */}
                    <img
                        src={fullscreenImage}
                        alt="Fullscreen Attachment View"
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-[92vw] max-h-[90vh] object-contain rounded-[4px] shadow-2xl border border-white/10"
                    />
                </div>
            )}
        </div>
    );
}
