"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Edit3, X, Users, Sparkles } from "lucide-react";
import ModalWrapper from "@/components/ui/ModalWrapper";
import { Button } from "@/components/ui/Button";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { api, Team, User } from "@/api";

interface EditTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTeam: Team;
    currentUser: User;
    onTeamUpdated: () => Promise<void>;
}

export function EditTeamModal({
    isOpen,
    onClose,
    currentTeam,
    currentUser,
    onTeamUpdated,
}: EditTeamModalProps) {
    const [name, setName] = useState(currentTeam.name || "");
    const [emoji, setEmoji] = useState(currentTeam.emoji || "👥");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(currentTeam.name || "");
            setEmoji(currentTeam.emoji || "👥");
        }
    }, [isOpen, currentTeam]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error("Please provide a team name");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.updateTeam(currentTeam.id, trimmedName, currentUser.id, emoji);
            toast.success("Team updated successfully");
            await onTeamUpdated();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to update team");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
            <div className="bg-[var(--app-card)] text-[var(--app-text)] rounded-[var(--radius-card,8px)] border border-[var(--app-border)] overflow-hidden shadow-lg">
                {/* Modal Header */}
                <div className="px-5 py-4 border-b border-[var(--app-border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-base">
                            <span className="emoji-font">{emoji}</span>
                        </div>
                        <div>
                            <h3 className="font-heading text-sm sm:text-base font-bold text-[var(--app-text)] leading-tight">
                                Edit Team Details
                            </h3>
                            <p className="text-[11px] text-[var(--app-muted)] mt-0.5">
                                Modify name and emoji for this workspace
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-[var(--radius-xs,2px)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-bg)] transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                    {/* Emoji + Name Row */}
                    <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1.5 shrink-0">
                            <label className="text-xs font-medium text-[var(--app-text)]">
                                Icon
                            </label>
                            <EmojiPicker
                                value={emoji}
                                onChange={(val) => setEmoji(val)}
                                buttonClassName="w-10 h-10 rounded-[var(--radius-sm,4px)] border border-[var(--app-border)] bg-[var(--app-bg)] hover:bg-[var(--app-hover-bg)] flex items-center justify-center text-xl cursor-pointer transition-colors"
                            />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-[var(--app-text)]">
                                Team Name
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Core Engineering"
                                className="w-full px-3 py-2 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] focus:border-[var(--color-accent)] rounded-[var(--radius-sm,4px)] text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none transition-colors h-10"
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)] flex items-center gap-2.5 text-xs text-[var(--app-muted)]">
                        <Sparkles className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                        <span>Changes will be immediately visible to all team members across the workspace.</span>
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--app-border)]">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={isSubmitting}
                            loadingText="Saving..."
                            icon={<Edit3 className="w-3.5 h-3.5" />}
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </ModalWrapper>
    );
}
