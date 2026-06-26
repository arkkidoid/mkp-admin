import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import apiClient from '../api/client';

const EMPTY = { name: '', phone: '', email: '', password: '', employeeId: '', qualification: '', experience: '', specialization: '' };

export default function Teachers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: any }>({ open: false, mode: 'add' });
  const [form, setForm] = useState({ ...EMPTY });
  const [err, setErr] = useState('');

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['adminTeachers'],
    queryFn: async () => (await apiClient.get('/admin/teachers')).data.data ?? [],
  });

  // API returns flat user: { _id, name, email, phone, isActive, profile: { employeeId, qualification, experience, specialization, batches } }
  const filtered = (teachers as any[]).filter((t) =>
    (t.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.profile?.employeeId ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({ ...EMPTY }); setErr(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (t: any) => {
    setForm({ name: t.name, phone: t.phone, email: t.email ?? '', password: '', employeeId: t.profile?.employeeId ?? '', qualification: t.profile?.qualification ?? '', experience: String(t.profile?.experience ?? ''), specialization: t.profile?.specialization ?? '' });
    setErr('');
    setModal({ open: true, mode: 'edit', item: t });
  };
  const close = () => setModal({ open: false, mode: 'add' });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, experience: Number(form.experience) };
      if (modal.mode === 'add') await apiClient.post('/admin/teachers', payload);
      else { const { password, ...rest } = payload; await apiClient.put(`/admin/teachers/${modal.item._id}`, rest); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminTeachers'] }); close(); },
    onError: (e: any) => setErr(e?.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin/teachers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminTeachers'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Delete failed'),
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text">Instructors</h1>
          <p className="text-sm text-text-secondary mt-0.5">{(teachers as any[]).length} instructors</p>
        </div>
        <button className="btn-primary flex items-center self-start sm:self-auto" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />Add Instructor
        </button>
      </div>

      <div className="card flex-1 flex flex-col min-h-0 !p-3 md:!p-6">
        <div className="relative w-full sm:w-72 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input className="input-field pl-9 py-2" placeholder="Search by name or employee ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr>{['Instructor','Emp ID','Specialization','Batches','Exp','Status',''].map((h) => (
                <th key={h} className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-border-light">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? <tr><td colSpan={7} className="text-center py-10 text-text-secondary">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-text-secondary">No instructors found.</td></tr>
              : filtered.map((t: any) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-accent-purple font-bold flex items-center justify-center text-sm flex-shrink-0">{(t.name?.[0] ?? '?').toUpperCase()}</div>
                      <div>
                        <p className="font-medium text-text">{t.name}</p>
                        <p className="text-xs text-text-secondary">{t.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-sm text-text-secondary">{t.profile?.employeeId ?? '—'}</td>
                  <td className="py-3 px-4 text-sm text-text max-w-48 truncate">{t.profile?.specialization ?? '—'}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 bg-purple-50 text-accent-purple text-xs font-bold rounded-full">{t.profile?.batches?.length ?? 0}</span></td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{t.profile?.experience ?? 0} yrs</td>
                  <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 hover:text-primary text-text-light transition-colors" onClick={() => openEdit(t)}><Edit2 className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:text-error text-text-light transition-colors" onClick={() => { if (confirm('Permanently delete this teacher?')) deleteMutation.mutate(t._id); }}><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-text">{modal.mode === 'add' ? 'Add Instructor' : 'Edit Instructor'}</h2>
              <button onClick={close}><X className="w-5 h-5 text-text-light" /></button>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([['Full Name','name','text'],['Phone','phone','tel'],['Email','email','email'],['Employee ID','employeeId','text'],['Qualification','qualification','text'],['Experience (years)','experience','number'],['Specialization','specialization','text']] as [string,keyof typeof form,string][]).map(([label, key, type]) => (
                <div key={key} className={key === 'specialization' ? 'sm:col-span-2' : ''}>
                  <label className="label">{label}</label>
                  <input className="input-field" type={type} value={form[key]} onChange={f(key)} placeholder={label} />
                </div>
              ))}
              {modal.mode === 'add' && (
                <div className="sm:col-span-2">
                  <label className="label">Password</label>
                  <input className="input-field" type="password" value={form.password} onChange={f('password')} placeholder="Temporary password" />
                </div>
              )}
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
