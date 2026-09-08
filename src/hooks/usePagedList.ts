import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

export const PAGE_SIZE = 20;

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

/**
 * Server-side paging + search for the admin list screens.
 *
 * Searching on the client only ever filtered the rows already fetched, so a
 * record past the first page was unreachable — typing its name found nothing.
 * The search term goes to the API instead, which searches the whole collection.
 */
export function usePagedList<T = any>(opts: {
  key: string;
  url: string;
  limit?: number;
  /** Extra query params; a falsy value is omitted. */
  params?: Record<string, string | undefined>;
}) {
  const { key, url, limit = PAGE_SIZE, params } = opts;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const extra = JSON.stringify(params ?? {});

  // Page 3 of an old search is meaningless once the term changes.
  useEffect(() => { setPage(1); }, [debouncedSearch, extra]);

  const query = useQuery({
    queryKey: [key, page, debouncedSearch, extra],
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) qs.set('search', debouncedSearch);
      Object.entries(params ?? {}).forEach(([k, v]) => { if (v) qs.set(k, v); });

      const res = await apiClient.get(`${url}?${qs}`);
      return {
        rows: (res.data.data ?? []) as T[],
        meta: (res.data.meta ?? null) as PageMeta | null,
      };
    },
    // Hold the current page on screen while the next one loads.
    placeholderData: (prev) => prev,
  });

  return {
    rows: query.data?.rows ?? [],
    meta: query.data?.meta ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    page, setPage,
    search, setSearch,
    isSearching: debouncedSearch.length > 0,
  };
}
