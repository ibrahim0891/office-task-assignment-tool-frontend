"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import {
    Combine,
    Split,
    Rows3,
    Columns3,
    Trash2,
} from "lucide-react";
import { CustomSelect, SelectOption } from "./CustomSelect";

interface TipTapTableOperationsProps {
    editor: Editor;
}

const TABLE_OPERATION_OPTIONS: SelectOption[] = [
    { value: "merge", label: "⚡ Merge Selected Cells" },
    { value: "split", label: "✂ Split Cell" },
    { value: "mergeOrSplit", label: "⚡/✂ Merge or Split" },
    { value: "addRowAfter", label: "+ Add Row Below" },
    { value: "addRowBefore", label: "+ Add Row Above" },
    { value: "addColAfter", label: "+ Add Column Right" },
    { value: "addColBefore", label: "+ Add Column Left" },
    { value: "toggleHeaderRow", label: "H Toggle Header Row" },
    { value: "toggleHeaderCol", label: "H Toggle Header Col" },
    { value: "deleteRow", label: "✕ Delete Current Row" },
    { value: "deleteCol", label: "✕ Delete Current Column" },
    { value: "deleteTable", label: "🗑 Delete Table" },
];

export const TipTapTableOperations: React.FC<TipTapTableOperationsProps> = ({ editor }) => {
    const isInsideTable = editor.isActive("table");

    const handleAction = (action: string) => {
        if (!action) return;

        if (action === "addRowAfter") {
            editor.chain().focus().addRowAfter().run();
        } else if (action === "addRowBefore") {
            editor.chain().focus().addRowBefore().run();
        } else if (action === "addColAfter") {
            editor.chain().focus().addColumnAfter().run();
        } else if (action === "addColBefore") {
            editor.chain().focus().addColumnBefore().run();
        } else if (action === "merge") {
            const ok = editor.chain().focus().mergeCells().run();
            if (!ok) {
                editor.chain().focus().mergeOrSplit().run();
            }
        } else if (action === "split") {
            const ok = editor.chain().focus().splitCell().run();
            if (!ok) {
                editor.chain().focus().mergeOrSplit().run();
            }
        } else if (action === "mergeOrSplit") {
            editor.chain().focus().mergeOrSplit().run();
        } else if (action === "toggleHeaderRow") {
            editor.chain().focus().toggleHeaderRow().run();
        } else if (action === "toggleHeaderCol") {
            editor.chain().focus().toggleHeaderColumn().run();
        } else if (action === "deleteRow") {
            editor.chain().focus().deleteRow().run();
        } else if (action === "deleteCol") {
            editor.chain().focus().deleteColumn().run();
        } else if (action === "deleteTable") {
            editor.chain().focus().deleteTable().run();
        }
    };

    return (
        <div className="flex items-center gap-1">
            {/* Table Operations Dropdown */}
            <CustomSelect
                options={TABLE_OPERATION_OPTIONS}
                value=""
                onChange={handleAction}
                placeholder="Table Edit"
                buttonClassName={`!py-0.5 !px-1.5 !text-[10px] !h-6 !min-h-0 ${
                    isInsideTable
                        ? "!border-[var(--color-accent)]/50 text-[var(--color-accent)] font-medium"
                        : ""
                }`}
                className="w-24"
            />

            {/* Contextual Quick Action Buttons when inside a table */}
            {isInsideTable && (
                <div className="flex items-center gap-0.5 animate-fade-in pl-0.5 border-l border-[var(--app-border)]/60">
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                            const ok = editor.chain().focus().mergeCells().run();
                            if (!ok) editor.chain().focus().mergeOrSplit().run();
                        }}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--app-select-bg)] transition-colors cursor-pointer"
                        title="Merge Selected Cells"
                    >
                        <Combine className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                            const ok = editor.chain().focus().splitCell().run();
                            if (!ok) editor.chain().focus().mergeOrSplit().run();
                        }}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--app-select-bg)] transition-colors cursor-pointer"
                        title="Split Cell"
                    >
                        <Split className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().addRowAfter().run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Add Row Below"
                    >
                        <Rows3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().addColumnAfter().run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50 transition-colors cursor-pointer"
                        title="Add Column Right"
                    >
                        <Columns3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().deleteRow().run()}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors cursor-pointer"
                        title="Delete Row"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
};
