"use client";

import React from "react";
import { ProfileField, ProfileInput } from "./PersonalInfoSection";

interface ContactInfoSectionProps {
    secondaryEmail: string;
    primaryPhone: string;
    secondaryPhone: string;
    emergencyContact: string;
    onChange: (field: string, value: string) => void;
}

export const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({
    secondaryEmail,
    primaryPhone,
    secondaryPhone,
    emergencyContact,
    onChange,
}) => {
    return (
        <div className="flex flex-col gap-6">
            {/* ── Email ── */}
            <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
                <p className="eyebrow uppercase tracking-[0.12em] text-[10px] pb-2 border-b border-[#E5E5E3]">Email</p>
                <div className="grid grid-cols-1 gap-3">
                    <ProfileField label="Secondary Email">
                        <ProfileInput
                            type="email"
                            value={secondaryEmail}
                            onChange={(e) => onChange("secondaryEmail", e.target.value)}
                            placeholder="personal.email@example.com"
                        />
                    </ProfileField>
                </div>
            </fieldset>

            {/* ── Phone Numbers ── */}
            <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
                <p className="eyebrow uppercase tracking-[0.12em] text-[10px] pb-2 border-b border-[#E5E5E3]">Phone Numbers</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ProfileField label="Primary Phone">
                        <ProfileInput
                            type="tel"
                            value={primaryPhone}
                            onChange={(e) => onChange("primaryPhone", e.target.value)}
                            placeholder="+1 (555) 000-0000"
                        />
                    </ProfileField>
                    <ProfileField label="Secondary Phone">
                        <ProfileInput
                            type="tel"
                            value={secondaryPhone}
                            onChange={(e) => onChange("secondaryPhone", e.target.value)}
                            placeholder="+1 (555) 000-1111"
                        />
                    </ProfileField>
                </div>
            </fieldset>

            {/* ── Emergency ── */}
            <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
                <p className="eyebrow uppercase tracking-[0.12em] text-[10px] pb-2 border-b border-[#E5E5E3]">Emergency</p>
                <div className="grid grid-cols-1 gap-3">
                    <ProfileField label="Emergency Contact">
                        <ProfileInput
                            type="text"
                            value={emergencyContact}
                            onChange={(e) => onChange("emergencyContact", e.target.value)}
                            placeholder="Name & Contact (e.g. Spouse: +1-555-9999)"
                        />
                    </ProfileField>
                </div>
            </fieldset>
        </div>
    );
};
