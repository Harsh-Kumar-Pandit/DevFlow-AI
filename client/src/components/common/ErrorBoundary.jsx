import React from 'react';

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
        <div className="p-6 max-w-2xl mx-auto my-12 bg-red-500/5 border border-red-500/10 rounded-2xl text-center space-y-4">
          <div className="text-red-500 font-bold text-lg">Something went wrong</div>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-md mx-auto">
            An unexpected error occurred during rendering. Please inspect the trace details below or contact support.
          </p>
          <pre className="text-xs text-left bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-zinc-400 overflow-auto max-h-60 whitespace-pre-wrap font-mono">
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
