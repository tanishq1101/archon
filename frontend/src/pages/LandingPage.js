import React from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Brain, Code2, Database, ArrowRight, Zap, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const features = [
    {
        icon: Brain,
        title: "AI Project Architect",
        description: "Transform any idea into a complete project blueprint — tech stack, architecture, sprint plans, and database design. Instantly.",
        gradient: "from-purple-500 to-violet-600",
        glow: "rgba(139,92,246,0.25)",
        href: "/architect"
    },
    {
        icon: Code2,
        title: "AI CTO Console",
        description: "Get expert CTO-level guidance on architecture decisions, scalability challenges, security, and technology choices.",
        gradient: "from-cyan-400 to-blue-500",
        glow: "rgba(6,182,212,0.25)",
        href: "/cto"
    },
    {
        icon: Database,
        title: "RAG Memory System",
        description: "Upload your docs, repos, and notes. Query your knowledge base with AI that understands your specific context.",
        gradient: "from-violet-500 to-fuchsia-600",
        glow: "rgba(167,139,250,0.25)",
        href: "/memory"
    },
];

const steps = [
    { num: "01", title: "Describe Your Idea", desc: "Tell GhostBoard about your project concept, goals, and constraints in plain English." },
    { num: "02", title: "AI Generates Blueprint", desc: "The AI Architect designs your complete project — tech stack, architecture, and roadmap." },
    { num: "03", title: "Get Expert CTO Advice", desc: "Ask technical questions and get CTO-level guidance tailored to your project." },
    { num: "04", title: "Build With Context", desc: "Upload docs to RAG memory. Query your knowledge base as you build." },
];

export default function LandingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0A0A0C] overflow-x-hidden" data-testid="landing-page">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0A0A0C]/70 border-b border-white/[0.06]" data-testid="landing-nav">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5" data-testid="landing-logo">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-outfit font-semibold text-white text-lg">GhostBoard AI</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="font-manrope text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="font-manrope text-sm text-zinc-400 hover:text-white transition-colors">How it Works</a>
                    </div>
                    <div className="flex items-center gap-3">
                        {user ? (
                            <Link to="/dashboard" data-testid="go-to-dashboard-btn"
                                className="btn-primary text-sm">Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/auth" data-testid="sign-in-btn"
                                    className="font-manrope text-sm text-zinc-300 hover:text-white transition-colors px-3 py-2">
                                    Sign In
                                </Link>
                                <Link to="/auth?mode=register" data-testid="get-started-btn"
                                    className="btn-primary text-sm">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
                {/* Animated background */}
                <div className="absolute inset-0 bg-grid" />
                <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/[0.07] rounded-full blur-[100px] animate-glow-pulse" />
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/[0.06] rounded-full blur-[80px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
                <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-violet-500/[0.06] rounded-full blur-[80px] animate-glow-pulse" style={{ animationDelay: "3s" }} />

                <div className="relative z-10 text-center max-w-5xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-manrope mb-8"
                        data-testid="hero-badge">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI-Powered Project Operating System
                    </motion.div>

                    <motion.div variants={stagger} initial="hidden" animate="visible">
                        <motion.h1 variants={fadeUp}
                            className="font-outfit text-5xl sm:text-6xl lg:text-7xl tracking-tighter font-medium text-white mb-6 leading-[1.05]"
                            data-testid="hero-title">
                            Build Faster With AI
                            <br />
                            <span className="gradient-text">That Thinks Like Your CTO</span>
                        </motion.h1>

                        <motion.p variants={fadeUp} transition={{ duration: 0.6 }}
                            className="font-manrope text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                            data-testid="hero-subtitle">
                            GhostBoard AI is the autonomous project operating system for hackathons, startups, and developer teams.
                            Generate blueprints, get CTO advice, and ship smarter.
                        </motion.p>

                        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
                            <button data-testid="hero-cta-button"
                                onClick={() => navigate(user ? "/dashboard" : "/auth?mode=register")}
                                className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium font-manrope hover:brightness-110 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 flex items-center gap-2">
                                Start Building Free
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <a href="#features" data-testid="learn-more-btn"
                                className="px-8 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-manrope hover:bg-white/[0.07] transition-all duration-300 flex items-center gap-2">
                                See Features
                            </a>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll hint */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600">
                    <span className="text-xs font-manrope tracking-widest uppercase">Scroll</span>
                    <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </motion.div>
            </section>

            {/* Features */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        transition={{ duration: 0.6 }} className="text-center mb-20">
                        <p className="font-manrope text-xs tracking-[0.3em] uppercase text-zinc-500 mb-4">Capabilities</p>
                        <h2 className="font-outfit text-4xl sm:text-5xl tracking-tight font-medium text-white mb-4">
                            Everything to Ship <span className="gradient-text">Faster</span>
                        </h2>
                        <p className="font-manrope text-zinc-400 max-w-xl mx-auto">
                            Three powerful AI systems working together to make you the most productive developer in the room.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="features-grid">
                        {features.map((f, i) => (
                            <motion.div key={i} data-testid={`feature-card-${i}`}
                                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }}
                                whileHover={{ y: -6, boxShadow: `0 24px 48px ${f.glow}` }}
                                className="group relative p-8 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl transition-all duration-300 hover:border-white/20 cursor-pointer"
                                onClick={() => navigate(user ? f.href : "/auth?mode=register")}>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:shadow-[0_0_20px_${f.glow}] transition-all duration-300`}>
                                    <f.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-outfit text-xl font-medium text-white mb-3">{f.title}</h3>
                                <p className="font-manrope text-sm text-zinc-400 leading-relaxed">{f.description}</p>
                                <div className="mt-6 flex items-center gap-2 text-purple-400 text-sm font-manrope opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span>Try it now</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="py-32 px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-600/[0.04] via-transparent to-transparent" />
                <div className="max-w-5xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-20">
                        <p className="font-manrope text-xs tracking-[0.3em] uppercase text-zinc-500 mb-4">Workflow</p>
                        <h2 className="font-outfit text-4xl sm:text-5xl tracking-tight font-medium text-white">
                            How GhostBoard Works
                        </h2>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {steps.map((step, i) => (
                            <motion.div key={i} data-testid={`step-${i}`}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                                whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="flex gap-5 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-cyan-500/20 border border-purple-500/20 flex items-center justify-center">
                                    <span className="font-jetbrains text-purple-400 text-sm font-medium">{step.num}</span>
                                </div>
                                <div>
                                    <h3 className="font-outfit text-lg font-medium text-white mb-2">{step.title}</h3>
                                    <p className="font-manrope text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-3 gap-4 p-10 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                        {[{ value: "10x", label: "Faster Planning" }, { value: "3", label: "AI Systems" }, { value: "∞", label: "Possibilities" }].map((stat, i) => (
                            <motion.div key={i} data-testid={`stat-${i}`}
                                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                                <div className="font-outfit text-4xl font-medium gradient-text mb-2">{stat.value}</div>
                                <div className="font-manrope text-sm text-zinc-500">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-[80px]" />
                <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="font-outfit text-4xl sm:text-5xl tracking-tight font-medium text-white mb-6">
                            Ready to Build Your
                            <span className="gradient-text"> Next Project?</span>
                        </h2>
                        <p className="font-manrope text-zinc-400 mb-10">
                            Join developers and hackathon teams using GhostBoard AI to ship faster and smarter.
                        </p>
                        <button data-testid="cta-signup-btn"
                            onClick={() => navigate(user ? "/dashboard" : "/auth?mode=register")}
                            className="group px-10 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium font-manrope text-lg hover:brightness-110 hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all duration-300 inline-flex items-center gap-3">
                            Get Started Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/[0.05] py-10 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-outfit text-zinc-400 text-sm">GhostBoard AI</span>
                    </div>
                    <p className="font-manrope text-xs text-zinc-600">Built for builders. Powered by AI.</p>
                </div>
            </footer>
        </div>
    );
}
