import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, IndianRupee, Edit2, Trash2 } from 'lucide-react';
import apiClient from '../../api/client';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';

const FEE_TYPES = ['tuition', 'transport', 'activity', 'exam', 'other'];
const STATUS_BADGE: Record<string, string> = {
  paid: 'badge-green', pending: 'badge-orange', overdue: 'badge-red', partial: 'badge-blue',
};
const EMPTY = { title: '', amount: '', discount: '0', feeType: 'tuition', dueDate: '', childId: '', parentId: '', month: '', academicYear: '2025-26' };

export default function FeeStructure() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: any }>({ open: false, mode: 'add' });
  const [form, setForm] = useState({ ...EMPTY });
  const [err, setErr] = useState('');

  const { data: feesData = [], isLoading } = useQuery({
    queryKey: ['adminFees', statusFilter],
    queryFn: async () => (await apiClient.get(`/fees${statusFilter ? `?status=${statusFilter}` : ''}`)).data.data ?? [],
  });

  const { data: children = [] } = useQuery({
    queryKey: ['adminChildrenMin'],
    queryFn: async () => (await apiClient.get('/admin/children')).data.data ?? [],
  });

  const fees = (feesData as any[]).filter(f =>
    (f.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (f.child?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = fees.filter(f => ['pending', 'overdue'].includes(f.status)).reduce((s, f) => s + (f.finalAmount ?? 0), 0);
  const totalCollected = fees.filter(f => f.status === 'paid').reduce((s, f) => s + (f.paidAmount ?? 0), 0);

  const openAdd = () => { setForm({ ...EMPTY }); setErr(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (fee: any) => {
    setForm({ title: fee.title, amount: String(fee.amount), discount: String(fee.discount ?? 0), feeType: fee.feeType, dueDate: fee.dueDate?.slice(0, 10) ?? '', childId: fee.child?._id ?? '', parentId: fee.parent ?? '', month: fee.month ?? '', academicYear: fee.academicYear ?? '2025-26' });
    setErr('');
    setModal({ open: true, mode: 'edit', item: fee });
  };
  const close = () => setModal({ open: false, mode: 'add' });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const amt = Number(form.amount), disc = Number(form.discount);
      const payload = { title: form.title, amount: amt, discount: disc, finalAmount: amt - disc, feeType: form.feeType, dueDate: form.dueDate, child: form.childId, parent: form.parentId || undefined, month: form.month, academicYear: form.academicYear };
      modal.mode === 'add' ? await apiClient.post('/fees', payload) : await apiClient.put(`/fees/${modal.item._id}`, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminFees'] }); close(); },
    onError: (e: any) => setErr(e?.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.put(`/fees/${id}`, { status: 'overdue' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminFees'] }),
    onError: (e: any) => alert(e?.response?.data?.message || 'Failed'),
  });

  const recordPayment = async (fee: any) => {
    if (!confirm(`Record full payment of ₹${fee.finalAmount} for ${fee.title}?`)) return;
    try {
      await apiClient.post(`/fees/${fee._id}/payment`, { amount: fee.finalAmount, paymentMode: 'cash' });
      qc.invalidateQueries({ queryKey: ['adminFees'] });
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed'); }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const onChildChange = (childId: string) => {
    const child = (children as any[]).find((c: any) => c._id === childId);
    setForm(p => ({ ...p, childId, parentId: child?.parent?._id ?? '' }));
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Fee Management"
        subtitle="Create and track student course fees"
        action={<button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Fee</button>}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"><IndianRupee className="w-5 h-5 text-error" /></div>
          <div><p className="text-xs text-text-secondary font-medium">Total Pending</p><p className="text-xl font-bold text-error">₹{totalPending.toLocaleString('en-IN')}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0"><IndianRupee className="w-5 h-5 text-success" /></div>
          <div><p className="text-xs text-text-secondary font-medium">Collected</p><p className="text-xl font-bold text-success">₹{totalCollected.toLocaleString('en-IN')}</p></div>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border-light flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by title or student…" className="flex-1 sm:max-w-72" />
          <select className="select-field sm:w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-background border-b border-border-light">
              <tr>{['Title', 'Student', 'Amount', 'Due Date', 'Status', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={6} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              : fees.length === 0 ? <tr><td colSpan={6}><EmptyState icon={IndianRupee} title="No fee records" description={search ? 'Try a different search.' : 'Add the first fee record to get started.'} action={!search ? <button className="btn-primary" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Fee</button> : undefined} /></td></tr>
              : fees.map((fee: any) => (
                <tr key={fee._id} className="border-b border-border-light last:border-0 hover:bg-background/60 transition-colors">
                  <td className="table-cell">
                    <p className="font-semibold text-text">{fee.title}</p>
                    <p className="text-xs text-text-light capitalize">{fee.feeType}</p>
                  </td>
                  <td className="table-cell text-sm text-text-secondary">{fee.child?.name ?? '—'}</td>
                  <td className="table-cell">
                    <p className="font-bold text-text">₹{(fee.finalAmount ?? 0).toLocaleString('en-IN')}</p>
                    {(fee.discount ?? 0) > 0 && <p className="text-xs text-success">−₹{fee.discount}</p>}
                  </td>
                  <td className="table-cell text-sm text-text-secondary">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td className="table-cell"><span className={`badge ${STATUS_BADGE[fee.status] ?? 'badge-gray'} capitalize`}>{fee.status}</span></td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      {fee.status !== 'paid' && (
                        <button className="btn-ghost !px-2.5 !py-1 !text-success !text-[11px] hover:!bg-emerald-50" onClick={() => recordPayment(fee)}>Mark Paid</button>
                      )}
                      <button className="btn-ghost !px-2 !py-1.5" onClick={() => openEdit(fee)}><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="btn-ghost !px-2 !py-1.5 hover:!text-error hover:!bg-red-50" onClick={() => { if (confirm('Mark as overdue?')) deleteMutation.mutate(fee._id); }}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal.open} onClose={close} title={modal.mode === 'add' ? 'Add Fee Record' : 'Edit Fee Record'}
        footer={<div className="flex gap-3"><button className="btn-outline flex-1" onClick={close}>Cancel</button><button className="btn-primary flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save'}</button></div>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Fee Title</label><input className="input-field" value={form.title} onChange={f('title')} placeholder="e.g. Robotics Course Fee — July 2025" /></div>
          <div><label className="label">Student</label>
            <select className="select-field" value={form.childId} onChange={e => onChildChange(e.target.value)}>
              <option value="">Select student</option>
              {(children as any[]).map((c: any) => <option key={c._id} value={c._id}>{c.name} ({c.section})</option>)}
            </select>
          </div>
          <div><label className="label">Fee Type</label>
            <select className="select-field" value={form.feeType} onChange={f('feeType')}>
              {FEE_TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div><label className="label">Amount (₹)</label><input className="input-field" type="number" value={form.amount} onChange={f('amount')} placeholder="0" /></div>
          <div><label className="label">Discount (₹)</label><input className="input-field" type="number" value={form.discount} onChange={f('discount')} placeholder="0" /></div>
          <div className="sm:col-span-2 px-3 py-2 bg-background rounded-xl text-sm text-text-secondary border border-border-light">
            Final Amount: <strong className="text-text">₹{(Number(form.amount) - Number(form.discount)).toLocaleString('en-IN')}</strong>
          </div>
          <div><label className="label">Due Date</label><input className="input-field" type="date" value={form.dueDate} onChange={f('dueDate')} /></div>
          <div><label className="label">Month</label><input className="input-field" value={form.month} onChange={f('month')} placeholder="June 2025" /></div>
          {err && <p className="sm:col-span-2 text-xs text-error bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
