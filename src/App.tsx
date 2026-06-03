import { Component, type ErrorInfo, type ReactNode } from 'react';
import { GameShell } from './components/GameShell';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('SONIC SPEEDWAY crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-[#0a1a4a] px-6 text-center">
          <h1 className="font-display text-lg text-[#e03b3b] drop-shadow-[2px_2px_0_#0a1a4a] sm:text-2xl">
            GAME CRASHED
          </h1>
          <p className="max-w-sm font-body text-base uppercase tracking-wide text-[#fdf6e3]">
            The speedway hit a wall. Reload to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="border-4 border-[#0a1a4a] bg-[#ffcc00] px-6 py-3 font-display text-[10px] text-[#0a1a4a] shadow-[4px_4px_0_rgba(0,0,0,0.4)] transition-all duration-150 hover:bg-[#ffd83a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <GameShell />
    </ErrorBoundary>
  );
}
