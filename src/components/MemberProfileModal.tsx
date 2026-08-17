import React from "react";
import { User, Task, api } from "../api";
import {
    X,
    Mail,
    Phone,
    Globe,
    Send,
    Briefcase,
    CheckCircle2,
    Clock,
    UserCheck,
    Droplet,
    MessageSquare,
} from "lucide-react";

interface MemberProfileModalProps {
    user: User | null;
    userRole?: string;
    isOpen: boolean;
    onClose: () => void;
    tasks?: Task[];
    onSelectTask?: (taskId: string) => void;
}

export default function MemberProfileModal({
    user,
    userRole = "MEMBER",
    isOpen,
    onClose,
    tasks = [],
    onSelectTask,
}: MemberProfileModalProps) {
    if (!isOpen || !user) return null;

    const userTasks = tasks.filter(
        (t) => t.assignedToId === user.id && !t.isSoftDeleted && !t.isArchived,
    );
    const completedTasks = userTasks.filter((t) => t.column?.isComplete);
    const pendingTasks = userTasks.filter((t) => !t.column?.isComplete);

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "LEADER":
                return "text-[#CB2431] bg-[#CB2431]/10 border-[#CB2431]/20";
            case "OBSERVER":
                return "text-[#B08800] bg-[#B08800]/10 border-[#B08800]/20";
            default:
                return "text-[#22863A] bg-[#22863A]/10 border-[#22863A]/20";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "URGENT":
                return "border-l-2 border-l-[#CB2431] text-[#CB2431]";
            case "HIGH":
                return "border-l-2 border-l-[#B08800] text-[#B08800]";
            case "MEDIUM":
                return "border-l-2 border-l-[#1A1A1A] text-[#1A1A1A]";
            default:
                return "border-l-2 border-l-[#DADAD6] text-[#888883]";
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center p-4 select-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* LinkedIn Style Profile Card with Corner Brackets */}
            <div className="relative bg-white border border-[#E5E5E3] w-full max-w-lg flex flex-col overflow-hidden animate-fade-in corner-brackets shadow-2xl z-10 text-left max-h-[90vh]">
                {/* Cover Banner */}
                <div className="h-28 bg-gradient-to-r from-[#1A1A1A] via-[#333333] to-[#1A1A1A] relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-20 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                </div>

                {/* Avatar & Main Info Header */}
                <div className="px-5 pb-4 pt-0 relative border-b border-[#E5E5E3] shrink-0 bg-white">
                    <div className="flex justify-between items-end -mt-12 mb-3">
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-24 h-24 rounded-[4px] object-cover border-4 border-white shadow-md bg-white shrink-0"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-[4px] border-4 border-white bg-[#FAFAF9] flex items-center justify-center text-2xl font-heading text-[#1A1A1A] font-bold shadow-md shrink-0">
                                {user.name
                                    ? user.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()
                                          .slice(0, 2)
                                    : "U"}
                            </div>
                        )}

                        <div className="text-right flex flex-col items-end gap-1.5 mb-1">
                            <span
                                className={`px-2.5 py-0.5 rounded-[2px] border text-[9px] font-semibold capitalize tracking-[0.05em] ${getRoleBadge(userRole)}`}
                            >
                                {userRole}
                            </span>
                            <span className="text-[11px] font-medium text-[#1A1A1A] bg-[#FAFAF9] border border-[#E5E5E3] px-2 py-0.5 rounded-[2px] flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-[#888883]" />
                                {user.designation || "Team Member"}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <h2 className="font-heading text-lg text-[#1A1A1A]">
                            {user.name}
                        </h2>
                        <p className="text-[11px] text-[#888883] flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 shrink-0 text-[#888883]" />
                            {user.email}
                        </p>
                    </div>

                    {user.bio && (
                        <p className="text-[11px] text-[#1A1A1A] leading-relaxed mt-2.5 pt-2 border-t border-[#E5E5E3]/60 italic">
                            "{user.bio}"
                        </p>
                    )}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#FAFAF9]">
                    {/* Performance Stats Cards */}
                    <div className="grid grid-cols-3 gap-2.5">
                        <div className="bg-white border border-[#E5E5E3] p-3 flex flex-col items-center justify-center text-center rounded-[3px]">
                            <span className="text-base font-bold text-[#1A1A1A] tabular-nums">
                                {userTasks.length}
                            </span>
                            <span className="text-[9px] text-[#888883] font-medium mt-0.5 font-sans">
                                Total Tasks
                            </span>
                        </div>
                        <div className="bg-white border border-[#E5E5E3] p-3 flex flex-col items-center justify-center text-center rounded-[3px]">
                            <span className="text-base font-bold text-[#22863A] tabular-nums">
                                {completedTasks.length}
                            </span>
                            <span className="text-[9px] text-[#888883] font-medium capitalize tracking-[0.05em] mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#22863A]" />{" "}
                                Done
                            </span>
                        </div>
                        <div className="bg-white border border-[#E5E5E3] p-3 flex flex-col items-center justify-center text-center rounded-[3px]">
                            <span className="text-base font-bold text-[#B08800] tabular-nums">
                                {pendingTasks.length}
                            </span>
                            <span className="text-[9px] text-[#888883] font-medium capitalize tracking-[0.05em] mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#B08800]" /> In
                                Progress
                            </span>
                        </div>
                    </div>

                    {/* Contact & Professional Details */}
                    <div className="bg-white border border-[#E5E5E3] p-3.5 flex flex-col gap-2.5 rounded-[3px]">
                        <h3 className="eyebrow text-[#888883]">
                            Contact & Links
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {user.primaryPhone && (
                                <div className="flex items-center gap-2 text-[#1A1A1A]">
                                    <Phone className="w-3.5 h-3.5 text-[#888883] shrink-0" />
                                    <span className="truncate">
                                        {user.primaryPhone}
                                    </span>
                                </div>
                            )}
                            {user.github && (
                                <a
                                    href={`https://github.com/${user.github.replace("@", "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-[#1A1A1A] hover:underline"
                                >
                                    <Globe className="w-3.5 h-3.5 text-[#888883] shrink-0" />
                                    <span className="truncate">
                                        github.com/
                                        {user.github.replace("@", "")}
                                    </span>
                                </a>
                            )}
                            {user.telegram && (
                                <div className="flex items-center gap-2 text-[#1A1A1A]">
                                    <Send className="w-3.5 h-3.5 text-[#888883] shrink-0" />
                                    <span className="truncate">
                                        {user.telegram}
                                    </span>
                                </div>
                            )}
                            {user.bloodGroup && (
                                <div className="flex items-center gap-2 text-[#1A1A1A]">
                                    <Droplet className="w-3.5 h-3.5 text-[#CB2431] shrink-0" />
                                    <span className="truncate">
                                        Blood Group: {user.bloodGroup}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Assigned Tasks in Team */}
                    {userTasks.length > 0 && (
                        <div className="bg-white border border-[#E5E5E3] p-3.5 flex flex-col gap-2 rounded-[3px]">
                            <h3 className="eyebrow text-[#888883]">
                                Active Assigned Tasks ({userTasks.length})
                            </h3>
                            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                                {userTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => {
                                            if (onSelectTask) {
                                                onClose();
                                                onSelectTask(task.id);
                                            }
                                        }}
                                        className={`p-2 border border-[#E5E5E3] rounded-[2px] bg-[#FAFAF9] hover:bg-white transition-colors cursor-pointer flex justify-between items-center ${getPriorityColor(task.priority)}`}
                                    >
                                        <div className="min-w-0 pr-2">
                                            <span className="text-[11px] font-medium text-[#1A1A1A] block truncate">
                                                {task.title}
                                            </span>
                                            <span className="text-[9px] text-[#888883] block truncate">
                                                {task.column?.name}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-semibold text-[#888883] shrink-0">
                                            {task.priority}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
