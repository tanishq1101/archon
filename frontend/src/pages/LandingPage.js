import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
    Sparkles,
    Brain,
    Code2,
    Database,
    ArrowRight,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    Star,
    CheckCircle2,
    Github,
    Twitter,
    Mail,
    Layers,
    MessageSquare,
    HelpCircle,
    Zap
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
    visible: { transition: { staggerChildren: 0.1 } }
};

const features = [
    {
        icon: Brain,
        title: "AI Project Architect",
        description: "Transform any raw idea into a complete structural blueprint — including system design, database schemas, and timelines.",
        gradient: "from-purple-500 to-indigo-600",
        glow: "rgba(139,92,246,0.15)",
        href: "/architect"
    },
    {
        icon: Code2,
        title: "AI CTO Console",
        description: "Receive expert expert-level guidance on architectural scaling, code security practices, and tech stack choices in real-time.",
        gradient: "from-cyan-400 to-blue-500",
        glow: "rgba(6,182,212,0.15)",
        href: "/cto"
    },
    {
        icon: Layers,
        title: "AI Sprint Planner",
        description: "Break complex blueprints down into 15-25 story-pointed sprint tasks. Manage tickets on a fluid glassmorphism Kanban board.",
        gradient: "from-fuchsia-500 to-pink-600",
        glow: "rgba(236,72,153,0.15)",
        href: "/sprint"
    },
    {
        icon: Database,
        title: "RAG Memory System",
        description: "Ingest repository documents, API docs, or raw notes. Ground your AI queries in the specific context of your codebase.",
        gradient: "from-violet-500 to-fuchsia-600",
        glow: "rgba(167,139,250,0.15)",
        href: "/memory"
    },
];

const steps = [
    {
        num: "01",
        title: "Map the Concept",
        desc: "Describe your project's goals, features, and technical requirements in natural language."
    },
    {
        num: "02",
        title: "Generate the Blueprint",
        desc: "Our AI Architect generates your tech stack, system architecture diagram, and timeline targets instantly."
    },
    {
        num: "03",
        title: "Spawn Sprint Backlog",
        desc: "Transform your layout into detailed Kanban tasks complete with story points and category tags."
    },
    {
        num: "04",
        title: "Build with Context",
        desc: "Ground technical queries in your uploaded documentation using our context-aware memory workspace."
    },
];

const testimonials = [
    {
        quote: "GhostBoard AI completely replaced our messy Notion planning. We went from a rough hackathon idea to 20 well-defined sprint issues in under 3 minutes.",
        author: "Alex Rivers",
        role: "Lead Developer, HackMIT Winner",
        rating: 5,
        avatar: "AR",
        gradient: "from-purple-500 to-cyan-500"
    },
    {
        quote: "Having the AI CTO Console analyze our database architecture saved us days of scaling debates. The contextual grounding is remarkably precise.",
        author: "Sarah Chen",
        role: "Co-Founder, Synthetix AI",
        rating: 5,
        avatar: "SC",
        gradient: "from-cyan-500 to-blue-500"
    },
    {
        quote: "The combination of RAG documentation memory and an integrated sprint board is a game-changer. It is the ultimate workspace for solo indie builders.",
        author: "Marcus Vance",
        role: "Indie Hacker & Creator",
        rating: 5,
        avatar: "MV",
        gradient: "from-fuchsia-500 to-pink-500"
    },
    {
        quote: "GhostBoard's automated architecture prompts are pure gold. Running them through Cursor helped us build our MVP interface in a single weekend.",
        author: "Elena Rostova",
        role: "Full-Stack Engineer, DevPost Alpha",
        rating: 5,
        avatar: "ER",
        gradient: "from-amber-400 to-rose-500"
    },
    {
        quote: "I uploaded our 50-page API spec to the RAG memory bank. Grounding queries against it completely stopped code hallucination. Highly recommended!",
        author: "Dr. James Vance",
        role: "Director of R&D, CoreNexus",
        rating: 5,
        avatar: "JV",
        gradient: "from-violet-600 to-indigo-500"
    },
    {
        quote: "The Sprint Planner's story point breakdown was surprisingly accurate. It captured our architectural dependencies perfectly.",
        author: "Tariq Mahmood",
        role: "Agile Coach, CloudScale",
        rating: 5,
        avatar: "TM",
        gradient: "from-emerald-400 to-teal-500"
    },
    {
        quote: "The interactive canvas particles combined with dark/light transitions give GhostBoard a premium, state-of-the-art developer workspace feel.",
        author: "Chloe Dubois",
        role: "Lead UI/UX Designer, PixelCraft",
        rating: 5,
        avatar: "CD",
        gradient: "from-pink-500 to-violet-500"
    },
    {
        quote: "Deleting database tables and resetting ideas from the dashboard works status instantly. The real-time statistics update is incredibly satisfying.",
        author: "Brandon Kelly",
        role: "Backend Engineer, StackFlow",
        rating: 5,
        avatar: "BK",
        gradient: "from-blue-600 to-cyan-400"
    }
];

const faqs = [
    {
        id: "faq-1",
        question: "What is GhostBoard AI?",
        answer: "GhostBoard AI is an integrated, AI-powered autonomous project operating system. It streamlines project blueprints, expert CTO technical consultation, sprint ticketing, and documentation memory workspaces into a single cohesive platform."
    },
    {
        id: "faq-2",
        question: "How does the RAG Memory system work?",
        answer: "You can upload documentation, notes, or APIs in plain text. GhostBoard AI indexes this knowledge so that any queries you perform in the memory console or architecture generations are specifically grounded in your uploaded reference material."
    },
    {
        id: "faq-3",
        question: "What AI models power the architecture suggestions?",
        answer: "We support models like Gemini 2.5 Flash and DeepSeek Chat via OpenRouter API endpoints. This allows high-speed generation of blueprints and technical recommendations."
    },
    {
        id: "faq-4",
        question: "Is GhostBoard AI free to use?",
        answer: "Yes! We offer a fully-featured free tier tailored for hackathon teams and individual developer projects. Upgrade tiers are available for advanced collaboration and increased rate limits."
    },
    {
        id: "faq-5",
        question: "Can I manage sprint tickets directly?",
        answer: "Absolutely. The Sprint Planner includes a fully interactive Kanban board. You can manually drag cards between columns, add tasks, customize story points, and delete tickets as you build."
    }
];

export default function LandingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [autoplay, setAutoplay] = useState(true);
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

    const [showSplash, setShowSplash] = useState(() => {
        if (typeof window !== "undefined") {
            return !sessionStorage.getItem("spectreflow_splash_shown");
        }
        return true;
    });

    useEffect(() => {
        if (showSplash) {
            const timer = setTimeout(() => {
                setShowSplash(false);
                sessionStorage.setItem("spectreflow_splash_shown", "true");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showSplash]);

    // Track window width for responsive card rendering in carousel
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const visibleCards = windowWidth >= 1024 ? 3 : windowWidth >= 640 ? 2 : 1;
    const maxIndex = testimonials.length - visibleCards;

    // Auto rotate testimonials slider
    useEffect(() => {
        if (!autoplay) return;
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                if (prevIndex >= maxIndex) {
                    return 0;
                }
                return prevIndex + 1;
            });
        }, 4000);
        return () => clearInterval(interval);
    }, [autoplay, maxIndex]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
    };

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    const smoothScroll = (e, targetId) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative transition-colors duration-300" data-testid="landing-page">
            <AnimatePresence>
                {showSplash && (
                    <motion.div
                        key="splash"
                        initial={{ opacity: 1 }}
                        exit={{ 
                            opacity: 0, 
                            scale: 1.1,
                            filter: "blur(10px)",
                            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
                        }}
                        className="fixed inset-0 z-[9999] bg-[#070709] flex flex-col items-center justify-center overflow-hidden"
                    >
                        {/* Glow effect behind */}
                        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-500/10 to-cyan-500/10 blur-[100px] pointer-events-none" />

                        {/* Particle layout / Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

                        <div className="relative flex flex-col items-center">
                            {/* Logo Wrapper */}
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ 
                                    scale: 1, 
                                    opacity: 1,
                                    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
                                }}
                                className="relative w-28 h-28 mb-8"
                            >
                                {/* Glowing outer ring */}
                                <motion.div 
                                    className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 blur-md border border-white/10"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                />
                                
                                {/* Inner Logo SVG */}
                                <div className="absolute inset-2 bg-[#0E0E12]/80 border border-white/[0.08] rounded-2xl flex items-center justify-center backdrop-blur-xl">
                                    <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#A855F7" />
                                                <stop offset="100%" stopColor="#06B6D4" />
                                            </linearGradient>
                                            <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="3" result="blur" />
                                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                            </filter>
                                        </defs>
                                        {/* Wave Path */}
                                        <motion.path
                                            d="M15,50 C25,25 35,75 45,50 C55,25 65,75 75,50 C85,25 90,50 90,50"
                                            stroke="url(#logo-grad)"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            filter="url(#logo-glow)"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 1.8, delay: 0.4, ease: "easeInOut" }}
                                        />
                                        {/* Ghost Hood Path */}
                                        <motion.path
                                            d="M35,65 C35,45 42,30 50,30 C58,30 65,45 65,65"
                                            stroke="url(#logo-grad)"
                                            strokeWidth="5"
                                            strokeLinecap="round"
                                            filter="url(#logo-glow)"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
                                        />
                                        {/* Glowing Eyes */}
                                        <motion.circle cx="45" cy="48" r="3" fill="#06B6D4" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0, 1] }} transition={{ delay: 1.5, duration: 0.8 }} />
                                        <motion.circle cx="55" cy="48" r="3" fill="#06B6D4" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0, 1] }} transition={{ delay: 1.5, duration: 0.8 }} />
                                    </svg>
                                </div>
                            </motion.div>

                            {/* App Name */}
                            <div className="flex overflow-hidden">
                                {"SpectreFlow".split("").map((letter, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ y: 50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ 
                                            duration: 0.6, 
                                            delay: 0.8 + (i * 0.05),
                                            ease: [0.16, 1, 0.3, 1] 
                                        }}
                                        className="font-outfit text-3xl font-semibold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60 select-none"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </div>

                            {/* Subtitle */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 1.6 }}
                                className="font-manrope text-xs tracking-[0.25em] text-zinc-500 uppercase mt-3"
                            >
                                AI Project Operating System
                            </motion.p>
                        </div>

                        {/* Loader bar */}
                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Navigation */}
            <nav className="nav-glass" data-testid="landing-nav">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5" data-testid="landing-logo">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-outfit font-semibold text-zinc-900 dark:text-white text-lg">SpectreFlow AI</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#about" onClick={(e) => smoothScroll(e, "about")} className="font-manrope text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">About</a>
                        <a href="#features" onClick={(e) => smoothScroll(e, "features")} className="font-manrope text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" onClick={(e) => smoothScroll(e, "how-it-works")} className="font-manrope text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">How it Works</a>
                        <a href="#testimonials" onClick={(e) => smoothScroll(e, "testimonials")} className="font-manrope text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">Testimonials</a>
                        <a href="#faq" onClick={(e) => smoothScroll(e, "faq")} className="font-manrope text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">FAQ</a>
                    </div>

                    {/* Actions & Theme Toggle */}
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-all duration-200"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun className="w-4 h-4 text-amber-400 animate-spin-once" />
                            ) : (
                                <Moon className="w-4 h-4 text-purple-600" />
                            )}
                        </button>

                        {user ? (
                            <Link to="/dashboard" data-testid="go-to-dashboard-btn" className="btn-primary text-sm">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/auth" data-testid="sign-in-btn" className="font-manrope text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-2">
                                    Sign In
                                </Link>
                                <Link to="/auth?mode=register" data-testid="get-started-btn" className="btn-primary text-sm">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-16 overflow-hidden">
                {/* Canvas Animated Background */}
                <AnimatedBackground />

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-grid pointer-events-none" />

                {/* Radial Glow Lights */}
                <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/[0.04] dark:bg-purple-600/[0.08] rounded-full blur-[100px] animate-glow-pulse pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/[0.03] dark:bg-cyan-500/[0.06] rounded-full blur-[80px] animate-glow-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />

                <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 dark:border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 text-sm font-manrope mb-8 shadow-sm"
                        data-testid="hero-badge"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        Autonomous Project Operating System
                    </motion.div>

                    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                        <motion.h1
                            variants={fadeUp}
                            className="font-outfit text-5xl sm:text-6xl lg:text-7xl tracking-tighter font-semibold text-zinc-900 dark:text-white mb-6 leading-[1.05]"
                            data-testid="hero-title"
                        >
                            Build Faster With AI
                            <br />
                            <span className="gradient-text">That Thinks Like Your CTO</span>
                        </motion.h1>

                        <motion.p
                            variants={fadeUp}
                            className="font-manrope text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                            data-testid="hero-subtitle"
                        >
                            GhostBoard AI automates the cognitive overhead of project design. 
                            Instantly plan architectures, generate detailed sprint backlogs, and run context-grounded document queries.
                        </motion.p>

                        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
                            <button
                                data-testid="hero-cta-button"
                                onClick={() => navigate(user ? "/dashboard" : "/auth?mode=register")}
                                className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium font-manrope hover:brightness-110 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 flex items-center gap-2"
                            >
                                Start Building Free
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <a
                                href="#features"
                                onClick={(e) => smoothScroll(e, "features")}
                                data-testid="learn-more-btn"
                                className="px-8 py-3.5 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-white font-manrope hover:bg-zinc-200 dark:hover:bg-white/[0.07] transition-all duration-300 flex items-center gap-2 shadow-sm"
                            >
                                See Features
                            </a>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll Down Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-600"
                >
                    <span className="text-xs font-manrope tracking-widest uppercase">Scroll</span>
                    <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </motion.div>
            </section>

            {/* About Section */}
            <section id="about" className="py-24 px-6 relative bg-zinc-50/50 dark:bg-zinc-950/20 border-y border-zinc-200/50 dark:border-white/[0.04]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                                Core Concept
                            </div>
                            <h2 className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-medium text-zinc-900 dark:text-white leading-tight">
                                Tonal Architecture & <br />
                                <span className="gradient-text-alt">Illuminated Intelligence</span>
                            </h2>
                            <p className="font-manrope text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                Traditional project management software forces you to manually construct spreadsheets, tasks, and documentation. GhostBoard AI flips the model. 
                                By integrating contextual RAG memory and autonomous sprint planners directly into your technical workspace, we eliminate the cognitive overhead of coding structure.
                            </p>
                            <div className="space-y-4 pt-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mt-0.5">
                                        <Zap className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="font-outfit font-medium text-zinc-900 dark:text-white text-base">Instant Technical Blueprints</h4>
                                        <p className="font-manrope text-sm text-zinc-500 dark:text-zinc-400">Map stack decisions and system topologies using AI designed for technical validation.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mt-0.5">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="font-outfit font-medium text-zinc-900 dark:text-white text-base">Expert CTO Advisory</h4>
                                        <p className="font-manrope text-sm text-zinc-500 dark:text-zinc-400">Get security, performance, database schemas, and scalability questions answered with context.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Interactive Feature Graphic */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative lg:pl-10"
                        >
                            <div className="glass-card p-6 border border-zinc-200/60 dark:border-white/[0.08] relative overflow-hidden shadow-lg">
                                {/* Small visual node representation */}
                                <div className="space-y-4 font-mono text-xs">
                                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-3">
                                        <span className="text-zinc-400 dark:text-zinc-500">ghostboard_orchestrator.py</span>
                                        <div className="flex gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-zinc-600 dark:text-zinc-400">
                                        <p className="text-purple-600 dark:text-purple-400"># Ingesting documentation reference context...</p>
                                        <p className="text-zinc-800 dark:text-zinc-200">{"{"}</p>
                                        <p className="pl-4">"project": "GhostBoard AI Core",</p>
                                        <p className="pl-4">"database": "Supabase PostgreSQL",</p>
                                        <p className="pl-4 text-cyan-600 dark:text-cyan-400">"status": "Generating sprint cards..."</p>
                                        <p className="text-zinc-800 dark:text-zinc-200">{"}"}</p>
                                    </div>
                                    <div className="mt-6 p-4 rounded-lg bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08]">
                                        <div className="flex items-center justify-between text-zinc-900 dark:text-white mb-2">
                                            <span className="font-outfit font-medium">Sprint planner status</span>
                                            <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded border border-green-500/20">Active</span>
                                        </div>
                                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: "0%" }}
                                                whileInView={{ width: "78%" }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1.2, delay: 0.5 }}
                                                className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full"
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-zinc-400 mt-2">
                                            <span>21 Tasks generated</span>
                                            <span>78% complete</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20"
                    >
                        <p className="font-manrope text-xs tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-500 mb-4">Capabilities</p>
                        <h2 className="font-outfit text-4xl sm:text-5xl tracking-tight font-medium text-zinc-900 dark:text-white mb-4">
                            Everything to Ship <span className="gradient-text">Faster</span>
                        </h2>
                        <p className="font-manrope text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
                            A suite of powerful AI workspaces integrated into a single hub to support solo developers and team workflows.
                        </p>
                    </motion.div>

                    <div className="space-y-24 mt-16">
                        {/* Feature 1: Project Architect */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="space-y-5"
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-semibold uppercase tracking-wider">
                                    Worktree Blueprinting
                                </div>
                                <h3 className="font-outfit text-2xl sm:text-3xl font-medium text-zinc-900 dark:text-white">
                                    AI Project Architect
                                </h3>
                                <p className="font-manrope text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    The **AI Project Architect** converts a simple sentence or a rough project requirements dump into a structured, production-grade technical design blueprint. It recommends optimized folders, databases, and authentication paradigms.
                                </p>
                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] space-y-2.5">
                                    <h4 className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">How to use:</h4>
                                    <p className="font-manrope text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Type in your project concept, select preferred technologies (e.g. Next.js, FastAPI, Supabase), and click **Compile**. Copy the generated prompts for <strong>Plan</strong>, <strong>Build</strong>, and <strong>Test</strong> directly into coding agents (such as Cursor, Windsurf, or Copilot) to scaffold your codebase instantly.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(user ? "/architect" : "/auth?mode=register")}
                                    className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider hover:underline"
                                >
                                    Try AI Architect <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>

                            {/* Visual representation */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="glass-card p-6 border border-zinc-200/60 dark:border-white/[0.08] shadow-md relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-white/[0.08] pb-3">
                                    <span className="text-xs font-mono text-zinc-400">Architect Prompt Output</span>
                                    <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-mono font-semibold">PROMPT 1: PLAN</span>
                                </div>
                                <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 space-y-2 leading-relaxed">
                                    <p className="text-purple-600 dark:text-purple-400"># System design instructions for coding agent:</p>
                                    <p><strong className="text-zinc-800 dark:text-zinc-200">1. Setup Architecture:</strong> Establish Next.js App Router root folders, configure next-themes theme providers, and setup Clerk JWT authorization routers.</p>
                                    <p><strong className="text-zinc-800 dark:text-zinc-200">2. Database Models:</strong> Configure Supabase tables with row-level security (RLS) for user-owned projects.</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Feature 2: CTO Console */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Visual representation first on desktop */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="glass-card p-6 border border-zinc-200/60 dark:border-white/[0.08] shadow-md relative overflow-hidden order-last lg:order-first"
                            >
                                <div className="absolute top-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-white/[0.08] pb-3">
                                    <span className="text-xs font-mono text-zinc-400">CTO Advisory Session</span>
                                    <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded font-mono font-semibold">ADVICE: SECURITY</span>
                                </div>
                                <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 space-y-2.5 leading-relaxed">
                                    <p className="text-zinc-800 dark:text-zinc-300">Q: How should we secure our backend API tokens from CSRF?</p>
                                    <div className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200/50 dark:border-white/[0.05]">
                                        <p className="text-cyan-600 dark:text-cyan-400 font-semibold mb-1">CTO Recommendation:</p>
                                        <p>Store your session JWTs inside HttpOnly, Secure cookies. Avoid localStorage to prevent XSS-based key extraction.</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="space-y-5"
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                                    Technical Consultation
                                </div>
                                <h3 className="font-outfit text-2xl sm:text-3xl font-medium text-zinc-900 dark:text-white">
                                    AI CTO Console
                                </h3>
                                <p className="font-manrope text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    The **AI CTO Console** serves as your battle-tested software architect. When deciding on system scalability, database architectures, auth flows, or performance indexing, get clear, logical recommendations and concrete code templates instantly.
                                </p>
                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] space-y-2.5">
                                    <h4 className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">How to use:</h4>
                                    <p className="font-manrope text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Select a query category (such as Database, Security, or DevOps), input your tech stack, and state your question. The console will evaluate technical trade-offs, detail pros/cons, and write correct code solutions.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(user ? "/cto" : "/auth?mode=register")}
                                    className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 text-xs font-semibold uppercase tracking-wider hover:underline"
                                >
                                    Consult AI CTO <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        </div>

                        {/* Feature 3: RAG Memory */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="space-y-5"
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-semibold uppercase tracking-wider">
                                    Context Grounding
                                </div>
                                <h3 className="font-outfit text-2xl sm:text-3xl font-medium text-zinc-900 dark:text-white">
                                    RAG Memory System
                                </h3>
                                <p className="font-manrope text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    AI models frequently hallucinate when using private libraries, custom SDKs, or internal templates. The **Memory System** resolves this by integrating custom documents directly into your AI context, ensuring 100% accurate code output.
                                </p>
                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] space-y-2.5">
                                    <h4 className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">How to use:</h4>
                                    <p className="font-manrope text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Upload plaintext files, API documentation, or code guidelines under the **Memory** workspace. Any queries you run or blueprints you generate will reference this context first to match your styles and variables.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(user ? "/memory" : "/auth?mode=register")}
                                    className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-wider hover:underline"
                                >
                                    Manage Knowledge Base <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>

                            {/* Visual representation */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="glass-card p-6 border border-zinc-200/60 dark:border-white/[0.08] shadow-md relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-white/[0.08] pb-3">
                                    <span className="text-xs font-mono text-zinc-400">Context Documents</span>
                                    <span className="text-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded font-mono font-semibold">RAG ACTIVE</span>
                                </div>
                                <div className="space-y-2.5 font-mono text-[11px]">
                                    <div className="flex items-center justify-between p-2 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.05]">
                                        <span className="text-zinc-800 dark:text-zinc-300">stripe_checkout_api.md</span>
                                        <span className="text-zinc-400">1.4k words</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.05]">
                                        <span className="text-zinc-800 dark:text-zinc-300">tailwind_theme_config.json</span>
                                        <span className="text-zinc-400">420 bytes</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Feature 4: Sprint Planner */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Visual representation first on desktop */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="glass-card p-6 border border-zinc-200/60 dark:border-white/[0.08] shadow-md relative overflow-hidden order-last lg:order-first"
                            >
                                <div className="absolute top-0 left-0 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-white/[0.08] pb-3">
                                    <span className="text-xs font-mono text-zinc-400">Kanban Board Board</span>
                                    <span className="text-[10px] bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 px-2 py-0.5 rounded font-mono font-semibold">SPRINT 1</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                                    <div className="border border-zinc-200 dark:border-white/[0.05] p-2 rounded bg-zinc-100 dark:bg-zinc-900">
                                        <p className="text-purple-600 dark:text-purple-400 font-bold mb-1">BACKLOG</p>
                                        <p className="text-zinc-700 dark:text-zinc-300 border-l-2 border-purple-500 pl-1.5 mb-1.5">Configure Clerk Auth Router</p>
                                        <p className="text-zinc-500">SP: 5 | Feature</p>
                                    </div>
                                    <div className="border border-zinc-200 dark:border-white/[0.05] p-2 rounded bg-zinc-100 dark:bg-zinc-900">
                                        <p className="text-cyan-600 dark:text-cyan-400 font-bold mb-1">IN PROGRESS</p>
                                        <p className="text-zinc-700 dark:text-zinc-300 border-l-2 border-cyan-400 pl-1.5 mb-1.5">Setup PostgreSQL Connection</p>
                                        <p className="text-zinc-500">SP: 2 | Research</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="space-y-5"
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300 text-xs font-semibold uppercase tracking-wider">
                                    Agile Task Management
                                </div>
                                <h3 className="font-outfit text-2xl sm:text-3xl font-medium text-zinc-900 dark:text-white">
                                    AI Sprint Planner
                                </h3>
                                <p className="font-manrope text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    The **AI Sprint Planner** bridges system design with daily Agile tasks. Based on your project blueprint and team capacity, the AI generates 15-25 story-pointed tasks sorted into sprint tabs and maps them onto a drag-and-drop Kanban board.
                                </p>
                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] space-y-2.5">
                                    <h4 className="text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wide">How to use:</h4>
                                    <p className="font-manrope text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Open the **Sprint** workspace, paste your project specifications, set your target sprint duration, and generate tasks. Drag tickets between Backlog, In Progress, In Review, and Done columns to track velocity.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(user ? "/sprint" : "/auth?mode=register")}
                                    className="inline-flex items-center gap-1.5 text-fuchsia-600 dark:text-fuchsia-400 text-xs font-semibold uppercase tracking-wider hover:underline"
                                >
                                    Organize Sprint Kanban <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="py-32 px-6 relative bg-zinc-50/50 dark:bg-zinc-950/20 border-y border-zinc-200/50 dark:border-white/[0.04]">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-600/[0.01] via-transparent to-transparent pointer-events-none" />
                <div className="max-w-5xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <p className="font-manrope text-xs tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-500 mb-4">Workflow</p>
                        <h2 className="font-outfit text-4xl sm:text-5xl tracking-tight font-medium text-zinc-900 dark:text-white">
                            How GhostBoard Works
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                data-testid={`step-${i}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="flex gap-5 p-6 rounded-2xl bg-white/70 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.05] backdrop-blur-sm shadow-sm dark:shadow-none"
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 dark:from-purple-600/20 dark:to-cyan-500/20 border border-purple-500/20 dark:border-purple-500/30 flex items-center justify-center">
                                    <span className="font-jetbrains text-purple-600 dark:text-purple-400 text-sm font-semibold">{step.num}</span>
                                </div>
                                <div>
                                    <h3 className="font-outfit text-lg font-medium text-zinc-900 dark:text-white mb-2">{step.title}</h3>
                                    <p className="font-manrope text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>            {/* Testimonials Section */}
            <section id="testimonials" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <p className="font-manrope text-xs tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-500 mb-4">Feedback</p>
                        <h2 className="font-outfit text-4xl sm:text-5xl tracking-tight font-medium text-zinc-900 dark:text-white">
                            Trusted by <span className="gradient-text">Builders</span>
                        </h2>
                    </motion.div>

                    {/* Automatic Rotating Card Carousel */}
                    <div 
                        className="relative overflow-hidden py-4 px-2"
                        onMouseEnter={() => setAutoplay(false)}
                        onMouseLeave={() => setAutoplay(true)}
                        data-testid="testimonials-carousel"
                    >
                        <div 
                            className="flex transition-transform duration-500 ease-out -mx-3"
                            style={{ 
                                transform: `translateX(-${currentIndex * (100 / visibleCards)}%)` 
                            }}
                        >
                            {testimonials.map((t, idx) => (
                                <div 
                                    key={idx} 
                                    className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 p-3"
                                >
                                    <motion.div
                                        whileHover={{ y: -6, scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className="h-full rounded-2xl border border-zinc-200/60 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.02] backdrop-blur-md p-6 flex flex-col justify-between shadow-sm hover:shadow-lg hover:border-purple-500/30 transition-all duration-300"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex gap-1 text-amber-400">
                                                {[...Array(t.rating)].map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                ))}
                                            </div>
                                            <p className="font-manrope text-sm text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                                                "{t.quote}"
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-4 mt-6 border-t border-zinc-100 dark:border-white/[0.05]">
                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-semibold text-xs shadow-[0_0_12px_rgba(139,92,246,0.3)]`}>
                                                {t.avatar}
                                            </div>
                                            <div>
                                                <h4 className="font-outfit font-medium text-xs text-zinc-900 dark:text-white leading-none mb-1">{t.author}</h4>
                                                <p className="font-manrope text-[10px] text-zinc-500 dark:text-zinc-400 leading-none">{t.role}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Dots and Arrows */}
                        <div className="flex gap-4 justify-center mt-10 items-center">
                            <button
                                onClick={prevSlide}
                                className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-all shadow-sm cursor-pointer"
                                aria-label="Previous slide"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex gap-1.5">
                                {Array.from({ length: testimonials.length - visibleCards + 1 }).map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                            currentIndex === idx
                                                ? "bg-purple-600 dark:bg-purple-400 w-5"
                                                : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
                                        }`}
                                        aria-label={`Go to slide ${idx + 1}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={nextSlide}
                                className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-all shadow-sm cursor-pointer"
                                aria-label="Next slide"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-32 px-6 relative bg-zinc-50/50 dark:bg-zinc-950/20 border-t border-zinc-200/50 dark:border-white/[0.04]">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <p className="font-manrope text-xs tracking-[0.3em] uppercase text-zinc-400 dark:text-zinc-500 mb-4">FAQ</p>
                        <h2 className="font-outfit text-4xl sm:text-5xl tracking-tight font-medium text-zinc-900 dark:text-white">
                            Frequently Asked <span className="gradient-text-alt">Questions</span>
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-6 sm:p-8 border border-zinc-200/60 dark:border-white/[0.08]"
                    >
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, idx) => (
                                <AccordionItem key={faq.id} value={faq.id} className="border-b border-zinc-200 dark:border-white/[0.08] last:border-none">
                                    <AccordionTrigger className="font-outfit text-base text-zinc-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium py-4">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="font-manrope text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pb-4">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </motion.div>
                </div>
            </section>

            {/* Footer Section */}
            <footer className="border-t border-zinc-200 dark:border-white/[0.05] bg-zinc-50 dark:bg-[#0A0A0C] transition-colors duration-300 py-16 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-outfit text-zinc-900 dark:text-white font-semibold text-base">GhostBoard AI</span>
                        </div>
                        <p className="font-manrope text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            The autonomous project operating system mapping system designs and sprint backlogs instantly. Built for hackathon winners and technical founders.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div className="space-y-4">
                        <h4 className="font-outfit text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Navigation</h4>
                        <ul className="font-manrope text-xs space-y-2.5 text-zinc-500 dark:text-zinc-400">
                            <li><a href="#about" onClick={(e) => smoothScroll(e, "about")} className="hover:text-purple-500 transition-colors">About</a></li>
                            <li><a href="#features" onClick={(e) => smoothScroll(e, "features")} className="hover:text-purple-500 transition-colors">Features</a></li>
                            <li><a href="#how-it-works" onClick={(e) => smoothScroll(e, "how-it-works")} className="hover:text-purple-500 transition-colors">How it works</a></li>
                            <li><a href="#testimonials" onClick={(e) => smoothScroll(e, "testimonials")} className="hover:text-purple-500 transition-colors">Testimonials</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h4 className="font-outfit text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Legal</h4>
                        <ul className="font-manrope text-xs space-y-2.5 text-zinc-500 dark:text-zinc-400">
                            <li><Link to="/privacy" className="hover:text-purple-500 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-purple-500 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h4 className="font-outfit text-sm font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Contact & Socials</h4>
                        <ul className="font-manrope text-xs space-y-2.5 text-zinc-500 dark:text-zinc-400">
                            <li className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-purple-500" />
                                <a href="mailto:support@ghostboard.ai" className="hover:text-purple-500 transition-colors">support@ghostboard.ai</a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Github className="w-3.5 h-3.5 text-zinc-400" />
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">GitHub Repository</a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Twitter className="w-3.5 h-3.5 text-cyan-400" />
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">@GhostBoardAI</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-zinc-200 dark:border-white/[0.05] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="font-manrope text-[11px] text-zinc-500 dark:text-zinc-600">
                        &copy; 2026 GhostBoard AI. All rights reserved. Made by founders for builders.
                    </p>
                    <p className="font-manrope text-[11px] text-zinc-400 dark:text-zinc-500">
                        Powered by DeepMind and OpenRouter.
                    </p>
                </div>
            </footer>
        </div>
    );
}
