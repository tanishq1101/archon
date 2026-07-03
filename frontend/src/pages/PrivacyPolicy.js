import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";
import { useTheme } from "next-themes";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function PrivacyPolicy() {
    const { theme } = useTheme();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections = [
        {
            icon: Eye,
            title: "1. Information We Collect",
            content: (
                <div className="space-y-3">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                        At Archon AI, we collect information to provide a better, more optimized technical workspace. This includes:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400 text-sm">
                        <li><strong>Account Credentials:</strong> Information provided during registration such as name, email address, and authentication tokens via Clerk.</li>
                        <li><strong>Project Inputs:</strong> Tech stacks, timeline selections, ideas, technical descriptions, and sprint plans created or imported by the user.</li>
                        <li><strong>System Memory Assets:</strong> Plaintext, URLs, and documentation uploaded by users to customize context-grounded queries.</li>
                        <li><strong>Usage Metadata:</strong> Timestamps, route activity logging, browser type, and API call counters to enforce rate limits.</li>
                    </ul>
                </div>
            )
        },
        {
            icon: Lock,
            title: "2. How We Use Your Information",
            content: (
                <div className="space-y-3">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                        The information we gather is used to run and continuously improve our services, specifically:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400 text-sm">
                        <li><strong>AI Feature Grounding:</strong> Supplying the OpenRouter API with user-provided context vectors, project parameters, and queries to generate accurate sprint roadmaps and CTO advice.</li>
                        <li><strong>Authentication & Profile Maintenance:</strong> Restricting access to project worktrees and sprint dashboards via secure JWT verification.</li>
                        <li><strong>Performance Auditing:</strong> Monitoring server execution logs (using structured logging) to minimize request latency.</li>
                        <li><strong>Service Operations:</strong> Resolving support requests and conducting database migrations.</li>
                    </ul>
                </div>
            )
        },
        {
            icon: ShieldCheck,
            title: "3. Data Sharing & Security",
            content: (
                <div className="space-y-3">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                        We prioritize user data privacy. We do not sell or lease user information. Data sharing is limited to essential third-party processors:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400 text-sm">
                        <li><strong>Supabase:</strong> For secure database storage and schema indexing.</li>
                        <li><strong>Clerk:</strong> For handling sign-ins and managing user session metadata.</li>
                        <li><strong>OpenRouter API:</strong> For processing AI instructions via default models (such as deepseek-chat or gemini-2.5-flash). We ensure zero data retention policies are requested when supported by LLM providers.</li>
                    </ul>
                </div>
            )
        },
        {
            icon: FileText,
            title: "4. Your Rights & Options",
            content: (
                <div className="space-y-3">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                        You retain full control over your technical workspace data:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400 text-sm">
                        <li><strong>Data Portability:</strong> Copy architectural blueprints, sprint tickets, and notes directly to your clipboard or download them as needed.</li>
                        <li><strong>Permanent Erasure:</strong> Delete specific documents from the memory workspace or delete projects completely. Deleting resources immediately removes references from Supabase collections.</li>
                        <li><strong>Account Termination:</strong> You can request complete deletion of your profile and data by contacting support.</li>
                    </ul>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative" data-testid="privacy-page">
            <AnimatedBackground />

            {/* Glowing background circles for Dark Mode */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/[0.04] dark:bg-purple-600/[0.06] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-cyan-500/[0.04] dark:bg-cyan-500/[0.05] rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 py-20 relative z-10">
                {/* Back Button */}
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors text-sm font-manrope mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-semibold uppercase tracking-wider mb-4">
                        Regulatory Guidelines
                    </div>
                    <h1 className="font-outfit text-4xl sm:text-5xl font-medium tracking-tight mb-4 text-zinc-900 dark:text-white">
                        Privacy <span className="gradient-text">Policy</span>
                    </h1>
                    <p className="font-manrope text-zinc-500 dark:text-zinc-400 text-sm">
                        Last updated: June 11, 2026. Review how we secure and handle your project and profile data.
                    </p>
                </div>

                {/* Main Content Glass Card */}
                <div className="glass-card p-8 sm:p-10 space-y-10 border border-zinc-200/60 dark:border-white/[0.08]">
                    {/* Intro */}
                    <div className="space-y-4">
                        <h2 className="font-outfit text-xl font-medium text-zinc-900 dark:text-white">Introduction</h2>
                        <p className="font-manrope text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                            Archon AI (referred to as "we", "our", or "Archon") is committed to respecting and protecting the privacy of developer teams and individual developers. This Privacy Policy describes how we collect, process, index, and safeguard data in connection with our AI project architect workspace, CTO advisory console, and RAG knowledge-base operations.
                        </p>
                    </div>

                    <hr className="border-zinc-200 dark:border-white/[0.08]" />

                    {/* Dynamic Sections */}
                    <div className="space-y-8">
                        {sections.map((sect, index) => {
                            const IconComp = sect.icon;
                            return (
                                <div key={index} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <IconComp className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-outfit text-lg font-medium text-zinc-900 dark:text-white">{sect.title}</h3>
                                    </div>
                                    <div className="font-manrope pl-11">
                                        {sect.content}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <hr className="border-zinc-200 dark:border-white/[0.08]" />

                    {/* Bottom Disclaimer */}
                    <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 dark:bg-purple-500/10 dark:border-purple-500/20 flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-manrope">
                            <strong>GDPR & Compliance:</strong> If you are accessing this workspace from the European Economic Area (EEA), we act as a Data Controller for registration identifiers and a Data Processor for custom workspace data. If you have any inquiries, contact support at <strong>privacy@archon.ai</strong>.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
