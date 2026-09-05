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
import toast from "react-hot-toast";
import {
    Globe,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Search,
    CheckCircle2,
    Clock,
    AlertTriangle,
    CheckSquare,
    Copy,
    Download,
    Printer,
    User as UserIcon,
    Flame,
    ArrowRight,
    MessageSquare,
    Filter,
} from "lucide-react";
import { getLocalDateString } from "../utils/date";

function PersonAvatar({
    src,
    alt,
    className = "w-14 h-14",
    ringClass = "",
    iconClass = "",
}: {
    src?: string | null;
    alt: string;
    className?: string;
    ringClass?: string;
    iconClass?: string;
}) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [src]);

    return (
        <div
            className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[var(--app-hover-bg)] ${className} ${ringClass}`}
        >
            {src && !hasError ? (
                <img
                    src={src}
                    alt={alt}
                    onError={() => setHasError(true)}
                    className="w-full h-full object-cover rounded-full"
                />
            ) : (
                <svg
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-full h-full text-[var(--app-muted)] ${iconClass}`}
                >
                    <rect width="48" height="48" rx="24" fill="var(--app-border)" />
                    <circle cx="24" cy="18" r="7" fill="var(--app-muted)" />
                    <path
                        d="M10 41c0-6.627 6.268-12 14-12s14 5.373 14 12"
                        fill="var(--app-muted)"
                    />
                </svg>
            )}
        </div>
    );
}

interface ReportViewProps {
    currentTeam: { id: string; name: string };
}

export default function ReportView({ currentTeam }: ReportViewProps) {
    const { setSelectedTaskId } = useWorkspace();

    // Filters
    const [selectedMemberId, setSelectedMemberId] = useState<string>("all");
    const [rangePreset, setRangePreset] = useState<string>("7"); // '0'=today, '1'=yesterday, '7', '14', '30', 'custom'
    const [customStart, setCustomStart] = useState<string>("");
    const [customEnd, setCustomEnd] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in_progress" | "attention">("all");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // State
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const bubbleScrollRef = useRef<HTMLDivElement>(null);

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
        fetchReport();
    }, [currentTeam.id, rangePreset, selectedMemberId]);

    const handleCustomRangeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customStart || !customEnd) {
            toast.error("Please select both start and end dates");
            return;
        }
        fetchReport();
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
        if (isToday) return `Today • ${dateStr}`;
        if (isYesterday) return `Yesterday • ${dateStr}`;
        try {
            const [y, m, d] = dateStr.split("-").map(Number);
            const dateObj = new Date(Date.UTC(y, m - 1, d));
            return dateObj.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-5 bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col gap-4 select-none print:bg-white print:text-black print:p-0">
            {/* ─── 1. Header ─── */}
            <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
                <div>
                    <h1 className="font-heading text-xl text-[var(--app-text)]">
                        Performance & Daily Reports
                    </h1>
                    <p className="text-base text-[var(--app-muted)] mt-0.5">
                        Member daily activity tracking, completion status, and carry-over analysis.
                    </p>
                </div>

                <div className="flex items-center gap-2">
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

            {/* ─── 2. Controls & Member Selector Panel ─── */}
            <div className="relative bg-[var(--app-card)] border border-[var(--app-border)] p-4 flex flex-col gap-4 rounded-[2px] corner-brackets print:hidden shadow-xs">
                
                {/* Messenger-Style Member Bubble Selector */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="eyebrow flex items-center gap-1.5">
                            <UserIcon className="w-3 h-3" /> Team Member
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[var(--app-muted)]">
                                {reportData?.memberBreakdown?.length || 0} members in {currentTeam.name}
                            </span>
                            <div className="flex items-center gap-0.5">
                                <button
                                    type="button"
                                    onClick={() => bubbleScrollRef.current?.scrollBy({ left: -160, behavior: "smooth" })}
                                    className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] rounded-[2px] transition-colors cursor-pointer"
                                    title="Scroll left"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => bubbleScrollRef.current?.scrollBy({ left: 160, behavior: "smooth" })}
                                    className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] rounded-[2px] transition-colors cursor-pointer"
                                    title="Scroll right"
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={bubbleScrollRef}
                        className="flex items-center gap-2.5 overflow-x-auto py-1.5 px-0.5 scrollbar-thin scrollbar-thumb-[var(--app-border)]"
                    >
                        {/* Bubble #1: All Team (Global) */}
                        <button
                            type="button"
                            onClick={() => setSelectedMemberId("all")}
                            className={`group flex flex-col items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-[4px] border transition-all cursor-pointer ${
                                selectedMemberId === "all"
                                    ? "bg-[var(--app-select-bg)] border-[var(--app-border)]"
                                    : "border-transparent hover:bg-[var(--app-hover-bg)] hover:border-[var(--app-border)]/40"
                            }`}
                            title="All Team Members (Global Overview)"
                        >
                            <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                    selectedMemberId === "all"
                                        ? "bg-[var(--app-card)] border border-[var(--app-border-strong)] text-[var(--app-text)] shadow-2xs"
                                        : "bg-[var(--app-card)] border border-[var(--app-border)] text-[var(--app-muted)] group-hover:text-[var(--app-text)] group-hover:border-[var(--app-border-strong)]"
                                }`}
                            >
                                <Globe className="w-5.5 h-5.5" />
                            </div>

                            <div className="flex flex-col items-center">
                                <span
                                    className={`text-xs leading-tight whitespace-nowrap ${
                                        selectedMemberId === "all"
                                            ? "font-bold text-[var(--app-text)]"
                                            : "font-medium text-[var(--app-muted)] group-hover:text-[var(--app-text)]"
                                    }`}
                                >
                                    All Team
                                </span>
                                <span className="text-[10px] text-[var(--app-muted)] tabular-nums mt-0.5">
                                    {reportData?.totalTasks !== undefined ? `${reportData.totalTasks} tasks` : "Global"}
                                </span>
                            </div>
                        </button>

                        {/* Individual Member Bubbles */}
                        {reportData?.memberBreakdown?.map((member) => {
                            const isSelected = selectedMemberId === member.user.id;
                            const firstName = member.user.fullName.split(" ")[0];

                            return (
                                <button
                                    key={member.user.id}
                                    type="button"
                                    onClick={() => setSelectedMemberId(member.user.id)}
                                    className={`group flex flex-col items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-[4px] border transition-all cursor-pointer ${
                                        isSelected
                                            ? "bg-[var(--app-select-bg)] border-[var(--app-border)]"
                                            : "border-transparent hover:bg-[var(--app-hover-bg)] hover:border-[var(--app-border)]/40"
                                    }`}
                                    title={`${member.user.fullName} (${member.user.designation || "Member"}) • ${member.completedTasks}/${member.totalTasks} completed`}
                                >
                                    <PersonAvatar
                                        src={member.user.avatarUrl}
                                        alt={member.user.fullName}
                                        className="w-14 h-14"
                                        ringClass={
                                            isSelected
                                                ? "border border-[var(--app-border-strong)] shadow-2xs"
                                                : "border border-[var(--app-border)] group-hover:border-[var(--app-border-strong)]"
                                        }
                                    />

                                    <div className="flex flex-col items-center">
                                        <span
                                            className={`text-xs leading-tight whitespace-nowrap max-w-[80px] truncate text-center ${
                                                isSelected
                                                    ? "font-bold text-[var(--app-text)]"
                                                    : "font-medium text-[var(--app-muted)] group-hover:text-[var(--app-text)]"
                                            }`}
                                        >
                                            {firstName}
                                        </span>
                                        <span className="text-[10px] text-[var(--app-muted)] tabular-nums mt-0.5">
                                            {member.completedTasks}/{member.totalTasks} done
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Period Tabs + Day Stepper + Status Filters + Search */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4.5 pb-1 border-t border-[var(--app-border)]">
                    {/* Period Tabs + Day Step */}
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { id: "0", label: "Today" },
                            { id: "1", label: "Yesterday" },
                            { id: "7", label: "7 Days" },
                            { id: "14", label: "14 Days" },
                            { id: "30", label: "30 Days" },
                            { id: "custom", label: "Custom" },
                        ].map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => setRangePreset(preset.id)}
                                className={`relative corner-brackets-4 px-3.5 py-2 text-xs font-medium border rounded-[2px] transition-colors cursor-pointer ${
                                    rangePreset === preset.id
                                        ? "bg-[var(--app-select-bg)] text-[var(--app-text)] border-[var(--app-border-strong)] font-semibold shadow-2xs"
                                        : "bg-[var(--app-card)] border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}

                        {/* Day Stepper */}
                        <div className="relative corner-brackets-4 flex items-center gap-1 border border-[var(--app-border)] rounded-[2px] px-2.5 py-1.5 bg-[var(--app-card)] text-xs">
                            <button
                                type="button"
                                onClick={() => handleStepDay(-1)}
                                className="p-0.5 hover:bg-[var(--app-hover-bg)] rounded-[1px] text-[var(--app-text)] transition-colors cursor-pointer"
                                title="Step 1 Day Backward"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10.5px] text-[var(--app-muted)] font-medium px-1.5">
                                Day Step
                            </span>
                            <button
                                type="button"
                                onClick={() => handleStepDay(1)}
                                className="p-0.5 hover:bg-[var(--app-hover-bg)] rounded-[1px] text-[var(--app-text)] transition-colors cursor-pointer"
                                title="Step 1 Day Forward"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Custom Date Inputs */}
                        {rangePreset === "custom" && (
                            <form onSubmit={handleCustomRangeSubmit} className="flex items-center gap-2 animate-fade-in text-xs ml-1">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-border-strong)]"
                                    required
                                />
                                <span className="text-[var(--app-muted)] text-xs font-medium">to</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] px-2.5 py-1.5 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-border-strong)]"
                                    required
                                />
                                <Button type="submit" size="sm" className="h-[32px] px-3.5 text-xs font-medium">
                                    Apply
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Status Filters & Search */}
                    <div className="flex flex-wrap items-center gap-2">
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
                                className={`relative corner-brackets-4 px-3.5 py-2 text-xs font-medium border rounded-[2px] transition-colors cursor-pointer ${
                                    statusFilter === st.id
                                        ? "bg-[var(--app-select-bg)] text-[var(--app-text)] border-[var(--app-border-strong)] font-semibold shadow-2xs"
                                        : "bg-[var(--app-card)] border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                }`}
                            >
                                {st.label}
                            </button>
                        ))}

                        {/* Search Input */}
                        <div className="relative min-w-[170px] ml-1">
                            <Search className="w-3.5 h-3.5 text-[var(--app-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search tasks…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-[34px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] pl-8 pr-3 text-xs text-[var(--app-text)] focus:outline-none focus:border-[var(--app-border-strong)]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-16 text-[var(--app-muted)] text-sm flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--app-text)] animate-ping" />
                    Loading report updates…
                </div>
            )}

            {/* ─── 3. Unified Performance Container ─── */}
            {reportData && !isLoading && (
                <div className="relative border border-[var(--app-border)] bg-[var(--app-card)] corner-brackets flex flex-col shadow-xs">
                    
                    {/* Header Snippet + Status Progression Ribbon */}
                    <div className="p-5 flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                {reportData.selectedMember ? (
                                    <>
                                        <PersonAvatar
                                            src={reportData.selectedMember.avatarUrl}
                                            alt={reportData.selectedMember.fullName}
                                            className="w-11 h-11 border border-[var(--app-border)]"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-heading text-base font-bold text-[var(--app-text)]">
                                                    {reportData.selectedMember.fullName}
                                                </h2>
                                                <span className="text-[10px] bg-[var(--app-bg)] border border-[var(--app-border)] px-2 py-0.5 rounded-[2px] text-[var(--app-muted)] font-medium">
                                                    {reportData.selectedMember.designation || "Team Member"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[var(--app-muted)] mt-0.5">
                                                {reportData.selectedMember.email}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-text)]">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="font-heading text-base font-bold text-[var(--app-text)]">
                                                All Team Members Overview
                                            </h2>
                                            <p className="text-xs text-[var(--app-muted)] mt-0.5">
                                                Showing consolidated updates across {reportData.memberBreakdown?.length || 0} members
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Summary Badges */}
                            <div className="flex items-center gap-3 flex-wrap text-xs">
                                <div className="border border-[var(--app-border)] rounded-[2px] px-3.5 py-1.5 bg-[var(--app-bg)] flex items-center gap-2 font-medium text-[var(--app-text)]">
                                    <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                                    <span>
                                        {reportData.completedTasks} of {reportData.totalTasks} Done ({reportData.completionRate}%)
                                    </span>
                                </div>

                                {reportData.staleTasksCount > 0 && (
                                    <div className="border border-[var(--color-error)]/30 text-[var(--color-error)] bg-[var(--color-error)]/5 rounded-[2px] px-3.5 py-1.5 flex items-center gap-2 font-medium">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        <span>{reportData.staleTasksCount} Carried (2+ days)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Progression Ribbon */}
                        <div className="flex flex-col gap-2.5 pt-2 pb-1">
                            <div className="h-3 w-full rounded-[2px] bg-[var(--app-bg)] border border-[var(--app-border)] flex overflow-hidden">
                                {reportData.totalTasks === 0 ? (
                                    <div className="w-full h-full bg-[var(--app-hover-bg)]" />
                                ) : (
                                    <>
                                        {reportData.completedTasks > 0 && (
                                            <div
                                                style={{ width: `${(reportData.completedTasks / reportData.totalTasks) * 100}%` }}
                                                className="bg-[var(--color-success)] transition-all"
                                                title={`Done: ${reportData.completedTasks} tasks (${Math.round((reportData.completedTasks / reportData.totalTasks) * 100)}%)`}
                                            />
                                        )}
                                        {reportData.inProgressTasks > 0 && (
                                            <div
                                                style={{ width: `${(reportData.inProgressTasks / reportData.totalTasks) * 100}%` }}
                                                className="bg-[#0284C7] transition-all"
                                                title={`In Progress: ${reportData.inProgressTasks} tasks (${Math.round((reportData.inProgressTasks / reportData.totalTasks) * 100)}%)`}
                                            />
                                        )}
                                        {reportData.needsAttentionTasks > 0 && (
                                            <div
                                                style={{ width: `${(reportData.needsAttentionTasks / reportData.totalTasks) * 100}%` }}
                                                className="bg-[var(--color-error)] transition-all"
                                                title={`Needs Attention: ${reportData.needsAttentionTasks} tasks (${Math.round((reportData.needsAttentionTasks / reportData.totalTasks) * 100)}%)`}
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
                                                className="bg-[var(--app-border-strong)] transition-all"
                                                title={`To Do: ${
                                                    reportData.totalTasks - reportData.completedTasks - reportData.inProgressTasks - reportData.needsAttentionTasks
                                                } tasks`}
                                            />
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Legend */}
                            {reportData.totalTasks === 0 ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--app-muted)] pt-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-[1px] bg-[var(--app-border)] shrink-0" />
                                        <span>No task activity recorded in this period</span>
                                    </div>
                                    <span className="font-medium text-[11.5px]">
                                        Period: {reportData.startDate} → {reportData.endDate}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--app-muted)] pt-0.5">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-[1px] bg-[var(--color-success)]" />
                                            <strong className="text-[var(--app-text)]">{reportData.completedTasks}</strong> Done
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-[1px] bg-[#0284C7]" />
                                            <strong className="text-[var(--app-text)]">{reportData.inProgressTasks}</strong> In Progress
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-[1px] bg-[var(--color-error)]" />
                                            <strong className="text-[var(--app-text)]">{reportData.needsAttentionTasks}</strong> Needs Attention
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-[1px] bg-[var(--app-border-strong)]" />
                                            <strong className="text-[var(--app-text)]">
                                                {Math.max(0, reportData.totalTasks - reportData.completedTasks - reportData.inProgressTasks - reportData.needsAttentionTasks)}
                                            </strong>{" "}
                                            To Do
                                        </span>
                                    </div>
                                    <span className="font-medium text-[11.5px]">
                                        Period: {reportData.startDate} → {reportData.endDate}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section Divider with Corner T-Brackets */}
                    <div className="relative w-full border-t border-[var(--app-border)]">
                        <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 0V10M5 5H10" stroke="var(--app-border-strong)" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <div className="absolute -right-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 0V10M5 5H0" stroke="var(--app-border-strong)" strokeWidth="1.5" />
                            </svg>
                        </div>
                    </div>

                    {/* Global View: Team Member Performance Matrix */}
                    {selectedMemberId === "all" && reportData?.memberBreakdown && reportData.memberBreakdown.length > 0 && (
                        <>
                            <div className="p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-[var(--app-text)]">
                                        ▪ Team Member Performance Matrix
                                    </h3>
                                    <span className="text-xs text-[var(--app-muted)]">
                                        Click any member to inspect individual daily log
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-[var(--app-border)] text-[9px] font-medium text-[var(--app-muted)] uppercase tracking-wider">
                                                <th className="py-2.5 px-3">Member</th>
                                                <th className="py-2.5 px-3">Role</th>
                                                <th className="py-2.5 px-3">Workload Distribution</th>
                                                <th className="py-2.5 px-3 text-center">Completed / Total</th>
                                                <th className="py-2.5 px-3 text-center">Completion</th>
                                                <th className="py-2.5 px-3 text-center">Carried</th>
                                                <th className="py-2.5 px-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--app-border)]">
                                            {reportData.memberBreakdown.map((mb) => (
                                                <tr
                                                    key={mb.user.id}
                                                    onClick={() => setSelectedMemberId(mb.user.id)}
                                                    className="hover:bg-[var(--app-hover-bg)] transition-colors cursor-pointer group"
                                                >
                                                    <td className="py-2.5 px-3">
                                                        <div className="flex items-center gap-2">
                                                            <PersonAvatar
                                                                src={mb.user.avatarUrl}
                                                                alt={mb.user.fullName}
                                                                className="w-6 h-6 border border-[var(--app-border)]"
                                                            />
                                                            <span className="font-medium text-[var(--app-text)] group-hover:underline">
                                                                {mb.user.fullName}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="py-2.5 px-3 text-[var(--app-muted)] text-[11px]">
                                                        {mb.user.designation || mb.role}
                                                    </td>

                                                    <td className="py-2.5 px-3 w-40">
                                                        <div className="h-2 w-full rounded-[1px] bg-[var(--app-bg)] border border-[var(--app-border)] flex overflow-hidden">
                                                            {mb.totalTasks > 0 ? (
                                                                <>
                                                                    <div
                                                                        style={{ width: `${(mb.completedTasks / mb.totalTasks) * 100}%` }}
                                                                        className="bg-[var(--color-success)]"
                                                                    />
                                                                    <div
                                                                        style={{ width: `${(mb.inProgressTasks / mb.totalTasks) * 100}%` }}
                                                                        className="bg-[#0284C7]"
                                                                    />
                                                                    <div
                                                                        style={{ width: `${(mb.needsAttentionTasks / mb.totalTasks) * 100}%` }}
                                                                        className="bg-[var(--color-error)]"
                                                                    />
                                                                </>
                                                            ) : (
                                                                <div className="w-full h-full bg-transparent" />
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="py-2.5 px-3 text-center font-medium tabular-nums text-[var(--app-text)]">
                                                        {mb.completedTasks} / {mb.totalTasks}
                                                    </td>

                                                    <td className="py-2.5 px-3 text-center font-medium tabular-nums">
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded-[2px] text-[10px] ${
                                                                mb.completionRate >= 80
                                                                    ? "text-[var(--color-success)] bg-[var(--color-success)]/10"
                                                                    : mb.completionRate >= 50
                                                                    ? "text-[#0284C7] bg-[#0284C7]/10"
                                                                    : "text-[var(--app-muted)] bg-[var(--app-bg)]"
                                                            }`}
                                                        >
                                                            {mb.completionRate}%
                                                        </span>
                                                    </td>

                                                    <td className="py-2.5 px-3 text-center font-medium tabular-nums">
                                                        {mb.staleTasksCount > 0 ? (
                                                            <span className="text-[var(--color-error)] font-bold bg-[var(--color-error)]/10 px-1.5 py-0.5 rounded-[2px] text-[10px]">
                                                                {mb.staleTasksCount}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[var(--app-muted)]">0</span>
                                                        )}
                                                    </td>

                                                    <td className="py-2.5 px-3 text-right">
                                                        <span className="text-[11px] font-medium text-[var(--app-text)] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                                            Daily Log <ArrowRight className="w-3 h-3" />
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Section Divider */}
                            <div className="relative w-full border-t border-[var(--app-border)]">
                                <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 0V10M5 5H10" stroke="var(--app-border-strong)" strokeWidth="1.5" />
                                    </svg>
                                </div>
                                <div className="absolute -right-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 0V10M5 5H0" stroke="var(--app-border-strong)" strokeWidth="1.5" />
                                    </svg>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Chronological Daily Activity Stream */}
                    <div className="p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-[var(--app-text)]">
                                ▪ Chronological Daily Activity Stream
                            </h3>
                            <span className="text-xs text-[var(--app-muted)]">
                                {filteredDailyGroups.reduce((acc, g) => acc + g.tasks.length, 0)} tasks across {filteredDailyGroups.length} days
                            </span>
                        </div>

                        {filteredDailyGroups.length === 0 ? (
                            <div className="py-16 px-6 text-center text-[var(--app-muted)] flex flex-col items-center justify-center gap-2.5 border border-dashed border-[var(--app-border)] rounded-[2px] bg-[var(--app-bg)]/30">
                                <CheckCircle2 className="w-8 h-8 text-[var(--app-muted)]/50" />
                                <span className="text-sm font-semibold text-[var(--app-text)]">No tasks found matching your criteria</span>
                                <span className="text-xs text-[var(--app-muted)] max-w-sm">
                                    Try selecting a different date range, member, or status filter to view daily activity.
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {filteredDailyGroups.map((group) => (
                                    <div
                                        key={group.date}
                                        className="border border-[var(--app-border)] rounded-[2px] overflow-hidden flex flex-col"
                                    >
                                        {/* Date Group Header */}
                                        <div className="bg-[var(--app-bg)] px-3.5 py-2 border-b border-[var(--app-border)] flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-[var(--app-text)]" />
                                                <span className="font-heading text-xs font-bold tracking-tight text-[var(--app-text)]">
                                                    {formatHeaderDate(group.date, group.isToday, group.isYesterday)}
                                                </span>
                                                {group.isToday && (
                                                    <span className="bg-[var(--color-accent)] text-[var(--app-card)] text-[9px] font-bold px-1.5 py-0.2 rounded-[1px] uppercase">
                                                        Today
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-xs text-[var(--app-muted)] tabular-nums font-medium">
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

                                                return (
                                                    <div
                                                        key={task.id}
                                                        onClick={() => setSelectedTaskId(task.id)}
                                                        className="px-3.5 py-2.5 hover:bg-[var(--app-hover-bg)] transition-colors cursor-pointer flex flex-col gap-1 group"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            {/* Priority + Status + Title */}
                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                <span
                                                                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] shrink-0 ${
                                                                        task.priority === "URGENT"
                                                                            ? "bg-[var(--priority-urgent)]/10 text-[var(--priority-urgent)] border border-[var(--priority-urgent)]/30"
                                                                            : task.priority === "HIGH"
                                                                            ? "bg-[var(--priority-high)]/10 text-[var(--priority-high)] border border-[var(--priority-high)]/30"
                                                                            : task.priority === "MEDIUM"
                                                                            ? "bg-[var(--priority-medium)]/10 text-[var(--priority-medium)] border border-[var(--priority-medium)]/30"
                                                                            : "bg-[var(--app-bg)] text-[var(--app-muted)] border border-[var(--app-border)]"
                                                                    }`}
                                                                >
                                                                    {task.priority}
                                                                </span>

                                                                <span
                                                                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-[2px] border shrink-0 ${
                                                                        isDone
                                                                            ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30"
                                                                            : isAttention
                                                                            ? "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/30"
                                                                            : isInProgress
                                                                            ? "bg-[#0284C7]/10 text-[#0284C7] border-[#0284C7]/30"
                                                                            : "bg-[var(--app-bg)] text-[var(--app-text)] border border-[var(--app-border)]"
                                                                    }`}
                                                                >
                                                                    {task.status}
                                                                </span>

                                                                <h4 className="text-xs font-medium text-[var(--app-text)] group-hover:underline truncate">
                                                                    {task.title}
                                                                </h4>
                                                            </div>

                                                            {/* Badges */}
                                                            <div className="flex items-center gap-2 shrink-0 text-xs">
                                                                {task.checklistStats && task.checklistStats.total > 0 && (
                                                                    <span
                                                                        className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-[2px] border ${
                                                                            task.checklistStats.completed === task.checklistStats.total
                                                                                ? "border-[var(--color-success)]/30 text-[var(--color-success)] bg-[var(--color-success)]/5 font-semibold"
                                                                                : "border-[var(--app-border)] text-[var(--app-muted)] bg-[var(--app-card)]"
                                                                        }`}
                                                                    >
                                                                        <CheckSquare className="w-3 h-3" />
                                                                        <span>
                                                                            {task.checklistStats.completed}/{task.checklistStats.total} subtasks
                                                                        </span>
                                                                    </span>
                                                                )}

                                                                {task.carryCount > 0 && (
                                                                    <span
                                                                        className={`flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-[2px] border ${
                                                                            task.carryCount >= 2
                                                                                ? "border-[var(--color-error)]/40 text-[var(--color-error)] bg-[var(--color-error)]/10"
                                                                                : "border-[var(--priority-high)]/40 text-[var(--priority-high)] bg-[var(--priority-high)]/10"
                                                                        }`}
                                                                    >
                                                                        <Flame className="w-3 h-3" />
                                                                        <span>Carried {task.carryCount}d</span>
                                                                    </span>
                                                                )}

                                                                {selectedMemberId === "all" && task.assignedTo && (
                                                                    <span className="flex items-center gap-1.5 text-[10px] text-[var(--app-muted)]">
                                                                        <PersonAvatar
                                                                            src={task.assignedTo.avatarUrl}
                                                                            alt={task.assignedTo.fullName}
                                                                            className="w-4.5 h-4.5 border border-[var(--app-border)]"
                                                                        />
                                                                        <span className="max-w-[70px] truncate text-[var(--app-text)]">{task.assignedTo.fullName}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Latest Comment Snippet */}
                                                        {task.latestComment && (
                                                            <div className="flex items-start gap-1.5 text-[11px] text-[var(--app-muted)] bg-[var(--app-bg)] border-l-2 border-[var(--app-border-strong)] pl-2 py-0.5 rounded-[1px] mt-0.5">
                                                                <MessageSquare className="w-3 h-3 text-[var(--app-muted)] shrink-0 mt-0.5" />
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
                </div>
            )}
        </div>
    );
}
