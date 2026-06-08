import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Plus, Search, Trash2, FileText, Globe, Loader2, Upload, Sparkles, X } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { useAIStream } from "@/hooks/useAIStream";
import { useAuth } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const sourceTypes = [
    { id: "text", label: "Plain Text", icon: FileText },
    { id: "url", label: "URL / Link", icon: Globe },
    { id: "code", label: "Code / Docs", icon: Database },
];

function MarkdownContent({ text }) {
    const formatText = (raw) => {
        if (!raw) return "";
        return raw
            .replace(/^## (.+)$/gm, '<h2 class="font-outfit text-lg font-medium text-white mt-5 mb-2">$1</h2>')
            .replace(/^### (.+)$/gm, '<h3 class="font-outfit text-base font-medium text-violet-300 mt-3 mb-1">$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-medium">$1</strong>')
            .replace(/`(.+?)`/g, '<code class="font-jetbrains text-xs bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded">$1</code>')
            .replace(/^- (.+)$/gm, '<li class="text-zinc-300 ml-4 mb-1 list-disc">$1</li>')
            .replace(/\n\n/g, '<br/><br/>');
    };
    return <div className="font-manrope text-sm text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatText(text) }} />;
}

export default function RAGMemory() {
    const { getToken } = useAuth();
    const { output, isStreaming, error: streamError, stream, clear } = useAIStream();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ title: "", content: "", source_type: "text" });
    const [adding, setAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [aiQuery, setAiQuery] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const outputRef = useRef(null);

    const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

    const fetchDocs = async () => {
        try {
            const { data } = await axios.get(`${API}/memory`, { headers: authHeaders() });
            setDocs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocs(); }, []);

    useEffect(() => {
        if (outputRef.current && isStreaming) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }, [output, isStreaming]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!addForm.title.trim() || !addForm.content.trim()) return;
        setAdding(true);
        try {
            await axios.post(`${API}/memory`, addForm, { headers: authHeaders() });
            setAddForm({ title: "", content: "", source_type: "text" });
            setShowAdd(false);
            fetchDocs();
        } catch (err) {
            console.error(err);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await axios.delete(`${API}/memory/${id}`, { headers: authHeaders() });
            setDocs((prev) => prev.filter((d) => d.id !== id));
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const { data } = await axios.post(`${API}/memory/search`, { query: searchQuery, limit: 5 }, { headers: authHeaders() });
            setSearchResults(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAIQuery = async () => {
        if (!aiQuery.trim() || isStreaming) return;
        clear();
        await stream("/ai/query", { query: aiQuery });
    };

    return (
        <div className="min-h-screen bg-[#0A0A0C]" data-testid="memory-page">
            <Navbar />
            <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 py-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(167,139,250,0.3)]">
                                <Database className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-outfit text-2xl font-medium text-white">RAG Memory System</h1>
                                <p className="font-manrope text-sm text-zinc-400">Your AI-powered knowledge base · {docs.length} documents</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAdd(true)} data-testid="add-doc-btn"
                            className="btn-primary flex items-center gap-2 text-sm">
                            <Plus className="w-4 h-4" /> Add Document
                        </button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Documents list */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }} className="lg:col-span-2">
                        <div className="p-5 rounded-2xl glass-card h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="Search documents..." data-testid="search-input"
                                    className="input-glass text-sm flex-1 py-2" />
                                <button onClick={handleSearch} data-testid="search-btn"
                                    className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-all">
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>

                            {searchResults !== null && (
                                <div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                    <p className="text-xs font-manrope text-violet-300 mb-2">
                                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
                                    </p>
                                    <button onClick={() => setSearchResults(null)} className="text-xs text-zinc-500 hover:text-zinc-400 font-manrope">
                                        Clear search
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2 overflow-y-auto max-h-[500px] scrollbar-ghost" data-testid="docs-list">
                                {loading ? (
                                    [1, 2, 3].map((i) => (
                                        <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
                                    ))
                                ) : (searchResults || docs).length === 0 ? (
                                    <div className="py-16 text-center" data-testid="empty-docs">
                                        <Database className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                                        <p className="font-manrope text-sm text-zinc-600">
                                            {searchResults !== null ? "No matching documents" : "No documents yet"}
                                        </p>
                                        {searchResults === null && (
                                            <button onClick={() => setShowAdd(true)} className="mt-3 text-violet-400 text-sm font-manrope hover:text-violet-300 transition-colors">
                                                Add your first document
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    (searchResults || docs).map((doc, i) => (
                                        <motion.div key={doc.id} data-testid={`doc-item-${i}`}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <FileText className="w-3.5 h-3.5 text-violet-300" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-outfit font-medium text-white text-sm truncate">{doc.title}</p>
                                                <p className="font-manrope text-xs text-zinc-500 mt-0.5 line-clamp-2">{doc.content.slice(0, 100)}...</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-xs text-zinc-600 font-manrope">{doc.word_count || 0} words</span>
                                                    <span className="text-zinc-700">·</span>
                                                    <span className="text-xs text-zinc-600 font-manrope capitalize">{doc.source_type}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id}
                                                data-testid={`delete-doc-${doc.id}`}
                                                className="flex-shrink-0 p-1 rounded text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30">
                                                {deletingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* AI Query */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }} className="lg:col-span-3 flex flex-col gap-4">
                        <div className="p-5 rounded-2xl glass-card">
                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-3">Query Your Knowledge Base</label>
                            <textarea value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && handleAIQuery()}
                                placeholder="Ask a question based on your uploaded documents... e.g., 'What authentication method is recommended in my docs?'"
                                rows={3} data-testid="ai-query-input"
                                className="input-glass resize-none text-sm leading-relaxed scrollbar-ghost mb-3" />
                            <button onClick={handleAIQuery} disabled={!aiQuery.trim() || isStreaming || docs.length === 0}
                                data-testid="query-memory-btn"
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium font-manrope hover:brightness-110 transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                {isStreaming ? <><Loader2 className="w-4 h-4 animate-spin" /> Querying...</> : <><Sparkles className="w-4 h-4" /> Query Memory</>}
                            </button>
                            {docs.length === 0 && <p className="text-xs text-zinc-600 font-manrope mt-2">Add documents first to query your memory.</p>}
                        </div>

                        <div className="flex-1 rounded-2xl glass-card flex flex-col min-h-[350px]">
                            <div className="flex items-center justify-between p-4 border-b border-white/[0.07]">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isStreaming ? "bg-violet-400 animate-pulse" : output ? "bg-green-400" : "bg-zinc-600"}`} />
                                    <span className="font-manrope text-xs text-zinc-400">
                                        {isStreaming ? "Searching memory..." : output ? "AI Response" : "Awaiting query"}
                                    </span>
                                </div>
                                {output && (
                                    <button onClick={clear} className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div ref={outputRef} className="flex-1 p-5 overflow-y-auto scrollbar-ghost" data-testid="rag-output">
                                {!output && !isStreaming && !streamError && (
                                    <div className="h-full flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center mb-4">
                                            <Database className="w-8 h-8 text-violet-400" />
                                        </div>
                                        <p className="font-outfit text-lg font-medium text-zinc-400 mb-2">Query Your Knowledge Base</p>
                                        <p className="font-manrope text-sm text-zinc-600 max-w-xs">
                                            Upload documents, then ask questions. The AI will answer based on your specific content.
                                        </p>
                                    </div>
                                )}
                                {streamError && (
                                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-manrope" data-testid="rag-error">
                                        {streamError}
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

            {/* Add Document Modal */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
                        data-testid="add-doc-modal">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg p-6 rounded-2xl bg-[#0F0F12] border border-white/[0.1] shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-outfit text-lg font-medium text-white">Add to Memory</h3>
                                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Title</label>
                                    <input value={addForm.title} onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))}
                                        placeholder="Document title" required data-testid="doc-title-input"
                                        className="input-glass" />
                                </div>
                                <div>
                                    <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Type</label>
                                    <div className="flex gap-2">
                                        {sourceTypes.map((t) => (
                                            <button key={t.id} type="button" onClick={() => setAddForm((p) => ({ ...p, source_type: t.id }))}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-manrope transition-all ${
                                                    addForm.source_type === t.id
                                                        ? "bg-violet-500/20 border border-violet-500/40 text-violet-300"
                                                        : "bg-white/[0.04] border border-white/[0.07] text-zinc-400 hover:text-white"
                                                }`}>
                                                <t.icon className="w-3.5 h-3.5" />
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Content</label>
                                    <textarea value={addForm.content} onChange={(e) => setAddForm((p) => ({ ...p, content: e.target.value }))}
                                        placeholder="Paste your document content, code, notes, or any text you want the AI to remember..."
                                        rows={6} required data-testid="doc-content-input"
                                        className="input-glass resize-none text-sm scrollbar-ghost" />
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => setShowAdd(false)}
                                        className="flex-1 py-2.5 rounded-xl btn-secondary text-sm">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={adding} data-testid="save-doc-btn"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium font-manrope hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        {adding ? "Saving..." : "Add to Memory"}
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
