import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import apiClient from '../api/client';

const EMPTY = { name: '', dateOfBirth: '', gender: 'male', class: 'Beginner', section: 'ROB', parentId: '', batchId: '', bloodGroup: '', admissionNumber: '' };

export default function Children() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: any }>({ open: false, mode: 'add' });
  const [form, setForm] = useState({ ...EMPTY });
  const [err, setErr] = useState('');

  const { data: children = [], isLoading } = useQuery({
    queryKey: ['adminChildren'],
    queryFn: async () => (await apiClient.get('/admin/children')).data.data ?? [],
  });

  // API returns: { _id, name, dateOfBirth, class, section, admissionNumber, parent: {_id,name,phone}, batch: {_id,name}, teacher: {_id,name} }
  const filtered = (children as any[]).filter((c) =>
    (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.admissionNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.section ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const { data: parents = [] } = useQuery({ queryKey: ['adminParents'], queryFn: async () => (await apiClient.get('/admin/parents')).data.data ?? [] });
  const { data: batches = [] } = useQuery({ queryKey: ['adminBatches'], queryFn: async () => (await apiClient.get('/admin/batches')).data.data ?? [] });

  const openAdd = () => { setForm({ ...EMPTY }); setErr(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (c: any) => {
    setForm({ name: c.name, dateOfBirth: c.dateOfBirth?.slice(0, 10) ?? '', gender: c.gender ?? 'male', class: c.class ?? 'Beginner', section: c.section ?? '', parentId: c.parent?._id ?? '', batchId: c.batch?._id ?? '', bloodGroup: c.bloodGroup ?? '', admissionNumber: c.admissionNumber ?? '' });
    setErr('');
    setModal({ open: true, mode: 'edit', item: c });
  };
  const close = () => setModal({ open: false, mode: 'add' });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (modal.mode === 'add') await apiClient.post('/admin/children', form);
      else await apiClient.put(`/admin/children/${modal.item._id}`, form);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminChildren'] }); close(); },
    onError: (e: any) => setErr(e?.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin/children/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminChildren'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Failed'),
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Students</h1>
          <p className="text-sm text-text-secondary mt-1">{(children as any[]).length} enrolled students</p>
        </div>
        <button className="btn-primary flex items-center" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />Enroll Student
        </button>
      </div>

      <div className="card flex-1 flex flex-col min-h-0">
        <div className="relative w-72 mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input className="input-field pl-9 py-2" placeholder="Search by name, ID or course..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>{['Student','Admission No','Level / Course','Batch','Parent','Status',''].map((h) => (
                <th key={h} className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-border-light">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? <tr><td colSpan={7} className="text-center py-10 text-text-secondary">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-text-secondary">No students found.</td></tr>
              : filtered.map((c: any) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-accent-blue font-bold flex items-center justify-center text-sm flex-shrink-0">{(c.name?.[0] ?? '?').toUpperCase()}</div>
                      <div>
                        <p className="font-medium text-text">{c.name}</p>
                        <p className="text-xs text-text-secondary">{new Date(c.dateOfBirth).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm text-text-secondary">{c.admissionNumber ?? '—'}</td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-text">{c.class}</p>
                    <p className="text-xs text-text-secondary">{c.section}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{c.batch?.name ?? 'Unassigned'}</td>
                  {/* parent is populated User object directly */}
                  <td className="py-3 px-4 text-sm text-text-secondary">{c.parent?.name ?? '—'}</td>
                  <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.isActive !== false ? 'Active' : 'Archived'}</span></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 hover:text-primary text-text-light" onClick={() => openEdit(c)}><Edit2 className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:text-error text-text-light" onClick={() => { if (confirm('Permanently delete this student?')) deleteMutation.mutate(c._id); }}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-medium w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border-light sticky top-0 bg-surface">
              <h2 className="text-lg font-bold text-text">{modal.mode === 'add' ? 'Enroll Student' : 'Edit Student'}</h2>
              <button onClick={close}><X className="w-5 h-5 text-text-light" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Full Name</label><input className="input-field" value={form.name} onChange={f('name')} placeholder="Student full name" /></div>
              <div><label className="label">Date of Birth</label><input className="input-field" type="date" value={form.dateOfBirth} onChange={f('dateOfBirth')} /></div>
              <div><label className="label">Gender</label>
                <select className="input-field" value={form.gender} onChange={f('gender')}>
                  <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select>
              </div>
              <div><label className="label">Level</label>
                <select className="input-field" value={form.class} onChange={f('class')}>
                  {['Beginner','Intermediate','Advanced','Pro'].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div><label className="label">Course Code</label><input className="input-field" value={form.section} onChange={f('section')} placeholder="ROB / CODE / CHESS..." /></div>
              <div><label className="label">Parent</label>
                <select className="input-field" value={form.parentId} onChange={f('parentId')}>
                  <option value="">Select parent</option>
                  {(parents as any[]).map((p: any) => <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>)}
                </select>
              </div>
              <div><label className="label">Batch</label>
                <select className="input-field" value={form.batchId} onChange={f('batchId')}>
                  <option value="">Select batch</option>
                  {(batches as any[]).map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className="label">Blood Group</label><input className="input-field" value={form.bloodGroup} onChange={f('bloodGroup')} placeholder="A+, B+, O+..." /></div>
              <div><label className="label">Admission No</label><input className="input-field" value={form.admissionNumber} onChange={f('admissionNumber')} placeholder="ARK-2025-XXX" /></div>
              {err && <p className="col-span-2 text-error text-sm">{err}</p>}
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
