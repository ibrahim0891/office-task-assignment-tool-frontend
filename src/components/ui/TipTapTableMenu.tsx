"use client";

import React, { useState, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import {
    Table as TableIcon,
    ChevronDown,
    Trash2,
    Split,
    Combine,
    Rows3,
    Columns3,
} from "lucide-react";

interface TipTapTableMenuProps {
    editor: Editor;
}

const GRID_ROWS = 6;
const GRID_COLS = 6;

export const TipTapTableMenu: React.FC<TipTapTableMenuProps> = ({ editor }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredGrid, setHoveredGrid] = useState<{ rows: number; cols: number }>({ rows: 3, cols: 3 });
    const menuRef = useRef<HTMLDivElement>(null);
    const isInsideTable = editor.isActive("table");

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

    const handleInsert = (rows: number, cols: number) => {
        editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
        setIsOpen(false);
    };

    const runTableAction = (action: () => boolean) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`p-1 rounded-[2px] flex items-center gap-1 transition-colors cursor-pointer text-[10px] font-medium ${
                    isInsideTable
                        ? "bg-[var(--app-select-bg)] text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]/30"
                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-border)]/50"
                }`}
                title="Table controls"
            >
                <TableIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline text-[10px]">Table</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </button>

            {isOpen && (
                <div
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute left-0 top-full mt-1 w-64 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-2.5 shadow-xl z-50 animate-fade-in corner-brackets text-[11px]"
                >
                    {/* Visual Grid Picker for Table Insertion */}
                    <div className="mb-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--app-muted)]">
                                Insert Table
                            </span>
                            <span className="text-[10px] font-semibold text-[var(--color-accent)]">
                                {hoveredGrid.rows > 0 && hoveredGrid.cols > 0
                                    ? `${hoveredGrid.cols} × ${hoveredGrid.rows}`
                                    : "Select grid"}
                            </span>
                        </div>

                        {/* Interactive Grid */}
                        <div
                            className="grid grid-cols-6 gap-1 p-1.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] cursor-pointer"
                            onMouseLeave={() => setHoveredGrid({ rows: 3, cols: 3 })}
                        >
                            {Array.from({ length: GRID_ROWS }).map((_, r) =>
                                Array.from({ length: GRID_COLS }).map((_, c) => {
                                    const rowNum = r + 1;
                                    const colNum = c + 1;
                                    const isHighlighted =
                                        rowNum <= hoveredGrid.rows && colNum <= hoveredGrid.cols;

                                    return (
                                        <div
                                            key={`${r}-${c}`}
                                            onMouseEnter={() => setHoveredGrid({ rows: rowNum, cols: colNum })}
                                            onClick={() => handleInsert(rowNum, colNum)}
                                            className={`h-3 rounded-[1px] border transition-colors ${
                                                isHighlighted
                                                    ? "bg-[var(--color-accent)]/30 border-[var(--color-accent)]"
                                                    : "bg-[var(--app-card)] border-[var(--app-border)]/60"
                                            }`}
                                        />
                                    );
                                })
                            )}
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 mt-1.5">
                            {[
                                { r: 2, c: 2, label: "2×2" },
                                { r: 3, c: 3, label: "3×3" },
                                { r: 4, c: 4, label: "4×4" },
                                { r: 5, c: 3, label: "3×5" },
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => handleInsert(preset.r, preset.c)}
                                    className="flex-1 py-0.5 text-[10px] bg-[var(--app-bg)] hover:bg-[var(--app-hover-bg)] hover:text-[var(--app-text)] border border-[var(--app-border)] rounded-[2px] text-[var(--app-muted)] transition-colors cursor-pointer text-center"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contextual Table Operations */}
                    {isInsideTable && (
                        <div className="border-t border-[var(--app-border)] pt-2 mt-2 space-y-2">
                            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--app-muted)]">
                                Active Table Actions
                            </div>

                            {/* Row & Column Actions */}
                            <div className="grid grid-cols-2 gap-1">
                                <button
                                    type="button"
                                    onClick={() => runTableAction(() => editor.chain().focus().addRowBefore().run())}
                                    className="flex items-center gap-1 px-1.5 py-1 rounded-[2px] bg-[var(--app-bg)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] border border-[var(--app-border)] text-left cursor-pointer transition-colors"
                                >
                                    <Rows3 className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>+ Row Above</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => runTableAction(() => editor.chain().focus().addRowAfter().run())}
                                    className="flex items-center gap-1 px-1.5 py-1 rounded-[2px] bg-[var(--app-bg)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] border border-[var(--app-border)] text-left cursor-pointer transition-colors"
                                >
                                    <Rows3 className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>+ Row Below</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => runTableAction(() => editor.chain().focus().addColumnBefore().run())}
                                    className="flex items-center gap-1 px-1.5 py-1 rounded-[2px] bg-[var(--app-bg)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] border border-[var(--app-border)] text-left cursor-pointer transition-colors"
                                >
                                    <Columns3 className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>+ Col Left</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => runTableAction(() => editor.chain().focus().addColumnAfter().run())}
                                    className="flex items-center gap-1 px-1.5 py-1 rounded-[2px] bg-[var(--app-bg)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] border border-[var(--app-border)] text-left cursor-pointer transition-colors"
                                >
                                    <Columns3 className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>+ Col Right</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => runTableAction(() => editor.chain().focus().deleteRow().run())}
                                    className="flex items-center gap-1 px-1.5 py-1 rounded-[2px] bg-[var(--app-bg)] hover:bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--app-border)] text-left cursor-pointer transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete Row</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => runTableAction(() => editor.chain().focus().deleteColumn().run())}
                                    className="flex items-center gap-1 px-1.5 py-1 rounded-[2px] bg-[var(--app-bg)] hover:bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--app-border)] text-left cursor-pointer transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete Col</span>
                                </button>
                            </div>

                            {/* Cell & Header Actions */}
                            <div className="grid grid-cols-2 gap-1 pt-1">
                                <button
                                    type="button"
                                    onClick={() => runTableAction(() => editor.chain().focus().mergeCells().run())}
                                    className="flex items-center gap-1 px-1.5 py-1 rounded-[2px] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] text-left cursor-pointer transition-colors"
                                >
                                    <Combine className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>Merge Cells</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => runTableAction(() => editor.chain().focus().splitCell().run())}
                                    className="flex items-center gap-1 px-1.5 py-1 rounded-[2px] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] text-left cursor-pointer transition-colors"
                                >
                                    <Split className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>Split Cell</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => runTableAction(() => editor.chain().focus().toggleHeaderRow().run())}
                                    className="flex items-center gap-1 px-1.5 py-1 rounded-[2px] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] text-left cursor-pointer transition-colors"
                                >
                                    <span className="w-3 h-3 inline-flex items-center justify-center font-bold text-[9px]">H</span>
                                    <span>Header Row</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => runTableAction(() => editor.chain().focus().toggleHeaderColumn().run())}
                                    className="flex items-center gap-1 px-1.5 py-1 rounded-[2px] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] text-left cursor-pointer transition-colors"
                                >
                                    <span className="w-3 h-3 inline-flex items-center justify-center font-bold text-[9px]">H</span>
                                    <span>Header Col</span>
                                </button>
                            </div>

                            {/* Delete Table Action */}
                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={() => runTableAction(() => editor.chain().focus().deleteTable().run())}
                                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-[2px] bg-[var(--color-error)]/10 hover:bg-[var(--color-error)]/20 text-[var(--color-error)] font-medium text-left cursor-pointer transition-colors border border-[var(--color-error)]/30"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete Entire Table</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
