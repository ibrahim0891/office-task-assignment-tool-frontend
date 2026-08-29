import React, { useState, useRef, useEffect } from "react";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import { CustomSelect } from "./CustomSelect";
import { getLocalDateString, parseLocalDate } from "../../utils/date";

interface CustomDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    buttonClassName?: string;
    disabled?: boolean;
    minDate?: string;
    maxDate?: string;
}

export function CustomDatePicker({
    value,
    onChange,
    placeholder = "Select date...",
    className = "",
    buttonClassName = "",
    disabled = false,
    minDate,
    maxDate,
}: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isDateDisabled = (dateStr: string) => {
        if (minDate && dateStr < minDate) return true;
        if (maxDate && dateStr > maxDate) return true;
        return false;
    };

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
    const todayStr = getLocalDateString(todayDate);

    const initialDate = value ? parseLocalDate(value) : todayDate;
    const [viewDate, setViewDate] = useState(initialDate);

    useEffect(() => {
        if (value) {
            setViewDate(parseLocalDate(value));
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
        const d = new Date(year, month - 1, prevMonthDays - i);
        calendarCells.push({
            dayNum: prevMonthDays - i,
            isCurrentMonth: false,
            dateStr: getLocalDateString(d),
        });
    }

    // Current month days
    for (let i = 1; i <= daysCount; i++) {
        const d = new Date(year, month, i);
        calendarCells.push({
            dayNum: i,
            isCurrentMonth: true,
            dateStr: getLocalDateString(d),
        });
    }

    // Next month padding to fill 6 rows (42 total cells)
    const nextMonthPadding = 42 - calendarCells.length;
    for (let i = 1; i <= nextMonthPadding; i++) {
        const d = new Date(year, month + 1, i);
        calendarCells.push({
            dayNum: i,
            isCurrentMonth: false,
            dateStr: getLocalDateString(d),
        });
    }

    const formattedValue = value
        ? parseLocalDate(value).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "";

    const isTodayDisabled = isDateDisabled(todayStr);
    const handleSelectToday = () => {
        if (isTodayDisabled) return;
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
                className={`w-full bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] px-2.5 py-1.5 text-[11px] text-[var(--app-text)] flex items-center justify-between gap-2 hover:border-[var(--color-accent)] focus:outline-none transition-colors ${
                    disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                } ${buttonClassName}`}
            >
                <span className="truncate">
                    {formattedValue || placeholder}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
            </button>

            {isOpen && !disabled && (
                <div
                    className={`absolute right-0 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-3 z-[999999] w-72 text-[var(--app-text)] select-none shadow-2xl corner-brackets ${
                        openUpward ? "bottom-full mb-1" : "top-full mt-1"
                    }`}
                    style={{ boxShadow: "var(--shadow-float)" }}
                >
                    {/* Today Button Header */}
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--app-border)]">
                        <button
                            type="button"
                            onClick={handleSelectToday}
                            disabled={isTodayDisabled}
                            className={`text-[11px] font-medium flex items-center gap-1.5 transition-opacity ${
                                isTodayDisabled
                                    ? "text-[var(--app-muted)] opacity-40 cursor-not-allowed"
                                    : "text-[var(--app-text)] hover:opacity-80 cursor-pointer"
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] inline-block ring-2 ring-[var(--color-accent)]/30"></span>
                            <span>Today:{" "}
                            {todayDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}</span>
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
                                className="p-1.5 border border-[var(--app-border)] bg-[var(--app-card)] rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] cursor-pointer transition-colors"
                                title="Previous month"
                            >
                                <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setViewDate(new Date(year, month + 1, 1))
                                }
                                className="p-1.5 border border-[var(--app-border)] bg-[var(--app-card)] rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] cursor-pointer transition-colors"
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
                                className="text-[9px] font-medium text-[var(--app-muted)] capitalize"
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
                            const isCellDisabled = isDateDisabled(cell.dateStr);

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={isCellDisabled}
                                    onClick={() => {
                                        if (isCellDisabled) return;
                                        onChange(cell.dateStr);
                                        setIsOpen(false);
                                    }}
                                    className={`h-7 text-[11px] font-medium rounded-[2px] flex items-center justify-center transition-colors relative ${
                                        isCellDisabled
                                            ? "opacity-20 cursor-not-allowed text-[var(--app-muted)] pointer-events-none"
                                            : isSelected
                                            ? "bg-[var(--color-accent)] text-[var(--app-bg)] font-semibold shadow-xs cursor-pointer"
                                            : isTodayCell
                                            ? "border-2 border-[var(--color-accent)] text-[var(--color-accent)] font-bold bg-[var(--color-accent)]/15 shadow-xs cursor-pointer"
                                            : cell.isCurrentMonth
                                            ? "text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] cursor-pointer"
                                            : "text-[var(--app-muted)]/40 hover:bg-[var(--app-hover-bg)]/40 cursor-pointer"
                                    }`}
                                >
                                    {cell.dayNum}
                                    {isTodayCell && !isSelected && !isCellDisabled && (
                                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-accent)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
