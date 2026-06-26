import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import apiClient from '../api/client';

const EMPTY = { name: '', phone: '', email: '', occupation: '', password: '' };

export default function Parents() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: any }>({ open: false, mode: 'add' });
  const [form, setForm] = useState({ ...EMPTY });
  const [err, setErr] = useState('');

  const { data: parents = [], isLoading } = useQuery({
    queryKey: ['adminParents'],
    queryFn: async () => (await apiClient.get('/admin/parents')).data.data ?? [],
  });

  // API returns flat user: { _id, name, email, phone, isActive, profile: { occupation, children } }
  const filtered = (parents as any[]).filter((p) =>
    (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.phone ?? '').includes(search)
  );

  const openAdd = () => { setForm({ ...EMPTY }); setErr(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (p: any) => {
    setForm({ name: p.name, phone: p.phone, email: p.email ?? '', occupation: p.profile?.occupation ?? '', password: '' });
    setErr('');
    setModal({ open: true, mode: 'edit', item: p });
  };
  const closeModal = () => setModal({ open: false, mode: 'add' });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (modal.mode === 'add') {
        await apiClient.post('/admin/parents', form);
      } else {
        const { password, ...rest } = form;
        await apiClient.put(`/admin/parents/${modal.item._id}`, rest);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminParents'] }); closeModal(); },
    onError: (e: any) => setErr(e?.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin/parents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminParents'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Delete failed'),
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Parents</h1>
          <p className="text-sm text-text-secondary mt-1">{(parents as any[]).length} registered parents</p>
        </div>
        <button className="btn-primary flex items-center" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />Add Parent
        </button>
      </div>

      <div className="card flex-1 flex flex-col min-h-0">
        <div className="relative w-72 mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input className="input-field pl-9 py-2" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 sticky top-0">
              <tr>{['Name','Contact','Occupation','Children','Status',''].map((h) => (
                <th key={h} className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-border-light">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? <tr><td colSpan={6} className="text-center py-10 text-text-secondary">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-text-secondary">No parents found.</td></tr>
              : filtered.map((p: any) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-bg text-primary-dark font-bold flex items-center justify-center text-sm flex-shrink-0">{(p.name?.[0] ?? '?').toUpperCase()}</div>
                      <span className="font-medium text-text">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4"><div className="text-sm text-text">{p.phone}</div><div className="text-xs text-text-secondary">{p.email}</div></td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{p.profile?.occupation || '—'}</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 bg-blue-50 text-accent-blue text-xs font-bold rounded-full">{p.profile?.children?.length ?? 0}</span></td>
                  <td className="py-3 px-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 hover:text-primary text-text-light transition-colors" onClick={() => openEdit(p)}><Edit2 className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:text-error text-text-light transition-colors" onClick={() => { if (confirm('Deactivate this parent?')) deleteMutation.mutate(p._id); }}><Trash2 className="w-4 h-4" /></button>
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
          <div className="bg-surface rounded-2xl shadow-medium w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border-light">
              <h2 className="text-lg font-bold text-text">{modal.mode === 'add' ? 'Add Parent' : 'Edit Parent'}</h2>
              <button onClick={closeModal} className="text-text-light hover:text-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[['Full Name','name','text'],['Phone (10 digits)','phone','tel'],['Email','email','email'],['Occupation','occupation','text']] .map(([label, key, type]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input className="input-field" type={type} value={(form as any)[key]} onChange={f(key as any)} placeholder={label} />
                </div>
              ))}
              {modal.mode === 'add' && (
                <div>
                  <label className="label">Password (optional)</label>
                  <input className="input-field" type="password" value={form.password} onChange={f('password')} placeholder="Leave blank to auto-generate" />
                </div>
              )}
              {err && <p className="text-error text-sm">{err}</p>}
            </div>
            <div className="flex gap-3 p-6 border-t border-border-light">
              <button className="btn-outline flex-1" onClick={closeModal}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
