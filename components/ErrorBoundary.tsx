import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const state = (this as any).state;
    const props = (this as any).props;

    if (state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-white/10 rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Algo salió mal</h2>
            <p className="text-gray-400 mb-6">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </p>
            <pre className="text-xs text-red-500 bg-black/50 p-4 rounded-xl overflow-auto mb-6 text-left">
              {state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-neon text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return props.children;
  }
}

export default ErrorBoundary;
