"use client";

import React, { useState } from "react";
import { User } from "../../api";
import { AvatarUploader } from "./AvatarUploader";
import { Camera, X } from "lucide-react";

interface ProfileHeaderProps {
    user: Partial<User>;
    isSaving: boolean;
    onSave: () => void;
    onAvatarChange: (newAvatarUrl: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    user,
    onAvatarChange,
}) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const initials = user.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "U";

    return (
        <>
            <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    {/* Avatar with camera overlay */}
                    <div
                        onClick={() => setIsUploadModalOpen(true)}
                        className="group relative w-14 h-14 rounded-full bg-[#1A1A1A] text-white font-bold text-base flex items-center justify-center overflow-hidden shrink-0 border border-[#E5E5E3] cursor-pointer hover:border-[#1A1A1A] transition-all shadow-xs"
                        title="Click to change photo"
                    >
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.name || "Avatar"}
                                className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                            />
                        ) : (
                            <span>{initials}</span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">
                            <Camera className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-base font-semibold font-heading text-[#1A1A1A] truncate">
                                {user.name || "User Profile"}
                            </h1>
                        </div>
                        <p className="text-[11px] text-[#888883] truncate">
                            {user.designation || "Team Member"} • {user.email}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="relative corner-brackets-4 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] text-[11px] font-medium px-3.5 py-1.5 rounded-[2px] transition-colors cursor-pointer shrink-0"
                >
                    Change Photo
                </button>
            </div>

            {/* Photo Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                    <div className="relative bg-white border border-[#E5E5E3] rounded-[3px] p-5 max-w-md w-full flex flex-col gap-4 shadow-2xl corner-brackets animate-fade-in text-left">
                        <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
                            <div>
                                <span className="eyebrow block">Media Upload</span>
                                <h3 className="text-sm font-semibold text-[#1A1A1A] font-heading">
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
