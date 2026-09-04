"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "../context/WorkspaceContext";

export interface NotificationToast {
    id: string;
    notification: {
        id: string;
        content: string;
        type: string;
        taskId?: string;
        createdAt: string;
    };
}

interface NotificationToastsProps {
    toasts: NotificationToast[];
    onDismiss: (id: string) => void;
    onSelectTask?: (taskId: string, tab?: "comments" | "details" | "attachments") => void;
}

export default function NotificationToasts({ toasts, onDismiss, onSelectTask }: NotificationToastsProps) {
    const router = useRouter();
    const { setIsManageInvitationsOpen, setIsManageFoldersOpen } = useWorkspace();

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

    const getTypeBadgeClass = (type: string) => {
        if (type === "PROJECT_INVITATION" || type === "PROJECT_INVITATION_ACCEPTED") {
            return "border-[#7C3AED]/30 text-[#7C3AED] bg-[#7C3AED]/10 font-bold";
        }
        if (type.includes("PROJECT") && type.includes("COMMENT")) {
            return "border-[#7C3AED]/30 text-[#7C3AED] bg-[#7C3AED]/10 font-bold";
        }
        if (type === "TASK_ASSIGNED" || type === "TASK_REASSIGNED" || type === "TASK_CREATED" || type.includes("ASSIGNED")) {
            return "border-[var(--color-success)]/30 text-[var(--color-success)] bg-[var(--color-success)]/10 font-bold";
        }
        if (type === "MEMBER_ADDED" || type === "MEMBER_INVITED" || type === "ROLE_UPDATED") {
            return "border-[var(--color-warning)]/30 text-[var(--color-warning)] bg-[var(--color-warning)]/10 font-bold";
        }
        if (type === "COMMENT_MENTION") {
            return "border-[var(--app-border-strong)] text-[var(--app-text)] bg-[var(--app-card)] font-bold";
        }
        if (type === "NEED_ATTENTION") {
            return "border-[var(--color-error)]/30 text-[var(--color-error)] bg-[var(--color-error)]/10 font-bold";
        }
        return "border-[var(--app-border)] text-[var(--app-muted)] bg-[var(--app-bg)]";
    };

    const handleNotificationClick = (n: any) => {
        const type = getNotificationType(n);
        const isProjectInvitation = type === "PROJECT_INVITATION" || type === "PROJECT_INVITATION_ACCEPTED";

        if (isProjectInvitation) {
            router.push("/projects");
            if (setIsManageFoldersOpen) setIsManageFoldersOpen(false);
            if (setIsManageInvitationsOpen) setIsManageInvitationsOpen(true);
            return;
        }

        const rawTaskId = n.taskId || "";

        if (rawTaskId.startsWith("project:")) {
            const parts = rawTaskId.split(":");
            const projectId = parts[1];
            const taskId = parts[3];
            const subtaskId = parts[5];

            if (projectId && taskId) {
                const url = `/projects/${projectId}/tasks/${taskId}${subtaskId ? `?subtaskId=${subtaskId}&tab=comments` : `?tab=comments`}`;
                router.push(url);
                return;
            } else if (projectId) {
                router.push(`/projects/${projectId}`);
                return;
            }
        }

        if (n.taskId && onSelectTask) {
            onSelectTask(
                n.taskId,
                n.type === "COMMENT_MENTION" || (n.type && n.type.includes("COMMENT")) ? "comments" : "details"
            );
        }
    };

    return (
        <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-3 pointer-events-none w-[340px] max-w-full">
            {toasts.map((toast) => {
                const type = getNotificationType(toast.notification);
                const isProjectInvitation = type === "PROJECT_INVITATION";

                return (
                    <div
                        key={toast.id}
                        onClick={() => {
                            handleNotificationClick(toast.notification);
                            onDismiss(toast.id);
                        }}
                        className={`pointer-events-auto w-full bg-[var(--app-card)] border border-[var(--app-border)] text-[var(--app-text)] px-4 py-3.5 shadow-md flex items-start gap-3 relative select-none corner-brackets animate-slide-in hover:border-[var(--app-border-strong)] transition-colors ${
                            toast.notification.taskId || isProjectInvitation ? "cursor-pointer" : "cursor-default"
                        }`}
                        style={{
                            boxShadow: "var(--shadow-float)",
                            borderRadius: "2px",
                        }}
                    >
                        <div className="flex-1 flex flex-col gap-1 text-left">
                            <div className="flex items-center justify-between">
                                <span className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-medium border ${getTypeBadgeClass(type)}`}>
                                    {type.replace(/_/g, " ")}
                                </span>
                                <span className="text-[10px] text-[var(--app-muted)]">Just now</span>
                            </div>
                            <p className="text-[11px] leading-relaxed font-semibold pr-2">
                                {toast.notification.content}
                            </p>
                            {isProjectInvitation && (
                                <span className="text-[9px] text-[#7C3AED] font-semibold mt-0.5 hover:underline inline-flex items-center gap-1">
                                    → View in Projects Collection
                                </span>
                            )}
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDismiss(toast.id);
                            }}
                            className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors text-[11px] font-medium shrink-0 pt-0.5"
                        >
                            ✕
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
