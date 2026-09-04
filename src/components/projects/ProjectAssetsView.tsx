"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
    Plus, Search, ExternalLink, Copy, Check, Trash2, Edit3,
    FileText, Link2, Folder, FolderPlus, X, Save, Eye,
    ChevronDown, ChevronRight, Lock, User, MoreVertical,
    FileCode, Globe, Clock, Shield, Sparkles, FolderOpen
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import { getProjectPermissions } from "../../utils/projectPermissions";
import { TipTapEditor } from "../ui/TipTapEditor";
import { UserAvatar } from "../ui/UserAvatar";
import { Button } from "../ui/Button";
import { CustomSelect, SelectOption } from "../ui/CustomSelect";
import ModalWrapper from "../ui/ModalWrapper";

export interface ProjectCategory {
    id: string;
    name: string;
    color?: string;
    createdAt: string;
}

export interface ProjectDoc {
    id: string;
    title: string;
    content: string; // TipTap HTML
    categoryId?: string; // category id or 'uncategorized'
    createdById: string;
    createdByName: string;
    createdByAvatar?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectLink {
    id: string;
    title: string;
    url: string;
    description?: string;
    categoryId?: string; // category id or 'uncategorized'
    createdById: string;
    createdByName: string;
    createdByAvatar?: string | null;
    createdAt: string;
    updatedAt: string;
}

interface ProjectAssetsViewProps {
    project: any;
    onRefresh?: () => void;
}

function getHostname(url?: string): string {
    if (!url) return "";
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        return u.hostname.replace("www.", "");
    } catch {
        return url;
    }
}

function getFaviconUrl(url?: string): string {
    if (!url) return "";
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        if (u.hostname.includes("figma.com")) return "https://static.figma.com/app/icon/1/favicon.png";
        if (u.hostname.includes("github.com")) return "https://github.githubassets.com/favicons/favicon.png";
        if (u.hostname.includes("gitlab.com")) return "https://gitlab.com/assets/favicon-72a2cad5025aa931d6ea56c3201d1f18e68a8cd39788c7c80d5b2b82aa5143ef.png";
        if (u.hostname.includes("notion.so") || u.hostname.includes("notion.site")) return "https://www.notion.so/images/favicon.ico";
        if (url.includes("docs.google.com/spreadsheets") || url.includes("sheets.google.com")) return "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_spreadsheet_x16.png";
        if (url.includes("docs.google.com/document")) return "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_document_x16.png";
        if (url.includes("drive.google.com")) return "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png";
        if (u.hostname.includes("linear.app")) return "https://linear.app/favicon.ico";
        if (u.hostname.includes("loom.com")) return "https://www.loom.com/favicon.ico";
        return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
    } catch {
        return "";
    }
}

export default function ProjectAssetsView({ project, onRefresh }: ProjectAssetsViewProps) {
    const { currentUser, userRole, currentTeam } = useWorkspace();

    // Permissions check
    const permissions = getProjectPermissions(project, currentUser, userRole, currentTeam);
    const isLeaderOrManager = permissions.isProjectLeader || permissions.isProjectManager;
    const isViewer = !permissions.canManageTasks && !isLeaderOrManager && project?.members?.some((m: any) => m.userId === currentUser?.id && m.role === "VIEWER");
    const canCreate = !isViewer;

    // Local state for instant responsiveness and optimistic updates
    const normalizeDoc = (d: any): ProjectDoc => ({
        id: d.id,
        title: d.title || 'Untitled',
        content: d.content || '',
        categoryId: d.categoryId || 'uncategorized',
        createdById: d.createdById || d.createdBy?.id || '',
        createdByName: d.createdBy?.name || d.createdBy?.fullName || d.createdByName || 'Team Member',
        createdByAvatar: d.createdBy?.avatarUrl || d.createdByAvatar || null,
        createdAt: d.createdAt || new Date().toISOString(),
        updatedAt: d.updatedAt || new Date().toISOString(),
    });
    const normalizeLink = (l: any): ProjectLink => ({
        id: l.id,
        title: l.title || 'Untitled',
        url: l.url || '',
        description: l.description || '',
        categoryId: l.categoryId || 'uncategorized',
        createdById: l.createdById || l.createdBy?.id || '',
        createdByName: l.createdBy?.name || l.createdBy?.fullName || l.createdByName || 'Team Member',
        createdByAvatar: l.createdBy?.avatarUrl || l.createdByAvatar || null,
        createdAt: l.createdAt || new Date().toISOString(),
        updatedAt: l.updatedAt || new Date().toISOString(),
    });

    const [localCategories, setLocalCategories] = useState<ProjectCategory[]>(() => {
        return (project?.categories || project?.metadata?.categories || []);
    });
    const [localDocs, setLocalDocs] = useState<ProjectDoc[]>(() => {
        const raw = project?.docs || project?.metadata?.docs || [];
        return raw.map(normalizeDoc);
    });
    const [localLinks, setLocalLinks] = useState<ProjectLink[]>(() => {
        const raw = project?.links || project?.metadata?.links || [];
        return raw.map(normalizeLink);
    });

    // Synchronize whenever project prop updates (SWR/socket refresh)
    useEffect(() => {
        if (project?.categories && Array.isArray(project.categories)) {
            setLocalCategories(project.categories);
        }
        if (project?.docs && Array.isArray(project.docs)) {
            setLocalDocs(project.docs.map(normalizeDoc));
        }
        if (project?.links && Array.isArray(project.links)) {
            setLocalLinks(project.links.map(normalizeLink));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project?.docs, project?.links, project?.categories]);

    // Tabbed Workspace State
    const [openDocIds, setOpenDocIds] = useState<string[]>([]);
    const [activeDocId, setActiveDocId] = useState<string | null>(null);
    const [activeDocDrafts, setActiveDocDrafts] = useState<Record<string, { title: string; content: string; categoryId: string; isDirty: boolean }>>({});

    // Explorer & Sidebar State
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        all: true,
        uncategorized: true,
    });

    // Modals state
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);

    const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<ProjectLink | null>(null);
    const [linkTitle, setLinkTitle] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [linkDescription, setLinkDescription] = useState("");
    const [linkCategoryId, setLinkCategoryId] = useState<string>("uncategorized");

    const [isSaving, setIsSaving] = useState(false);
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
    const [sidebarTab, setSidebarTab] = useState<'docs' | 'links'>('docs');

    const categoryOptions: SelectOption[] = useMemo(() => [
        { value: "uncategorized", label: "📁 Uncategorized" },
        ...localCategories.map((c) => ({
            value: c.id,
            label: `📁 ${c.name}`,
        })),
    ], [localCategories]);

    // Initialize first doc if available
    useEffect(() => {
        if (localDocs.length > 0 && openDocIds.length === 0) {
            const firstDoc = localDocs[0];
            setOpenDocIds([firstDoc.id]);
            setActiveDocId(firstDoc.id);
            setActiveDocDrafts((prev) => ({
                ...prev,
                [firstDoc.id]: {
                    title: firstDoc.title,
                    content: firstDoc.content || "",
                    categoryId: firstDoc.categoryId || "uncategorized",
                    isDirty: false,
                },
            }));
        }
    }, [localDocs.length]);

    // Notify parent & broadcast socket update
    const notifyRefresh = (action?: string) => {
        if (onRefresh) onRefresh();
        window.dispatchEvent(new CustomEvent("project_data_updated", { detail: { projectId: project.id, action } }));
    };

    // Check if user can modify an item (creator or leader/manager)
    const canModifyItem = (createdById?: string) => {
        if (!currentUser) return false;
        if (isLeaderOrManager) return true;
        return !createdById || createdById === currentUser.id;
    };

    /* ------------------------------------------------------------------------- */
    /* DOCUMENT MANAGEMENT                                                       */
    /* ------------------------------------------------------------------------- */

    const handleCreateDocument = async (targetCategoryId?: string) => {
        if (!canCreate) {
            toast.error("Viewers do not have permission to create documents.");
            return;
        }

        try {
            setIsSaving(true);
            const catId = targetCategoryId && targetCategoryId !== "uncategorized" ? targetCategoryId : null;
            const created = await api.createProjectDoc(project.id, {
                title: "Untitled Document",
                content: "<p>Start writing project notes, architecture decisions, or specifications here...</p>",
                categoryId: catId,
            });

            const newDoc: ProjectDoc = {
                id: created.id,
                title: created.title,
                content: created.content || "",
                categoryId: created.categoryId || "uncategorized",
                createdById: created.createdById || created.createdBy?.id || currentUser?.id || "",
                createdByName: created.createdBy?.name || created.createdBy?.fullName || currentUser?.name || "Team Member",
                createdByAvatar: created.createdBy?.avatarUrl || currentUser?.avatarUrl || null,
                createdAt: created.createdAt,
                updatedAt: created.updatedAt,
            };

            setLocalDocs((prev) => [newDoc, ...prev]);
            setOpenDocIds((prev) => (prev.includes(newDoc.id) ? prev : [...prev, newDoc.id]));
            setActiveDocId(newDoc.id);
            setActiveDocDrafts((prev) => ({
                ...prev,
                [newDoc.id]: {
                    title: newDoc.title,
                    content: newDoc.content,
                    categoryId: newDoc.categoryId || "uncategorized",
                    isDirty: false,
                },
            }));

            toast.success("New document created!");
            notifyRefresh("doc_created");
        } catch (err: any) {
            toast.error(err.message || "Failed to create document.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenDocInTab = (doc: ProjectDoc) => {
        if (!openDocIds.includes(doc.id)) {
            setOpenDocIds((prev) => [...prev, doc.id]);
        }
        setActiveDocId(doc.id);

        if (!activeDocDrafts[doc.id]) {
            setActiveDocDrafts((prev) => ({
                ...prev,
                [doc.id]: {
                    title: doc.title,
                    content: doc.content || "",
                    categoryId: doc.categoryId || "uncategorized",
                    isDirty: false,
                },
            }));
        }
    };

    const handleCloseTab = (docId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        const remaining = openDocIds.filter((id) => id !== docId);
        setOpenDocIds(remaining);

        if (activeDocId === docId) {
            setActiveDocId(remaining.length > 0 ? remaining[remaining.length - 1] : null);
        }
    };

    const handleSaveActiveDoc = async (docId: string) => {
        const draft = activeDocDrafts[docId];
        if (!draft) return;

        const targetDoc = localDocs.find((d) => d.id === docId);
        if (targetDoc && !canModifyItem(targetDoc.createdById)) {
            toast.error("You can only edit documents you created. Leaders and managers can edit any document.");
            return;
        }

        try {
            setIsSaving(true);
            const catId = draft.categoryId && draft.categoryId !== "uncategorized" ? draft.categoryId : null;
            const updated = await api.updateProjectDoc(project.id, docId, {
                title: draft.title.trim() || "Untitled Document",
                content: draft.content,
                categoryId: catId,
            });

            setLocalDocs((prev) => prev.map((d) =>
                d.id === docId ? {
                    ...d,
                    title: updated.title,
                    content: updated.content || "",
                    categoryId: updated.categoryId || "uncategorized",
                    updatedAt: updated.updatedAt,
                } : d
            ));
            setActiveDocDrafts((prev) => ({
                ...prev,
                [docId]: { ...prev[docId], isDirty: false },
            }));

            toast.success("Document saved!");
            notifyRefresh("doc_updated");
        } catch (err: any) {
            toast.error(err.message || "Failed to save document.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDoc = async (doc: ProjectDoc) => {
        if (!canModifyItem(doc.createdById)) {
            toast.error("You can only delete documents you created. Leaders and managers can delete any document.");
            return;
        }

        if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

        try {
            setIsSaving(true);
            await api.deleteProjectDoc(project.id, doc.id);
            setLocalDocs((prev) => prev.filter((d) => d.id !== doc.id));
            handleCloseTab(doc.id);
            toast.success("Document deleted.");
            notifyRefresh("doc_deleted");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete document.");
        } finally {
            setIsSaving(false);
        }
    };

    /* ------------------------------------------------------------------------- */
    /* CATEGORY MANAGEMENT & FALLBACK MECHANISM                                  */
    /* ------------------------------------------------------------------------- */

    const handleOpenAddCategory = () => {
        if (!canCreate) {
            toast.error("Viewers do not have permission to manage categories.");
            return;
        }
        setEditingCategory(null);
        setNewCategoryName("");
        setIsAddCategoryOpen(true);
    };

    const handleCreateOrUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.error("Please enter a category name");
            return;
        }

        try {
            setIsSaving(true);
            if (editingCategory) {
                const updated = await api.updateProjectCategory(project.id, editingCategory.id, {
                    name: newCategoryName.trim(),
                });
                setLocalCategories((prev) => prev.map((c) => c.id === editingCategory.id ? { ...c, ...updated } : c));
                toast.success("Category renamed!");
                notifyRefresh("category_updated");
            } else {
                const created = await api.createProjectCategory(project.id, { name: newCategoryName.trim() });
                setLocalCategories((prev) => [...prev, created]);
                setExpandedCategories((prev) => ({ ...prev, [created.id]: true }));
                toast.success("Category created!");
                notifyRefresh("category_created");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save category.");
        } finally {
            setIsSaving(false);
        }

        setIsAddCategoryOpen(false);
        setEditingCategory(null);
        setNewCategoryName("");
    };

    // FALLBACK MECHANISM: Deleting a category moves all items to "uncategorized" (handled by backend)
    const handleDeleteCategory = async (category: ProjectCategory) => {
        if (!isLeaderOrManager) {
            toast.error("Only project leaders and managers can manage project categories.");
            return;
        }

        const affectedDocs = localDocs.filter((d) => d.categoryId === category.id);
        const affectedLinks = localLinks.filter((l) => l.categoryId === category.id);
        const totalAffected = affectedDocs.length + affectedLinks.length;

        const msg = totalAffected > 0
            ? `Delete category "${category.name}"? ${totalAffected} item(s) in this category will be moved to "Uncategorized" as a fallback.`
            : `Delete category "${category.name}"?`;

        if (!confirm(msg)) return;

        try {
            setIsSaving(true);
            await api.deleteProjectCategory(project.id, category.id);

            // Optimistically apply fallback to uncategorized in local state
            setLocalDocs((prev) => prev.map((d) =>
                d.categoryId === category.id ? { ...d, categoryId: "uncategorized" } : d
            ));
            setLocalLinks((prev) => prev.map((l) =>
                l.categoryId === category.id ? { ...l, categoryId: "uncategorized" } : l
            ));
            setLocalCategories((prev) => prev.filter((c) => c.id !== category.id));

            // Update local drafts
            setActiveDocDrafts((prev) => {
                const updated = { ...prev };
                Object.keys(updated).forEach((docId) => {
                    if (updated[docId].categoryId === category.id) {
                        updated[docId].categoryId = "uncategorized";
                    }
                });
                return updated;
            });

            toast.success(`Category deleted. ${totalAffected > 0 ? `${totalAffected} item(s) moved to Uncategorized.` : ""}`);
            notifyRefresh("category_deleted");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete category.");
        } finally {
            setIsSaving(false);
        }
    };

    /* ------------------------------------------------------------------------- */
    /* EXTERNAL LINKS MANAGEMENT                                                 */
    /* ------------------------------------------------------------------------- */

    const handleSaveLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkTitle.trim() || !linkUrl.trim()) {
            toast.error("Please enter a title and valid URL");
            return;
        }

        try {
            setIsSaving(true);
            const catId = linkCategoryId && linkCategoryId !== "uncategorized" ? linkCategoryId : null;

            if (editingLink) {
                if (!canModifyItem(editingLink.createdById)) {
                    toast.error("You can only edit links you created.");
                    return;
                }

                const updated = await api.updateProjectLink(project.id, editingLink.id, {
                    title: linkTitle.trim(),
                    url: linkUrl.trim(),
                    description: linkDescription.trim() || undefined,
                    categoryId: catId,
                });

                setLocalLinks((prev) => prev.map((l) =>
                    l.id === editingLink.id ? {
                        ...l,
                        title: updated.title,
                        url: updated.url,
                        description: updated.description || "",
                        categoryId: updated.categoryId || "uncategorized",
                        updatedAt: updated.updatedAt,
                    } : l
                ));
                toast.success("Link updated!");
                notifyRefresh("link_updated");
            } else {
                const created = await api.createProjectLink(project.id, {
                    title: linkTitle.trim(),
                    url: linkUrl.trim(),
                    description: linkDescription.trim() || undefined,
                    categoryId: catId,
                });

                const newLink: ProjectLink = {
                    id: created.id,
                    title: created.title,
                    url: created.url,
                    description: created.description || "",
                    categoryId: created.categoryId || "uncategorized",
                    createdById: created.createdById || created.createdBy?.id || currentUser?.id || "",
                    createdByName: created.createdBy?.name || created.createdBy?.fullName || currentUser?.name || "Team Member",
                    createdByAvatar: created.createdBy?.avatarUrl || currentUser?.avatarUrl || null,
                    createdAt: created.createdAt,
                    updatedAt: created.updatedAt,
                };
                setLocalLinks((prev) => [newLink, ...prev]);
                toast.success("Link added to project!");
                notifyRefresh("link_created");
            }

            setIsAddLinkOpen(false);
            setEditingLink(null);
            setLinkTitle("");
            setLinkUrl("");
            setLinkDescription("");
            setLinkCategoryId("uncategorized");
        } catch (err: any) {
            toast.error(err.message || "Failed to save link.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLink = async (link: ProjectLink) => {
        if (!canModifyItem(link.createdById)) {
            toast.error("You can only delete links you created. Leaders and managers can delete any link.");
            return;
        }

        if (!confirm(`Are you sure you want to remove "${link.title}"?`)) return;

        try {
            setIsSaving(true);
            await api.deleteProjectLink(project.id, link.id);
            setLocalLinks((prev) => prev.filter((l) => l.id !== link.id));
            toast.success("Link removed.");
            notifyRefresh("link_deleted");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete link.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyUrl = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopiedLinkId(id);
        toast.success("Link copied!");
        setTimeout(() => setCopiedLinkId(null), 2000);
    };

    /* ------------------------------------------------------------------------- */
    /* ACTIVE DOCUMENT RESOLUTION                                                */
    /* ------------------------------------------------------------------------- */

    const activeDoc = useMemo(() => {
        if (!activeDocId) return null;
        const found = localDocs.find((d) => d.id === activeDocId);
        if (found) return found;
        if (activeDocDrafts[activeDocId]) {
            const draft = activeDocDrafts[activeDocId];
            return {
                id: activeDocId,
                title: draft.title || "Untitled Document",
                content: draft.content || "",
                categoryId: draft.categoryId || "uncategorized",
                createdById: currentUser?.id || "anonymous",
                createdByName: currentUser?.name || "Team Member",
                createdByAvatar: currentUser?.avatarUrl || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as ProjectDoc;
        }
        return null;
    }, [localDocs, activeDocId, activeDocDrafts, currentUser]);

    const activeDraft = useMemo(() => {
        if (!activeDocId) return null;
        if (activeDocDrafts[activeDocId]) return activeDocDrafts[activeDocId];
        if (activeDoc) {
            return {
                title: activeDoc.title,
                content: activeDoc.content || "",
                categoryId: activeDoc.categoryId || "uncategorized",
                isDirty: false,
            };
        }
        return null;
    }, [activeDocId, activeDocDrafts, activeDoc]);

    const canEditActiveDoc = activeDoc ? canModifyItem(activeDoc.createdById) : false;

    // Filtered documents & links by search query
    const filteredDocs = useMemo(() => {
        if (!searchQuery.trim()) return localDocs;
        const q = searchQuery.toLowerCase();
        return localDocs.filter(
            (d) =>
                d.title.toLowerCase().includes(q) ||
                d.content.toLowerCase().includes(q) ||
                d.createdByName.toLowerCase().includes(q)
        );
    }, [localDocs, searchQuery]);

    const filteredLinks = useMemo(() => {
        if (!searchQuery.trim()) return localLinks;
        const q = searchQuery.toLowerCase();
        return localLinks.filter(
            (l) =>
                l.title.toLowerCase().includes(q) ||
                l.url.toLowerCase().includes(q) ||
                (l.description && l.description.toLowerCase().includes(q))
        );
    }, [localLinks, searchQuery]);

    // Group items by category (with fallback to 'uncategorized')
    const categoryGroups = useMemo(() => {
        const groups: Record<string, { docs: ProjectDoc[]; links: ProjectLink[] }> = {
            uncategorized: { docs: [], links: [] },
        };

        localCategories.forEach((cat) => {
            groups[cat.id] = { docs: [], links: [] };
        });

        filteredDocs.forEach((doc) => {
            const catId = doc.categoryId && groups[doc.categoryId] ? doc.categoryId : "uncategorized";
            groups[catId].docs.push(doc);
        });

        filteredLinks.forEach((link) => {
            const catId = link.categoryId && groups[link.categoryId] ? link.categoryId : "uncategorized";
            groups[catId].links.push(link);
        });

        return groups;
    }, [localCategories, filteredDocs, filteredLinks]);

    const toggleCategory = (catId: string) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [catId]: prev[catId] === undefined ? false : !prev[catId],
        }));
    };

    return (
        <div className="flex-1 flex min-h-0 bg-[var(--app-bg,#FAF9F5)] text-left overflow-hidden select-text">
            {/* ========================================================================= */}
            {/* LEFT PANEL: DOCUMENT & RESOURCE EXPLORER TREE                             */}
            {/* ========================================================================= */}
            <div className="w-72 sm:w-80 border-r border-[var(--app-border)] bg-[var(--app-card)] flex flex-col shrink-0 min-h-0">
                {/* ── TAB SWITCHER ── */}
                <div className="flex items-stretch border-b border-[var(--app-border)] bg-[var(--app-bg)]/40 shrink-0">
                    <button
                        type="button"
                        onClick={() => setSidebarTab('docs')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold transition-all border-b-2 ${
                            sidebarTab === 'docs'
                                ? 'border-[var(--color-accent,#4F46E5)] text-[var(--color-accent,#4F46E5)] bg-[var(--app-card)]'
                                : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-card)]/50'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        Docs
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                            sidebarTab === 'docs'
                                ? 'bg-[var(--color-accent,#4F46E5)]/15 text-[var(--color-accent,#4F46E5)]'
                                : 'bg-[var(--app-border)] text-[var(--app-muted)]'
                        }`}>{localDocs.length}</span>
                    </button>
                    <div className="w-px bg-[var(--app-border)]" />
                    <button
                        type="button"
                        onClick={() => setSidebarTab('links')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold transition-all border-b-2 ${
                            sidebarTab === 'links'
                                ? 'border-[#2563EB] text-[#2563EB] bg-[var(--app-card)]'
                                : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-card)]/50'
                        }`}
                    >
                        <Link2 className="w-3.5 h-3.5" />
                        Links
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                            sidebarTab === 'links'
                                ? 'bg-[#2563EB]/15 text-[#2563EB]'
                                : 'bg-[var(--app-border)] text-[var(--app-muted)]'
                        }`}>{localLinks.length}</span>
                    </button>
                </div>

                {/* ── SEARCH ── */}
                <div className="p-3 border-b border-[var(--app-border)] bg-[var(--app-bg)]/40 shrink-0">
                    <div className="relative">
                        <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={sidebarTab === 'docs' ? 'Search documents...' : 'Search links...'}
                            className="w-full bg-[var(--app-card)] border border-[var(--app-border)] focus:border-[var(--color-accent,#4F46E5)] pl-7 pr-6 py-1 text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] rounded-[2px] focus:outline-none transition-colors"
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-text)]">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── SCROLLABLE CONTENT ── */}
                <div className="flex-1 overflow-y-auto scrollbar-none min-h-0">

                {/* ── DOCUMENTS SECTION ── */}
                {sidebarTab === 'docs' && (
                <div className="flex flex-col pb-3">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)] flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            Documents
                            <span className="font-mono normal-case tracking-normal">({filteredDocs.length})</span>
                        </span>
                        {canCreate && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleOpenAddCategory}
                                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-[2px] bg-[var(--app-card)] border border-[var(--app-border)] text-[var(--app-text)] hover:bg-[var(--app-bg)] transition-colors cursor-pointer"
                                    title="Create New Category Folder"
                                >
                                    <FolderPlus className="w-3 h-3 text-[#D97706]" />
                                    <span>+ Folder</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCreateDocument()}
                                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-[2px] bg-[var(--color-accent,#4F46E5)]/10 text-[var(--color-accent,#4F46E5)] hover:bg-[var(--color-accent,#4F46E5)]/20 transition-colors cursor-pointer"
                                    title="New Document"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>New Doc</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Category + Doc Tree */}
                    <div className="px-2 pb-2 flex flex-col gap-0.5">
                        {/* Custom categories */}
                        {localCategories.map((cat) => {
                            const isExpanded = expandedCategories[cat.id] !== false;
                            const group = categoryGroups[cat.id] || { docs: [], links: [] };
                            return (
                                <div key={cat.id} className="flex flex-col">
                                    <div className="group flex items-center justify-between px-2 py-1 rounded-[2px] hover:bg-[var(--app-bg)] transition-colors">
                                        <div onClick={() => toggleCategory(cat.id)} className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer">
                                            {isExpanded ? <ChevronDown className="w-3 h-3 text-[var(--app-muted)] shrink-0" /> : <ChevronRight className="w-3 h-3 text-[var(--app-muted)] shrink-0" />}
                                            <Folder className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                                            <span className="text-xs font-semibold text-[var(--app-text)] truncate">{cat.name}</span>
                                            <span className="text-[10px] text-[var(--app-muted)] font-mono">({group.docs.length})</span>
                                        </div>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canCreate && (
                                                <button type="button" onClick={() => handleCreateDocument(cat.id)}
                                                    className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer" title={`New doc in ${cat.name}`}>
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            )}
                                            {isLeaderOrManager && (
                                                <>
                                                    <button type="button" onClick={() => { setEditingCategory(cat); setNewCategoryName(cat.name); setIsAddCategoryOpen(true); }}
                                                        className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer" title="Rename">
                                                        <Edit3 className="w-3 h-3" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteCategory(cat)}
                                                        className="p-1 text-[var(--app-muted)] hover:text-[var(--color-error)] rounded-[2px] transition-colors cursor-pointer" title="Delete category">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="pl-5 flex flex-col gap-0.5 border-l border-[var(--app-border)]/50 ml-3.5 my-0.5">
                                            {group.docs.map((doc) => (
                                                <DocumentTreeItem key={doc.id} doc={doc} isActive={activeDocId === doc.id}
                                                    onOpen={() => handleOpenDocInTab(doc)} onDelete={() => handleDeleteDoc(doc)}
                                                    canModify={canModifyItem(doc.createdById)} />
                                            ))}
                                            {group.docs.length === 0 && <span className="text-[10px] text-[var(--app-muted)] italic py-1 pl-2">No docs in this folder</span>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Uncategorized docs */}
                        {(() => {
                            const isExpanded = expandedCategories["uncategorized"] !== false;
                            const uncatDocs = categoryGroups.uncategorized?.docs || [];
                            if (localCategories.length === 0 && uncatDocs.length === 0 && !searchQuery) {
                                return (
                                    <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                                        <FileText className="w-7 h-7 text-[var(--app-muted)] opacity-40" />
                                        <p className="text-[11px] text-[var(--app-muted)]">No documents yet</p>
                                        {canCreate && (
                                            <div className="flex flex-col items-center gap-1.5 mt-1">
                                                <button type="button" onClick={() => handleCreateDocument()}
                                                    className="text-[11px] font-semibold text-[var(--color-accent,#4F46E5)] hover:underline cursor-pointer">
                                                    + Create your first document
                                                </button>
                                                <button type="button" onClick={handleOpenAddCategory}
                                                    className="text-[11px] font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)] hover:underline cursor-pointer">
                                                    + Create a category folder
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            if (localCategories.length > 0 && uncatDocs.length === 0) return null;
                            return (
                                <div className="flex flex-col">
                                    {localCategories.length > 0 && (
                                        <div onClick={() => toggleCategory("uncategorized")}
                                            className="flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-[var(--app-bg)] rounded-[2px] transition-colors">
                                            {isExpanded ? <ChevronDown className="w-3 h-3 text-[var(--app-muted)] shrink-0" /> : <ChevronRight className="w-3 h-3 text-[var(--app-muted)] shrink-0" />}
                                            <Folder className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                            <span className="text-xs font-semibold text-[var(--app-muted)] truncate">Uncategorized</span>
                                            <span className="text-[10px] text-[var(--app-muted)] font-mono">({uncatDocs.length})</span>
                                        </div>
                                    )}
                                    {(localCategories.length === 0 || isExpanded) && (
                                        <div className={localCategories.length > 0 ? "pl-5 flex flex-col gap-0.5 border-l border-[var(--app-border)]/50 ml-3.5 my-0.5" : "flex flex-col gap-0.5"}>
                                            {uncatDocs.map((doc) => (
                                                <DocumentTreeItem key={doc.id} doc={doc} isActive={activeDocId === doc.id}
                                                    onOpen={() => handleOpenDocInTab(doc)} onDelete={() => handleDeleteDoc(doc)}
                                                    canModify={canModifyItem(doc.createdById)} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
                )}

                {/* ── LINKS SECTION ── */}
                {sidebarTab === 'links' && (
                <div className="flex flex-col pb-3">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 pt-3 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--app-muted)] flex items-center gap-1.5">
                            <Link2 className="w-3 h-3" />
                            Links & Resources
                            <span className="font-mono normal-case tracking-normal">({filteredLinks.length})</span>
                        </span>
                        {canCreate && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingLink(null);
                                    setLinkTitle("");
                                    setLinkUrl("");
                                    setLinkDescription("");
                                    setLinkCategoryId("uncategorized");
                                    setIsAddLinkOpen(true);
                                }}
                                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-[2px] bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 transition-colors cursor-pointer"
                                title="Add Link"
                            >
                                <Plus className="w-3 h-3" />
                                <span>Add Link</span>
                            </button>
                        )}
                    </div>

                    {/* Flat Link List */}
                    <div className="px-2 flex flex-col gap-1">
                        {filteredLinks.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                                <Link2 className="w-8 h-8 text-[var(--app-muted)] opacity-30" />
                                <p className="text-xs text-[var(--app-muted)]">No links or resources yet</p>
                                {canCreate && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingLink(null);
                                            setLinkTitle("");
                                            setLinkUrl("");
                                            setLinkDescription("");
                                            setLinkCategoryId("uncategorized");
                                            setIsAddLinkOpen(true);
                                        }}
                                        className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer mt-1"
                                    >
                                        + Add your first link
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredLinks.map((link) => (
                                <LinkTreeItem
                                    key={link.id}
                                    link={link}
                                    onCopy={() => handleCopyUrl(link.url, link.id)}
                                    isCopied={copiedLinkId === link.id}
                                    onEdit={canModifyItem(link.createdById) ? () => {
                                        setEditingLink(link);
                                        setLinkTitle(link.title);
                                        setLinkUrl(link.url);
                                        setLinkDescription(link.description || "");
                                        setLinkCategoryId("uncategorized");
                                        setIsAddLinkOpen(true);
                                    } : undefined}
                                    onDelete={() => handleDeleteLink(link)}
                                    canModify={canModifyItem(link.createdById)}
                                />
                            ))
                        )}
                    </div>
                </div>
                )}

                </div>{/* end scrollable content */}
            </div>

            {/* ========================================================================= */}
            {/* RIGHT PANEL: TRADITIONAL NOTEPAD / WORD DOCS TABBED WORKSPACE             */}
            {/* ========================================================================= */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[var(--app-bg)] overflow-hidden">
                {/* 1. TOP TAB BAR (Notepad / Word style tabs) */}
                <div className="h-9 bg-[var(--app-card)] border-b border-[var(--app-border)] flex items-center px-2 gap-1 overflow-x-auto scrollbar-none shrink-0 select-none">
                    {openDocIds.map((docId) => {
                        const doc = localDocs.find((d) => d.id === docId);
                        const draft = activeDocDrafts[docId];
                        const title = draft?.title || doc?.title || "Untitled Document";
                        const isActive = activeDocId === docId;
                        const isDirty = draft?.isDirty;

                        return (
                            <div
                                key={docId}
                                onClick={() => setActiveDocId(docId)}
                                className={`group relative h-7 px-3 rounded-t-[3px] border-t border-x text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 max-w-[200px] ${
                                    isActive
                                        ? "bg-[var(--app-bg)] border-[var(--app-border)] text-[var(--app-text)] font-semibold shadow-2xs border-b-transparent -mb-[1px]"
                                        : "bg-[var(--app-card)] border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-bg)]/50"
                                }`}
                            >
                                <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[var(--color-success,#16A34A)]" : "text-[var(--app-muted)]"}`} />
                                <span className="truncate">{title}</span>

                                {isDirty && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0" title="Unsaved changes" />
                                )}

                                <button
                                    type="button"
                                    onClick={(e) => handleCloseTab(docId, e)}
                                    className="p-0.5 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 rounded-xs transition-colors shrink-0 ml-auto"
                                    title="Close tab"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}

                    {canCreate && (
                        <button
                            type="button"
                            onClick={() => handleCreateDocument()}
                            className="h-7 px-2 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-bg)] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 text-xs shrink-0"
                            title="Open New Document"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* 2. MAIN DOCUMENT PAPER CANVAS / TIPTAP EDITOR */}
                {activeDocId && activeDraft ? (
                    <div className="flex-1 flex flex-col min-h-0 bg-[var(--app-card)] overflow-hidden">
                        {/* Document Header Controls */}
                        <div className="border-b border-[var(--app-border)] px-4 py-2 bg-[var(--app-bg)] flex flex-wrap items-center justify-between gap-3 shrink-0">
                            {/* Title Input & Category Dropdown */}
                            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                                <input
                                    type="text"
                                    value={activeDraft.title}
                                    disabled={!canEditActiveDoc}
                                    onChange={(e) => {
                                        const newTitle = e.target.value;
                                        setActiveDocDrafts((prev) => ({
                                            ...prev,
                                            [activeDocId]: {
                                                ...(prev[activeDocId] || {
                                                    content: activeDoc?.content || "",
                                                    categoryId: activeDoc?.categoryId || "uncategorized",
                                                }),
                                                title: newTitle,
                                                isDirty: true,
                                            },
                                        }));
                                    }}
                                    placeholder="Document title..."
                                    className="font-bold text-sm sm:text-base text-[var(--app-text)] bg-transparent border-b border-transparent hover:border-[var(--app-border)] focus:border-[var(--color-accent,#1A1A1A)] focus:outline-none transition-colors px-1 py-0.5 flex-1 min-w-0"
                                />

                                {/* Category Assignment Select */}
                                <CustomSelect
                                    options={categoryOptions}
                                    value={activeDraft.categoryId || "uncategorized"}
                                    disabled={!canEditActiveDoc}
                                    onChange={(newCatId) => {
                                        setActiveDocDrafts((prev) => ({
                                            ...prev,
                                            [activeDocId]: {
                                                ...(prev[activeDocId] || {
                                                    title: activeDoc?.title || "Untitled Document",
                                                    content: activeDoc?.content || "",
                                                }),
                                                categoryId: newCatId,
                                                isDirty: true,
                                            },
                                        }));
                                    }}
                                    buttonClassName="!py-1 !px-2 !text-xs !h-7 !min-h-0"
                                    className="w-40"
                                />
                            </div>

                            {/* Author Attribution & Save Controls */}
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1.5 text-[11px] text-[var(--app-muted)] pr-2 border-r border-[var(--app-border)]">
                                    <UserAvatar
                                        name={activeDoc?.createdByName || currentUser?.name || "Member"}
                                        avatarUrl={activeDoc?.createdByAvatar || currentUser?.avatarUrl}
                                        size="xs"
                                    />
                                    <span className="truncate max-w-[100px]">{activeDoc?.createdByName || currentUser?.name || "Member"}</span>
                                </div>

                                {canEditActiveDoc ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleSaveActiveDoc(activeDocId)}
                                            disabled={isSaving || !activeDraft.isDirty}
                                            className={`px-3 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                                                activeDraft.isDirty
                                                    ? "bg-[var(--color-accent,#4F46E5)] text-white hover:opacity-90 shadow-sm"
                                                    : "bg-transparent text-[var(--app-muted)] border border-[var(--app-border)] opacity-60 cursor-default"
                                            }`}
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            <span>{isSaving ? "Saving..." : activeDraft.isDirty ? "Save Document" : "Saved"}</span>
                                        </button>

                                        {activeDoc && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDoc(activeDoc)}
                                                className="p-1.5 text-[var(--app-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-[2px] transition-colors cursor-pointer"
                                                title="Delete Document"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center gap-1 text-[11px] text-[var(--app-muted)] bg-[var(--app-bg)] px-2 py-1 rounded-[2px] border border-[var(--app-border)]">
                                        <Lock className="w-3 h-3 text-[var(--app-muted)]" />
                                        <span>Read Only</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Embedded TipTap Editor (Borderless Full Height Canvas) */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <TipTapEditor
                                value={activeDraft.content}
                                borderless={true}
                                onChange={(newHtml) => {
                                    setActiveDocDrafts((prev) => ({
                                        ...prev,
                                        [activeDocId]: {
                                            ...(prev[activeDocId] || {
                                                title: activeDoc?.title || "Untitled Document",
                                                categoryId: activeDoc?.categoryId || "uncategorized",
                                            }),
                                            content: newHtml,
                                            isDirty: true,
                                        },
                                    }));
                                }}
                                disabled={!canEditActiveDoc}
                            />
                        </div>
                    </div>
                ) : (
                    /* EMPTY CANVAS WHEN NO DOCUMENT TABS ARE OPEN */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[var(--app-card)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shadow-2xs">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[var(--app-text)] font-heading">
                                No document open
                            </h3>
                            <p className="text-xs text-[var(--app-muted)] max-w-sm mt-1 leading-relaxed">
                                Select a document from the left explorer tree or create a new document to write with the rich TipTap editor.
                            </p>
                        </div>
                        {canCreate && (
                            <button
                                type="button"
                                onClick={() => handleCreateDocument()}
                                className="px-3.5 py-2 bg-[var(--app-text)] text-[var(--app-bg)] text-xs font-medium rounded-[2px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create New Document</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* ADD / EDIT CATEGORY MODAL                                                 */}
            {/* ========================================================================= */}
            <ModalWrapper
                isOpen={isAddCategoryOpen}
                onClose={() => {
                    setIsAddCategoryOpen(false);
                    setEditingCategory(null);
                }}
                maxWidth="max-w-sm"
                className="p-5 flex flex-col gap-4 text-left"
            >
                <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
                    <h3 className="text-sm font-bold text-[var(--app-text)] font-heading">
                        {editingCategory ? "Rename Category" : "New Category"}
                    </h3>
                    <button
                        type="button"
                        onClick={() => setIsAddCategoryOpen(false)}
                        className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)]"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleCreateOrUpdateCategory} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-[var(--app-muted)]">Category Name</label>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g. Design & UI, API Specs, Meeting Notes"
                            className="w-full bg-[var(--app-card)] border border-[var(--app-border)] focus:border-[var(--color-accent,#1A1A1A)] px-3 py-2 rounded-[2px] text-xs text-[var(--app-text)] focus:outline-none transition-colors"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[var(--app-border)]">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddCategoryOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm">
                            {editingCategory ? "Rename" : "Create"}
                        </Button>
                    </div>
                </form>
            </ModalWrapper>

            {/* ========================================================================= */}
            {/* ADD / EDIT EXTERNAL LINK MODAL                                            */}
            {/* ========================================================================= */}
            <ModalWrapper
                isOpen={isAddLinkOpen}
                onClose={() => {
                    setIsAddLinkOpen(false);
                    setEditingLink(null);
                }}
                maxWidth="max-w-md"
                className="p-5 flex flex-col gap-4 text-left"
            >
                <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-3">
                    <h3 className="text-sm font-bold text-[var(--app-text)] font-heading">
                        {editingLink ? "Edit External Link" : "Add External Link"}
                    </h3>
                    <button
                        type="button"
                        onClick={() => setIsAddLinkOpen(false)}
                        className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)]"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSaveLink} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-[var(--app-muted)]">Title *</label>
                        <input
                            type="text"
                            value={linkTitle}
                            onChange={(e) => setLinkTitle(e.target.value)}
                            placeholder="e.g. Figma Design System, GitHub Repo, Staging Environment"
                            className="w-full bg-[var(--app-card)] border border-[var(--app-border)] focus:border-[var(--color-accent,#1A1A1A)] px-3 py-2 rounded-[2px] text-xs text-[var(--app-text)] focus:outline-none transition-colors"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-[var(--app-muted)]">URL *</label>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://figma.com/... or https://github.com/..."
                            className="w-full bg-[var(--app-card)] border border-[var(--app-border)] focus:border-[var(--color-accent,#1A1A1A)] px-3 py-2 rounded-[2px] text-xs text-[var(--app-text)] focus:outline-none transition-colors font-mono"
                            required
                        />
                    </div>



                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-[var(--app-muted)]">Note / Description (Optional)</label>
                        <textarea
                            value={linkDescription}
                            onChange={(e) => setLinkDescription(e.target.value)}
                            rows={2}
                            placeholder="Optional note for the team..."
                            className="w-full bg-[var(--app-card)] border border-[var(--app-border)] focus:border-[var(--color-accent,#1A1A1A)] p-2.5 rounded-[2px] text-xs text-[var(--app-text)] focus:outline-none transition-colors resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[var(--app-border)]">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddLinkOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm">
                            {editingLink ? "Save Changes" : "Add Link"}
                        </Button>
                    </div>
                </form>
            </ModalWrapper>
        </div>
    );
}

/* ========================================================================= */
/* TREE ITEM SUB-COMPONENTS                                                  */
/* ========================================================================= */

function DocumentTreeItem({
    doc,
    isActive,
    onOpen,
    onDelete,
    canModify,
}: {
    doc: ProjectDoc;
    isActive: boolean;
    onOpen: () => void;
    onDelete: () => void;
    canModify: boolean;
}) {
    return (
        <div
            onClick={onOpen}
            className={`group/item flex items-center justify-between px-2 py-1 rounded-[2px] transition-colors cursor-pointer text-xs ${
                isActive
                    ? "bg-[var(--app-bg)] text-[var(--app-text)] font-semibold border-l-2 border-[var(--app-text)]"
                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-bg)]/60"
            }`}
        >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[var(--color-success,#16A34A)]" : "text-[var(--app-muted)]"}`} />
                <span className="truncate">{doc.title || "Untitled Document"}</span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                {canModify ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-0.5 text-[var(--app-muted)] hover:text-[var(--color-error)] rounded-[1px] transition-colors"
                        title="Delete doc"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                ) : (
                    <span title="Read only">
                        <Lock className="w-2.5 h-2.5 text-[var(--app-muted)] opacity-50" />
                    </span>
                )}
            </div>
        </div>
    );
}

function LinkTreeItem({
    link,
    onCopy,
    isCopied,
    onEdit,
    onDelete,
    canModify,
}: {
    link: ProjectLink;
    onCopy: () => void;
    isCopied: boolean;
    onEdit?: () => void;
    onDelete: () => void;
    canModify: boolean;
}) {
    const favicon = getFaviconUrl(link.url);
    const hostname = getHostname(link.url);

    return (
        <div className="group/item flex items-start justify-between px-2 py-2 rounded-[3px] border border-transparent hover:border-[var(--app-border)] hover:bg-[var(--app-bg)] transition-all text-xs">
            {/* Left: favicon + title + hostname */}
            <div className="flex items-start gap-2 min-w-0 flex-1">
                <div className="mt-0.5 shrink-0">
                    {favicon ? (
                        <img src={favicon} alt="" className="w-4 h-4 rounded-[2px] object-contain"
                            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
                    ) : (
                        <Link2 className="w-4 h-4 text-[#2563EB]" />
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <a
                        href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--app-text)] truncate hover:underline leading-tight flex items-center gap-1"
                        title={link.url}
                    >
                        {link.title}
                        <ExternalLink className="w-2.5 h-2.5 text-[var(--app-muted)] shrink-0" />
                    </a>
                    {hostname && <span className="text-[10px] text-[var(--app-muted)] truncate">{hostname}</span>}
                    {link.description && <span className="text-[10px] text-[var(--app-muted)] truncate mt-0.5 italic">{link.description}</span>}
                </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 ml-1">
                <button type="button" onClick={(e) => { e.stopPropagation(); onCopy(); }}
                    className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors" title="Copy URL">
                    {isCopied ? <Check className="w-3 h-3 text-[var(--color-success)]" /> : <Copy className="w-3 h-3" />}
                </button>
                {onEdit && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors" title="Edit link">
                        <Edit3 className="w-3 h-3" />
                    </button>
                )}
                {canModify && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1 text-[var(--app-muted)] hover:text-[var(--color-error)] rounded-[2px] transition-colors" title="Delete link">
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
}
