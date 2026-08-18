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

interface TipTapEditorProps {
    value: string;
    onChange: (html: string) => void;
    disabled?: boolean;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
    value,
    onChange,
    disabled = false,
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
            <div className="border border-[#E5E5E3] bg-white p-3 rounded-[3px] min-h-24 text-[11px] text-[#888883]">
                Loading Editor…
            </div>
        );
    }

    return (
        <div className="relative border border-[#E5E5E3] bg-white rounded-[3px] focus:outline-none focus-within:outline-none focus-within:ring-0 flex flex-col flex-1 min-h-0 h-full text-left corner-brackets">
            {/* Toolbar */}
            {!disabled && (
                <div className="border-b border-[#E5E5E3] bg-[#FAFAF9] p-1.5 flex flex-wrap items-center gap-1 shrink-0 select-none">
                    {/* Paragraph & Headings H1, H2, H3 */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setParagraph().run()}
                        className="px-1.5 py-0.5 rounded-[2px] text-[10px] font-medium text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Paragraph (Normal Text)"
                    >
                        P
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className="p-1 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Heading 1"
                    >
                        <Heading1 className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className="p-1 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Heading 2"
                    >
                        <Heading2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className="p-1 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Heading 3"
                    >
                        <Heading3 className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3.5 bg-[#E5E5E3] mx-0.5" />

                    {/* Basic Formatting: Bold, Italic, Strike */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className="p-1 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Bold"
                    >
                        <Bold className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className="p-1 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Italic"
                    >
                        <Italic className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className="p-1 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Strikethrough"
                    >
                        <Strikethrough className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3.5 bg-[#E5E5E3] mx-0.5" />

                    {/* Lists */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className="p-1 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Bullet List"
                    >
                        <List className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className="p-1 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Ordered List"
                    >
                        <ListOrdered className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3.5 bg-[#E5E5E3] mx-0.5" />

                    {/* Code & Quotes & HR */}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className="p-1 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Code Block"
                    >
                        <Code className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className="p-1 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Blockquote"
                    >
                        <Quote className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        className="p-1 rounded-[2px] text-[#888883] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/50 transition-colors cursor-pointer"
                        title="Horizontal Line"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3.5 bg-[#E5E5E3] mx-0.5" />

                    {/* Table Actions Group */}
                    <div className="flex items-center gap-0.5 bg-white border border-[#E5E5E3] rounded-[2px] p-0.5">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                            className="p-1 rounded-[2px] text-[#1A1A1A] hover:bg-[#FAFAF9] transition-colors cursor-pointer"
                            title="Insert 3x3 Table"
                        >
                            <TableIcon className="w-3.5 h-3.5" />
                        </button>
                        <select
                            value=""
                            onChange={(e) => {
                                const action = e.target.value;
                                if (action === "addRow") editor.chain().focus().addRowAfter().run();
                                else if (action === "addCol") editor.chain().focus().addColumnAfter().run();
                                else if (action === "merge") editor.chain().focus().mergeCells().run();
                                else if (action === "split") editor.chain().focus().splitCell().run();
                                else if (action === "delRow") editor.chain().focus().deleteRow().run();
                                else if (action === "delCol") editor.chain().focus().deleteColumn().run();
                                else if (action === "delTable") editor.chain().focus().deleteTable().run();
                            }}
                            className="text-[10px] bg-transparent text-[#888883] hover:text-[#1A1A1A] cursor-pointer focus:outline-none pr-1"
                            title="Table Options"
                        >
                            <option value="" disabled>Table Edit ▾</option>
                            <option value="addRow">+ Add Row Below</option>
                            <option value="addCol">+ Add Column Right</option>
                            <option value="merge">⚡ Merge Cells</option>
                            <option value="split">✂ Split Cell</option>
                            <option value="delRow">✕ Delete Row</option>
                            <option value="delCol">✕ Delete Column</option>
                            <option value="delTable">🗑 Delete Table</option>
                        </select>
                    </div>

                    <div className="w-px h-3.5 bg-[#E5E5E3] mx-0.5" />

                    {/* Fonts Selection */}
                    <div className="flex items-center gap-1 pl-1">
                        <Type className="w-3 h-3 text-[#888883]" />
                        <select
                            value={editor.getAttributes("textStyle").fontFamily || ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                    editor.chain().focus().setFontFamily(val).run();
                                } else {
                                    editor.chain().focus().unsetFontFamily().run();
                                }
                            }}
                            className="text-[10px] bg-white border border-[#E5E5E3] rounded-[2px] px-1 py-0.5 text-[#1A1A1A] cursor-pointer focus:outline-none"
                            title="Font Family"
                        >
                            <option value="">Default Font</option>
                            <option value="var(--font-instrument-serif), 'Times New Roman', Times, serif">Serif</option>
                            <option value="var(--font-inter), Inter, -apple-system, sans-serif">Sans</option>
                            <option value="Courier New, Courier, monospace">Mono</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="p-3 flex-1 min-h-0 overflow-y-auto scrollbar-none text-[11px] leading-relaxed text-[#1A1A1A] focus:outline-none flex flex-col cursor-text" onClick={() => editor.chain().focus().run()}>
                <EditorContent
                    editor={editor}
                    className="prose-content flex-1 min-h-0 focus:outline-none [&_.is-editor-empty]:before:content-['Describe_this_task…'] [&_.is-editor-empty]:before:text-[#888883] [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none"
                />
            </div>
        </div>
    );
};
