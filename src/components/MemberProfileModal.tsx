import React from "react";
import { User, Task } from "../api";
import {
    X,
    Mail,
    Phone,
    Globe,
    Send,
    Briefcase,
    Droplet,
} from "lucide-react";

interface MemberProfileModalProps {
    user: User | null;
    userRole?: string;
    isOpen: boolean;
    onClose: () => void;
    tasks?: Task[];
    onSelectTask?: (taskId: string) => void;
}

// Hand-picked Unsplash URLs that perfectly match the paper/stone/charcoal/minimalist theme
const THEME_COVER_PHOTOS = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&h=300&q=80", // Concrete architecture
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&h=300&q=80", // Editorial shadows & lines
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&h=300&q=80", // Minimalist stone/plaster structure
    "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&h=300&q=80", // Editorial textured paper
    "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&h=300&q=80", // Raw stone texture
    "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&h=300&q=80", // Charcoal waves
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&h=300&q=80", // Brutalist structures
    "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&h=300&q=80", // Wabi-sabi paper stack
    "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&h=300&q=80", // Concrete plaster wall
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&h=300&q=80"  // Slate ink wash
];

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
        const normalized = (role || "").toUpperCase();
        switch (normalized) {
            case "MANAGER":
                return "text-[#7C3AED] bg-[#7C3AED]/10 border-[#7C3AED]/20";
            case "LEADER":
                return "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20";
            case "OBSERVER":
            case "VIEWER":
                return "text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20";
            default:
                return "text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20";
        }
    };

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case "URGENT":
                return "text-[var(--priority-urgent)] bg-[var(--priority-urgent)]/10 border-[var(--priority-urgent)]/20";
            case "HIGH":
                return "text-[var(--priority-high)] bg-[var(--priority-high)]/10 border-[var(--priority-high)]/20";
            case "MEDIUM":
                return "text-[var(--priority-medium)] bg-[var(--priority-medium)]/10 border-[var(--priority-medium)]/20";
            default:
                return "text-[var(--priority-low)] bg-[var(--priority-low)]/10 border-[var(--priority-low)]/20";
        }
    };

    const displayName = user.fullName || user.name || "User";
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U";

    // Select cover photo based on user ID or email hash to maintain stability
    const getDeterministicCover = (id: string) => {
        let sum = 0;
        for (let i = 0; i < id.length; i++) {
            sum += id.charCodeAt(i);
        }
        return THEME_COVER_PHOTOS[sum % THEME_COVER_PHOTOS.length];
    };

    const coverPhotoUrl = getDeterministicCover(user.id || user.email || displayName || "default");

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center p-4 select-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Custom Styled Profile Card with corner brackets */}
            <div
                className="relative bg-[var(--app-card)] border border-[var(--app-border-strong)] w-full max-w-md flex flex-col animate-fade-in corner-brackets shadow-2xl z-10 text-left max-h-[90vh] rounded-[3px] overflow-hidden"
                style={{ boxShadow: "var(--shadow-float)" }}
            >
                {/* Cover Photo Header */}
                <div className="h-28 w-full relative shrink-0 overflow-hidden border-b border-[var(--app-border)] bg-[var(--app-bg)]">
                    <img
                        src={coverPhotoUrl}
                        alt="Profile cover"
                        className="w-full h-full object-cover filter grayscale contrast-110 opacity-80"
                    />
                    {/* Floating Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-white hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-1.5 transition-colors z-20 cursor-pointer shadow-sm"
                        title="Close profile"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                    {/* Subtle top overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                </div>

                {/* Header Information */}
                <div className="p-5 relative border-b border-[var(--app-border)] shrink-0 bg-[var(--app-card)]">
                    <div className="flex items-start gap-4">
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={displayName}
                                className="w-16 h-16 rounded-[3px] object-cover border border-[var(--app-border)] bg-[var(--app-bg)] shrink-0 shadow-xs"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-[3px] border border-[var(--app-border)] bg-[var(--app-select-bg)] flex items-center justify-center text-xl font-heading text-[var(--app-text)] font-bold shadow-xs shrink-0">
                                {initials}
                            </div>
                        )}

                        <div className="flex flex-col gap-1 min-w-0 pr-8">
                            <h2 className="font-heading text-xl md:text-2xl text-[var(--app-text)] font-bold truncate">
                                {displayName}
                            </h2>
                            {user.email && (
                                <span className="text-[11px] text-[var(--app-muted)] truncate">{user.email}</span>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className={`px-2 py-0.5 rounded-[2px] border text-[9px] font-semibold font-mono capitalize ${getRoleBadge(userRole)}`}>
                                    {userRole}
                                </span>
                                {user.designation && (
                                    <span className="text-[10px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] border border-[var(--app-border)] px-2 py-0.5 rounded-[2px] flex items-center gap-1">
                                        <Briefcase className="w-3 h-3 text-[var(--app-muted)]" />
                                        {user.designation}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {user.bio && (
                        <div className="mt-3.5 text-[11px] text-[var(--app-muted)] italic leading-relaxed text-center w-full px-2">
                            "{user.bio.replace(/^["']|["']$/g, "")}"
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[var(--app-bg)] scrollbar-none rounded-b-[2px]">

                    {/* Merged Single Container Card */}
                    <div className="bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets flex flex-col rounded-[2px]">

                        {/* Section 1: Performance Stats */}
                        <div className="p-4 flex flex-col gap-3">
                            <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider block border-b border-[var(--app-border)] pb-1.5">
                                Task Statistics
                            </span>
                            <div className="grid grid-cols-3 divide-x divide-[var(--app-border)] text-center">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xl font-heading text-[var(--app-text)] tabular-nums font-semibold">
                                        {userTasks.length}
                                    </span>
                                    <span className="text-[9px] text-[var(--app-muted)] font-semibold capitalize">
                                        Total
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xl font-heading text-[var(--color-success)] tabular-nums font-semibold">
                                        {completedTasks.length}
                                    </span>
                                    <span className="text-[9px] text-[var(--app-muted)] font-semibold capitalize">
                                        Completed
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xl font-heading text-[var(--color-warning)] tabular-nums font-semibold">
                                        {pendingTasks.length}
                                    </span>
                                    <span className="text-[9px] text-[var(--app-muted)] font-semibold capitalize">
                                        Pending
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Contact & Professional Details */}
                        <div className="p-4 flex flex-col gap-3 border-t border-[var(--app-border)]">
                            <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider block border-b border-[var(--app-border)] pb-1.5">
                                Profile Details
                            </span>
                            <div className="flex flex-col gap-2 text-[11px]">
                                {user.email && (
                                    <div className="flex items-center justify-between py-1 border-b border-[var(--app-border)]/50">
                                        <span className="text-[var(--app-muted)] flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                            Email
                                        </span>
                                        <span className="text-[var(--app-text)] font-mono font-medium truncate max-w-[200px]" title={user.email}>
                                            {user.email}
                                        </span>
                                    </div>
                                )}
                                {user.primaryPhone && (
                                    <div className="flex items-center justify-between py-1 border-b border-[var(--app-border)]/50">
                                        <span className="text-[var(--app-muted)] flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                            Phone
                                        </span>
                                        <span className="text-[var(--app-text)] font-mono font-medium">
                                            {user.primaryPhone}
                                        </span>
                                    </div>
                                )}
                                {user.github && (
                                    <div className="flex items-center justify-between py-1 border-b border-[var(--app-border)]/50">
                                        <span className="text-[var(--app-muted)] flex items-center gap-1.5">
                                            <Globe className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                            GitHub
                                        </span>
                                        <a
                                            href={`https://github.com/${user.github.replace("@", "")}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[var(--app-text)] font-mono font-medium hover:underline hover:text-[var(--color-accent)]"
                                        >
                                            github.com/{user.github.replace("@", "")}
                                        </a>
                                    </div>
                                )}
                                {user.telegram && (
                                    <div className="flex items-center justify-between py-1 border-b border-[var(--app-border)]/50">
                                        <span className="text-[var(--app-muted)] flex items-center gap-1.5">
                                            <Send className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                            Telegram
                                        </span>
                                        <span className="text-[var(--app-text)] font-mono font-medium">
                                            {user.telegram}
                                        </span>
                                    </div>
                                )}
                                {user.bloodGroup && (
                                    <div className="flex items-center justify-between py-1 border-b border-[var(--app-border)]/50">
                                        <span className="text-[var(--color-error)] flex items-center gap-1.5">
                                            <Droplet className="w-3.5 h-3.5 text-[var(--color-error)]" />
                                            Blood Group
                                        </span>
                                        <span className="text-[var(--color-error)] font-mono font-semibold">
                                            {user.bloodGroup}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Assigned Tasks list (if any exist) */}
                        {userTasks.length > 0 && (
                            <div className="p-4 flex flex-col gap-3 border-t border-[var(--app-border)]">
                                <span className="text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider block border-b border-[var(--app-border)] pb-1.5">
                                    Active Tasks ({userTasks.length})
                                </span>
                                <div className="flex flex-col divide-y divide-[var(--app-border)] max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                                    {userTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            onClick={() => {
                                                if (onSelectTask) {
                                                    onClose();
                                                    onSelectTask(task.id);
                                                }
                                            }}
                                            className="group py-2 flex justify-between items-center cursor-pointer hover:bg-[var(--app-hover-bg)] px-1.5 rounded-[2px] transition-colors"
                                        >
                                            <div className="min-w-0 pr-3">
                                                <span className="text-[12px] font-medium text-[var(--app-text)] group-hover:underline block truncate">
                                                    {task.title}
                                                </span>
                                                <span className="text-[9px] text-[var(--app-muted)] font-mono block capitalize mt-0.5">
                                                    {task.column?.name}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded-[2px] border ${getPriorityStyles(task.priority)}`}>
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
        </div>
    );
}
