import React, { useState } from "react";
import { Notification } from "../api";
import { Archive, Trash2, CheckCircle2, Clock, Loader2, Infinity as InfinityIcon } from "lucide-react";

interface NotificationsTrayProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    isLoading?: boolean;
    onMarkRead: (id: string) => void;
    onClearAll: () => void;
    onArchiveNotification: (id: string) => void;
    onDeleteArchived?: () => void;
    onSelectTask: (taskId: string, initialTab?: "details" | "comments" | "attachments") => void;
    hasMore: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
}

export default function NotificationsTray({
    isOpen,
    onClose,
    notifications,
    isLoading = false,
    onMarkRead,
    onClearAll,
    onArchiveNotification,
    onDeleteArchived,
    onSelectTask,
    hasMore,
    isLoadingMore,
    onLoadMore,
}: NotificationsTrayProps) {
    const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsAnimatingOut(false);
        } else if (shouldRender) {
            setIsAnimatingOut(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsAnimatingOut(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen, shouldRender]);

    if (!shouldRender) return null;

    const activeNotifications = notifications.filter((n) => !n.isArchived);
    const archivedNotifications = notifications.filter((n) => n.isArchived);

    const getNotificationType = (n: any) => {
        let type = n.type;
        if (type === "REASSIGN") {
            const content = n.content.toLowerCase();
            if (content.includes("added to team workspace") || content.includes("added to workspace")) {
                type = "MEMBER_ADDED";
            } else if (content.includes("invited")) {
                type = "MEMBER_INVITED";
            } else if (content.includes("role")) {
                type = "ROLE_UPDATED";
            } else if (content.includes("created task")) {
                type = "TASK_CREATED";
            } else if (content.includes("assigned a new task")) {
                type = "TASK_ASSIGNED";
            } else if (content.includes("reassigned")) {
                type = "TASK_REASSIGNED";
            }
        }
        return type;
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "NEED_ATTENTION":
                return "text-[#CB2431] border-[#CB2431]/20";
            case "COMMENT_MENTION":
                return "text-[#B08800] border-[#B08800]/20";
            default:
                return "text-[#1A1A1A] border-[#E5E5E3]";
        }
    };

    const currentList =
        activeTab === "active" ? activeNotifications : archivedNotifications;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/30 transition-opacity ${
                    isAnimatingOut ? "animate-fade-out" : "animate-fade-in"
                }`}
                onClick={onClose}
            />

            {/* Tray panel */}
            <div
                className={`relative w-84 max-w-full bg-white border-l border-[#E5E5E3] text-[#1A1A1A] flex flex-col h-full ${
                    isAnimatingOut ? "animate-slide-out" : "animate-slide-in"
                }`}
                style={{ boxShadow: "var(--shadow-float)" }}
            >
                {/* Header */}
                <div className="p-4 border-b border-[#E5E5E3] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="font-heading text-base">
                                Notifications
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeTab === "active" &&
                                activeNotifications.length > 0 && (
                                    <button
                                        onClick={onClearAll}
                                        title="Move all notifications to Archive (kept for 30 days)"
                                        className="text-[10px] font-semibold tracking-wider px-3 py-1.5 rounded-[2px] border border-[#E5E5E3] hover:border-[#DADAD6] hover:bg-[#FAFAF9] text-[#888883] hover:text-[#1A1A1A] transition-colors"
                                    >
                                        Clear All
                                    </button>
                                )}
                            {activeTab === "archived" &&
                                archivedNotifications.length > 0 && (
                                    <button
                                        onClick={onDeleteArchived}
                                        title="Permanently delete all archived notifications"
                                        className="text-[10px] font-semibold tracking-wider px-3 py-1.5 rounded-[2px] border border-[#E5E5E3] hover:border-[#CB2431] hover:bg-[#FFF5F5] text-[#888883] hover:text-[#CB2431] transition-colors flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Clear Archive
                                    </button>
                                )}
                            <button
                                onClick={onClose}
                                className="text-[#888883] hover:text-[#1A1A1A] transition-colors text-base px-1.5"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[#E5E5E3] text-[11px] font-medium">
                        <button
                            onClick={() => setActiveTab("active")}
                            className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "active"
                                ? "border-[#1A1A1A] text-[#1A1A1A]"
                                : "border-transparent text-[#888883] hover:text-[#1A1A1A]"
                                }`}
                        >
                            Inbox
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#F5F5F3] border border-[#E5E5E3]">
                                {activeNotifications.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("archived")}
                            className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "archived"
                                ? "border-[#1A1A1A] text-[#1A1A1A]"
                                : "border-transparent text-[#888883] hover:text-[#1A1A1A]"
                                }`}
                        >
                            <Archive className="w-3 h-3" />
                            Archive (30d)
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#F5F5F3] border border-[#E5E5E3]">
                                {archivedNotifications.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* 30-Day Storage Notice */}
                {activeTab === "archived" && (
                    <div className="bg-[#FAFAF9] border-b border-[#E5E5E3] px-3 py-2 flex items-center gap-2 text-[11px] text-[#888883]">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-[#1A1A1A]" />
                        <span>
                            Archived items are automatically removed after 30
                            days.
                        </span>
                    </div>
                )}

                {/* Content */}
                <div 
                    className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5"
                    onScroll={(e) => {
                        const target = e.currentTarget;
                        if (target.scrollHeight - target.scrollTop - target.clientHeight < 20) {
                            if (hasMore && !isLoadingMore) {
                                onLoadMore();
                            }
                        }
                    }}
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[#888883] gap-2">
                            <InfinityIcon className="w-8 h-8 text-[#1A1A1A] animate-spin" />
                            <p className="text-xs font-medium text-[#888883]">Loading notifications...</p>
                        </div>
                    ) : currentList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[#888883] gap-1">
                            <p className="text-base">
                                {activeTab === "active"
                                    ? "No active notifications."
                                    : "No archived notifications."}
                            </p>
                        </div>
                    ) : (
                        currentList.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => {
                                    if (n.taskId) {
                                        onSelectTask(n.taskId, n.type === "COMMENT_MENTION" ? "comments" : "details");
                                    }
                                    if (!n.isRead) onMarkRead(n.id);
                                }}
                                className={`p-3 border transition-colors text-left cursor-pointer relative group ${n.isRead || activeTab === "archived"
                                    ? "bg-[#FAFAF9] border-[#E5E5E3] text-[#888883]"
                                    : "bg-white border-[#E5E5E3] hover:border-[#DADAD6] text-[#1A1A1A]"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <span
                                         className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-medium border ${getTypeBadge(getNotificationType(n))}`}
                                    >
                                        {getNotificationType(n).replace("_", " ")}
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        {!n.isRead &&
                                            activeTab === "active" && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onMarkRead(n.id);
                                                    }}
                                                    className="text-[9px] text-[#888883] hover:text-[#1A1A1A] font-medium"
                                                >
                                                    Mark read
                                                </button>
                                            )}

                                        {activeTab === "active" && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onArchiveNotification(n.id);
                                                }}
                                                title="Clear notification (Move to 30d Archive)"
                                                className="text-[9px] text-[#888883] hover:text-[#CB2431] font-medium px-1 py-0.5 hover:bg-[#FFF5F5] rounded-[2px] transition-colors"
                                            >
                                                Archive
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p className="text-[11px] leading-relaxed font-medium">
                                    {n.content}
                                </p>

                                <div className="text-[9px] text-[#888883] mt-1.5 flex justify-between items-center">
                                    <span>
                                        {new Date(
                                            n.createdAt,
                                        ).toLocaleDateString([], {
                                            month: "short",
                                            day: "numeric",
                                        })}{" "}
                                        at{" "}
                                        {new Date(
                                            n.createdAt,
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                    {n.taskId && (
                                        <span className="text-[#1A1A1A] hover:underline">
                                            View task →
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoadingMore && (
                        <div className="py-2 flex justify-center items-center gap-1.5 text-[#888883] border-t border-[#E5E5E3]/30 mt-1">
                            <Loader2 className="w-3 h-3 animate-spin text-[#1A1A1A]" />
                            <span className="text-[10px] font-medium">Loading more...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
