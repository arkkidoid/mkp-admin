import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EMPTY = { name: '', teacherId: '', subjectId: '', classroom: '', capacity: '20', academicYear: '2025-26', startTime: '09:00', endTime: '11:00', scheduleDays: [] as string[] };

export default function Batches() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: any }>({ open: false, mode: 'add' });
  const [form, setForm] = useState({ ...EMPTY });
  const [err, setErr] = useState('');

  const { data: batches = [], isLoading } = useQuery({ queryKey: ['adminBatches'], queryFn: async () => (await apiClient.get('/admin/batches')).data.data ?? [] });
  const { data: teachers = [] } = useQuery({ queryKey: ['adminTeachers'], queryFn: async () => (await apiClient.get('/admin/teachers')).data.data ?? [] });
  const { data: subjects = [] } = useQuery({ queryKey: ['adminSubjects'], queryFn: async () => (await apiClient.get('/admin/subjects')).data.data ?? [] });

  const filtered = (batches as any[]).filter(b =>
    (b.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (b.classroom ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (b.teacher?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({ ...EMPTY }); setErr(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (b: any) => {
    const s = b.schedule?.[0] ?? {};
    setForm({ name: b.name, teacherId: b.teacher?._id ?? '', subjectId: b.subject?._id ?? '', classroom: b.classroom ?? '', capacity: String(b.capacity ?? 20), academicYear: b.academicYear ?? '2025-26', startTime: s.startTime ?? '09:00', endTime: s.endTime ?? '11:00', scheduleDays: b.schedule?.map((x: any) => x.day) ?? [] });
    setErr('');
    setModal({ open: true, mode: 'edit', item: b });
  };
  const close = () => setModal({ open: false, mode: 'add' });
  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const toggleDay = (day: string) => setForm(p => ({ ...p, scheduleDays: p.scheduleDays.includes(day) ? p.scheduleDays.filter(d => d !== day) : [...p.scheduleDays, day] }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, classroom: form.classroom, capacity: Number(form.capacity), academicYear: form.academicYear, teacherId: form.teacherId, subjectId: form.subjectId, schedule: form.scheduleDays.map(day => ({ day, startTime: form.startTime, endTime: form.endTime })) };
      if (modal.mode === 'add') await apiClient.post('/admin/batches', payload);
      else await apiClient.put(`/admin/batches/${modal.item._id}`, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminBatches'] }); close(); },
    onError: (e: any) => setErr(e?.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin/batches/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminBatches'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Failed'),
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Batches"
        subtitle={`${(batches as any[]).length} active batches`}
        action={<button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Create Batch</button>}
      />

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border-light">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, room, or teacher…" className="w-full sm:w-72" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-background border-b border-border-light">
              <tr>{['Batch', 'Teacher', 'Course', 'Room', 'Students', 'Schedule', 'Status', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={8} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8}><EmptyState icon={Layers} title="No batches found" description={search ? 'Try a different search.' : 'Create your first batch.'} action={!search ? <button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Create Batch</button> : undefined} /></td></tr>
              : filtered.map((b: any) => (
                <tr key={b._id} className="border-b border-border-light last:border-0 hover:bg-background/60 transition-colors">
                  <td className="table-cell font-semibold text-text">{b.name}</td>
                  <td className="table-cell text-sm text-text-secondary">{b.teacher?.name ?? <span className="text-text-light">Unassigned</span>}</td>
                  <td className="table-cell">
                    {b.subject
                      ? <span className="badge" style={{ backgroundColor: (b.subject.color ?? '#888') + '20', color: b.subject.color ?? '#888' }}>{b.subject.name}</span>
                      : <span className="text-text-light text-sm">—</span>}
                  </td>
                  <td className="table-cell text-sm text-text-secondary">{b.classroom || '—'}</td>
                  <td className="table-cell text-sm"><span className="font-semibold text-text">{b.children?.length ?? 0}</span><span className="text-text-light">/{b.capacity}</span></td>
                  <td className="table-cell text-xs text-text-secondary">{b.schedule?.map((s: any) => s.day).join(', ') || '—'}</td>
                  <td className="table-cell"><span className={b.isActive !== false ? 'badge badge-green' : 'badge badge-red'}>{b.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost !px-2 !py-1.5" onClick={() => openEdit(b)}><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="btn-ghost !px-2 !py-1.5 hover:!text-error hover:!bg-red-50" onClick={() => { if (confirm('Delete this batch?')) deleteMutation.mutate(b._id); }}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal.open} onClose={close} title={modal.mode === 'add' ? 'Create Batch' : 'Edit Batch'}
        footer={<div className="flex gap-3"><button className="btn-outline flex-1" onClick={close}>Cancel</button><button className="btn-primary flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save'}</button></div>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Batch Name</label><input className="input-field" value={form.name} onChange={f('name')} placeholder="e.g. Robotics — Weekend" /></div>
          <div><label className="label">Teacher</label>
            <select className="select-field" value={form.teacherId} onChange={f('teacherId')}>
              <option value="">Select teacher</option>
              {(teachers as any[]).map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div><label className="label">Course</label>
            <select className="select-field" value={form.subjectId} onChange={f('subjectId')}>
              <option value="">Select course</option>
              {(subjects as any[]).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Classroom</label><input className="input-field" value={form.classroom} onChange={f('classroom')} placeholder="Lab 1, Room B2…" /></div>
          <div><label className="label">Capacity</label><input className="input-field" type="number" value={form.capacity} onChange={f('capacity')} /></div>
          <div><label className="label">Start Time</label><input className="input-field" type="time" value={form.startTime} onChange={f('startTime')} /></div>
          <div><label className="label">End Time</label><input className="input-field" type="time" value={form.endTime} onChange={f('endTime')} /></div>
          <div className="sm:col-span-2">
            <label className="label">Schedule Days</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {DAYS.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.scheduleDays.includes(d) ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary/50'}`}
                >{d}</button>
              ))}
            </div>
          </div>
          {err && <p className="sm:col-span-2 text-xs text-error bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
