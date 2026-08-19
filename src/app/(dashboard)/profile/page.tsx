"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { api, User } from "@/api";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { ContactInfoSection } from "@/components/profile/ContactInfoSection";
import { SocialLinksSection } from "@/components/profile/SocialLinksSection";
import { SkeletonProfile } from "@/components/ui/SkeletonLoader";
import { Button } from "@/components/ui/Button";
import { User as UserIcon, Phone, Share2, ChevronLeft } from "lucide-react";

export default function ProfilePage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<
        "personal" | "contact" | "social"
    >("personal");

    // Profile form state
    const [formData, setFormData] = useState({
        name: "",
        avatarUrl: "",
        secondaryEmail: "",
        primaryPhone: "",
        secondaryPhone: "",
        emergencyContact: "",
        telegram: "",
        whatsapp: "",
        github: "",
        bloodGroup: "",
        designation: "",
        bio: "",
    });

    useEffect(() => {
        async function initUser() {
            let user: User | null = null;
            const savedUserStr =
                localStorage.getItem("sessionUser") ||
                localStorage.getItem("task_user");

            if (savedUserStr) {
                try {
                    user = JSON.parse(savedUserStr);
                } catch (e) {}
            }

            if (!user) {
                try {
                    const allUsers = await api.getUsers();
                    if (allUsers.length > 0) {
                        user = allUsers[0];
                        localStorage.setItem(
                            "sessionUser",
                            JSON.stringify(user),
                        );
                    }
                } catch (e) {}
            }

            if (user) {
                setCurrentUser(user);
                await loadProfile(user.id);
            } else {
                setIsLoading(false);
            }
        }

        initUser();
    }, []);

    const loadProfile = async (userId: string) => {
        try {
            const data = await api.getUserProfile(userId);
            setFormData({
                name: data.name || "",
                avatarUrl: data.avatarUrl || "",
                secondaryEmail: data.secondaryEmail || "",
                primaryPhone: data.primaryPhone || "",
                secondaryPhone: data.secondaryPhone || "",
                emergencyContact: data.emergencyContact || "",
                telegram: data.telegram || "",
                whatsapp: data.whatsapp || "",
                github: data.github || "",
                bloodGroup: data.bloodGroup || "",
                designation: data.designation || "",
                bio: data.bio || "",
            });
        } catch (err: any) {
            toast.error(err.message || "Failed to load profile details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSave = async () => {
        if (!currentUser) return;
        if (!formData.name.trim()) {
            toast.error("Name is required.");
            return;
        }

        setIsSaving(true);
        try {
            const updated = await api.updateUserProfile(
                currentUser.id,
                formData,
            );

            const updatedLocalUser = {
                ...currentUser,
                name: updated.name,
                avatarUrl: updated.avatarUrl,
            };
            localStorage.setItem(
                "sessionUser",
                JSON.stringify(updatedLocalUser),
            );
            localStorage.setItem("task_user", JSON.stringify(updatedLocalUser));
            setCurrentUser(updatedLocalUser);

            toast.success("Profile updated successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <SkeletonProfile />;
    }

    if (!currentUser) {
        return (
            <div className="flex flex-col justify-center items-center h-full gap-3 p-6">
                <p className="text-[14px] text-[#1A1A1A] font-medium">
                    Please log in to view and edit your profile.
                </p>
                <Link
                    href="/login"
                    className="px-4 py-2 bg-[#1A1A1A] text-white text-base rounded-[3px]"
                >
                    Go to Sign In
                </Link>
            </div>
        );
    }

    const tabs = [
        { id: "personal", label: "Personal & Bio", icon: UserIcon },
        { id: "contact", label: "Contact Details", icon: Phone },
        { id: "social", label: "Social & Handles", icon: Share2 },
    ] as const;

    return (
        <div className="flex-1 overflow-y-auto p-5 bg-[#FAFAF9] text-[#1A1A1A]">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                }}
                className="max-w-3xl mx-auto w-full flex flex-col gap-5 select-none"
            >
                {/* Top Header Toolbar */}
                <div className="flex justify-between items-center pb-3 border-b border-[#E5E5E3]">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/task-board"
                            className="text-[11px] text-[#888883] hover:text-[#1A1A1A] font-medium transition-colors flex items-center gap-1"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Workspace</span>
                        </Link>
                        <span className="profile-badge text-[11px] font-medium text-[#888883] border border-[#E5E5E3] px-2.5 py-1 rounded-[2px] bg-white">
                            Profile Settings
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="md"
                            type="button"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            isLoading={isSaving}
                            loadingText="Saving…"
                            showDot={!isSaving}
                            size="md"
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>

                {/* Unified Frame Container with Corner Brackets */}
                <div className="relative border border-[#E5E5E3] bg-white corner-brackets flex flex-col rounded-[3px]">
                    {/* Section 1: Profile Header */}
                    <ProfileHeader
                        user={{
                            ...currentUser,
                            name: formData.name,
                            avatarUrl: formData.avatarUrl,
                            designation: formData.designation,
                            bloodGroup: formData.bloodGroup,
                        }}
                        isSaving={isSaving}
                        onSave={handleSave}
                        onAvatarChange={(newUrl) =>
                            handleChange("avatarUrl", newUrl)
                        }
                    />

                    {/* Section Divider 1 */}
                    <div className="relative w-full border-t border-[#E5E5E3]">
                        {/* Left T-Bracket ├ */}
                        <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center text-[#1A1A1A]">
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M5 0V10M5 5H10"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Section 2: Grouped Tabs Navigation Bar */}
                    <div className="bg-[#FAFAF9] px-2 py-1.5 flex items-center gap-1">
                        {tabs.map((t) => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActiveTab(t.id)}
                                    className={`relative px-3 py-1.5 text-[11px] font-medium rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isActive
                                            ? "bg-white text-[#1A1A1A] border border-[#E5E5E3] corner-brackets-4"
                                            : "text-[#888883] hover:text-[#1A1A1A] hover:bg-[#F0F0EE]"
                                    }`}
                                >
                                    <Icon className="w-3 h-3 shrink-0" />
                                    <span>{t.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Section Divider 2 */}
                    <div className="relative w-full border-t border-[#E5E5E3]">
                        {/* Left T-Bracket ├ */}
                        <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center text-[#1A1A1A]">
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M5 0V10M5 5H10"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Section 3: Active Tab Content */}
                    <div className="p-6 bg-white flex flex-col gap-5">
                        {activeTab === "personal" && (
                            <PersonalInfoSection
                                name={formData.name}
                                designation={formData.designation}
                                bio={formData.bio}
                                avatarUrl={formData.avatarUrl}
                                bloodGroup={formData.bloodGroup}
                                onChange={handleChange}
                            />
                        )}

                        {activeTab === "contact" && (
                            <ContactInfoSection
                                secondaryEmail={formData.secondaryEmail}
                                primaryPhone={formData.primaryPhone}
                                secondaryPhone={formData.secondaryPhone}
                                emergencyContact={formData.emergencyContact}
                                onChange={handleChange}
                            />
                        )}

                        {activeTab === "social" && (
                            <SocialLinksSection
                                telegram={formData.telegram}
                                whatsapp={formData.whatsapp}
                                github={formData.github}
                                onChange={handleChange}
                            />
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
