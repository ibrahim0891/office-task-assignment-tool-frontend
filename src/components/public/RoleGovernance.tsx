"use client";

import React from "react";
import { Check } from "lucide-react";

const rolePermissions = [
    { name: "Create & Delegate Tasks", leader: true, member: true, observer: false },
    { name: "Reorder & Customize Board Columns", leader: true, member: false, observer: false },
    { name: "Manage Workspace Members & Roles", leader: true, member: false, observer: false },
    { name: "Solar Relational Map Access", leader: true, member: false, observer: true },
    { name: "Leader Dashboard & Analytics", leader: true, member: false, observer: false },
    { name: "Personalized 'My Day' Workflow", leader: true, member: true, observer: false },
    { name: "Docs, Articles & Bookmarks", leader: true, member: true, observer: true },
];

export default function RoleGovernance() {
    return (
        <section id="roles" className="scroll-mt-20 py-20 bg-[var(--app-hover-bg)] border-y border-[var(--app-border)]">
            <div className="max-w-5xl mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="eyebrow capitalize text-[var(--app-muted)] text-[11px] font-semibold">
                        Permission Governance
                    </span>
                    <h2 className="font-heading text-3xl font-bold text-[var(--app-text)] mt-2">
                        Tailored for Every Stakeholder
                    </h2>
                </div>

                <div className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] overflow-hidden shadow-xs">
                    <div className="grid grid-cols-4 p-4 bg-[var(--app-card)] border-b border-[var(--app-border)] text-xs font-bold text-[var(--app-text)]">
                        <span>Capability</span>
                        <span className="text-center">Leader</span>
                        <span className="text-center">Member</span>
                        <span className="text-center">Observer</span>
                    </div>

                    {rolePermissions.map((row, idx) => (
                        <div
                            key={idx}
                            className={`grid grid-cols-4 p-3.5 text-xs items-center ${idx % 2 === 1 ? "bg-[var(--app-hover-bg)]" : "bg-[var(--app-card)]"
                                } border-b border-[var(--app-border)]`}
                        >
                            <span className="font-medium text-[var(--app-text)]">{row.name}</span>
                            <span className="flex justify-center">
                                {row.leader ? <Check className="w-4 h-4 text-[#22863A]" /> : <span className="text-[var(--app-muted)]">—</span>}
                            </span>
                            <span className="flex justify-center">
                                {row.member ? <Check className="w-4 h-4 text-[#22863A]" /> : <span className="text-[var(--app-muted)]">—</span>}
                            </span>
                            <span className="flex justify-center">
                                {row.observer ? <Check className="w-4 h-4 text-[#22863A]" /> : <span className="text-[var(--app-muted)]">—</span>}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
