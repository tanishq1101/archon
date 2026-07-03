import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center" data-testid="auth-loading">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm font-manrope">Loading Archon...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/auth" replace />;

    return children;
}
