import React, { useState, useRef, useEffect } from "react";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import { CustomSelect } from "./CustomSelect";

interface CustomDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function CustomDatePicker({
    value,
    onChange,
    placeholder = "Select date...",
    className = "",
    disabled = false,
}: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleOpen = () => {
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 320 && rect.top > 320) {
                setOpenUpward(true);
            } else {
                setOpenUpward(false);
            }
        }
        setIsOpen((prev) => !prev);
    };

    const todayDate = new Date();
    const todayStr = new Date(
        todayDate.getTime() - todayDate.getTimezoneOffset() * 60000,
    )
        .toISOString()
        .split("T")[0];

    const initialDate = value ? new Date(value) : todayDate;
    const [viewDate, setViewDate] = useState(initialDate);

    useEffect(() => {
        if (value) {
            setViewDate(new Date(value));
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

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
    const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const monthOptions = monthNames.map((mName, idx) => ({
        value: idx.toString(),
        label: mName,
    }));

    const yearOptions = Array.from({ length: 16 }, (_, i) => {
        const y = (2020 + i).toString();
        return { value: y, label: y };
    });

    const getDaysInMonth = (y: number, m: number) =>
        new Date(y, m + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const daysCount = getDaysInMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const calendarCells = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        calendarCells.push({
            dayNum: prevMonthDays - i,
            isCurrentMonth: false,
            dateStr: new Date(year, month - 1, prevMonthDays - i)
                .toISOString()
                .split("T")[0],
        });
    }

    // Current month days
    for (let i = 1; i <= daysCount; i++) {
        const d = new Date(year, month, i);
        const offsetDate = new Date(
            d.getTime() - d.getTimezoneOffset() * 60000,
        );
        calendarCells.push({
            dayNum: i,
            isCurrentMonth: true,
            dateStr: offsetDate.toISOString().split("T")[0],
        });
    }

    // Next month padding to fill 6 rows (42 total cells)
    const nextMonthPadding = 42 - calendarCells.length;
    for (let i = 1; i <= nextMonthPadding; i++) {
        const d = new Date(year, month + 1, i);
        const offsetDate = new Date(
            d.getTime() - d.getTimezoneOffset() * 60000,
        );
        calendarCells.push({
            dayNum: i,
            isCurrentMonth: false,
            dateStr: offsetDate.toISOString().split("T")[0],
        });
    }

    const formattedValue = value
        ? new Date(value).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "";

    const handleSelectToday = () => {
        onChange(todayStr);
        setViewDate(todayDate);
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className={`relative inline-block ${className}`}
        >
            <button
                type="button"
                disabled={disabled}
                onClick={toggleOpen}
                className={`w-full bg-white border border-[#E5E5E3] rounded-[3px] px-2.5 py-1.5 text-[11px] text-[#1A1A1A] flex items-center justify-between gap-2 hover:border-[#1A1A1A] focus:outline-none transition-colors ${
                    disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                }`}
            >
                <span className="truncate">
                    {formattedValue || placeholder}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#888883] shrink-0" />
            </button>

            {isOpen && !disabled && (
                <div
                    className={`absolute right-0 bg-white border border-[#E5E5E3] rounded-[3px] p-3 z-[999999] w-72 text-[#1A1A1A] select-none shadow-2xl ${
                        openUpward ? "bottom-full mb-1" : "top-full mt-1"
                    }`}
                    style={{ boxShadow: "var(--shadow-float)" }}
                >
                    {/* Today Button Header */}
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E5E5E3]">
                        <button
                            type="button"
                            onClick={handleSelectToday}
                            className="text-[11px] font-medium text-[#1A1A1A] hover:underline flex items-center gap-1.5"
                        >
                            <span className="w-2 h-2 rounded-full bg-[#1A1A1A] inline-block"></span>
                            Today:{" "}
                            {todayDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </button>
                    </div>

                    {/* Quick Month & Year Navigation with CustomSelect */}
                    <div className="flex items-center justify-between gap-1 mb-2.5">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <CustomSelect
                                options={monthOptions}
                                value={month.toString()}
                                onChange={(val) =>
                                    setViewDate(
                                        new Date(year, parseInt(val), 1),
                                    )
                                }
                                className="w-28 text-[11px]"
                            />

                            <CustomSelect
                                options={yearOptions}
                                value={year.toString()}
                                onChange={(val) =>
                                    setViewDate(
                                        new Date(parseInt(val), month, 1),
                                    )
                                }
                                className="w-20 text-[11px]"
                            />
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() =>
                                    setViewDate(new Date(year, month - 1, 1))
                                }
                                className="p-1.5 border border-[#E5E5E3] rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#FAFAF9]"
                                title="Previous month"
                            >
                                <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setViewDate(new Date(year, month + 1, 1))
                                }
                                className="p-1.5 border border-[#E5E5E3] rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#FAFAF9]"
                                title="Next month"
                            >
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Day labels */}
                    <div className="grid grid-cols-7 text-center mb-1">
                        {daysOfWeek.map((d) => (
                            <span
                                key={d}
                                className="text-[9px] font-medium text-[#888883] capitalize"
                            >
                                {d}
                            </span>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 gap-0.5 text-center">
                        {calendarCells.map((cell, idx) => {
                            const isSelected = cell.dateStr === value;
                            const isTodayCell = cell.dateStr === todayStr;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        onChange(cell.dateStr);
                                        setIsOpen(false);
                                    }}
                                    className={`h-7 text-[11px] font-medium rounded-[2px] flex items-center justify-center transition-colors relative ${
                                        isSelected
                                            ? "bg-[#1A1A1A] text-white font-semibold"
                                            : isTodayCell
                                              ? "border border-[#1A1A1A] text-[#1A1A1A] font-semibold"
                                              : cell.isCurrentMonth
                                                ? "text-[#1A1A1A] hover:bg-[#F5F5F3]"
                                                : "text-[#DADAD6] hover:bg-[#FAFAF9]"
                                    }`}
                                >
                                    {cell.dayNum}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
