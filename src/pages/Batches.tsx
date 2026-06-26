import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import apiClient from '../api/client';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const EMPTY = { name: '', teacherId: '', subjectId: '', classroom: '', capacity: '20', academicYear: '2025-26', startTime: '09:00', endTime: '11:00', scheduleDays: [] as string[] };

export default function Batches() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: any }>({ open: false, mode: 'add' });
  const [form, setForm] = useState({ ...EMPTY });
  const [err, setErr] = useState('');

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['adminBatches'],
    queryFn: async () => (await apiClient.get('/admin/batches')).data.data ?? [],
  });
  const { data: teachers = [] } = useQuery({ queryKey: ['adminTeachers'], queryFn: async () => (await apiClient.get('/admin/teachers')).data.data ?? [] });
  const { data: subjects = [] } = useQuery({ queryKey: ['adminSubjects'], queryFn: async () => (await apiClient.get('/admin/subjects')).data.data ?? [] });

  // API: { _id, name, classroom, capacity, isActive, teacher: {_id,name,phone}, subject: {_id,name,color}, children: [{_id,name}], schedule: [{day,startTime,endTime}] }
  const filtered = (batches as any[]).filter((b) =>
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

  const toggleDay = (day: string) => setForm((p) => ({ ...p, scheduleDays: p.scheduleDays.includes(day) ? p.scheduleDays.filter((d) => d !== day) : [...p.scheduleDays, day] }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, classroom: form.classroom, capacity: Number(form.capacity), academicYear: form.academicYear,
        teacherId: form.teacherId, subjectId: form.subjectId,
        schedule: form.scheduleDays.map((day) => ({ day, startTime: form.startTime, endTime: form.endTime })),
      };
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

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text">Batches</h1>
          <p className="text-sm text-text-secondary mt-0.5">{(batches as any[]).length} active batches</p>
        </div>
        <button className="btn-primary flex items-center self-start sm:self-auto" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />Create Batch
        </button>
      </div>

      <div className="card flex-1 flex flex-col min-h-0 !p-3 md:!p-6">
        <div className="relative w-full sm:w-72 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input className="input-field pl-9 py-2" placeholder="Search batches..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr>{['Batch Name','Instructor','Course','Room','Students','Schedule','Status',''].map((h) => (
                <th key={h} className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-border-light">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? <tr><td colSpan={8} className="text-center py-10 text-text-secondary">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="text-center py-10 text-text-secondary">No batches found.</td></tr>
              : filtered.map((b: any) => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-text">{b.name}</td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{b.teacher?.name ?? 'Unassigned'}</td>
                  <td className="py-3 px-4">
                    {b.subject ? (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ backgroundColor: (b.subject.color ?? '#ccc') + '25', color: b.subject.color ?? '#666' }}>
                        {b.subject.name}
                      </span>
                    ) : <span className="text-text-secondary text-sm">—</span>}
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{b.classroom}</td>
                  <td className="py-3 px-4 text-sm font-medium">{b.children?.length ?? 0}<span className="text-text-secondary font-normal">/{b.capacity}</span></td>
                  <td className="py-3 px-4 text-xs text-text-secondary">{b.schedule?.map((s: any) => s.day).join(', ') || '—'}</td>
                  <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${b.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{b.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 hover:text-primary text-text-light transition-colors" onClick={() => openEdit(b)}><Edit2 className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:text-error text-text-light transition-colors" onClick={() => { if (confirm('Deactivate this batch?')) deleteMutation.mutate(b._id); }}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-2xl shadow-medium w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border-light sticky top-0 bg-surface">
              <h2 className="text-lg font-bold text-text">{modal.mode === 'add' ? 'Create Batch' : 'Edit Batch'}</h2>
              <button onClick={close}><X className="w-5 h-5 text-text-light" /></button>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="label">Batch Name</label><input className="input-field" value={form.name} onChange={f('name')} placeholder="e.g. Robotics — Weekend Batch" /></div>
              <div><label className="label">Instructor</label>
                <select className="input-field" value={form.teacherId} onChange={f('teacherId')}>
                  <option value="">Select instructor</option>
                  {(teachers as any[]).map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div><label className="label">Course</label>
                <select className="input-field" value={form.subjectId} onChange={f('subjectId')}>
                  <option value="">Select course</option>
                  {(subjects as any[]).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="label">Classroom</label><input className="input-field" value={form.classroom} onChange={f('classroom')} placeholder="Lab 1, Room B2..." /></div>
              <div><label className="label">Capacity</label><input className="input-field" type="number" value={form.capacity} onChange={f('capacity')} /></div>
              <div><label className="label">Start Time</label><input className="input-field" type="time" value={form.startTime} onChange={f('startTime')} /></div>
              <div><label className="label">End Time</label><input className="input-field" type="time" value={form.endTime} onChange={f('endTime')} /></div>
              <div className="sm:col-span-2">
                <label className="label">Schedule Days</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {DAYS.map((d) => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${form.scheduleDays.includes(d) ? 'bg-primary text-white border-primary' : 'border-border-light text-text-secondary hover:border-primary'}`}
                    >{d}</button>
                  ))}
                </div>
              </div>
              {err && <p className="sm:col-span-2 text-error text-sm">{err}</p>}
            </div>
            <div className="flex gap-3 p-4 md:p-6 border-t border-border-light">
              <button className="btn-outline flex-1" onClick={close}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
