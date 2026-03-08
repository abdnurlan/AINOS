import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AINOS UI crashed:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="w-screen h-screen bg-ainos-space-deep text-ainos-text flex items-center justify-center p-6">
        <div className="glass-panel max-w-md w-full p-6">
          <div className="text-sm uppercase tracking-[0.2em] text-ainos-danger mb-3">
            Runtime Error
          </div>
          <h1 className="text-xl font-semibold mb-2">Scene render failed</h1>
          <p className="text-sm text-ainos-text-dim leading-6 mb-5">
            AINOS stopped the full-screen crash and kept the UI alive. Refresh after checking the
            console log.
          </p>
          {this.state.message && (
            <div className="rounded-lg border border-ainos-danger/20 bg-ainos-danger/8 px-3 py-2 text-xs font-mono text-ainos-danger mb-5">
              {this.state.message}
            </div>
          )}
          <button
            className="btn-primary w-full"
            onClick={() => window.location.reload()}
          >
            Reload Scene
          </button>
        </div>
      </div>
    );
  }
}
