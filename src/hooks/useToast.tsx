import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastKind = 'success' | 'error';
interface Toast { id: number; kind: ToastKind; text: string }

const ToastCtx = createContext<(text: string, kind?: ToastKind) => void>(() => {});

/** Replaces alert() — non-blocking, and does not steal focus mid-task. */
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon = t.kind === 'success' ? CheckCircle2 : AlertCircle;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 max-w-sm px-4 py-3 rounded-xl shadow-medium border bg-surface animate-[popIn_140ms_ease-out] ${
                t.kind === 'success' ? 'border-emerald-100' : 'border-red-100'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${t.kind === 'success' ? 'text-success' : 'text-error'}`} />
              <p className="text-sm text-text flex-1 leading-snug">{t.text}</p>
              <button
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                className="text-text-light hover:text-text transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
