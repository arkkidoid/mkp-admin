import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageMeta } from '../../hooks/usePagedList';

/**
 * Page controls for the admin lists. Renders nothing for a single page, so
 * short lists stay uncluttered.
 */
export default function Pagination({
  meta,
  onChange,
  isFetching,
}: {
  meta: PageMeta | null;
  onChange: (page: number) => void;
  isFetching?: boolean;
}) {
  if (!meta || meta.pages <= 1) return null;

  const { page, pages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // A compact window around the current page instead of every page number.
  const windowed: (number | '…')[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) windowed.push(p);
    else if (windowed[windowed.length - 1] !== '…') windowed.push('…');
  }

  const navBtn = 'inline-flex items-center justify-center h-8 px-2 rounded-lg border border-border text-text-secondary hover:bg-background hover:text-text disabled:opacity-40 disabled:pointer-events-none transition-colors';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-border-light">
      <p className="text-xs text-text-secondary font-medium">
        Showing <span className="font-semibold text-text">{from}–{to}</span> of{' '}
        <span className="font-semibold text-text">{total}</span>
        {isFetching ? <span className="ml-2 text-text-light">updating…</span> : null}
      </p>

      <div className="flex items-center gap-1">
        <button className={navBtn} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="w-4 h-4" />
        </button>

        {windowed.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-text-light select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`h-8 min-w-8 px-2 rounded-lg text-xs font-semibold transition-colors ${
                p === page
                  ? 'bg-primary text-white'
                  : 'border border-border text-text-secondary hover:bg-background hover:text-text'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button className={navBtn} onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
