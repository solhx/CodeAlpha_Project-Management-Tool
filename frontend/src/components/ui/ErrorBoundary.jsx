// frontend/src/components/ui/ErrorBoundary.jsx
'use client';
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center
                            text-3xl mx-auto mb-4">
              💥
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-500 text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-secondary text-sm"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary text-sm"
              >
                Reload Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-6 text-left text-xs bg-slate-800 text-slate-300 p-4
                              rounded-xl overflow-auto max-h-32">
                {this.state.error?.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}