import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Code2, Sparkles, RefreshCw, ChevronRight, Loader2, Copy, Check } from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";
import { useAIStream } from "@/hooks/useAIStream";
import { useAuth } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

const categories = [
    { id: "architecture", label: "Architecture", color: "from-purple-500 to-violet-600" },
    { id: "security", label: "Security", color: "from-red-500 to-orange-500" },
    { id: "scalability", label: "Scalability", color: "from-green-500 to-teal-500" },
    { id: "devops", label: "DevOps", color: "from-blue-500 to-cyan-500" },
    { id: "database", label: "Database", color: "from-yellow-500 to-amber-500" },
    { id: "performance", label: "Performance", color: "from-pink-500 to-rose-500" },
];

const presets = [
    "What's the best tech stack for a real-time chat application handling 10k concurrent users?",
    "How should I structure my microservices to avoid tight coupling?",
    "What database design patterns should I use for a multi-tenant SaaS?",
    "How can I improve the performance of my React app with large datasets?",
    "What's the optimal CI/CD pipeline for a startup team of 3?",
    "How do I implement secure authentication in a distributed system?",
];

function MarkdownContent({ text }) {
    return (
        <ReactMarkdown
            className="font-manrope text-sm text-zinc-300 leading-relaxed"
            components={{
                h2: ({ children }) => (
                    <h2 className="font-outfit text-lg font-medium text-white mt-6 mb-2 border-b border-white/10 pb-2">
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="font-outfit text-base font-medium text-cyan-300 mt-4 mb-1.5">
                        {children}
                    </h3>
                ),
                strong: ({ children }) => (
                    <strong className="text-white font-medium">
                        {children}
                    </strong>
                ),
                code: ({ children }) => (
                    <code className="font-jetbrains text-xs bg-white/10 text-purple-300 px-1.5 py-0.5 rounded">
                        {children}
                    </code>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc pl-4 space-y-1">
                        {children}
                    </ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal pl-4 space-y-1">
                        {children}
                    </ol>
                ),
                li: ({ children }) => (
                    <li className="text-zinc-300 mb-1">
                        {children}
                    </li>
                ),
                p: ({ children }) => (
                    <p className="mb-2">
                        {children}
                    </p>
                )
            }}
        >
            {text}
        </ReactMarkdown>
    );
}

export default function CTODashboard() {
    const { getToken } = useAuth();
    const { output, isStreaming, error, stream, clear } = useAIStream();
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem("ghostboard_cto_selectedProjectId") || "");
    const [question, setQuestion] = useState(() => localStorage.getItem("ghostboard_cto_question") || "");
    const [context, setContext] = useState(() => localStorage.getItem("ghostboard_cto_context") || "");
    const [category, setCategory] = useState(() => localStorage.getItem("ghostboard_cto_category") || "architecture");
    const [techStack, setTechStack] = useState(() => localStorage.getItem("ghostboard_cto_techStack") || "");
    const [copied, setCopied] = useState(false);
    const [history, setHistory] = useState([]);
    const outputRef = useRef(null);
    const textareaRef = useRef(null);

    // Persist values to localStorage
    useEffect(() => {
        localStorage.setItem("ghostboard_cto_selectedProjectId", selectedProjectId);
    }, [selectedProjectId]);

    useEffect(() => {
        localStorage.setItem("ghostboard_cto_question", question);
    }, [question]);

    useEffect(() => {
        localStorage.setItem("ghostboard_cto_context", context);
    }, [context]);

    useEffect(() => {
        localStorage.setItem("ghostboard_cto_category", category);
    }, [category]);

    useEffect(() => {
        localStorage.setItem("ghostboard_cto_techStack", techStack);
    }, [techStack]);

    const handleClear = () => {
        clear();
        setQuestion("");
        setContext("");
        localStorage.removeItem("ghostboard_cto_question");
        localStorage.removeItem("ghostboard_cto_context");
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = getToken();
                const { data } = await axios.get(`${API}/projects`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(data);
            } catch (err) {
                console.error("Failed to fetch projects:", err);
            }
        };
        fetchProjects();
    }, [getToken]);

    const handleProjectChange = (projectId) => {
        setSelectedProjectId(projectId);
        if (!projectId) {
            setTechStack("");
            setContext("");
            return;
        }
        const proj = projects.find((p) => p.id === projectId);
        if (proj) {
            setTechStack(proj.tech_stack ? proj.tech_stack.join(", ") : "");
            setContext(
                `Project Idea: ${proj.idea || ""}\n\nDescription: ${proj.description || ""}`
            );
        }
    };

    useEffect(() => {
        if (outputRef.current && isStreaming) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output, isStreaming]);

    const handleAsk = async () => {
        if (!question.trim() || isStreaming) return;
        clear();
        const q = question;
        setHistory((prev) => [{ question: q, category, timestamp: new Date() }, ...prev.slice(0, 9)]);
        await stream("/ai/cto", {
            question: q,
            context,
            category,
            tech_stack: techStack ? techStack.split(",").map((s) => s.trim()) : [],
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAsk();
    };

    return (
        <div className="min-h-screen bg-[#0A0A0C]" data-testid="cto-page">
            <Navbar />
            <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 py-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            <Code2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-outfit text-2xl font-medium text-white">AI CTO Console</h1>
                            <p className="font-manrope text-sm text-zinc-400">Expert technical guidance for every architecture decision</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Input Panel */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }} className="lg:col-span-1 space-y-4">
                        {/* Context Project */}
                        <div className="p-4 rounded-2xl glass-card">
                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Context Project</label>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => handleProjectChange(e.target.value)}
                                data-testid="cto-project-select"
                                className="input-glass text-xs py-2 w-full"
                            >
                                <option value="" className="bg-[#0A0A0C]">None (General Advice)</option>
                                {projects.map((proj) => (
                                    <option key={proj.id} value={proj.id} className="bg-[#0A0A0C]">
                                        {proj.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category */}
                        <div className="p-4 rounded-2xl glass-card">
                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-3">Category</label>
                            <div className="grid grid-cols-2 gap-2">
                                {categories.map((cat) => (
                                    <button key={cat.id} onClick={() => setCategory(cat.id)}
                                        data-testid={`category-${cat.id}`}
                                        className={`px-3 py-2 rounded-lg text-xs font-manrope transition-all duration-200 ${
                                            category === cat.id
                                                ? `bg-gradient-to-br ${cat.color} text-white shadow-sm`
                                                : "bg-white/[0.04] border border-white/[0.07] text-zinc-400 hover:text-white"
                                        }`}>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tech Stack */}
                        <div className="p-4 rounded-2xl glass-card">
                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Your Tech Stack</label>
                            <input value={techStack} onChange={(e) => setTechStack(e.target.value)}
                                placeholder="React, Node.js, PostgreSQL..." data-testid="tech-stack-input"
                                className="input-glass text-xs" />
                            <p className="text-xs text-zinc-600 font-manrope mt-1.5">Comma-separated</p>
                        </div>

                        {/* Quick presets */}
                        <div className="p-4 rounded-2xl glass-card">
                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-3">Quick Questions</label>
                            <div className="space-y-1.5">
                                {presets.slice(0, 4).map((preset, i) => (
                                    <button key={i} onClick={() => setQuestion(preset)} data-testid={`preset-${i}`}
                                        className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.06] text-xs font-manrope transition-all line-clamp-2">
                                        {preset.slice(0, 60)}...
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* History */}
                        {history.length > 0 && (
                            <div className="p-4 rounded-2xl glass-card">
                                <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-3">Recent</label>
                                <div className="space-y-2">
                                    {history.slice(0, 5).map((h, i) => (
                                        <button key={i} onClick={() => setQuestion(h.question)}
                                            className="w-full text-left px-2 py-1.5 rounded text-zinc-500 hover:text-zinc-300 text-xs font-manrope transition-colors line-clamp-1">
                                            <ChevronRight className="inline w-3 h-3 mr-1" />
                                            {h.question.slice(0, 50)}...
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Main Panel */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }} className="lg:col-span-3 flex flex-col gap-4">
                        {/* Question Input */}
                        <div className="p-5 rounded-2xl glass-card">
                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-3">
                                Technical Question
                                <span className="ml-2 normal-case tracking-normal text-zinc-600">⌘+Enter to submit</span>
                            </label>
                            <textarea ref={textareaRef} value={question} onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={handleKeyDown} data-testid="cto-question-input"
                                placeholder="Ask your CTO anything... e.g., 'What's the best way to handle real-time data sync between microservices?' or 'How should I design my authentication system for 1M users?'"
                                rows={4} className="input-glass resize-none text-sm leading-relaxed scrollbar-ghost mb-3" />
                            <textarea value={context} onChange={(e) => setContext(e.target.value)}
                                placeholder="Additional context (optional): current pain points, constraints, scale requirements..."
                                rows={2} data-testid="cto-context-input"
                                className="input-glass resize-none text-xs leading-relaxed scrollbar-ghost text-zinc-400 mb-3" />
                            <div className="flex justify-end">
                                <button onClick={handleAsk} disabled={!question.trim() || isStreaming}
                                    data-testid="ask-cto-btn"
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium font-manrope hover:brightness-110 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                    {isStreaming ? <><Loader2 className="w-4 h-4 animate-spin" /> Thinking...</> : <><Sparkles className="w-4 h-4" /> Ask CTO</>}
                                </button>
                            </div>
                        </div>

                        {/* Response */}
                        <div className="flex-1 rounded-2xl glass-card flex flex-col min-h-[400px]">
                            <div className="flex items-center justify-between p-4 border-b border-white/[0.07]">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isStreaming ? "bg-cyan-400 animate-pulse" : output ? "bg-green-400" : "bg-zinc-600"}`} />
                                    <span className="font-manrope text-xs text-zinc-400">
                                        {isStreaming ? "CTO is thinking..." : output ? `CTO Response · ${category}` : "Ready for your question"}
                                    </span>
                                </div>
                                {output && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleCopy} data-testid="copy-cto-btn"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-white text-xs font-manrope transition-all">
                                            {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                        </button>
                                        <button onClick={handleClear} className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors">
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div ref={outputRef} className="flex-1 p-5 overflow-y-auto scrollbar-ghost" data-testid="cto-response">
                                {!output && !isStreaming && !error && (
                                    <div className="h-full flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center mb-4">
                                            <Code2 className="w-8 h-8 text-cyan-400" />
                                        </div>
                                        <p className="font-outfit text-lg font-medium text-zinc-400 mb-2">Your CTO is ready</p>
                                        <p className="font-manrope text-sm text-zinc-600 max-w-sm">
                                            Ask any technical question — architecture, scaling, security, or technology choices.
                                        </p>
                                    </div>
                                )}
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-manrope" data-testid="cto-error">
                                        {error}
                                    </div>
                                )}
                                {(output || isStreaming) && (
                                    <div className={isStreaming ? "cursor-blink" : ""}>
                                        <MarkdownContent text={output} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
