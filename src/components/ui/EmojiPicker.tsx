"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface EmojiPickerProps {
    value: string;
    onChange: (emoji: string) => void;
    disabled?: boolean;
}

interface FetchedEmoji {
    char: string;
    name: string;
    category: string;
}

const EMOJI_CATEGORIES = [
    {
        name: "Smileys & People",
        emojis: ["👤", "🧑‍💻", "👨‍💻", "👩‍💻", "😊", "😎", "🚀", "💡", "💻", "🧠", "👥", "🤝", "👑", "🔥", "🎉", "🌟", "👀", "🙌", "✨"],
    },
    {
        name: "Office & Collaboration",
        emojis: ["🏢", "📅", "📈", "🎨", "🛠️", "🔑", "🏆", "📣", "📁", "📝", "📎", "✉️", "📌", "🎯", "⚙️", "🔒"],
    },
    {
        name: "Colors & Symbols",
        emojis: ["🔴", "🟢", "🔵", "🟡", "🟣", "⚫", "⚪", "◽", "🔸", "🔹", "📈", "📉", "✅", "❌", "⚠️", "ℹ️"],
    },
];

const CATEGORY_ICONS: Record<string, string> = {
    "smileys and people": "😊",
    "animals and nature": "🐱",
    "food and drink": "🍔",
    "travel and places": "🚗",
    "activities": "⚽",
    "objects": "💡",
    "symbols": "🔣",
    "flags": "🏁",
    "Smileys & People": "😊",
    "Office & Collaboration": "🏢",
    "Colors & Symbols": "🔣",
};

const formatCategoryName = (name: string) => {
    if (!name) return "";
    return name
        .replace(/and/g, "&")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
};

export function EmojiPicker({ value = "🧑‍💻", onChange, disabled = false }: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [fetchedCategories, setFetchedCategories] = useState<Record<string, string[]>>({});
    const [flatEmojis, setFlatEmojis] = useState<FetchedEmoji[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<string>("");
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const updateCoords = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const popoverHeight = 310; // Approx total height of popover
            const spaceBelow = window.innerHeight - rect.bottom;

            let topPosition = rect.bottom + window.scrollY;
            if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
                // Not enough space below, open upward instead
                topPosition = rect.top + window.scrollY - popoverHeight - 12;
            }

            setCoords({
                top: topPosition,
                left: rect.left + window.scrollX,
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener("scroll", updateCoords, true);
            window.addEventListener("resize", updateCoords);
        }
        return () => {
            window.removeEventListener("scroll", updateCoords, true);
            window.removeEventListener("resize", updateCoords);
        };
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                !(event.target as Element).closest(".emoji-picker-popover")
            ) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && Object.keys(fetchedCategories).length === 0) {
            setIsLoading(true);
            fetch("https://emojihub.yurace.pro/api/all")
                .then((res) => res.json())
                .then((data) => {
                    const groups: Record<string, string[]> = {};
                    const parsed: FetchedEmoji[] = [];
                    data.forEach((item: any) => {
                        try {
                            const cat = item.category || "other";
                            const emojiChar = String.fromCodePoint(
                                ...item.unicode.map((u: string) =>
                                    parseInt(u.replace("U+", ""), 16)
                                )
                            );
                            if (!groups[cat]) {
                                groups[cat] = [];
                            }
                            if (!groups[cat].includes(emojiChar)) {
                                groups[cat].push(emojiChar);
                                parsed.push({
                                    char: emojiChar,
                                    name: item.name.toLowerCase(),
                                    category: cat,
                                });
                            }
                        } catch (e) {
                            // skip
                        }
                    });
                    setFetchedCategories(groups);
                    setFlatEmojis(parsed);
                    if (Object.keys(groups).length > 0) {
                        setActiveTab(Object.keys(groups)[0]);
                    }
                })
                .catch((err) => {
                    console.error("Failed to fetch emojis from EmojiHub", err);
                    // Populate flat list from fallback
                    const fallback: FetchedEmoji[] = [];
                    EMOJI_CATEGORIES.forEach((cat) => {
                        cat.emojis.forEach((emoji) => {
                            fallback.push({
                                char: emoji,
                                name: cat.name.toLowerCase(),
                                category: cat.name,
                            });
                        });
                    });
                    setFlatEmojis(fallback);
                    setActiveTab(EMOJI_CATEGORIES[0].name);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isOpen, fetchedCategories]);

    // Active category emojis
    const displayedEmojis = fetchedCategories[activeTab] ||
        EMOJI_CATEGORIES.find((c) => c.name === activeTab)?.emojis || [];

    // Filtered search results
    const filteredEmojis = flatEmojis.filter((e) =>
        e.name.includes(searchQuery.toLowerCase())
    );

    return (
        <div ref={containerRef} className="relative inline-block text-left">
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className="w-[46px] h-[46px] rounded-[2px] border border-[var(--app-border)] bg-[var(--app-card)] hover:border-[var(--color-accent)] hover:bg-[var(--app-hover-bg)] flex items-center justify-center text-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed relative corner-brackets-4 emoji-font"
            >
                {value}
            </button>

            {isOpen && mounted && typeof document !== "undefined" && createPortal(
                <div
                    className="absolute bg-[var(--app-card)] border border-[var(--app-border)] shadow-xl rounded-[3px] p-3 z-[9999] animate-fade-in corner-brackets flex flex-col gap-2.5 emoji-picker-popover overflow-hidden"
                    style={{
                        boxShadow: "var(--shadow-float)",
                        top: `${coords.top + 6}px`,
                        left: `${coords.left}px`,
                        width: '350px',
                        overflowX: 'hidden'
                    }}
                >
                    {/* Search Bar */}
                    <div className="relative shrink-0">
                        <input
                            type="text"
                            placeholder="Search emojis..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] px-3.5 py-2 rounded-[2px] text-[11px] text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors leading-normal"
                        />
                    </div>

                    {/* Category Tabs (hidden during search) */}
                    {!searchQuery && !isLoading && (
                        <div className="flex gap-1.5 overflow-x-auto border-b border-[var(--app-border)] pb-2 scrollbar-none shrink-0 select-none">
                            {(Object.keys(fetchedCategories).length > 0
                                ? Object.keys(fetchedCategories)
                                : EMOJI_CATEGORIES.map((c) => c.name)
                            ).map((catName) => {
                                const icon = CATEGORY_ICONS[catName] || "😀";
                                const isActive = activeTab === catName;
                                return (
                                    <button
                                        key={catName}
                                        type="button"
                                        onClick={() => setActiveTab(catName)}
                                        title={formatCategoryName(catName)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-[2px] transition-colors cursor-pointer shrink-0 text-sm ${isActive
                                            ? "bg-[var(--app-hover-bg)] text-[var(--app-text)] border border-[var(--app-border)]"
                                            : "text-[var(--app-muted)] hover:bg-[var(--app-hover-bg)]/50"
                                            }`}
                                    >
                                        {icon}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Category Title */}
                    <div className="text-left shrink-0">
                        <span className="text-[8px] font-bold capitalize   text-[var(--app-muted)]">
                            {searchQuery ? "Search Results" : formatCategoryName(activeTab)}
                        </span>
                    </div>

                    {/* Scrollable Emojis Grid */}
                    <div className="flex-1 min-h-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-[10px] text-[var(--app-muted)] gap-2">
                                <div className="w-4 h-4 border-2 border-[var(--app-muted)] border-t-transparent rounded-full animate-spin" />
                                <span>Loading all emojis...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-8 gap-1 overflow-y-auto max-h-[190px] pr-0.5 scrollbar-thin">
                                {searchQuery ? (
                                    filteredEmojis.length > 0 ? (
                                        filteredEmojis.map((emoji) => (
                                            <button
                                                key={emoji.char + emoji.name}
                                                type="button"
                                                onClick={() => {
                                                    onChange(emoji.char);
                                                    setIsOpen(false);
                                                    setSearchQuery("");
                                                }}
                                                title={emoji.name}
                                                className="w-[34px] h-[34px] rounded-[2px] hover:bg-[var(--app-hover-bg)] flex items-center justify-center text-base transition-colors cursor-pointer emoji-font"
                                            >
                                                {emoji.char}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="col-span-8 py-10 text-center text-[10px] text-[var(--app-muted)]">
                                            No emojis found
                                        </div>
                                    )
                                ) : (
                                    displayedEmojis.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => {
                                                onChange(emoji);
                                                setIsOpen(false);
                                            }}
                                            className="w-[34px] h-[34px] rounded-[2px] hover:bg-[var(--app-hover-bg)] flex items-center justify-center text-base transition-colors cursor-pointer emoji-font"
                                        >
                                            {emoji}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
