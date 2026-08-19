"use client";

import React, { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { api, KnowledgeArticle } from "@/api";
import { TipTapEditor } from "@/components/ui/TipTapEditor";
import { Button } from "@/components/ui/Button";
import { useWorkspace } from "@/context/WorkspaceContext";
import toast from "react-hot-toast";
import { Plus, Columns2, Trash2, BookOpen, FilePen, Pencil, Printer } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

function ArticleAuthorAvatar({
    avatarUrl,
    name,
    initials,
}: {
    avatarUrl?: string | null;
    name: string;
    initials: string;
}) {
    const [imgError, setImgError] = useState(false);

    if (avatarUrl && !imgError) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                onError={() => setImgError(true)}
                className="w-3.5 h-3.5 rounded-full object-cover border border-[#E5E5E3] shrink-0"
            />
        );
    }

    return (
        <div className="w-3.5 h-3.5 rounded-full border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-[7px] font-bold text-[#1A1A1A] shrink-0">
            {initials}
        </div>
    );
}

export default function KnowledgePage() {

    const { currentUser, currentTeam, isClient, users, userRole } = useWorkspace();

    // Fetch articles using SWR
    const { data: articlesData, error, isLoading, mutate } = useSWR<KnowledgeArticle[]>(
        isClient && currentTeam ? ["knowledge", currentTeam.id] : null,
        ([, teamId]) => api.getKnowledgeArticles(teamId as string)
    );
    const articles = articlesData || [];

    const [selected, setSelected] = useState<KnowledgeArticle | null>(null);
    const [title, setTitle] = useState("Untitled Article");
    const [content, setContent] = useState("");
    const [isDualPane, setIsDualPane] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [titleFont, setTitleFont] = useState("");
    const [isTitleFocused, setIsTitleFocused] = useState(false);
    const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);

    // Track auto-selection per team
    const autoSelectedTeamRef = useRef<string | null>(null);

    const isLeader = userRole === "LEADER";
    const isCreator = selected ? selected.createdById === currentUser?.id : false;
    const canEditArticle = isLeader || (selected ? isCreator : true);

    // Helper to extract first 5 words from HTML content
    const deriveTitleFromContent = (html: string) => {
        if (!html) return "Untitled Article";
        const doc = new DOMParser().parseFromString(html, "text/html");
        const plainText = doc.body.textContent || "";
        const words = plainText.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return "Untitled Article";
        return words.slice(0, 5).join(" ");
    };

    // Sorting & Pagination state
    const [sortBy, setSortBy] = useState<"updated" | "created" | "title">("updated");
    const [currentPage, setCurrentPage] = useState(1);
    const ARTICLES_PER_PAGE = 8;

    // Reset pagination when team changes
    useEffect(() => {
        setCurrentPage(1);
    }, [currentTeam?.id]);

    const sortedArticles = [...articles].sort((a, b) => {
        if (sortBy === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (sortBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return a.title.localeCompare(b.title);
    });

    const totalPages = Math.ceil(sortedArticles.length / ARTICLES_PER_PAGE);
    const paginatedArticles = sortedArticles.slice(
        (currentPage - 1) * ARTICLES_PER_PAGE,
        currentPage * ARTICLES_PER_PAGE
    );

    const isDirty = selected
        ? title !== selected.title || content !== selected.content
        : title !== "Untitled Article" || content !== "";

    useEffect(() => {
        if (!currentTeam || !articlesData) return;
        if (autoSelectedTeamRef.current === currentTeam.id) return;
        autoSelectedTeamRef.current = currentTeam.id;

        if (articlesData.length > 0) {
            setSelected(articlesData[0]);
            setTitle(articlesData[0].title);
            setContent(articlesData[0].content);
        } else {
            setSelected(null);
            setTitle("Untitled Article");
            setContent("");
        }
    }, [currentTeam?.id, articlesData]);

    const handleSelect = (article: KnowledgeArticle) => {
        setSelected(article);
        setTitle(article.title);
        setContent(article.content);
        setIsTitleManuallyEdited(true);
    };

    const handleNew = () => {
        setSelected(null);
        setTitle("Untitled Article");
        setContent("");
        setIsTitleManuallyEdited(false);
    };

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
        if (!isTitleManuallyEdited && !selected) {
            setTitle(deriveTitleFromContent(newContent));
        }
    };

    const handleCancel = () => {
        if (selected) {
            setTitle(selected.title);
            setContent(selected.content);
            setIsTitleManuallyEdited(true);
        } else {
            handleNew();
        }
    };

    const handleSave = async () => {
        if (!currentTeam || !currentUser) return;
        if (!title.trim()) { toast.error("Title is required"); return; }
        setIsSaving(true);
        try {
            if (selected) {
                const updated = await api.updateKnowledgeArticle(selected.id, { title, content }, currentUser.id);
                setSelected(updated);
                mutate(articles.map(a => a.id === updated.id ? updated : a), { revalidate: false });
                toast.success("Saved");
            } else {
                const created = await api.createKnowledgeArticle({ teamId: currentTeam.id, title, content, createdById: currentUser.id });
                mutate([created, ...articles], { revalidate: false });
                setSelected(created);
                toast.success("Article created");
            }
        } catch (e: any) { toast.error(e.message || "Save failed"); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async () => {
        if (!selected || !currentUser) return;
        setIsDeleting(true);
        try {
            await api.deleteKnowledgeArticle(selected.id, currentUser.id);
            mutate(articles.filter(a => a.id !== selected.id), { revalidate: false });
            setSelected(null); setTitle("Untitled Article"); setContent("");
            toast.success("Article deleted");
            setShowDeleteConfirm(false);
        } catch (e: any) { toast.error(e.message || "Delete failed"); }
        finally { setIsDeleting(false); }
    };

    const isEditing = selected !== null || title !== "";

    return (
        <div className="flex-1 flex overflow-hidden bg-[#FAFAF9]">
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete article"
                description={`Are you sure you want to delete "${selected?.title || "this article"}"? This action cannot be undone.`}
                confirmText="Delete Article"
                isDanger={true}
                isLoading={isDeleting}
            />

            {/* ── Article List Rail ── */}
            <aside className="w-64 shrink-0 border-r border-[#E5E5E3] bg-white flex flex-col">
                {/* Rail Header */}
                <div className="px-4 py-3 border-b border-[#E5E5E3] flex items-center justify-between">
                    <span className="eyebrow capitalize text-[10px]">Docs & Knowledge Base</span>

                    <button onClick={handleNew} title="New article"
                        className="relative corner-brackets-4 p-1.5 border border-[#E5E5E3] rounded-[2px] bg-white text-[#1A1A1A] hover:bg-[#FAFAF9] transition-colors cursor-pointer">
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* List Section Controls: Count on left, Sort on right */}
                <div className="px-3 py-2 border-b border-[#E5E5E3] bg-[#FAFAF9] flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[#888883] font-medium capitalize  ">
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
                        <div className="p-4 flex flex-col gap-2">{[1, 2, 3].map(i => <div key={i} className="h-8 shimmer rounded-[2px]" />)}</div>
                    ) : paginatedArticles.length === 0 ? (
                        <div className="p-4 text-center">
                            <BookOpen className="w-6 h-6 text-[#E5E5E3] mx-auto mb-2" />
                            <p className="text-[11px] text-[#888883]">No articles yet</p>
                            <button onClick={handleNew} className="mt-2 text-[11px] text-[#1A1A1A] underline cursor-pointer">Create one</button>
                        </div>
                    ) : paginatedArticles.map(a => {
                        const author = users.find(u => u.id === a.createdById || u.id === a.createdBy?.id) || a.createdBy;
                        const avatarUrl = author?.avatarUrl || a.createdBy?.avatarUrl;
                        const authorName = author?.name || a.createdBy?.name || "Unknown";
                        const initials = authorName
                            ? authorName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "U";

                        return (
                            <button key={a.id} onClick={() => handleSelect(a)}
                                className={`w-full text-left px-4 py-2.5 border-b border-[#F5F5F4] transition-colors cursor-pointer ${selected?.id === a.id ? "bg-[#FAFAF9] border-l-2 border-l-[#1A1A1A]" : "hover:bg-[#FAFAF9] border-l-2 border-l-transparent"}`}>
                                <p className="text-base font-medium text-[#1A1A1A] truncate">{a.title}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-[#888883] mt-1">
                                    <span>{new Date(a.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                                    <span>·</span>
                                    <div className="flex items-center gap-1 min-w-0">
                                        <ArticleAuthorAvatar avatarUrl={avatarUrl} name={authorName} initials={initials} />
                                        <span className="truncate">{authorName.split(" ")[0]}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Pagination Controls if > ARTICLES_PER_PAGE articles */}
                {articles.length > ARTICLES_PER_PAGE && (
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
                                disabled={!canEditArticle}
                                className="text-[14px] font-semibold text-[#1A1A1A] bg-transparent border-0 outline-none placeholder-[#BBBBB8] min-w-0 disabled:cursor-not-allowed"
                                style={{
                                    width: title ? `${Math.max(title.length, 12)}ch` : "14ch",
                                    fontFamily: titleFont || "var(--font-instrument-serif), 'Times New Roman', Times, serif"
                                }} />
                            {canEditArticle && !isTitleFocused && (
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
                            <Printer className="w-3.5 h-3.5" />
                        </button>
                        {selected && canEditArticle && (
                            <button onClick={() => setShowDeleteConfirm(true)} title="Delete article"
                                className="p-1.5 text-[#888883] hover:text-[#CB2431] border border-transparent hover:border-[#E5E5E3] rounded-[2px] transition-colors cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button onClick={() => setIsDualPane(v => !v)} title={isDualPane ? "Single pane" : "Dual pane preview"}
                            className={`relative corner-brackets-4 p-1.5 border rounded-[2px] transition-colors cursor-pointer ${isDualPane ? "bg-[#1A1A1A] border-[#1A1A1A] text-white" : "bg-white border-[#E5E5E3] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#FAFAF9]"}`}>
                            <Columns2 className="w-3.5 h-3.5" />
                        </button>
                        {isDirty && (
                            <>
                                <Button size="md" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                                    Cancel
                                </Button>
                                <Button
                                    size="md"
                                    showDot={!isSaving}
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                    loadingText="Saving…"
                                >
                                    Save
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Editor + Preview */}
                <div className={`flex-1 flex overflow-hidden ${isDualPane ? "divide-x divide-[#E5E5E3]" : ""}`}>
                    <div className={`flex flex-col overflow-hidden editor-pane ${isDualPane ? "w-1/2" : "w-full"}`}>
                        {isEditing ? (

                            <div className="flex-1 overflow-y-auto p-5 flex flex-col">
                                <TipTapEditor value={content} onChange={handleContentChange} disabled={!canEditArticle} />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                                <FilePen className="w-8 h-8 text-[#E5E5E3]" />
                                <p className="text-base text-[#888883]">Select an article or create a new one</p>
                                <Button size="sm" showDot onClick={handleNew}>New Article</Button>
                            </div>
                        )}
                    </div>
                    {isDualPane && (
                        <div className="w-1/2 overflow-y-auto bg-[#FAFAF9] p-5 min-w-0 flex flex-col printable-preview-pane">
                            <div className="printable-preview relative w-full min-h-full bg-white border border-[#E5E5E3] corner-brackets p-5 min-w-0 break-words">
                                {content
                                    ? <div className="prose-content text-[13px] leading-relaxed text-[#1A1A1A] break-words" dangerouslySetInnerHTML={{ __html: content }} />
                                    : <p className="text-base text-[#BBBBB8] italic">Nothing to preview yet…</p>
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
