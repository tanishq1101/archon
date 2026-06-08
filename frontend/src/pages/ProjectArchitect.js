import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Save, RefreshCw, ChevronDown, Copy, Check, Plus, X, Loader2 } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { useAIStream } from "@/hooks/useAIStream";
import { useAuth } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const techOptions = ["React", "Next.js", "Vue.js", "Node.js", "FastAPI", "Django", "PostgreSQL", "MongoDB", "Redis", "Docker", "AWS", "Vercel", "TypeScript", "Python", "Go", "Rust"];

function MarkdownContent({ text }) {
    const formatText = (raw) => {
        if (!raw) return "";
        return raw
            .replace(/^## (.+)$/gm, '<h2 class="font-outfit text-lg font-medium text-white mt-6 mb-2 border-b border-white/10 pb-2">$1</h2>')
            .replace(/^### (.+)$/gm, '<h3 class="font-outfit text-base font-medium text-purple-300 mt-4 mb-1.5">$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-medium">$1</strong>')
            .replace(/`(.+?)`/g, '<code class="font-jetbrains text-xs bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded">$1</code>')
            .replace(/^- (.+)$/gm, '<li class="text-zinc-300 ml-4 mb-1 list-disc">$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li class="text-zinc-300 ml-4 mb-1 list-decimal">$1</li>')
            .replace(/\n\n/g, '<br/><br/>');
    };

    return (
        <div className="font-manrope text-sm text-zinc-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatText(text) }} />
    );
}

export default function ProjectArchitect() {
    const { getToken } = useAuth();
    const { output, isStreaming, error, stream, clear } = useAIStream();
    const [idea, setIdea] = useState("");
    const [techPrefs, setTechPrefs] = useState([]);
    const [teamSize, setTeamSize] = useState(1);
    const [timeline, setTimeline] = useState("4 weeks");
    const [customTech, setCustomTech] = useState("");
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedProjectId, setSavedProjectId] = useState(null);
    const outputRef = useRef(null);

    useEffect(() => {
        if (outputRef.current && isStreaming) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output, isStreaming]);

    const handleGenerate = async () => {
        if (!idea.trim() || isStreaming) return;
        clear();
        await stream("/ai/architect", { idea, tech_preferences: techPrefs, team_size: teamSize, timeline });
    };

    const handleSave = async () => {
        if (!output || saving) return;
        setSaving(true);
        try {
            const token = getToken();
            const { data } = await axios.post(`${API}/projects`, {
                title: idea.slice(0, 60) || "Untitled Project",
                description: idea,
                idea,
                tech_stack: techPrefs,
            }, { headers: { Authorization: `Bearer ${token}` } });
            if (data?.ai_blueprint !== undefined) {
                await axios.put(`${API}/projects/${data.id}`, { ai_blueprint: output }, { headers: { Authorization: `Bearer ${token}` } });
            }
            setSavedProjectId(data.id);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                            <p className="font-manrope text-sm text-zinc-400">Transform your idea into a complete project blueprint</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Input Panel */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-4">
                        {/* Idea Input */}
                        <div className="p-5 rounded-2xl glass-card">
                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-3">
                                Project Idea
                            </label>
                            <textarea value={idea} onChange={(e) => setIdea(e.target.value)}
                                data-testid="project-idea-input"
                                placeholder="Describe your project idea in detail. What problem does it solve? Who is it for? What are the key features?..."
                                rows={6}
                                className="input-glass resize-none text-sm leading-relaxed scrollbar-ghost" />
                        </div>

                        {/* Tech Preferences */}
                        <div className="p-5 rounded-2xl glass-card">
                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-3">
                                Tech Preferences
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
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
                                <><Loader2 className="w-4 h-4 animate-spin" /> Generating Blueprint...</>
                            ) : (
                                <><Sparkles className="w-4 h-4" /> Generate Blueprint</>
                            )}
                        </button>
                    </motion.div>

                    {/* Output Panel */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }} className="lg:col-span-3 flex flex-col">
                        <div className="flex-1 rounded-2xl glass-card flex flex-col min-h-[500px]">
                            <div className="flex items-center justify-between p-4 border-b border-white/[0.07]">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isStreaming ? "bg-green-400 animate-pulse" : output ? "bg-purple-400" : "bg-zinc-600"}`} />
                                    <span className="font-manrope text-xs text-zinc-400">
                                        {isStreaming ? "Generating..." : output ? "Blueprint ready" : "Waiting for input"}
                                    </span>
                                </div>
                                {output && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleCopy} data-testid="copy-blueprint-btn"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-white text-xs font-manrope transition-all">
                                            {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                        </button>
                                        <button onClick={handleSave} disabled={saving || !!savedProjectId} data-testid="save-project-btn"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 text-xs font-manrope transition-all disabled:opacity-60">
                                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                            {savedProjectId ? "Saved!" : saving ? "Saving..." : "Save Project"}
                                        </button>
                                        <button onClick={clear} data-testid="clear-output-btn"
                                            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors">
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div ref={outputRef} className="flex-1 p-5 overflow-y-auto scrollbar-ghost" data-testid="blueprint-output">
                                {!output && !isStreaming && !error && (
                                    <div className="h-full flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-cyan-500/20 border border-purple-500/20 flex items-center justify-center mb-4">
                                            <Brain className="w-8 h-8 text-purple-400" />
                                        </div>
                                        <p className="font-outfit text-lg font-medium text-zinc-400 mb-2">Your Blueprint Will Appear Here</p>
                                        <p className="font-manrope text-sm text-zinc-600 max-w-xs">
                                            Describe your project idea on the left, then click Generate Blueprint.
                                        </p>
                                    </div>
                                )}
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-manrope" data-testid="architect-error">
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
