"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    api,
    ReportData,
    ReportTaskItem,
    MemberReportSummary,
    DailyGroupReport,
} from "../api";
import { useWorkspace } from "../context/WorkspaceContext";
import { Button } from "./ui/Button";
import { SkeletonReport, SkeletonBox } from "./ui/SkeletonLoader";
import { CustomDatePicker } from "./ui/CustomDatePicker";
import toast from "react-hot-toast";
import {
    Globe,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    X,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    CheckSquare,
    Copy,
    Download,
    Printer,
    ArrowRight,
    MessageSquare,
} from "lucide-react";
import { getLocalDateString } from "../utils/date";

function PersonAvatar({
    src,
    alt,
    className = "w-5 h-5",
    initials = "",
}: {
    src?: string | null;
    alt: string;
    className?: string;
    initials?: string;
}) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [src]);

    const displayInitials =
        initials ||
        (alt
            ? alt
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
            : "U");

    const roundedClass = className.includes("rounded") ? "" : "rounded-[2px]";
    const isLarge = className.includes("w-24") || className.includes("h-24") || className.includes("w-20") || className.includes("h-20");
    const isMedium = className.includes("w-12") || className.includes("h-12") || className.includes("w-11") || className.includes("h-11") || className.includes("w-10") || className.includes("w-8");
    const textSize = isLarge ? "text-2xl font-bold tracking-wider" : isMedium ? "text-xs font-bold" : "text-[10px] font-bold";

    if (src && !hasError) {
        return (
            <img
                src={src}
                alt={alt}
                onError={() => setHasError(true)}
                className={`${roundedClass} object-cover border border-[var(--app-border)] shrink-0 ${className}`}
            />
        );
    }

    return (
        <div
            className={`${roundedClass} border border-[var(--app-border)] bg-[var(--app-select-bg)] text-[var(--app-text)] flex items-center justify-center shrink-0 ${textSize} ${className}`}
        >
            {displayInitials}
        </div>
    );
}

interface ReportViewProps {
    currentTeam: { id: string; name: string; emoji?: string };
}

export default function ReportView({ currentTeam }: ReportViewProps) {
    const { setSelectedTaskId } = useWorkspace();

    // Filters
    const [selectedMemberId, setSelectedMemberId] = useState<string>("all");
    const [rangePreset, setRangePreset] = useState<string>("0"); // '0'=today, '1'=yesterday, '7', '14', '30', 'custom'
    const [customStart, setCustomStart] = useState<string>("");
    const [customEnd, setCustomEnd] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in_progress" | "attention">("all");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Custom Date Range Dropdown State
    const [isCustomDropdownOpen, setIsCustomDropdownOpen] = useState(false);
    const [tempCustomStart, setTempCustomStart] = useState<string>("");
    const [tempCustomEnd, setTempCustomEnd] = useState<string>("");
    const customDropdownRef = useRef<HTMLDivElement>(null);

    // State
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Member selection with browser history support (system back navigation)
    const handleMemberSelect = (memberId: string, pushHistory = true) => {
        setSelectedMemberId(memberId);
        if (typeof window !== "undefined" && pushHistory) {
            const url = new URL(window.location.href);
            if (memberId === "all") {
                url.searchParams.delete("member");
            } else {
                url.searchParams.set("member", memberId);
            }
            window.history.pushState({ memberId }, "", url.toString());
        }
    };

    // Initialize from URL search params on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const memberParam = params.get("member");
            if (memberParam) {
                setSelectedMemberId(memberParam);
            }
            // Ensure base history state is set
            window.history.replaceState(
                { memberId: memberParam || "all" },
                "",
                window.location.href
            );
        }
    }, []);

    // Listen to browser / system back/forward navigation
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state && typeof event.state.memberId === "string") {
                setSelectedMemberId(event.state.memberId);
            } else {
                const params = new URLSearchParams(window.location.search);
                setSelectedMemberId(params.get("member") || "all");
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                teamId: currentTeam.id,
                memberId: selectedMemberId === "all" ? undefined : selectedMemberId,
            };

            if (rangePreset !== "custom") {
                params.daysFromToday = parseInt(rangePreset, 10);
            } else if (customStart && customEnd) {
                params.startDate = customStart;
                params.endDate = customEnd;
            }

            const data = await api.getReports(params);
            setReportData(data);
        } catch (err: any) {
            toast.error("Error fetching report: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (rangePreset === "custom") {
            if (customStart && customEnd) {
                fetchReport();
            }
        } else {
            fetchReport();
        }
    }, [currentTeam.id, rangePreset, selectedMemberId, customStart, customEnd]);

    // Close custom dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                customDropdownRef.current &&
                !customDropdownRef.current.contains(event.target as Node)
            ) {
                setIsCustomDropdownOpen(false);
            }
        };
        if (isCustomDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isCustomDropdownOpen]);

    const handleApplyCustomRange = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!tempCustomStart || !tempCustomEnd) {
            toast.error("Please select both start and end dates");
            return;
        }
        if (tempCustomStart > tempCustomEnd) {
            toast.error("Start date must be before or equal to end date");
            return;
        }
        setCustomStart(tempCustomStart);
        setCustomEnd(tempCustomEnd);
        setRangePreset("custom");
        setIsCustomDropdownOpen(false);
    };

    // Day Stepper Handler (step 1 day back or forward)
    const handleStepDay = (direction: -1 | 1) => {
        let baseDateStr = reportData?.startDate || getLocalDateString();
        if (rangePreset === "0") {
            baseDateStr = reportData?.todayDate || getLocalDateString();
        }

        const [y, m, d] = baseDateStr.split("-").map(Number);
        const nextDate = new Date(Date.UTC(y, m - 1, d + direction));
        const nextDateStr = getLocalDateString(nextDate);

        setRangePreset("custom");
        setCustomStart(nextDateStr);
        setCustomEnd(nextDateStr);
    };

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            const params: any = {
                teamId: currentTeam.id,
                memberId: selectedMemberId === "all" ? undefined : selectedMemberId,
            };
            if (rangePreset !== "custom") {
                params.daysFromToday = parseInt(rangePreset, 10);
            } else if (customStart && customEnd) {
                params.startDate = customStart;
                params.endDate = customEnd;
            }
            await api.exportCsv(params);
            toast.success("CSV export downloaded");
        } catch (err: any) {
            toast.error("Error exporting CSV: " + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handlePrintPDF = () => {
        window.print();
    };

    // 1-Click Copy Standup Summary
    const handleCopyStandup = () => {
        if (!reportData) return;

        const memberName = reportData.selectedMember?.fullName || "All Team Members";
        const periodStr = `${reportData.startDate} to ${reportData.endDate}`;

        const completed = reportData.tasks.filter((t) => t.isComplete);
        const inProgress = reportData.tasks.filter((t) => {
            const col = t.status.toLowerCase();
            return !t.isComplete && (col.includes("progress") || col.includes("doing") || col.includes("review"));
        });
        const attention = reportData.tasks.filter((t) => {
            const col = t.status.toLowerCase();
            return (!t.isComplete && (col.includes("attention") || col.includes("blocked"))) || t.carryCount >= 2;
        });

        let summary = `📋 Daily Standup Summary\n`;
        summary += `👤 Member: ${memberName}\n`;
        summary += `📅 Period: ${periodStr}\n\n`;

        summary += `✅ Completed Tasks (${completed.length}):\n`;
        if (completed.length === 0) summary += `  • None\n`;
        completed.forEach((t) => {
            const checklistStr = t.checklistStats.total > 0 ? ` (${t.checklistStats.completed}/${t.checklistStats.total} subtasks)` : "";
            summary += `  • ${t.title}${checklistStr}\n`;
        });

        summary += `\n⏳ In Progress (${inProgress.length}):\n`;
        if (inProgress.length === 0) summary += `  • None\n`;
        inProgress.forEach((t) => {
            const checklistStr = t.checklistStats.total > 0 ? ` (${t.checklistStats.completed}/${t.checklistStats.total} subtasks)` : "";
            summary += `  • ${t.title}${checklistStr}\n`;
        });

        summary += `\n⚠️ Blockers / Carried Tasks (${attention.length}):\n`;
        if (attention.length === 0) summary += `  • None\n`;
        attention.forEach((t) => {
            const carryStr = t.carryCount > 0 ? ` (Carried ${t.carryCount} days)` : "";
            const noteStr = t.latestComment ? ` — "${t.latestComment.content}"` : "";
            summary += `  • ${t.title}${carryStr}${noteStr}\n`;
        });

        navigator.clipboard.writeText(summary);
        toast.success("Standup summary copied to clipboard!");
    };

    // Filter tasks by status and search
    const filteredDailyGroups = useMemo(() => {
        if (!reportData?.dailyGroups) return [];

        return reportData.dailyGroups
            .map((group) => {
                const matchedTasks = group.tasks.filter((t) => {
                    if (statusFilter === "completed" && !t.isComplete) return false;
                    if (statusFilter === "in_progress") {
                        const col = t.status.toLowerCase();
                        if (t.isComplete || (!col.includes("progress") && !col.includes("doing") && !col.includes("review"))) {
                            return false;
                        }
                    }
                    if (statusFilter === "attention") {
                        const col = t.status.toLowerCase();
                        if (t.isComplete || (!col.includes("attention") && !col.includes("blocked") && t.carryCount < 2)) {
                            return false;
                        }
                    }

                    if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase();
                        const titleMatch = t.title.toLowerCase().includes(q);
                        const descMatch = (t.description || "").toLowerCase().includes(q);
                        const assigneeMatch = (t.assignedTo?.fullName || "").toLowerCase().includes(q);
                        if (!titleMatch && !descMatch && !assigneeMatch) return false;
                    }

                    return true;
                });

                return {
                    ...group,
                    tasks: matchedTasks,
                };
            })
            .filter((g) => g.tasks.length > 0);
    }, [reportData, statusFilter, searchQuery]);

    const formatHeaderDate = (dateStr: string, isToday?: boolean, isYesterday?: boolean) => {
        try {
            const [y, m, d] = dateStr.split("-").map(Number);
            const dateObj = new Date(Date.UTC(y, m - 1, d));
            const formatted = dateObj.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
            });
            if (isToday) return `Today • ${formatted}`;
            if (isYesterday) return `Yesterday • ${formatted}`;
            return formatted;
        } catch {
            return dateStr;
        }
    };

    const getPriorityTextColor = (p: string) => {
        switch (p?.toUpperCase()) {
            case "URGENT":
                return "text-[var(--priority-urgent)]";
            case "HIGH":
                return "text-[var(--priority-high)]";
            case "MEDIUM":
                return "text-[var(--priority-medium)]";
            case "LOW":
            default:
                return "text-[var(--priority-low)]";
        }
    };

    const getPriorityBorder = (p: string) => {
        switch (p?.toUpperCase()) {
            case "URGENT":
                return "border-l-2 border-l-[var(--priority-urgent)]";
            case "HIGH":
                return "border-l-2 border-l-[var(--priority-high)]";
            case "MEDIUM":
                return "border-l-2 border-l-[var(--priority-medium)]";
            default:
                return "border-l-2 border-l-[var(--priority-low)]";
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)] select-none print:bg-white print:text-black print:overflow-visible">
            {/* ─── FIXED TOP SECTION (Filters & Quick Actions) ─── */}
            <div className="shrink-0 bg-[var(--app-card)] border-b border-[var(--app-border)] z-10 print:hidden flex flex-col">
                {/* 1. Header: Title & Quick Actions */}
                <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)]">
                    <div className="flex items-center gap-2.5">
                        {selectedMemberId !== "all" && (
                            <button
                                type="button"
                                onClick={() => handleMemberSelect("all")}
                                className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors cursor-pointer shrink-0 p-0.5"
                                title="Back to All Team Overview"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h1 className="font-heading text-lg font-bold text-[var(--app-text)]">
                                {selectedMemberId !== "all" && reportData?.selectedMember ? (
                                    `${reportData.selectedMember.fullName}'s Daily Log`
                                ) : (
                                    <>
                                        {currentTeam.emoji ? <span className="mr-1.5 emoji-font">{currentTeam.emoji}</span> : null}
                                        Performance & Daily Reports
                                    </>
                                )}
                            </h1>
                            <p className="text-[11px] text-[var(--app-muted)] mt-0.5">
                                {selectedMemberId !== "all" && reportData?.selectedMember
                                    ? `Detailed performance stats and task activity stream for ${reportData.selectedMember.fullName}.`
                                    : "Member daily activity tracking, completion status, and carry-over analysis."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            onClick={handleCopyStandup}
                            variant="secondary"
                            size="sm"
                            icon={<Copy className="w-3.5 h-3.5 shrink-0" />}
                        >
                            Copy Standup
                        </Button>
                        <Button
                            onClick={handleExportCSV}
                            variant="secondary"
                            size="sm"
                            isLoading={isExporting}
                            loadingText="Exporting…"
                            icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                        >
                            Export CSV
                        </Button>
                        <Button
                            onClick={handlePrintPDF}
                            variant="secondary"
                            size="sm"
                            icon={<Printer className="w-3.5 h-3.5 shrink-0" />}
                        >
                            Print / PDF
                        </Button>
                    </div>
                </div>

                {/* 2. Controls Bar: Period Tabs + Custom Datepicker + Day Stepper + Status Filters + Search */}
                <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[var(--app-card)]">
                    {/* Left: Period Selection & Day Stepper */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Period Presets Segmented Tray */}
                        <div className="inline-flex items-center p-1 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)] gap-1">
                            {[
                                { id: "0", label: "Today" },
                                { id: "1", label: "Yesterday" },
                                { id: "7", label: "7d" },
                                { id: "14", label: "14d" },
                                { id: "30", label: "30d" },
                            ].map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => setRangePreset(preset.id)}
                                    className={`px-3.5 py-1.5 text-[12.5px] sm:text-[13px] font-medium rounded-[var(--radius-xs,3px)] transition-all cursor-pointer ${
                                        rangePreset === preset.id
                                            ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-3xs"
                                            : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}

                            {/* Custom Date Range Dropdown Popover */}
                            <div className="relative" ref={customDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isCustomDropdownOpen) {
                                            setTempCustomStart(customStart || reportData?.startDate || getLocalDateString());
                                            setTempCustomEnd(customEnd || reportData?.endDate || getLocalDateString());
                                        }
                                        setIsCustomDropdownOpen((prev) => !prev);
                                    }}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[12.5px] sm:text-[13px] font-medium rounded-[var(--radius-xs,3px)] transition-all cursor-pointer ${
                                        rangePreset === "custom"
                                            ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-3xs"
                                            : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                    }`}
                                >
                                    <Calendar className="w-4 h-4 text-[var(--app-muted)]" />
                                    <span>
                                        {rangePreset === "custom" && customStart && customEnd
                                            ? `${customStart} → ${customEnd}`
                                            : "Custom"}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--app-muted)] transition-transform ${isCustomDropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {/* Dropdown Popover */}
                                {isCustomDropdownOpen && (
                                    <div className="absolute left-0 top-full mt-1.5 w-80 sm:w-88 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[var(--radius-md,8px)] shadow-xl p-4 z-50 flex flex-col gap-3.5">
                                        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--app-border)]">
                                            <span className="eyebrow font-semibold flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4 text-[var(--app-muted)]" />
                                                Custom Date Range
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsCustomDropdownOpen(false)}
                                                className="text-[var(--app-muted)] hover:text-[var(--app-text)] p-1 rounded-[var(--radius-xs,3px)] transition-colors cursor-pointer"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <form onSubmit={handleApplyCustomRange} className="flex flex-col gap-3.5">
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
                                                        Start Date
                                                    </label>
                                                    <CustomDatePicker
                                                        value={tempCustomStart}
                                                        maxDate={tempCustomEnd || undefined}
                                                        align="left"
                                                        onChange={(val) => {
                                                            setTempCustomStart(val);
                                                            if (tempCustomEnd && val > tempCustomEnd) {
                                                                setTempCustomEnd(val);
                                                            }
                                                        }}
                                                        placeholder="Start date..."
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider">
                                                        End Date
                                                    </label>
                                                    <CustomDatePicker
                                                        value={tempCustomEnd}
                                                        minDate={tempCustomStart || undefined}
                                                        align="right"
                                                        onChange={(val) => setTempCustomEnd(val)}
                                                        placeholder="End date..."
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* Quick shortcut presets within the dropdown */}
                                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                                <span className="text-[11px] text-[var(--app-muted)] mr-0.5 font-medium">Presets:</span>
                                                {[
                                                    { label: "Past 7d", days: 7 },
                                                    { label: "Past 14d", days: 14 },
                                                    { label: "Past 30d", days: 30 },
                                                ].map((shortcut) => (
                                                    <button
                                                        key={shortcut.label}
                                                        type="button"
                                                        onClick={() => {
                                                            const end = new Date();
                                                            const start = new Date();
                                                            start.setDate(start.getDate() - (shortcut.days - 1));
                                                            setTempCustomStart(getLocalDateString(start));
                                                            setTempCustomEnd(getLocalDateString(end));
                                                        }}
                                                        className="text-[11px] px-2.5 py-1 rounded-[var(--radius-xs,3px)] bg-[var(--app-bg)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] border border-[var(--app-border)] transition-colors cursor-pointer"
                                                    >
                                                        {shortcut.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--app-border)]">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsCustomDropdownOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button type="submit" size="sm">
                                                    Apply Range
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Day Stepper */}
                        <div className="inline-flex items-center p-1 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)] text-xs gap-0.5">
                            <button
                                type="button"
                                onClick={() => handleStepDay(-1)}
                                className="p-1.5 hover:bg-[var(--app-card)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[var(--radius-xs,3px)] transition-colors cursor-pointer"
                                title="Step 1 Day Backward"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-[var(--app-muted)] font-semibold px-2 select-none">
                                Day Step
                            </span>
                            <button
                                type="button"
                                onClick={() => handleStepDay(1)}
                                className="p-1.5 hover:bg-[var(--app-card)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[var(--radius-xs,3px)] transition-colors cursor-pointer"
                                title="Step 1 Day Forward"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Right: Status Filters + Search */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Status Filters Segmented Control */}
                        <div className="inline-flex items-center p-1 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)] gap-1">
                            {[
                                { id: "all", label: "All" },
                                { id: "completed", label: "Done" },
                                { id: "in_progress", label: "In Progress" },
                                { id: "attention", label: "Needs Attention" },
                            ].map((st) => (
                                <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => setStatusFilter(st.id as any)}
                                    className={`px-3.5 py-1.5 text-[12.5px] sm:text-[13px] font-medium rounded-[var(--radius-xs,3px)] transition-all cursor-pointer ${
                                        statusFilter === st.id
                                            ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-3xs"
                                            : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                    }`}
                                >
                                    {st.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[160px]">
                            <Search className="w-4 h-4 text-[var(--app-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search tasks…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)] pl-9 pr-3 text-xs sm:text-[13px] text-[var(--app-text)] focus:outline-none focus:border-[var(--app-border-strong)] focus:bg-[var(--app-card)] transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── LOWER SECTION: LEFT MEMBER RAIL + RIGHT DATA CONTENT ─── */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT VERTICAL MEMBER RAIL */}
                <aside className="w-16 sm:w-18 border-r border-[var(--app-border)] bg-[var(--app-card)] flex flex-col shrink-0 select-none print:hidden relative z-10">
                    {/* Rail Scrollable List */}
                    <div className="flex-1 overflow-y-auto overflow-x-visible py-3 flex flex-col items-center gap-3 scrollbar-none">
                        {/* 1. All Team Bubble */}
                        {(() => {
                            const isAllSelected = selectedMemberId === "all";
                            return (
                                <button
                                    type="button"
                                    onClick={() => handleMemberSelect("all")}
                                    className={`w-full py-1 flex items-center justify-center transition-all cursor-pointer group relative ${
                                        isAllSelected ? "opacity-100" : "opacity-70 hover:opacity-100"
                                    }`}
                                    title={`All Team Overview • ${reportData?.totalTasks ?? 0} tasks`}
                                >
                                    <div className="relative inline-flex items-center justify-center">
                                        <div
                                            className={`w-11 h-11 rounded-[var(--radius-card,4px)] flex items-center justify-center transition-all duration-150 border ${
                                                isAllSelected
                                                    ? "bg-[var(--app-select-bg)] border-[var(--app-border-strong)] shadow-xs ring-1 ring-[var(--app-border-strong)]"
                                                    : "bg-[var(--app-card)] border-[var(--app-border)] group-hover:bg-[var(--app-hover-bg)]"
                                            }`}
                                        >
                                            <span className="emoji-font text-lg select-none">
                                                {currentTeam.emoji || "👥"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Active Arrow Pointer on the right border of the rail */}
                                    {isAllSelected && (
                                        <div className="absolute -right-px top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center translate-x-full">
                                            <svg className="w-2.5 h-3 overflow-visible" viewBox="0 0 8 12">
                                                <path d="M 0 0 L 8 6 L 0 12 Z" fill="var(--app-select-bg)" stroke="var(--app-border-strong)" strokeWidth="1.2" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })()}

                        <div className="w-6 h-px bg-[var(--app-border)] my-0.5 shrink-0" />

                        {/* Skeleton state if data not yet loaded */}
                        {!reportData && isLoading && (
                            <>
                                {[1, 2, 3, 4].map((i) => (
                                    <SkeletonBox key={i} className="w-11 h-11 rounded-[var(--radius-card,4px)] shrink-0" />
                                ))}
                            </>
                        )}

                        {/* 2. Member Bubble Cards */}
                        {reportData?.memberBreakdown?.map((member) => {
                            const isSelected = selectedMemberId === member.user.id;
                            return (
                                <button
                                    key={member.user.id}
                                    type="button"
                                    onClick={() => handleMemberSelect(member.user.id)}
                                    className={`w-full py-1 flex items-center justify-center transition-all cursor-pointer group relative ${
                                        isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"
                                    }`}
                                    title={`${member.user.fullName} (${member.user.designation || member.role}) • ${member.completedTasks}/${member.totalTasks} completed (${member.completionRate}%)`}
                                >
                                    <div className="relative inline-flex items-center justify-center">
                                        <PersonAvatar
                                            src={member.user.avatarUrl}
                                            alt={member.user.fullName}
                                            className={`w-11 h-11 rounded-[var(--radius-card,4px)] shadow-2xs border ${
                                                isSelected ? "border-[var(--app-border-strong)] ring-1 ring-[var(--app-border-strong)]" : "border-[var(--app-border)]"
                                            }`}
                                        />
                                    </div>

                                    {/* Active Arrow Pointer on the right border of the rail */}
                                    {isSelected && (
                                        <div className="absolute -right-px top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center translate-x-full">
                                            <svg className="w-2.5 h-3 overflow-visible" viewBox="0 0 8 12">
                                                <path d="M 0 0 L 8 6 L 0 12 Z" fill="var(--app-card)" stroke="var(--app-border-strong)" strokeWidth="1.2" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* RIGHT CONTENT AREA (Metrics Card + Daily Activity Stream) */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col gap-3 select-none print:p-0 print:overflow-visible">
                    {/* Loading State: Shimmer Skeleton */}
                    {isLoading && !reportData && <SkeletonReport />}

                    {/* Report Data Views */}
                    {reportData && (
                        <>
                            {/* 1. Summary & Performance Metrics Card */}
                            <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-3 sm:p-3.5 rounded-[2px] corner-brackets flex flex-col gap-3 shadow-xs">
                                {/* Member / Team Info Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5">
                                        {reportData.selectedMember ? (
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="font-heading text-base font-bold text-[var(--app-text)]">
                                                        {reportData.selectedMember.fullName}
                                                    </h2>
                                                    <span className="text-[9px] bg-[var(--app-bg)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-[2px] text-[var(--app-muted)] font-medium">
                                                        {reportData.selectedMember.designation || "Team Member"}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-[var(--app-muted)]">
                                                    {reportData.selectedMember.email} • Period: {reportData.startDate} → {reportData.endDate}
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <h2 className="font-heading text-base font-bold text-[var(--app-text)]">
                                                    Team Performance Overview
                                                </h2>
                                                <p className="text-[10px] text-[var(--app-muted)]">
                                                    {reportData.memberBreakdown?.length || 0} members • Period: {reportData.startDate} → {reportData.endDate}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* Top 4 Metric KPI Cards Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="bg-[var(--app-bg)] border border-[var(--app-border)] p-2 rounded-[2px] flex flex-col gap-0.5">
                                        <span className="eyebrow text-[9px]">Completion Rate</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-lg sm:text-xl font-heading text-[var(--app-text)] font-bold">
                                                {reportData.completionRate}%
                                            </span>
                                            <span className="text-[10px] text-[var(--app-muted)] font-medium">
                                                ({reportData.completedTasks}/{reportData.totalTasks})
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-[var(--app-bg)] border border-[var(--app-border)] p-2 rounded-[2px] flex flex-col gap-0.5">
                                        <span className="eyebrow text-[9px]">In Progress</span>
                                        <span className="text-lg sm:text-xl font-heading text-[#0284C7] font-bold">
                                            {reportData.inProgressTasks}
                                        </span>
                                    </div>

                                    <div className="bg-[var(--app-bg)] border border-[var(--app-border)] p-2 rounded-[2px] flex flex-col gap-0.5">
                                        <span className="eyebrow text-[9px] text-[#CB2431]">Needs Attention</span>
                                        <span className="text-lg sm:text-xl font-heading text-[#CB2431] font-bold">
                                            {reportData.needsAttentionTasks}
                                        </span>
                                    </div>

                                    <div className="bg-[var(--app-bg)] border border-[var(--app-border)] p-2 rounded-[2px] flex flex-col gap-0.5">
                                        <span className="eyebrow text-[9px] text-[#B08800]">Carried Over (2d+)</span>
                                        <span className="text-lg sm:text-xl font-heading text-[#B08800] font-bold">
                                            {reportData.staleTasksCount}
                                        </span>
                                    </div>
                                </div>

                                {/* Sleek Progress Bar Ribbon */}
                                <div className="flex flex-col gap-1.5 pt-1 border-t border-[var(--app-border)]">
                                    <div className="h-1.5 w-full rounded-[1px] bg-[var(--app-bg)] border border-[var(--app-border)] flex overflow-hidden">
                                        {reportData.totalTasks === 0 ? (
                                            <div className="w-full h-full bg-transparent" />
                                        ) : (
                                            <>
                                                {reportData.completedTasks > 0 && (
                                                    <div
                                                        style={{ width: `${(reportData.completedTasks / reportData.totalTasks) * 100}%` }}
                                                        className="bg-[#22863A] transition-all"
                                                        title={`Done: ${reportData.completedTasks} tasks (${reportData.completionRate}%)`}
                                                    />
                                                )}
                                                {reportData.inProgressTasks > 0 && (
                                                    <div
                                                        style={{ width: `${(reportData.inProgressTasks / reportData.totalTasks) * 100}%` }}
                                                        className="bg-[#0284C7] transition-all"
                                                        title={`In Progress: ${reportData.inProgressTasks} tasks`}
                                                    />
                                                )}
                                                {reportData.needsAttentionTasks > 0 && (
                                                    <div
                                                        style={{ width: `${(reportData.needsAttentionTasks / reportData.totalTasks) * 100}%` }}
                                                        className="bg-[#CB2431] transition-all"
                                                        title={`Needs Attention: ${reportData.needsAttentionTasks} tasks`}
                                                    />
                                                )}
                                                {reportData.totalTasks - reportData.completedTasks - reportData.inProgressTasks - reportData.needsAttentionTasks > 0 && (
                                                    <div
                                                        style={{
                                                            width: `${
                                                                ((reportData.totalTasks - reportData.completedTasks - reportData.inProgressTasks - reportData.needsAttentionTasks) /
                                                                    reportData.totalTasks) *
                                                                100
                                                            }%`,
                                                        }}
                                                        className="bg-[var(--app-border)] transition-all"
                                                        title={`To Do: ${
                                                            reportData.totalTasks - reportData.completedTasks - reportData.inProgressTasks - reportData.needsAttentionTasks
                                                        } tasks`}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Legend */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--app-muted)]">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-[1px] bg-[#22863A] shrink-0" />
                                                <strong className="text-[var(--app-text)] font-semibold">{reportData.completedTasks}</strong> Done
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-[1px] bg-[#0284C7] shrink-0" />
                                                <strong className="text-[var(--app-text)] font-semibold">{reportData.inProgressTasks}</strong> In Progress
                                            </span>
                                            {reportData.needsAttentionTasks > 0 && (
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-[1px] bg-[#CB2431] shrink-0" />
                                                    <strong className="text-[var(--app-text)] font-semibold">{reportData.needsAttentionTasks}</strong> Needs Attention
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-[1px] bg-[var(--app-border)] shrink-0" />
                                                <strong className="text-[var(--app-text)] font-semibold">
                                                    {Math.max(0, reportData.totalTasks - reportData.completedTasks - reportData.inProgressTasks - reportData.needsAttentionTasks)}
                                                </strong> To Do
                                            </span>
                                        </div>

                                        <span className="text-[11px] text-[var(--app-muted)]">
                                            Total: <strong className="font-semibold text-[var(--app-text)]">{reportData.totalTasks}</strong> tasks
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Chronological Daily Activity Stream */}
                            <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 rounded-[2px] corner-brackets flex flex-col gap-3.5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {selectedMemberId !== "all" && (
                                            <button
                                                type="button"
                                                onClick={() => handleMemberSelect("all")}
                                                className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors cursor-pointer shrink-0 p-0.5"
                                                title="Back to All Team Overview"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                        )}
                                        <span className="eyebrow font-semibold">
                                            {selectedMemberId !== "all" && reportData?.selectedMember
                                                ? `${reportData.selectedMember.fullName}'s Daily Activity Log`
                                                : "Daily Activity Stream"}
                                        </span>
                                    </div>
                                    <span className="text-xs text-[var(--app-muted)]">
                                        {filteredDailyGroups.reduce((acc, g) => acc + g.tasks.length, 0)} tasks across {filteredDailyGroups.length} days
                                    </span>
                                </div>

                                {filteredDailyGroups.length === 0 ? (
                                    <div className="py-12 px-4 text-center text-[var(--app-muted)] flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--app-border)] rounded-[2px] bg-[var(--app-bg)]/40">
                                        <CheckCircle2 className="w-6 h-6 text-[var(--app-muted)]/50" />
                                        <span className="text-xs font-semibold text-[var(--app-text)]">No tasks found matching your criteria</span>
                                        <span className="text-[11px] text-[var(--app-muted)] max-w-sm">
                                            Try selecting a different date range, member, or status filter to view daily activity.
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {filteredDailyGroups.map((group) => (
                                            <div
                                                key={group.date}
                                                className="border border-[var(--app-border)] rounded-[2px] overflow-hidden flex flex-col bg-[var(--app-card)] shadow-2xs"
                                            >
                                                {/* Date Group Header */}
                                                <div className="bg-[var(--app-bg)] px-4 py-2 border-b border-[var(--app-border)] flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-[var(--app-text)]" />
                                                        <span className="font-heading text-[13px] font-bold text-[var(--app-text)]">
                                                            {formatHeaderDate(group.date, group.isToday, group.isYesterday)}
                                                        </span>
                                                    </div>

                                                    <div className="text-xs text-[var(--app-muted)]">
                                                        {group.tasks.filter((t) => t.isComplete).length} of {group.tasks.length} Completed
                                                    </div>
                                                </div>

                                                {/* Tasks List */}
                                                <div className="divide-y divide-[var(--app-border)]">
                                                    {group.tasks.map((task) => {
                                                        const isDone = task.isComplete;
                                                        const statusName = task.status.toLowerCase();
                                                        const isAttention = statusName.includes("attention") || statusName.includes("blocked");
                                                        const isInProgress = statusName.includes("progress") || statusName.includes("doing");

                                                        const statusColor = isDone
                                                            ? "bg-[#22863A]"
                                                            : isAttention
                                                            ? "bg-[#CB2431]"
                                                            : isInProgress
                                                            ? "bg-[#0284C7]"
                                                            : "bg-[var(--app-muted)]";

                                                        return (
                                                            <div
                                                                key={task.id}
                                                                onClick={() => setSelectedTaskId(task.id)}
                                                                className={`px-4 py-3 hover:bg-[var(--app-hover-bg)] transition-colors cursor-pointer flex flex-col gap-1.5 ${getPriorityBorder(
                                                                    task.priority,
                                                                )} ${isDone ? "opacity-70 hover:opacity-100" : ""}`}
                                                            >
                                                                <div className="flex items-start justify-between gap-4">
                                                                    {/* Member Name & Meta on Line 1 -> Task Title on Line 2 Below */}
                                                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                                        {/* Line 1: Member Name & Status */}
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="text-xs font-semibold text-[var(--app-text)]">
                                                                                {task.assignedTo ? task.assignedTo.fullName : "Unassigned"}
                                                                            </span>
                                                                            <span
                                                                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`}
                                                                                title={task.status}
                                                                            />
                                                                            <span className="text-[11px] text-[var(--app-muted)] font-medium">
                                                                                {task.status}
                                                                            </span>
                                                                            <span className="text-[10px] text-[var(--app-muted)] opacity-40">
                                                                                •
                                                                            </span>
                                                                            <span className={`text-[11px] font-semibold tracking-tight ${getPriorityTextColor(task.priority)}`}>
                                                                                {task.priority}
                                                                            </span>
                                                                        </div>

                                                                        {/* Line 2: Task Title (Below the Member Name) */}
                                                                        <h3
                                                                            className={`text-[13px] font-medium truncate ${
                                                                                isDone
                                                                                    ? "line-through text-[var(--app-muted)]"
                                                                                    : "text-[var(--app-text)] hover:underline"
                                                                            }`}
                                                                        >
                                                                            {task.title}
                                                                        </h3>
                                                                    </div>

                                                                    {/* Right: Subtasks, Carried info */}
                                                                    <div className="flex items-center gap-3 shrink-0 text-xs pt-1">
                                                                        {task.checklistStats && task.checklistStats.total > 0 && (
                                                                            <span className="text-xs text-[var(--app-muted)] flex items-center gap-1">
                                                                                <CheckSquare className="w-3.5 h-3.5" />
                                                                                {task.checklistStats.completed}/{task.checklistStats.total}
                                                                            </span>
                                                                        )}

                                                                        {task.carryCount > 0 && (
                                                                            <span className="text-xs font-medium text-[#B08800]">
                                                                                {task.carryCount}d carried
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Latest Comment Snippet (if available) */}
                                                                {task.latestComment && (
                                                                    <div className="flex items-center gap-2 text-[11px] text-[var(--app-muted)] pt-0.5">
                                                                        <MessageSquare className="w-3 h-3 shrink-0 text-[var(--app-muted)]" />
                                                                        <span className="italic truncate">
                                                                            <strong className="not-italic text-[var(--app-text)] font-medium">
                                                                                {task.latestComment.user.fullName}:
                                                                            </strong>{" "}
                                                                            "{task.latestComment.content}"
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
