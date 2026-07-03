import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, GraduationCap } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';

const EMPTY = { name: '', phone: '', email: '', password: '', employeeId: '', qualification: '', experience: '', specialization: '' };

const FIELDS: [string, keyof typeof EMPTY, string, number?][] = [
  ['Full Name', 'name', 'text'],
  ['Phone', 'phone', 'tel'],
  ['Email', 'email', 'email'],
  ['Employee ID', 'employeeId', 'text'],
  ['Qualification', 'qualification', 'text'],
  ['Experience (years)', 'experience', 'number'],
  ['Specialization', 'specialization', 'text', 2],
];

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

  const filtered = (teachers as any[]).filter(t =>
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
  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

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

  return (
    <div className="page-container">
      <PageHeader
        title="Teachers"
        subtitle={`${(teachers as any[]).length} instructors`}
        action={<button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Teacher</button>}
      />

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border-light">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or employee ID…" className="w-full sm:w-72" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-background border-b border-border-light">
              <tr>
                {['Teacher', 'Emp ID', 'Specialization', 'Batches', 'Experience', 'Status', ''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState icon={GraduationCap} title="No teachers found" description={search ? 'Try a different search term.' : 'Add your first teacher to get started.'} action={!search ? <button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Teacher</button> : undefined} />
                </td></tr>
              ) : filtered.map((t: any) => (
                <tr key={t._id} className="border-b border-border-light last:border-0 hover:bg-background/60 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">
                        {(t.name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-text text-sm">{t.name}</p>
                        <p className="text-xs text-text-light">{t.email || t.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs text-text-secondary">{t.profile?.employeeId ?? '—'}</td>
                  <td className="table-cell text-sm text-text-secondary max-w-40 truncate">{t.profile?.specialization ?? '—'}</td>
                  <td className="table-cell">
                    <span className="badge badge-purple">{t.profile?.batches?.length ?? 0} batches</span>
                  </td>
                  <td className="table-cell text-sm text-text-secondary">{t.profile?.experience ?? 0} yrs</td>
                  <td className="table-cell">
                    <span className={t.isActive ? 'badge badge-green' : 'badge badge-red'}>{t.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost !px-2 !py-1.5" onClick={() => openEdit(t)} title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="btn-ghost !px-2 !py-1.5 hover:!text-error hover:!bg-red-50" onClick={() => { if (confirm('Delete this teacher?')) deleteMutation.mutate(t._id); }} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
        title={modal.mode === 'add' ? 'Add Teacher' : 'Edit Teacher'}
        subtitle={modal.mode === 'add' ? 'Fill in the details to add a new instructor.' : `Editing ${modal.item?.name}`}
        footer={
          <div className="flex gap-3">
            <button className="btn-outline flex-1" onClick={close}>Cancel</button>
            <button className="btn-primary flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELDS.map(([label, key, type, span]) => (
            <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
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
          {err && <p className="sm:col-span-2 text-xs text-error bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
