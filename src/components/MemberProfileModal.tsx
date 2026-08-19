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
        switch (role) {
            case "LEADER":
                return "text-[#CB2431] bg-[#CB2431]/10 border-[#CB2431]/20";
            case "OBSERVER":
                return "text-[#B08800] bg-[#B08800]/10 border-[#B08800]/20";
            default:
                return "text-[#22863A] bg-[#22863A]/10 border-[#22863A]/20";
        }
    };

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case "URGENT":
                return "text-[#CB2431] bg-[#CB2431]/10 border-[#CB2431]/20";
            case "HIGH":
                return "text-[#B08800] bg-[#B08800]/10 border-[#B08800]/20";
            case "MEDIUM":
                return "text-[#1A1A1A] bg-[#FAFAF9] border-[#E5E5E3]";
            default:
                return "text-[#888883] bg-[#FAFAF9] border-[#E5E5E3]";
        }
    };

    const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "U";

    // Select cover photo based on user ID or email hash to maintain stability
    const getDeterministicCover = (id: string) => {
        let sum = 0;
        for (let i = 0; i < id.length; i++) {
            sum += id.charCodeAt(i);
        }
        return THEME_COVER_PHOTOS[sum % THEME_COVER_PHOTOS.length];
    };

    const coverPhotoUrl = getDeterministicCover(user.id || user.email || "default");

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center p-4 select-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/45 transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Custom Styled Profile Card with corner brackets */}
            <div
                className="relative bg-white border border-[#E5E5E3] w-full max-w-md flex flex-col animate-fade-in corner-brackets shadow-2xl z-10 text-left max-h-[90vh]"
                style={{ boxShadow: "var(--shadow-float)" }}
            >
                {/* Unsplash Cover Photo Header (No overlap with avatar) */}
                <div className="h-28 w-full relative shrink-0 overflow-hidden border-b border-[#E5E5E3] bg-[#FAFAF9]">
                    <img
                        src={coverPhotoUrl}
                        alt="Profile cover"
                        className="w-full h-full object-cover filter grayscale contrast-110 opacity-90 mix-blend-multiply"
                    />
                    {/* Floating Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-white hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-1.5 transition-colors z-20 cursor-pointer shadow-sm"
                        title="Close profile"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                    {/* Subtle top overlay to make button stand out */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />
                </div>

                {/* Header Information (Sits cleanly below cover photo, no overlap) */}
                <div className="p-5 relative border-b border-[#E5E5E3] shrink-0 bg-white">
                    <div className="flex items-start gap-4">
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-16 h-16 rounded-[2px] object-cover border border-[#E5E5E3] bg-white shrink-0 shadow-xs"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-[2px] border border-[#E5E5E3] bg-[#FAFAF9] flex items-center justify-center text-xl font-heading text-[#1A1A1A] font-bold shadow-xs shrink-0">
                                {initials}
                            </div>
                        )}

                        <div className="flex flex-col gap-1 min-w-0 pr-8">
                            <h2 className="font-heading text-xl md:text-2xl text-[#1A1A1A]    truncate">
                                {user.name}
                            </h2>
                            <span className="text-[11px] text-[#888883] truncate">{user.email}</span>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className={`px-2 py-0.5 rounded-[2px] border text-[9px] font-semibold font-mono   capitalize ${getRoleBadge(userRole)}`}>
                                    {userRole}
                                </span>
                                {user.designation && (
                                    <span className="text-[10px] font-medium text-[#888883] bg-[#FAFAF9] border border-[#E5E5E3] px-2 py-0.5 rounded-[2px] flex items-center gap-1">
                                        <Briefcase className="w-3 h-3 text-[#888883]" />
                                        {user.designation}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {user.bio && (
                        <div className="mt-4 text-[11px] text-[#555555] italic leading-relaxed text-center w-full">
                            "{user.bio.replace(/^["']|["']$/g, "")}"
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#FAFAF9] scrollbar-none rounded-b-[2px]">

                    {/* Merged Single Container Card */}
                    <div className="bg-white border border-[#E5E5E3] corner-brackets flex flex-col">

                        {/* Section 1: Performance Stats */}
                        <div className="p-4 flex flex-col gap-3">
                            <span className="eyebrow block border-b border-[#F5F5F4] pb-1.5 capitalize  ">
                                Task Statistics
                            </span>
                            <div className="grid grid-cols-3 divide-x divide-[#E5E5E3] text-center">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xl font-heading text-[#1A1A1A] tabular-nums font-semibold">
                                        {userTasks.length}
                                    </span>
                                    <span className="text-[9px] text-[#888883] font-semibold capitalize  ">
                                        Total
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xl font-heading text-[#22863A] tabular-nums font-semibold">
                                        {completedTasks.length}
                                    </span>
                                    <span className="text-[9px] text-[#888883] font-semibold capitalize  ">
                                        Completed
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xl font-heading text-[#B08800] tabular-nums font-semibold">
                                        {pendingTasks.length}
                                    </span>
                                    <span className="text-[9px] text-[#888883] font-semibold capitalize  ">
                                        Pending
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Divider line 1 with Right T-bracket ┤ */}
                        <div className="relative w-full border-t border-[#E5E5E3]">
                            <div className="absolute -right-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 0V10M0 5H5" stroke="#1A1A1A" strokeWidth="1.5" />
                                </svg>
                            </div>
                        </div>

                        {/* Section 2: Contact & Professional Details */}
                        <div className="p-4 flex flex-col gap-3">
                            <span className="eyebrow block border-b border-[#F5F5F4] pb-1.5 capitalize  ">
                                Profile Details
                            </span>
                            <div className="flex flex-col gap-2 text-[11px]">
                                {user.email && (
                                    <div className="flex items-center justify-between py-1 border-b border-[#FAFAF9]">
                                        <span className="text-[#888883] flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-[#888883]" />
                                            Email
                                        </span>
                                        <span className="text-[#1A1A1A] font-mono font-medium truncate max-w-[200px]" title={user.email}>
                                            {user.email}
                                        </span>
                                    </div>
                                )}
                                {user.primaryPhone && (
                                    <div className="flex items-center justify-between py-1 border-b border-[#FAFAF9]">
                                        <span className="text-[#888883] flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-[#888883]" />
                                            Phone
                                        </span>
                                        <span className="text-[#1A1A1A] font-mono font-medium">
                                            {user.primaryPhone}
                                        </span>
                                    </div>
                                )}
                                {user.github && (
                                    <div className="flex items-center justify-between py-1 border-b border-[#FAFAF9]">
                                        <span className="text-[#888883] flex items-center gap-1.5">
                                            <Globe className="w-3.5 h-3.5 text-[#888883]" />
                                            GitHub
                                        </span>
                                        <a
                                            href={`https://github.com/${user.github.replace("@", "")}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[#1A1A1A] font-mono font-medium hover:underline hover:text-black"
                                        >
                                            github.com/{user.github.replace("@", "")}
                                        </a>
                                    </div>
                                )}
                                {user.telegram && (
                                    <div className="flex items-center justify-between py-1 border-b border-[#FAFAF9]">
                                        <span className="text-[#888883] flex items-center gap-1.5">
                                            <Send className="w-3.5 h-3.5 text-[#888883]" />
                                            Telegram
                                        </span>
                                        <span className="text-[#1A1A1A] font-mono font-medium">
                                            {user.telegram}
                                        </span>
                                    </div>
                                )}
                                {user.bloodGroup && (
                                    <div className="flex items-center justify-between py-1 border-b border-[#FAFAF9]">
                                        <span className="text-[#CB2431] flex items-center gap-1.5">
                                            <Droplet className="w-3.5 h-3.5 text-[#CB2431]" />
                                            Blood Group
                                        </span>
                                        <span className="text-[#CB2431] font-mono font-semibold">
                                            {user.bloodGroup}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Assigned Tasks list (if any exist) */}
                        {userTasks.length > 0 && (
                            <>
                                {/* Divider line 2 with Right T-bracket ┤ */}
                                <div className="relative w-full border-t border-[#E5E5E3]">
                                    <div className="absolute -right-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center">
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 0V10M0 5H5" stroke="#1A1A1A" strokeWidth="1.5" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col gap-3">
                                    <span className="eyebrow block border-b border-[#F5F5F4] pb-1.5 capitalize  ">
                                        Active Tasks ({userTasks.length})
                                    </span>
                                    <div className="flex flex-col divide-y divide-[#E5E5E3]/60 max-h-44 overflow-y-auto pr-1">
                                        {userTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                onClick={() => {
                                                    if (onSelectTask) {
                                                        onClose();
                                                        onSelectTask(task.id);
                                                    }
                                                }}
                                                className="group py-2 flex justify-between items-center cursor-pointer hover:bg-[#FAFAF9] px-1 transition-colors"
                                            >
                                                <div className="min-w-0 pr-3">
                                                    <span className="text-[12px] font-medium text-[#1A1A1A] group-hover:underline block truncate">
                                                        {task.title}
                                                    </span>
                                                    <span className="text-[9px] text-[#888883] font-mono block capitalize mt-0.5">
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
                            </>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
