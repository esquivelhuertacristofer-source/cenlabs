"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-8 text-center font-['Outfit']">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-500 shadow-xl shadow-red-500/10">
            <AlertCircle size={32} />
          </div>
          <h2 className="mb-3 text-2xl font-black text-[#023047] uppercase tracking-tighter">
            Error en el Simulador
          </h2>
          <p className="mb-8 max-w-md text-sm font-medium text-slate-500 leading-relaxed">
            Se ha detectado una falla técnica en la ejecución de este escenario.
            Por seguridad, la simulación se ha detenido.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-3 rounded-2xl bg-[#023047] px-8 py-4 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-red-500 shadow-lg shadow-[#023047]/20 active:scale-95"
          >
            <RotateCcw size={16} />
            Reiniciar Componente
          </button>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 overflow-auto rounded-xl bg-slate-900 p-4 text-left text-[10px] text-red-400 max-w-lg font-mono">
                {this.state.error?.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
