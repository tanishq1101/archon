import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import ProjectArchitect from "@/pages/ProjectArchitect";
import CTODashboard from "@/pages/CTODashboard";
import RAGMemory from "@/pages/RAGMemory";
import SprintPlanner from "@/pages/SprintPlanner";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import "@/App.css";

function NotFound() {
    return (
        <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center px-6 text-center">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-purple-600/10 rounded-full blur-3xl" />
                <span className="relative font-outfit text-[8rem] font-semibold leading-none bg-clip-text text-transparent bg-gradient-to-br from-purple-400 via-violet-400 to-cyan-400 select-none">404</span>
            </div>
            <h1 className="font-outfit text-2xl font-medium text-white mb-3">Page Not Found</h1>
            <p className="font-manrope text-zinc-400 text-sm max-w-xs mb-8 leading-relaxed">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link
                to="/"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-medium font-manrope hover:brightness-110 hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all duration-300"
            >
                Back to Home
            </Link>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <ErrorBoundary>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/architect" element={<ProtectedRoute><ProjectArchitect /></ProtectedRoute>} />
                        <Route path="/cto" element={<ProtectedRoute><CTODashboard /></ProtectedRoute>} />
                        <Route path="/memory" element={<ProtectedRoute><RAGMemory /></ProtectedRoute>} />
                        <Route path="/sprint" element={<ProtectedRoute><SprintPlanner /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </ErrorBoundary>
            </BrowserRouter>
            <Toaster theme="dark" closeButton />
        </AuthProvider>
    );
}

export default App;
