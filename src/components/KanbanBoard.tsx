import React, { useEffect, useState, useRef } from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import { CustomSelect } from "./ui/CustomSelect";
import { Button } from "./ui/Button";
import { ChevronLeft, ChevronRight, MoreVertical, Edit2, Archive } from "lucide-react";
import { Task, TaskColumn, User } from "../api";
import ConfirmDialog from "./ui/ConfirmDialog";

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

    const dragInfoRef = useRef({ isDragging: false, clientX: 0 });
    const autoScrollTimerRef = useRef<number | null>(null);

    const startAutoScrollLoop = () => {
        if (autoScrollTimerRef.current) return;

        const checkScroll = () => {
            if (!dragInfoRef.current.isDragging || !scrollContainerRef.current) {
                stopAutoScrollLoop();
                return;
            }

            const container = scrollContainerRef.current;
            const rect = container.getBoundingClientRect();
            const { clientX } = dragInfoRef.current;

            const threshold = 180; // distance from edges to trigger scroll
            const maxSpeed = 75;  // maximum speed of scroll

            const leftDist = clientX - rect.left;
            const rightDist = rect.right - clientX;

            if (rightDist < threshold && rightDist > -50) {
                const ratio = Math.max(0, 1 - rightDist / threshold);
                container.scrollLeft += ratio * maxSpeed;
            } else if (leftDist < threshold && leftDist > -50) {
                const ratio = Math.max(0, 1 - leftDist / threshold);
                container.scrollLeft -= ratio * maxSpeed;
            }

            autoScrollTimerRef.current = requestAnimationFrame(checkScroll);
        };

        autoScrollTimerRef.current = requestAnimationFrame(checkScroll);
    };

    const stopAutoScrollLoop = () => {
        if (autoScrollTimerRef.current) {
            cancelAnimationFrame(autoScrollTimerRef.current);
            autoScrollTimerRef.current = null;
        }
    };

    useEffect(() => {
        const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            if (!dragInfoRef.current.isDragging) return;
            const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
            dragInfoRef.current.clientX = clientX;
        };

        window.addEventListener("mousemove", handlePointerMove);
        window.addEventListener("touchmove", handlePointerMove);
        return () => {
            window.removeEventListener("mousemove", handlePointerMove);
            window.removeEventListener("touchmove", handlePointerMove);
            stopAutoScrollLoop();
        };
    }, []);

    const handleDragStart = () => {
        dragInfoRef.current.isDragging = true;
        startAutoScrollLoop();
    };
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
    const isReadOnly = userRole === "LEADER" || userRole === "OBSERVER";

    const handleDragEnd = (result: DropResult) => {
        dragInfoRef.current.isDragging = false;
        stopAutoScrollLoop();

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

        onUpdateTaskColumn(draggableId, destination.droppableId);
    };


    const handleQuickSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickTitle.trim() || columns.length === 0) return;


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
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[9px] font-medium capitalize   bg-[#FAF5F5] text-[#7A4040] border border-[#E5D8D8] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B87070] shrink-0" />
                        <span>URGENT</span>
                    </span>
                );
            case "HIGH":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[9px] font-medium capitalize   bg-[#FAF8F2] text-[#6A5830] border border-[#E2DAC0] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B8A050] shrink-0" />
                        <span>HIGH</span>
                    </span>
                );
            case "MEDIUM":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[9px] font-medium capitalize   bg-[#F5F7F9] text-[#4A5D70] border border-[#D5DCE5] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8A9BAC] shrink-0" />
                        <span>MEDIUM</span>
                    </span>
                );
            case "LOW":
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[9px] font-medium capitalize   bg-[#F5F5F4] text-[#888883] border border-[#E5E5E3] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C8C8C2] shrink-0" />
                        <span>LOW</span>
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
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFAF9] select-none relative">
                {/* Quick Task Bar */}
                {userRole !== "OBSERVER" && columns.length > 0 && (
                    <div className="px-4 pt-3.5 pb-1 shrink-0 flex flex-wrap items-center justify-between gap-3 w-full">
                        {/* Quick Add Form with Member Assignee Picker */}
                        <form
                            onSubmit={handleQuickSubmit}
                            className="flex items-center gap-2 flex-1 min-w-[300px] max-w-xl"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={quickTitle}
                                onChange={(e) => setQuickTitle(e.target.value)}
                                placeholder={columns[0] ? `Quick add to ${columns[0].name}…` : "Quick add task…"}
                                className="flex-1 bg-white border border-[#E5E5E3] rounded-[3px] px-3 py-1.5 h-[30px] text-[11px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                                autoFocus
                            />



                            {/* Member Assignee Selector */}
                            {teamMembers && teamMembers.length > 0 && (
                                <CustomSelect
                                    options={userRole === "MEMBER"
                                        ? [
                                            {
                                                value: currentUser.id,
                                                label: `Assign: Me (${currentUser.name.split(" ")[0]})`,
                                            }
                                        ]
                                        : [
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
                                    className="w-44"
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
                            {userRole === "LEADER" && (
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
                                                const isTaskCreator =
                                                    task.createdById ===
                                                    currentUser.id;

                                                 const isLeader =
                                                     userRole === "LEADER";
                                                 const isTaskAssignee =
                                                     task.assignedToId === currentUser.id;
                                                 const isTaskDragDisabled =
                                                     userRole === "OBSERVER" ||
                                                     (!isLeader &&
                                                         !isTaskCreator &&
                                                         !isTaskAssignee);
                                                 return (
                                                    <Draggable
                                                        key={task.id}
                                                        draggableId={task.id}
                                                        index={index}
                                                        isDragDisabled={
                                                            isTaskDragDisabled
                                                        }
                                                    >
                                                        {(
                                                            dragProvided,
                                                            dragSnapshot,
                                                        ) => (
                                                            <div
                                                                ref={
                                                                    dragProvided.innerRef
                                                                }
                                                                {...dragProvided.draggableProps}
                                                                {...dragProvided.dragHandleProps}
                                                                onClick={() =>
                                                                    onSelectTask(
                                                                        task.id,
                                                                    )
                                                                }
                                                                style={{
                                                                    ...dragProvided
                                                                        .draggableProps
                                                                        .style,
                                                                }}
                                                                className={`kanban-task-card group relative p-2.5 bg-white border border-[#E5E5E3] hover:border-[#DADAD6] flex flex-col gap-2 transition-colors text-left ${getPriorityStyle(task.priority)} ${dragSnapshot.isDragging
                                                                    ? "border-[#1A1A1A] bg-[#FAFAF9]"
                                                                    : ""
                                                                    } ${!isTaskDragDisabled
                                                                        ? "cursor-grab active:cursor-grabbing"
                                                                        : "cursor-pointer"
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between items-center gap-2">
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        {getPriorityBadge(
                                                                            task.priority,
                                                                        )}
                                                                        {task.carryCount > 0 && (
                                                                            <span className="text-[9px] font-medium text-[#B08800] bg-[#FEFCE8] border border-[#B08800]/30 px-1.5 py-0.5 rounded-[2px] shrink-0">
                                                                                Carried {task.carryCount}d
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* 3-dot menu trigger visible on hover */}
                                                                    {userRole !== "OBSERVER" && (
                                                                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setCardMenuId(cardMenuId === task.id ? null : task.id)}
                                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#FAFAF9] rounded-[2px] border border-transparent hover:border-[#E5E5E3] text-[#888883] hover:text-[#1A1A1A] transition-all cursor-pointer"
                                                                                title="Task options"
                                                                            >
                                                                                <MoreVertical className="w-3.5 h-3.5" />
                                                                            </button>

                                                                            {cardMenuId === task.id && (
                                                                                <>
                                                                                    <div
                                                                                        className="fixed inset-0 z-30"
                                                                                        onClick={() => setCardMenuId(null)}
                                                                                    />
                                                                                    <div className="absolute right-0 top-6 z-40 w-28 bg-white border border-[#E5E5E3] rounded-[2px] shadow-lg py-1 flex flex-col text-[11px] select-none">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                setCardMenuId(null);
                                                                                                onSelectTask(task.id);
                                                                                            }}
                                                                                            className="w-full text-left px-3 py-1.5 hover:bg-[#FAFAF9] text-[#1A1A1A] flex items-center gap-2 transition-colors cursor-pointer"
                                                                                        >
                                                                                            <Edit2 className="w-3 h-3 text-[#888883]" />
                                                                                            Edit
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                setCardMenuId(null);
                                                                                                setTaskToArchive(task);
                                                                                            }}
                                                                                            className="w-full text-left px-3 py-1.5 hover:bg-[#FAFAF9] text-[#CB2431] flex items-center gap-2 transition-colors cursor-pointer"
                                                                                        >
                                                                                            <Archive className="w-3 h-3 text-[#CB2431]" />
                                                                                            Archive
                                                                                        </button>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    <h4 className="text-[13px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2">
                                                                        {
                                                                            task.title
                                                                        }
                                                                    </h4>
                                                                    {task.description && (
                                                                        <p className="text-[11px] text-[#888883] mt-0.5 line-clamp-2 leading-relaxed">
                                                                            {task.description.replace(/<[^>]*>/g, "").trim()}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Checklist Summary */}
                                                                {task.checklist &&
                                                                    task
                                                                        .checklist
                                                                        .length >
                                                                    0 && (
                                                                        <div className="flex items-center gap-1.5 text-[10px] text-[#888883]">
                                                                            <span>
                                                                                {
                                                                                    task.checklist.filter(
                                                                                        (
                                                                                            item,
                                                                                        ) =>
                                                                                            item.isCompleted,
                                                                                    )
                                                                                        .length
                                                                                }{" "}
                                                                                /{" "}
                                                                                {
                                                                                    task
                                                                                        .checklist
                                                                                        .length
                                                                                }{" "}
                                                                                subtasks
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                {/* Footer */}
                                                                <div className="pt-2 border-t border-[#E5E5E3] flex justify-between items-center text-[10px] text-[#888883]">
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        {task.assignedTo?.avatarUrl ? (
                                                                            <img
                                                                                src={task.assignedTo.avatarUrl}
                                                                                alt={task.assignedTo.name}
                                                                                className="w-4 h-4 rounded-[2px] object-cover border border-[#E5E5E3] shrink-0"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-4 h-4 rounded-[2px] border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-[7px] font-bold text-[#1A1A1A] shrink-0">
                                                                                {task.assignedTo?.name
                                                                                    ? task.assignedTo.name
                                                                                        .split(" ")
                                                                                        .map((n) => n[0])
                                                                                        .join("")
                                                                                        .toUpperCase()
                                                                                        .slice(0, 2)
                                                                                    : "U"}
                                                                            </div>
                                                                        )}
                                                                        <span className="truncate font-medium text-[#1A1A1A]">
                                                                            {task.assignedTo?.name || "Unassigned"}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[9px] text-[#888883] shrink-0">
                                                                        by {task.createdBy?.name || "Unknown"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
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
