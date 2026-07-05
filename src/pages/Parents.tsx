import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';

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

  const filtered = (parents as any[]).filter(p =>
    (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.phone ?? '').includes(search)
  );

  const openAdd = () => { setForm({ ...EMPTY }); setErr(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (p: any) => {
    setForm({ name: p.name, phone: p.phone, email: p.email ?? '', occupation: p.profile?.occupation ?? '', password: '' });
    setErr('');
    setModal({ open: true, mode: 'edit', item: p });
  };
  const close = () => setModal({ open: false, mode: 'add' });
  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
    setForm(p => ({ ...p, [k]: val }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!/^[6-9]\d{9}$/.test(form.phone)) throw new Error('Enter a valid 10-digit mobile number (starting 6-9) — this is how the parent signs into the app.');
      if (modal.mode === 'add') await apiClient.post('/admin/parents', form);
      else { const { password, ...rest } = form; await apiClient.put(`/admin/parents/${modal.item._id}`, rest); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminParents'] }); close(); },
    onError: (e: any) => setErr(e?.response?.data?.errors?.[0]?.message || e?.response?.data?.message || e?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/admin/parents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminParents'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Delete failed'),
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Parents"
        subtitle={`${(parents as any[]).length} registered parents`}
        action={<button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Parent</button>}
      />

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border-light">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or phone…" className="w-full sm:w-72" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-background border-b border-border-light">
              <tr>
                {['Parent', 'Contact', 'Occupation', 'Children', 'Status', ''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <EmptyState icon={Users} title="No parents found" description={search ? 'Try a different search.' : 'Add your first parent to get started.'} action={!search ? <button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Parent</button> : undefined} />
                </td></tr>
              ) : filtered.map((p: any) => (
                <tr key={p._id} className="border-b border-border-light last:border-0 hover:bg-background/60 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-bg flex items-center justify-center text-xs font-bold text-primary-dark flex-shrink-0">
                        {(p.name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <p className="font-semibold text-text text-sm">{p.name}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm text-text">{p.phone}</p>
                    <p className="text-xs text-text-light">{p.email || '—'}</p>
                  </td>
                  <td className="table-cell text-sm text-text-secondary">{p.profile?.occupation || '—'}</td>
                  <td className="table-cell">
                    <span className="badge badge-blue">{p.profile?.children?.length ?? 0} kids</span>
                  </td>
                  <td className="table-cell">
                    <span className={p.isActive ? 'badge badge-green' : 'badge badge-red'}>{p.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost !px-2 !py-1.5" onClick={() => openEdit(p)} title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="btn-ghost !px-2 !py-1.5 hover:!text-error hover:!bg-red-50" onClick={() => { if (confirm('Delete this parent?')) deleteMutation.mutate(p._id); }} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal.open}
        onClose={close}
        title={modal.mode === 'add' ? 'Add Parent' : 'Edit Parent'}
        footer={
          <div className="flex gap-3">
            <button className="btn-outline flex-1" onClick={close}>Cancel</button>
            <button className="btn-primary flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {([['Full Name', 'name', 'text'], ['Phone (10 digits)', 'phone', 'tel'], ['Email', 'email', 'email'], ['Occupation', 'occupation', 'text']] as [string, keyof typeof EMPTY, string][]).map(([label, key, type]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                className="input-field"
                type={type}
                value={form[key]}
                onChange={f(key)}
                placeholder={label}
                {...(key === 'phone' ? { maxLength: 10, inputMode: 'numeric' as const } : {})}
              />
            </div>
          ))}
          {modal.mode === 'add' && (
            <div>
              <label className="label">Password</label>
              <input className="input-field" type="password" value={form.password} onChange={f('password')} placeholder="Leave blank to auto-generate" />
            </div>
          )}
          {err && <p className="text-xs text-error bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
