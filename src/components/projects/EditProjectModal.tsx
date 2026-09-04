"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Calendar } from "lucide-react";
import { api } from "../../api";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { EmojiPicker } from "../ui/EmojiPicker";
import { Button } from "../ui/Button";
import { extractDateString } from "../../utils/date";

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    onSaved?: () => void;
}

export default function EditProjectModal({
    isOpen,
    onClose,
    project,
    onSaved,
}: EditProjectModalProps) {
    const [title, setTitle] = useState("");
    const [emoji, setEmoji] = useState("📁");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (project && isOpen) {
            setTitle(project.title || project.name || "");
            setEmoji(project.emoji || "📁");
            setDescription(project.description || "");
            setStartDate(extractDateString(project.startDate) || "");
            setEndDate(extractDateString(project.endDate) || "");
        }
    }, [project, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Project title is required.");
            return;
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end < start) {
                toast.error("End Date cannot be before Start Date.");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await api.updateProject(project.id, {
                title: title.trim(),
                name: title.trim(),
                emoji,
                description: description.trim(),
                startDate: startDate || null,
                endDate: endDate || null,
            });
            toast.success("Project updated successfully.");
            onClose();
            if (onSaved) onSaved();
        } catch (err: any) {
            toast.error(err.message || "Failed to update project.");
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
                className="relative bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] p-5 w-full max-w-md flex flex-col gap-4 animate-fade-in text-left rounded-[3px] corner-brackets shadow-xl"
                style={{ boxShadow: "var(--shadow-float)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-1">
                    <h2 className="font-heading text-base text-[var(--app-text,#1A1A1A)]">
                        Edit Project Configuration
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)] text-[15px] font-bold px-1 transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Section Divider */}
                <div className="w-full border-t border-[var(--app-border,#E5E5E3)]" />

                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    {/* Project Title & Icon */}
                    <div className="flex flex-col gap-1.5">
                        <label className="eyebrow">
                            Project Title <span className="text-[var(--color-error)]">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <EmojiPicker
                                value={emoji}
                                onChange={setEmoji}
                                disabled={isSubmitting}
                                buttonClassName="w-[36px] h-[36px] text-base shrink-0 corner-brackets-4"
                            />
                            <input
                                type="text"
                                required
                                placeholder="e.g. Q3 Security Hardening"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isSubmitting}
                                className="flex-1 bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] px-3 py-1.5 rounded-[2px] text-xs text-[var(--app-text,#1A1A1A)] placeholder-[var(--app-muted,#888883)] focus:outline-none focus:border-[var(--color-accent,#1A1A1A)] transition-colors h-[36px]"
                            />
                        </div>
                    </div>

                    {/* Description & Scope */}
                    <div className="flex flex-col gap-1.5">
                        <label className="eyebrow">Description & Scope</label>
                        <textarea
                            rows={3}
                            placeholder="Add context, project goals, and high-level milestones..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] px-3 py-2 rounded-[2px] text-xs text-[var(--app-text,#1A1A1A)] placeholder-[var(--app-muted,#888883)] focus:outline-none focus:border-[var(--color-accent,#1A1A1A)] transition-colors resize-none leading-relaxed"
                        />
                    </div>

                    {/* Timeline Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="eyebrow flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                <span>Start Date</span>
                            </label>
                            <CustomDatePicker
                                value={startDate}
                                onChange={setStartDate}
                                disabled={isSubmitting}
                                placeholder="Select start date..."
                                className="w-full"
                                buttonClassName="h-[36px] text-xs px-3"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="eyebrow flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                <span>Target End Date</span>
                            </label>
                            <CustomDatePicker
                                value={endDate}
                                onChange={setEndDate}
                                disabled={isSubmitting}
                                placeholder="Select end date..."
                                minDate={startDate}
                                className="w-full"
                                buttonClassName="h-[36px] text-xs px-3"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-[var(--app-border,#E5E5E3)] mt-1">
                        <Button
                            type="button"
                            variant="secondary"
                            className="text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)]"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !title.trim()}
                            isLoading={isSubmitting}
                            loadingText="Saving..."
                            showDot={!isSubmitting}
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
