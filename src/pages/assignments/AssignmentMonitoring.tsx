import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import apiClient from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';

export default function AssignmentMonitoring() {
  const [search, setSearch] = useState('');
  const [batchId, setBatchId] = useState('');

  const { data: batchesData } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => (await apiClient.get('/batches')).data.data,
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['assignmentReport', batchId],
    queryFn: async () => (await apiClient.get(`/reports/assignments${batchId ? `?batchId=${batchId}` : ''}`)).data.data,
  });

  const rows = (reportData || []).filter((r: any) =>
    r.assignment.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <PageHeader title="Assignment Monitoring" subtitle="Track submission rates across all assignments" />

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border-light flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by assignment title…" className="flex-1 sm:max-w-72" />
          <select className="select-field sm:w-44" value={batchId} onChange={e => setBatchId(e.target.value)}>
            <option value="">All Batches</option>
            {batchesData?.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-background border-b border-border-light">
              <tr>{['Assignment', 'Batch', 'Due Date', 'Submitted', 'Total', 'Completion'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={BookOpen} title="No assignments found" description={search ? 'Try a different search.' : 'Assignment data will appear here once teachers create assignments.'} /></td></tr>
              ) : rows.map((row: any, i: number) => {
                const pct = row.completionRate ?? 0;
                return (
                  <tr key={i} className="border-b border-border-light last:border-0 hover:bg-background/60 transition-colors">
                    <td className="table-cell font-semibold text-text">{row.assignment.title}</td>
                    <td className="table-cell text-sm text-text-secondary">{row.batch?.name || '—'}</td>
                    <td className="table-cell text-sm text-text-secondary">{new Date(row.assignment.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="table-cell font-bold text-info">{row.submitted}</td>
                    <td className="table-cell text-sm text-text-secondary">{row.totalChildren}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden min-w-[60px]">
                          <div className={`h-full rounded-full ${pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-error'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`badge flex-shrink-0 ${pct >= 80 ? 'badge-green' : pct >= 50 ? 'badge-orange' : 'badge-red'}`}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
