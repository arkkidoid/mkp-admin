import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Save, X, Edit2, PauseCircle, PlayCircle } from 'lucide-react';
import apiClient from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import Pagination from '../components/ui/Pagination';
import { usePagedList } from '../hooks/usePagedList';
import EmptyState from '../components/ui/EmptyState';

export default function Enrollments() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  // 'true' active, 'false' stopped, 'all' both.
  const [status, setStatus] = useState<'true' | 'false' | 'all'>('true');

  // Server-side paging and search: filtering only the fetched page could
  // never surface a record that was never fetched.
  const {
    rows: children, meta, isLoading, isFetching, setPage, search, setSearch,
  } = usePagedList<any>({ key: 'adminChildren', url: '/admin/children', params: { isActive: status } });

  const filtered = children as any[];

  const updateMutation = useMutation({
    mutationFn: async ({ id, classesLeft }: { id: string, classesLeft: number }) => {
      return apiClient.put(`/admin/children/${id}`, { classesLeft });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminChildren'] });
      setEditingId(null);
    },
    onError: (e: any) => {
      alert(e?.response?.data?.message || 'Update failed');
      setEditingId(null);
    },
  });

  // Stops or resumes one course enrollment. The child's other courses, and all
  // of this course's attendance and fee history, are untouched.
  const statusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/admin/children/${id}/status`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminChildren'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Could not change status'),
  });

  const toggleStatus = (c: any) => {
    if (c.isActive === false) {
      statusMutation.mutate({ id: c._id, isActive: true });
      return;
    }
    if (confirm(
      `Stop ${c.name}'s enrollment in ${c.batch?.name ?? 'this course'}?\n\n` +
      `They will come off the teacher's attendance list and the course will ` +
      `disappear from the parent's app. Attendance and fee history are kept, ` +
      `and any unpaid fee stays due. You can resume this at any time.`
    )) {
      statusMutation.mutate({ id: c._id, isActive: false });
    }
  };

  const handleEditClick = (child: any) => {
    setEditingId(child._id);
    setEditValue(String(child.classesLeft ?? 0));
  };

  // Admin can set any whole number here, negatives included — an overdrawn
  // student is a real state, not an error. Nothing is validated or blocked.
  const handleSave = (childId: string) => {
    const val = parseInt(editValue.trim(), 10);
    if (Number.isNaN(val)) {
      setEditingId(null);
      return;
    }
    updateMutation.mutate({ id: childId, classesLeft: val });
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Enrollments & Classes Left"
        subtitle="Track classes, and stop or resume a course without losing its history"
      />

      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student or batch…" className="w-full sm:w-80" />
          <select
            className="select-field sm:w-44"
            value={status}
            onChange={e => setStatus(e.target.value as 'true' | 'false' | 'all')}
          >
            <option value="true">Active only</option>
            <option value="false">Stopped only</option>
            <option value="all">All enrollments</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead className="bg-background border-b border-border-light">
              <tr>
                <th className="table-header">Student</th>
                <th className="table-header">Enrolled Batch</th>
                <th className="table-header">Classes Left</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5}>
                  <EmptyState icon={BookOpen} title="No enrollments found" description="No students match your search." />
                </td></tr>
              ) : filtered.map((c: any) => (
                <tr key={c._id} className="border-b border-border-light last:border-0 hover:bg-background/60 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                        {(c.name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-text text-sm">{c.name}</p>
                        <p className="text-xs text-text-light">{c.parent?.name ? `Parent: ${c.parent.name}` : '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    {c.batch ? (
                      <span className="badge badge-purple">{c.batch.name}</span>
                    ) : (
                      <span className="text-xs text-text-light italic">Not enrolled</span>
                    )}
                  </td>
                  <td className="table-cell font-mono">
                    {editingId === c._id ? (
                      <input
                        type="number"
                        className="input-field !py-1 !px-2 w-20 text-sm font-mono"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSave(c._id)}
                      />
                    ) : (
                      c.classesLeft == null ? (
                        <span className="text-xs text-text-light italic">—</span>
                      ) : c.classesLeft < 0 ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="font-semibold text-error">{c.classesLeft}</span>
                          <span className="badge badge-red">Overdrawn</span>
                        </span>
                      ) : (
                        <span className={`font-semibold ${c.classesLeft <= 2 ? 'text-warning' : 'text-text'}`}>
                          {c.classesLeft}
                        </span>
                      )
                    )}
                  </td>
                  <td className="table-cell">
                    {c.isActive === false ? (
                      <span className="badge badge-gray">Stopped</span>
                    ) : (
                      <span className="badge badge-green">Active</span>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    {editingId === c._id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button className="btn-ghost !px-2 !py-1 !text-green-600 hover:!bg-green-50" onClick={() => handleSave(c._id)} title="Save"><Save className="w-4 h-4" /></button>
                        <button className="btn-ghost !px-2 !py-1 !text-text-light hover:!bg-gray-100" onClick={() => setEditingId(null)} title="Cancel"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-ghost !px-3 !py-1.5 text-xs font-medium"
                          onClick={() => handleEditClick(c)}
                          disabled={!c.batch || c.isActive === false}
                        >
                          <Edit2 className="w-3 h-3 mr-1" /> Adjust
                        </button>
                        <button
                          className={`btn-ghost !px-3 !py-1.5 text-xs font-medium ${c.isActive === false ? 'hover:!text-success hover:!bg-emerald-50' : 'hover:!text-warning hover:!bg-orange-50'}`}
                          onClick={() => toggleStatus(c)}
                          disabled={statusMutation.isPending}
                          title={c.isActive === false ? 'Resume this enrollment' : 'Stop this enrollment'}
                        >
                          {c.isActive === false
                            ? <><PlayCircle className="w-3.5 h-3.5 mr-1" /> Resume</>
                            : <><PauseCircle className="w-3.5 h-3.5 mr-1" /> Stop</>}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onChange={setPage} isFetching={isFetching} />
      </div>
    </div>
  );
}
