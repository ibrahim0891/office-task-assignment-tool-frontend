"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Calendar, Clock, Edit3, X } from "lucide-react";
import { api } from "../../api";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { EmojiPicker } from "../ui/EmojiPicker";
import { Button } from "../ui/Button";
import SideSheetWrapper from "../ui/SideSheetWrapper";
import { TipTapEditor } from "../ui/TipTapEditor";
import { extractDateString, calculateDaySpan, formatDaySpan } from "../../utils/date";

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
    const lastProjectRef = React.useRef(project);
    if (project) {
        lastProjectRef.current = project;
    }
    const currentProject = project || lastProjectRef.current;

    const [title, setTitle] = useState("");
    const [emoji, setEmoji] = useState("📁");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentProject && isOpen) {
            setTitle(currentProject.title || currentProject.name || "");
            setEmoji(currentProject.emoji || "📁");
            setDescription(currentProject.description || "");
            setStartDate(extractDateString(currentProject.startDate) || "");
            setEndDate(extractDateString(currentProject.endDate) || "");
        }
    }, [currentProject, isOpen]);

    if (!currentProject) return null;

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
            await api.updateProject(currentProject.id, {
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
        <SideSheetWrapper
            isOpen={isOpen}
            onClose={onClose}
            width="md"
            className="flex flex-col h-full bg-[var(--app-card)] border-l border-[var(--app-border)] text-left select-none text-[var(--app-text)]"
        >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[var(--app-border)] bg-[var(--app-card)] shrink-0">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                        <h2 className="font-heading text-base font-bold text-[var(--app-text)] tracking-tight">
                            Edit Project Configuration
                        </h2>
                    </div>
                    <p className="text-[11px] text-[var(--app-muted)] leading-tight">
                        Update project title, scope description, and timeline schedule.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] w-7 h-7 rounded-[3px] flex items-center justify-center transition-colors cursor-pointer"
                    title="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* ── Scrollable Form Body ── */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4.5 custom-scrollbar">
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
                                buttonClassName="w-[38px] h-[38px] text-base shrink-0 border border-[var(--app-border)] hover:border-[var(--color-accent)] bg-[var(--app-card)] rounded-[3px] flex items-center justify-center cursor-pointer"
                            />
                            <input
                                type="text"
                                required
                                placeholder="e.g. Q3 Security Hardening"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isSubmitting}
                                className="flex-1 bg-[var(--app-bg)] border border-[var(--app-border)] focus:border-[var(--color-accent)] px-3 py-2 rounded-[3px] text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none transition-colors h-[38px]"
                            />
                        </div>
                    </div>

                    {/* Description & Scope with TipTap Editor */}
                    <div className="flex flex-col gap-1.5">
                        <label className="eyebrow">Description & Scope</label>
                        <div className="border border-[var(--app-border)] rounded-[3px] overflow-hidden bg-[var(--app-bg)] focus-within:border-[var(--color-accent)] transition-colors">
                            <TipTapEditor
                                value={description}
                                onChange={setDescription}
                                disabled={isSubmitting}
                                className="min-h-[140px]"
                            />
                        </div>
                    </div>

                    {/* Timeline Schedule Dates */}
                    <div className="flex flex-col gap-1.5 p-3.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px]">
                        <div className="flex items-center justify-between">
                            <label className="eyebrow flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                <span>Timeline Schedule</span>
                            </label>
                            {startDate && endDate && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--app-text)] bg-[var(--app-card)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] tabular-nums">
                                    <Clock className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>{formatDaySpan(calculateDaySpan(startDate, endDate))}</span>
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-[var(--app-muted)]">Start Date</span>
                                <CustomDatePicker
                                    value={startDate}
                                    onChange={(val) => {
                                        setStartDate(val);
                                        if (endDate && val > endDate) {
                                            setEndDate(val);
                                        }
                                    }}
                                    maxDate={endDate || undefined}
                                    disabled={isSubmitting}
                                    placeholder="Select start date..."
                                    className="w-full"
                                    buttonClassName="h-[36px] text-xs px-3"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-[var(--app-muted)]">Target End Date</span>
                                <CustomDatePicker
                                    value={endDate}
                                    onChange={(val) => {
                                        setEndDate(val);
                                        if (startDate && val < startDate) {
                                            setStartDate(val);
                                        }
                                    }}
                                    disabled={isSubmitting}
                                    placeholder="Select end date..."
                                    minDate={startDate || undefined}
                                    className="w-full"
                                    buttonClassName="h-[36px] text-xs px-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Sticky Bottom Footer ── */}
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-[var(--app-border)] bg-[var(--app-card)] shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting || !title.trim()}
                        isLoading={isSubmitting}
                        loadingText="Saving..."
                    >
                        Save Changes
                    </Button>
                </div>
            </form>
        </SideSheetWrapper>
    );
}
