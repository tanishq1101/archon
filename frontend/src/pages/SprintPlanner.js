import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Layers, Sparkles, Plus, Loader2, Brain, GripVertical,
    Zap, Eye, CheckCircle2, Trash2, X, ChevronDown, ChevronUp,
    BarChart2, Circle, Flag
} from "lucide-react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ========== CONSTANTS ==========

const COLUMNS = [
    { id: "todo", label: "Backlog", Icon: Circle, dotClass: "bg-zinc-500", headerClass: "text-zinc-300 border-zinc-700/50", colClass: "border-zinc-700/30" },
    { id: "in_progress", label: "In Progress", Icon: Zap, dotClass: "bg-blue-400 animate-pulse", headerClass: "text-blue-300 border-blue-700/40", colClass: "border-blue-700/20" },
    { id: "review", label: "In Review", Icon: Eye, dotClass: "bg-amber-400", headerClass: "text-amber-300 border-amber-700/40", colClass: "border-amber-700/20" },
    { id: "done", label: "Done", Icon: CheckCircle2, dotClass: "bg-green-400", headerClass: "text-green-300 border-green-700/40", colClass: "border-green-700/20" },
];

const PRIORITY = {
    critical: { label: "Critical", badge: "bg-rose-500/15 text-rose-400 border border-rose-500/30", bar: "bg-rose-500", border: "border-l-rose-500" },
    high: { label: "High", badge: "bg-orange-500/15 text-orange-400 border border-orange-500/30", bar: "bg-orange-400", border: "border-l-orange-400" },
    medium: { label: "Medium", badge: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30", bar: "bg-yellow-400", border: "border-l-yellow-500" },
    low: { label: "Low", badge: "bg-zinc-500/15 text-zinc-400 border border-zinc-600/30", bar: "bg-zinc-500", border: "border-l-zinc-600" },
};

const TYPE = {
    feature: { label: "Feature", cls: "bg-purple-500/15 text-purple-300" },
    bug: { label: "Bug", cls: "bg-red-500/15 text-red-400" },
    chore: { label: "Chore", cls: "bg-zinc-500/15 text-zinc-400" },
    research: { label: "Research", cls: "bg-cyan-500/15 text-cyan-300" },
};

// ========== TASK CARD ==========

function TaskCard({ task, onDelete, onDragStart, onDragEnd }) {
    const p = PRIORITY[task.priority] || PRIORITY.medium;
    const t = TYPE[task.type] || TYPE.feature;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            data-testid={`task-card-${task.id}`}
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragEnd={onDragEnd}
            className={`group relative p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07] border-l-2 ${p.border} hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-200 cursor-grab active:cursor-grabbing active:opacity-50 select-none`}
            whileHover={{ y: -1 }}
        >
            {/* Badges row */}
            <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-manrope ${t.cls}`}>{t.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-manrope ${p.badge}`}>{p.label}</span>
                <button onClick={() => onDelete(task.id)} data-testid={`delete-task-${task.id}`}
                    className="ml-auto p-0.5 rounded text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-150">
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

            {/* Title */}
            <p className="font-outfit text-sm font-medium text-white leading-snug mb-1.5">{task.title}</p>

            {/* Description */}
            {task.description && (
                <p className="font-manrope text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-2.5">{task.description}</p>
            )}

            {/* Footer */}
            <div className="flex items-center gap-1.5 mt-1">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.07]">
                    <span className="text-[10px] text-zinc-400 font-jetbrains">{task.story_points}pt</span>
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/[0.1] border border-purple-500/20">
                    <span className="text-[10px] text-purple-400 font-manrope">S{task.sprint}</span>
                </span>
                <GripVertical className="ml-auto w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </motion.div>
    );
}

// ========== KANBAN COLUMN ==========

function KanbanColumn({ col, tasks, isDragOver, onDragOver, onDragLeave, onDrop, onDelete, onDragStart, onDragEnd }) {
    const totalPts = tasks.reduce((s, t) => s + (t.story_points || 0), 0);
    const isEmpty = tasks.length === 0;

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); onDragOver(col.id); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) onDragLeave(); }}
            onDrop={(e) => { e.preventDefault(); onDrop(col.id); }}
            className={`flex flex-col rounded-2xl border transition-all duration-200 ${col.colClass} ${isDragOver ? "bg-purple-500/[0.06] ring-1 ring-purple-500/30 border-purple-500/30" : "bg-white/[0.02]"}`}
            data-testid={`column-${col.id}`}
        >
            {/* Column Header */}
            <div className={`flex items-center gap-2.5 px-4 py-3 border-b ${col.colClass}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dotClass}`} />
                <span className={`font-outfit text-sm font-medium ${col.headerClass}`}>{col.label}</span>
                <div className="ml-auto flex items-center gap-2">
                    {totalPts > 0 && <span className="text-[10px] text-zinc-600 font-manrope">{totalPts}pts</span>}
                    <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] font-manrope text-zinc-400">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Task list */}
            <div className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-ghost min-h-[280px] max-h-[60vh]">
                <AnimatePresence mode="popLayout">
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onDelete={onDelete}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                        />
                    ))}
                </AnimatePresence>

                {/* Drop zone hint */}
                <AnimatePresence>
                    {isDragOver && !isEmpty && (
                        <motion.div initial={{ opacity: 0, scaleY: 0.5 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0 }}
                            className="h-12 rounded-xl border-2 border-dashed border-purple-500/40 bg-purple-500/5 flex items-center justify-center">
                            <span className="text-xs text-purple-400/60 font-manrope">Drop here</span>
                        </motion.div>
                    )}
                    {isDragOver && isEmpty && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="h-24 rounded-xl border-2 border-dashed border-purple-500/40 bg-purple-500/5 flex items-center justify-center">
                            <span className="text-xs text-purple-400 font-manrope">Drop here</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isEmpty && !isDragOver && (
                    <div className="h-24 flex items-center justify-center opacity-30">
                        <p className="text-xs text-zinc-600 font-manrope">No tasks</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ========== MAIN PAGE ==========

export default function SprintPlanner() {
    const { getToken } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState("");
    const [showGenerate, setShowGenerate] = useState(false);
    const [showAddTask, setShowAddTask] = useState(false);
    const [activeSprint, setActiveSprint] = useState("all");
    const [draggedId, setDraggedId] = useState(null);
    const [draggedOver, setDraggedOver] = useState(null);

    const [genForm, setGenForm] = useState({ idea: "", team_size: 2, num_sprints: 3, sprint_duration: "2 weeks" });
    const [addForm, setAddForm] = useState({ title: "", description: "", priority: "medium", story_points: 3, sprint: 1, type: "feature" });

    const authHeaders = useCallback(() => ({ Authorization: `Bearer ${getToken()}` }), [getToken]);

    useEffect(() => {
        axios.get(`${API}/tasks`, { headers: authHeaders() })
            .then(({ data }) => setTasks(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [authHeaders]);

    // Derived state
    const sprints = [...new Set(tasks.map((t) => t.sprint))].sort((a, b) => a - b);
    const filtered = activeSprint === "all" ? tasks : tasks.filter((t) => t.sprint === Number(activeSprint));
    const getColTasks = (status) => filtered.filter((t) => t.status === status);

    const totalPts = tasks.reduce((s, t) => s + (t.story_points || 0), 0);
    const donePts = tasks.filter((t) => t.status === "done").reduce((s, t) => s + (t.story_points || 0), 0);
    const progress = totalPts > 0 ? Math.round((donePts / totalPts) * 100) : 0;

    // Handlers
    const handleGenerateSprint = async (e) => {
        e.preventDefault();
        if (!genForm.idea.trim() || generating) return;
        setGenerating(true);
        setGenError("");
        try {
            const { data } = await axios.post(`${API}/ai/sprint`, genForm, { headers: authHeaders() });
            setTasks((prev) => [...prev, ...data.tasks]);
            setShowGenerate(false);
            setGenForm((p) => ({ ...p, idea: "" }));
        } catch (err) {
            setGenError(err.response?.data?.detail || "Generation failed. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleDragStart = useCallback((e, taskId) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("taskId", taskId);
        setDraggedId(taskId);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedId(null);
        setDraggedOver(null);
    }, []);

    const handleDrop = useCallback(async (newStatus) => {
        if (!draggedId) return;
        const task = tasks.find((t) => t.id === draggedId);
        if (!task || task.status === newStatus) { setDraggedId(null); return; }

        setTasks((prev) => prev.map((t) => (t.id === draggedId ? { ...t, status: newStatus } : t)));
        setDraggedId(null);

        try {
            await axios.put(`${API}/tasks/${draggedId}`, { status: newStatus }, { headers: authHeaders() });
        } catch {
            setTasks((prev) => prev.map((t) => (t.id === draggedId ? { ...t, status: task.status } : t)));
        }
    }, [draggedId, tasks, authHeaders]);

    const handleDeleteTask = useCallback(async (taskId) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        try { await axios.delete(`${API}/tasks/${taskId}`, { headers: authHeaders() }); } catch (e) { console.error(e); }
    }, [authHeaders]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!addForm.title.trim()) return;
        try {
            const { data } = await axios.post(`${API}/tasks`, { ...addForm, status: "todo" }, { headers: authHeaders() });
            setTasks((prev) => [...prev, data]);
            setShowAddTask(false);
            setAddForm({ title: "", description: "", priority: "medium", story_points: 3, sprint: 1, type: "feature" });
        } catch (e) { console.error(e); }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Clear all tasks? This cannot be undone.")) return;
        const ids = [...tasks.map((t) => t.id)];
        setTasks([]);
        for (const id of ids) {
            try { await axios.delete(`${API}/tasks/${id}`, { headers: authHeaders() }); } catch {}
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0C]" data-testid="sprint-planner-page">
            <Navbar />
            <main className="pt-16 max-w-[1600px] mx-auto px-4 sm:px-6 py-8">

                {/* ─── Page Header ─── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.35)]">
                            <Layers className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-outfit text-2xl font-medium text-white">AI Sprint Planner</h1>
                            <p className="font-manrope text-sm text-zinc-400">Drag-and-drop Kanban · AI-generated tasks</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {tasks.length > 0 && (
                            <button onClick={handleClearAll} data-testid="clear-all-btn"
                                className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-zinc-400 hover:text-red-400 text-sm font-manrope transition-all flex items-center gap-1.5">
                                <Trash2 className="w-3.5 h-3.5" /> Clear
                            </button>
                        )}
                        <button onClick={() => setShowAddTask(true)} data-testid="add-task-btn"
                            className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-zinc-200 text-sm font-manrope hover:bg-white/[0.08] transition-all flex items-center gap-1.5">
                            <Plus className="w-4 h-4" /> Add Task
                        </button>
                        <button onClick={() => setShowGenerate(!showGenerate)} data-testid="generate-sprint-toggle-btn"
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium font-manrope text-sm hover:brightness-110 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Generate with AI
                            {showGenerate ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </motion.div>

                {/* ─── AI Generation Panel ─── */}
                <AnimatePresence>
                    {showGenerate && (
                        <motion.div
                            key="gen-panel"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-6"
                        >
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-600/[0.07] to-cyan-500/[0.04] border border-purple-500/20 relative overflow-hidden"
                                data-testid="generate-panel">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/[0.05] rounded-full blur-3xl pointer-events-none" />

                                {/* Generating overlay */}
                                <AnimatePresence>
                                    {generating && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-20 flex items-center justify-center bg-[#0A0A0C]/88 backdrop-blur-sm rounded-2xl">
                                            <div className="text-center">
                                                <div className="relative w-24 h-24 mx-auto mb-5">
                                                    {[0, 1, 2].map((i) => (
                                                        <motion.div key={i}
                                                            className="absolute inset-0 rounded-full border border-purple-400/40"
                                                            animate={{ scale: [1, 1.35 + i * 0.2, 1], opacity: [0.5, 0, 0.5] }}
                                                            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.55, ease: "easeInOut" }}
                                                        />
                                                    ))}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                                                            <Brain className="w-10 h-10 text-purple-400" />
                                                        </motion.div>
                                                    </div>
                                                </div>
                                                <p className="font-outfit text-white text-xl mb-2">Generating Sprint Plan</p>
                                                <p className="font-manrope text-zinc-400 text-sm mb-4">AI is crafting your tasks...</p>
                                                <div className="flex items-center justify-center gap-2">
                                                    {[0, 1, 2].map((i) => (
                                                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-500"
                                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                                            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center gap-2 mb-5 relative z-10">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <h3 className="font-outfit text-lg font-medium text-white">AI Sprint Generator</h3>
                                </div>

                                {genError && (
                                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-manrope relative z-10" data-testid="generate-error">
                                        {genError}
                                    </div>
                                )}

                                <form onSubmit={handleGenerateSprint} className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Project Idea</label>
                                        <textarea value={genForm.idea}
                                            onChange={(e) => setGenForm((p) => ({ ...p, idea: e.target.value }))}
                                            placeholder="Describe your project: what it does, core features, and goals. The more detail you provide, the better the sprint plan."
                                            rows={4} required data-testid="sprint-idea-input"
                                            className="input-glass resize-none text-sm leading-relaxed scrollbar-ghost" />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">
                                                Team Size: <span className="text-purple-400">{genForm.team_size}</span>
                                            </label>
                                            <input type="range" min="1" max="10" value={genForm.team_size}
                                                onChange={(e) => setGenForm((p) => ({ ...p, team_size: Number(e.target.value) }))}
                                                data-testid="sprint-team-slider" className="w-full accent-purple-500" />
                                            <div className="flex justify-between text-[10px] text-zinc-700 font-manrope mt-0.5"><span>Solo</span><span>10</span></div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">
                                                Sprints: <span className="text-cyan-400">{genForm.num_sprints}</span>
                                            </label>
                                            <input type="range" min="1" max="6" value={genForm.num_sprints}
                                                onChange={(e) => setGenForm((p) => ({ ...p, num_sprints: Number(e.target.value) }))}
                                                data-testid="sprint-count-slider" className="w-full accent-cyan-500" />
                                            <div className="flex justify-between text-[10px] text-zinc-700 font-manrope mt-0.5"><span>1</span><span>6</span></div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Sprint Duration</label>
                                            <select value={genForm.sprint_duration}
                                                onChange={(e) => setGenForm((p) => ({ ...p, sprint_duration: e.target.value }))}
                                                data-testid="sprint-duration-select" className="input-glass text-sm py-2.5">
                                                {["1 week", "2 weeks", "3 weeks", "4 weeks"].map((d) => (
                                                    <option key={d} value={d} className="bg-[#0A0A0C]">{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button type="submit" disabled={!genForm.idea.trim() || generating}
                                            data-testid="generate-sprint-btn"
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium font-manrope text-sm hover:brightness-110 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Sparkles className="w-4 h-4" />
                                            Generate Sprint Plan
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── Sprint Tabs + Stats ─── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    {/* Sprint tabs */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.07] overflow-x-auto">
                        {["all", ...sprints.map(String)].map((s) => (
                            <button key={s} onClick={() => setActiveSprint(s)} data-testid={`sprint-tab-${s}`}
                                className={`px-3 py-1.5 rounded-lg text-xs font-manrope transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                                    activeSprint === s
                                        ? "bg-gradient-to-r from-purple-600/70 to-cyan-600/70 text-white shadow-sm"
                                        : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                                }`}>
                                {s === "all" ? `All Sprints (${tasks.length})` : `Sprint ${s}`}
                            </button>
                        ))}
                        {sprints.length === 0 && (
                            <span className="px-3 py-1.5 text-xs text-zinc-600 font-manrope">Generate tasks to see sprints</span>
                        )}
                    </div>

                    {/* Progress stats */}
                    {tasks.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs font-manrope">
                                <span className="text-zinc-500">{tasks.length} tasks</span>
                                <span className="text-zinc-700">·</span>
                                <span className="text-zinc-500">{totalPts}pts total</span>
                                <span className="text-zinc-700">·</span>
                                <span className="text-green-400 font-medium">{progress}% done</span>
                            </div>
                            <div className="w-28 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-cyan-500 to-green-400" />
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* ─── Kanban Board or Empty State ─── */}
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-80 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
                        ))}
                    </div>
                ) : tasks.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="py-28 text-center" data-testid="sprint-empty-state">
                        {/* Animated icon */}
                        <div className="relative w-24 h-24 mx-auto mb-7">
                            <motion.div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20"
                                animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Layers className="w-10 h-10 text-purple-400" />
                            </div>
                            <motion.div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 border-2 border-[#0A0A0C]"
                                animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
                        </div>

                        <h3 className="font-outfit text-2xl font-medium text-white mb-3">No Sprint Tasks Yet</h3>
                        <p className="font-manrope text-zinc-400 mb-9 max-w-md mx-auto leading-relaxed">
                            Generate a full sprint plan with AI — just describe your project and the AI will create organized, story-pointed tasks across sprints.
                        </p>
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <button onClick={() => setShowGenerate(true)} data-testid="empty-generate-btn"
                                className="group px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium font-manrope hover:brightness-110 hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Generate Sprint Plan
                            </button>
                            <button onClick={() => setShowAddTask(true)} data-testid="empty-add-task-btn"
                                className="px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-zinc-200 font-manrope hover:bg-white/[0.08] transition-all flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add Manually
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kanban-board">
                        {COLUMNS.map((col) => (
                            <KanbanColumn
                                key={col.id}
                                col={col}
                                tasks={getColTasks(col.id)}
                                isDragOver={draggedOver === col.id}
                                onDragOver={setDraggedOver}
                                onDragLeave={() => setDraggedOver(null)}
                                onDrop={handleDrop}
                                onDelete={handleDeleteTask}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            />
                        ))}
                    </motion.div>
                )}
            </main>

            {/* ─── Add Task Modal ─── */}
            <AnimatePresence>
                {showAddTask && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setShowAddTask(false)}
                        data-testid="add-task-modal">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="w-full max-w-md p-6 rounded-2xl bg-[#0F0F13] border border-white/[0.1] shadow-[0_25px_50px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-outfit text-lg font-medium text-white">Create Task</h3>
                                <button onClick={() => setShowAddTask(false)} data-testid="close-modal-btn"
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddTask} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Title *</label>
                                    <input value={addForm.title} onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))}
                                        placeholder="Implement user authentication" required data-testid="task-title-input"
                                        className="input-glass" />
                                </div>
                                <div>
                                    <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Description</label>
                                    <textarea value={addForm.description}
                                        onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                                        placeholder="Brief description of what needs to be done..." rows={2}
                                        data-testid="task-desc-input" className="input-glass resize-none text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Priority</label>
                                        <select value={addForm.priority}
                                            onChange={(e) => setAddForm((p) => ({ ...p, priority: e.target.value }))}
                                            data-testid="task-priority-select" className="input-glass text-sm py-2.5">
                                            {["critical", "high", "medium", "low"].map((v) => (
                                                <option key={v} value={v} className="bg-[#0A0A0C] capitalize">{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Type</label>
                                        <select value={addForm.type}
                                            onChange={(e) => setAddForm((p) => ({ ...p, type: e.target.value }))}
                                            data-testid="task-type-select" className="input-glass text-sm py-2.5">
                                            {["feature", "bug", "chore", "research"].map((v) => (
                                                <option key={v} value={v} className="bg-[#0A0A0C] capitalize">{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">
                                            Story Points: <span className="text-purple-400">{addForm.story_points}</span>
                                        </label>
                                        <input type="range" min="1" max="13" value={addForm.story_points}
                                            onChange={(e) => setAddForm((p) => ({ ...p, story_points: Number(e.target.value) }))}
                                            data-testid="story-points-slider" className="w-full accent-purple-500 mt-1" />
                                        <div className="flex justify-between text-[10px] text-zinc-700 font-manrope"><span>1</span><span>13</span></div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-manrope tracking-[0.15em] uppercase text-zinc-500 mb-2">Sprint #</label>
                                        <input type="number" min="1" max="10" value={addForm.sprint}
                                            onChange={(e) => setAddForm((p) => ({ ...p, sprint: Number(e.target.value) }))}
                                            data-testid="task-sprint-input" className="input-glass text-sm py-2.5" />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => setShowAddTask(false)}
                                        className="flex-1 py-2.5 rounded-xl btn-secondary text-sm">Cancel</button>
                                    <button type="submit" data-testid="save-task-btn"
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-medium font-manrope text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> Create Task
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
