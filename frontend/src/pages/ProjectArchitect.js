import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Save, RefreshCw, Copy, Check, Plus, X, Loader2, Download } from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";
import { useAIStream } from "@/hooks/useAIStream";
import { useAuth } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

const techOptions = [
    "React", "Next.js", "Svelte", "SvelteKit", "Vue.js", "Nuxt.js", "Astro", "SolidJS", "Angular", "TailwindCSS",
    "Shadcn UI", "Node.js", "NestJS", "FastAPI", "Django", "Express", "Koa", "Ruby on Rails", "Spring Boot", "Laravel",
    "Go", "Rust", "TypeScript", "Python", "Bun", "Deno", "PostgreSQL", "MongoDB", "MySQL", "SQLite",
    "Redis", "Supabase", "Firebase", "DynamoDB", "Prisma", "Drizzle", "tRPC", "GraphQL", "Docker", "Kubernetes",
    "Terraform", "GitHub Actions", "AWS", "Google Cloud", "Vercel", "Netlify", "Clerk", "Stripe", "LangChain", "LlamaIndex",
    "ChromaDB", "Pinecone", "Weaviate", "Qdrant", "Hugging Face", "React Native", "Flutter", "Tauri", "Electron"
];

// Helper to parse the project understanding and 3 prompts from compiled output
const parsePrompts = (rawText) => {
    if (!rawText) return { understanding: "", prompt1: "", prompt2: "", prompt3: "" };

    const puIndex = rawText.indexOf("PROJECT UNDERSTANDING");
    const p1Index = rawText.indexOf("PROMPT 1");
    const p2Index = rawText.indexOf("PROMPT 2");
    const p3Index = rawText.indexOf("PROMPT 3");

    let understanding = "";
    let prompt1 = "";
    let prompt2 = "";
    let prompt3 = "";

    // 1. PROJECT UNDERSTANDING
    if (puIndex !== -1) {
        const endOfPu = p1Index !== -1 ? p1Index : rawText.length;
        understanding = rawText.substring(puIndex + 21, endOfPu).trim();
    } else {
        // Fallback: if no headers exist yet, treat whole streaming text as understanding
        if (p1Index === -1) {
            understanding = rawText;
        }
    }

    // 2. PROMPT 1
    if (p1Index !== -1) {
        const endOfP1 = p2Index !== -1 ? p2Index : rawText.length;
        prompt1 = rawText.substring(p1Index + 8, endOfP1).trim();
        prompt1 = prompt1.replace(/^(→\s*PLAN|—\s*PLANNING\s*&\s*ARCHITECTURE|:\s*PLANNING\s*&\s*ARCHITECTURE|:\s*PLAN)/i, "").trim();
    }

    // 3. PROMPT 2
    if (p2Index !== -1) {
        const endOfP2 = p3Index !== -1 ? p3Index : rawText.length;
        prompt2 = rawText.substring(p2Index + 8, endOfP2).trim();
        prompt2 = prompt2.replace(/^(→\s*BUILD|—\s*IMPLEMENTATION|:\s*IMPLEMENTATION|:\s*BUILD)/i, "").trim();
    }

    // 4. PROMPT 3
    if (p3Index !== -1) {
        prompt3 = rawText.substring(p3Index + 8).trim();
        prompt3 = prompt3.replace(/^(→\s*OPTIMIZE|—\s*REVIEW,\s*TESTING\s*&\s*OPTIMIZATION|:\s*REVIEW,\s*TESTING\s*&\s*OPTIMIZATION|:\s*OPTIMIZE)/i, "").trim();
    }

    return { understanding, prompt1, prompt2, prompt3 };
};

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
                    <h3 className="font-outfit text-base font-medium text-purple-300 mt-4 mb-1.5">
                        {children}
                    </h3>
                ),
                strong: ({ children }) => (
                    <strong className="text-white font-medium">
                        {children}
                    </strong>
                ),
                code: ({ children }) => (
                    <code className="font-jetbrains text-xs bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded">
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

export default function ProjectArchitect() {
    const { getToken } = useAuth();
    const { output, isStreaming, error, stream, clear } = useAIStream();
    
    // Idea Enhancement Stream Hook
    const {
        output: enhancedIdeaOutput,
        isStreaming: isEnhancingIdea,
        error: enhanceError,
        stream: streamEnhance,
        clear: clearEnhance
    } = useAIStream();

    const [idea, setIdea] = useState(() => localStorage.getItem("ghostboard_architect_idea") || "");
    const [techPrefs, setTechPrefs] = useState(() => {
        try {
            const val = localStorage.getItem("ghostboard_architect_techPrefs");
            return val ? JSON.parse(val) : [];
        } catch {
            return [];
        }
    });
    const [teamSize, setTeamSize] = useState(() => {
        const val = localStorage.getItem("ghostboard_architect_teamSize");
        return val ? Number(val) : 1;
    });
    const [timeline, setTimeline] = useState(() => localStorage.getItem("ghostboard_architect_timeline") || "4 weeks");
    const [customTech, setCustomTech] = useState("");
    
    // Copy states
    const [copiedUnd, setCopiedUnd] = useState(false);
    const [copied1, setCopied1] = useState(false);
    const [copied2, setCopied2] = useState(false);
    const [copied3, setCopied3] = useState(false);
    const [copiedAll, setCopiedAll] = useState(false);

    const [saving, setSaving] = useState(false);
    const [savedProjectId, setSavedProjectId] = useState(() => {
        return localStorage.getItem("ghostboard_architect_savedProjectId") || null;
    });
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem("ghostboard_architect_activeTab") || "understanding");
    const outputRef = useRef(null);

    const autoSwitchedRef = useRef({
        prompt1: false,
        prompt2: false,
        prompt3: false
    });

    useEffect(() => {
        localStorage.setItem("ghostboard_architect_idea", idea);
    }, [idea]);

    useEffect(() => {
        localStorage.setItem("ghostboard_architect_techPrefs", JSON.stringify(techPrefs));
    }, [techPrefs]);

    useEffect(() => {
        localStorage.setItem("ghostboard_architect_teamSize", teamSize.toString());
    }, [teamSize]);

    useEffect(() => {
        localStorage.setItem("ghostboard_architect_timeline", timeline);
    }, [timeline]);

    useEffect(() => {
        if (savedProjectId) {
            localStorage.setItem("ghostboard_architect_savedProjectId", savedProjectId.toString());
        } else {
            localStorage.removeItem("ghostboard_architect_savedProjectId");
        }
    }, [savedProjectId]);

    useEffect(() => {
        localStorage.setItem("ghostboard_architect_activeTab", activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (outputRef.current && isStreaming) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output, isStreaming]);

    useEffect(() => {
        if (enhancedIdeaOutput) {
            setIdea(enhancedIdeaOutput);
        }
    }, [enhancedIdeaOutput]);

    // Auto switch tabs based on streaming headers, only once per run
    useEffect(() => {
        if (isStreaming && output) {
            if (output.includes("PROMPT 3") && !autoSwitchedRef.current.prompt3) {
                autoSwitchedRef.current.prompt3 = true;
                setActiveTab("prompt3");
            } else if (output.includes("PROMPT 2") && !output.includes("PROMPT 3") && !autoSwitchedRef.current.prompt2) {
                autoSwitchedRef.current.prompt2 = true;
                setActiveTab("prompt2");
            } else if (output.includes("PROMPT 1") && !output.includes("PROMPT 2") && !output.includes("PROMPT 3") && !autoSwitchedRef.current.prompt1) {
                autoSwitchedRef.current.prompt1 = true;
                setActiveTab("prompt1");
            }
        }
    }, [output, isStreaming]);

    const autoSaveProject = async (blueprintText) => {
        if (!blueprintText || saving) return;
        setSaving(true);
        try {
            const token = getToken();
            const { data } = await axios.post(`${API}/projects`, {
                title: idea.slice(0, 60) || "Untitled Project",
                description: idea,
                idea,
                tech_stack: techPrefs,
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            if (data?.id) {
                await axios.put(`${API}/projects/${data.id}`, { ai_blueprint: blueprintText }, { headers: { Authorization: `Bearer ${token}` } });
                setSavedProjectId(data.id);
            }
        } catch (err) {
            console.error("Auto-save failed:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        if (!idea.trim() || isStreaming) return;
        clear();
        setSavedProjectId(null);
        setActiveTab("understanding");
        autoSwitchedRef.current = {
            prompt1: false,
            prompt2: false,
            prompt3: false
        };
        const finalOutput = await stream("/ai/architect", { idea, tech_preferences: techPrefs, team_size: teamSize, timeline });
        if (finalOutput && !finalOutput.includes("Error:") && !finalOutput.includes("Stream error:")) {
            await autoSaveProject(finalOutput);
        }
    };

    const handleEnhance = async () => {
        if (!idea.trim() || isEnhancingIdea) return;
        clearEnhance();
        await streamEnhance("/ai/enhance-idea", { idea });
    };

    const handleSave = async () => {
        if (!output || saving) return;
        await autoSaveProject(output);
    };

    const handleClear = () => {
        clear();
        setIdea("");
        setTechPrefs([]);
        setTeamSize(1);
        setTimeline("4 weeks");
        setCustomTech("");
        setSavedProjectId(null);
        setActiveTab("understanding");

        localStorage.removeItem("ghostboard_architect_idea");
        localStorage.removeItem("ghostboard_architect_techPrefs");
        localStorage.removeItem("ghostboard_architect_teamSize");
        localStorage.removeItem("ghostboard_architect_timeline");
        localStorage.removeItem("ghostboard_architect_savedProjectId");
        localStorage.removeItem("ghostboard_architect_activeTab");
    };

    const handleDownloadTab = (text, filename) => {
        if (!text) return;
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const fallbackCopyText = (text, setCopiedState) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopiedState(true);
            setTimeout(() => setCopiedState(false), 2000);
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    };

    const handleCopyTab = (text, setCopiedState) => {
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    setCopiedState(true);
                    setTimeout(() => setCopiedState(false), 2000);
                })
                .catch((err) => {
                    console.error("Failed to copy using clipboard API, trying fallback", err);
                    fallbackCopyText(text, setCopiedState);
                });
        } else {
            fallbackCopyText(text, setCopiedState);
        }
    };

    const toggleTech = (tech) => {
        setTechPrefs((prev) => prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]);
    };

    const addCustomTech = () => {
        if (customTech.trim() && !techPrefs.includes(customTech)) {
            setTechPrefs((prev) => [...prev, customTech.trim()]);
            setCustomTech("");
        }
    };

    const { understanding, prompt1, prompt2, prompt3 } = parsePrompts(output);

    return (
        <div className="min-h-screen bg-[#0A0A0C]" data-testid="architect-page">
            <Navbar />
            <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 py-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-outfit text-2xl font-medium text-white">AI Project Architect</h1>
                            <p className="font-manrope text-sm text-zinc-400 font-light">Transform your project idea into optimized three-stage developer prompts</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Input Panel */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-4">
                        {/* Idea Input */}
                        <div className="p-5 rounded-2xl glass-card">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500">
                                    Project Idea
                                </label>
                                <button
                                    type="button"
                                    onClick={handleEnhance}
                                    disabled={!idea.trim() || isEnhancingIdea}
                                    data-testid="enhance-idea-btn"
                                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-all font-manrope disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isEnhancingIdea ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Enhancing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                                            Enhance with AI
                                        </>
                                    )}
                                </button>
                            </div>
                            <textarea value={idea} onChange={(e) => setIdea(e.target.value)}
                                data-testid="project-idea-input"
                                placeholder="Describe your project idea in detail. What problem does it solve? Who is it for? What are the key features?..."
                                rows={6}
                                className="input-glass resize-none text-sm leading-relaxed scrollbar-ghost" />
                            {enhanceError && (
                                <div className="mt-2 text-xs text-red-400 font-manrope">
                                    {enhanceError}
                                </div>
                            )}
                        </div>

                        {/* Tech Preferences */}
                        <div className="p-5 rounded-2xl glass-card">
                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-3">
                                Tech Preferences
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-ghost">
                                {techOptions.map((tech) => (
                                    <button key={tech} onClick={() => toggleTech(tech)} data-testid={`tech-option-${tech}`}
                                        className={`px-3 py-1 rounded-lg text-xs font-manrope transition-all duration-200 ${
                                            techPrefs.includes(tech)
                                                ? "bg-purple-500/20 border border-purple-500/40 text-purple-300"
                                                : "bg-white/[0.04] border border-white/[0.07] text-zinc-400 hover:text-white hover:bg-white/[0.07]"
                                        }`}>
                                        {tech}
                                    </button>
                                ))}
                            </div>
                            {/* Selected */}
                            {techPrefs.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {techPrefs.filter(t => !techOptions.includes(t)).map((tech) => (
                                        <span key={tech} className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 text-xs font-manrope">
                                            {tech}
                                            <button onClick={() => toggleTech(tech)}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input value={customTech} onChange={(e) => setCustomTech(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addCustomTech()}
                                    placeholder="Add custom tech..." data-testid="custom-tech-input"
                                    className="input-glass text-xs flex-1 py-2" />
                                <button onClick={addCustomTech} className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="p-5 rounded-2xl glass-card space-y-4">
                            <div>
                                <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Team Size: {teamSize}</label>
                                <input type="range" min="1" max="10" value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))}
                                    data-testid="team-size-slider"
                                    className="w-full accent-purple-500" />
                                <div className="flex justify-between text-xs text-zinc-600 font-manrope mt-1"><span>Solo</span><span>10</span></div>
                            </div>
                            <div>
                                <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Timeline</label>
                                <select value={timeline} onChange={(e) => setTimeline(e.target.value)}
                                    data-testid="timeline-select"
                                    className="input-glass text-sm py-2">
                                    {["1 week", "2 weeks", "4 weeks", "2 months", "3 months", "6 months"].map(t => (
                                        <option key={t} value={t} className="bg-[#0A0A0C]">{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button onClick={handleGenerate} disabled={!idea.trim() || isStreaming}
                            data-testid="generate-blueprint-btn"
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium font-manrope hover:brightness-110 hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isStreaming ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Compiling Prompts...</>
                            ) : (
                                <><Sparkles className="w-4 h-4" /> Compile Prompts</>
                            )}
                        </button>
                    </motion.div>

                    {/* Output Panel */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }} className="lg:col-span-3 flex flex-col">
                        <div className="flex-1 rounded-2xl glass-card flex flex-col min-h-[500px]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-white/[0.07] gap-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isStreaming ? "bg-green-400 animate-pulse" : output ? "bg-purple-400" : "bg-zinc-600"}`} />
                                    <span className="font-manrope text-xs text-zinc-400">
                                        {isStreaming ? "Generating Stage Prompts..." : output ? "Three-Stage Prompts Ready" : "Waiting for input"}
                                    </span>
                                </div>
                                {output && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleCopyTab(output, setCopiedAll)} data-testid="copy-all-btn"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white text-xs font-manrope transition-all">
                                            {copiedAll ? <><Check className="w-3 h-3 text-green-400" /> All Copied</> : <><Copy className="w-3 h-3" /> Copy All</>}
                                        </button>
                                        <button onClick={handleSave} disabled={saving || !!savedProjectId} data-testid="save-project-btn"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 text-xs font-manrope transition-all disabled:opacity-60">
                                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                            {savedProjectId ? "Saved!" : saving ? "Saving..." : "Save Project"}
                                        </button>
                                        <button onClick={handleClear} data-testid="clear-output-btn"
                                            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors">
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {output && (
                                <div className="flex border-b border-white/[0.07] px-4 bg-white/[0.01] overflow-x-auto scrollbar-none">
                                    <button onClick={() => setActiveTab("understanding")}
                                        className={`px-4 py-3 text-xs font-manrope font-semibold tracking-wider transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
                                            activeTab === "understanding" ? "border-purple-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                                        }`}>
                                        PROJECT UNDERSTANDING
                                    </button>
                                    <button onClick={() => setActiveTab("prompt1")}
                                        className={`px-4 py-3 text-xs font-manrope font-semibold tracking-wider transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
                                            activeTab === "prompt1" ? "border-purple-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                                        }`}>
                                        PROMPT 1: PLAN
                                    </button>
                                    <button onClick={() => setActiveTab("prompt2")}
                                        className={`px-4 py-3 text-xs font-manrope font-semibold tracking-wider transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
                                            activeTab === "prompt2" ? "border-purple-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                                        }`}>
                                        PROMPT 2: BUILD
                                    </button>
                                    <button onClick={() => setActiveTab("prompt3")}
                                        className={`px-4 py-3 text-xs font-manrope font-semibold tracking-wider transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
                                            activeTab === "prompt3" ? "border-purple-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                                        }`}>
                                        PROMPT 3: OPTIMIZE
                                    </button>
                                </div>
                            )}

                            <div ref={outputRef} className="flex-1 p-5 overflow-y-auto scrollbar-ghost" data-testid="blueprint-output">
                                {!output && !isStreaming && !error && (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-cyan-500/20 border border-purple-500/20 flex items-center justify-center mb-4">
                                            <Brain className="w-8 h-8 text-purple-400" />
                                        </div>
                                        <p className="font-outfit text-lg font-medium text-zinc-400 mb-2">Three-Stage Master Prompts</p>
                                        <p className="font-manrope text-sm text-zinc-600 max-w-sm font-light">
                                            Describe your project idea on the left, select technologies, and compile optimized prompts for Plan, Build, and Optimize stages.
                                        </p>
                                    </div>
                                )}
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-manrope" data-testid="architect-error">
                                        {error}
                                    </div>
                                )}
                                {output && (
                                    <div className="space-y-4">
                                        {activeTab === "understanding" && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl flex-wrap gap-3">
                                                    <div>
                                                        <span className="text-xs font-manrope font-semibold text-purple-300 uppercase tracking-wider">Project Concept & Requirement Verification</span>
                                                        <p className="text-[11px] text-zinc-500 font-manrope mt-0.5 font-light">Verify if the AI's understanding matches your expectations before copying prompts.</p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button onClick={() => handleCopyTab(understanding, setCopiedUnd)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 text-xs font-manrope transition-all font-medium">
                                                            {copiedUnd ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Summary</>}
                                                        </button>
                                                        <button onClick={() => handleDownloadTab(understanding, "project_understanding.md")}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 text-xs font-manrope transition-all font-medium">
                                                            <Download className="w-3.5 h-3.5" /> Download (.md)
                                                        </button>
                                                        <button onClick={handleSave} disabled={saving || !!savedProjectId}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 text-xs font-manrope transition-all font-medium disabled:opacity-60">
                                                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                            {savedProjectId ? "Saved!" : saving ? "Saving..." : "Save Project"}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-5 rounded-xl border border-white/[0.05] bg-black/20">
                                                    <MarkdownContent text={understanding || "Analyzing project concept..."} />
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === "prompt1" && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl flex-wrap gap-3">
                                                    <div>
                                                        <span className="text-xs font-manrope font-semibold text-purple-300 uppercase tracking-wider">Stage 1: Planning & Architecture Prompt</span>
                                                        <p className="text-[11px] text-zinc-500 font-manrope mt-0.5 font-light">Focuses on system architecture, database design, tech stack & roadmaps.</p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button onClick={() => handleCopyTab(prompt1, setCopied1)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 text-xs font-manrope transition-all font-medium">
                                                            {copied1 ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Prompt 1</>}
                                                        </button>
                                                        <button onClick={() => handleDownloadTab(prompt1, "prompt1_planning.txt")}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 text-xs font-manrope transition-all font-medium">
                                                            <Download className="w-3.5 h-3.5" /> Download (.txt)
                                                        </button>
                                                        <button onClick={handleSave} disabled={saving || !!savedProjectId}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 text-xs font-manrope transition-all font-medium disabled:opacity-60">
                                                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                            {savedProjectId ? "Saved!" : saving ? "Saving..." : "Save Project"}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-5 rounded-xl border border-white/[0.05] bg-black/20 font-mono text-zinc-400 text-xs whitespace-pre-wrap select-all selection:bg-purple-500/30 leading-relaxed max-h-[500px] overflow-y-auto scrollbar-ghost">
                                                    {prompt1 || "Generating planning instructions..."}
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === "prompt2" && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl flex-wrap gap-3">
                                                    <div>
                                                        <span className="text-xs font-manrope font-semibold text-cyan-300 uppercase tracking-wider">Stage 2: Code Implementation Prompt</span>
                                                        <p className="text-[11px] text-zinc-500 font-manrope mt-0.5 font-light">Focuses on build instructions, file structures, API code & error handling.</p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button onClick={() => handleCopyTab(prompt2, setCopied2)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 text-xs font-manrope transition-all font-medium">
                                                            {copied2 ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Prompt 2</>}
                                                        </button>
                                                        <button onClick={() => handleDownloadTab(prompt2, "prompt2_build.txt")}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 text-xs font-manrope transition-all font-medium">
                                                            <Download className="w-3.5 h-3.5" /> Download (.txt)
                                                        </button>
                                                        <button onClick={handleSave} disabled={saving || !!savedProjectId}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 text-xs font-manrope transition-all font-medium disabled:opacity-60">
                                                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                            {savedProjectId ? "Saved!" : saving ? "Saving..." : "Save Project"}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-5 rounded-xl border border-white/[0.05] bg-black/20 font-mono text-zinc-400 text-xs whitespace-pre-wrap select-all selection:bg-cyan-500/30 leading-relaxed max-h-[500px] overflow-y-auto scrollbar-ghost">
                                                    {prompt2 || (isStreaming ? "Awaiting stage generation..." : "Not generated yet. Run compilation.")}
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === "prompt3" && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl flex-wrap gap-3">
                                                    <div>
                                                        <span className="text-xs font-manrope font-semibold text-emerald-300 uppercase tracking-wider">Stage 3: Review, Optimization & Testing Prompt</span>
                                                        <p className="text-[11px] text-zinc-500 font-manrope mt-0.5 font-light">Focuses on security audits, performance profiling, Vitest/Jest test suites & production readiness.</p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button onClick={() => handleCopyTab(prompt3, setCopied3)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-xs font-manrope transition-all font-medium">
                                                            {copied3 ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Prompt 3</>}
                                                        </button>
                                                        <button onClick={() => handleDownloadTab(prompt3, "prompt3_optimize.txt")}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-xs font-manrope transition-all font-medium">
                                                            <Download className="w-3.5 h-3.5" /> Download (.txt)
                                                        </button>
                                                        <button onClick={handleSave} disabled={saving || !!savedProjectId}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-xs font-manrope transition-all font-medium disabled:opacity-60">
                                                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                            {savedProjectId ? "Saved!" : saving ? "Saving..." : "Save Project"}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-5 rounded-xl border border-white/[0.05] bg-black/20 font-mono text-zinc-400 text-xs whitespace-pre-wrap select-all selection:bg-emerald-500/30 leading-relaxed max-h-[500px] overflow-y-auto scrollbar-ghost">
                                                    {prompt3 || (isStreaming ? "Awaiting stage generation..." : "Not generated yet. Run compilation.")}
                                                </div>
                                            </div>
                                        )}
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
