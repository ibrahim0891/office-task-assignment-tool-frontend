"use client";

import React, { useState } from "react";
import { Team, User } from "../api";
import { Button } from "./ui/Button";
import { X, Edit2, Trash2, Check, Plus, ShieldAlert, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { EmojiPicker } from "./ui/EmojiPicker";

interface ManageTeamsModalProps {
    isOpen: boolean;
    onClose: () => void;
    teams: Team[];
    currentTeam: Team | null;
    currentUser: User | null;
    userRole: string;
    onSelectTeam: (team: Team) => void;
    onCreateTeam: (name: string, emoji?: string) => Promise<void>;
    onUpdateTeam: (teamId: string, name: string, emoji?: string) => Promise<void>;
    onDeleteTeam: (
        teamId: string,
        password: string,
        confirmationText: string,
    ) => Promise<void>;
    onLeaveTeam: (teamId: string) => Promise<void>;
}

export default function ManageTeamsModal({
    isOpen,
    onClose,
    teams,
    currentTeam,
    currentUser,
    userRole,
    onSelectTeam,
    onCreateTeam,
    onUpdateTeam,
    onDeleteTeam,
    onLeaveTeam,
}: ManageTeamsModalProps) {
    // States for inline editing
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [editingEmoji, setEditingEmoji] = useState("👤");

    // States for create workspace
    const [isCreating, setIsCreating] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamEmoji, setNewTeamEmoji] = useState("👤");

    // States for deletion flow
    const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
    const [confirmationInput, setConfirmationInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const inputClass =
        "w-full bg-white border border-[#E5E5E3] px-3.5 py-2.5 rounded-[2px] text-base text-[#1A1A1A] placeholder-[#888883] focus:outline-none focus:border-[#1A1A1A] transition-colors leading-normal";

    const handleStartEdit = (team: Team) => {
        setEditingTeamId(team.id);
        setEditingName(team.name);
        setEditingEmoji(team.emoji || "👤");
    };

    const handleSaveEdit = async (teamId: string) => {
        if (!editingName.trim()) {
            toast.error("Workspace name cannot be empty");
            return;
        }
        try {
            setIsSubmitting(true);
            await onUpdateTeam(teamId, editingName.trim(), editingEmoji);
            setEditingTeamId(null);
        } catch (err) {
            // error toast handled in context
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) {
            toast.error("Please enter a workspace name");
            return;
        }
        try {
            setIsSubmitting(true);
            await onCreateTeam(newTeamName.trim(), newTeamEmoji);
            setNewTeamName("");
            setNewTeamEmoji("👤");
            setIsCreating(false);
        } catch (err) {
            // error handled in context
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deletingTeam) return;

        if (confirmationInput !== "I know what I'm doing") {
            toast.error('You must type "I know what I\'m doing" exactly.');
            return;
        }

        if (!passwordInput) {
            toast.error("Please enter your account password.");
            return;
        }

        try {
            setIsSubmitting(true);
            await onDeleteTeam(
                deletingTeam.id,
                passwordInput,
                confirmationInput,
            );
            setDeletingTeam(null);
            setConfirmationInput("");
            setPasswordInput("");
        } catch (err) {
            // error handled in context
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLeave = async (team: Team) => {
        const confirmed = window.confirm(`Are you sure you want to leave the workspace "${team.name}"? Your active tasks in this workspace will be reassigned to the team leader and marked as Need Attention.`);
        if (!confirmed) return;
        try {
            setIsSubmitting(true);
            await onLeaveTeam(team.id);
        } catch (err) {
            // error handled in context
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div
                className="relative bg-white border border-[#E5E5E3] w-full max-w-xl flex flex-col gap-5 animate-fade-in text-left rounded-[3px] corner-brackets p-6 sm:p-7 max-h-[90vh] shadow-2xl z-10 overflow-hidden"
                style={{ boxShadow: "var(--shadow-float)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-4 shrink-0">
                    <div className="flex flex-col gap-1">
                        <span className="eyebrow block">
                            Workspace Settings
                        </span>
                        <h2 className="font-heading text-lg font-semibold text-[#1A1A1A]">
                            Manage Workspaces & Teams
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#FAFAF9] transition-colors cursor-pointer"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 scrollbar-none">
                    {/* Delete Confirmation View */}
                    {deletingTeam ? (
                        <div className="flex flex-col gap-4 animate-fade-in">
                            <div className="p-4 bg-[#FFF5F5] border border-[#F5C6CB] rounded-[2px] flex items-start gap-3 text-[#CB2431]">
                                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                                <div className="text-base flex flex-col gap-1.5">
                                    <span className="font-semibold text-[13px] tracking-tight">
                                        Permanent Cascading Workspace Deletion
                                    </span>
                                    <p className="text-[11px] leading-relaxed text-[#900C1C]">
                                        Deleting workspace{" "}
                                        <strong>"{deletingTeam.name}"</strong>{" "}
                                        will permanently destroy all columns,
                                        tasks, subtasks, checklists, comments,
                                        attachments, activities, and user
                                        memberships under it.
                                    </p>
                                </div>
                            </div>

                            <form
                                onSubmit={handleConfirmDelete}
                                className="flex flex-col gap-4 mt-1"
                            >
                                <div className="flex flex-col gap-1.5">
                                    <label className="eyebrow text-[#CB2431]">
                                        1. Confirmation Statement
                                    </label>
                                    <span className="text-[11px] text-[#888883] mb-0.5">
                                        Type{" "}
                                        <strong>"I know what I'm doing"</strong>{" "}
                                        exactly:
                                    </span>
                                    <input
                                        type="text"
                                        value={confirmationInput}
                                        onChange={(e) =>
                                            setConfirmationInput(e.target.value)
                                        }
                                        placeholder="I know what I'm doing"
                                        className={`${inputClass} border-[#F5C6CB] focus:border-[#CB2431]`}
                                        autoFocus
                                        required
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="eyebrow">
                                        2. Account Password
                                    </label>
                                    <span className="text-[11px] text-[#888883] mb-0.5">
                                        Enter your current account password to
                                        authorize deletion:
                                    </span>
                                    <input
                                        type="password"
                                        value={passwordInput}
                                        onChange={(e) =>
                                            setPasswordInput(e.target.value)
                                        }
                                        placeholder="Account password"
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E5E3] mt-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setDeletingTeam(null);
                                            setConfirmationInput("");
                                            setPasswordInput("");
                                        }}
                                        disabled={isSubmitting}
                                        className="px-4 py-2"
                                    >
                                        Cancel
                                    </Button>
                                    <button
                                        type="submit"
                                        disabled={
                                            confirmationInput !==
                                                "I know what I'm doing" ||
                                            !passwordInput ||
                                            isSubmitting
                                        }
                                        className="relative corner-brackets-4 bg-[#CB2431] hover:bg-[#A01C27] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-medium px-4 py-2 rounded-[2px] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>
                                            {isSubmitting
                                                ? "Deleting..."
                                                : "Confirm & Delete Workspace"}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <>
                            {/* Workspaces List Header */}
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center pb-1">
                                    <span className="eyebrow text-[11px]">
                                        Provisioned Workspaces ({teams.length})
                                    </span>
                                    {!isCreating && (
                                        <button
                                            onClick={() => setIsCreating(true)}
                                            className="relative corner-brackets-4 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] text-[11px] font-medium px-3 py-1.5 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>New Workspace</span>
                                        </button>
                                    )}
                                </div>

                                {/* Create Inline Card */}
                                {isCreating && (
                                    <form
                                        onSubmit={handleCreateSubmit}
                                        className="bg-[#FAFAF9] border border-[#E5E5E3] p-4 rounded-[2px] flex flex-col gap-3.5 corner-brackets animate-fade-in mb-2"
                                    >
                                        <div className="flex items-end gap-2.5">
                                            <div className="flex flex-col gap-1 shrink-0">
                                                <span className="eyebrow">Icon</span>
                                                <EmojiPicker
                                                    value={newTeamEmoji}
                                                    onChange={setNewTeamEmoji}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                <span className="eyebrow">
                                                    New Workspace Name
                                                </span>
                                                <input
                                                    type="text"
                                                    value={newTeamName}
                                                    onChange={(e) =>
                                                        setNewTeamName(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="e.g. Mobile Engineering, Marketing"
                                                    className={inputClass}
                                                    autoFocus
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2.5 pt-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setIsCreating(false);
                                                    setNewTeamName("");
                                                    setNewTeamEmoji("👤");
                                                }}
                                                disabled={isSubmitting}
                                                className="px-3 py-1.5"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                showDot
                                                disabled={isSubmitting}
                                                className="px-4 py-1.5"
                                            >
                                                {isSubmitting
                                                    ? "Creating..."
                                                    : "Create Workspace"}
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {/* Workspaces List items */}
                                <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-0.5">
                                    {teams.map((t) => {
                                        const isCurrent =
                                            currentTeam?.id === t.id;
                                        const isEditing =
                                            editingTeamId === t.id;
                                        const isLeaderOfTeam = t.id === currentTeam?.id
                                            ? (userRole === "LEADER")
                                            : t.members?.find((m) => m.user.id === currentUser?.id)?.role === "LEADER";
                                        const isCreatorOfTeam = t.createdById === currentUser?.id;
                                        const canRenameTeam = isLeaderOfTeam || isCreatorOfTeam;

                                        return (
                                            <div
                                                key={t.id}
                                                className={`p-3.5 sm:p-4 border rounded-[2px] flex items-center justify-between gap-4 transition-colors corner-brackets ${
                                                    isCurrent
                                                        ? "bg-white border-[#1A1A1A] shadow-xs"
                                                        : "bg-[#FAFAF9] border-[#E5E5E3] hover:border-[#CCCCCC]"
                                                }`}
                                            >
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2.5 flex-1">
                                                        <EmojiPicker
                                                            value={editingEmoji}
                                                            onChange={setEditingEmoji}
                                                            disabled={isSubmitting}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editingName}
                                                            onChange={(e) =>
                                                                setEditingName(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className={
                                                                inputClass
                                                            }
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() =>
                                                                handleSaveEdit(
                                                                    t.id,
                                                                )
                                                            }
                                                            disabled={
                                                                isSubmitting
                                                            }
                                                            className="relative corner-brackets-4 flex items-center justify-center h-[46px] w-[46px] bg-[#1A1A1A] text-white rounded-[2px] hover:bg-[#333333] transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title="Save"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setEditingTeamId(
                                                                    null,
                                                                )
                                                            }
                                                            disabled={
                                                                isSubmitting
                                                            }
                                                            className="relative corner-brackets-4 flex items-center justify-center h-[46px] w-[46px] border border-[#E5E5E3] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#FAFAF9] rounded-[2px] transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex flex-col gap-1 min-w-0">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="text-lg emoji-font shrink-0 leading-none">{t.emoji || "👤"}</span>
                                                                <span className="font-medium text-[13px] text-[#1A1A1A] truncate">
                                                                    {t.name}
                                                                </span>
                                                                {isCurrent && (
                                                                    <span className="bg-[#1A1A1A] text-white text-[9px] font-medium px-2 py-0.5 rounded-[2px]">
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-[#888883]">
                                                                ID:{" "}
                                                                {t.id.slice(
                                                                    0,
                                                                    8,
                                                                )}
                                                                ...
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {!isCurrent && (
                                                                <button
                                                                    onClick={() => {
                                                                        onSelectTeam(
                                                                            t,
                                                                        );
                                                                        onClose();
                                                                    }}
                                                                    className="px-3 py-1.5 border border-[#E5E5E3] bg-white hover:bg-[#FAFAF9] text-[#1A1A1A] text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer"
                                                                >
                                                                    Switch
                                                                </button>
                                                            )}
                                                            {canRenameTeam && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleStartEdit(
                                                                            t,
                                                                        )
                                                                    }
                                                                    className="p-2 border border-[#E5E5E3] bg-white hover:bg-[#FAFAF9] text-[#555555] hover:text-[#1A1A1A] rounded-[2px] transition-colors cursor-pointer"
                                                                    title="Rename workspace"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            {isLeaderOfTeam ? (
                                                                <button
                                                                    onClick={() => {
                                                                        setDeletingTeam(
                                                                            t,
                                                                        );
                                                                        setConfirmationInput(
                                                                            "",
                                                                        );
                                                                        setPasswordInput(
                                                                            "",
                                                                        );
                                                                    }}
                                                                    className="p-2 border border-[#E5E5E3] bg-white hover:bg-[#FFF5F5] hover:border-[#CB2431] text-[#888883] hover:text-[#CB2431] rounded-[2px] transition-colors cursor-pointer"
                                                                    title="Delete workspace"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleLeave(t)}
                                                                    className="p-2 border border-[#E5E5E3] bg-white hover:bg-[#FFF5F5] hover:border-[#CB2431] text-[#888883] hover:text-[#CB2431] rounded-[2px] transition-colors cursor-pointer"
                                                                    title="Leave workspace"
                                                                >
                                                                    <LogOut className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
