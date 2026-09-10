import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, ChevronDown, ChevronRight, Trash2, User, Users, Globe, AlertTriangle,
} from 'lucide-react';
import apiClient from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AssignmentMonitoring() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [batchId, setBatchId] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<any>(null);
  const [err, setErr] = useState('');

  const { data: batchesData } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => (await apiClient.get('/batches?limit=1000')).data.data,
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['assignmentReport', batchId],
    queryFn: async () => (await apiClient.get(`/reports/assignments${batchId ? `?batchId=${batchId}` : ''}`)).data.data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/assignments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignmentReport'] });
      setConfirm(null);
    },
    onError: (e: any) => setErr(e?.response?.data?.message || 'Delete failed'),
  });

  const rows = (reportData || []).filter((r: any) => {
    const q = search.toLowerCase();
    return (
      (r.assignment.title ?? '').toLowerCase().includes(q) ||
      (r.teacher?.name ?? '').toLowerCase().includes(q) ||
      (r.batch?.name ?? '').toLowerCase().includes(q)
    );
  });

  const toggle = (id: string) =>
    setExpanded(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  // "Sent to" in one line, so the table reads without expanding every row.
  const audienceLabel = (row: any) => {
    if (row.assignment.audience === 'children') {
      const names = (row.recipients ?? []).map((c: any) => c.name);
      if (names.length === 0) return 'Selected students';
      if (names.length <= 2) return names.join(', ');
      return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
    }
    return row.batch?.name ? `Everyone in ${row.batch.name}` : 'Whole batch';
  };

  return (
    <div className="page-container">
      <PageHeader title="Assignment Monitoring" subtitle="Who set each assignment, who received it, and how many have submitted" />

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border-light flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by title, teacher or batch…" className="flex-1 sm:max-w-80" />
          <select className="select-field sm:w-44" value={batchId} onChange={e => setBatchId(e.target.value)}>
            <option value="">All Batches</option>
            {batchesData?.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-background border-b border-border-light">
              <tr>
                {['Assignment', 'Set by', 'Sent to', 'Due', 'Submitted', 'Completion', ''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState icon={BookOpen} title="No assignments found"
                    description={search ? 'Try a different search.' : 'Assignments will appear here once teachers create them.'} />
                </td></tr>
              ) : rows.map((row: any) => {
                const id = row.assignment._id;
                const pct = row.completionRate ?? 0;
                const isOpen = expanded.includes(id);
                const targeted = row.assignment.audience === 'children';

                return (
                  <React.Fragment key={id}>
                    <tr className="border-b border-border-light hover:bg-background/60 transition-colors cursor-pointer" onClick={() => toggle(id)}>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {isOpen ? <ChevronDown className="w-4 h-4 text-text-light flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-text-light flex-shrink-0" />}
                          <span className="font-semibold text-text">{row.assignment.title}</span>
                        </div>
                      </td>
                      <td className="table-cell text-sm text-text-secondary">{row.teacher?.name ?? '—'}</td>
                      <td className="table-cell">
                        <span className={`badge ${targeted ? 'badge-purple' : 'badge-blue'}`}>
                          {targeted ? <User className="w-3 h-3 mr-1 inline" /> : <Users className="w-3 h-3 mr-1 inline" />}
                          {audienceLabel(row)}
                        </span>
                      </td>
                      <td className="table-cell text-sm text-text-secondary">{fmtDate(row.assignment.dueDate)}</td>
                      <td className="table-cell"><span className="font-bold text-info">{row.submitted}</span><span className="text-text-light text-sm"> / {row.totalChildren}</span></td>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden min-w-[60px]">
                            <div className={`h-full rounded-full ${pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-error'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`badge flex-shrink-0 ${pct >= 80 ? 'badge-green' : pct >= 50 ? 'badge-orange' : 'badge-red'}`}>{pct}%</span>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <button
                          className="btn-ghost !px-2 !py-1.5 hover:!text-error hover:!bg-red-50"
                          onClick={e => { e.stopPropagation(); setErr(''); setConfirm(row); }}
                          title="Delete permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-[#FAFAFA] border-b border-border-light">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <div className="lg:col-span-2 space-y-3">
                              <div>
                                <p className="text-[11px] font-bold text-text-light uppercase tracking-wide mb-1">Description</p>
                                <p className="text-sm text-text whitespace-pre-wrap">{row.assignment.description || '—'}</p>
                              </div>
                              {row.assignment.instructions && (
                                <div>
                                  <p className="text-[11px] font-bold text-text-light uppercase tracking-wide mb-1">Instructions</p>
                                  <p className="text-sm text-text whitespace-pre-wrap">{row.assignment.instructions}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-[11px] font-bold text-text-light uppercase tracking-wide mb-1.5">
                                  Recipients{targeted ? ` (${row.recipients?.length ?? 0})` : ''}
                                </p>
                                {targeted ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {(row.recipients ?? []).map((c: any) => (
                                      <span key={c._id} className="badge badge-purple">{c.name}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-text-secondary flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-text-light" />
                                    Every student in {row.batch?.name ?? 'the batch'} — {row.totalChildren} student{row.totalChildren === 1 ? '' : 's'}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2.5 lg:border-l lg:border-border-light lg:pl-5">
                              {[
                                ['Set by', row.teacher?.name ?? '—'],
                                ['Teacher contact', row.teacher?.phone || row.teacher?.email || '—'],
                                ['Batch', row.batch?.name ?? '—'],
                                ['Created', fmtDate(row.assignment.createdAt)],
                                ['Due', fmtDate(row.assignment.dueDate)],
                                ['Total marks', row.assignment.totalMarks || '—'],
                              ].map(([label, value]) => (
                                <div key={label as string} className="flex items-baseline justify-between gap-3">
                                  <span className="text-[11px] font-semibold text-text-light">{label}</span>
                                  <span className="text-sm text-text font-medium text-right">{value as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete this assignment?"
        footer={
          <div className="flex gap-3">
            <button className="btn-outline flex-1" onClick={() => setConfirm(null)}>Cancel</button>
            <button
              className="btn-danger flex-1"
              onClick={() => deleteMutation.mutate(confirm.assignment._id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        }
      >
        {confirm && (
          <div className="space-y-3">
            <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary leading-relaxed">
                <strong className="text-text">{confirm.assignment.title}</strong> and its{' '}
                {confirm.submitted} submission{confirm.submitted === 1 ? '' : 's'} will be removed
                permanently. This cannot be undone, and parents will no longer see it.
              </p>
            </div>
            <div className="space-y-1.5 text-xs text-text-secondary">
              <div className="flex justify-between"><span>Set by</span><span className="font-semibold text-text">{confirm.teacher?.name ?? '—'}</span></div>
              <div className="flex justify-between"><span>Sent to</span><span className="font-semibold text-text">{audienceLabel(confirm)}</span></div>
              <div className="flex justify-between"><span>Due</span><span className="font-semibold text-text">{fmtDate(confirm.assignment.dueDate)}</span></div>
            </div>
            {err && <p className="text-xs text-error font-medium">{err}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
