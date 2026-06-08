import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Database, Plus, Search, Trash2, FileText, Globe, Code2, Loader2,
    Upload, Sparkles, X, ChevronDown, ChevronUp, Copy, Check, Brain
} from "lucide-react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { useAIStream } from "@/hooks/useAIStream";
import { useAuth } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SOURCE_CONFIG = {
    text: {
        label: "Text", Icon: FileText,
        border: "border-l-violet-500",
        iconBg: "bg-violet-500/15", iconColor: "text-violet-400",
        badge: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    },
    url: {
        label: "URL", Icon: Globe,
        border: "border-l-cyan-500",
        iconBg: "bg-cyan-500/15", iconColor: "text-cyan-400",
        badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    },
    code: {
        label: "Code", Icon: Code2,
        border: "border-l-amber-500",
        iconBg: "bg-amber-500/15", iconColor: "text-amber-400",
        badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
};

// ─── Markdown renderer ───────────────────────────────────────────────────────

function MarkdownContent({ text }) {
    const html = useMemo(() => {
        if (!text) return "";
        return text
            .replace(/^## (.+)$/gm, '<h2 class="font-outfit text-base font-semibold text-white mt-5 mb-2">$1</h2>')
            .replace(/^### (.+)$/gm, '<h3 class="font-outfit text-sm font-medium text-violet-300 mt-3 mb-1">$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
            .replace(/`([^`\n]+)`/g, '<code class="font-jetbrains text-xs bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded">$1</code>')
            .replace(/^- (.+)$/gm, '<li class="text-zinc-300 ml-4 mb-0.5 list-disc text-sm">$1</li>')
            .replace(/^---$/gm, '<hr class="border-white/10 my-4"/>')
            .replace(/\n\n/g, '</p><p class="mb-2">');
    }, [text]);
    return (
        <div
            className="font-manrope text-sm text-zinc-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${html}</p>` }}
        />
    );
}

// ─── Document card ───────────────────────────────────────────────────────────

function DocCard({ doc, expanded, onToggle, onDelete, deletingId }) {
    const cfg = SOURCE_CONFIG[doc.source_type] || SOURCE_CONFIG.text;
    const [copied, setCopied] = useState(false);
    const isDeleting = deletingId === doc.id;

    const copyContent = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(doc.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            data-testid={`doc-card-${doc.id}`}
            className={`rounded-xl border border-l-2 ${cfg.border} border-white/[0.06] bg-white/[0.025] overflow-hidden hover:border-white/[0.12] transition-colors duration-200`}
        >
            {/* Row */}
            <div className="flex items-center gap-3 p-3.5 cursor-pointer select-none" onClick={onToggle}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                    <cfg.Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-outfit text-sm font-medium text-white truncate">{doc.title}</p>
                    <p className="text-xs text-zinc-600 font-manrope mt-0.5">
                        {(doc.word_count || 0).toLocaleString()}w · {doc.source_type}
                    </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                        disabled={isDeleting}
                        data-testid={`delete-doc-${doc.id}`}
                        className="p-1.5 rounded text-zinc-700 hover:text-red-400 transition-colors disabled:opacity-30"
                    >
                        {isDeleting
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />}
                    </button>
                    {expanded
                        ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
                        : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
                </div>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3.5 pb-3.5 border-t border-white/[0.05]">
                            <div className="relative mt-3">
                                <div
                                    className={`text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap break-words max-h-44 overflow-y-auto scrollbar-ghost p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] ${
                                        doc.source_type === "code" ? "font-jetbrains" : "font-manrope"
                                    }`}
                                >
                                    {doc.content}
                                </div>
                                <button
                                    onClick={copyContent}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#0A0A0C]/80 hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-all"
                                >
                                    {copied
                                        ? <Check className="w-3 h-3 text-green-400" />
                                        : <Copy className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RAGMemory() {
    const { getToken } = useAuth();
    const { output, isStreaming, error: streamError, stream, clear } = useAIStream();

    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Add doc modal
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ title: "", content: "", source_type: "text" });
    const [adding, setAdding] = useState(false);

    // Query panel
    const [aiQuery, setAiQuery] = useState("");
    const [contextDocs, setContextDocs] = useState([]);
    const [submittedDocs, setSubmittedDocs] = useState([]);
    const [responseCopied, setResponseCopied] = useState(false);
    const outputRef = useRef(null);
    const previewTimerRef = useRef(null);

    const authHeaders = useCallback(() => ({ Authorization: `Bearer ${getToken()}` }), [getToken]);

    const fetchDocs = useCallback(() => {
        axios.get(`${API}/memory`, { headers: authHeaders() })
            .then(({ data }) => setDocs(data))
            .catch((e) => console.error("fetchDocs error:", e))
            .finally(() => setLoading(false));
    }, [authHeaders]);

    useEffect(() => { fetchDocs(); }, [fetchDocs]);

    // Auto-scroll response
    useEffect(() => {
        if (outputRef.current && isStreaming) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output, isStreaming]);

    // Debounced pre-query context preview (via onChange, avoids useEffect async pattern)
    const handleQueryChange = (e) => {
        const value = e.target.value;
        setAiQuery(value);
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        if (!value.trim() || docs.length === 0) { setContextDocs([]); return; }
        previewTimerRef.current = setTimeout(() => {
            axios
                .post(`${API}/memory/context`, { query: value, limit: 3 }, { headers: authHeaders() })
                .then(({ data }) => setContextDocs(data.docs || []))
                .catch(() => setContextDocs([]));
        }, 350);
    };

    // Derived state
    const visibleDocs = useMemo(() => {
        const base = searchResults !== null ? searchResults : docs;
        return typeFilter === "all" ? base : base.filter((d) => d.source_type === typeFilter);
    }, [docs, searchResults, typeFilter]);

    const stats = useMemo(() => ({
        total: docs.length,
        totalWords: docs.reduce((s, d) => s + (d.word_count || 0), 0),
        byType: {
            text: docs.filter((d) => d.source_type === "text").length,
            url: docs.filter((d) => d.source_type === "url").length,
            code: docs.filter((d) => d.source_type === "code").length,
        },
    }), [docs]);

    // Handlers
    const handleSearch = async () => {
        if (!searchQuery.trim()) { setSearchResults(null); return; }
        try {
            const { data } = await axios.post(
                `${API}/memory/search`,
                { query: searchQuery, limit: 20 },
                { headers: authHeaders() }
            );
            setSearchResults(data);
        } catch (e) {
            console.error("search error:", e);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await axios.delete(`${API}/memory/${id}`, { headers: authHeaders() });
            setDocs((p) => p.filter((d) => d.id !== id));
            if (expandedId === id) setExpandedId(null);
        } catch (e) {
            console.error("delete error:", e);
        } finally {
            setDeletingId(null);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!addForm.title.trim() || !addForm.content.trim()) return;
        setAdding(true);
        try {
            await axios.post(`${API}/memory`, addForm, { headers: authHeaders() });
            setAddForm({ title: "", content: "", source_type: "text" });
            setShowAdd(false);
            fetchDocs();
        } catch (e) {
            console.error("add doc error:", e);
        } finally {
            setAdding(false);
        }
    };

    const closeAddModal = () => {
        setShowAdd(false);
        setAddForm({ title: "", content: "", source_type: "text" });
    };

    const handleAIQuery = async () => {
        if (!aiQuery.trim() || isStreaming || docs.length === 0) return;
        setSubmittedDocs(contextDocs);
        clear();
        await stream("/ai/query", { query: aiQuery });
    };

    const copyResponse = () => {
        navigator.clipboard.writeText(output);
        setResponseCopied(true);
        setTimeout(() => setResponseCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#0A0A0C]" data-testid="memory-page">
            <Navbar />
            <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* ─── Header ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6 flex-wrap gap-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(167,139,250,0.3)]">
                            <Database className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-outfit text-2xl font-medium text-white">RAG Memory</h1>
                            <p className="font-manrope text-sm text-zinc-400">
                                {stats.total} doc{stats.total !== 1 ? "s" : ""} · {stats.totalWords.toLocaleString()} words indexed
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {stats.total > 0 && (
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                {Object.entries(stats.byType)
                                    .filter(([, v]) => v > 0)
                                    .map(([type, count]) => {
                                        const cfg = SOURCE_CONFIG[type];
                                        return (
                                            <span key={type} className={`text-xs font-manrope px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                                                {count} {cfg.label}
                                            </span>
                                        );
                                    })}
                            </div>
                        )}
                        <button
                            onClick={() => setShowAdd(true)}
                            data-testid="add-doc-btn"
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium font-manrope text-sm hover:brightness-110 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Document
                        </button>
                    </div>
                </motion.div>

                {/* ─── Main Grid ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                    {/* Left: Document Library */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                        className="lg:col-span-2 flex flex-col gap-3"
                    >
                        {/* Search bar */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="Search documents..."
                                    data-testid="search-input"
                                    className="input-glass text-sm pl-9 py-2.5"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                data-testid="search-btn"
                                className="px-3.5 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 hover:bg-violet-500/25 transition-all text-sm font-manrope"
                            >
                                Go
                            </button>
                            {searchResults !== null && (
                                <button
                                    onClick={() => { setSearchResults(null); setSearchQuery(""); }}
                                    data-testid="clear-search-btn"
                                    className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Type filter tabs */}
                        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                            {[
                                { id: "all", label: `All (${stats.total})` },
                                ...Object.entries(SOURCE_CONFIG).map(([id, cfg]) => ({
                                    id,
                                    label: `${cfg.label} (${stats.byType[id] || 0})`,
                                })),
                            ].map(({ id, label }) => (
                                <button
                                    key={id}
                                    onClick={() => setTypeFilter(id)}
                                    data-testid={`filter-${id}`}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-manrope transition-all ${
                                        typeFilter === id
                                            ? "bg-white/[0.08] text-white"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Search result banner */}
                        {searchResults !== null && (
                            <div className="px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                <p className="text-xs font-manrope text-violet-300">
                                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
                                </p>
                            </div>
                        )}

                        {/* Doc list */}
                        <div
                            className="space-y-2 overflow-y-auto max-h-[500px] scrollbar-ghost pr-0.5"
                            data-testid="docs-list"
                        >
                            {loading ? (
                                [1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
                                ))
                            ) : visibleDocs.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="py-14 text-center" data-testid="empty-docs"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/15 flex items-center justify-center mx-auto mb-4">
                                        <Database className="w-6 h-6 text-violet-500/50" />
                                    </div>
                                    <p className="font-manrope text-sm text-zinc-600">
                                        {searchResults !== null ? "No matching documents" : "No documents yet"}
                                    </p>
                                    {searchResults === null && (
                                        <button
                                            onClick={() => setShowAdd(true)}
                                            className="mt-3 text-violet-400 text-xs font-manrope hover:text-violet-300 transition-colors"
                                        >
                                            Add your first document →
                                        </button>
                                    )}
                                </motion.div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {visibleDocs.map((doc) => (
                                        <DocCard
                                            key={doc.id}
                                            doc={doc}
                                            expanded={expandedId === doc.id}
                                            onToggle={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                                            onDelete={handleDelete}
                                            deletingId={deletingId}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>

                    {/* Right: Query Console */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                        className="lg:col-span-3 flex flex-col gap-4"
                    >
                        {/* Query input */}
                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                            <div className="flex items-center gap-2 mb-3">
                                <Brain className="w-4 h-4 text-violet-400" />
                                <span className="font-outfit text-sm font-medium text-white">Query Your Knowledge Base</span>
                            </div>

                            <textarea
                                value={aiQuery}
                                onChange={handleQueryChange}
                                onKeyDown={(e) => e.ctrlKey && e.key === "Enter" && handleAIQuery()}
                                placeholder="Ask anything about your uploaded documents... e.g. 'What authentication method is recommended?'"
                                rows={3}
                                data-testid="ai-query-input"
                                className="input-glass resize-none text-sm leading-relaxed scrollbar-ghost mb-3"
                            />

                            {/* Pre-query context preview */}
                            <AnimatePresence>
                                {contextDocs.length > 0 && !isStreaming && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden mb-3"
                                    >
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs text-zinc-600 font-manrope">Will reference:</span>
                                            {contextDocs.map((d) => {
                                                const cfg = SOURCE_CONFIG[d.source_type] || SOURCE_CONFIG.text;
                                                return (
                                                    <span
                                                        key={d.id}
                                                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-manrope border ${cfg.badge}`}
                                                    >
                                                        <cfg.Icon className="w-2.5 h-2.5" />
                                                        {d.title.length > 28 ? d.title.slice(0, 28) + "…" : d.title}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-zinc-700 font-manrope">
                                    {docs.length === 0 ? "Add documents first to query" : "Ctrl+Enter to submit"}
                                </p>
                                <button
                                    onClick={handleAIQuery}
                                    disabled={!aiQuery.trim() || isStreaming || docs.length === 0}
                                    data-testid="query-memory-btn"
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium font-manrope text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isStreaming
                                        ? <><Loader2 className="w-4 h-4 animate-spin" />Querying...</>
                                        : <><Sparkles className="w-4 h-4" />Query Memory</>}
                                </button>
                            </div>
                        </div>

                        {/* Response panel */}
                        <div className="flex-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col min-h-[380px]">
                            {/* Panel header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                                        isStreaming ? "bg-violet-400 animate-pulse" : output ? "bg-green-400" : "bg-zinc-700"
                                    }`} />
                                    <span className="font-manrope text-xs text-zinc-400">
                                        {isStreaming
                                            ? "Searching memory & generating..."
                                            : output ? "AI Response" : "Awaiting query"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {output && !isStreaming && (
                                        <button
                                            onClick={copyResponse}
                                            data-testid="copy-response-btn"
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 transition-all text-xs font-manrope"
                                        >
                                            {responseCopied
                                                ? <><Check className="w-3 h-3 text-green-400" />Copied</>
                                                : <><Copy className="w-3 h-3" />Copy</>}
                                        </button>
                                    )}
                                    {output && (
                                        <button
                                            onClick={clear}
                                            data-testid="clear-response-btn"
                                            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Panel body */}
                            <div ref={outputRef} className="flex-1 p-5 overflow-y-auto scrollbar-ghost" data-testid="rag-output">
                                {!output && !isStreaming && !streamError && (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                        <motion.div
                                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/15 flex items-center justify-center mb-4"
                                            animate={{ scale: [1, 1.04, 1] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <Database className="w-7 h-7 text-violet-400/60" />
                                        </motion.div>
                                        <p className="font-outfit text-base font-medium text-zinc-500 mb-2">Ready to Query</p>
                                        <p className="font-manrope text-sm text-zinc-700 max-w-xs leading-relaxed">
                                            {docs.length === 0
                                                ? "Add documents to your memory bank, then ask questions grounded in your content."
                                                : `${stats.total} document${stats.total !== 1 ? "s" : ""} indexed. Ask anything.`}
                                        </p>
                                    </div>
                                )}

                                {streamError && (
                                    <div
                                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-manrope"
                                        data-testid="rag-error"
                                    >
                                        {streamError}
                                    </div>
                                )}

                                {(output || isStreaming) && (
                                    <div>
                                        <MarkdownContent text={output} />
                                        {isStreaming && (
                                            <span className="inline-block w-1.5 h-4 bg-violet-400 rounded-sm ml-0.5 animate-pulse" />
                                        )}

                                        {/* Sources consulted (shown after streaming completes) */}
                                        {!isStreaming && submittedDocs.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="mt-5 pt-4 border-t border-white/[0.07]"
                                            >
                                                <p className="text-xs font-manrope text-zinc-600 mb-2">Documents consulted</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {submittedDocs.map((d) => {
                                                        const cfg = SOURCE_CONFIG[d.source_type] || SOURCE_CONFIG.text;
                                                        return (
                                                            <span
                                                                key={d.id}
                                                                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-manrope border ${cfg.badge}`}
                                                            >
                                                                <cfg.Icon className="w-2.5 h-2.5" />
                                                                {d.title.length > 32 ? d.title.slice(0, 32) + "…" : d.title}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* ─── Add Document Modal ─── */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && closeAddModal()}
                        data-testid="add-doc-modal"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="w-full max-w-lg p-6 rounded-2xl bg-[#0F0F12] border border-white/[0.1] shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-outfit text-lg font-medium text-white">Add to Memory</h3>
                                <button
                                    onClick={closeAddModal}
                                    data-testid="close-add-modal"
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Title</label>
                                    <input
                                        value={addForm.title}
                                        onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g. Auth Architecture, API Spec, Tech Notes..."
                                        required data-testid="doc-title-input"
                                        className="input-glass"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Type</label>
                                    <div className="flex gap-2">
                                        {Object.entries(SOURCE_CONFIG).map(([id, cfg]) => (
                                            <button
                                                key={id} type="button"
                                                onClick={() => setAddForm((p) => ({ ...p, source_type: id }))}
                                                data-testid={`type-${id}`}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-manrope transition-all border ${
                                                    addForm.source_type === id
                                                        ? cfg.badge
                                                        : "bg-white/[0.04] border-white/[0.07] text-zinc-400 hover:text-white"
                                                }`}
                                            >
                                                <cfg.Icon className="w-3.5 h-3.5" />
                                                {cfg.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500">Content</label>
                                        <span className="text-[10px] font-manrope text-zinc-600">
                                            {addForm.content.length.toLocaleString()} chars
                                        </span>
                                    </div>
                                    <textarea
                                        value={addForm.content}
                                        onChange={(e) => setAddForm((p) => ({ ...p, content: e.target.value }))}
                                        placeholder="Paste document content, code snippets, notes, or any text you want the AI to remember..."
                                        rows={7} required
                                        data-testid="doc-content-input"
                                        className={`input-glass resize-none text-sm scrollbar-ghost ${
                                            addForm.source_type === "code" ? "font-jetbrains" : ""
                                        }`}
                                    />
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={closeAddModal} className="flex-1 py-2.5 rounded-xl btn-secondary text-sm">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit" disabled={adding}
                                        data-testid="save-doc-btn"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium font-manrope text-sm hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {adding
                                            ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                                            : <><Upload className="w-4 h-4" />Add to Memory</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
