import React, { useState, useRef, useEffect } from "react";
import { Task } from "../api";

interface CalendarViewProps {
    tasks: Task[];
    onSelectTask: (taskId: string) => void;
    activeDateStr: string;
    setActiveDateStr: (dateStr: string) => void;
}

export default function CalendarView({
    tasks,
    onSelectTask,
    activeDateStr,
    setActiveDateStr,
}: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    // popover: { dateStr, rect } | null
    const [popover, setPopover] = useState<{
        dateStr: string;
        x: number;
        y: number;
    } | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const activeTasks = tasks.filter((t) => !t.isSoftDeleted && !t.isArchived);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const getDaysInMonth = (y: number, m: number) =>
        new Date(y, m + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const daysCount = getDaysInMonth(year, month);
    const prevMonthDaysCount = getDaysInMonth(year, month - 1);

    const days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
        days.push({
            dayNum: prevMonthDaysCount - i,
            isPadding: true,
            date: new Date(year, month - 1, prevMonthDaysCount - i),
        });
    }

    for (let i = 1; i <= daysCount; i++) {
        days.push({
            dayNum: i,
            isPadding: false,
            date: new Date(year, month, i),
        });
    }

    const totalGridCells = Math.ceil(days.length / 7) * 7;
    const nextMonthPadding = totalGridCells - days.length;
    for (let i = 1; i <= nextMonthPadding; i++) {
        days.push({
            dayNum: i,
            isPadding: true,
            date: new Date(year, month + 1, i),
        });
    }

    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentMonth((prev) => {
            const nextDate = new Date(prev);
            nextDate.setMonth(
                prev.getMonth() + (direction === "next" ? 1 : -1),
            );
            return nextDate;
        });
    };

    const getLocalDateString = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const getTasksForDate = (date: Date) => {
        const compareStr = getLocalDateString(date);
        return activeTasks.filter((t) => t.date.split("T")[0] === compareStr);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "URGENT":
                return "border-l-2 border-l-[#CB2431] text-[#CB2431]";
            case "HIGH":
                return "border-l-2 border-l-[#B08800] text-[#B08800]";
            case "MEDIUM":
                return "border-l-2 border-l-[#1A1A1A] text-[#1A1A1A]";
            default:
                return "border-l-2 border-l-[#DADAD6] text-[#888883]";
        }
    };

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>(
        { top: 0, left: 0 },
    );

    // Close popover when clicking outside & adjust positioning to stay inside viewport
    useEffect(() => {
        if (!popover) return;

        if (popoverRef.current) {
            const rect = popoverRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            let top = popover.y;
            let left = popover.x;

            if (top + rect.height > viewportHeight - 16) {
                top = Math.max(16, viewportHeight - rect.height - 16);
            }

            if (left + rect.width > viewportWidth - 16) {
                left = Math.max(16, viewportWidth - rect.width - 16);
            }

            setPopoverPos({ top, left });
        }

        const handler = (e: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node)
            ) {
                setPopover(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [popover]);

    // Tasks shown in the popover
    const popoverTasks = popover
        ? activeTasks.filter((t) => t.date.split("T")[0] === popover.dateStr)
        : [];

    return (
        <div className="flex-1 overflow-y-auto p-5 bg-[#FAFAF9] text-[#1A1A1A] flex flex-col gap-4 select-none">
            {/* Calendar Header */}
            <div className="flex justify-between items-center bg-white border border-[#E5E5E3] p-4 corner-brackets">
                <div>
                    <h1 className="font-heading text-xl">
                        {monthNames[month]} {year}
                    </h1>
                    <p className="text-[11px] text-[#888883] mt-0.5">
                        Click a task to view details. Click a date to set the
                        active filter.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigateMonth("prev")}
                        className="px-2.5 py-1.5 border border-[#E5E5E3] rounded-[3px] text-[#1A1A1A] hover:bg-[#FAFAF9] transition-colors text-[12px] cursor-pointer"
                    >
                        ◀
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-3 py-1.5 border border-[#E5E5E3] rounded-[3px] text-[12px] font-medium text-[#1A1A1A] hover:bg-[#FAFAF9] transition-colors cursor-pointer"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => navigateMonth("next")}
                        className="px-2.5 py-1.5 border border-[#E5E5E3] rounded-[3px] text-[#1A1A1A] hover:bg-[#FAFAF9] transition-colors text-[12px] cursor-pointer"
                    >
                        ▶
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-white border border-[#E5E5E3] flex flex-col flex-1 min-h-[550px] corner-brackets">
                {/* Days of week header */}
                <div className="grid grid-cols-7 border-b border-[#E5E5E3] text-center shrink-0 py-2">
                    {weekDays.map((d) => (
                        <div
                            key={d}
                            className="text-xs font-medium text-[#888883] capitalize tracking-[0.05em]"
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar cells */}
                <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-[#E5E5E3] bg-white">
                    {days.map((cell, index) => {
                        const dateStr = getLocalDateString(cell.date);
                        const isActive = dateStr === activeDateStr;
                        const dayTasks = getTasksForDate(cell.date);
                        const isToday =
                            getLocalDateString(new Date()) === dateStr;
                        const VISIBLE = 3;
                        const overflowCount = dayTasks.length - VISIBLE;

                        return (
                            <div
                                key={index}
                                data-cell
                                onClick={() => setActiveDateStr(dateStr)}
                                className={`p-2 min-h-24 flex flex-col gap-1.5 transition-colors cursor-pointer relative ${
                                    cell.isPadding
                                        ? "bg-[#FAFAF9] text-[#DADAD6]"
                                        : "bg-white hover:bg-[#FAFAF9] text-[#1A1A1A]"
                                } ${
                                    isActive
                                        ? "border-l-2 border-l-[#1A1A1A] bg-[#F5F5F3]"
                                        : ""
                                }`}
                            >
                                {/* Date Label */}
                                <div className="flex justify-between items-center">
                                    <span
                                        className={`text-[11px] font-medium ${
                                            isToday
                                                ? "bg-[#1A1A1A] text-white w-5 h-5 rounded-full flex items-center justify-center text-xs"
                                                : isActive
                                                  ? "text-[#1A1A1A] font-semibold"
                                                  : "text-[#888883]"
                                        }`}
                                    >
                                        {cell.dayNum}
                                    </span>

                                    {dayTasks.length > 0 && (
                                        <span className="text-[9px] text-[#888883]">
                                            {dayTasks.length}
                                        </span>
                                    )}
                                </div>

                                {/* Task list */}
                                <div className="flex-1 flex flex-col gap-0.5">
                                    {dayTasks.slice(0, VISIBLE).map((task) => (
                                        <div
                                            key={task.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectTask(task.id);
                                            }}
                                            title={task.title}
                                            className={`px-1.5 py-0.5 text-[9px] font-medium border border-[#E5E5E3] rounded-[2px] truncate cursor-pointer transition-colors hover:brightness-95 ${getPriorityColor(task.priority)}`}
                                        >
                                            {task.title}
                                        </div>
                                    ))}
                                    {overflowCount > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = (
                                                    e.currentTarget as HTMLElement
                                                )
                                                    .closest("[data-cell]")!
                                                    .getBoundingClientRect();
                                                setPopover({
                                                    dateStr,
                                                    x: rect.left,
                                                    y: rect.bottom + 4,
                                                });
                                            }}
                                            data-overflow
                                            className="text-[8px] text-[#1A1A1A] font-medium px-1 py-0.5 rounded-[2px] bg-[#F0F0EE] hover:bg-[#E5E5E3] transition-colors text-left w-full cursor-pointer"
                                        >
                                            + {overflowCount} more
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Day overflow popover */}
            {popover && (
                <div
                    ref={popoverRef}
                    style={{
                        position: "fixed",
                        left: popoverPos.left || popover.x,
                        top: popoverPos.top || popover.y,
                        zIndex: 60,
                    }}
                    className="bg-white border border-[#E5E5E3] shadow-xl w-64 p-3 flex flex-col gap-2 animate-fade-in corner-brackets-thick max-h-[80vh] overflow-hidden"
                >
                    <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-1.5 shrink-0">
                        <span className="text-xs font-semibold text-[#1A1A1A] capitalize tracking-[0.05em]">
                            {popover.dateStr} ({popoverTasks.length} tasks)
                        </span>
                        <button
                            onClick={() => setPopover(null)}
                            className="text-[#888883] hover:text-[#1A1A1A] text-[12px] leading-none cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                        {popoverTasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => {
                                    setPopover(null);
                                    onSelectTask(task.id);
                                }}
                                className={`px-2 py-1.5 text-xs font-medium border border-[#E5E5E3] rounded-[2px] cursor-pointer transition-colors hover:bg-[#FAFAF9] truncate shrink-0 ${getPriorityColor(task.priority)}`}
                                title={task.title}
                            >
                                {task.title}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
