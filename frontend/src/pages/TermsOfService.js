import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, AlertTriangle, Cpu, HelpCircle, Scale } from "lucide-react";
import { useTheme } from "next-themes";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function TermsOfService() {
    const { theme } = useTheme();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections = [
        {
            icon: Scale,
            title: "1. Acceptance of Terms",
            content: (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                    By creating an account, accessing the dashboard, or utilizing the GhostBoard AI technical project management tools, you agree to comply with and be bound by these Terms of Service. If you do not accept these terms, you may not utilize any workspaces, API endpoints, or AI capabilities hosted on GhostBoard.
                </p>
            )
        },
        {
            icon: Cpu,
            title: "2. AI Blueprint Generation & Code Limitations",
            content: (
                <div className="space-y-3">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                        GhostBoard AI uses large language models (via OpenRouter) to generate sprint plans, architecture layouts, and advice.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400 text-sm">
                        <li><strong>No Guarantee of Accuracy:</strong> Architectural plans and sprint tickets are recommendations. GhostBoard AI does not warrant that AI-generated code will build or compile error-free.</li>
                        <li><strong>Output Ownership:</strong> You own the copyright to all outputs and designs generated for your projects. However, you are solely responsible for verifying the security, license compatibility, and correctness of those outputs.</li>
                        <li><strong>Input Integrity:</strong> You represent that you own or have the rights to upload any codebases, URLs, or notes into the RAG memory system.</li>
                    </ul>
                </div>
            )
        },
        {
            icon: AlertTriangle,
            title: "3. Acceptable Use & Rate Limiting",
            content: (
                <div className="space-y-3">
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                        To maintain operational efficiency and fair distribution of AI resources, the following is prohibited:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400 text-sm">
                        <li><strong>API Abuse:</strong> Bypassing rate limiters, using automated scraping scripts on AI Architect stream routes, or attempting denial-of-service (DoS) attacks.</li>
                        <li><strong>Unauthorized Authentication:</strong> Forging Clerk session tokens or distributing false JWT secrets.</li>
                        <li><strong>Malicious Content:</strong> Uploading documents containing malware, spyware, or illegal files into the RAG memory storage system.</li>
                    </ul>
                </div>
            )
        },
        {
            icon: BookOpen,
            title: "4. Account Management & Termination",
            content: (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                    We reserve the right to suspend or terminate user accounts that violate acceptable use limits, fail to complete authentication, or cause system instability. Upon termination, user permissions to access internal project boards, workspaces, and cached AI advice history will be revoked, and associated databases will be cleaned according to our retention timelines.
                </p>
            )
        },
        {
            icon: HelpCircle,
            title: "5. Limitation of Liability & Disclaimers",
            content: (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                    GhostBoard AI is provided on an "as is" and "as available" basis without any express or implied warranties. In no event shall GhostBoard, its affiliates, or LLM providers be held liable for any direct, indirect, incidental, or consequential damages resulting from database connectivity losses, inaccurate AI advice, server downtime, or project delivery delays.
                </p>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative" data-testid="terms-page">
            <AnimatedBackground />

            {/* Glowing background circles */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/[0.04] dark:bg-cyan-600/[0.06] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-purple-500/[0.04] dark:bg-purple-500/[0.05] rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 py-20 relative z-10">
                {/* Back Button */}
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors text-sm font-manrope mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                {/* Header */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
                        Terms of Service
                    </div>
                    <h1 className="font-outfit text-4xl sm:text-5xl font-medium tracking-tight mb-4 text-zinc-900 dark:text-white">
                        Terms & <span className="gradient-text-alt">Conditions</span>
                    </h1>
                    <p className="font-manrope text-zinc-500 dark:text-zinc-400 text-sm">
                        Last updated: June 11, 2026. Review our legal terms, liability structure, and acceptable usage rules.
                    </p>
                </div>

                {/* Main Content Glass Card */}
                <div className="glass-card p-8 sm:p-10 space-y-10 border border-zinc-200/60 dark:border-white/[0.08]">
                    {/* General Intro */}
                    <div className="space-y-4">
                        <h2 className="font-outfit text-xl font-medium text-zinc-900 dark:text-white">Introduction</h2>
                        <p className="font-manrope text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                            Welcome to GhostBoard AI. By using our website, services, database configurations, and AI generation tools, you agree to accept these terms in full. These terms outline how we manage account access, limit technical liabilities, and define the boundaries of project planning features.
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
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
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

                    {/* Bottom disclaimer */}
                    <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 dark:bg-cyan-500/10 dark:border-cyan-500/20 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-manrope">
                        <strong>Governing Law:</strong> These terms shall be governed by and construed in accordance with the local laws, without giving effect to any principles of conflicts of law. Any legal action arising from these terms shall be filed in governing local courts. Contact <strong>legal@ghostboard.ai</strong> for corporate queries.
                    </div>
                </div>
            </div>
        </div>
    );
}
