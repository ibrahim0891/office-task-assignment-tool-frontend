import React, { useEffect, useState, useRef } from "react";
import {
    DragDropContext,
    Droppable,
    DropResult,
    DragStart,
    DragUpdate,
} from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import { CustomSelect } from "./ui/CustomSelect";
import { Button } from "./ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Task, TaskColumn, User } from "../api";
import { triggerMicroCelebration } from "../utils/confetti";
import { playFeedback } from "../utils/feedback";
import ConfirmDialog from "./ui/ConfirmDialog";
import { APP_CONFIG } from "../config/appConfig";
import { useKanbanDragPhysics } from "../hooks/useKanbanDragPhysics";
import { KanbanCard } from "./kanban/KanbanCard";

interface KanbanBoardProps {
    tasks: Task[];
    columns: TaskColumn[];
    currentUser: User;
    userRole: string;
    teamMembers?: { user: User; role: string }[];
    selectedMemberFilter?: string;
    onMemberFilterChange?: (memberId: string) => void;
    onUpdateTaskColumn: (taskId: string, targetColumnId: string) => void;
    onSelectTask: (taskId: string) => void;
    onAddTaskClick: (columnId: string) => void;
    onAddQuickTask: (title: string, columnId: string, assignedToId?: string) => void;
    onArchiveTask?: (taskId: string) => void;
    onDragStartNotify?: (cardId: string) => void;
    onDragEndNotify?: () => void;
}

export default function KanbanBoard({
    tasks,
    columns,
    currentUser,
    userRole,
    teamMembers = [],
    selectedMemberFilter = "",
    onMemberFilterChange,
    onUpdateTaskColumn,
    onSelectTask,
    onAddTaskClick,
    onAddQuickTask,
    onArchiveTask,
    onDragStartNotify,
    onDragEndNotify,
}: KanbanBoardProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [cardMenuId, setCardMenuId] = useState<string | null>(null);
    const [taskToArchive, setTaskToArchive] = useState<Task | null>(null);
    const [isArchiving, setIsArchiving] = useState(false);
    const [quickTitle, setQuickTitle] = useState("");

    const handleConfirmArchive = async () => {
        if (!taskToArchive || !onArchiveTask) return;
        setIsArchiving(true);
        try {
            await onArchiveTask(taskToArchive.id);
            setTaskToArchive(null);
        } finally {
            setIsArchiving(false);
        }
    };
    const [quickAssigneeId, setQuickAssigneeId] = useState<string>(currentUser.id);
    const [sortBy, setSortBy] = useState<string>("date");
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
        }
    };

    const handleScrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
        }
    };

    const { dragTilt, handleDragStart, handleDragEndCleanup } = useKanbanDragPhysics({
        containerRef: scrollContainerRef,
        onDragStartNotify,
        onDragEndNotify,
    });
    const [customOrderMap, setCustomOrderMap] = useState<
        Record<string, string[]>
    >({});

    useEffect(() => {
        setIsMounted(true);
        const savedSort = localStorage.getItem("kanbanSortBy");
        if (savedSort) {
            setSortBy(savedSort);
        }
        const savedOrder = localStorage.getItem("kanbanCustomOrderMap");
        if (savedOrder) {
            try {
                setCustomOrderMap(JSON.parse(savedOrder));
            } catch (e) { }
        }
    }, []);

    const handleSortChange = (val: string) => {
        setSortBy(val);
        localStorage.setItem("kanbanSortBy", val);
    };

    const getPriorityWeight = (priority: string) => {
        switch (priority) {
            case "URGENT":
                return 4;
            case "HIGH":
                return 3;
            case "MEDIUM":
                return 2;
            case "LOW":
                return 1;
            default:
                return 0;
        }
    };

    const filteredTasks = selectedMemberFilter
        ? tasks.filter((t) => t.assignedToId === selectedMemberFilter)
        : tasks;
    const activeTasks = filteredTasks.filter(
        (t) => !t.isSoftDeleted && !t.isArchived,
    );
    const lastHoveredTargetRef = useRef<string | null>(null);

    const onCustomDragStart = (start: DragStart) => {
        lastHoveredTargetRef.current = `${start.source?.droppableId}:${start.source?.index}`;
        handleDragStart(start);
    };

    const handleDragUpdate = (update: DragUpdate) => {
        const dest = update.destination;
        if (dest) {
            const targetKey = `${dest.droppableId}:${dest.index}`;
            if (targetKey !== lastHoveredTargetRef.current) {
                lastHoveredTargetRef.current = targetKey;
                playFeedback("dial");
            }
        }
    };

    const isReadOnly = userRole === "OBSERVER";

    const handleDragEnd = (result: DropResult) => {
        lastHoveredTargetRef.current = null;
        handleDragEndCleanup();

        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        )
            return;



        const taskToMove = activeTasks.find((t) => t.id === draggableId);
        const isLeader = userRole === "LEADER";
        const isCreator = taskToMove?.createdById === currentUser.id;
        const isAssignee = taskToMove?.assignedToId === currentUser.id;

        if (!taskToMove || (!isLeader && !isCreator && !isAssignee)) {
            toast.error(
                "Only the workspace leader, task creator, or assignee can update this task's status.",
            );
            return;
        }


        const targetColId = destination.droppableId;

        // 1. Update custom order map
        const colTasks = activeTasks.filter((t) => t.columnId === targetColId);
        const taskIds = colTasks
            .map((t) => t.id)
            .filter((id) => id !== draggableId);
        taskIds.splice(destination.index, 0, draggableId);

        setCustomOrderMap((prev) => {
            const next = { ...prev, [targetColId]: taskIds };
            localStorage.setItem("kanbanCustomOrderMap", JSON.stringify(next));
            return next;
        });

        // 2. Switch sort dropdown mode to Custom Order on manual drag & drop
        if (sortBy !== "custom") {
            handleSortChange("custom");
        }

        // 3. Trigger micro-celebration directly on the card once it lands in Done column
        const targetCol = columns.find((c) => c.id === targetColId);
        const sourceCol = columns.find((c) => c.id === source.droppableId);
        const isTargetDone =
            targetCol?.isComplete ||
            targetCol?.name.toLowerCase().includes("done") ||
            targetCol?.name.toLowerCase().includes("complete");
        const isSourceDone =
            sourceCol?.isComplete ||
            sourceCol?.name.toLowerCase().includes("done") ||
            sourceCol?.name.toLowerCase().includes("complete");

        if (isTargetDone && !isSourceDone) {
            triggerMicroCelebration({ intensity: "medium" });
            playFeedback("complete");
        }

        onUpdateTaskColumn(draggableId, destination.droppableId);
    };


    const handleQuickSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickTitle.trim() || columns.length === 0) return;

        if (quickTitle.trim().length > APP_CONFIG.MAX_TASK_TITLE_LENGTH) {
            toast.error(`Task title must not exceed ${APP_CONFIG.MAX_TASK_TITLE_LENGTH} characters.`);
            return;
        }


        onAddQuickTask(quickTitle.trim(), columns[0].id, quickAssigneeId || currentUser.id);
        setQuickTitle("");
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority?.toUpperCase()) {
            case "URGENT":
                return "!border-l-[2px] !border-l-[#C08080]";
            case "HIGH":
                return "!border-l-[2px] !border-l-[#B8A368]";
            case "MEDIUM":
                return "!border-l-[2px] !border-l-[#8A9BAC]";
            case "LOW":
            default:
                return "!border-l-[2px] !border-l-[#C8C8C2]";
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority?.toUpperCase()) {
            case "URGENT":
                return (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[var(--priority-urgent,#CB2431)] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--priority-urgent,#CB2431)] shrink-0" />
                        <span>Urgent</span>
                    </span>
                );
            case "HIGH":
                return (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[var(--priority-high,#B08800)] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--priority-high,#B08800)] shrink-0" />
                        <span>High</span>
                    </span>
                );
            case "MEDIUM":
                return (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[var(--priority-medium,#0284C7)] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--priority-medium,#0284C7)] shrink-0" />
                        <span>Medium</span>
                    </span>
                );
            case "LOW":
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[var(--priority-low,#888883)] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--priority-low,#888883)] shrink-0" />
                        <span>Low</span>
                    </span>
                );
        }
    };

    if (!isMounted) {
        return (
            <div className="flex-1 flex gap-3 overflow-x-auto p-5 bg-[#FAFAF9] select-none">
                {columns.map((col) => (
                    <div
                        key={col.id}
                        className="w-72 shrink-0 bg-white border border-[#E5E5E3] flex flex-col h-full opacity-50"
                    />
                ))}
            </div>
        );
    }

    return (
        <DragDropContext
            onDragStart={onCustomDragStart}
            onDragUpdate={handleDragUpdate}
            onDragEnd={handleDragEnd}
        >
            <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFAF9] select-none relative">
                {/* Quick Task Bar */}
                {userRole !== "OBSERVER" && columns.length > 0 && (
                    <div className="px-4 pt-3.5 pb-1 shrink-0 flex flex-wrap items-center justify-between gap-3 w-full">
                        {/* Quick Add Form with Member Assignee Picker */}
                        <form
                            onSubmit={handleQuickSubmit}
                            className={`flex items-center gap-2 flex-1 min-w-[300px] ${
                                userRole === "MEMBER" ? "max-w-[480px]" : "max-w-xl"
                            }`}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={quickTitle}
                                onChange={(e) => setQuickTitle(e.target.value)}
                                placeholder={columns[0] ? `Quick add to ${columns[0].name}…` : "Quick add task…"}
                                maxLength={APP_CONFIG.MAX_TASK_TITLE_LENGTH}
                                className="flex-1 bg-white border border-[#E5E5E3] rounded-[3px] px-3 h-[36px] text-[11px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                                autoFocus
                            />



                            {/* Member Assignee Selector */}
                            {userRole !== "MEMBER" && teamMembers && teamMembers.length > 1 && (
                                <CustomSelect
                                    options={[
                                        {
                                            value: currentUser.id,
                                            label: `Assign: Me (${currentUser.name.split(" ")[0]})`,
                                        },
                                        ...teamMembers
                                            .filter(({ user }) => user.id !== currentUser.id)
                                            .map(({ user }) => ({
                                                value: user.id,
                                                label: `Assign: ${user.name}`,
                                                avatarUrl: user.avatarUrl || null,
                                            })),
                                    ]}
                                    value={quickAssigneeId || currentUser.id}
                                    onChange={(val) => setQuickAssigneeId(val)}
                                    className="w-44 h-[36px]"
                                />
                            )}

                            <Button
                                type="submit"
                                disabled={!quickTitle.trim()}
                                showDot
                            >
                                Add
                            </Button>
                        </form>

                        {/* Filters & Sorting Pushed to Far Right */}
                        <div className="flex items-center gap-2 ml-auto shrink-0">
                            {userRole === "LEADER" && teamMembers && teamMembers.length > 1 && (
                                <CustomSelect
                                    options={[
                                        { value: "", label: "All Team Tasks" },
                                        ...teamMembers.map(({ user }) => ({
                                            value: user.id,
                                            label: user.name,
                                            avatarUrl: user.avatarUrl || null,
                                        })),
                                    ]}
                                    value={selectedMemberFilter}
                                    onChange={(val) =>
                                        onMemberFilterChange &&
                                        onMemberFilterChange(val)
                                    }
                                    className="w-44"
                                />
                            )}

                            <CustomSelect
                                options={[
                                    {
                                        value: "custom",
                                        label: "Sort: Custom / Manual",
                                    },
                                    {
                                        value: "date",
                                        label: "Sort: Newest First",
                                    },
                                    {
                                        value: "priority-desc",
                                        label: "Sort: Priority (High → Low)",
                                    },
                                    {
                                        value: "priority-asc",
                                        label: "Sort: Priority (Low → High)",
                                    },
                                ]}
                                value={sortBy}
                                onChange={handleSortChange}
                                className="w-48"
                            />
                        </div>
                    </div>
                )}

                {/* Columns */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 flex gap-3 overflow-x-auto p-4 pt-2 scroll-smooth"
                >
                    {columns.map((col) => {
                        const colFiltered = activeTasks.filter(
                            (t) => t.columnId === col.id,
                        );
                        const columnTasks =
                            sortBy === "custom"
                                ? (() => {
                                    const order = customOrderMap[col.id];
                                    if (!order) return colFiltered;
                                    return [...colFiltered].sort((a, b) => {
                                        const idxA = order.indexOf(a.id);
                                        const idxB = order.indexOf(b.id);
                                        // Tasks not in the saved order go to the end
                                        if (idxA === -1 && idxB === -1)
                                            return 0;
                                        if (idxA === -1) return 1;
                                        if (idxB === -1) return -1;
                                        return idxA - idxB;
                                    });
                                })()
                                : colFiltered.sort((a, b) => {
                                    if (sortBy === "priority-desc") {
                                        return (
                                            getPriorityWeight(b.priority) -
                                            getPriorityWeight(a.priority)
                                        );
                                    }
                                    if (sortBy === "priority-asc") {
                                        return (
                                            getPriorityWeight(a.priority) -
                                            getPriorityWeight(b.priority)
                                        );
                                    }
                                    return (
                                        new Date(b.createdAt).getTime() -
                                        new Date(a.createdAt).getTime()
                                    );
                                });


                        return (
                            <div
                                key={col.id}
                                className="w-72 shrink-0 bg-white border border-[#E5E5E3] flex flex-col h-full max-h-[calc(100vh-160px)]"
                            >
                                {/* Column Header */}
                                <div className="px-3 py-2.5 border-b border-[#E5E5E3] flex justify-between items-center shrink-0">
                                    <div className="flex flex-col gap-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-xs text-[#1A1A1A]">
                                                {col.name}
                                            </h3>
                                            <span className="text-[10px] text-[#888883] font-medium">
                                                {columnTasks.length}
                                            </span>
                                        </div>
                                    </div>
                                    {userRole !== "OBSERVER" && (
                                        <button
                                            onClick={() =>
                                                onAddTaskClick(col.id)
                                            }
                                            className="w-6 h-6 border border-[#E5E5E3] rounded-[3px] bg-[#FAFAF9] hover:bg-[#F0F0EE] text-[#888883] hover:text-[#1A1A1A] flex items-center justify-center text-base transition-colors"
                                        >
                                            +
                                        </button>
                                    )}
                                </div>

                                {/* Droppable Area */}
                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 min-h-[120px] transition-colors ${snapshot.isDraggingOver
                                                ? "bg-[#F5F5F3]"
                                                : ""
                                                }`}
                                        >
                                            {columnTasks.map((task, index) => {
                                                const isLeader = userRole === "LEADER";
                                                const isTaskCreator =
                                                    task.createdById === currentUser.id;
                                                const isTaskAssignee =
                                                    task.assignedToId === currentUser.id;
                                                const isTaskDragDisabled =
                                                    userRole === "OBSERVER" ||
                                                    (!isLeader &&
                                                        !isTaskCreator &&
                                                        !isTaskAssignee);

                                                return (
                                                    <KanbanCard
                                                        key={task.id}
                                                        task={task}
                                                        index={index}
                                                        currentUser={currentUser}
                                                        userRole={userRole}
                                                        isTaskDragDisabled={isTaskDragDisabled}
                                                        dragTilt={dragTilt}
                                                        cardMenuId={cardMenuId}
                                                        setCardMenuId={setCardMenuId}
                                                        onSelectTask={onSelectTask}
                                                        onArchiveTaskClick={(t) => setTaskToArchive(t)}
                                                        getPriorityStyle={getPriorityStyle}
                                                        getPriorityBadge={getPriorityBadge}
                                                    />
                                                );
                                            })}
                                            {provided.placeholder}

                                            {columnTasks.length === 0 && (
                                                <div className="flex-1 flex flex-col items-center justify-center text-[#888883] border border-dashed border-[#E5E5E3] py-8 px-4 gap-1">
                                                    <p className="text-[11px]">
                                                        No tasks
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>

                {/* Floating Smooth Horizontal Scroll Controls (Bottom Right - No Brackets) */}
                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-[#E5E5E3] p-1 rounded-[3px] shadow-md">
                    <button
                        type="button"
                        onClick={handleScrollLeft}
                        title="Scroll Left"
                        className="w-7 h-7 rounded-[2px] border border-[#E5E5E3] hover:border-[#1A1A1A] bg-white hover:bg-[#FAFAF9] text-[#1A1A1A] flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4 text-[#1A1A1A]" />
                    </button>
                    <button
                        type="button"
                        onClick={handleScrollRight}
                        title="Scroll Right"
                        className="w-7 h-7 rounded-[2px] border border-[#E5E5E3] hover:border-[#1A1A1A] bg-white hover:bg-[#FAFAF9] text-[#1A1A1A] flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <ChevronRight className="w-4 h-4 text-[#1A1A1A]" />
                    </button>
                </div>
            </div>

            <ConfirmDialog
                isOpen={taskToArchive !== null}
                onClose={() => setTaskToArchive(null)}
                onConfirm={handleConfirmArchive}
                title="Archive task"
                description={`Are you sure you want to move "${taskToArchive?.title || "this task"}" to the trash? It can be restored later from Trash.`}
                confirmText="Archive Task"
                isDanger={true}
                isLoading={isArchiving}
            />
        </DragDropContext>
    );
}
