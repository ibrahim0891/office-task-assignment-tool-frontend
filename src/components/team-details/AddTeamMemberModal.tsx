"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { UserPlus, Mail, Users, Check, X, Shield, Eye, User as UserIcon } from "lucide-react";
import ModalWrapper from "@/components/ui/ModalWrapper";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { api, Team, User } from "@/api";

interface AddTeamMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTeam: Team;
    currentUser: User;
    teamMembers: { user: User; role: string }[];
    onMemberAdded: () => Promise<void>;
}

export function AddTeamMemberModal({
    isOpen,
    onClose,
    currentTeam,
    currentUser,
    teamMembers,
    onMemberAdded,
}: AddTeamMemberModalProps) {
    const [mode, setMode] = useState<"email" | "existing">("email");
    const [email, setEmail] = useState("");
    const [selectedRole, setSelectedRole] = useState<"MEMBER" | "LEADER" | "OBSERVER">("MEMBER");
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch candidate users not currently in team
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const fetchAvailableUsers = async () => {
            setIsLoadingUsers(true);
            try {
                const excluded = await api.getUsersExcludeTeam(currentTeam.id);
                if (isMounted) {
                    const list = excluded || [];
                    setAvailableUsers(list);
                    setSelectedUserId(list[0]?.id || "");
                }
            } catch (err) {
                // Fallback to empty if endpoint has transient error
                if (isMounted) {
                    setAvailableUsers([]);
                    setSelectedUserId("");
                }
            } finally {
                if (isMounted) setIsLoadingUsers(false);
            }
        };

        fetchAvailableUsers();
        return () => {
            isMounted = false;
        };
    }, [isOpen, currentTeam.id]);

    const handleReset = () => {
        setEmail("");
        setSelectedRole("MEMBER");
        setSelectedUserId("");
        setIsSubmitting(false);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleInviteByEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            toast.error("Please enter a valid email address");
            return;
        }

        // Check if already in team
        const alreadyMember = teamMembers.some(
            (m) => m.user.email?.toLowerCase() === trimmedEmail.toLowerCase()
        );
        if (alreadyMember) {
            toast.error("This user is already a member of this team");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.inviteMemberByEmail(
                currentTeam.id,
                trimmedEmail,
                selectedRole,
                currentUser.id
            );
            toast.success(`Member "${trimmedEmail}" invited to ${currentTeam.name}`);
            await onMemberAdded();
            handleClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to invite member");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddExistingUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            toast.error("Please select a user to add");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.addTeamMember(currentTeam.id, selectedUserId, selectedRole);
            const addedUser = availableUsers.find((u) => u.id === selectedUserId);
            const displayName = addedUser?.fullName || addedUser?.name || "Member";
            toast.success(`${displayName} added to ${currentTeam.name}`);
            await onMemberAdded();
            handleClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to add user to team");
        } finally {
            setIsSubmitting(false);
        }
    };

    const roleOptions: {
        role: "MEMBER" | "LEADER" | "OBSERVER";
        title: string;
        desc: string;
        icon: React.ReactNode;
    }[] = [
        {
            role: "MEMBER",
            title: "Member",
            desc: "Can view and manage tasks assigned to them",
            icon: <UserIcon className="w-3.5 h-3.5 text-[var(--app-muted)]" />,
        },
        {
            role: "LEADER",
            title: "Leader",
            desc: "Full management permissions, member controls, and team editing",
            icon: <Shield className="w-3.5 h-3.5 text-[var(--color-accent)]" />,
        },
        {
            role: "OBSERVER",
            title: "Observer",
            desc: "Read-only access to view team progress and deliverables",
            icon: <Eye className="w-3.5 h-3.5 text-[var(--color-warning)]" />,
        },
    ];

    return (
        <ModalWrapper isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
            <div className="bg-[var(--app-card)] text-[var(--app-text)] rounded-[var(--radius-card,8px)] border border-[var(--app-border)] overflow-hidden shadow-lg">
                {/* Modal Header */}
                <div className="px-5 py-4 border-b border-[var(--app-border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[var(--radius-sm,4px)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-heading text-sm sm:text-base font-bold text-[var(--app-text)] leading-tight">
                                Add Team Member
                            </h3>
                            <p className="text-[11px] text-[var(--app-muted)] mt-0.5">
                                Add to <span className="font-semibold text-[var(--app-text)]">{currentTeam.name}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1 rounded-[var(--radius-xs,2px)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-bg)] transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Mode Selector Tabs */}
                <div className="px-5 pt-4">
                    <div className="grid grid-cols-2 p-0.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)] text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setMode("email")}
                            className={`py-1.5 px-3 rounded-[var(--radius-xs,2px)] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                mode === "email"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-3xs border border-[var(--app-border)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                        >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Invite by Email</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("existing")}
                            className={`py-1.5 px-3 rounded-[var(--radius-xs,2px)] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                mode === "existing"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-3xs border border-[var(--app-border)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Existing Users</span>
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-5">
                    {mode === "email" ? (
                        <form onSubmit={handleInviteByEmail} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-[var(--app-text)]">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] focus:border-[var(--color-accent)] rounded-[var(--radius-sm,4px)] text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none transition-colors"
                                    />
                                </div>
                                <span className="text-[10px] text-[var(--app-muted)]">
                                    If the user does not have an account, an invitation will be generated.
                                </span>
                            </div>

                            {/* Role Selection */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-[var(--app-text)]">
                                    Assigned Role
                                </label>
                                <div className="flex flex-col gap-2">
                                    {roleOptions.map((opt) => (
                                        <label
                                            key={opt.role}
                                            onClick={() => setSelectedRole(opt.role)}
                                            className={`p-2.5 rounded-[var(--radius-sm,4px)] border transition-all cursor-pointer flex items-start gap-2.5 ${
                                                selectedRole === opt.role
                                                    ? "bg-[var(--app-select-bg)] border-[var(--color-accent)]/40 shadow-3xs"
                                                    : "bg-[var(--app-bg)] border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
                                            }`}
                                        >
                                            <div className="mt-0.5">{opt.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-[var(--app-text)]">
                                                        {opt.title}
                                                    </span>
                                                    {selectedRole === opt.role && (
                                                        <Check className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-[var(--app-muted)] mt-0.5 leading-tight">
                                                    {opt.desc}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--app-border)]">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    isLoading={isSubmitting}
                                    loadingText="Inviting..."
                                    icon={<UserPlus className="w-3.5 h-3.5" />}
                                >
                                    Send Invitation
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleAddExistingUser} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-[var(--app-text)]">
                                    Select Organization User
                                </label>
                                {isLoadingUsers ? (
                                    <div className="py-4 text-center text-xs text-[var(--app-muted)] animate-pulse">
                                        Loading organization directory…
                                    </div>
                                ) : availableUsers.length === 0 ? (
                                    <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)] text-xs text-[var(--app-muted)] text-center">
                                        All registered users are already members of this team.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                                        {availableUsers.map((u) => {
                                            const name = u.fullName || u.name || "Unknown";
                                            const isSelected = selectedUserId === u.id;
                                            return (
                                                <div
                                                    key={u.id}
                                                    onClick={() => setSelectedUserId(u.id)}
                                                    className={`p-2 rounded-[var(--radius-sm,4px)] border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                                        isSelected
                                                            ? "bg-[var(--app-select-bg)] border-[var(--color-accent)]/40 shadow-3xs"
                                                            : "bg-[var(--app-bg)] border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <UserAvatar
                                                            name={name}
                                                            avatarUrl={u.avatarUrl}
                                                            size="sm"
                                                            showBorder={false}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-semibold text-[var(--app-text)] truncate">
                                                                {name}
                                                            </div>
                                                            <div className="text-[10px] text-[var(--app-muted)] truncate">
                                                                {u.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Role Selection */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-[var(--app-text)]">
                                    Assigned Role
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["MEMBER", "LEADER", "OBSERVER"] as const).map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setSelectedRole(r)}
                                            className={`py-1.5 px-2 rounded-[var(--radius-sm,4px)] text-xs border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                                selectedRole === r
                                                    ? "bg-[var(--app-select-bg)] text-[var(--color-accent)] border-[var(--color-accent)]/40 font-semibold shadow-3xs"
                                                    : "bg-[var(--app-bg)] text-[var(--app-muted)] border-[var(--app-border)] hover:text-[var(--app-text)]"
                                            }`}
                                        >
                                            <span className="capitalize">{r.toLowerCase()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--app-border)]">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={availableUsers.length === 0 || !selectedUserId}
                                    isLoading={isSubmitting}
                                    loadingText="Adding..."
                                    icon={<UserPlus className="w-3.5 h-3.5" />}
                                >
                                    Add Member
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </ModalWrapper>
    );
}
