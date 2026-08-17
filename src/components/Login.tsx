import React, { useState } from "react";
import { api, User } from "../api";

interface LoginProps {
    onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            if (isSignUp) {
                if (!name.trim()) {
                    setError("Name is required.");
                    setIsLoading(false);
                    return;
                }
                await api.register(name, email, password);
                setSuccess(
                    "Account created successfully! You can now sign in.",
                );
                setIsSignUp(false);
                setPassword("");
            } else {
                const user = await api.login(email, password);
                onLoginSuccess(user);
            }
        } catch (err: any) {
            setError(
                err.message || "An error occurred. Please check your inputs.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAF9] text-[#1A1A1A] p-4">
            <div className="corner-brackets w-full max-w-sm bg-white border border-[#E5E5E3] p-6 flex flex-col gap-5">
                {/* App Title */}
                <div className="flex flex-col items-center text-center gap-1">
                    <h1 className="font-heading text-2xl text-[#1A1A1A]">
                        SM Technology
                    </h1>
                    <p className="eyebrow">
                        Daily Task Management System
                    </p>
                </div>

                {/* Login/Register Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    <div className="flex border-b border-[#E5E5E3] text-[12px] font-medium">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(false);
                                setError("");
                                setSuccess("");
                            }}
                            className={`flex-1 pb-2.5 text-center transition-colors ${
                                !isSignUp
                                    ? "text-[#1A1A1A] border-b-2 border-[#1A1A1A] font-semibold"
                                    : "text-[#888883] hover:text-[#1A1A1A]"
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(true);
                                setError("");
                                setSuccess("");
                            }}
                            className={`flex-1 pb-2.5 text-center transition-colors ${
                                isSignUp
                                    ? "text-[#1A1A1A] border-b-2 border-[#1A1A1A] font-semibold"
                                    : "text-[#888883] hover:text-[#1A1A1A]"
                            }`}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div className="p-2.5 border border-[#CB2431]/20 text-[#CB2431] rounded-[3px] text-[11px] font-medium text-center animate-fade-in">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-2.5 border border-[#22863A]/20 text-[#22863A] rounded-[3px] text-[11px] font-medium text-center animate-fade-in">
                            {success}
                        </div>
                    )}

                    {isSignUp && (
                        <div className="flex flex-col gap-1 animate-fade-in">
                            <label className="eyebrow">
                                Full Name
                            </label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white border border-[#E5E5E3] rounded-[3px] px-3 py-2 text-[12px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                                required={isSignUp}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">
                            Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white border border-[#E5E5E3] rounded-[3px] px-3 py-2 text-[12px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white border border-[#E5E5E3] rounded-[3px] px-3 py-2 text-[12px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 mt-1 bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-40 text-white font-medium text-[12px] rounded-[3px] transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <span>Processing…</span>
                        ) : (
                            <span>
                                {isSignUp
                                    ? "Create Account"
                                    : "Sign In"}
                            </span>
                        )}
                    </button>
                </form>

                <div className="text-[9px] text-[#888883] text-center">
                    Secure authentication enabled.
                </div>
            </div>
        </div>
    );
}
