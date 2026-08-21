"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { CustomSelect } from "../ui/CustomSelect";

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
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <div
                className="relative bg-[var(--app-card)] border border-[var(--app-border-strong)] p-5 flex flex-col gap-4 rounded-[4px] shadow-lg max-w-[400px] w-full animate-scale-up"
            >
                {/* Header */}
                <div className="flex justify-between items-center pb-2 border-b border-[var(--app-border)]">
                    <h3 className="font-heading text-base text-[var(--app-text)]">
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
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">Description</label>
                        <textarea
                            placeholder="Short summary of the project goals..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`${inputClass} min-h-[60px] resize-y`}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">Destination Folder *</label>
                        <CustomSelect
                            options={folders.map(f => ({ value: f.id, label: (f.emoji || "📁") + "  " + f.name }))}
                            value={folderId}
                            onChange={(val) => setFolderId(val)}
                            className="w-full"
                        />
                    </div>



                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">Start Date *</label>
                            <CustomDatePicker
                                value={startDate}
                                onChange={(val) => setStartDate(val)}
                                className="w-full"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="eyebrow">End Date *</label>
                            <CustomDatePicker
                                value={endDate}
                                onChange={(val) => setEndDate(val)}
                                className="w-full"
                            />
                        </div>
                    </div>

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
            </div>
        </div>
    );
}
