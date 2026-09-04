"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Clock, Calendar } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { CustomSelect } from "../ui/CustomSelect";
import ModalWrapper from "../ui/ModalWrapper";
import { calculateDaySpan, formatDaySpan } from "../../utils/date";

const inputClass =
    "px-2.5 py-1.5 border border-[#E5E5E3] focus:border-[#1A1A1A] focus:outline-none text-[11px] bg-white rounded-[3px] transition-colors w-full";

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EMOJI_OPTIONS = [
    { value: "📁", label: "📁 Folder" },
    { value: "🚀", label: "🚀 Rocket" },
    { value: "💻", label: "💻 Coding" },
    { value: "📊", label: "📊 Marketing" },
    { value: "🎨", label: "🎨 Design" },
    { value: "🔒", label: "🔒 Security" },
    { value: "⚙️", label: "⚙️ Tooling" },
    { value: "📣", label: "📣 Launch" },
    { value: "💡", label: "💡 Innovation" },
];

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
    const { handleCreateProject, folders } = useWorkspace();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [folderId, setFolderId] = useState("");
    const [emoji, setEmoji] = useState("📁");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (folders.length > 0 && !folderId) {
            setFolderId(folders[0].id);
        }
    }, [folders, folderId]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Project title is required.");
            return;
        }
        if (!startDate) {
            toast.error("Start Date is required.");
            return;
        }
        if (!endDate) {
            toast.error("End Date is required.");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            toast.error("End Date cannot be before Start Date.");
            return;
        }

        setIsSubmitting(true);
        try {
            await handleCreateProject({
                title: title.trim(),
                description: description.trim() || undefined,
                emoji,
                startDate,
                endDate,
                folderId,
            });
            onClose();
            setTitle("");
            setDescription("");
            setEmoji("📁");
            setStartDate("");
            setEndDate("");
        } catch (err: any) {
            console.error("Create project error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-[420px]"
            className="p-5 flex flex-col gap-4 text-left"
        >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-[var(--app-border)]">
                <h3 className="text-base font-semibold text-[var(--app-text)]">
                    New Project
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <label className="eyebrow">Project Title *</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Q3 Security Hardening"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={inputClass}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="eyebrow">Description</label>
                    <textarea
                        rows={2}
                        placeholder="Project overview & goals..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={`${inputClass} resize-none`}
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">Folder</label>
                        <CustomSelect
                            options={folders.map(f => ({ value: f.id, label: (f.emoji || "📁") + "  " + f.name }))}
                            value={folderId}
                            onChange={(val) => setFolderId(val)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">Emoji</label>
                        <CustomSelect
                            options={EMOJI_OPTIONS}
                            value={emoji}
                            onChange={(val) => setEmoji(val)}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <label className="eyebrow flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[var(--app-muted)]" />
                            <span>Timeline Dates *</span>
                        </label>
                        {startDate && endDate && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--app-text)] bg-[var(--app-bg)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] tabular-nums">
                                <Clock className="w-3 h-3 text-[var(--app-muted)]" />
                                <span>{formatDaySpan(calculateDaySpan(startDate, endDate))}</span>
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-[var(--app-muted)]">Start Date</span>
                            <CustomDatePicker
                                value={startDate}
                                onChange={(val) => setStartDate(val)}
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-[var(--app-muted)]">End Date</span>
                            <CustomDatePicker
                                value={endDate}
                                onChange={(val) => setEndDate(val)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--app-border)]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="relative corner-brackets-4 px-3.5 py-1.5 border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[11px] font-medium text-[var(--app-muted)] rounded-[2px] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="relative corner-brackets-4 px-4 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-medium text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-[var(--app-text)]" />
                        ) : (
                            <span className="w-1.5 h-1.5 bg-[var(--app-text)] rounded-[0.5px] inline-block" />
                        )}
                        <span>
                            {isSubmitting ? "Creating..." : "Create Project"}
                        </span>
                    </button>
                </div>
            </form>
        </ModalWrapper>
    );
}
