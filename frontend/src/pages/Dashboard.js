import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Brain, Code2, Database, Plus, ArrowRight, FolderOpen, Zap, TrendingUp, Activity, Layers, Trash2, Loader2 } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from "@/components/ui/alert-dialog";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

const quickActions = [
    { label: "AI Project Architect", desc: "Generate a project blueprint from your idea", href: "/architect", icon: Brain, gradient: "from-purple-500 to-violet-600" },
    { label: "AI Sprint Planner", desc: "AI Kanban board with drag-and-drop tasks", href: "/sprint", icon: Layers, gradient: "from-cyan-400 to-purple-500" },
    { label: "CTO Console", desc: "Get expert technical guidance and advice", href: "/cto", icon: Code2, gradient: "from-cyan-400 to-blue-500" },
    { label: "Memory", desc: "Manage your AI knowledge base", href: "/memory", icon: Database, gradient: "from-violet-500 to-fuchsia-600" },
];

const statusColors = {
    ideation: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    planning: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    in_progress: "text-green-400 bg-green-400/10 border-green-400/20",
    completed: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export default function Dashboard() {
    const { user, getToken } = useAuth();
    const [stats, setStats] = useState({ projects_count: 0, memory_count: 0, ai_queries_count: 0, recent_projects: [] });
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);

    const handleDeleteProject = async (projectId) => {
        setDeletingId(projectId);
        try {
            const token = getToken();
            await axios.delete(`${API}/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Fetch stats again to update counts and list dynamically
            const { data } = await axios.get(`${API}/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data);
            toast.success("Project deleted successfully");
        } catch (err) {
            console.error("Failed to delete project:", err);
            toast.error("Failed to delete project. Please try again.");
        } finally {
            setDeletingId(null);
            setProjectToDelete(null);
        }
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                const token = getToken();
                const { data } = await axios.get(`${API}/stats`, { headers: { Authorization: `Bearer ${token}` } });
                setStats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [getToken]);

    const statCards = [
        { label: "Projects", value: stats.projects_count, icon: FolderOpen, color: "text-purple-400", bg: "from-purple-600/15 to-violet-600/10" },
        { label: "Memory Docs", value: stats.memory_count, icon: Database, color: "text-cyan-400", bg: "from-cyan-500/15 to-blue-500/10" },
        { label: "AI Queries", value: stats.ai_queries_count, icon: Activity, color: "text-violet-400", bg: "from-violet-500/15 to-purple-500/10" },
    ];

    return (
        <div className="min-h-screen bg-[#0A0A0C]" data-testid="dashboard-page">
            <Navbar />
            <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 py-10">
                {/* Welcome Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="mb-10">
                    <p className="font-manrope text-xs tracking-[0.2em] uppercase text-zinc-500 mb-2">Dashboard</p>
                    <h1 className="font-outfit text-3xl sm:text-4xl font-medium text-white" data-testid="dashboard-welcome">
                        Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span>
                    </h1>
                    <p className="font-manrope text-zinc-400 mt-2">Here's what's happening with your projects.</p>
                </motion.div>

                {/* Stats */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="grid grid-cols-3 gap-4 mb-10">
                    {statCards.map((s, i) => (
                        <motion.div key={i} data-testid={`stat-card-${s.label.toLowerCase().replace(/\s/g, "-")}`}
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className={`p-5 rounded-2xl bg-gradient-to-br ${s.bg} border border-white/[0.07] backdrop-blur-sm`}>
                            <div className="flex items-center justify-between mb-3">
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                                <TrendingUp className="w-3.5 h-3.5 text-zinc-600" />
                            </div>
                            <div className={`font-outfit text-2xl font-medium ${s.color} mb-0.5`}>
                                {loading ? <div className="w-8 h-6 bg-white/10 rounded animate-pulse" /> : s.value}
                            </div>
                            <div className="font-manrope text-xs text-zinc-500">{s.label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="lg:col-span-2">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <h2 className="font-outfit text-lg font-medium text-white mb-4">AI Capabilities</h2>
                            <div className="space-y-3">
                                {quickActions.map((action, i) => (
                                    <Link key={i} to={action.href} data-testid={`quick-action-${i}`}
                                        className="group flex items-center gap-4 p-5 rounded-2xl glass-card-hover">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                            <action.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-outfit font-medium text-white text-sm">{action.label}</div>
                                            <div className="font-manrope text-xs text-zinc-400 mt-0.5">{action.desc}</div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Recent Projects */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-outfit text-lg font-medium text-white">Recent Projects</h2>
                            <Link to="/architect" data-testid="new-project-btn"
                                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-manrope transition-colors">
                                <Plus className="w-3.5 h-3.5" /> New
                            </Link>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
                                ))}
                            </div>
                        ) : stats.recent_projects.length === 0 ? (
                            <div className="p-8 rounded-2xl glass-card text-center" data-testid="no-projects">
                                <FolderOpen className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                                <p className="font-manrope text-sm text-zinc-500 mb-4">No projects yet</p>
                                <Link to="/architect" className="btn-primary text-sm inline-flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" /> Create First Project
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3" data-testid="recent-projects-list">
                                {stats.recent_projects.map((project, i) => (
                                    <motion.div key={project.id} data-testid={`project-item-${i}`}
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.05 }}
                                        className="p-4 rounded-xl glass-card-hover group relative">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-outfit font-medium text-white text-sm truncate">{project.title}</p>
                                                <p className="font-manrope text-xs text-zinc-500 mt-0.5 truncate">{project.description || "No description"}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-manrope ${statusColors[project.status] || statusColors.ideation}`}>
                                                    {project.status}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setProjectToDelete(project.id);
                                                    }}
                                                    disabled={deletingId === project.id}
                                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                                                    title="Delete Project"
                                                >
                                                    {deletingId === project.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* AI Tip */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-purple-600/10 to-cyan-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="font-outfit font-medium text-white text-sm">Pro Tip</p>
                            <p className="font-manrope text-xs text-zinc-400 mt-0.5">
                                Start with the AI Architect to generate your project blueprint, then use the CTO Console for deep technical guidance.
                            </p>
                        </div>
                    </div>
                </motion.div>
                {/* AlertDialog for Project Deletion Confirmation */}
                <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
                    <AlertDialogContent className="bg-[#18181B] border border-white/[0.08] text-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-outfit text-white text-lg font-medium">Delete Project</AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400 font-manrope text-sm leading-relaxed">
                                Are you sure you want to delete this project? This will permanently remove all associated architectural blueprints, sprint tasks, and context files.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="bg-white/[0.05] border border-white/[0.08] hover:bg-white/10 text-zinc-300 px-4 py-2 rounded-lg font-manrope text-xs">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProject(projectToDelete)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-manrope text-xs border-0">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </div>
    );
}
