import React, { useState, useEffect } from "react";
import { api, ReportData } from "../api";
import { CustomSelect } from "./ui/CustomSelect";
import { Button } from "./ui/Button";

interface ReportViewProps {
    currentTeam: { id: string; name: string };
}

export default function ReportView({ currentTeam }: ReportViewProps) {
    const [rangePreset, setRangePreset] = useState<string>("30");
    const [customStart, setCustomStart] = useState<string>("");
    const [customEnd, setCustomEnd] = useState<string>("");
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const params: any = { teamId: currentTeam.id };

            if (rangePreset !== "custom") {
                params.daysFromToday = parseInt(rangePreset);
            } else if (customStart && customEnd) {
                params.startDate = customStart;
                params.endDate = customEnd;
            }

            const data = await api.getReports(params);
            setReportData(data);
        } catch (err: any) {
            alert("Error fetching report: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [currentTeam.id, rangePreset]);

    const handleCustomRangeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReport();
    };

    const handleExportCSV = async () => {
        try {
            const params: any = { teamId: currentTeam.id };
            if (rangePreset !== "custom") {
                params.daysFromToday = parseInt(rangePreset);
            } else if (customStart && customEnd) {
                params.startDate = customStart;
                params.endDate = customEnd;
            }
            await api.exportCsv(params);
        } catch (err: any) {
            alert("Error exporting CSV: " + err.message);
        }
    };

    const handlePrintPDF = () => {
        window.print();
    };

    return (
        <div className="flex-1 overflow-y-auto p-5 bg-[#FAFAF9] text-[#1A1A1A] flex flex-col gap-4 select-none print:bg-white print:text-black print:p-0">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
                <div>
                    <h1 className="font-heading text-xl">
                        Performance Reports
                    </h1>
                    <p className="text-base text-[#888883] mt-0.5">
                        Completion ratios, time tracking, and overdue analysis.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={handleExportCSV} variant="secondary">
                        Export CSV
                    </Button>
                    <Button onClick={handlePrintPDF} variant="default">
                        Print / PDF
                    </Button>
                </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white border border-[#E5E5E3] p-3.5 flex flex-col gap-3 print:hidden">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">Period</label>
                        <CustomSelect
                            options={[
                                { value: "7", label: "Last 7 Days" },
                                { value: "14", label: "Last 14 Days" },
                                { value: "30", label: "Last 30 Days" },
                                { value: "90", label: "Last 90 Days" },
                                { value: "custom", label: "Custom Range" },
                            ]}
                            value={rangePreset}
                            onChange={(val) => setRangePreset(val)}
                            className="w-40"
                        />
                    </div>

                    {rangePreset === "custom" && (
                        <form
                            onSubmit={handleCustomRangeSubmit}
                            className="flex flex-wrap items-end gap-2 animate-fade-in"
                        >
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Start</label>
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) =>
                                        setCustomStart(e.target.value)
                                    }
                                    className="bg-white border border-[#E5E5E3] rounded-[3px] px-2.5 py-1.5 text-base text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">End</label>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) =>
                                        setCustomEnd(e.target.value)
                                    }
                                    className="bg-white border border-[#E5E5E3] rounded-[3px] px-2.5 py-1.5 text-base text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                                    required
                                />
                            </div>
                            <Button
                                 type="submit"
                                 size="sm"
                            >
                                 Apply
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            {isLoading && (
                <div className="text-center py-16 text-[#888883] text-base">
                    Loading report…
                </div>
            )}

            {/* Report Content */}
            {reportData && !isLoading && (
                <div className="flex flex-col gap-4 print:gap-3">
                    {/* PDF Header */}
                    <div className="hidden print:block border-b-2 border-[#DADAD6] pb-3 mb-3">
                        <h1 className="text-xl font-bold">
                            {currentTeam.name} Performance Report
                        </h1>
                        <p className="text-[11px] text-[#888883] mt-1">
                            Generated on {new Date().toLocaleDateString()} |
                            Period:{" "}
                            {new Date(
                                reportData.startDate,
                            ).toLocaleDateString()}{" "}
                            to{" "}
                            {new Date(reportData.endDate).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Merged Unified Container (Top Metrics + Bottom Audit Trail) */}
                    <div className="relative border border-[#E5E5E3] bg-white corner-brackets flex flex-col">
                        {/* Top Metric Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#E5E5E3] print:border-[#DADAD6]">
                            <div className="bg-white p-4 flex flex-col gap-1 print:bg-white">
                                <span className="eyebrow">Completion Rate</span>
                                <span className="text-2xl font-heading text-[#1A1A1A] print:text-black">
                                    {reportData.completionRate}%
                                </span>
                                <span className="text-base text-[#888883]">
                                    {reportData.completedTasks} /{" "}
                                    {reportData.totalTasks} tasks
                                </span>
                            </div>

                            <div className="bg-white p-4 flex flex-col gap-1">
                                <span className="eyebrow">Avg Time-to-Done</span>
                                <span className="text-2xl font-heading text-[#1A1A1A]">
                                    {reportData.averageTimeToDone}h
                                </span>
                                <span className="text-base text-[#888883]">
                                    average completion duration
                                </span>
                            </div>

                            <div className="bg-white p-4 flex flex-col gap-1">
                                <span className="eyebrow text-[#CB2431]">
                                    Overdue
                                </span>
                                <span
                                    className={`text-2xl font-heading ${reportData.overdueCount > 0 ? "text-[#CB2431]" : "text-[#888883]"}`}
                                >
                                    {reportData.overdueCount}
                                </span>
                                <span className="text-base text-[#888883]">
                                    past due date
                                </span>
                            </div>

                            <div className="bg-white p-4 flex flex-col gap-1">
                                <span className="eyebrow text-[#B08800]">
                                    Stale Tasks
                                </span>
                                <span
                                    className={`text-2xl font-heading ${reportData.staleTasksCount > 0 ? "text-[#B08800]" : "text-[#888883]"}`}
                                >
                                    {reportData.staleTasksCount}
                                </span>
                                <span className="text-base text-[#888883]">
                                    carried 3+ days
                                </span>
                            </div>
                        </div>

                        {/* Section Intersection Divider */}
                        <div className="relative w-full border-t border-[#E5E5E3]">
                            <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 0V10M5 5H10" stroke="#1A1A1A" strokeWidth="1.5" />
                                </svg>
                            </div>
                            <div className="absolute -right-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 0V10M5 5H0" stroke="#1A1A1A" strokeWidth="1.5" />
                                </svg>
                            </div>
                        </div>

                        {/* Status Breakdown Section (Constant & Dynamic Kanban Columns) */}
                        <div className="bg-white p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold print:text-base print:font-bold">
                                    ▪ Column & Status Breakdown
                                </h3>
                                <span className="text-xs text-[#888883]">
                                    Total: {reportData.totalTasks} tasks
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                {reportData.columnsBreakdown &&
                                    Object.entries(reportData.columnsBreakdown).map(([columnName, count]) => {
                                        const lowerName = columnName.toLowerCase().trim();
                                        
                                        let cardClass = "card-default";
                                        if (lowerName.includes("todo") || lowerName.includes("to do")) {
                                            cardClass = "card-todo";
                                        } else if (lowerName.includes("progress")) {
                                            cardClass = "card-progress";
                                        } else if (lowerName.includes("attention")) {
                                            cardClass = "card-attention";
                                        } else if (lowerName.includes("done") || lowerName.includes("complete")) {
                                            cardClass = "card-done";
                                        } else if (lowerName.includes("blocked") || lowerName.includes("cancel")) {
                                            cardClass = "card-blocked";
                                        }

                                        const percentage = reportData.totalTasks > 0 
                                            ? Math.round((count / reportData.totalTasks) * 100) 
                                            : 0;

                                        return (
                                            <div
                                                key={columnName}
                                                className={`p-2.5 rounded-[2px] border ${cardClass} flex flex-col justify-between gap-2.5`}
                                            >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="w-1.5 h-1.5 rounded-[0.5px] card-dot shrink-0" />
                                                    <span className="text-[11px] font-semibold truncate card-label">
                                                        {columnName}
                                                    </span>
                                                </div>

                                                <div className="flex items-baseline justify-between mt-auto">
                                                    <span className="text-2xl font-heading card-value">
                                                        {count}
                                                    </span>
                                                    <span className="text-[10px] text-[#888883] font-medium">
                                                        {percentage}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Section Intersection Divider with T-Shaped Corner Brackets */}
                        <div className="relative w-full border-t border-[#E5E5E3]">
                            {/* Left T-Bracket Intersection (├) */}
                            <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 0V10M5 5H10" stroke="#1A1A1A" strokeWidth="1.5" />
                                </svg>
                            </div>

                            {/* Right T-Bracket Intersection (┤) */}
                            <div className="absolute -right-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 0V10M5 5H0" stroke="#1A1A1A" strokeWidth="1.5" />
                                </svg>
                            </div>
                        </div>

                        {/* Bottom Tasks Audit Trail Section */}
                        <div className="bg-white p-4 flex flex-col gap-3 print:p-0">
                            <h3 className="text-base font-semibold print:text-base print:font-bold">
                                ▪ Tasks Audit Trail
                            </h3>

                            <div className="overflow-x-auto print:overflow-visible">
                                <table className="w-full text-left text-[11px] border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#E5E5E3] text-[9px] font-medium text-[#888883] capitalize   print:border-[#DADAD6] print:text-[#555]">
                                            <th className="py-2 px-2.5">Title</th>
                                            <th className="py-2 px-2.5 text-center">
                                                Status
                                            </th>
                                            <th className="py-2 px-2.5 text-center">
                                                Priority
                                            </th>
                                            <th className="py-2 px-2.5 text-right">
                                                Date
                                            </th>
                                            <th className="py-2 px-2.5 text-right">
                                                Due
                                            </th>
                                            <th className="py-2 px-2.5 text-center">
                                                Carry
                                            </th>
                                            <th className="py-2 px-2.5 text-right">
                                                Est
                                            </th>
                                            <th className="py-2 px-2.5 text-right">
                                                Act
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E5E3] print:divide-[#eee]">
                                        {reportData.tasks.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="hover:bg-[#FAFAF9] print:hover:bg-transparent"
                                            >
                                                <td className="py-2 px-2.5 font-medium text-[#1A1A1A] print:text-black">
                                                    {t.title}
                                                </td>
                                                <td className="py-2 px-2.5 text-center">
                                                    <span className="border border-[#E5E5E3] px-1.5 py-0.5 rounded-[2px] text-[9px] print:border-[#ddd]">
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-2.5 text-center font-medium tabular-nums">
                                                    {t.priority}
                                                </td>
                                                <td className="py-2 px-2.5 text-right text-[#888883] tabular-nums">
                                                    {t.date}
                                                </td>
                                                <td className="py-2 px-2.5 text-right text-[#888883] tabular-nums">
                                                    {t.dueDate || "—"}
                                                </td>
                                                <td className="py-2 px-2.5 text-center font-medium tabular-nums">
                                                    {t.carryCount}
                                                </td>
                                                <td className="py-2 px-2.5 text-right tabular-nums">
                                                    {t.estimatedTime}
                                                </td>
                                                <td className="py-2 px-2.5 text-right tabular-nums">
                                                    {t.actualTime}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
