import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, BookOpen } from 'lucide-react';
import apiClient from '../../api/client';

const COLORS = ['#E53935','#1E88E5','#43A047','#FB8C00','#8E24AA','#00ACC1','#F4511E','#FFB300','#6D4C41','#546E7A'];
const EMPTY = { name: '', code: '', color: COLORS[0], icon: 'book', description: '' };

export default function CourseList() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: any }>({ open: false, mode: 'add' });
  const [form, setForm] = useState({ ...EMPTY });
  const [err, setErr] = useState('');

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['adminSubjects'],
    queryFn: async () => (await apiClient.get('/admin/subjects')).data.data ?? [],
  });

  const openAdd = () => { setForm({ ...EMPTY }); setErr(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (c: any) => {
    setForm({ name: c.name, code: c.code, color: c.color ?? COLORS[0], icon: c.icon ?? 'book', description: c.description ?? '' });
    setErr('');
    setModal({ open: true, mode: 'edit', item: c });
  };
  const close = () => setModal({ open: false, mode: 'add' });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (modal.mode === 'add') await apiClient.post('/admin/subjects', form);
      else await apiClient.put(`/admin/subjects/${modal.item._id}`, form);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminSubjects'] }); close(); },
    onError: (e: any) => setErr(e?.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin/subjects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminSubjects'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Failed'),
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Courses</h1>
          <p className="text-sm text-text-secondary mt-1">{(courses as any[]).length} courses offered at ARK Kidoid</p>
        </div>
        <button className="btn-primary flex items-center" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />Add Course
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(courses as any[]).map((c: any) => (
            <div key={c._id} className="card border border-border-light hover:shadow-medium transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: (c.color ?? '#ccc') + '20' }}>
                    <BookOpen className="w-6 h-6" style={{ color: c.color ?? '#666' }} />
                  </div>
                  <div>
                    <p className="font-bold text-text leading-tight">{c.name}</p>
                    <p className="text-xs font-mono text-text-secondary mt-0.5">{c.code}</p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button className="p-1.5 hover:text-primary text-text-light transition-colors" onClick={() => openEdit(c)}><Edit2 className="w-4 h-4" /></button>
                  <button className="p-1.5 hover:text-error text-text-light transition-colors" onClick={() => { if (confirm(`Remove "${c.name}"?`)) deleteMutation.mutate(c._id); }}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {c.description && <p className="text-sm text-text-secondary line-clamp-2">{c.description}</p>}
              <div className="flex items-center gap-2 mt-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color ?? '#ccc' }} />
                <span className="text-xs text-text-secondary">{c.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          ))}

          {/* Add card */}
          <button onClick={openAdd} className="card border-2 border-dashed border-border flex flex-col items-center justify-center py-8 hover:border-primary hover:text-primary text-text-secondary transition-colors">
            <Plus className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Add New Course</span>
          </button>
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-medium w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border-light">
              <h2 className="text-lg font-bold text-text">{modal.mode === 'add' ? 'Add Course' : 'Edit Course'}</h2>
              <button onClick={close}><X className="w-5 h-5 text-text-light" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Course Name</label>
                <input className="input-field" value={form.name} onChange={f('name')} placeholder="e.g. Robotics & Electronics" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Code</label>
                  <input className="input-field" value={form.code} onChange={f('code')} placeholder="ROB, CHESS..." />
                </div>
                <div>
                  <label className="label">Icon name</label>
                  <input className="input-field" value={form.icon} onChange={f('icon')} placeholder="book, code, chess..." />
                </div>
              </div>
              <div>
                <label className="label">Brand Color</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {COLORS.map((col) => (
                    <button key={col} type="button" onClick={() => setForm((p) => ({ ...p, color: col }))}
                      className="w-8 h-8 rounded-full border-2 transition-all" style={{ backgroundColor: col, borderColor: form.color === col ? '#000' : 'transparent' }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea className="input-field resize-none" rows={3} value={form.description} onChange={f('description') as any} placeholder="Brief course description..." />
              </div>
              {err && <p className="text-error text-sm">{err}</p>}
            </div>
            <div className="flex gap-3 p-6 border-t border-border-light">
              <button className="btn-outline flex-1" onClick={close}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
