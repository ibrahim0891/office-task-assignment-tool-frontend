"use client";

import React, { useState } from "react";
import { User } from "../../api";
import { AvatarUploader } from "./AvatarUploader";
import { Camera, X } from "lucide-react";

interface ProfileHeaderProps {
    user: Partial<User>;
    isSaving: boolean;
    isDirty?: boolean;
    onSave: () => void;
    onCancel?: () => void;
    onAvatarChange: (newAvatarUrl: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    user,
    isSaving,
    isDirty,
    onSave,
    onCancel,
    onAvatarChange,
}) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const initials = user.fullName
        ? user.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "U";

    return (
        <>
            <div className="p-6 md:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-5 min-w-0">
                    {/* Avatar with camera overlay */}
                    <div
                        onClick={() => setIsUploadModalOpen(true)}
                        className="group relative w-16 h-16 rounded-full bg-[#1A1A1A] text-white font-bold text-lg flex items-center justify-center overflow-hidden shrink-0 border-2 border-[#E5E5E3] cursor-pointer hover:border-[#1A1A1A] transition-all shadow-xs"
                        title="Click to change photo"
                    >
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.fullName || "Avatar"}
                                className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                            />
                        ) : (
                            <span>{initials}</span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-base transition-opacity">
                            <Camera className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-lg md:text-xl font-semibold font-heading text-[#1A1A1A] truncate">
                                {user.fullName || "User Profile"}
                            </h1>
                            {user.designation && (
                                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-[2px] bg-[#FAFAF9] border border-[#E5E5E3] text-[#888883]">
                                    {user.designation}
                                </span>
                            )}
                            {user.bloodGroup && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[2px] bg-[#CB2431]/10 text-[#CB2431] border border-[#CB2431]/20">
                                    🩸 {user.bloodGroup}
                                </span>
                            )}
                        </div>
                        <p className="text-[12px] text-[#888883] truncate">
                            {user.email || "No email registered"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0 flex-wrap">
                    {isDirty && onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSaving}
                            className="px-3.5 py-2 text-[11px] font-medium text-[#888883] hover:text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#FAFAF9] rounded-[2px] transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    )}
                    {isDirty && (
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isSaving}
                            className="relative corner-brackets-4 bg-[#1A1A1A] hover:bg-[#333333] text-white text-[11px] font-medium px-4 py-2 rounded-[2px] transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                        >
                            {isSaving ? "Saving…" : "Save Changes"}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="relative corner-brackets-4 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] text-[11px] font-medium px-4 py-2 rounded-[2px] transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
                    >
                        <Camera className="w-3.5 h-3.5 text-[#888883]" />
                        <span>Change Photo</span>
                    </button>
                </div>
            </div>

            {/* Photo Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                    <div className="relative bg-white border border-[#E5E5E3] rounded-[3px] p-5 max-w-md w-full flex flex-col gap-4 shadow-2xl corner-brackets animate-fade-in text-left">
                        <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                            <div>
                                <span className="eyebrow block">Media Upload</span>
                                <h3 className="text-base font-semibold text-[#1A1A1A] font-heading">
                                    Upload Profile Photo
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsUploadModalOpen(false)}
                                className="p-1 text-[#888883] hover:text-[#1A1A1A] rounded-[2px] transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <AvatarUploader
                            avatarUrl={user.avatarUrl || ""}
                            onChange={(newUrl: string) => {
                                onAvatarChange(newUrl);
                                setIsUploadModalOpen(false);
                            }}
                        />

                        <div className="flex justify-end pt-2 border-t border-[#E5E5E3]">
                            <button
                                type="button"
                                onClick={() => setIsUploadModalOpen(false)}
                                className="px-3.5 py-1.5 text-[11px] font-medium text-[#888883] hover:text-[#1A1A1A] border border-[#E5E5E3] rounded-[2px] transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
