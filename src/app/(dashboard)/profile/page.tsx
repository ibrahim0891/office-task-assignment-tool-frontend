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
import { User as UserIcon, Phone, Share2 } from "lucide-react";

export default function ProfilePage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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


    return (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 bg-[#FAFAF9] text-[#1A1A1A]">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (isDirty) handleSave();
                }}
                className="w-full max-w-[1600px] mx-auto flex flex-col gap-6 select-none"
            >
                <fieldset disabled={isSaving} className="border-0 p-0 m-0 w-full flex flex-col gap-6">
                    {/* Full-width Profile Hero Card */}
                    <div className="relative border border-[#E5E5E3] bg-white corner-brackets rounded-[3px] shadow-xs">
                        <ProfileHeader
                            user={{
                                ...currentUser,
                                fullName: formData.fullName,
                                avatarUrl: formData.avatarUrl,
                                designation: formData.designation,
                                bloodGroup: formData.bloodGroup,
                            }}
                            isSaving={isSaving}
                            isDirty={isDirty}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            onAvatarChange={handleAvatarChange}
                        />
                    </div>

                    {/* Main Content Grid: All Info in One View */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left Column: Personal Information & Bio */}
                        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-6">
                            <div className="relative border border-[#E5E5E3] bg-white corner-brackets rounded-[3px] p-5 sm:p-6 select-text flex flex-col gap-5 shadow-xs">
                                <div className="flex items-center gap-3 pb-3 border-b border-[#E5E5E3]">
                                    <div className="w-7 h-7 rounded-[2px] bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center text-[#1A1A1A] shrink-0">
                                        <UserIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <h2 className="text-[13px] font-semibold text-[#1A1A1A] font-heading">
                                            Personal &amp; Identity
                                        </h2>
                                        <p className="text-[11px] text-[#888883]">
                                            Your name, role, bio, and health details
                                        </p>
                                    </div>
                                </div>

                                <PersonalInfoSection
                                    fullName={formData.fullName}
                                    designation={formData.designation}
                                    bio={formData.bio}
                                    avatarUrl={formData.avatarUrl}
                                    bloodGroup={formData.bloodGroup}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Right Column: Contact Details & Social Handles */}
                        <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-6">
                            {/* Contact Details Card */}
                            <div className="relative border border-[#E5E5E3] bg-white corner-brackets rounded-[3px] p-5 sm:p-6 select-text flex flex-col gap-5 shadow-xs">
                                <div className="flex items-center gap-3 pb-3 border-b border-[#E5E5E3]">
                                    <div className="w-7 h-7 rounded-[2px] bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center text-[#1A1A1A] shrink-0">
                                        <Phone className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <h2 className="text-[13px] font-semibold text-[#1A1A1A] font-heading">
                                            Contact Details
                                        </h2>
                                        <p className="text-[11px] text-[#888883]">
                                            Phone numbers, backup email, and emergency contact
                                        </p>
                                    </div>
                                </div>

                                <ContactInfoSection
                                    secondaryEmail={formData.secondaryEmail}
                                    primaryPhone={formData.primaryPhone}
                                    secondaryPhone={formData.secondaryPhone}
                                    emergencyContact={formData.emergencyContact}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Social Handles Card */}
                            <div className="relative border border-[#E5E5E3] bg-white corner-brackets rounded-[3px] p-5 sm:p-6 select-text flex flex-col gap-5 shadow-xs">
                                <div className="flex items-center gap-3 pb-3 border-b border-[#E5E5E3]">
                                    <div className="w-7 h-7 rounded-[2px] bg-[#FAFAF9] border border-[#E5E5E3] flex items-center justify-center text-[#1A1A1A] shrink-0">
                                        <Share2 className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <h2 className="text-[13px] font-semibold text-[#1A1A1A] font-heading">
                                            Social &amp; Online Handles
                                        </h2>
                                        <p className="text-[11px] text-[#888883]">
                                            Telegram, WhatsApp, and GitHub profiles
                                        </p>
                                    </div>
                                </div>

                                <SocialLinksSection
                                    telegram={formData.telegram}
                                    whatsapp={formData.whatsapp}
                                    github={formData.github}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Save Bar when Dirty */}
                    {isDirty && (
                        <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 bg-[#1A1A1A] text-white rounded-[3px] shadow-lg animate-fade-in">
                            <div className="flex items-center gap-2 text-[12px]">
                                <span className="w-2 h-2 rounded-full bg-[#B08800] animate-pulse" />
                                <span>You have unsaved changes in your profile.</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="px-3 py-1.5 text-[11px] text-[#888883] hover:text-white transition-colors cursor-pointer"
                                >
                                    Discard
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="relative corner-brackets-4 px-4 py-1.5 bg-white text-[#1A1A1A] hover:bg-[#FAFAF9] text-[11px] font-semibold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                >
                                    {isSaving ? "Saving…" : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    )}
                </fieldset>
            </form>
        </div>
    );
}
