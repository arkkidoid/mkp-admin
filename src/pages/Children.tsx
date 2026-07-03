import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';

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
  const { data: parents = [] } = useQuery({ queryKey: ['adminParents'], queryFn: async () => (await apiClient.get('/admin/parents')).data.data ?? [] });
  const { data: batches = [] } = useQuery({ queryKey: ['adminBatches'], queryFn: async () => (await apiClient.get('/admin/batches')).data.data ?? [] });

  const filtered = (children as any[]).filter(c =>
    (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.admissionNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.section ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({ ...EMPTY }); setErr(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (c: any) => {
    setForm({ name: c.name, dateOfBirth: c.dateOfBirth?.slice(0, 10) ?? '', gender: c.gender ?? 'male', class: c.class ?? 'Beginner', section: c.section ?? '', parentId: c.parent?._id ?? '', batchId: c.batch?._id ?? '', bloodGroup: c.bloodGroup ?? '', admissionNumber: c.admissionNumber ?? '' });
    setErr('');
    setModal({ open: true, mode: 'edit', item: c });
  };
  const close = () => setModal({ open: false, mode: 'add' });
  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

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
    onError: (e: any) => alert(e?.response?.data?.message || 'Delete failed'),
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Students"
        subtitle={`${(children as any[]).length} enrolled students`}
        action={<button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Enroll Student</button>}
      />

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border-light">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, admission no, or course…" className="w-full sm:w-80" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead className="bg-background border-b border-border-light">
              <tr>
                {['Student', 'Admission No', 'Level / Course', 'Batch', 'Parent', 'Status', ''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState icon={BookOpen} title="No students found" description={search ? 'Try a different search.' : 'Enroll your first student to get started.'} action={!search ? <button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Enroll Student</button> : undefined} />
                </td></tr>
              ) : filtered.map((c: any) => (
                <tr key={c._id} className="border-b border-border-light last:border-0 hover:bg-background/60 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                        {(c.name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-text text-sm">{c.name}</p>
                        <p className="text-xs text-text-light">{c.gender ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs text-text-secondary">{c.admissionNumber ?? '—'}</td>
                  <td className="table-cell">
                    <span className="badge badge-blue">{c.class ?? '—'} {c.section ? `· ${c.section}` : ''}</span>
                  </td>
                  <td className="table-cell text-sm text-text-secondary">{c.batch?.name ?? '—'}</td>
                  <td className="table-cell text-sm text-text-secondary">{c.parent?.name ?? '—'}</td>
                  <td className="table-cell">
                    <span className="badge badge-green">Active</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost !px-2 !py-1.5" onClick={() => openEdit(c)} title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="btn-ghost !px-2 !py-1.5 hover:!text-error hover:!bg-red-50" onClick={() => { if (confirm('Remove this student?')) deleteMutation.mutate(c._id); }} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
        title={modal.mode === 'add' ? 'Enroll Student' : 'Edit Student'}
        subtitle={modal.mode === 'edit' ? `Editing ${modal.item?.name}` : undefined}
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
          <div className="sm:col-span-2">
            <label className="label">Full Name</label>
            <input className="input-field" value={form.name} onChange={f('name')} placeholder="Student name" />
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input className="input-field" type="date" value={form.dateOfBirth} onChange={f('dateOfBirth')} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="select-field" value={form.gender} onChange={f('gender')}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Level / Class</label>
            <input className="input-field" value={form.class} onChange={f('class')} placeholder="e.g. Beginner" />
          </div>
          <div>
            <label className="label">Course / Section</label>
            <input className="input-field" value={form.section} onChange={f('section')} placeholder="e.g. ROB" />
          </div>
          <div>
            <label className="label">Admission Number</label>
            <input className="input-field" value={form.admissionNumber} onChange={f('admissionNumber')} placeholder="Auto-generated if blank" />
          </div>
          <div>
            <label className="label">Blood Group</label>
            <input className="input-field" value={form.bloodGroup} onChange={f('bloodGroup')} placeholder="e.g. O+" />
          </div>
          <div>
            <label className="label">Parent</label>
            <select className="select-field" value={form.parentId} onChange={f('parentId')}>
              <option value="">Select parent</option>
              {(parents as any[]).map((p: any) => <option key={p._id} value={p._id}>{p.name} — {p.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Batch</label>
            <select className="select-field" value={form.batchId} onChange={f('batchId')}>
              <option value="">Select batch</option>
              {(batches as any[]).map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          {err && <p className="sm:col-span-2 text-xs text-error bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
