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
        fullName: "",
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

    const [initialFormData, setInitialFormData] = useState({
        fullName: "",
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

            const initialSnapshot = {
                fullName: data.fullName || "",
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
            };

            setFormData({
                ...initialSnapshot,
                avatarUrl: data.avatarUrl || "",
            });
            setInitialFormData(initialSnapshot);
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

    const handleAvatarChange = async (newAvatarUrl: string) => {
        if (!currentUser) return;

        const previousAvatar = currentUser.avatarUrl || formData.avatarUrl || "";
        setFormData((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));

        const toastId = toast.loading(
            newAvatarUrl
                ? "Updating profile picture…"
                : "Removing profile picture…",
        );

        try {
            const payload = {
                ...formData,
                avatarUrl: newAvatarUrl,
            };

            const updated = await api.updateUserProfile(
                currentUser.id,
                payload,
            );

            const resolvedAvatar = updated.avatarUrl !== undefined && updated.avatarUrl !== null ? updated.avatarUrl : newAvatarUrl;

            const updatedLocalUser = {
                ...currentUser,
                avatarUrl: resolvedAvatar,
            };

            localStorage.setItem(
                "sessionUser",
                JSON.stringify(updatedLocalUser),
            );
            localStorage.setItem(
                "task_user",
                JSON.stringify(updatedLocalUser),
            );
            setCurrentUser(updatedLocalUser);
            setFormData((prev) => ({
                ...prev,
                avatarUrl: resolvedAvatar || "",
            }));

            window.dispatchEvent(new Event("storage"));

            toast.success(
                newAvatarUrl
                    ? "Profile picture updated successfully!"
                    : "Profile picture removed successfully!",
                { id: toastId },
            );
        } catch (err: any) {
            setFormData((prev) => ({ ...prev, avatarUrl: previousAvatar }));
            toast.error(
                err.message || "Failed to update profile picture.",
                { id: toastId },
            );
        }
    };

    const handleSave = async () => {
        if (!currentUser) return;
        const trimmedFullName = formData.fullName.trim();

        if (!trimmedFullName) {
            toast.error("Full name is required.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                fullName: trimmedFullName,
            };

            const updated = await api.updateUserProfile(
                currentUser.id,
                payload,
            );

            const updatedLocalUser = {
                ...currentUser,
                fullName: updated.fullName || trimmedFullName,
                avatarUrl: updated.avatarUrl,
            };
            localStorage.setItem(
                "sessionUser",
                JSON.stringify(updatedLocalUser),
            );
            localStorage.setItem(
                "task_user",
                JSON.stringify(updatedLocalUser),
            );
            setCurrentUser(updatedLocalUser);

            const savedSnapshot = {
                fullName: updated.fullName || trimmedFullName,
                secondaryEmail: formData.secondaryEmail,
                primaryPhone: formData.primaryPhone,
                secondaryPhone: formData.secondaryPhone,
                emergencyContact: formData.emergencyContact,
                telegram: formData.telegram,
                whatsapp: formData.whatsapp,
                github: formData.github,
                bloodGroup: formData.bloodGroup,
                designation: formData.designation,
                bio: formData.bio,
            };

            setFormData((prev) => ({
                ...prev,
                ...savedSnapshot,
            }));
            setInitialFormData(savedSnapshot);

            toast.success("Profile updated successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData((prev) => ({
            ...prev,
            ...initialFormData,
        }));
    };

    const isDirty =
        formData.fullName !== initialFormData.fullName ||
        formData.secondaryEmail !== initialFormData.secondaryEmail ||
        formData.primaryPhone !== initialFormData.primaryPhone ||
        formData.secondaryPhone !== initialFormData.secondaryPhone ||
        formData.emergencyContact !== initialFormData.emergencyContact ||
        formData.telegram !== initialFormData.telegram ||
        formData.whatsapp !== initialFormData.whatsapp ||
        formData.github !== initialFormData.github ||
        formData.bloodGroup !== initialFormData.bloodGroup ||
        formData.designation !== initialFormData.designation ||
        formData.bio !== initialFormData.bio;

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
                    if (isDirty) handleSave();
                }}
                className="max-w-3xl mx-auto w-full flex flex-col gap-5 select-none"
            >
                <fieldset disabled={isSaving} className="border-0 p-0 m-0 w-full flex flex-col gap-5">
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

                        {isDirty && (
                            <div className="flex items-center gap-2 animate-fade-in">
                                <Button
                                    variant="ghost"
                                    size="md"
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isSaving}
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
                        )}
                    </div>

                    {/* Unified Frame Container with Corner Brackets */}
                    <div className="relative border border-[#E5E5E3] bg-white corner-brackets flex flex-col rounded-[3px]">
                        {/* Section 1: Profile Header */}
                        <ProfileHeader
                            user={{
                                ...currentUser,
                                fullName: formData.fullName,
                                avatarUrl: formData.avatarUrl,
                                designation: formData.designation,
                                bloodGroup: formData.bloodGroup,
                            }}
                            isSaving={isSaving}
                            onSave={handleSave}
                            onAvatarChange={handleAvatarChange}
                        />

                        {/* Section 2: Tab Bar switcher */}
                        <div className="flex items-center gap-6 px-5 border-b border-[#E5E5E3] bg-[#FAFAF9]">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 py-3.5 border-b-2 text-[11px] font-semibold tracking-wide uppercase transition-all cursor-pointer ${
                                            isActive
                                                ? "border-[#1A1A1A] text-[#1A1A1A]"
                                                : "border-transparent text-[#888883] hover:text-[#1A1A1A]"
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Section 3: Inner Active tab components */}
                        <div className="p-5 select-text">
                            {activeTab === "personal" && (
                                <PersonalInfoSection
                                    fullName={formData.fullName}
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
                </fieldset>
            </form>
        </div>
    );
}
