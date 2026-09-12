import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, Trash2, PauseCircle, Info } from 'lucide-react';

export type ConfirmTone = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  /** One sentence on what is about to happen. */
  message: string;
  /** Facts the decision turns on, e.g. ["Student: Sehar", "Course: Chess"]. */
  details?: { label: string; value: string }[];
  /** Spelled-out consequence, shown in the tinted callout. */
  consequence?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

const TONES = {
  danger:  { icon: Trash2,         ring: 'bg-red-50 text-error',        btn: 'btn-danger',  callout: 'bg-red-50 border-red-100' },
  warning: { icon: PauseCircle,    ring: 'bg-orange-50 text-warning',   btn: 'btn-primary', callout: 'bg-orange-50 border-orange-100' },
  info:    { icon: Info,           ring: 'bg-blue-50 text-info',        btn: 'btn-primary', callout: 'bg-blue-50 border-blue-100' },
} as const;

/**
 * Promise-based confirmation, so a call site reads as a single `await` instead
 * of hoisting state for every destructive button.
 *
 *   const { confirm, dialog } = useConfirm();
 *   if (await confirm({ title: '…', message: '…' })) mutate(id);
 *   // …and render {dialog} once in the page.
 */
export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setBusy(false);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const settle = (ok: boolean) => {
    // Keep the dialog up while the caller's mutation runs, so the button can
    // show progress rather than the dialog vanishing before the work is done.
    if (ok) setBusy(true); else setOpts(null);
    resolver.current?.(ok);
    resolver.current = null;
    if (ok) setTimeout(() => { setOpts(null); setBusy(false); }, 400);
  };

  const tone = TONES[opts?.tone ?? 'danger'];
  const Icon = tone.icon;

  const dialog = opts ? (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-[fadeIn_120ms_ease-out]"
        onClick={() => !busy && settle(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-medium overflow-hidden animate-[popIn_140ms_ease-out]"
      >
        <div className="px-6 pt-6 pb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${tone.ring}`}>
            <Icon className="w-5 h-5" />
          </div>

          <h2 className="text-base font-bold text-text">{opts.title}</h2>
          <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{opts.message}</p>

          {opts.details && opts.details.length > 0 && (
            <div className="mt-4 rounded-xl border border-border-light divide-y divide-border-light">
              {opts.details.map((d) => (
                <div key={d.label} className="flex items-baseline justify-between gap-4 px-3 py-2">
                  <span className="text-xs text-text-light font-medium">{d.label}</span>
                  <span className="text-xs text-text font-semibold text-right">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          {opts.consequence && (
            <div className={`mt-4 flex gap-2.5 p-3 rounded-xl border ${tone.callout}`}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
              <p className="text-xs text-text-secondary leading-relaxed">{opts.consequence}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border-light bg-background flex gap-3">
          <button className="btn-outline flex-1" onClick={() => settle(false)} disabled={busy}>
            {opts.cancelLabel ?? 'Cancel'}
          </button>
          <button className={`${tone.btn} flex-1`} onClick={() => settle(true)} disabled={busy}>
            {busy ? 'Working…' : (opts.confirmLabel ?? 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
