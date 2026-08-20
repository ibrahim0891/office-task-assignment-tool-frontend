"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useWorkspace } from "../context/WorkspaceContext";
import { api } from "../api";
import { Button } from "./ui/Button";

const inputClass =
    "px-2.5 py-1.5 border border-[#E5E5E3] focus:border-[#1A1A1A] focus:outline-none text-[11px] bg-white rounded-[3px] transition-colors w-full";

interface ConfigureColumnsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ConfigureColumnsModal({
    isOpen,
    onClose,
}: ConfigureColumnsModalProps) {
    const { columns, currentTeam, loadTeamMetadata, loadTasks } = useWorkspace();

    const [editingColumns, setEditingColumns] = useState<any[]>(columns);
    const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
    const [isSavingColumns, setIsSavingColumns] = useState(false);

    // Sync editingColumns when columns change
    useEffect(() => {
        setEditingColumns(columns);
    }, [columns]);

    if (!isOpen) return null;

    const handleColDragStart = (e: React.DragEvent, index: number) => {
        setDraggedColIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleColDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleColDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedColIndex === null || draggedColIndex === dropIndex) return;
        if (draggedColIndex === 0 || dropIndex === 0) {
            toast.error("The primary starting column cannot be reordered.");
            return;
        }

        const updated = [...editingColumns];
        const [movedCol] = updated.splice(draggedColIndex, 1);
        updated.splice(dropIndex, 0, movedCol);

        setEditingColumns(updated);
        setDraggedColIndex(null);
    };

    const handleMoveColumn = (index: number, direction: "up" | "down") => {
        if (index === 0) return;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex <= 0 || targetIndex >= editingColumns.length) return;

        const updated = [...editingColumns];
        const [movedCol] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, movedCol);

        setEditingColumns(updated);
    };

    const handleSaveColumns = async () => {
        if (!currentTeam) return;
        setIsSavingColumns(true);
        try {
            const reorderedCols = editingColumns.map((col, idx) => ({
                ...col,
                order: idx + 1,
                isComplete: idx === editingColumns.length - 1,
            }));

            await api.updateColumns(currentTeam.id, reorderedCols);
            toast.success("Board columns updated successfully");
            onClose();
            loadTeamMetadata();
            loadTasks();
        } catch (err: any) {
            toast.error(err.message || "Failed to update columns");
        } finally {
            setIsSavingColumns(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center p-4">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />
            <div
                className="relative bg-white border border-[#E5E5E3] p-5 w-full max-w-2xl flex flex-col gap-3.5 animate-fade-in text-left max-h-[85vh]"
                style={{ boxShadow: "var(--shadow-float)" }}
            >
                <h2 className="font-heading text-lg">
                    Configure Columns
                </h2>

                <div className="flex-1 overflow-y-auto flex flex-col gap-2 py-1 pr-1">
                    <div className="text-xs text-[#888883] leading-relaxed mb-1 flex flex-col gap-0.5">
                        <p>
                            Customize board columns and configure carry
                            forward rules.
                        </p>
                        <p className="text-[10px] text-[#888883]">
                            <span className="font-medium text-[#1A1A1A]">
                                ▪ Carry Forward:
                            </span>{" "}
                            Automatically moves incomplete tasks in
                            checked columns to the next day.
                        </p>
                    </div>

                    {editingColumns.map((col, index) => {
                        const isColConstant = [
                            "to do",
                            "todo",
                            "in progress",
                            "need attention later",
                            "need attention",
                            "done",
                        ].includes(col.name.toLowerCase().trim());
                        return (
                            <div
                                key={col.id || index}
                                draggable={index !== 0}
                                onDragStart={(e) =>
                                    index !== 0 &&
                                    handleColDragStart(e, index)
                                }
                                onDragOver={(e) =>
                                    index !== 0 &&
                                    handleColDragOver(e, index)
                                }
                                onDrop={(e) =>
                                    index !== 0 &&
                                    handleColDrop(e, index)
                                }
                                className={`border border-[#E5E5E3] p-3 flex flex-col sm:flex-row gap-2.5 items-start sm:items-center bg-white transition-all ${
                                    draggedColIndex === index
                                        ? "opacity-40 border-dashed border-[#1A1A1A]"
                                        : "hover:border-[#DADAD6]"
                                }`}
                            >
                                <div className="flex-1 flex gap-2 items-center w-full">
                                    <div className="flex items-center gap-1 shrink-0 text-[#888883]">
                                        {index === 0 ? (
                                            <>
                                                <span
                                                    title="Primary starting column"
                                                    className="opacity-20 select-none text-[12px] px-1 font-bold text-[#888883] cursor-not-allowed"
                                                >
                                                    ⠿
                                                </span>
                                                <div className="flex flex-col text-[9px] leading-none opacity-20 cursor-not-allowed">
                                                    <span className="px-0.5 select-none">
                                                        ▲
                                                    </span>
                                                    <span className="px-0.5 select-none">
                                                        ▼
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span
                                                    title="Drag to reorder"
                                                    className="cursor-grab active:cursor-grabbing text-[12px] px-1 hover:text-[#1A1A1A] select-none font-bold"
                                                >
                                                    ⠿
                                                </span>
                                                <div className="flex flex-col text-[9px] leading-none">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            index <= 1
                                                        }
                                                        onClick={() =>
                                                            handleMoveColumn(
                                                                index,
                                                                "up",
                                                            )
                                                        }
                                                        className="hover:text-[#1A1A1A] disabled:opacity-20 px-0.5"
                                                        title="Move up"
                                                    >
                                                        ▲
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            index ===
                                                                0 ||
                                                            index ===
                                                                editingColumns.length -
                                                                    1
                                                        }
                                                        onClick={() =>
                                                            handleMoveColumn(
                                                                index,
                                                                "down",
                                                            )
                                                        }
                                                        className="hover:text-[#1A1A1A] disabled:opacity-20 px-0.5"
                                                        title="Move down"
                                                    >
                                                        ▼
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={col.name}
                                        disabled={isColConstant}
                                        readOnly={isColConstant}
                                        title={
                                            isColConstant
                                                ? "Constant column name cannot be edited."
                                                : ""
                                        }
                                        onChange={(e) => {
                                            if (isColConstant) return;
                                            const updated = [
                                                ...editingColumns,
                                            ];
                                            updated[index].name =
                                                e.target.value;
                                            setEditingColumns(updated);
                                        }}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="flex flex-wrap gap-3 items-center shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                                    <label
                                        className="flex items-center gap-1.5 text-[11px] text-[#888883] cursor-pointer"
                                        title="Automatically carry forward incomplete tasks to the next day"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={
                                                col.triggersCarryForward !==
                                                false
                                            }
                                            onChange={(e) => {
                                                const updated = [
                                                    ...editingColumns,
                                                ];
                                                updated[
                                                    index
                                                ].triggersCarryForward =
                                                    e.target.checked;
                                                setEditingColumns(
                                                    updated,
                                                );
                                            }}
                                            className="rounded-[2px]"
                                        />
                                        Carry Forward
                                    </label>

                                    {isColConstant ? (
                                        <span className="text-[11px] text-transparent select-none">
                                            Delete
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingColumns(
                                                    (prev) =>
                                                        prev.filter(
                                                            (_, idx) =>
                                                                idx !==
                                                                index,
                                                        ),
                                                );
                                            }}
                                            className="text-[11px] text-[#CB2431] hover:underline cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => {
                            setEditingColumns((prev) => [
                                ...prev,
                                {
                                    name: "New Column",
                                    order: prev.length + 1,
                                    wipLimit: null,
                                    isComplete: false,
                                    triggersCarryForward: true,
                                },
                            ]);
                        }}
                        className="relative corner-brackets-4 py-2 border border-dashed border-[#E5E5E3] hover:border-[#1A1A1A] text-[11px] text-[#888883] hover:text-[#1A1A1A] font-medium rounded-[3px] transition-colors mt-1 cursor-pointer"
                    >
                        + Add Column
                    </button>
                </div>

                <div className="flex justify-end gap-2 shrink-0 pt-2 border-t border-[#E5E5E3]">
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={isSavingColumns}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSaveColumns}
                        isLoading={isSavingColumns}
                        loadingText="Saving Changes…"
                        showDot
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
