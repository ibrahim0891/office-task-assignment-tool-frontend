"use client";

import React, { useState, useEffect, useRef } from "react";
import { api, KnowledgeArticle } from "../../api";
import { TipTapEditor } from "../../components/ui/TipTapEditor";
import { Button } from "../../components/ui/Button";
import { useWorkspace } from "../../context/WorkspaceContext";
import toast from "react-hot-toast";
import { Plus, Columns2, Trash2, BookOpen, FilePen, Pencil, Printer } from "lucide-react";

export default function KnowledgePage() {
    const { currentUser, currentTeam, isClient } = useWorkspace();
    const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
    const [selected, setSelected] = useState<KnowledgeArticle | null>(null);
    const [title, setTitle] = useState("Untitled Article");
    const [content, setContent] = useState("");
    const [isDualPane, setIsDualPane] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [titleFont, setTitleFont] = useState("");
    const [isTitleFocused, setIsTitleFocused] = useState(false);
    const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
    const loadedForTeam = useRef<string | null>(null);

    // Helper to extract first 5 words from HTML content
    const deriveTitleFromContent = (html: string) => {
        if (!html) return "Untitled Article";
        const doc = new DOMParser().parseFromString(html, "text/html");
        const plainText = doc.body.textContent || "";
        const words = plainText.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return "Untitled Article";
        return words.slice(0, 5).join(" ");
    };

    const handleContentChange = (newHtml: string) => {
        setContent(newHtml);
        if (!isTitleManuallyEdited) {
            const derived = deriveTitleFromContent(newHtml);
            setTitle(derived);
        }
    };

    // Load articles whenever currentTeam becomes available and auto-select first document
    useEffect(() => {
        if (!isClient || !currentTeam) return;
        if (loadedForTeam.current === currentTeam.id) return;
        loadedForTeam.current = currentTeam.id;
        setIsLoading(true);
        api.getKnowledgeArticles(currentTeam.id)
            .then(data => {
                setArticles(data);
                if (data.length > 0) {
                    setSelected(data[0]);
                    setTitle(data[0].title);
                    setContent(data[0].content);
                    setIsTitleManuallyEdited(true);
                }
            })
            .catch(() => toast.error("Failed to load articles"))
            .finally(() => setIsLoading(false));
    }, [isClient, currentTeam?.id]);

    const isDirty = selected
        ? title !== selected.title || content !== selected.content
        : title.trim() !== "" || content !== "";

    const handleNew = () => {
        setSelected(null);
        setTitle("Untitled Article");
        setContent("");
        setIsTitleManuallyEdited(false);
    };
    const handleSelect = (a: KnowledgeArticle) => {
        setSelected(a);
        setTitle(a.title);
        setContent(a.content);
        setIsTitleManuallyEdited(true);
    };

    const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "alpha-asc" | "alpha-desc">("date-desc");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    // Sort articles
    const sortedArticles = [...articles].sort((a, b) => {
        if (sortBy === "date-desc") {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        if (sortBy === "date-asc") {
            return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        }
        if (sortBy === "alpha-asc") {
            return a.title.localeCompare(b.title);
        }
        if (sortBy === "alpha-desc") {
            return b.title.localeCompare(a.title);
        }
        return 0;
    });

    const totalPages = Math.max(1, Math.ceil(sortedArticles.length / ITEMS_PER_PAGE));
    const paginatedArticles = sortedArticles.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleCancel = () => {
        if (selected) {
            setTitle(selected.title);
            setContent(selected.content);
            setIsTitleManuallyEdited(true);
        } else {
            setTitle("Untitled Article");
            setContent("");
            setIsTitleManuallyEdited(false);
        }
    };

    const handleSave = async () => {
        if (!currentUser || !currentTeam) return;
        if (!title.trim()) { toast.error("Title is required"); return; }
        setIsSaving(true);
        try {
            if (selected) {
                const updated = await api.updateKnowledgeArticle(selected.id, { title, content });
                setSelected(updated);
                setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
                toast.success("Saved");
            } else {
                const created = await api.createKnowledgeArticle({ teamId: currentTeam.id, title, content, createdById: currentUser.id });
                setArticles(prev => [created, ...prev]);
                setSelected(created);
                toast.success("Article created");
            }
        } catch (e: any) { toast.error(e.message || "Save failed"); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async () => {
        if (!selected) return;
        try {
            await api.deleteKnowledgeArticle(selected.id);
            setArticles(prev => prev.filter(a => a.id !== selected.id));
            setSelected(null); setTitle("Untitled Article"); setContent("");
            toast.success("Article deleted");
        } catch { toast.error("Delete failed"); }
    };

    const isEditing = selected !== null || title !== "";

    return (
        <div className="flex-1 flex overflow-hidden bg-[#FAFAF9]">
            {/* ── Article List Rail ── */}
            <aside className="w-64 shrink-0 border-r border-[#E5E5E3] bg-white flex flex-col">
                {/* Rail Header */}
                <div className="px-4 py-3 border-b border-[#E5E5E3] flex items-center justify-between">
                    <span className="eyebrow uppercase tracking-[0.12em] text-[10px]">Docs & Knowledge Base</span>
                    <button onClick={handleNew} title="New article"
                        className="relative corner-brackets-4 p-1.5 border border-[#E5E5E3] rounded-[2px] bg-white text-[#1A1A1A] hover:bg-[#FAFAF9] transition-colors cursor-pointer">
                        <Plus className="w-3.5 h-3.5"/>
                    </button>
                </div>

                {/* List Section Controls: Count on left, Sort on right */}
                <div className="px-3 py-2 border-b border-[#E5E5E3] bg-[#FAFAF9] flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#888883] font-medium uppercase tracking-wider">
                        {isLoading ? "…" : `${articles.length} article${articles.length !== 1 ? "s" : ""}`}
                    </span>
                    <select
                        value={sortBy}
                        onChange={e => { setSortBy(e.target.value as any); setCurrentPage(1); }}
                        className="text-[10px] font-medium text-[#1A1A1A] bg-white border border-[#E5E5E3] rounded-[2px] px-1.5 py-0.5 outline-none cursor-pointer"
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="alpha-asc">A → Z</option>
                        <option value="alpha-desc">Z → A</option>
                    </select>
                </div>

                {/* Article List */}
                <div className="flex-1 overflow-y-auto scrollbar-none py-1">
                    {isLoading ? (
                        <div className="p-4 flex flex-col gap-2">{[1,2,3].map(i=><div key={i} className="h-8 shimmer rounded-[2px]"/>)}</div>
                    ) : paginatedArticles.length === 0 ? (
                        <div className="p-4 text-center">
                            <BookOpen className="w-6 h-6 text-[#E5E5E3] mx-auto mb-2"/>
                            <p className="text-[11px] text-[#888883]">No articles yet</p>
                            <button onClick={handleNew} className="mt-2 text-[11px] text-[#1A1A1A] underline cursor-pointer">Create one</button>
                        </div>
                    ) : paginatedArticles.map(a => (
                        <button key={a.id} onClick={() => handleSelect(a)}
                            className={`w-full text-left px-4 py-2.5 border-b border-[#F5F5F4] transition-colors cursor-pointer ${selected?.id===a.id ? "bg-[#FAFAF9] border-l-2 border-l-[#1A1A1A]" : "hover:bg-[#FAFAF9] border-l-2 border-l-transparent"}`}>
                            <p className="text-[12px] font-medium text-[#1A1A1A] truncate">{a.title}</p>
                            <p className="text-[10px] text-[#888883] mt-0.5">
                                {new Date(a.updatedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} · {a.createdBy.name.split(" ")[0]}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Pagination Controls if > 15 articles */}
                {articles.length > ITEMS_PER_PAGE && (
                    <div className="px-3 py-2 border-t border-[#E5E5E3] bg-[#FAFAF9] flex items-center justify-between text-[10px] text-[#888883]">
                        <span>Page {currentPage} of {totalPages}</span>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="px-1.5 py-0.5 border border-[#E5E5E3] bg-white rounded-[2px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAFAF9]"
                            >
                                Prev
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="px-1.5 py-0.5 border border-[#E5E5E3] bg-white rounded-[2px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAFAF9]"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </aside>

            {/* ── Editor Area ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Toolbar */}
                <div className="relative border-b border-[#E5E5E3] bg-white px-5 py-3 flex items-center gap-3 shrink-0">
                    <div className="flex-1 flex items-center justify-start min-w-0">
                        <div className="inline-flex items-center gap-1.5 max-w-full">
                            <input type="text" value={title} onChange={e => { setTitle(e.target.value); setIsTitleManuallyEdited(true); }}
                                onFocus={() => setIsTitleFocused(true)}
                                onBlur={() => setIsTitleFocused(false)}
                                placeholder="Article title…"
                                className="text-[14px] font-semibold text-[#1A1A1A] bg-transparent border-0 outline-none placeholder-[#BBBBB8] min-w-0"
                                style={{
                                    width: title ? `${Math.max(title.length, 12)}ch` : "14ch",
                                    fontFamily: titleFont || "var(--font-instrument-serif), 'Times New Roman', Times, serif"
                                }}/>
                            {!isTitleFocused && (
                                <Pencil className="w-3.5 h-3.5 text-[#888883] shrink-0" />
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => {
                            if (!isDualPane) setIsDualPane(true);
                            setTimeout(() => window.print(), 100);
                        }} title="Print article preview"
                            className="p-1.5 text-[#888883] hover:text-[#1A1A1A] border border-transparent hover:border-[#E5E5E3] rounded-[2px] transition-colors cursor-pointer">
                            <Printer className="w-3.5 h-3.5"/>
                        </button>
                        {selected && (
                            <button onClick={handleDelete} title="Delete article"
                                className="p-1.5 text-[#888883] hover:text-[#CB2431] border border-transparent hover:border-[#E5E5E3] rounded-[2px] transition-colors cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                        )}
                        <button onClick={()=>setIsDualPane(v=>!v)} title={isDualPane?"Single pane":"Dual pane preview"}
                            className={`relative corner-brackets-4 p-1.5 border rounded-[2px] transition-colors cursor-pointer ${isDualPane?"bg-[#1A1A1A] border-[#1A1A1A] text-white":"bg-white border-[#E5E5E3] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#FAFAF9]"}`}>
                            <Columns2 className="w-3.5 h-3.5"/>
                        </button>
                        {isDirty && (
                            <>
                                <Button size="md" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                                    Cancel
                                </Button>
                                <Button size="md" showDot onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? "Saving…" : "Save"}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Editor + Preview */}
                <div className={`flex-1 flex overflow-hidden ${isDualPane?"divide-x divide-[#E5E5E3]":""}`}>
                    <div className={`flex flex-col overflow-hidden editor-pane ${isDualPane?"w-1/2":"w-full"}`}>
                        {isEditing ? (
                            <div className="flex-1 overflow-y-auto p-5">
                                <TipTapEditor value={content} onChange={handleContentChange}/>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                                <FilePen className="w-8 h-8 text-[#E5E5E3]"/>
                                <p className="text-[12px] text-[#888883]">Select an article or create a new one</p>
                                <Button size="sm" showDot onClick={handleNew}>New Article</Button>
                            </div>
                        )}
                    </div>
                    {isDualPane && (
                        <div className="w-1/2 overflow-y-auto bg-[#FAFAF9] p-5 min-w-0 printable-preview-pane">
                            <div className="printable-preview relative w-full bg-white border border-[#E5E5E3] corner-brackets p-5 min-w-0 break-words">
                                {content
                                    ? <div className="prose-content text-[13px] leading-relaxed text-[#1A1A1A] break-words" dangerouslySetInnerHTML={{__html:content}}/>
                                    : <p className="text-[12px] text-[#BBBBB8] italic">Nothing to preview yet…</p>
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
