"use client";

import React from "react";
import { ProfileField, ProfileInput, profileInputClass } from "./PersonalInfoSection";

interface SocialLinksSectionProps {
    telegram: string;
    whatsapp: string;
    github: string;
    onChange: (field: string, value: string) => void;
}

export const SocialLinksSection: React.FC<SocialLinksSectionProps> = ({
    telegram,
    whatsapp,
    github,
    onChange,
}) => {
    return (
        <div className="flex flex-col gap-6">
            {/* ── Handles & Profiles ── */}
            <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
                <p className="eyebrow capitalize   text-[10px] pb-2 border-b border-[#E5E5E3]">Handles &amp; Profiles</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ProfileField label="Telegram">
                        <div className="flex items-stretch">
                            <span className="flex items-center bg-[#FAFAF9] border border-r-0 border-[#E5E5E3] px-3 text-base text-[#888883] rounded-l-[2px] select-none shrink-0">
                                @
                            </span>
                            <input
                                type="text"
                                value={telegram}
                                onChange={(e) =>
                                    onChange("telegram", e.target.value.replace(/^@/, ""))
                                }
                                placeholder="username"
                                className={`${profileInputClass} rounded-l-none`}
                            />
                        </div>
                    </ProfileField>

                    <ProfileField label="WhatsApp">
                        <ProfileInput
                            type="text"
                            value={whatsapp}
                            onChange={(e) => onChange("whatsapp", e.target.value)}
                            placeholder="+1 555 123 4567"
                        />
                    </ProfileField>

                    <ProfileField label="GitHub">
                        <ProfileInput
                            type="text"
                            value={github}
                            onChange={(e) => onChange("github", e.target.value)}
                            placeholder="github-username"
                        />
                    </ProfileField>
                </div>
            </fieldset>
        </div>
    );
};
