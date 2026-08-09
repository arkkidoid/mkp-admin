import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, BookOpen, Save, X, Edit2 } from 'lucide-react';
import apiClient from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';

export default function Enrollments() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const { data: children = [], isLoading } = useQuery({
    queryKey: ['adminChildren'],
    queryFn: async () => (await apiClient.get('/admin/children')).data.data ?? [],
  });

  const filtered = (children as any[]).filter(c =>
    (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.batch?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

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

  const handleEditClick = (child: any) => {
    setEditingId(child._id);
    setEditValue(String(child.classesLeft ?? 0));
  };

  const handleSave = (childId: string) => {
    const val = parseInt(editValue, 10);
    if (!isNaN(val)) {
      updateMutation.mutate({ id: childId, classesLeft: val });
    } else {
      setEditingId(null);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Enrollments & Classes Left"
        subtitle="Track and adjust remaining classes for all active enrollments"
      />

      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student or batch…" className="w-full sm:w-80" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead className="bg-background border-b border-border-light">
              <tr>
                <th className="table-header">Student</th>
                <th className="table-header">Enrolled Batch</th>
                <th className="table-header">Classes Left</th>
                <th className="table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4}>
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
                      <span className={`font-semibold ${c.classesLeft <= 2 ? 'text-error' : 'text-text'}`}>
                        {c.classesLeft ?? 0}
                      </span>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    {editingId === c._id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button className="btn-ghost !px-2 !py-1 !text-green-600 hover:!bg-green-50" onClick={() => handleSave(c._id)} title="Save"><Save className="w-4 h-4" /></button>
                        <button className="btn-ghost !px-2 !py-1 !text-text-light hover:!bg-gray-100" onClick={() => setEditingId(null)} title="Cancel"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button 
                        className="btn-ghost !px-3 !py-1.5 text-xs font-medium"
                        onClick={() => handleEditClick(c)}
                        disabled={!c.batch}
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> Adjust
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
