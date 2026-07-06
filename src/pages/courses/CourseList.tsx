import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import apiClient from '../../api/client';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

const COLORS = ['#E53935','#1E88E5','#43A047','#FB8C00','#8E24AA','#00ACC1','#F4511E','#FFB300','#6D4C41','#546E7A'];
const EMPTY = { name: '', code: '', monthlyFee: '', admissionFee: '', duration: '', ageGroup: '', level: '', color: COLORS[0], icon: 'book', description: '' };

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
    setForm({
      name: c.name, code: c.code,
      monthlyFee: String(c.monthlyFee ?? ''), admissionFee: String(c.admissionFee ?? ''),
      duration: c.duration ?? '', ageGroup: c.ageGroup ?? '', level: c.level ?? '',
      color: c.color ?? COLORS[0], icon: c.icon ?? 'book', description: c.description ?? '',
    });
    setErr('');
    setModal({ open: true, mode: 'edit', item: c });
  };
  const close = () => setModal({ open: false, mode: 'add' });
  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, monthlyFee: Number(form.monthlyFee) || 0, admissionFee: Number(form.admissionFee) || 0 };
      if (modal.mode === 'add') await apiClient.post('/admin/subjects', payload);
      else await apiClient.put(`/admin/subjects/${modal.item._id}`, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminSubjects'] }); close(); },
    onError: (e: any) => setErr(e?.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin/subjects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminSubjects'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Failed'),
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Courses"
        subtitle={`${(courses as any[]).length} courses offered`}
        action={<button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Course</button>}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (courses as any[]).length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses yet" description="Add your first course to get started." action={<button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Course</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(courses as any[]).map((c: any) => (
            <div key={c._id} className="card hover:shadow-medium transition-shadow duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (c.color ?? '#888') + '20' }}>
                    <BookOpen className="w-5 h-5" style={{ color: c.color ?? '#888' }} />
                  </div>
                  <div>
                    <p className="font-bold text-text text-sm leading-tight">{c.name}</p>
                    <p className="text-xs font-mono text-text-light mt-0.5">{c.code}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="btn-ghost !px-2 !py-1.5" onClick={() => openEdit(c)}><Edit2 className="w-3.5 h-3.5" /></button>
                  <button className="btn-ghost !px-2 !py-1.5 hover:!text-error hover:!bg-red-50" onClick={() => { if (confirm(`Remove "${c.name}"?`)) deleteMutation.mutate(c._id); }}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {c.description && <p className="text-xs text-text-secondary line-clamp-2 mb-3">{c.description}</p>}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color ?? '#888' }} />
                  <span className="text-xs text-text-light">{c.isActive !== false ? 'Active' : 'Inactive'}</span>
                </div>
                {(c.monthlyFee ?? 0) > 0 && (
                  <span className="text-xs font-bold text-text">₹{Number(c.monthlyFee).toLocaleString('en-IN')}<span className="font-medium text-text-light">/mo</span></span>
                )}
              </div>
            </div>
          ))}

          <button onClick={openAdd} className="card border-2 border-dashed !border-border flex flex-col items-center justify-center py-10 hover:border-primary/50 hover:bg-primary-bg/20 text-text-light hover:text-primary transition-all duration-200 min-h-[120px]">
            <Plus className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-semibold">Add Course</span>
          </button>
        </div>
      )}

      <Modal open={modal.open} onClose={close} title={modal.mode === 'add' ? 'Add Course' : 'Edit Course'}
        footer={<div className="flex gap-3"><button className="btn-outline flex-1" onClick={close}>Cancel</button><button className="btn-primary flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save'}</button></div>}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Course Name</label>
            <input className="input-field" value={form.name} onChange={f('name')} placeholder="e.g. Robotics & Electronics" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Course Code</label>
              <input className="input-field uppercase" value={form.code} onChange={f('code')} placeholder="CR, ROB, CHESS…" />
            </div>
            <div>
              <label className="label">Icon</label>
              <input className="input-field" value={form.icon} onChange={f('icon')} placeholder="book, code…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Monthly Fee (₹)</label>
              <input className="input-field" type="number" value={form.monthlyFee} onChange={f('monthlyFee')} placeholder="0" />
            </div>
            <div>
              <label className="label">Admission Fee (₹)</label>
              <input className="input-field" type="number" value={form.admissionFee} onChange={f('admissionFee')} placeholder="0" />
            </div>
          </div>
          <p className="text-[11px] text-text-light -mt-2">Fees are auto-assigned to a student's parent the moment they're enrolled in this course.</p>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Duration</label><input className="input-field" value={form.duration} onChange={f('duration')} placeholder="3 months" /></div>
            <div><label className="label">Age Group</label><input className="input-field" value={form.ageGroup} onChange={f('ageGroup')} placeholder="5–12 yrs" /></div>
            <div><label className="label">Level</label><input className="input-field" value={form.level} onChange={f('level')} placeholder="Beginner" /></div>
          </div>
          <div>
            <label className="label">Brand Color</label>
            <div className="flex gap-2 flex-wrap mt-1.5">
              {COLORS.map(col => (
                <button key={col} type="button" onClick={() => setForm(p => ({ ...p, color: col }))}
                  className="w-7 h-7 rounded-full ring-offset-2 transition-all" style={{ backgroundColor: col, outline: form.color === col ? `2px solid ${col}` : undefined, outlineOffset: form.color === col ? '2px' : undefined }} />
              ))}
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field resize-none" rows={3} value={form.description} onChange={f('description') as any} placeholder="Brief description…" />
          </div>
          {err && <p className="text-xs text-error bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
