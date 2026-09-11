"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Clock, Calendar, Plus, Check, ChevronDown, FolderPlus, X } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { CustomSelect } from "../ui/CustomSelect";
import { EmojiPicker } from "../ui/EmojiPicker";
import { Button } from "../ui/Button";
import SideSheetWrapper from "../ui/SideSheetWrapper";
import { TipTapEditor } from "../ui/TipTapEditor";
import { calculateDaySpan, formatDaySpan } from "../../utils/date";

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
    const { handleCreateProject, folders, handleCreateFolder } = useWorkspace();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [folderId, setFolderId] = useState("");
    const [emoji, setEmoji] = useState("📁");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Direct inline folder creation state
    const [isInlineCreatingFolder, setIsInlineCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderEmoji, setNewFolderEmoji] = useState("📁");
    const [isCreatingFolderLoading, setIsCreatingFolderLoading] = useState(false);

    const handleQuickCreateFolder = async (closeDropdown: () => void) => {
        const trimmedName = newFolderName.trim();
        if (!trimmedName || isCreatingFolderLoading) return;
        setIsCreatingFolderLoading(true);
        try {
            const created = await handleCreateFolder(trimmedName, newFolderEmoji);
            if (created && created.id) {
                setFolderId(created.id);
            }
            setIsInlineCreatingFolder(false);
            setNewFolderName("");
            closeDropdown();
        } catch (err: any) {
            console.error("Quick create folder error:", err);
        } finally {
            setIsCreatingFolderLoading(false);
        }
    };

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
                        <FolderPlus className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                        <h2 className="font-heading text-base font-bold text-[var(--app-text)] tracking-tight">
                            Create New Project
                        </h2>
                    </div>
                    <p className="text-[11px] text-[var(--app-muted)] leading-tight">
                        Initialize a project milestone, timeline dates, and folder category.
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
                    {/* Project Title & Emoji */}
                    <div className="flex flex-col gap-1.5">
                        <label className="eyebrow">
                            Project Title <span className="text-[var(--color-error)]">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <EmojiPicker
                                value={emoji}
                                onChange={(val) => setEmoji(val)}
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

                    {/* Folder / Category Selector */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="eyebrow">Folder Category</label>
                            <button
                                type="button"
                                onClick={() => setIsInlineCreatingFolder(true)}
                                className="text-[10px] text-[var(--color-accent)] hover:underline font-medium cursor-pointer"
                            >
                                + New Folder
                            </button>
                        </div>
                        <CustomSelect
                            options={folders.map((f) => ({
                                value: f.id,
                                label: (f.emoji || "📁") + "  " + f.name,
                            }))}
                            value={folderId}
                            onChange={(val) => setFolderId(val)}
                            className="w-full"
                            renderFooter={(closeDropdown) => (
                                <div className="p-1">
                                    {!isInlineCreatingFolder ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsInlineCreatingFolder(true);
                                            }}
                                            className="w-full px-2 py-1.5 text-[11px] font-medium text-[var(--color-accent)] hover:bg-[var(--app-hover-bg)] rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Create new folder</span>
                                        </button>
                                    ) : (
                                        <div
                                            className="p-1.5 flex flex-col gap-1.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs shrink-0 select-none">📁</span>
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    placeholder="Folder name..."
                                                    value={newFolderName}
                                                    onChange={(e) => setNewFolderName(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            await handleQuickCreateFolder(closeDropdown);
                                                        } else if (e.key === "Escape") {
                                                            e.preventDefault();
                                                            setIsInlineCreatingFolder(false);
                                                            setNewFolderName("");
                                                        }
                                                    }}
                                                    className="flex-1 min-w-0 bg-[var(--app-card)] border border-[var(--app-border)] focus:border-[var(--color-accent)] rounded-[2px] px-2 py-1 text-[11px] text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none"
                                                />
                                            </div>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsInlineCreatingFolder(false);
                                                        setNewFolderName("");
                                                    }}
                                                    className="px-2 py-0.5 text-[10px] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[1px] hover:bg-[var(--app-hover-bg)] transition-colors cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={!newFolderName.trim() || isCreatingFolderLoading}
                                                    onClick={() => handleQuickCreateFolder(closeDropdown)}
                                                    className="px-2.5 py-0.5 text-[10px] font-medium bg-[var(--app-card)] border border-[var(--app-border-strong)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] rounded-[1px] transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                                >
                                                    {isCreatingFolderLoading ? (
                                                        <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0" />
                                                    ) : (
                                                        <Check className="w-2.5 h-2.5 shrink-0" />
                                                    )}
                                                    <span>Create</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    {/* Timeline Dates */}
                    <div className="flex flex-col gap-1.5 p-3.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px]">
                        <div className="flex items-center justify-between">
                            <label className="eyebrow flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                <span>Timeline Schedule <span className="text-[var(--color-error)]">*</span></span>
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
                                    maxDate={endDate || undefined}
                                    align="left"
                                    onChange={(val) => {
                                        setStartDate(val);
                                        if (endDate && val > endDate) {
                                            setEndDate(val);
                                        }
                                    }}
                                    className="w-full"
                                    buttonClassName="h-[36px] text-xs px-3"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-[var(--app-muted)]">Target End Date</span>
                                <CustomDatePicker
                                    value={endDate}
                                    minDate={startDate || undefined}
                                    align="right"
                                    onChange={(val) => {
                                        setEndDate(val);
                                        if (startDate && val < startDate) {
                                            setStartDate(val);
                                        }
                                    }}
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
                        disabled={isSubmitting || !title.trim() || !startDate || !endDate}
                        isLoading={isSubmitting}
                        loadingText="Creating..."
                        showDot={!isSubmitting}
                    >
                        Create Project
                    </Button>
                </div>
            </form>
        </SideSheetWrapper>
    );
}
