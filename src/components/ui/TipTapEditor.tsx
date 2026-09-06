"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FontFamily } from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Minus,
    Type,
    Table as TableIcon,
    TableProperties,
    Combine,
    Split,
    Plus,
    Trash2,
} from "lucide-react";

import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CustomSelect, SelectOption } from "./CustomSelect";

interface TipTapEditorProps {
    value: string;
    onChange: (html: string) => void;
    disabled?: boolean;
    borderless?: boolean;
    className?: string;
}

const FONT_OPTIONS: SelectOption[] = [
    { value: "", label: "Default Font" },
    { value: "var(--font-instrument-serif), 'Times New Roman', Times, serif", label: "Serif", style: { fontFamily: "var(--font-instrument-serif), 'Times New Roman', Times, serif" } },
    { value: "var(--font-inter), Inter, -apple-system, sans-serif", label: "Sans", style: { fontFamily: "var(--font-inter), Inter, -apple-system, sans-serif" } },
    { value: "Courier New, Courier, monospace", label: "Mono", style: { fontFamily: "Courier New, Courier, monospace" } },
];

const TABLE_OPTIONS: SelectOption[] = [
    { value: "addRow", label: "+ Add Row Below" },
    { value: "addCol", label: "+ Add Column Right" },
    { value: "merge", label: "⚡ Merge Cells" },
    { value: "split", label: "✂ Split Cell" },
    { value: "delRow", label: "✕ Delete Row" },
    { value: "delCol", label: "✕ Delete Column" },
    { value: "delTable", label: "🗑 Delete Table" },
];

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
    value,
    onChange,
    disabled = false,
    borderless = false,
    className = "",
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            TextStyle,
            FontFamily,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: value || "",
        editable: !disabled,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [disabled, editor]);

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || "");
        }
    }, [value, editor]);

    if (!editor) {
        return (
            <div className="border border-[var(--app-border)] bg-[var(--app-card)] p-3 rounded-[3px] min-h-24 text-[11px] text-[var(--app-muted)]">
                Loading Editor…
            </div>
        );
    }

    return (
        <div className={`relative bg-[var(--app-card)] focus:outline-none focus-within:outline-none focus-within:ring-0 flex flex-col flex-1 min-h-0 h-full text-left ${
            borderless ? "" : "border border-[var(--app-border)] rounded-[3px] corner-brackets"
        } ${className}`}>
            {/* Toolbar */}
            {!disabled && (
                <div className="border-b border-[var(--app-border)] bg-[var(--app-bg)] p-1.5 flex flex-wrap items-center gap-1 shrink-0 select-none">
                    {/* Paragraph & Headings H1, H2, H3 */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setParagraph().run()}
                        className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-medium text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Paragraph (Normal Text)"
                    >
                        P
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Heading 1"
                    >
                        <Heading1 className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Heading 2"
                    >
                        <Heading2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Heading 3"
                    >
                        <Heading3 className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3.5 bg-[var(--app-border)] mx-0.5" />

                    {/* Basic Formatting: Bold, Italic, Strike */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Bold"
                    >
                        <Bold className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Italic"
                    >
                        <Italic className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Strikethrough"
                    >
                        <Strikethrough className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3.5 bg-[var(--app-border)] mx-0.5" />

                    {/* Lists */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Bullet List"
                    >
                        <List className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Ordered List"
                    >
                        <ListOrdered className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3.5 bg-[var(--app-border)] mx-0.5" />

                    {/* Code & Quotes & HR */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Code Block"
                    >
                        <Code className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Blockquote"
                    >
                        <Quote className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Horizontal Line"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3.5 bg-[var(--app-border)] mx-0.5" />

                    {/* Table Actions Group */}
                    <div className="flex items-center gap-0.5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] p-0.5">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                            className="p-1 rounded-[2px] text-[var(--app-text)] hover:bg-[var(--app-bg)] transition-colors cursor-pointer"
                            title="Insert 3x3 Table"
                        >
                            <TableIcon className="w-3.5 h-3.5" />
                        </button>
                        <CustomSelect
                            options={TABLE_OPTIONS}
                            value=""
                            onChange={(action) => {
                                if (action === "addRow") editor.chain().focus().addRowAfter().run();
                                else if (action === "addCol") editor.chain().focus().addColumnAfter().run();
                                else if (action === "merge") editor.chain().focus().mergeCells().run();
                                else if (action === "split") editor.chain().focus().splitCell().run();
                                else if (action === "delRow") editor.chain().focus().deleteRow().run();
                                else if (action === "delCol") editor.chain().focus().deleteColumn().run();
                                else if (action === "delTable") editor.chain().focus().deleteTable().run();
                            }}
                            placeholder="Table Edit"
                            buttonClassName="!py-0.5 !px-1.5 !text-[10px] !h-5 !min-h-0 !border-0 !bg-transparent hover:!bg-[var(--app-bg)] !shadow-none"
                            className="w-28"
                        />
                    </div>

                    <div className="w-px h-3.5 bg-[var(--app-border)] mx-0.5" />

                    {/* Fonts Selection */}
                    <div className="flex items-center gap-1 pl-1">
                        <Type className="w-3 h-3 text-[var(--app-muted)] shrink-0" />
                        <CustomSelect
                            options={FONT_OPTIONS}
                            value={editor.getAttributes("textStyle").fontFamily || ""}
                            onChange={(val) => {
                                if (val) {
                                    editor.chain().focus().setFontFamily(val).run();
                                } else {
                                    editor.chain().focus().unsetFontFamily().run();
                                }
                            }}
                            placeholder="Default Font"
                            buttonClassName="!py-0.5 !px-1.5 !text-[10px] !h-6 !min-h-0"
                            className="w-28"
                        />
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="p-3 flex-1 min-h-0 overflow-y-auto scrollbar-none text-[11px] leading-relaxed text-[var(--app-text)] focus:outline-none flex flex-col cursor-text" onClick={() => editor.chain().focus().run()}>
                <EditorContent
                    editor={editor}
                    className="prose-content flex-1 min-h-0 focus:outline-none [&_.is-editor-empty]:before:content-['Describe_this_task…'] [&_.is-editor-empty]:before:text-[var(--app-muted)] [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none"
                />
            </div>
        </div>
    );
};
