"use client";

import React, { useState, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import {
    Link2,
    Unlink,
    ExternalLink,
    Check,
    X,
} from "lucide-react";

interface TipTapLinkMenuProps {
    editor: Editor;
}

export const TipTapLinkMenu: React.FC<TipTapLinkMenuProps> = ({ editor }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [displayText, setDisplayText] = useState("");
    const [openInNewTab, setOpenInNewTab] = useState(true);
    const [selectedTextSnapshot, setSelectedTextSnapshot] = useState("");
    
    const menuRef = useRef<HTMLDivElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);

    const isLinkActive = editor.isActive("link");

    const formatUrl = (rawUrl: string): string => {
        const trimmed = rawUrl.trim();
        if (!trimmed) return "";
        if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)) {
            return trimmed;
        }
        return `https://${trimmed}`;
    };

    const handleOpen = () => {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, " ");
        const href = editor.getAttributes("link").href || "";
        const target = editor.getAttributes("link").target;

        setUrl(href);
        setDisplayText(text);
        setSelectedTextSnapshot(text);
        setOpenInNewTab(target !== "_self");
        setIsOpen(true);
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                if (urlInputRef.current) {
                    urlInputRef.current.focus();
                    urlInputRef.current.select();
                }
            });
        }
    }, [isOpen]);

    // Handle Ctrl+K / Cmd+K when editor is focused
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                if (editor.isFocused || isOpen) {
                    e.preventDefault();
                    if (isOpen) {
                        setIsOpen(false);
                    } else {
                        handleOpen();
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [editor, isOpen]);

    const handleApply = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmedUrl = url.trim();

        if (!trimmedUrl) {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            setIsOpen(false);
            return;
        }

        const finalUrl = formatUrl(trimmedUrl);
        const target = openInNewTab ? "_blank" : undefined;
        const rel = openInNewTab ? "noopener noreferrer" : undefined;

        const textToInsert = displayText.trim();

        if (textToInsert && textToInsert !== selectedTextSnapshot) {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .insertContent({
                    type: "text",
                    text: textToInsert,
                    marks: [
                        {
                            type: "link",
                            attrs: { href: finalUrl, target, rel, class: "tiptap-link" },
                        },
                    ],
                })
                .run();
        } else if (!selectedTextSnapshot && textToInsert) {
            editor
                .chain()
                .focus()
                .insertContent({
                    type: "text",
                    text: textToInsert,
                    marks: [
                        {
                            type: "link",
                            attrs: { href: finalUrl, target, rel, class: "tiptap-link" },
                        },
                    ],
                })
                .run();
        } else {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: finalUrl, target, rel, class: "tiptap-link" })
                .run();
        }

        setIsOpen(false);
    };

    const handleUnlink = () => {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        setIsOpen(false);
    };

    const currentHref = editor.getAttributes("link").href;

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                type="button"
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
                onClick={() => {
                    if (isOpen) {
                        setIsOpen(false);
                    } else {
                        handleOpen();
                    }
                }}
                className={`p-1 rounded-[2px] transition-colors cursor-pointer flex items-center justify-center ${
                    isLinkActive || isOpen
                        ? "bg-[var(--app-select-bg)] text-[var(--color-accent)] font-semibold"
                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50"
                }`}
                title="Hyperlink (Ctrl+K)"
            >
                <Link2 className="w-3.5 h-3.5" />
            </button>

            {isOpen && (
                <div
                    className="absolute top-full left-0 mt-1.5 z-50 w-72 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[4px] shadow-xl p-3 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-100"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            e.preventDefault();
                            setIsOpen(false);
                            editor.commands.focus();
                        }
                    }}
                >
                    <div className="flex items-center justify-between pb-1.5 border-b border-[var(--app-border)]">
                        <span className="text-[11px] font-semibold text-[var(--app-text)] flex items-center gap-1.5">
                            <Link2 className="w-3 h-3 text-[var(--color-accent)]" />
                            {isLinkActive ? "Edit Hyperlink" : "Insert Hyperlink"}
                        </span>
                        <div className="flex items-center gap-1">
                            {currentHref && (
                                <a
                                    href={currentHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors"
                                    title="Open link in new tab"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                                title="Close"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleApply} className="flex flex-col gap-2">
                        {/* URL Input */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-[var(--app-muted)]">
                                Link URL:
                            </label>
                            <input
                                ref={urlInputRef}
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="w-full px-2 py-1 text-[11px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[3px] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                            />
                        </div>

                        {/* Display Text Input */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-[var(--app-muted)]">
                                Text to Display:
                            </label>
                            <input
                                type="text"
                                value={displayText}
                                onChange={(e) => setDisplayText(e.target.value)}
                                placeholder={selectedTextSnapshot || "Link text (optional)"}
                                className="w-full px-2 py-1 text-[11px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[3px] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                            />
                        </div>

                        {/* Options */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[var(--app-muted)] select-none pt-0.5">
                            <input
                                type="checkbox"
                                checked={openInNewTab}
                                onChange={(e) => setOpenInNewTab(e.target.checked)}
                                className="rounded-[2px] border-[var(--app-border)] text-[var(--color-accent)] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                            />
                            <span>Open in new tab</span>
                        </label>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-[var(--app-border)] mt-1">
                            <div>
                                {isLinkActive && (
                                    <button
                                        type="button"
                                        onClick={handleUnlink}
                                        className="px-2 py-1 text-[10px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Remove hyperlink"
                                    >
                                        <Unlink className="w-3 h-3" />
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5 ml-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-2 py-1 text-[10px] font-medium text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 rounded-[2px] transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-2.5 py-1 text-[10px] font-medium bg-[var(--color-accent)] text-white rounded-[2px] hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
                                >
                                    <Check className="w-3 h-3" />
                                    Save
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
