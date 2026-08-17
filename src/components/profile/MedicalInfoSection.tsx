"use client";

import React from "react";

interface MedicalInfoSectionProps {
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

const inputClass =
    "w-full px-3 py-1.5 border border-[#E5E5E3] focus:border-[#1A1A1A] focus:outline-none text-base bg-white rounded-[3px] transition-colors cursor-pointer";

export const MedicalInfoSection: React.FC<MedicalInfoSectionProps> = ({
    bloodGroup,
    onChange,
}) => {
    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-[#888883] capitalize capitalize">
                Medical & Health Info
            </h2>

            <div className="max-w-xs flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#888883]">
                    Blood Group
                </label>
                <select
                    value={bloodGroup}
                    onChange={(e) => onChange("bloodGroup", e.target.value)}
                    className={inputClass}
                >
                    {BLOOD_GROUPS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};
