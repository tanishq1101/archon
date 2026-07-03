import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, LayoutDashboard, Brain, Code2, Database, LogOut, Menu, X, Layers, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";

const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/architect", label: "AI Architect", icon: Brain },
    { path: "/cto", label: "CTO Console", icon: Code2 },
    { path: "/memory", label: "Memory", icon: Database },
    { path: "/sprint", label: "Sprint", icon: Layers },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <nav className="nav-glass" data-testid="app-navbar">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 flex-shrink-0" data-testid="nav-logo">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-outfit font-semibold text-white text-base hidden sm:block">Archon AI</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map(({ path, label, icon: Icon }) => {
                        const active = location.pathname === path;
                        return (
                            <Link key={path} to={path} data-testid={`nav-link-${label.toLowerCase().replace(/\s/g, "-")}`}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 font-manrope ${
                                    active
                                        ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                }`}>
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        );
                    })}
                </div>

                {/* User + Logout */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-xs text-white font-medium">
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="text-zinc-300 text-sm font-manrope max-w-[120px] truncate" data-testid="nav-user-name">
                            {user?.name}
                        </span>
                    </div>
                    {/* Theme Toggle */}
                    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all duration-200"
                        title="Toggle Theme">
                        {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
                    </button>
                    <button onClick={handleLogout} data-testid="nav-logout-btn"
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                        title="Logout">
                        <LogOut className="w-4 h-4" />
                    </button>
                    {/* Mobile menu toggle */}
                    <button className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}
                        data-testid="nav-mobile-toggle">
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            {mobileOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="md:hidden border-t border-white/[0.06] px-4 py-3 space-y-1 bg-[#0A0A0C]/95">
                    {navLinks.map(({ path, label, icon: Icon }) => (
                        <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-manrope transition-all ${
                                location.pathname === path
                                    ? "bg-purple-500/15 text-purple-300"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            }`}>
                            <Icon className="w-4 h-4" />
                            {label}
                        </Link>
                    ))}
                    {/* User profile inside drawer on mobile */}
                    {user && (
                        <div className="pt-4 mt-3 border-t border-white/[0.06] space-y-3">
                            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-sm text-white font-medium shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium font-outfit truncate">{user?.name}</p>
                                    <p className="text-zinc-500 text-[11px] font-manrope truncate">{user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setMobileOpen(false); handleLogout(); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-manrope text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                Log Out
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </nav>
    );
}
