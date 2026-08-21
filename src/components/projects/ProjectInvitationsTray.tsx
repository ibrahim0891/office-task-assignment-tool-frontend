"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Mail, Check, X, Loader2, Calendar, User, Send, Clock, RefreshCw } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { api } from "../../api";
import toast from "react-hot-toast";

interface ProjectInvitationsTrayProps {
    isOpen: boolean;
    onClose: () => void;
    activeProjectId?: string;
    initialTab?: "received" | "sent";
    onRefresh?: () => void;
}

function getInitials(name: string) {
    if (!name) return "";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function AvatarChip({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
    const s = size === "sm" ? "w-5 h-5 text-[8px]" : "w-6 h-6 text-[9px]";
    return (
        <div
            className={`${s} rounded-full border border-[var(--app-border)] bg-[var(--app-card)] flex items-center justify-center font-semibold text-[var(--app-text)] shrink-0`}
            title={name}
        >
            {getInitials(name)}
        </div>
    );
}

export default function ProjectInvitationsTray({
    isOpen,
    onClose,
    activeProjectId,
    initialTab = "received",
    onRefresh,
}: ProjectInvitationsTrayProps) {
    const {
        projectInvitations,
        isProjectInvitationsLoading,
        handleAcceptProjectInvitation,
        handleRejectProjectInvitation,
        handleCancelProjectInvitation,
        loadProjectInvitations,
        currentTeam,
        currentUser,
        userRole,
    } = useWorkspace();

    const [activeTab, setActiveTab] = useState<"received" | "sent">(initialTab);
    const [sentInvitations, setSentInvitations] = useState<any[]>([]);
    const [isSentLoading, setIsSentLoading] = useState(false);
    const [filterCurrentProjectOnly, setFilterCurrentProjectOnly] = useState(Boolean(activeProjectId));
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED">("ALL");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<"accept" | "reject" | "cancel" | null>(null);

    const isLeader = userRole === "LEADER" || userRole === "MANAGER";

    // Set initial tab when requested
    useEffect(() => {
        if (isOpen && initialTab) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    // Load sent invitations when sent tab is active or tray is opened
    const loadSentInvitations = useCallback(async () => {
        if (!currentTeam?.id) return;
        setIsSentLoading(true);
        try {
            const data = await api.getSentProjectInvitations(currentTeam.id);
            if (Array.isArray(data)) setSentInvitations(data);
            else setSentInvitations([]);
        } catch (err) {
            console.error("Failed to load sent invitations:", err);
            setSentInvitations([]);
        } finally {
            setIsSentLoading(false);
        }
    }, [currentTeam?.id]);

    useEffect(() => {
        if (isOpen && currentTeam?.id) {
            loadSentInvitations();
            loadProjectInvitations();
        }
    }, [isOpen, currentTeam?.id, loadSentInvitations, loadProjectInvitations]);

    const onAccept = async (invitationId: string) => {
        setProcessingId(invitationId);
        setActionType("accept");
        try {
            await handleAcceptProjectInvitation(invitationId);
            if (onRefresh) onRefresh();
        } catch {
            // handled by context
        } finally {
            setProcessingId(null);
            setActionType(null);
        }
    };

    const onReject = async (invitationId: string) => {
        setProcessingId(invitationId);
        setActionType("reject");
        try {
            await handleRejectProjectInvitation(invitationId);
            if (onRefresh) onRefresh();
        } catch {
            // handled by context
        } finally {
            setProcessingId(null);
            setActionType(null);
        }
    };

    const onCancel = async (invitationId: string) => {
        setProcessingId(invitationId);
        setActionType("cancel");
        try {
            await handleCancelProjectInvitation(invitationId);
            setSentInvitations((prev) => prev.filter((i) => i.id !== invitationId));
            if (onRefresh) onRefresh();
        } catch {
            // handled by context
        } finally {
            setProcessingId(null);
            setActionType(null);
        }
    };

    const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        return d.toISOString().split("T")[0];
    };

    const receivedCount = projectInvitations?.length || 0;

    // Filter sent invitations by scope and status
    const displayedSentInvitations = sentInvitations.filter((inv) => {
        if (filterCurrentProjectOnly && activeProjectId && inv.projectId !== activeProjectId) {
            return false;
        }
        if (statusFilter !== "ALL" && (inv.status || "").toUpperCase() !== statusFilter) {
            return false;
        }
        return true;
    });

    const sentPendingCount = sentInvitations.filter(
        (i) => (i.status || "").toUpperCase() === "PENDING"
    ).length;

    const currentProjectPendingCount = activeProjectId
        ? sentInvitations.filter(
              (i) => i.projectId === activeProjectId && (i.status || "").toUpperCase() === "PENDING"
          ).length
        : 0;

    const totalBadgeCount = receivedCount + (activeProjectId ? currentProjectPendingCount : sentPendingCount);

    return (
        <aside
            className={`shrink-0 bg-[var(--app-card)] flex flex-col h-full select-none transition-all duration-300 ease-in-out overflow-hidden z-30 ${
                isOpen
                    ? "w-80 sm:w-88 border-l border-[var(--app-border)]"
                    : "w-0 border-l-0 border-transparent pointer-events-none"
            }`}
        >
            <div className="w-80 sm:w-88 h-full flex flex-col overflow-hidden shrink-0">
                {/* Header matching ManageFoldersTray */}
                <div className="p-4 border-b border-[var(--app-border)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-4 h-4 text-[var(--app-text)] shrink-0" />
                        <h2 className="font-heading text-xs font-semibold text-[var(--app-text)] truncate">
                            Project Invitations
                        </h2>
                        {totalBadgeCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold">
                                {totalBadgeCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                loadSentInvitations();
                                loadProjectInvitations();
                            }}
                            title="Refresh"
                            className="text-[var(--app-muted)] hover:text-[var(--app-text)] p-1 rounded-[2px] transition-colors cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            title="Close"
                            className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors text-base px-1.5 cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Sub-tabs matching NotificationsTray */}
                <div className="flex border-b border-[var(--app-border)] text-[11px] font-medium px-4 pt-2 shrink-0 gap-1 bg-[var(--app-card)]">
                    <button
                        type="button"
                        onClick={() => setActiveTab("received")}
                        className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                            activeTab === "received"
                                ? "border-[var(--app-text)] text-[var(--app-text)] font-semibold"
                                : "border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]"
                        }`}
                    >
                        <span>Received</span>
                        {receivedCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)]">
                                {receivedCount}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("sent")}
                        className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                            activeTab === "sent"
                                ? "border-[var(--app-text)] text-[var(--app-text)] font-semibold"
                                : "border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]"
                        }`}
                    >
                        <span>Sent Invitations</span>
                        {sentPendingCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)]">
                                {sentPendingCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {/* RECEIVED TAB */}
                    {activeTab === "received" && (
                        <>
                            {isProjectInvitationsLoading ? (
                                <div className="flex flex-col items-center justify-center h-48 text-[var(--app-muted)] gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-[var(--app-text)]" />
                                    <p className="text-xs font-medium">Checking received invitations...</p>
                                </div>
                            ) : receivedCount === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-[var(--app-muted)] gap-2 text-center">
                                    <div className="w-10 h-10 rounded-full border border-[var(--app-border)] bg-[var(--app-bg)] flex items-center justify-center">
                                        <Mail className="w-4 h-4 text-[var(--app-muted)]" />
                                    </div>
                                    <p className="text-xs font-semibold text-[var(--app-text)]">No Received Invitations</p>
                                    <p className="text-[10px] text-[var(--app-muted)] max-w-[220px]">
                                        When team leaders or managers invite you to collaborate on projects, they will appear here.
                                    </p>
                                </div>
                            ) : (
                                projectInvitations.map((invitation: any) => {
                                    const isProcessing = processingId === invitation.id;
                                    const project = invitation.project || {};
                                    const sender = invitation.sender || {};
                                    const role = (invitation.role || "MEMBER").toUpperCase();

                                    return (
                                        <div
                                            key={invitation.id}
                                            className="border border-[var(--app-border)] rounded-[3px] bg-[var(--app-bg)] p-3.5 flex flex-col gap-2.5 hover:border-[var(--app-border-strong)] transition-colors"
                                        >
                                            {/* Project Header */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-base emoji-font shrink-0">
                                                        {project.emoji || "📁"}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <h3 className="font-heading text-xs font-semibold text-[var(--app-text)] truncate">
                                                            {project.title || "Project"}
                                                        </h3>
                                                        {project.folder && (
                                                            <span className="text-[10px] text-[var(--app-muted)] flex items-center gap-1">
                                                                <span className="emoji-font">{project.folder.emoji}</span>
                                                                <span className="truncate">{project.folder.name}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-[2px] border border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text)] uppercase font-mono">
                                                    {role}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            {project.description && (
                                                <p className="text-[11px] text-[var(--app-muted)] leading-relaxed line-clamp-2">
                                                    {project.description}
                                                </p>
                                            )}

                                            {/* Metadata */}
                                            <div className="flex flex-col gap-1 text-[10px] text-[var(--app-muted)] pt-2 border-t border-[var(--app-border)]">
                                                {sender.name && (
                                                    <div className="flex items-center gap-1.5">
                                                        <AvatarChip name={sender.name} />
                                                        <span>Invited by <strong className="text-[var(--app-text)] font-medium">{sender.name}</strong></span>
                                                    </div>
                                                )}
                                                {project.startDate && project.endDate && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3 text-[var(--app-muted)]" />
                                                        <span>{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3 text-[var(--app-muted)]" />
                                                    <span>Daily Capacity: <strong className="text-[var(--app-text)] font-medium">{invitation.dailyCapacity || 1.0}d/day</strong></span>
                                                </div>
                                            </div>

                                            {/* Action Buttons matching app button design */}
                                            <div className="flex items-center gap-2 pt-2 border-t border-[var(--app-border)]">
                                                <button
                                                    type="button"
                                                    onClick={() => onReject(invitation.id)}
                                                    disabled={isProcessing}
                                                    className="px-3 py-1.5 border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[#FFF5F5] hover:border-[#CB2431] text-[var(--app-muted)] hover:text-[#CB2431] text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                                                >
                                                    {isProcessing && actionType === "reject" ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <X className="w-3 h-3" />
                                                    )}
                                                    <span>Decline</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onAccept(invitation.id)}
                                                    disabled={isProcessing}
                                                    className="flex-1 px-3 py-1.5 border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] hover:border-[var(--app-border-strong)] text-[11px] font-semibold rounded-[2px] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                >
                                                    {isProcessing && actionType === "accept" ? (
                                                        <Loader2 className="w-3 h-3 animate-spin text-[var(--app-text)]" />
                                                    ) : (
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    )}
                                                    <span>Accept & Join</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}

                    {/* SENT TAB */}
                    {activeTab === "sent" && (
                        <>
                            {/* Scope and status filter matching app filter style */}
                            <div className="flex flex-col gap-2 pb-2 border-b border-[var(--app-border)] text-[10px]">
                                {activeProjectId && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--app-muted)]">Scope:</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setFilterCurrentProjectOnly(true)}
                                                className={`px-2 py-0.5 rounded-[2px] text-[10px] transition-colors cursor-pointer ${
                                                    filterCurrentProjectOnly
                                                        ? "bg-[var(--app-card)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold"
                                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                                }`}
                                            >
                                                This Project {currentProjectPendingCount > 0 ? `(${currentProjectPendingCount})` : ""}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFilterCurrentProjectOnly(false)}
                                                className={`px-2 py-0.5 rounded-[2px] text-[10px] transition-colors cursor-pointer ${
                                                    !filterCurrentProjectOnly
                                                        ? "bg-[var(--app-card)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold"
                                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                                }`}
                                            >
                                                All Projects ({sentInvitations.length})
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-1 text-[9px] text-[var(--app-muted)] overflow-x-auto">
                                    <span className="mr-0.5">Status:</span>
                                    {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setStatusFilter(st)}
                                            className={`px-1.5 py-0.5 rounded-[2px] uppercase font-mono transition-colors cursor-pointer ${
                                                statusFilter === st
                                                    ? "bg-[var(--app-card)] border border-[var(--app-border)] text-[var(--app-text)] font-bold"
                                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                                            }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isSentLoading ? (
                                <div className="flex flex-col items-center justify-center h-48 text-[var(--app-muted)] gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-[var(--app-text)]" />
                                    <p className="text-xs font-medium">Loading sent invitations...</p>
                                </div>
                            ) : displayedSentInvitations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-[var(--app-muted)] gap-2 text-center">
                                    <div className="w-10 h-10 rounded-full border border-[var(--app-border)] bg-[var(--app-bg)] flex items-center justify-center">
                                        <Send className="w-4 h-4 text-[var(--app-muted)]" />
                                    </div>
                                    <p className="text-xs font-semibold text-[var(--app-text)]">No Outgoing Invitations</p>
                                    <p className="text-[10px] text-[var(--app-muted)] max-w-[220px]">
                                        {filterCurrentProjectOnly
                                            ? "No invitations sent for this project matching current filters."
                                            : "Invitations sent by you or your project leaders will appear here."}
                                    </p>
                                </div>
                            ) : (
                                displayedSentInvitations.map((inv: any) => {
                                    const receiver = inv.receiver || {};
                                    const project = inv.project || {};
                                    const isPending = (inv.status || "").toUpperCase() === "PENDING";
                                    const isAccepted = (inv.status || "").toUpperCase() === "ACCEPTED";
                                    const isProcessing = processingId === inv.id;
                                    const isSender = inv.senderId === currentUser?.id || inv.sender?.id === currentUser?.id;
                                    const canCancel = isPending && (isLeader || isSender || Boolean(activeProjectId));

                                    return (
                                        <div
                                            key={inv.id}
                                            className="border border-[var(--app-border)] rounded-[3px] bg-[var(--app-bg)] p-3 flex flex-col gap-2.5 hover:border-[var(--app-border-strong)] transition-colors"
                                        >
                                            {/* Member & Status */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <AvatarChip name={receiver.name || receiver.email || "Member"} />
                                                    <div className="min-w-0">
                                                        <h4 className="text-[11px] font-semibold text-[var(--app-text)] truncate">
                                                            {receiver.name || "Invited User"}
                                                        </h4>
                                                        <span className="text-[9px] text-[var(--app-muted)] block truncate">
                                                            {receiver.email || "Pending verification"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`text-[8px] font-medium px-1.5 py-0.5 rounded-[2px] uppercase border font-mono flex items-center gap-1 ${
                                                        isPending
                                                            ? "text-[#B08800] bg-[#B08800]/10 border-[#B08800]/20"
                                                            : isAccepted
                                                            ? "text-[#22863A] bg-[#22863A]/10 border-[#22863A]/20"
                                                            : "text-[var(--app-muted)] bg-[var(--app-card)] border-[var(--app-border)]"
                                                    }`}
                                                >
                                                    {isPending && <span className="w-1 h-1 rounded-full bg-[#B08800]" />}
                                                    {inv.status}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="text-[10px] text-[var(--app-muted)] flex flex-col gap-1 pt-1.5 border-t border-[var(--app-border)]">
                                                <div className="flex items-center justify-between">
                                                    <span className="truncate">
                                                        Project: <strong className="text-[var(--app-text)] font-medium">{project.title || "Project"}</strong>
                                                    </span>
                                                    <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-[2px] border border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text)] uppercase font-mono">
                                                        {inv.role || "MEMBER"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[9px]">
                                                    <span>Sender: <strong className="text-[var(--app-text)] font-medium">{isSender ? "You" : (inv.sender?.name || "Leader")}</strong></span>
                                                    {inv.createdAt && (
                                                        <span>{formatDate(inv.createdAt)}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Cancel Action */}
                                            {canCancel && (
                                                <div className="flex justify-end pt-1.5 border-t border-[var(--app-border)]">
                                                    <button
                                                        type="button"
                                                        onClick={() => onCancel(inv.id)}
                                                        disabled={isProcessing}
                                                        className="text-[10px] px-2.5 py-1 text-[#CB2431] hover:bg-[#FFF5F5] border border-[var(--app-border)] hover:border-[#CB2431] rounded-[2px] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        {isProcessing && actionType === "cancel" ? (
                                                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                                        ) : (
                                                            <X className="w-2.5 h-2.5" />
                                                        )}
                                                        <span>Cancel Invitation</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
