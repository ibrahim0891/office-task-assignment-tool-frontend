"use client";

import React from "react";
import { Filter, X, CalendarRange, RotateCcw } from "lucide-react";
import ModalWrapper from "../ui/ModalWrapper";
import { Button } from "../ui/Button";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { SelectOption } from "../ui/CustomSelect";

export interface TaskFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    // Priority filter
    priorityFilter: string;
    onPriorityChange: (priority: string) => void;
    priorityOptions: SelectOption[];
    // Date Range
    rangeStartDate: string;
    rangeEndDate: string;
    onRangeStartDateChange: (date: string) => void;
    onRangeEndDateChange: (date: string) => void;
    onSetRangePreset: (preset: "7days" | "week" | "task" | "month" | "30days" | "project") => void;
    windowPresetLabel?: string;
    // Task/Project boundaries
    minDate?: string;
    maxDate?: string;
    // Actions
    onApply?: () => void;
    onClearAll: () => void;
    activeCount: number;
}

export default function TaskFilterModal({
    isOpen,
    onClose,
    title = "Filters",
    priorityFilter,
    onPriorityChange,
    priorityOptions,
    rangeStartDate,
    rangeEndDate,
    onRangeStartDateChange,
    onRangeEndDateChange,
    onSetRangePreset,
    windowPresetLabel = "Task Window",
    minDate,
    maxDate,
    onApply,
    onClearAll,
    activeCount,
}: TaskFilterModalProps) {
    const handleApply = () => {
        if (onApply) {
            onApply();
        } else {
            onClose();
        }
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-md"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--app-border)] select-none">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[var(--app-muted)]" />
                    <h3 className="text-xs font-semibold text-[var(--app-text)]">{title}</h3>
                    {activeCount > 0 && (
                        <span className="text-[10px] font-medium bg-[var(--app-bg)] text-[var(--app-text)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-[2px] tabular-nums">
                            {activeCount} active
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors p-1 cursor-pointer rounded-[2px]"
                    title="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-5 text-xs text-[var(--app-text)]">
                {/* Section 1: Priority Filter */}
                <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold text-[var(--app-muted)] tracking-wider uppercase">
                        Priority
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                        {priorityOptions.map((opt) => {
                            const isSelected = priorityFilter === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => onPriorityChange(opt.value)}
                                    className={`py-1.5 px-2 text-[11px] font-medium rounded-[2px] border transition-all cursor-pointer flex items-center justify-center text-center ${
                                        isSelected
                                            ? "bg-[var(--app-text)] text-[var(--app-card)] border-[var(--app-text)] font-semibold shadow-xs"
                                            : "bg-[var(--app-card)] text-[var(--app-text)] border-[var(--app-border)] hover:bg-[var(--app-hover-bg)] hover:border-[var(--app-border-strong)]"
                                    }`}
                                >
                                    {opt.label.replace("All Priorities", "All")}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Section 2: Date Range Filter */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-[var(--app-muted)] tracking-wider uppercase flex items-center gap-1.5">
                            <CalendarRange className="w-3.5 h-3.5" />
                            <span>Date Range</span>
                        </label>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-center h-[36px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] px-2 py-1 gap-2">
                            <CustomDatePicker
                                value={rangeStartDate}
                                onChange={(val) => {
                                    onRangeStartDateChange(val);
                                    if (rangeEndDate && val > rangeEndDate) onRangeEndDateChange(val);
                                }}
                                placeholder="Start Date"
                                minDate={minDate}
                                maxDate={maxDate}
                                buttonClassName="border-0 shadow-none bg-transparent hover:bg-[var(--app-hover-bg)] h-full py-0 px-2 text-xs font-medium"
                                className="flex-1 h-full flex items-center"
                            />
                            <span className="text-xs text-[var(--app-muted)] font-semibold px-1 select-none">→</span>
                            <CustomDatePicker
                                value={rangeEndDate}
                                onChange={(val) => {
                                    onRangeEndDateChange(val);
                                    if (rangeStartDate && val < rangeStartDate) onRangeStartDateChange(val);
                                }}
                                placeholder="End Date"
                                minDate={rangeStartDate || minDate}
                                maxDate={maxDate}
                                buttonClassName="border-0 shadow-none bg-transparent hover:bg-[var(--app-hover-bg)] h-full py-0 px-2 text-xs font-medium"
                                className="flex-1 h-full flex items-center"
                            />
                        </div>

                        {/* Preset Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                                type="button"
                                onClick={() => onSetRangePreset("7days")}
                                className="py-1 px-2.5 text-[11px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer"
                            >
                                7 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => onSetRangePreset("week")}
                                className="py-1 px-2.5 text-[11px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer"
                            >
                                This Week
                            </button>
                            <button
                                type="button"
                                onClick={() => onSetRangePreset("30days")}
                                className="py-1 px-2.5 text-[11px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer"
                            >
                                30 Days
                            </button>
                            {minDate && maxDate && (
                                <button
                                    type="button"
                                    onClick={() => onSetRangePreset("task")}
                                    className="py-1 px-2.5 text-[11px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer"
                                    title={`Reset to full duration (${minDate} → ${maxDate})`}
                                >
                                    {windowPresetLabel}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--app-border)] bg-[var(--app-bg)] select-none">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={activeCount === 0}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={onClearAll}
                >
                    Reset Filters
                </Button>

                <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleApply}
                >
                    Apply Filters
                </Button>
            </div>
        </ModalWrapper>
    );
}
