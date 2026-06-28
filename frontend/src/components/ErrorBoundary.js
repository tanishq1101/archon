import React from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 text-center backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-outfit text-lg font-medium text-white mb-2">Something went wrong</h2>
            <p className="font-manrope text-sm text-zinc-400 mb-6 leading-relaxed">
              An unexpected error occurred in this view.
              {this.state.error?.message && (
                <code className="block mt-2 p-2 bg-black/40 rounded text-xs text-red-300 font-mono text-left overflow-x-auto">
                  {this.state.error.message}
                </code>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/10 text-sm font-manrope transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Reload Page
              </button>
              <a
                href="/"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-manrope transition-all"
              >
                <Home className="w-4 h-4" /> Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
