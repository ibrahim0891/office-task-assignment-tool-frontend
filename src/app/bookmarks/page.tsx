"use client";

import React, { useState, useEffect, useRef } from "react";
import { api, Bookmark, getIframeProxyUrl } from "../../api";
import { Button } from "../../components/ui/Button";
import { useWorkspace } from "../../context/WorkspaceContext";
import toast from "react-hot-toast";
import {
    Plus, X, Edit2, Trash2, ExternalLink, Bookmark as BookmarkIcon,
    RefreshCw, Loader2, MoreVertical, Eye, ChevronDown
} from "lucide-react";

function getDomain(url: string) {
    try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}
function getFaviconUrl(url: string) {
    try {
        const u = new URL(url);
        // Specialized icons for Google Workspace apps & services
        if (url.includes("docs.google.com/spreadsheets") || url.includes("sheets.google.com")) {
            return "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_spreadsheet_x16.png";
        }
        if (url.includes("docs.google.com/document")) {
            return "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_document_x16.png";
        }
        if (url.includes("docs.google.com/presentation") || url.includes("slides.google.com")) {
            return "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_presentation_x16.png";
        }
        if (url.includes("docs.google.com/forms")) {
            return "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_form_x16.png";
        }
        if (u.hostname.includes("drive.google.com")) {
            return "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png";
        }
        return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
    } catch {
        return "";
    }
}
function getMicrolinkScreenshot(url: string) {
    return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
}

function BookmarkModal({ initial, onClose, onSave }: {
    initial?: Bookmark | null;
    onClose: () => void;
    onSave: (d: { title: string; url: string; description: string }) => Promise<void>;
}) {
    const [title, setTitle] = useState(initial?.title || "");
    const [url, setUrl] = useState(initial?.url || "");
    const [description, setDescription] = useState(initial?.description || "");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !url.trim()) { toast.error("Title and URL required"); return; }
        setSaving(true);
        try { await onSave({ title, url, description }); onClose(); }
        catch (e: any) { toast.error(e.message || "Failed"); setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[1px]">
            <div className="relative bg-white border border-[#E5E5E3] rounded-[3px] p-5 w-full max-w-md flex flex-col gap-4 corner-brackets">
                <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                    <div>
                        <span className="eyebrow uppercase tracking-[0.12em] text-[10px]">Bookmark</span>
                        <h3 className="text-sm font-semibold text-[#1A1A1A] font-heading">{initial ? "Edit Bookmark" : "Add Bookmark"}</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-[#888883] hover:text-[#1A1A1A] rounded-[2px] transition-colors cursor-pointer">
                        <X className="w-4 h-4"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="eyebrow">Title <span className="text-[#CB2431]">*</span></label>
                        <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. React Docs"
                            className="w-full px-3.5 py-2.5 border border-[#E5E5E3] hover:border-[#DADAD6] focus:border-[#1A1A1A] focus:outline-none text-[12px] bg-white rounded-[2px] transition-colors placeholder-[#BBBBBB]"/>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="eyebrow">URL <span className="text-[#CB2431]">*</span></label>
                        <input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…"
                            className="w-full px-3.5 py-2.5 border border-[#E5E5E3] hover:border-[#DADAD6] focus:border-[#1A1A1A] focus:outline-none text-[12px] bg-white rounded-[2px] transition-colors placeholder-[#BBBBBB]"/>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="eyebrow">Description</label>
                        <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} placeholder="Optional note…"
                            className="w-full px-3.5 py-2.5 border border-[#E5E5E3] hover:border-[#DADAD6] focus:border-[#1A1A1A] focus:outline-none text-[12px] bg-white rounded-[2px] transition-colors placeholder-[#BBBBBB] resize-none"/>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
                        <Button type="button" variant="ghost" size="md" onClick={onClose}>Cancel</Button>
                        <Button type="submit" size="md" showDot disabled={saving}>{saving ? "Saving…" : initial ? "Update" : "Add Bookmark"}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function isGoogleDocsLink(url: string) {
    return /docs\.google\.com|sheets\.google\.com|slides\.google\.com|drive\.google\.com/i.test(url);
}

export default function BookmarksPage() {
    const { currentUser, currentTeam, isClient } = useWorkspace();
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selected, setSelected] = useState<Bookmark | null>(null);
    const [iframeLoading, setIframeLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Bookmark | null>(null);
    const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "alpha-asc" | "alpha-desc">("date-desc");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const loadedForTeam = useRef<string | null>(null);

    useEffect(() => {
        if (!isClient || !currentTeam) return;
        if (loadedForTeam.current === currentTeam.id) return;
        loadedForTeam.current = currentTeam.id;
        setIsLoading(true);
        api.getBookmarks(currentTeam.id)
            .then(data => setBookmarks(data))
            .catch(() => toast.error("Failed to load bookmarks"))
            .finally(() => setIsLoading(false));
    }, [isClient, currentTeam?.id]);

    const handleSave = async (data: { title: string; url: string; description: string }) => {
        if (!currentUser || !currentTeam) return;
        if (editing) {
            const updated = await api.updateBookmark(editing.id, data);
            setBookmarks(prev => prev.map(b => b.id === updated.id ? updated : b));
            toast.success("Bookmark updated");
        } else {
            const created = await api.createBookmark({ ...data, teamId: currentTeam.id, createdById: currentUser.id });
            setBookmarks(prev => [created, ...prev]);
            toast.success("Bookmark added");
        }
        setEditing(null);
    };

    const handleDelete = async (bookmark: Bookmark) => {
        try {
            await api.deleteBookmark(bookmark.id);
            setBookmarks(prev => prev.filter(b => b.id !== bookmark.id));
            if (selected?.id === bookmark.id) setSelected(null);
            toast.success("Deleted");
        } catch { toast.error("Delete failed"); }
    };

    const sortedBookmarks = [...bookmarks].sort((a, b) => {
        if (sortBy === "date-desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "date-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === "alpha-asc") return a.title.localeCompare(b.title);
        if (sortBy === "alpha-desc") return b.title.localeCompare(a.title);
        return 0;
    });

    const isPreviewingDoc = selected && isGoogleDocsLink(selected.url);

    const [sortOpen, setSortOpen] = useState(false);

    const sortLabels: Record<string, string> = {
        "date-desc": "Newest First",
        "date-asc": "Oldest First",
        "alpha-asc": "Title: A → Z",
        "alpha-desc": "Title: Z → A",
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFAF9]">
            <div className="px-6 py-3 border-b border-[#E5E5E3] bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <span className="eyebrow uppercase tracking-[0.12em] text-[10px]">Bookmarks</span>
                    <span className="text-[11px] text-[#888883] font-medium">
                        {isLoading ? "Loading…" : `${bookmarks.length} saved link${bookmarks.length !== 1 ? "s" : ""}`}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Custom Select Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setSortOpen(o => !o)}
                            className="flex items-center gap-2 px-3 py-1.5 border border-[#E5E5E3] hover:border-[#1A1A1A] bg-white rounded-[2px] text-[11px] font-medium text-[#1A1A1A] transition-colors cursor-pointer"
                        >
                            <span>{sortLabels[sortBy]}</span>
                            <ChevronDown className={`w-3 h-3 text-[#888883] transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                        </button>

                        {sortOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                                <div className="absolute right-0 top-9 z-40 w-36 bg-white border border-[#E5E5E3] rounded-[2px] shadow-md py-1 flex flex-col text-[11px]">
                                    {Object.entries(sortLabels).map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => { setSortBy(key as any); setSortOpen(false); }}
                                            className={`w-full text-left px-3 py-1.5 hover:bg-[#FAFAF9] transition-colors cursor-pointer ${
                                                sortBy === key ? "font-semibold text-[#1A1A1A] bg-[#FAFAF9]" : "text-[#888883]"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => { setEditing(null); setModalOpen(true); }}
                        className="relative corner-brackets-4 px-3 py-1.5 border border-[#E5E5E3] rounded-[2px] bg-white text-[#1A1A1A] hover:bg-[#FAFAF9] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5"/> Add Bookmark
                    </button>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
                <div className={`overflow-y-auto p-4 ${isPreviewingDoc ? "w-64 shrink-0 border-r border-[#E5E5E3]" : "flex-1 p-6"}`}>
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="border border-[#E5E5E3] rounded-[3px] bg-white overflow-hidden flex flex-col h-48">
                                    <div className="h-28 shimmer"/>
                                    <div className="p-3 flex flex-col gap-2">
                                        <div className="h-3.5 shimmer rounded w-3/4"/>
                                        <div className="h-2.5 shimmer rounded w-1/2"/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sortedBookmarks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <BookmarkIcon className="w-10 h-10 text-[#E5E5E3] mb-3"/>
                            <h3 className="text-sm font-semibold text-[#1A1A1A]">No bookmarks saved yet</h3>
                            <p className="text-[12px] text-[#888883] mt-1 max-w-xs">Save important document links, Google Sheets, or web tools to your team workspace.</p>
                            <Button size="sm" showDot className="mt-4" onClick={() => setModalOpen(true)}>
                                Add First Bookmark
                            </Button>
                        </div>
                    ) : (
                        <div className={`grid gap-4.5 ${isPreviewingDoc ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}`}>
                            {sortedBookmarks.map(b => {
                                const isDoc = isGoogleDocsLink(b.url);
                                const isSelected = selected?.id === b.id;
                                const isMenuOpen = openMenuId === b.id;
                                return (
                                    <div
                                        key={b.id}
                                        onClick={() => {
                                            if (isDoc) {
                                                setSelected(isSelected ? null : b);
                                                setIframeLoading(true);
                                            } else {
                                                window.open(b.url, "_blank", "noopener,noreferrer");
                                            }
                                        }}
                                        className={`group relative bg-white border border-[#E5E5E3] rounded-[3px] overflow-hidden flex flex-col transition-all cursor-pointer hover:border-[#1A1A1A] hover:shadow-sm corner-brackets ${isSelected ? "ring-2 ring-[#1A1A1A] border-transparent" : ""}`}
                                    >
                                        <div className="relative w-full h-32 bg-[#FAFAF9] overflow-hidden border-b border-[#E5E5E3]">
                                            <CardScreenshot bookmark={b} />
                                            {/* Action Hover Buttons */}
                                            <div
                                                className={`absolute top-2 right-2 flex items-center gap-1 transition-opacity ${isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                {isDoc && (
                                                    <button
                                                        onClick={() => {
                                                            setSelected(isSelected ? null : b);
                                                            setIframeLoading(true);
                                                        }}
                                                        className="px-2 py-1 bg-[#1A1A1A] text-white text-[10px] font-medium rounded-[2px] shadow-sm transition-colors cursor-pointer flex items-center gap-1 hover:bg-[#333333]"
                                                        title="Preview document in split view"
                                                    >
                                                        <Eye className="w-3 h-3"/> Open Here
                                                    </button>
                                                )}
                                                <a
                                                    href={b.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 bg-white/90 backdrop-blur-sm border border-[#E5E5E3] text-[#1A1A1A] hover:bg-white rounded-[2px] shadow-sm transition-colors cursor-pointer"
                                                    title="Open in new tab"
                                                >
                                                    <ExternalLink className="w-3 h-3"/>
                                                </a>
                                                <button
                                                    onClick={() => setOpenMenuId(isMenuOpen ? null : b.id)}
                                                    className="p-1.5 bg-white/90 backdrop-blur-sm border border-[#E5E5E3] text-[#1A1A1A] hover:bg-white rounded-[2px] shadow-sm transition-colors cursor-pointer"
                                                    title="Actions"
                                                >
                                                    <MoreVertical className="w-3 h-3"/>
                                                </button>
                                                {isMenuOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)}/>
                                                        <div className="absolute right-0 top-7 z-40 w-28 bg-white border border-[#E5E5E3] rounded-[2px] shadow-md py-1 flex flex-col text-[11px]">
                                                            <button
                                                                onClick={() => { setOpenMenuId(null); setEditing(b); setModalOpen(true); }}
                                                                className="w-full text-left px-3 py-1.5 hover:bg-[#FAFAF9] text-[#1A1A1A] flex items-center gap-1.5 cursor-pointer"
                                                            >
                                                                <Edit2 className="w-3 h-3 text-[#888883]"/> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => { setOpenMenuId(null); handleDelete(b); }}
                                                                className="w-full text-left px-3 py-1.5 hover:bg-[#FAFAF9] text-[#CB2431] flex items-center gap-1.5 cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3 h-3 text-[#CB2431]"/> Delete
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <img src={getFaviconUrl(b.url)} alt="" className="w-4 h-4 rounded-[2px] shrink-0" onError={e=>(e.currentTarget.style.display="none")}/>
                                                    <h4 className="text-[12px] font-semibold text-[#1A1A1A] line-clamp-1 leading-snug">{b.title}</h4>
                                                </div>
                                                {b.description && (
                                                    <p className="text-[10px] text-[#888883] line-clamp-2 leading-relaxed pl-6">{b.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between pt-1 border-t border-[#F5F5F4] text-[10px] text-[#888883]">
                                                <span className="truncate">{getDomain(b.url)}</span>
                                                {isDoc && (
                                                    <span className="text-[9px] font-medium text-[#1A1A1A] underline">
                                                        {isSelected ? "Close Preview" : "Preview Doc →"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                {isPreviewingDoc && (
                    <div className="flex-1 min-w-0 flex flex-col bg-white overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-[#E5E5E3] bg-[#FAFAF9] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <img src={getFaviconUrl(selected.url)} alt="" className="w-4 h-4 rounded-[2px] shrink-0"/>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-[#1A1A1A] truncate">{selected.title}</p>
                                    <p className="text-[10px] text-[#888883] truncate">{selected.url}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {iframeLoading && <Loader2 className="w-3.5 h-3.5 text-[#888883] animate-spin"/>}
                                <a
                                    href={selected.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="relative corner-brackets-4 flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border border-[#E5E5E3] rounded-[2px] bg-white text-[#1A1A1A] hover:bg-[#FAFAF9] transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3"/> Open Tab
                                </a>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="p-1 text-[#888883] hover:text-[#1A1A1A] font-bold text-[13px] cursor-pointer"
                                    title="Close preview"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative bg-white">
                            {iframeLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#FAFAF9] z-10">
                                    <div className="flex flex-col items-center gap-2.5">
                                        <Loader2 className="w-6 h-6 text-[#888883] animate-spin"/>
                                        <p className="text-[11px] text-[#888883]">Loading Google Document…</p>
                                    </div>
                                </div>
                            )}
                            <iframe
                                key={selected.id}
                                src={selected.url}
                                className="w-full h-full border-0"
                                onLoad={() => setIframeLoading(false)}
                                allow="fullscreen; clipboard-read; clipboard-write; autoplay"
                                title={selected.title}
                            />
                        </div>
                    </div>
                )}
            </div>
            {(modalOpen || editing) && (
                <BookmarkModal
                    initial={editing}
                    onClose={() => { setModalOpen(false); setEditing(null); }}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

function CardScreenshot({ bookmark }: { bookmark: Bookmark }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const isDoc = isGoogleDocsLink(bookmark.url);

    // For Google Docs/Sheets links, render a live scaled iframe preview so local direct browser session shows
    if (isDoc) {
        return (
            <div className="relative w-full h-full bg-white overflow-hidden pointer-events-none select-none">
                {!loaded && <div className="absolute inset-0 shimmer z-10"/>}
                <iframe
                    src={bookmark.url}
                    className="w-[400%] h-[400%] border-0 origin-top-left scale-25 transform"
                    onLoad={() => setLoaded(true)}
                    title={bookmark.title}
                    tabIndex={-1}
                />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-[#F5F5F4] overflow-hidden">
            {!error ? (
                <>
                    {!loaded && <div className="absolute inset-0 shimmer"/>}
                    <img
                        src={getMicrolinkScreenshot(bookmark.url)}
                        alt=""
                        className={`w-full h-full object-cover object-top transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
                        onLoad={() => setLoaded(true)}
                        onError={() => setError(true)}
                    />
                </>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#FAFAF9]">
                    <img src={getFaviconUrl(bookmark.url)} alt="" className="w-8 h-8 opacity-40"/>
                </div>
            )}
        </div>
    );
}
