import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isRegister, setIsRegister] = useState(false);

    useEffect(() => {
        const mode = new URLSearchParams(location.search).get("mode");
        setIsRegister(mode === "register");
    }, [location.search]);

    useEffect(() => {
        if (user) {
            navigate("/dashboard", { replace: true });
        }
    }, [user, navigate]);

    // Clerk appearance configurations
    const clerkAppearance = {
        variables: {
            colorPrimary: "#8B5CF6", // purple
            colorBackground: "#0F0F13",
            colorText: "#FFFFFF",
            colorTextSecondary: "#9CA3AF",
            colorInputBackground: "rgba(255, 255, 255, 0.03)",
            colorInputText: "#FFFFFF",
            fontFamily: "Manrope, sans-serif",
            borderRadius: "0.75rem",
        },
        elements: {
            card: "bg-white/[0.01] backdrop-blur-xl border border-white/[0.06] shadow-xl p-2 sm:p-4",
            headerTitle: "font-outfit text-2xl font-medium text-white text-center",
            headerSubtitle: "font-manrope text-zinc-400 text-sm text-center",
            socialButtonsBlockButton: "border border-white/[0.07] bg-white/[0.03] text-white hover:bg-white/[0.07] hover:border-purple-500/50 transition-all duration-200",
            socialButtonsBlockButtonText: "font-manrope font-medium text-white",
            formButtonPrimary: "bg-gradient-to-r from-purple-600 to-cyan-500 hover:brightness-110 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] text-white font-medium py-2.5 transition-all duration-300 border-0",
            formFieldLabel: "text-xs font-manrope text-zinc-400 mb-1.5",
            formFieldInput: "bg-white/[0.03] border border-white/[0.07] focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 text-white rounded-xl py-2 px-3 transition-all duration-200",
            footerActionLink: "text-purple-400 hover:text-purple-300 font-medium transition-colors",
            footerActionText: "text-zinc-400 font-manrope text-xs",
            dividerLine: "bg-white/[0.08]",
            dividerText: "text-zinc-500 text-xs font-manrope",
            identityPreviewText: "text-white font-medium",
            identityPreviewEditButtonIcon: "text-purple-400 hover:text-purple-300",
            formFieldErrorText: "text-red-400 text-xs font-manrope",
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center px-4 relative overflow-hidden" data-testid="auth-page">
            {/* Background grids and glows */}
            <div className="absolute inset-0 bg-grid opacity-50" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/[0.08] rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-cyan-600/[0.05] rounded-full blur-[100px]" />

            <div className="relative z-10 w-full max-w-md my-8">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-2.5 mb-8" data-testid="auth-logo">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-outfit font-semibold text-white text-xl">Archon AI</span>
                </Link>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.5 }}
                    className="gradient-border p-0.5 rounded-2xl bg-white/[0.02]"
                >
                    <div className="bg-[#0F0F13]/90 rounded-2xl p-4 sm:p-6 backdrop-blur-xl">
                        {/* Toggle header tabs */}
                        <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
                            {["Sign In", "Create Account"].map((label, i) => (
                                <button key={i} data-testid={i === 0 ? "login-tab" : "register-tab"}
                                    onClick={() => { setIsRegister(i === 1); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-manrope transition-all duration-200 ${
                                        isRegister === (i === 1)
                                            ? "bg-gradient-to-r from-purple-600/70 to-cyan-600/70 text-white shadow-sm"
                                            : "text-zinc-400 hover:text-white"
                                    }`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={isRegister ? "register" : "login"}
                                initial={{ opacity: 0, x: isRegister ? 10 : -10 }}
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0 }} 
                                transition={{ duration: 0.2 }}
                                className="flex justify-center"
                            >
                                {isRegister ? (
                                    <SignUp 
                                        appearance={clerkAppearance} 
                                        signInUrl="/auth"
                                        forceRedirectUrl="/dashboard"
                                    />
                                ) : (
                                    <SignIn 
                                        appearance={clerkAppearance} 
                                        signUpUrl="/auth?mode=register"
                                        forceRedirectUrl="/dashboard"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>

                <p className="text-center mt-6 text-xs font-manrope text-zinc-600">
                    Secure login powered by Clerk. By continuing, you agree to build amazing things.
                </p>
            </div>
        </div>
    );
}
