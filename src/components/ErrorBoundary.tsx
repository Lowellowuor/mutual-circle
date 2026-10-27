import React from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F4EE] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white border border-[#111111]/15 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-[#111111]">Something went wrong</h1>
              <p className="text-xs text-[#111111]/60 mt-1">The demo hit an unexpected error. Your data is still safe.</p>
            </div>
            {this.state.error && (
              <pre className="p-3 bg-[#FAF8F4] border border-[#111111]/10 rounded-lg text-[10px] font-mono text-rose-700 overflow-x-auto max-h-32 whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 py-2.5 bg-white border border-[#111111]/20 rounded-lg text-xs font-medium hover:bg-black/5 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Try again
              </button>
              <button
                onClick={() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} window.location.reload(); }}
                className="flex-1 py-2.5 bg-[#1F6B4A] hover:bg-[#18553a] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
