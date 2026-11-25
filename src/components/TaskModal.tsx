import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";
import { CustomSelect } from "./ui/CustomSelect";
import { CustomDatePicker } from "./ui/CustomDatePicker";
import ConfirmDialog from "./ui/ConfirmDialog";
import { TipTapEditor } from "./ui/TipTapEditor";
import { Task, TaskColumn, User, Comment, TaskActivity, ChecklistItem, api } from "../api";
import { triggerMicroCelebration } from "../utils/confetti";
import { playFeedback } from "../utils/feedback";
import { useWorkspace } from "../context/WorkspaceContext";
import { APP_CONFIG } from "../config/appConfig";
import {
    Upload,
    Trash2,
    Maximize2,
    Minimize2,
    AppWindow,
    Sidebar,
    ExternalLink,
    X,
    Loader2,
    Check,
    FileText,
    MessageSquare,
    Paperclip,
    ClipboardList,
    ChevronRight,
    CheckSquare,
    Plus,
    Pencil,
    ListTodo,
    GripVertical,
    PanelRight,
    ChevronDown,
    Circle,
    AlertTriangle,
    User as UserIcon,
    Calendar,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";

// Portal wrapper: renders the dragging clone on document.body so it escapes
// modal/fixed-position stacking contexts that would shift it away from the cursor.
function PortalAwareDraggable({
    provided,
    snapshot,
    children,
}: {
    provided: DraggableProvided;
    snapshot: DraggableStateSnapshot;
    children: React.ReactNode;
}) {
    const child = (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={provided.draggableProps.style}
        >
            {children}
        </div>
    );
    if (snapshot.isDragging) {
        return ReactDOM.createPortal(child, document.body);
    }
    return child;
}
import SideSheetWrapper from "./ui/SideSheetWrapper";
import ModalWrapper from "./ui/ModalWrapper";
import { Button } from "./ui/Button";

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

const LAST_TASK_TAB_STORAGE_KEY = "last_task_modal_tab";

const getRememberedTab = (): "comments" | "description" | "checklist" | "attachments" => {
    if (typeof window !== "undefined") {
        try {
            const saved = localStorage.getItem(LAST_TASK_TAB_STORAGE_KEY);
            if (
                saved === "comments" ||
                saved === "description" ||
                saved === "checklist" ||
                saved === "attachments"
            ) {
                return saved;
            }
        } catch {}
    }
    return "comments";
};

const sortChecklist = (items: ChecklistItem[] = []): ChecklistItem[] => {
    return [...items].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) {
            return timeA - timeB;
        }
        return (a.id || "").localeCompare(b.id || "");
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
    initialTab?: "details" | "comments" | "description" | "checklist" | "attachments";
}

export default function TaskModal({
    task: incomingTask,
    isOpen,
    onClose,
    columns,
    teamMembers,
    currentUser,
    userRole,
    onRefresh,
    initialTab = "details",
}: TaskModalProps) {
    const lastTaskRef = React.useRef(incomingTask);
    if (incomingTask) {
        lastTaskRef.current = incomingTask;
    }
    const task = incomingTask || lastTaskRef.current;

    const getTaskStartDate = (t: any): string => {
        if (!t) return "";
        if (t.startDate) return t.startDate.split("T")[0];
        if (t.originalDate) return t.originalDate.split("T")[0];
        if (t.date) return t.date.split("T")[0];
        return "";
    };

    const { openMemberProfile, commentUpdateTrigger } = useWorkspace();
    // Form Local State (prevents auto-saving on every keystroke)
    const [title, setTitle] = useState(task?.title || "");
    const [description, setDescription] = useState(task?.description || "");
    const [columnId, setColumnId] = useState(task?.columnId || "");
    const [priority, setPriority] = useState(task?.priority || "Medium");
    const [assignedToId, setAssignedToId] = useState(task?.assignedToId || "");
    const [dateStr, setDateStr] = useState(getTaskStartDate(task));
    const [dueDateStr, setDueDateStr] = useState(
        task?.dueDate ? task.dueDate.split("T")[0] : "",
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

    const [isExpanded, setIsExpanded] = useState(false);
    const [viewMode, setViewMode] = useState<"side_sheet" | "modal">(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("team_task_view_mode");
                if (saved === "modal" || saved === "side_sheet") {
                    return saved;
                }
            } catch (e) {}
        }
        return "side_sheet";
    });

    const toggleViewMode = () => {
        const nextMode = viewMode === "side_sheet" ? "modal" : "side_sheet";
        setViewMode(nextMode);
        try {
            localStorage.setItem("team_task_view_mode", nextMode);
            toast.success(
                nextMode === "modal" ? "Switched to Center Modal view" : "Switched to Side Sheet view",
                { duration: 2000, id: "team-task-view-mode" }
            );
        } catch {
            // Ignore
        }
    };

    // Modal sub-components state
    const [sidebarTab, setSidebarTab] = useState<"comments" | "attachments">(() => {
        const remembered = getRememberedTab();
        return remembered === "attachments" ? "attachments" : "comments";
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [showMoreProperties, setShowMoreProperties] = useState(false);

    const checklistSectionRef = useRef<HTMLDivElement>(null);
    const descriptionSectionRef = useRef<HTMLDivElement>(null);

    const handleSidebarTabChange = useCallback(
        (tab: "comments" | "attachments") => {
            setSidebarTab(tab);
            if (typeof window !== "undefined") {
                try {
                    localStorage.setItem(LAST_TASK_TAB_STORAGE_KEY, tab);
                } catch {}
            }
        },
        [],
    );

    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [comment, setComment] = useState("");
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [hiddenCommentIds, setHiddenCommentIds] = useState<string[]>([]);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() =>
        sortChecklist(task?.checklist || []),
    );
    const [newSubtask, setNewSubtask] = useState("");
    const checklistInputRef = useRef<HTMLInputElement>(null);
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingItemTitle, setEditingItemTitle] = useState("");
    const [isUpdatingItemId, setIsUpdatingItemId] = useState<string | null>(null);
    const [isDeletingItemId, setIsDeletingItemId] = useState<string | null>(null);
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
    const mentionMenuRef = React.useRef<HTMLDivElement>(null);

    // Mention Autocomplete Popover state
    const [showMentionMenu, setShowMentionMenu] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionIndex, setMentionIndex] = useState(0);

    const mentionOptions = React.useMemo(() => {
        const query = mentionQuery.toLowerCase();

        // Mentions are strictly for Leaders (and @leaders) across all workspace users
        const allLeadersInTeam = (teamMembers || []).filter(({ role }) => role === "LEADER");
        const leaderMembers = allLeadersInTeam.filter(({ user }) => user.id !== currentUser?.id);

        const options = [];

        // Only include @leaders group option if there are multiple leaders in the workspace
        if (allLeadersInTeam.length > 1) {
            options.push({
                id: "leaders-group",
                name: "leaders",
                label: "@leaders",
                description: "Notify all Leaders in workspace",
                role: "LEADER",
                isGroup: true,
            });
        }

        options.push(
            ...leaderMembers.map(({ user, role }) => ({
                id: user.id,
                name: user.fullName,
                label: `@${user.fullName}`,
                description: user.designation || user.email,
                role: role,
                isGroup: false,
            }))
        );

        if (!query) return options;

        return options.filter(
            (opt) =>
                opt.name.toLowerCase().includes(query) ||
                opt.role.toLowerCase().includes(query) ||
                opt.label.toLowerCase().includes(query)
        );
    }, [mentionQuery, teamMembers, currentUser?.id]);

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setComment(val);

        const cursorPos = e.target.selectionStart || val.length;
        const textBeforeCursor = val.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
            const query = textBeforeCursor.substring(lastAtIndex + 1);
            if (!/[\n,]/.test(query) && query.length <= 30) {
                setMentionQuery(query);
                setShowMentionMenu(true);
                setMentionIndex(0);
                return;
            }
        }
        setShowMentionMenu(false);
    };

    const insertMention = (opt: { name: string; isGroup?: boolean }) => {
        if (!commentInputRef.current) return;
        const inputEl = commentInputRef.current;
        const cursorPos = inputEl.selectionStart || comment.length;
        const textBeforeCursor = comment.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
            const beforeAt = comment.substring(0, lastAtIndex);
            const afterCursor = comment.substring(cursorPos);
            const mentionText = opt.isGroup ? `@leaders ` : `@${opt.name} `;
            const updated = beforeAt + mentionText + afterCursor;
            setComment(updated);
            setShowMentionMenu(false);

            setTimeout(() => {
                inputEl.focus();
                const newPos = beforeAt.length + mentionText.length;
                inputEl.setSelectionRange(newPos, newPos);
            }, 0);
        }
    };

    const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showMentionMenu || mentionOptions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setMentionIndex((prev) => (prev + 1) % mentionOptions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setMentionIndex((prev) => (prev - 1 + mentionOptions.length) % mentionOptions.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            const selected = mentionOptions[mentionIndex];
            if (selected) {
                insertMention(selected);
            }
        } else if (e.key === "Escape") {
            setShowMentionMenu(false);
        }
    };

    React.useEffect(() => {
        function handleOutsideClick(e: MouseEvent) {
            if (
                mentionMenuRef.current &&
                !mentionMenuRef.current.contains(e.target as Node) &&
                commentInputRef.current &&
                !commentInputRef.current.contains(e.target as Node)
            ) {
                setShowMentionMenu(false);
            }
        }
        if (showMentionMenu) {
            document.addEventListener("mousedown", handleOutsideClick);
        }
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [showMentionMenu]);

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
            setDateStr(getTaskStartDate(task));
            setDueDateStr(task.dueDate ? task.dueDate.split("T")[0] : "");
            setChecklistItems(sortChecklist(task.checklist || []));
            setShowUnsavedWarning(false);

            setShowMoreProperties(false);

            if (initialTab === "comments" || initialTab === "attachments") {
                setIsSidebarOpen(true);
                setSidebarTab(initialTab);
                if (typeof window !== "undefined") {
                    try {
                        localStorage.setItem(LAST_TASK_TAB_STORAGE_KEY, initialTab);
                    } catch {}
                }
            } else {
                setIsSidebarOpen(true);
                const remembered = getRememberedTab();
                setSidebarTab(remembered === "attachments" ? "attachments" : "comments");

                if (initialTab === "checklist") {
                    setTimeout(() => {
                        checklistSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 80);
                } else if (initialTab === "description") {
                    setTimeout(() => {
                        descriptionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 80);
                }
            }
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
            const prevStart = getTaskStartDate(prevTask);
            if (dateStr === prevStart) {
                setDateStr(getTaskStartDate(task));
            }
            const prevDueDate = prevTask.dueDate
                ? prevTask.dueDate.split("T")[0]
                : "";
            if (dueDateStr === prevDueDate) {
                setDueDateStr(task.dueDate ? task.dueDate.split("T")[0] : "");
            }
            setChecklistItems(sortChecklist(task.checklist || []));
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
            if (!silent) {
                toast.error(err.message || "Failed to load comments.");
            }
        } finally {
            if (!silent) {
                setIsLoadingComments(false);
                setIsLoadingMore(false);
            }
        }
    }, [task?.id]);

    useEffect(() => {
        if (isOpen) {
            const silent = commentsList.length > 0;
            loadTaskComments(1, false, silent);
        }
    }, [isOpen, task.id, commentUpdateTrigger, loadTaskComments]);

    useLayoutEffect(() => {
        if (!isOpen) return;
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
    }, [commentsList, isOpen]);

    const handleCommentsScroll = () => {
        if (!commentsContainerRef.current) return;
        const { scrollTop } = commentsContainerRef.current;
        setShowLoadMore(scrollTop <= 15);
    };

    // Calculate dirty status (un-saved changes exist)
    const isTitleDirty = title !== task.title;
    const isDescDirty = description !== (task.description || "");
    const isPriorityDirty = priority !== task.priority;
    const isAssigneeDirty = assignedToId !== task.assignedToId;
    const isDateDirty = dateStr !== getTaskStartDate(task);
    const isDueDateDirty =
        dueDateStr !== (task.dueDate ? task.dueDate.split("T")[0] : "");

    const isDirty =
        isTitleDirty ||
        isDescDirty ||
        isPriorityDirty ||
        isAssigneeDirty ||
        isDateDirty ||
        isDueDateDirty;

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
                    setIsSidebarOpen(true);
                    handleSidebarTabChange("attachments");
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
    }, [isOpen, task?.id, currentUser?.id, userRole, onRefresh]);

    if (!task) return null;

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

    // Save status/column change immediately and independently from date/detail edits
    const handleStatusChange = async (newColumnId: string) => {
        if (!canEditStatus || newColumnId === columnId) return;
        const prevColumnId = columnId;
        setColumnId(newColumnId);
        if (prevTaskRef.current) {
            prevTaskRef.current = { ...prevTaskRef.current, columnId: newColumnId };
        }
        try {
            await api.updateTask(
                task.id,
                { columnId: newColumnId },
                {
                    userId: currentUser.id,
                    teamId: task.teamId,
                },
            );

            const newCol = columns.find((c) => c.id === newColumnId);
            const oldCol = columns.find((c) => c.id === prevColumnId);
            const isNewDone =
                newCol?.isComplete ||
                newCol?.name.toLowerCase().includes("done") ||
                newCol?.name.toLowerCase().includes("complete");
            const isOldDone =
                oldCol?.isComplete ||
                oldCol?.name.toLowerCase().includes("done") ||
                oldCol?.name.toLowerCase().includes("complete");

            if (isNewDone && !isOldDone) {
                triggerMicroCelebration({ intensity: "medium" });
            }

            toast.success("Status updated!");
            onRefresh();
        } catch (err: any) {
            setColumnId(prevColumnId);
            if (prevTaskRef.current) {
                prevTaskRef.current = { ...prevTaskRef.current, columnId: prevColumnId };
            }
            toast.error(err.message || "Failed to update status.");
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

        const datesModified = isDateDirty || isDueDateDirty;
        if (datesModified && dateStr && dueDateStr && dateStr > dueDateStr) {
            toast.error("Start date cannot be later than due date.");
            return;
        }

        setIsSaving(true);
        try {
            const payload: Record<string, any> = {
                title,
                description,
                columnId,
                priority,
                assignedToId,
            };
            if (datesModified) {
                payload.startDate = dateStr;
                payload.date = dateStr;
                payload.dueDate = dueDateStr || null;
            }

            await api.updateTask(
                task.id,
                payload,
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

            // Immediately sync prevTaskRef to the just-saved values so that
            // when onRefresh() re-renders with the updated task prop the dirty
            // comparisons all resolve to "no change" and isDirty becomes false.
            prevTaskRef.current = {
                ...task,
                title,
                description,
                columnId,
                priority,
                assignedToId: assignedToId || null,
                startDate: dateStr ? `${dateStr}T00:00:00.000Z` : null,
                originalDate: dateStr ? `${dateStr}T00:00:00.000Z` : null,
                date: dateStr ? `${dateStr}T00:00:00.000Z` : null,
                dueDate: dueDateStr ? `${dueDateStr}T00:00:00.000Z` : null,
            } as any;

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
                        ?.user.fullName;
                    if (uFrom) fromVal = uFrom;
                    const uTo = teamMembers.find((m) => m.user.id === toVal)
                        ?.user.fullName;
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

    // Helper to resolve Done column
    const getDoneColumn = () => {
        return (
            columns.find((c) => c.isComplete) ||
            columns.find((c) => {
                const name = c.name.toLowerCase().trim();
                return name === "done" || name === "complete" || name === "completed";
            }) ||
            columns.find((c) => {
                const name = c.name.toLowerCase();
                return name.includes("done") || name.includes("complete");
            }) ||
            columns[columns.length - 1]
        );
    };

    // Helper to resolve In-Progress column
    const getInProgressColumn = () => {
        return (
            columns.find((c) => {
                if (c.isComplete) return false;
                const name = c.name.toLowerCase().trim();
                return (
                    name === "in progress" ||
                    name === "in-progress" ||
                    name === "doing" ||
                    name === "progress" ||
                    name === "wip" ||
                    name === "in dev" ||
                    name === "development"
                );
            }) ||
            columns.find((c) => {
                if (c.isComplete) return false;
                const name = c.name.toLowerCase();
                return (
                    name.includes("progress") ||
                    name.includes("doing") ||
                    name.includes("wip") ||
                    name.includes("dev")
                );
            }) ||
            columns.find((c) => !c.isComplete) ||
            columns[0]
        );
    };

    // Helper to check if a column represents Done / Completed
    const isColumnDone = (colId: string) => {
        const col = columns.find((c) => c.id === colId);
        if (!col) return false;
        return (
            col.isComplete ||
            col.name.toLowerCase().includes("done") ||
            col.name.toLowerCase().includes("complete")
        );
    };

    // Auto-sync task status with checklist completion state
    const autoSyncTaskStatus = async (items: ChecklistItem[]) => {
        if (!items || items.length === 0 || !columns || columns.length === 0) return;

        const allChecked = items.every((i) => i.isCompleted);
        const hasUnchecked = items.some((i) => !i.isCompleted);
        const isCurrentlyDone = isColumnDone(columnId);

        if (allChecked && !isCurrentlyDone) {
            const doneCol = getDoneColumn();
            if (doneCol && doneCol.id !== columnId) {
                setColumnId(doneCol.id);
                try {
                    await api.updateTask(
                        task.id,
                        { columnId: doneCol.id },
                        { userId: currentUser.id, teamId: task.teamId },
                    );
                    triggerMicroCelebration({ intensity: "epic" });
                    playFeedback("complete");
                    toast.success("All subtasks completed! Task moved to Done.");
                } catch (err: any) {
                    console.error("Failed to auto-update task to Done:", err);
                }
            }
        } else if (hasUnchecked && isCurrentlyDone) {
            const inProgressCol = getInProgressColumn();
            if (inProgressCol && inProgressCol.id !== columnId) {
                setColumnId(inProgressCol.id);
                try {
                    await api.updateTask(
                        task.id,
                        { columnId: inProgressCol.id },
                        { userId: currentUser.id, teamId: task.teamId },
                    );
                    playFeedback("click");
                    toast("Subtask unchecked. Task moved back to In Progress.");
                } catch (err: any) {
                    console.error("Failed to auto-update task to In Progress:", err);
                }
            }
        }
    };

    const handleAddSubtask = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isObserver) return;
        const trimmed = newSubtask.trim();
        if (!trimmed) return;

        setIsAddingSubtask(true);
        try {
            const newItem = await api.addChecklistItem(task.id, trimmed);
            setNewSubtask("");
            let updatedList = checklistItems;
            if (newItem && newItem.id) {
                setChecklistItems((prev) => {
                    if (prev.some((item) => item.id === newItem.id)) return prev;
                    updatedList = [...prev, newItem];
                    return updatedList;
                });
                updatedList = [...checklistItems, newItem];
            }
            toast.success("Checklist item added");
            playFeedback("click");

            // If the task was previously Done, adding an incomplete subtask brings it back to In Progress
            await autoSyncTaskStatus(updatedList);

            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to add checklist item");
        } finally {
            setIsAddingSubtask(false);
            setTimeout(() => {
                checklistInputRef.current?.focus();
            }, 0);
        }
    };

    const handleToggleSubtask = async (itemId: string, checked: boolean) => {
        if (isObserver) {
            toast.error(
                "Observers have read-only access and cannot update checklists.",
            );
            return;
        }
        setIsUpdatingItemId(itemId);
        
        const nextItems = checklistItems.map((item) =>
            item.id === itemId ? { ...item, isCompleted: checked } : item,
        );

        // Optimistic update
        setChecklistItems(nextItems);

        try {
            await api.updateChecklistItem(task.id, itemId, checked);

            // Auto-sync status: if all checked -> Done, if one is unchecked after Done -> In Progress
            await autoSyncTaskStatus(nextItems);

            if (checked && !nextItems.every((i) => i.isCompleted)) {
                triggerMicroCelebration({ intensity: "subtle" });
                playFeedback("click");
            } else if (!checked && !isColumnDone(columnId)) {
                playFeedback("click");
            }

            onRefresh();
        } catch (err: any) {
            // Revert optimistic update
            setChecklistItems((prev) =>
                prev.map((item) =>
                    item.id === itemId ? { ...item, isCompleted: !checked } : item,
                ),
            );
            toast.error(err.message || "Failed to update checklist item");
        } finally {
            setIsUpdatingItemId(null);
        }
    };

    const handleSaveEditedTitle = async (itemId: string) => {
        if (isObserver) return;
        const trimmed = editingItemTitle.trim();
        if (!trimmed) {
            toast.error("Checklist item title cannot be empty");
            return;
        }

        const original = checklistItems.find((item) => item.id === itemId)?.title || "";
        if (trimmed === original) {
            setEditingItemId(null);
            setEditingItemTitle("");
            return;
        }

        setIsUpdatingItemId(itemId);
        // Optimistic update
        setChecklistItems((prev) =>
            prev.map((item) =>
                item.id === itemId ? { ...item, title: trimmed } : item,
            ),
        );
        setEditingItemId(null);
        setEditingItemTitle("");

        try {
            await api.updateChecklistItem(task.id, itemId, { title: trimmed });
            toast.success("Checklist item updated");
            playFeedback("click");
            onRefresh();
        } catch (err: any) {
            // Revert optimistic update
            setChecklistItems((prev) =>
                prev.map((item) =>
                    item.id === itemId ? { ...item, title: original } : item,
                ),
            );
            toast.error(err.message || "Failed to update checklist item");
        } finally {
            setIsUpdatingItemId(null);
        }
    };

    const handleDragEndChecklist = async (result: DropResult) => {
        if (!result.destination || isObserver) return;
        if (result.destination.index === result.source.index) return;

        const items = Array.from(checklistItems);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Optimistically update UI
        setChecklistItems(items);
        playFeedback("click");

        // Silently persist in database
        const payload = items.map((item, index) => ({
            id: item.id,
            order: index,
        }));

        try {
            await api.reorderChecklistItems(task.id, payload);
        } catch (err) {
            console.error("Failed to reorder checklist items silently:", err);
        }
    };

    const handleDeleteSubtask = async (itemId: string) => {
        if (isObserver) return;
        setIsDeletingItemId(itemId);
        const removedItem = checklistItems.find((i) => i.id === itemId);
        const nextItems = checklistItems.filter((item) => item.id !== itemId);
        // Optimistic delete
        setChecklistItems(nextItems);

        try {
            playFeedback("delete");
            await api.deleteChecklistItem(task.id, itemId);
            toast.success("Checklist item deleted");

            // If remaining items are now all completed, sync status to Done
            if (nextItems.length > 0) {
                await autoSyncTaskStatus(nextItems);
            }

            onRefresh();
        } catch (err: any) {
            if (removedItem) {
                setChecklistItems((prev) => sortChecklist([...prev, removedItem]));
            }
            toast.error(err.message || "Failed to delete checklist item");
        } finally {
            setIsDeletingItemId(null);
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

    const modalInner = (
        <div className="w-full h-full flex flex-col min-h-0 overflow-hidden bg-white text-[#1A1A1A] select-none">
            {/* Modal Top Header Bar */}
            <div className="px-4 py-3 border-b border-[#E5E5E3] flex justify-between items-center bg-[#FAFAF9] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[11px] font-medium text-[#888883] truncate">
                        Task Details
                    </span>
                    {isDirty && (
                        <span className="text-[11px] text-[#B08800] bg-[#B08800]/10 px-2 py-0.5 rounded-[2px] font-medium shrink-0">
                            Unsaved Changes
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Right Sidebar Toggle (Comments / Attachments) */}
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen((prev) => !prev)}
                        className={`px-2 py-1.5 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                            isSidebarOpen
                                ? "bg-[#E5E5E3]/70 text-[#1A1A1A] border border-[#E5E5E3]"
                                : "text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 border border-transparent"
                        }`}
                        title={isSidebarOpen ? "Hide comments & attachments panel" : "Show comments & attachments panel"}
                    >
                        <PanelRight className="w-4 h-4" />
                        {(visibleComments.length > 0 || (task.attachments?.length || 0) > 0) && (
                            <span className="text-[10px] bg-white border border-[#E5E5E3] px-1.5 py-0.2 rounded-[2px] tabular-nums text-[#1A1A1A]">
                                {visibleComments.length + (task.attachments?.length || 0)}
                            </span>
                        )}
                    </button>

                    {/* View Mode Toggle (Center Modal vs Side Sheet) */}
                    <button
                        type="button"
                        onClick={toggleViewMode}
                        className="p-1.5 text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 rounded-[2px] transition-colors cursor-pointer"
                        title={
                            viewMode === "side_sheet"
                                ? "Switch to Center Modal view (remembered)"
                                : "Switch to Side Sheet view (remembered)"
                        }
                    >
                        {viewMode === "side_sheet" ? (
                            <AppWindow className="w-4 h-4" />
                        ) : (
                            <Sidebar className="w-4 h-4" />
                        )}
                    </button>

                    {/* Expand / Minimize Full Width Toggle */}
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 rounded-[2px] transition-colors cursor-pointer"
                        title={isExpanded ? "Collapse to default width" : "Expand to full width"}
                    >
                        {isExpanded ? (
                            <Minimize2 className="w-4 h-4" />
                        ) : (
                            <Maximize2 className="w-4 h-4" />
                        )}
                    </button>

                    {/* Archive — always visible when permitted */}
                    {canDeleteTask && (
                        <button
                            type="button"
                            onClick={handleDeleteTask}
                            className="border border-[#E5E5E3] hover:border-[#CB2431]/30 hover:bg-[#CB2431]/5 text-[#888883] hover:text-[#CB2431] text-[11px] px-2.5 py-1 rounded-[2px] font-medium transition-colors cursor-pointer"
                        >
                            Archive
                        </button>
                    )}

                    {/* Save Changes button — filled with accent color when there are unsaved changes */}
                    {!isObserver && (
                        <Button
                            type="button"
                            variant={isDirty ? "accent" : "secondary"}
                            size="sm"
                            onClick={() => handleSaveChanges(true)}
                            disabled={isSaving}
                            isLoading={isSaving}
                            loadingText="Saving…"
                            icon={!isSaving ? <Check className="w-3.5 h-3.5" /> : undefined}
                            className={`!h-[30px] !px-3 !text-xs transition-all ${
                                isDirty
                                    ? "!bg-[var(--color-accent)] !border-[var(--color-accent)] !text-white hover:!opacity-90 shadow-sm font-semibold"
                                    : "!bg-[var(--app-card)] !border-[var(--app-border)] !text-[var(--app-muted)] hover:!text-[var(--app-text)] font-medium"
                            }`}
                            title="Save Changes"
                        >
                            Save Changes
                        </Button>
                    )}

                    <button
                        type="button"
                        onClick={handleAttemptClose}
                        className="text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 rounded-[2px] transition-colors p-1 cursor-pointer"
                        title="Close modal (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

                {/* Content Layout: Notion-style Left Scrollable Page + Right Collapsible Sidebar */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-white">
                    {/* Left Column: Notion-style Scrollable Page (Title -> Metadata Properties -> Checklist -> Description) */}
                    <div className={`flex-1 overflow-y-auto custom-scrollbar h-full min-h-0 text-left ${isSidebarOpen ? "md:border-r md:border-[#E5E5E3]" : ""}`}>
                        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-5 flex flex-col gap-6">
                            {/* 1. Title Section (Underline Hero Input, No Label) */}
                            <div className="shrink-0">
                                {!canEditDetails ? (
                                    <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight font-heading pt-1 select-text">
                                        {title}
                                    </h2>
                                ) : (
                                    <div className="border-b-2 border-[#E5E5E3] focus-within:border-[var(--color-accent)] transition-colors">
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Task title…"
                                            aria-label="Task title"
                                            maxLength={APP_CONFIG.MAX_TASK_TITLE_LENGTH}
                                            className="w-full px-0 py-1.5 text-xl font-semibold tracking-tight bg-transparent border-0 text-[#1A1A1A] rounded-none focus:outline-none placeholder:text-[#888883]/60"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 2. Notion-style 2-Column Metadata Properties */}
                            <div className="flex flex-col gap-1.5 pb-3 border-b border-[#E5E5E3]/80">
                                {/* Status */}
                                <div className="grid grid-cols-[115px_1fr] sm:grid-cols-[135px_1fr] items-center gap-2 py-0.5">
                                    <span className="text-xs text-[#888883] flex items-center gap-2 truncate">
                                        <Circle className="w-3.5 h-3.5 shrink-0 opacity-75" />
                                        <span>Status</span>
                                    </span>
                                    <div className="min-w-0">
                                        <CustomSelect
                                            disabled={!canEditStatus}
                                            options={columns.map((col) => ({
                                                value: col.id,
                                                label: col.name,
                                            }))}
                                            value={columnId}
                                            onChange={handleStatusChange}
                                            buttonClassName="!border-transparent hover:!border-[#E5E5E3] !bg-transparent hover:!bg-[#FAFAF9] !px-2 !py-1 !h-7 text-xs font-medium"
                                            className="w-full sm:w-auto min-w-[200px]"
                                        />
                                    </div>
                                </div>

                                {/* Priority */}
                                <div className="grid grid-cols-[115px_1fr] sm:grid-cols-[135px_1fr] items-center gap-2 py-0.5">
                                    <span className="text-xs text-[#888883] flex items-center gap-2 truncate">
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 opacity-75" />
                                        <span>Priority</span>
                                    </span>
                                    <div className="min-w-0">
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
                                            buttonClassName="!border-transparent hover:!border-[#E5E5E3] !bg-transparent hover:!bg-[#FAFAF9] !px-2 !py-1 !h-7 text-xs font-medium"
                                            className="w-full sm:w-auto min-w-[200px]"
                                        />
                                    </div>
                                </div>

                                {/* Assignee */}
                                <div className="grid grid-cols-[115px_1fr] sm:grid-cols-[135px_1fr] items-center gap-2 py-0.5">
                                    <span className="text-xs text-[#888883] flex items-center gap-2 truncate">
                                        <UserIcon className="w-3.5 h-3.5 shrink-0 opacity-75" />
                                        <span>Assignee</span>
                                    </span>
                                    <div className="min-w-0">
                                        <CustomSelect
                                            disabled={!canEditDetails}
                                            options={
                                                userRole === "MEMBER"
                                                    ? [
                                                          {
                                                              value: currentUser.id,
                                                              label: `${currentUser.fullName} (You)`,
                                                              avatarUrl: currentUser.avatarUrl || null,
                                                          },
                                                          ...(task.assignedTo && task.assignedTo.id !== currentUser.id
                                                              ? [
                                                                    {
                                                                        value: task.assignedTo.id,
                                                                        label: task.assignedTo.fullName,
                                                                        avatarUrl: task.assignedTo.avatarUrl || null,
                                                                    },
                                                                ]
                                                              : []),
                                                      ]
                                                    : teamMembers.map(({ user }) => ({
                                                          value: user.id,
                                                          label: user.id === currentUser.id ? `${user.fullName} (You)` : user.fullName,
                                                          avatarUrl: user.avatarUrl || null,
                                                      }))
                                            }
                                            value={assignedToId}
                                            onChange={(val) => setAssignedToId(val)}
                                            buttonClassName="!border-transparent hover:!border-[#E5E5E3] !bg-transparent hover:!bg-[#FAFAF9] !px-2 !py-1 !h-7 text-xs font-medium"
                                            className="w-full sm:w-auto min-w-[200px]"
                                        />
                                    </div>
                                </div>

                                {/* Timeline (Start -> Due) */}
                                <div className="grid grid-cols-[115px_1fr] sm:grid-cols-[135px_1fr] items-center gap-2 py-0.5">
                                    <span className="text-xs text-[#888883] flex items-center gap-2 truncate">
                                        <Calendar className="w-3.5 h-3.5 shrink-0 opacity-75" />
                                        <span>Timeline</span>
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                                        <div className="w-[140px]">
                                            <CustomDatePicker
                                                disabled={!canEditDetails}
                                                value={dateStr}
                                                maxDate={dueDateStr || undefined}
                                                align="left"
                                                onChange={(val) => {
                                                    setDateStr(val);
                                                    if (dueDateStr && val > dueDateStr) {
                                                        setDueDateStr(val);
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                        <span className="text-xs text-[#888883]">→</span>
                                        <div className="w-[140px]">
                                            <CustomDatePicker
                                                disabled={!canEditDetails}
                                                value={dueDateStr}
                                                minDate={dateStr || undefined}
                                                align="left"
                                                onChange={(val) => {
                                                    setDueDateStr(val);
                                                    if (dateStr && val < dateStr) {
                                                        setDateStr(val);
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowMoreProperties((prev) => !prev)}
                                            className="inline-flex items-center gap-1 text-[11px] text-[#888883] hover:text-[#1A1A1A] transition-colors cursor-pointer ml-1"
                                        >
                                            {showMoreProperties ? (
                                                <ChevronDown className="w-3 h-3" />
                                            ) : (
                                                <ChevronRight className="w-3 h-3" />
                                            )}
                                            <span>{showMoreProperties ? "Less" : "More"}</span>
                                        </button>
                                    </div>
                                </div>

                                {showMoreProperties && (
                                    <div className="grid grid-cols-[115px_1fr] sm:grid-cols-[135px_1fr] items-center gap-2 py-0.5 animate-fade-in">
                                        <span className="text-[11px] text-[#888883] pl-5 truncate">
                                            Created
                                        </span>
                                        <span className="text-[11px] text-[#1A1A1A] tabular-nums">
                                            {task.createdBy?.fullName || "—"} • {new Date(task.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}

                                {!canEditStatus && (
                                    <div className="pt-1">
                                        <span className="text-[10px] text-[#CB2431] font-medium">
                                            {isObserver
                                                ? "Observers have read-only access."
                                                : "Only workspace leader, task creator, or assignee can change status."}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 3. Checklist Section (Seamless Notion-style) */}
                            {(() => {
                                const totalCount = checklistItems.length;
                                const completedCount = checklistItems.filter((c) => c.isCompleted).length;
                                const progressPercent = totalCount > 0
                                    ? Math.round((completedCount / totalCount) * 100)
                                    : 0;

                                return (
                                    <div ref={checklistSectionRef} className="flex flex-col shrink-0 gap-3">
                                        {/* Header & Progress */}
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <CheckSquare className="w-4 h-4 text-[#888883]" />
                                                    <h4 className="text-xs font-semibold text-[#1A1A1A]">
                                                        Checklist
                                                    </h4>
                                                    {totalCount > 0 && (
                                                        <span className="text-[10px] bg-[#FAFAF9] border border-[#E5E5E3] px-1.5 py-0.2 rounded-[2px] text-[#888883] tabular-nums">
                                                            {completedCount}/{totalCount}
                                                        </span>
                                                    )}
                                                </div>
                                                {totalCount > 0 && (
                                                    <span className="text-[11px] font-normal text-[#888883] tabular-nums">
                                                        {progressPercent}% completed
                                                    </span>
                                                )}
                                            </div>

                                            {totalCount > 0 && (
                                                <div className="w-full h-1 bg-[#F5F5F3] rounded-[2px] border border-[#E5E5E3] overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#1A1A1A] transition-all duration-300 rounded-[1px]"
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Add New Checklist Item Input */}
                                        {!isObserver && (
                                            <form
                                                onSubmit={handleAddSubtask}
                                                className="flex items-center gap-2 shrink-0"
                                            >
                                                <input
                                                    ref={checklistInputRef}
                                                    type="text"
                                                    placeholder="Add a checklist item (press Enter)..."
                                                    value={newSubtask}
                                                    onChange={(e) => setNewSubtask(e.target.value)}
                                                    disabled={isAddingSubtask}
                                                    className="flex-1 px-3 py-1.5 text-xs bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] placeholder-[#888883] rounded-[2px] focus:outline-none focus:bg-white focus:border-[#1A1A1A] transition-colors"
                                                    maxLength={300}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isAddingSubtask || !newSubtask.trim()}
                                                    className="px-3 py-1.5 bg-[#FAFAF9] hover:bg-[#F0F0EE] text-[#1A1A1A] border border-[#DADAD6] text-xs font-semibold rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                                >
                                                    {isAddingSubtask ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Plus className="w-3.5 h-3.5" />
                                                    )}
                                                    <span>Add</span>
                                                </button>
                                            </form>
                                        )}

                                        {/* Checklist Items List */}
                                        <div className="flex flex-col gap-1.5">
                                            {checklistItems.length === 0 ? (
                                                isObserver && (
                                                    <p className="text-xs text-[#888883] italic">No checklist items.</p>
                                                )
                                            ) : (
                                                <DragDropContext onDragEnd={handleDragEndChecklist}>
                                                    <Droppable droppableId="team-task-checklist-droppable">
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.droppableProps}
                                                                className="flex flex-col gap-1.5"
                                                            >
                                                                {checklistItems.map((item, index) => {
                                                                    const isEditing = editingItemId === item.id;
                                                                    const isUpdating = isUpdatingItemId === item.id;
                                                                    const isDeleting = isDeletingItemId === item.id;

                                                                    return (
                                                                        <Draggable
                                                                            key={item.id}
                                                                            draggableId={item.id}
                                                                            index={index}
                                                                            isDragDisabled={isObserver || isEditing}
                                                                        >
                                                                            {(dragProvided, dragSnapshot) => (
                                                                                <PortalAwareDraggable provided={dragProvided} snapshot={dragSnapshot}>
                                                                                <div
                                                                                    onClick={() => {
                                                                                        if (!isEditing && !isObserver && !isUpdating) {
                                                                                            handleToggleSubtask(item.id, !item.isCompleted);
                                                                                        }
                                                                                    }}
                                                                                    className={`group border rounded-[2px] p-2 transition-all flex items-center gap-2.5 ${
                                                                                        !isEditing && !isObserver ? "cursor-pointer" : ""
                                                                                    } ${
                                                                                        dragSnapshot.isDragging
                                                                                            ? "shadow-md ring-1 ring-[var(--app-border-strong)] bg-white z-50 w-full"
                                                                                            : item.isCompleted
                                                                                            ? "border-[#E5E5E3] bg-[#FAFAF9]/60 opacity-80"
                                                                                            : "border-[#E5E5E3] bg-white hover:border-[#DADAD6]"
                                                                                    } ${isDeleting ? "opacity-40" : ""}`}
                                                                                >
                                                                                    {!isObserver && !isEditing && (
                                                                                        <div
                                                                                            {...dragProvided.dragHandleProps}
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                            className="text-[#B5B5B0] hover:text-[#1A1A1A] cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                            title="Drag to reorder"
                                                                                        >
                                                                                            <GripVertical className="w-3.5 h-3.5" />
                                                                                        </div>
                                                                                    )}

                                                                                    <div
                                                                                        className={`w-4 h-4 rounded-[2px] flex items-center justify-center transition-all shrink-0 ${
                                                                                            item.isCompleted
                                                                                                ? "bg-[var(--color-accent)] border border-[var(--color-accent)] text-white shadow-2xs"
                                                                                                : "bg-white border border-[#DADAD6] hover:border-[var(--color-accent)]"
                                                                                        } ${isObserver ? "opacity-60" : ""}`}
                                                                                    >
                                                                                        {isUpdating ? (
                                                                                            <Loader2 className="w-2.5 h-2.5 animate-spin text-[#888883]" />
                                                                                        ) : item.isCompleted ? (
                                                                                            <Check className="w-3 h-3 text-white stroke-[2.5]" />
                                                                                        ) : null}
                                                                                    </div>

                                                                                    {isEditing ? (
                                                                                        <div
                                                                                            className="flex items-center gap-1.5 flex-1 min-w-0"
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                        >
                                                                                            <input
                                                                                                type="text"
                                                                                                autoFocus
                                                                                                value={editingItemTitle}
                                                                                                onChange={(e) => setEditingItemTitle(e.target.value)}
                                                                                                onKeyDown={(e) => {
                                                                                                    if (e.key === "Enter") {
                                                                                                        e.preventDefault();
                                                                                                        handleSaveEditedTitle(item.id);
                                                                                                    } else if (e.key === "Escape") {
                                                                                                        setEditingItemId(null);
                                                                                                    }
                                                                                                }}
                                                                                                className="px-2 py-1 border border-[#1A1A1A] focus:outline-none text-xs bg-white rounded-[2px] w-full"
                                                                                                maxLength={300}
                                                                                            />
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleSaveEditedTitle(item.id)}
                                                                                                className="p-1 text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                                                                                title="Save changes (Enter)"
                                                                                            >
                                                                                                <Check className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => setEditingItemId(null)}
                                                                                                className="p-1 text-[#888883] hover:text-[#1A1A1A] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                                                                                title="Cancel (Esc)"
                                                                                            >
                                                                                                <X className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span
                                                                                            className={`text-xs leading-relaxed break-words flex-1 select-none transition-colors ${
                                                                                                item.isCompleted
                                                                                                    ? "line-through text-[#888883]"
                                                                                                    : "text-[#1A1A1A] font-normal"
                                                                                            }`}
                                                                                        >
                                                                                            {item.title}
                                                                                        </span>
                                                                                    )}

                                                                                    {!isObserver && !isEditing && (
                                                                                        <div
                                                                                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                        >
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setEditingItemId(item.id);
                                                                                                    setEditingItemTitle(item.title);
                                                                                                }}
                                                                                                className="p-1 text-[#888883] hover:text-[#1A1A1A] hover:bg-[#FAFAF9] rounded-[2px] transition-colors cursor-pointer"
                                                                                                title="Edit item title"
                                                                                            >
                                                                                                <Pencil className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleDeleteSubtask(item.id)}
                                                                                                disabled={isDeleting}
                                                                                                className="p-1 text-[#888883] hover:text-red-600 hover:bg-red-50 rounded-[2px] transition-colors cursor-pointer"
                                                                                                title="Delete item"
                                                                                            >
                                                                                                {isDeleting ? (
                                                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                                                ) : (
                                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                                )}
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                </PortalAwareDraggable>
                                                                            )}
                                                                        </Draggable>
                                                                    );
                                                                })}
                                                                {provided.placeholder}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </DragDropContext>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 4. Description Section (Seamless Notion-style) */}
                            <div ref={descriptionSectionRef} className="flex flex-col gap-2.5 pt-2 border-t border-[#E5E5E3]/80 shrink-0 text-left">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#888883]" />
                                    <h4 className="text-xs font-semibold text-[#1A1A1A]">
                                        Description & Details
                                    </h4>
                                </div>
                                <div className="border border-[#E5E5E3] rounded-[2px] bg-white p-2 min-h-[240px] flex flex-col">
                                    <TipTapEditor
                                        value={description}
                                        onChange={(html) => setDescription(html)}
                                        disabled={!canEditDetails}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Collapsible Sidebar (Comments + Files tabs, Activity Log button at bottom) */}
                    {isSidebarOpen && (
                        <div className="w-full md:w-[360px] lg:w-[380px] flex flex-col min-h-0 bg-[#FAFAF9] shrink-0 border-t md:border-t-0 border-[#E5E5E3] text-left">
                            {/* Sidebar Tabs Bar */}
                            <div className="flex items-center gap-1 px-3 py-2 border-b border-[#E5E5E3] bg-[#FAFAF9] shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleSidebarTabChange("comments")}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                                        sidebarTab === "comments"
                                            ? "bg-white border border-[#E5E5E3] text-[#1A1A1A] font-semibold"
                                            : "text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/40"
                                    }`}
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Comments</span>
                                    {visibleComments.length > 0 && (
                                        <span className="text-[10px] bg-[#F5F5F3] border border-[#E5E5E3] px-1.5 py-0.2 rounded-[2px] tabular-nums">
                                            {visibleComments.length}
                                        </span>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSidebarTabChange("attachments")}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                                        sidebarTab === "attachments"
                                            ? "bg-white border border-[#E5E5E3] text-[#1A1A1A] font-semibold"
                                            : "text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/40"
                                    }`}
                                >
                                    <Paperclip className="w-3.5 h-3.5" />
                                    <span>Files</span>
                                    {(task.attachments?.length || 0) > 0 && (
                                        <span className="text-[10px] bg-[#F5F5F3] border border-[#E5E5E3] px-1.5 py-0.2 rounded-[2px] tabular-nums">
                                            {task.attachments?.length || 0}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Sidebar Body (Comments or Attachments) */}
                            <div className="flex-1 p-3.5 overflow-hidden min-h-0 flex flex-col">
                                {sidebarTab === "comments" && (
                                    <div className="flex-1 flex flex-col min-h-0 gap-2.5 overflow-hidden">
                                        {hasMoreComments && showLoadMore && (
                                            <div className="flex justify-end shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => loadTaskComments(commentsPage + 1, true)}
                                                    disabled={isLoadingMore}
                                                    className="text-[10px] text-[#888883] hover:text-[#1A1A1A] font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border border-[#E5E5E3] bg-white hover:bg-[#FAFAF9] transition-all disabled:opacity-50 cursor-pointer"
                                                >
                                                    {isLoadingMore && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                                    <span>Load previous</span>
                                                </button>
                                            </div>
                                        )}

                                        <div
                                            ref={commentsContainerRef}
                                            onScroll={handleCommentsScroll}
                                            className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 custom-scrollbar"
                                        >
                                            {isLoadingComments ? (
                                                <div className="flex items-center justify-center py-8 gap-2 text-[#888883] text-[11px]">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Loading comments...</span>
                                                </div>
                                            ) : visibleComments.length === 0 ? (
                                                <div className="py-10 text-center flex flex-col items-center justify-center gap-1 text-[#888883] my-auto">
                                                    <MessageSquare className="w-5 h-5 text-[#DADAD6]" />
                                                    <span className="text-[11px] font-medium text-[#1A1A1A] mt-0.5">
                                                        No comments yet
                                                    </span>
                                                    <span className="text-[10px]">
                                                        Be the first to share notes or feedback.
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2 pb-1">
                                                    {visibleComments.map((c) => (
                                                        <div
                                                            key={c.id}
                                                            className={`border p-2.5 rounded-[3px] text-left transition-colors flex flex-col gap-1 ${c.resolved ? "border-[#DADAD6] bg-[#FAFAF9] opacity-75" : "border-[#E5E5E3] bg-white"}`}
                                                        >
                                                            <div className="flex justify-between items-center text-[10px] gap-1">
                                                                <div
                                                                    onClick={() => c.user && openMemberProfile(c.user)}
                                                                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
                                                                >
                                                                    {c.user?.avatarUrl ? (
                                                                        <img
                                                                            src={c.user.avatarUrl}
                                                                            alt={c.user.fullName}
                                                                            className="w-4 h-4 rounded-full object-cover border border-[#E5E5E3] shrink-0"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-4 h-4 rounded-[2px] border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-[7px] text-[#1A1A1A] font-semibold shrink-0">
                                                                            {c.user?.fullName
                                                                                ? c.user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                                                                                : "U"}
                                                                        </div>
                                                                    )}
                                                                    <span className="font-semibold text-[#1A1A1A] truncate">
                                                                        {c.user?.fullName}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[#888883] shrink-0">
                                                                    <span className="text-[9px]">
                                                                        {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                    </span>
                                                                    {c.resolved && (
                                                                        <span className="px-1.5 py-0.5 rounded-[2px] bg-[#22863A]/10 text-[#22863A] text-[9px] font-semibold shrink-0">
                                                                            ✓ Resolved
                                                                        </span>
                                                                    )}
                                                                    {!c.resolved
                                                                        ? (c.userId === currentUser.id || task.createdById === currentUser.id || task.assignedToId === currentUser.id) && (
                                                                            <button
                                                                                type="button"
                                                                                disabled={resolvingCommentId !== null}
                                                                                onClick={() => handleResolveComment(c.id)}
                                                                                className="px-1.5 py-0.5 border border-[#CB2431]/30 bg-[#CB2431]/5 hover:bg-[#CB2431] text-[#CB2431] hover:text-white rounded-[2px] text-[9px] font-semibold transition-all cursor-pointer flex items-center gap-0.5 shrink-0 disabled:opacity-50"
                                                                            >
                                                                                {resolvingCommentId === c.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                                                                                <span>Resolve</span>
                                                                            </button>
                                                                        )
                                                                        : (c.userId === currentUser.id || task.createdById === currentUser.id || task.assignedToId === currentUser.id) && (
                                                                            <button
                                                                                type="button"
                                                                                disabled={resolvingCommentId !== null}
                                                                                onClick={() => handleReopenComment(c.id)}
                                                                                className="px-1.5 py-0.5 border border-[var(--app-border,#E5E5E3)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text,#1A1A1A)] rounded-[2px] text-[9px] font-semibold transition-all cursor-pointer flex items-center gap-0.5 shrink-0 disabled:opacity-50"
                                                                            >
                                                                                {resolvingCommentId === c.id && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                                                                <span>Reopen</span>
                                                                            </button>
                                                                        )}
                                                                    {c.userId === currentUser.id && (
                                                                        <button
                                                                            type="button"
                                                                            disabled={isDeletingComment}
                                                                            onClick={() => setCommentToDeleteId(c.id)}
                                                                            className="px-1.5 py-0.5 border border-[var(--color-danger,#CB2431)]/30 bg-[var(--color-danger,#CB2431)]/10 hover:bg-[var(--color-danger,#CB2431)] text-[var(--color-danger,#CB2431)] hover:text-white rounded-[2px] text-[9px] font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-[11px] text-[var(--app-text,#1A1A1A)] leading-relaxed break-words font-sans">
                                                                {c.content.split(" ").map((word, idx) =>
                                                                    word.startsWith("@") ? (
                                                                        <span key={idx} className="text-[#1A1A1A] font-semibold underline">
                                                                            {word}{" "}
                                                                        </span>
                                                                    ) : (
                                                                        word + " "
                                                                    )
                                                                )}
                                                            </p>
                                                        </div>
                                                    ))}
                                                    <div ref={commentsEndRef} />
                                                </div>
                                            )}
                                        </div>

                                        {canPostComment && (
                                            <form onSubmit={handleAddComment} className="flex gap-1.5 shrink-0 pt-2 border-t border-[#E5E5E3] relative">
                                                {showMentionMenu && mentionOptions.length > 0 && (
                                                    <div
                                                        ref={mentionMenuRef}
                                                        className="absolute bottom-full mb-1 left-0 w-72 max-h-56 overflow-x-hidden overflow-y-auto scrollbar-none bg-white border border-[#E5E5E3] rounded-[3px] shadow-md z-50 flex flex-col p-1.5 corner-brackets"
                                                    >
                                                        <div className="px-2 py-1 text-[10px] font-medium text-[#888883] border-b border-[#E5E5E3] mb-1 flex items-center justify-between shrink-0 min-w-0">
                                                            <span>Mention leader</span>
                                                            <span className="truncate ml-1">Use ↑↓ to navigate</span>
                                                        </div>
                                                        {mentionOptions.map((opt, idx) => (
                                                            <button
                                                                key={opt.id}
                                                                type="button"
                                                                onClick={() => insertMention(opt)}
                                                                className={`w-full text-left px-2.5 py-1.5 rounded-[2px] text-[11px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                                                    idx === mentionIndex ? "bg-[#FAFAF9] text-[#1A1A1A] font-semibold" : "text-[#1A1A1A] hover:bg-[#FAFAF9]"
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className="font-semibold text-[#22863A]">@</span>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="truncate font-medium text-[11px]">{opt.name}</span>
                                                                        {opt.description && <span className="truncate text-[9px] text-[#888883]">{opt.description}</span>}
                                                                    </div>
                                                                </div>
                                                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-[2px] border shrink-0 ${
                                                                    opt.role === "LEADER"
                                                                        ? "text-[#CB2431] bg-[#CB2431]/10 border-[#CB2431]/20"
                                                                        : opt.role === "OBSERVER"
                                                                        ? "text-[#B08800] bg-[#B08800]/10 border-[#B08800]/20"
                                                                        : "text-[#22863A] bg-[#22863A]/10 border-[#22863A]/20"
                                                                }`}>
                                                                    {opt.isGroup ? "All Leaders" : opt.role === "LEADER" ? "Leader" : opt.role === "OBSERVER" ? "Observer" : "Member"}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <input
                                                    ref={commentInputRef}
                                                    type="text"
                                                    placeholder="Write a comment... (Type @ to mention)"
                                                    value={comment}
                                                    disabled={isSendingComment}
                                                    onChange={handleCommentChange}
                                                    onKeyDown={handleCommentKeyDown}
                                                    className={`flex-1 ${inputClass}`}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isSendingComment || !comment.trim()}
                                                    className="relative corner-brackets-4 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] px-3 py-1.5 rounded-[2px] text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSendingComment ? <Loader2 className="w-3 h-3 animate-spin shrink-0" /> : <span className="w-1.5 h-1.5 bg-[#555555] rounded-[0.5px] inline-block" />}
                                                    <span>{isSendingComment ? "Sending…" : "Send"}</span>
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {sidebarTab === "attachments" && (
                                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
                                        {!task.attachments || task.attachments.length === 0 ? (
                                            <div
                                                onClick={() =>
                                                    !isObserver &&
                                                    !isUploadingImage &&
                                                    fileInputRef.current?.click()
                                                }
                                                className={`border border-dashed border-[#E5E5E3] bg-white p-6 text-center rounded-[3px] flex flex-col items-center justify-center gap-1 text-[#888883] w-full min-h-[120px] ${!isObserver && !isUploadingImage ? "cursor-pointer hover:bg-[#FAFAF9] hover:border-[#888883] transition-all" : ""}`}
                                            >
                                                {isUploadingImage ? (
                                                    <Loader2 className="w-5 h-5 text-[#DADAD6] animate-spin" />
                                                ) : (
                                                    <Paperclip className="w-5 h-5 text-[#DADAD6]" />
                                                )}
                                                <span className="text-[11px] font-medium text-[#1A1A1A] mt-1">
                                                    {isUploadingImage ? "Uploading image..." : "No attachments uploaded"}
                                                </span>
                                                {!isObserver && (
                                                    <span className="text-[10px]">
                                                        {isUploadingImage
                                                            ? "Please wait while your image is uploading..."
                                                            : "Click here or paste an image (Ctrl+V)"}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2.5 text-left">
                                                {task.attachments.map((att) => {
                                                    const isImg =
                                                        att.type === "IMAGE" ||
                                                        att.url.includes("cloudinary.com") ||
                                                        att.url.startsWith("data:image/") ||
                                                        att.url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);

                                                    return (
                                                        <div
                                                            key={att.id}
                                                            className="relative group border border-[#E5E5E3] bg-white rounded-[3px] overflow-hidden"
                                                        >
                                                            {isImg ? (
                                                                <div
                                                                    onClick={() => setFullscreenImage(att.url)}
                                                                    className="w-full aspect-[4/3] relative cursor-pointer block overflow-hidden bg-[#FAFAF9]"
                                                                >
                                                                    <img
                                                                        src={att.url}
                                                                        alt={att.name}
                                                                        className="w-full h-full object-cover block"
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
                                                                    className="w-full aspect-[4/3] bg-[#F5F5F3] flex flex-col items-center justify-center gap-1 p-2 text-center text-[#1A1A1A] hover:bg-[#ECECE9] transition-colors"
                                                                >
                                                                    <ExternalLink className="w-4 h-4 text-[#888883]" />
                                                                    <span className="text-[9px] text-[#888883] truncate w-full font-medium">
                                                                        {att.name || "Attachment"}
                                                                    </span>
                                                                </a>
                                                            )}

                                                            {!isObserver && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setAttachmentToDelete({ id: att.id, name: att.name });
                                                                        setIsDeleteAttachmentConfirmOpen(true);
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

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageFileUpload}
                                            className="hidden"
                                        />

                                        {!isObserver && task.attachments && task.attachments.length > 0 && (
                                            <div className="shrink-0 pt-2 border-t border-[#E5E5E3]">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
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
                                                            <span>Upload Image</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Bottom Activity Log Button */}
                            <div className="p-3 border-t border-[#E5E5E3] bg-[#FAFAF9] shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAllAuditLog(true);
                                        if (activitiesList.length === 0) {
                                            loadTaskActivities(1);
                                        }
                                    }}
                                    className="w-full py-1.5 px-2.5 bg-white border border-[#E5E5E3] hover:border-[var(--color-accent,#1A1A1A)] hover:bg-[#FAFAF9] text-[11px] text-[#1A1A1A] font-medium rounded-[3px] transition-colors flex items-center justify-between group cursor-pointer"
                                >
                                    <span className="flex items-center gap-1.5 min-w-0">
                                        <ClipboardList className="w-3.5 h-3.5 text-[#888883] group-hover:text-[#1A1A1A] transition-colors shrink-0" />
                                        <span className="truncate">View Activity Logs</span>
                                    </span>
                                    <ChevronRight className="w-3.5 h-3.5 text-[#888883] group-hover:text-[#1A1A1A] group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            {/* Warning Dialog when trying to close modal with unsaved changes */}
            {showUnsavedWarning && typeof document !== "undefined" && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[99999] overflow-hidden flex justify-center items-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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
                                className="px-3 py-1.5 text-[11px] font-medium text-[#888883] hover:text-[#1A1A1A] border border-[#E5E5E3] rounded-[3px] transition-colors cursor-pointer"
                            >
                                Keep Editing
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowUnsavedWarning(false);
                                    onClose();
                                }}
                                className="px-3 py-1.5 text-[11px] font-medium text-[#CB2431] border border-[#CB2431]/20 hover:bg-[#CB2431]/10 rounded-[3px] transition-colors cursor-pointer"
                            >
                                Discard & Close
                            </button>
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleSaveChanges(true)}
                                className="px-4 py-1.5 text-[11px] font-medium text-white bg-[#1A1A1A] hover:bg-[#333] rounded-[3px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
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
                </div>,
                document.body
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
                                                            {act.user?.fullName ||
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

    if (viewMode === "modal") {
        return (
            <ModalWrapper
                isOpen={isOpen}
                onClose={handleAttemptClose}
                maxWidth={isExpanded ? "max-w-7xl" : "max-w-5xl"}
                className="h-[90vh] max-h-[900px] overflow-hidden text-left"
            >
                {modalInner}
            </ModalWrapper>
        );
    }

    return (
        <SideSheetWrapper
            isOpen={isOpen}
            onClose={handleAttemptClose}
            width="2xl"
            isExpanded={isExpanded}
            className="overflow-hidden text-left"
        >
            {modalInner}
        </SideSheetWrapper>
    );
}
