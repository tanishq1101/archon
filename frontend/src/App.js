import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import ProjectArchitect from "@/pages/ProjectArchitect";
import CTODashboard from "@/pages/CTODashboard";
import RAGMemory from "@/pages/RAGMemory";
import SprintPlanner from "@/pages/SprintPlanner";
import "@/App.css";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/architect" element={<ProtectedRoute><ProjectArchitect /></ProtectedRoute>} />
                    <Route path="/cto" element={<ProtectedRoute><CTODashboard /></ProtectedRoute>} />
                    <Route path="/memory" element={<ProtectedRoute><RAGMemory /></ProtectedRoute>} />
                    <Route path="/sprint" element={<ProtectedRoute><SprintPlanner /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
