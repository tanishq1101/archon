import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Sparkles, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, login, register } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ email: "", name: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const mode = new URLSearchParams(location.search).get("mode");
        setIsRegister(mode === "register");
    }, [location.search]);

    useEffect(() => {
        if (user) navigate("/dashboard", { replace: true });
    }, [user, navigate]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (isRegister) {
                if (!form.name.trim()) { setError("Name is required"); setLoading(false); return; }
                await register(form.email, form.name, form.password);
            } else {
                await login(form.email, form.password);
            }
            navigate("/dashboard");
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (typeof detail === "string") setError(detail);
            else if (Array.isArray(detail)) setError(detail.map((e) => e.msg || e).join(", "));
            else setError("Authentication failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center px-4 relative overflow-hidden" data-testid="auth-page">
            {/* Background */}
            <div className="absolute inset-0 bg-grid opacity-50" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/[0.08] rounded-full blur-[120px]" />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-2.5 mb-10" data-testid="auth-logo">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-outfit font-semibold text-white text-xl">GhostBoard AI</span>
                </Link>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="gradient-border p-8">
                    <div className="p-0.5">
                        {/* Toggle */}
                        <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.07] mb-8">
                            {["Sign In", "Create Account"].map((label, i) => (
                                <button key={i} data-testid={i === 0 ? "login-tab" : "register-tab"}
                                    onClick={() => { setIsRegister(i === 1); setError(""); setForm({ email: "", name: "", password: "" }); }}
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
                            <motion.div key={isRegister ? "register" : "login"}
                                initial={{ opacity: 0, x: isRegister ? 20 : -20 }}
                                animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

                                <h2 className="font-outfit text-2xl font-medium text-white mb-1" data-testid="auth-title">
                                    {isRegister ? "Create your account" : "Welcome back"}
                                </h2>
                                <p className="font-manrope text-sm text-zinc-400 mb-7">
                                    {isRegister ? "Start building with AI today" : "Sign in to GhostBoard AI"}
                                </p>

                                {error && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-manrope mb-5" data-testid="auth-error">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {isRegister && (
                                        <div>
                                            <label className="block text-xs font-manrope text-zinc-400 mb-1.5">Full Name</label>
                                            <input name="name" type="text" value={form.name} onChange={handleChange}
                                                placeholder="John Doe" required={isRegister} data-testid="auth-name-input"
                                                className="input-glass" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-manrope text-zinc-400 mb-1.5">Email</label>
                                        <input name="email" type="email" value={form.email} onChange={handleChange}
                                            placeholder="you@example.com" required data-testid="auth-email-input"
                                            className="input-glass" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-manrope text-zinc-400 mb-1.5">Password</label>
                                        <div className="relative">
                                            <input name="password" type={showPass ? "text" : "password"}
                                                value={form.password} onChange={handleChange}
                                                placeholder="••••••••" required data-testid="auth-password-input"
                                                className="input-glass pr-10" />
                                            <button type="button" onClick={() => setShowPass(!showPass)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                                data-testid="toggle-password">
                                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button type="submit" disabled={loading} data-testid="auth-submit-btn"
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium font-manrope hover:brightness-110 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                {isRegister ? "Create Account" : "Sign In"}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>

                <p className="text-center mt-6 text-xs font-manrope text-zinc-600">
                    By continuing, you agree to build amazing things.
                </p>
            </div>
        </div>
    );
}
