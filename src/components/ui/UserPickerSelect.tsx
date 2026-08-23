import React, { useState, useRef, useEffect } from "react";
import { User, api } from "../../api";
import { Search, ChevronDown, Check, Clock, Loader2 } from "lucide-react";

interface UserPickerSelectProps {
    users: User[];
    selectedUserId: string;
    onSelectUser: (userId: string) => void;
    recentUsers?: User[];
    placeholder?: string;
}

// Highlight matching text component
function HighlightMatch({ text, query }: { text: string; query: string }) {
    if (!query.trim() || !text) return <>{text}</>;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark
                        key={i}
                        className="bg-[#1A1A1A] text-white font-semibold px-0.5 rounded-[1px]"
                    >
                        {part}
                    </mark>
                ) : (
                    part
                ),
            )}
        </>
    );
}

export default function UserPickerSelect({
    users,
    selectedUserId,
    onSelectUser,
    recentUsers = [],
    placeholder = "Search or select existing member…",
}: UserPickerSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [apiUsers, setApiUsers] = useState<User[]>(users);
    const [isSearching, setIsSearching] = useState(false);
    const [visibleCount, setVisibleCount] = useState(5);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const selectedUser =
        users.find((u) => u.id === selectedUserId) ||
        apiUsers.find((u) => u.id === selectedUserId);

    // Sync initial users
    useEffect(() => {
        setApiUsers(users);
    }, [users]);

    // Live API searching when typing
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(async () => {
            if (!search.trim()) {
                setApiUsers(users);
                return;
            }
            setIsSearching(true);
            try {
                const results = await api.getUsers(search.trim());
                setApiUsers(results);
            } catch (e) {
                // Fallback to client filtering
                setApiUsers(
                    users.filter(
                        (u) =>
                            u.fullName
                                .toLowerCase()
                                .includes(search.toLowerCase()) ||
                            u.email
                                .toLowerCase()
                                .includes(search.toLowerCase()) ||
                            (u.designation &&
                                u.designation
                                    .toLowerCase()
                                    .includes(search.toLowerCase())),
                    ),
                );
            } finally {
                setIsSearching(false);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [search, isOpen, users]);

    // Reset pagination when search changes
    useEffect(() => {
        setVisibleCount(5);
    }, [search]);

    // Infinite scrolling handler (loads +5 when browsing near bottom)
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } =
            scrollContainerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 30) {
            setVisibleCount((prev) => Math.min(prev + 5, apiUsers.length));
        }
    };

    // Get 5 recent members
    const topRecentUsers = recentUsers.slice(0, 5);
    const visibleUsersList = apiUsers.slice(0, visibleCount);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div
            ref={dropdownRef}
            className="relative w-full text-left select-none"
        >
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-[#E5E5E3] hover:border-[#1A1A1A] rounded-[3px] px-2.5 py-1.5 text-[11px] text-[#1A1A1A] flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
                {selectedUser ? (
                    <div className="flex items-center gap-2 min-w-0">
                        {selectedUser.avatarUrl ? (
                            <img
                                src={selectedUser.avatarUrl}
                                alt={selectedUser.fullName}
                                className="w-4 h-4 rounded-[2px] object-cover border border-[#E5E5E3] shrink-0"
                            />
                        ) : (
                            <div className="w-4 h-4 rounded-[2px] border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-[7px] font-bold text-[#1A1A1A] shrink-0">
                                {selectedUser.fullName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </div>
                        )}
                        <span className="font-medium truncate">
                            {selectedUser.fullName}
                        </span>
                        <span className="text-[9px] text-[#888883] truncate">
                            ({selectedUser.email})
                        </span>
                    </div>
                ) : (
                    <span className="text-[#888883] text-[11px]">
                        {placeholder}
                    </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-[#888883] shrink-0" />
            </button>

            {/* Dropdown Popup */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E5E5E3] rounded-[3px] shadow-2xl z-[100] p-2.5 flex flex-col gap-2 animate-fade-in corner-brackets max-h-64 overflow-hidden">
                    {/* API Search Bar */}
                    <div className="relative shrink-0">
                        <Search className="w-3.5 h-3.5 text-[#888883] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search via API by name, email or title…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[2px] pl-7 pr-7 py-1 text-[11px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                            autoFocus
                        />
                        {isSearching && (
                            <Loader2 className="w-3 h-3 text-[#888883] animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                        )}
                    </div>

                    {/* 5 Recent Members View */}
                    {!search && topRecentUsers.length > 0 && (
                        <div className="flex flex-col gap-1 shrink-0 pb-1.5 border-b border-[#E5E5E3]">
                            <span className="text-[9px] font-semibold text-[#888883] flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-[#888883]" />{" "}
                                5 Recent Members
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {topRecentUsers.map((u) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => {
                                            onSelectUser(u.id);
                                            setIsOpen(false);
                                        }}
                                        className={`px-2 py-1 border rounded-[2px] text-base flex items-center gap-1.5 transition-colors cursor-pointer ${selectedUserId === u.id
                                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                                            : "bg-[#FAFAF9] hover:bg-white text-[#1A1A1A] border-[#E5E5E3]"
                                            }`}
                                    >
                                        {u.avatarUrl ? (
                                            <img
                                                src={u.avatarUrl}
                                                alt={u.fullName}
                                                className="w-3.5 h-3.5 rounded-[2px] object-cover"
                                            />
                                        ) : (
                                            <span className="font-bold text-[8px]">
                                                {u.fullName
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </span>
                                        )}
                                        <span className="truncate max-w-[80px]">
                                            {u.fullName}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Infinite Scrolling User List */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto divide-y divide-[#E5E5E3]/60 max-h-40 pr-1 text-left"
                    >
                        {apiUsers.length === 0 ? (
                            <div className="py-4 text-center text-base text-[#888883] italic">
                                {isSearching
                                    ? "Searching members…"
                                    : "No matching members found."}
                            </div>
                        ) : (
                            <>
                                {visibleUsersList.map((u) => {
                                    const isSelected = u.id === selectedUserId;
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => {
                                                onSelectUser(u.id);
                                                setIsOpen(false);
                                            }}
                                            className={`p-2 flex items-center justify-between gap-2 transition-colors cursor-pointer ${isSelected
                                                ? "bg-[#F5F5F3]"
                                                : "hover:bg-[#FAFAF9]"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                {u.avatarUrl ? (
                                                    <img
                                                        src={u.avatarUrl}
                                                        alt={u.fullName}
                                                        className="w-6 h-6 rounded-[2px] object-cover border border-[#E5E5E3] shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-[2px] border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-[8px] font-semibold text-[#1A1A1A] shrink-0">
                                                        {u.fullName
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <span className="text-[11px] font-medium text-[#1A1A1A] block truncate">
                                                        <HighlightMatch
                                                            text={u.fullName}
                                                            query={search}
                                                        />
                                                    </span>
                                                    <span className="text-[9px] text-[#888883] block truncate">
                                                        <HighlightMatch
                                                            text={u.email}
                                                            query={search}
                                                        />
                                                        {u.designation && (
                                                            <>
                                                                {" "}
                                                                •{" "}
                                                                <HighlightMatch
                                                                    text={
                                                                        u.designation
                                                                    }
                                                                    query={
                                                                        search
                                                                    }
                                                                />
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                                {visibleCount < apiUsers.length && (
                                    <div className="py-2 text-center text-[9px] text-[#888883] italic">
                                        Scroll down for more (
                                        {apiUsers.length - visibleCount}{" "}
                                        remaining)…
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
