"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";

export default function LoginPage() {
    const { currentUser, handleLoginSuccess } = useWorkspace();
    const router = useRouter();

    const [view, setView] = useState<"SIGNIN" | "SIGNUP" | "VERIFY" | "FORGOT" | "RESET">("SIGNIN");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (currentUser) {
            router.replace("/kanban");
        }
    }, [currentUser, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            if (view === "SIGNUP") {
                if (!name.trim()) {
                    setError("Name is required.");
                    setIsLoading(false);
                    return;
                }
                const resObj = await api.register(name, email, password);
                if (resObj.requiresVerification) {
                    setSuccess("Account created successfully! Verification code sent to your email.");
                    setView("VERIFY");
                } else {
                    handleLoginSuccess(resObj.user, resObj.token!);
                }
            } else if (view === "SIGNIN") {
                try {
                    const resObj = await api.login(email, password);
                    handleLoginSuccess(resObj.user, resObj.token);
                } catch (err: any) {
                    if (err.message === "EMAIL_NOT_VERIFIED") {
                        setError("Email not verified.");
                    } else {
                        throw err;
                    }
                }
            } else if (view === "VERIFY") {
                const resObj = await api.verifyEmail(email, code);
                setSuccess("Email verified successfully! Logging you in...");
                handleLoginSuccess(resObj.user, resObj.token);
            } else if (view === "FORGOT") {
                await api.forgotPassword(email);
                setSuccess("Password reset code sent to your email.");
                setView("RESET");
            } else if (view === "RESET") {
                await api.resetPassword(email, code, newPassword);
                setSuccess("Password updated successfully! Please sign in.");
                setView("SIGNIN");
                setPassword("");
                setCode("");
                setNewPassword("");
            }
        } catch (err: any) {
            setError(
                err.message || "An error occurred. Please check your inputs.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (isResending) return;
        setError("");
        setSuccess("");
        setIsResending(true);
        try {
            await api.resendVerification(email);
            setSuccess("A new verification code has been sent to your email.");
        } catch (err: any) {
            setError(err.message || "Failed to resend verification code.");
        } finally {
            setIsResending(false);
        }
    };

    if (currentUser) return null;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAF9] text-[#1A1A1A] p-4 font-sans">
            <div className="relative corner-brackets w-full max-w-sm bg-white border border-[#E5E5E3] p-6 flex flex-col gap-5 shadow-sm">
                
                {/* App Title */}
                <div className="flex flex-col items-center text-center gap-1">
                    <h1 className="font-heading text-2xl text-[#1A1A1A]">
                        SM Technology
                    </h1>
                    <p className="eyebrow text-[#888883]">
                        Daily Task Management System
                    </p>
                </div>

                {/* Form Navigation Tabs for Sign In / Register */}
                {(view === "SIGNIN" || view === "SIGNUP") && (
                    <div className="flex border-b border-[#E5E5E3] text-base font-medium">
                        <button
                            type="button"
                            onClick={() => {
                                setView("SIGNIN");
                                setError("");
                                setSuccess("");
                            }}
                            className={`flex-1 pb-2.5 text-center transition-colors cursor-pointer ${view === "SIGNIN"
                                    ? "text-[#1A1A1A] border-b-2 border-[#1A1A1A] font-semibold"
                                    : "text-[#888883] hover:text-[#1A1A1A]"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setView("SIGNUP");
                                setError("");
                                setSuccess("");
                            }}
                            className={`flex-1 pb-2.5 text-center transition-colors cursor-pointer ${view === "SIGNUP"
                                    ? "text-[#1A1A1A] border-b-2 border-[#1A1A1A] font-semibold"
                                    : "text-[#888883] hover:text-[#1A1A1A]"
                                }`}
                        >
                            Register
                        </button>
                    </div>
                )}

                {/* Status/Error Messages */}
                {error && (
                    <div className="p-2.5 border border-[#CB2431]/20 bg-[#CB2431]/5 text-[#CB2431] rounded-[3px] text-[11px] font-medium flex items-center justify-between gap-2 animate-fade-in">
                        <span className="flex-1 text-left">{error}</span>
                        {error.includes("Email not verified") && (
                            <button
                                type="button"
                                onClick={async () => {
                                    setError("");
                                    setSuccess("");
                                    setIsLoading(true);
                                    try {
                                        await api.resendVerification(email);
                                        setSuccess("Verification code sent to your email!");
                                        setView("VERIFY");
                                    } catch (err: any) {
                                        setError(err.message || "Failed to send code.");
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                className="px-2 py-1 bg-[#CB2431] text-white text-[10px] font-semibold rounded-[2px] hover:bg-[#a81d28] transition-colors shrink-0 cursor-pointer"
                            >
                                Verify
                            </button>
                        )}
                    </div>
                )}

                {success && (
                    <div className="p-2.5 border border-[#22863A]/20 bg-[#22863A]/5 text-[#22863A] rounded-[3px] text-[11px] font-medium text-center animate-fade-in">
                        {success}
                    </div>
                )}

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    
                    {/* View: Verification Screen */}
                    {view === "VERIFY" && (
                        <div className="flex flex-col gap-3.5 animate-fade-in">
                            <h2 className="text-base font-semibold text-[#1A1A1A] text-center">
                                Verify Your Email
                            </h2>
                            <p className="text-[12px] text-[#888883] text-center">
                                We've sent a 6-digit verification code to <span className="font-semibold text-[#1A1A1A]">{email}</span>.
                            </p>
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Verification Code</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                    className="w-full bg-white border border-[#E5E5E3] rounded-[3px] px-3 py-2 text-center text-lg tracking-[8px] font-mono text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* View: Forgot Password Screen */}
                    {view === "FORGOT" && (
                        <div className="flex flex-col gap-3.5 animate-fade-in">
                            <h2 className="text-base font-semibold text-[#1A1A1A] text-center">
                                Forgot Password
                            </h2>
                            <p className="text-[12px] text-[#888883] text-center">
                                Enter your email address to receive a 6-digit password reset code.
                            </p>
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white border border-[#E5E5E3] rounded-[3px] px-3 py-2 text-base text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* View: Reset Password Screen */}
                    {view === "RESET" && (
                        <div className="flex flex-col gap-3.5 animate-fade-in">
                            <h2 className="text-base font-semibold text-[#1A1A1A] text-center">
                                Reset Password
                            </h2>
                            <p className="text-[12px] text-[#888883] text-center">
                                Enter the code sent to your email and select your new password.
                            </p>
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#FAFAF9] border border-[#E5E5E3] rounded-[3px] px-3 py-2 text-base text-[#888883] focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Reset Code</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                    className="w-full bg-white border border-[#E5E5E3] rounded-[3px] px-3 py-2 text-center text-lg tracking-[8px] font-mono text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">New Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-white border border-[#E5E5E3] rounded-[3px] px-3 py-2 text-base text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Views: Sign In / Register Fields */}
                    {(view === "SIGNIN" || view === "SIGNUP") && (
                        <div className="flex flex-col gap-3.5 animate-fade-in">
                            {view === "SIGNUP" && (
                                <div className="flex flex-col gap-1">
                                    <label className="eyebrow">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your fullname"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white border border-[#E5E5E3] rounded-[3px] px-3 py-2 text-base text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                                        required={view === "SIGNUP"}
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white border border-[#E5E5E3] rounded-[3px] px-3 py-2 text-base text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <label className="eyebrow">Password</label>
                                    {view === "SIGNIN" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setView("FORGOT");
                                                setError("");
                                                setSuccess("");
                                            }}
                                            className="text-[11px] text-[#888883] hover:text-[#1A1A1A] hover:underline"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white border border-[#E5E5E3] rounded-[3px] px-3 py-2 text-base text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 mt-2 bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-40 text-white font-medium text-base rounded-[3px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                        {isLoading ? (
                            <span>Processing…</span>
                        ) : (
                            <span>
                                {view === "SIGNIN" && "Sign In"}
                                {view === "SIGNUP" && "Create Account"}
                                {view === "VERIFY" && "Verify Email"}
                                {view === "FORGOT" && "Send Reset Code"}
                                {view === "RESET" && "Reset Password"}
                            </span>
                        )}
                    </button>
                </form>

                {/* Footer Utilities */}
                {view === "VERIFY" && (
                    <div className="flex flex-col gap-2.5 text-center text-[12px] text-[#888883] mt-1 animate-fade-in">
                        <div className="flex items-center justify-center gap-1.5">
                            <span>Didn't receive a code?</span>
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={isResending}
                                className="text-[#1A1A1A] font-semibold hover:underline cursor-pointer disabled:opacity-50"
                            >
                                {isResending ? "Resending..." : "Resend Code"}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setView("SIGNIN");
                                setError("");
                                setSuccess("");
                                setCode("");
                            }}
                            className="text-[#888883] hover:text-[#1A1A1A] hover:underline"
                        >
                            Back to Sign In
                        </button>
                    </div>
                )}

                {(view === "FORGOT" || view === "RESET") && (
                    <div className="text-center text-[12px] mt-1 animate-fade-in">
                        <button
                            type="button"
                            onClick={() => {
                                setView("SIGNIN");
                                setError("");
                                setSuccess("");
                                setCode("");
                            }}
                            className="text-[#888883] hover:text-[#1A1A1A] hover:underline cursor-pointer"
                        >
                            Back to Sign In
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
