"use client";

import React from "react";

interface PersonalInfoSectionProps {
    name: string;
    designation: string;
    bio: string;
    avatarUrl: string;
    bloodGroup: string;
    onChange: (field: string, value: string) => void;
}

const BLOOD_GROUPS = [
    { value: "", label: "Select Blood Group…" },
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
];

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
    name,
    designation,
    bio,
    bloodGroup,
    onChange,
}) => {
    return (
        <div className="flex flex-col gap-6">
            {/* ── Identity ── */}
            <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
                <p className="eyebrow capitalize   text-[10px] pb-2 border-b border-[#E5E5E3]">Identity</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ProfileField label="Full Name" required>
                        <ProfileInput
                            type="text"
                            value={name}
                            onChange={(e) => onChange("name", e.target.value)}
                            placeholder="Enter full name"
                            required
                        />
                    </ProfileField>
                    <ProfileField label="Designation / Role">
                        <ProfileInput
                            type="text"
                            value={designation}
                            onChange={(e) => onChange("designation", e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                        />
                    </ProfileField>
                </div>
            </fieldset>

            {/* ── Health Info ── */}
            <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
                <p className="eyebrow capitalize   text-[10px] pb-2 border-b border-[#E5E5E3]">Health Info</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ProfileField label="Blood Group">
                        <ProfileSelect
                            value={bloodGroup}
                            onChange={(e) => onChange("bloodGroup", e.target.value)}
                            options={BLOOD_GROUPS}
                        />
                    </ProfileField>
                </div>
            </fieldset>

            {/* ── About ── */}
            <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
                <p className="eyebrow capitalize   text-[10px] pb-2 border-b border-[#E5E5E3]">About</p>
                <ProfileField label="Bio / About Me">
                    <ProfileTextarea
                        rows={4}
                        value={bio}
                        onChange={(e) => onChange("bio", e.target.value)}
                        placeholder="Brief description about yourself, work, skills, or interests…"
                    />
                </ProfileField>
            </fieldset>
        </div>
    );
};

/* ─── Shared field primitives (design system) ─── */

export function ProfileField({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="eyebrow">
                {label}
                {required && <span className="ml-0.5 text-[#CB2431]">*</span>}
            </label>
            {children}
        </div>
    );
}

export const profileInputClass =
    "w-full px-3.5 py-2.5 border border-[#E5E5E3] hover:border-[#DADAD6] focus:border-[#1A1A1A] focus:outline-none text-base bg-white rounded-[2px] transition-colors placeholder-[#BBBBBB] text-[#1A1A1A] leading-normal";

export function ProfileInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input className={profileInputClass} {...props} />;
}

export function ProfileTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={`${profileInputClass} resize-none`} {...props} />;
}

export function ProfileSelect({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className={`${profileInputClass} cursor-pointer appearance-none pr-8`}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {/* Custom caret */}
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#888883]">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        </div>
    );
}
