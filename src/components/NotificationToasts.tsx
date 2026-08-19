"use client";

import React from "react";

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

    return (
        <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-3 pointer-events-none w-[340px] max-w-full">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    onClick={() => {
                        if (toast.notification.taskId && onSelectTask) {
                            onSelectTask(
                                toast.notification.taskId,
                                toast.notification.type === "COMMENT_MENTION" ? "comments" : "details"
                            );
                        }
                        onDismiss(toast.id);
                    }}
                    className={`pointer-events-auto w-full bg-white border border-[#E5E5E3] text-[#1A1A1A] px-4 py-3.5 shadow-md flex items-start gap-3 relative select-none corner-brackets animate-slide-in hover:border-[#DADAD6] transition-colors ${toast.notification.taskId && onSelectTask ? "cursor-pointer" : "cursor-default"}`}
                    style={{ 
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                        borderRadius: "2px"
                    }}
                >
                    <div className="flex-1 flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between">
                            <span className="px-1.5 py-0.5 rounded-[2px] text-[9px] font-medium border border-[#E5E5E3] text-[#888883] bg-[#FAFAF9]">
                                {getNotificationType(toast.notification).replace("_", " ")}
                            </span>
                            <span className="text-[10px] text-[#888883]">Just now</span>
                        </div>
                        <p className="text-[11px] leading-relaxed font-semibold pr-2">
                            {toast.notification.content}
                        </p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(toast.id);
                        }}
                        className="text-[#888883] hover:text-[#1A1A1A] transition-colors text-[11px] font-medium shrink-0 pt-0.5"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
