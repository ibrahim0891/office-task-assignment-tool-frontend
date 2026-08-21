import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Task, User } from "../../api";
import { MoreVertical, Edit2, Archive } from "lucide-react";

interface KanbanCardProps {
    task: Task;
    index: number;
    currentUser: User;
    userRole: string;
    isTaskDragDisabled: boolean;
    dragTilt: { rotateZ: number; rotateX: number };
    cardMenuId: string | null;
    setCardMenuId: (id: string | null) => void;
    onSelectTask: (taskId: string) => void;
    onArchiveTaskClick: (task: Task) => void;
    getPriorityStyle: (priority: string) => string;
    getPriorityBadge: (priority: string) => React.ReactNode;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
    task,
    index,
    currentUser,
    userRole,
    isTaskDragDisabled,
    dragTilt,
    cardMenuId,
    setCardMenuId,
    onSelectTask,
    onArchiveTaskClick,
    getPriorityStyle,
    getPriorityBadge,
}) => {
    return (
        <Draggable
            key={task.id}
            draggableId={task.id}
            index={index}
            isDragDisabled={isTaskDragDisabled}
        >
            {(dragProvided, dragSnapshot) => (
                <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    data-task-card-id={task.id}
                    onClick={() => onSelectTask(task.id)}
                    style={{
                        ...dragProvided.draggableProps.style,
                        ...(dragSnapshot.isDragging
                            ? {
                                  transform: `${dragProvided.draggableProps.style?.transform || ""} rotateZ(${dragTilt.rotateZ}deg) rotateX(${dragTilt.rotateX}deg) scale(1.035)`,
                                  transition:
                                      "transform 0.08s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.15s ease",
                                  boxShadow:
                                      "0 18px 32px -4px rgba(0,0,0,0.18), 0 8px 12px -6px rgba(0,0,0,0.1)",
                                  zIndex: 99999,
                              }
                            : {}),
                    }}
                    className={`kanban-task-card group relative p-2.5 bg-white border border-[#E5E5E3] hover:border-[#DADAD6] flex flex-col gap-2 transition-colors text-left ${getPriorityStyle(
                        task.priority,
                    )} ${
                        dragSnapshot.isDragging
                            ? "border-[#1A1A1A] bg-[#FAFAF9]"
                            : ""
                    } ${
                        !isTaskDragDisabled
                            ? "cursor-grab active:cursor-grabbing"
                            : "cursor-pointer"
                    }`}
                >
                    <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            {getPriorityBadge(task.priority)}
                            {task.carryCount > 0 && (
                                <span className="text-[9px] font-medium text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 px-1.5 py-0.5 rounded-[2px] shrink-0">
                                    Carried {task.carryCount}d
                                </span>
                            )}
                        </div>

                        {/* 3-dot menu trigger visible on hover */}
                        {userRole !== "OBSERVER" &&
                            task.createdById === currentUser.id && (
                                <div
                                    className="relative shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCardMenuId(
                                                cardMenuId === task.id
                                                    ? null
                                                    : task.id,
                                            )
                                        }
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#FAFAF9] rounded-[2px] border border-transparent hover:border-[#E5E5E3] text-[#888883] hover:text-[#1A1A1A] transition-all cursor-pointer"
                                        title="Task options"
                                    >
                                        <MoreVertical className="w-3.5 h-3.5" />
                                    </button>

                                    {cardMenuId === task.id && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-30"
                                                onClick={() =>
                                                    setCardMenuId(null)
                                                }
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
                                                {(userRole === "LEADER" ||
                                                    task.createdById ===
                                                        currentUser.id) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCardMenuId(null);
                                                            onArchiveTaskClick(
                                                                task,
                                                            );
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 hover:bg-[#FAFAF9] text-[#CB2431] flex items-center gap-2 transition-colors cursor-pointer"
                                                    >
                                                        <Archive className="w-3 h-3 text-[#CB2431]" />
                                                        Archive
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                    </div>

                    <div>
                        <h4 className="text-[13px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2">
                            {task.title}
                        </h4>
                        {task.description && (
                            <p className="text-[11px] text-[#888883] mt-0.5 line-clamp-2 leading-relaxed">
                                {task.description.replace(/<[^>]*>/g, "").trim()}
                            </p>
                        )}
                    </div>

                    {/* Checklist Summary */}
                    {task.checklist && task.checklist.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-[#888883]">
                            <span>
                                {
                                    task.checklist.filter(
                                        (item: any) => item.isCompleted,
                                    ).length
                                }{" "}
                                / {task.checklist.length} subtasks
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
};
