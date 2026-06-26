import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, X, IndianRupee } from 'lucide-react';
import apiClient from '../../api/client';

const FEE_TYPES = ['tuition','transport','activity','exam','other'];
const STATUS_CLASS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',  partial: 'bg-blue-100 text-blue-700',
};
const EMPTY = { title: '', amount: '', discount: '0', feeType: 'tuition', dueDate: '', childId: '', parentId: '', month: '', academicYear: '2025-26' };

export default function FeeStructure() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<{ open: boolean; mode: 'add'|'edit'; item?: any }>({ open: false, mode: 'add' });
  const [form, setForm] = useState({ ...EMPTY });
  const [err, setErr] = useState('');

  const { data: feesData = [], isLoading } = useQuery({
    queryKey: ['adminFees', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      return (await apiClient.get(`/fees${params}`)).data.data ?? [];
    },
  });

  const { data: children = [] } = useQuery({ queryKey: ['adminChildrenMin'], queryFn: async () => (await apiClient.get('/admin/children')).data.data ?? [] });

  const fees = (feesData as any[]).filter((f) =>
    (f.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (f.child?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = fees.filter((f) => ['pending','overdue'].includes(f.status)).reduce((s, f) => s + (f.finalAmount ?? 0), 0);
  const totalCollected = fees.filter((f) => f.status === 'paid').reduce((s, f) => s + (f.paidAmount ?? 0), 0);

  const openAdd = () => { setForm({ ...EMPTY }); setErr(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (fee: any) => {
    setForm({ title: fee.title, amount: String(fee.amount), discount: String(fee.discount ?? 0), feeType: fee.feeType, dueDate: fee.dueDate?.slice(0,10) ?? '', childId: fee.child?._id ?? '', parentId: fee.parent ?? '', month: fee.month ?? '', academicYear: fee.academicYear ?? '2025-26' });
    setErr('');
    setModal({ open: true, mode: 'edit', item: fee });
  };
  const close = () => setModal({ open: false, mode: 'add' });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const amt = Number(form.amount);
      const disc = Number(form.discount);
      const payload = { title: form.title, amount: amt, discount: disc, finalAmount: amt - disc, feeType: form.feeType, dueDate: form.dueDate, child: form.childId, parent: form.parentId || undefined, month: form.month, academicYear: form.academicYear };
      if (modal.mode === 'add') await apiClient.post('/fees', payload);
      else await apiClient.put(`/fees/${modal.item._id}`, payload);
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

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const onChildChange = (childId: string) => {
    const child = (children as any[]).find((c: any) => c._id === childId);
    setForm((p) => ({ ...p, childId, parentId: child?.parent?._id ?? '' }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text">Fee Management</h1>
          <p className="text-sm text-text-secondary mt-0.5">Create and track student course fees</p>
        </div>
        <button className="btn-primary flex items-center self-start sm:self-auto" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />Add Fee
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="card border border-border-light flex items-center gap-3 md:gap-4 !p-3 md:!p-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"><IndianRupee className="w-5 h-5 md:w-6 md:h-6 text-error" /></div>
          <div className="min-w-0"><p className="text-xs md:text-sm text-text-secondary truncate">Total Pending</p><p className="text-lg md:text-2xl font-bold text-error">₹{totalPending.toLocaleString('en-IN')}</p></div>
        </div>
        <div className="card border border-border-light flex items-center gap-3 md:gap-4 !p-3 md:!p-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><IndianRupee className="w-5 h-5 md:w-6 md:h-6 text-success" /></div>
          <div className="min-w-0"><p className="text-xs md:text-sm text-text-secondary truncate">Collected</p><p className="text-lg md:text-2xl font-bold text-success">₹{totalCollected.toLocaleString('en-IN')}</p></div>
        </div>
      </div>

      <div className="card border border-border-light flex flex-col min-h-0 !p-3 md:!p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input className="input-field pl-9 py-2 w-full" placeholder="Search by fee title or student..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input-field py-2 sm:w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr>{['Title','Student','Amount','Due Date','Status',''].map((h) => (
                <th key={h} className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-border-light">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading ? <tr><td colSpan={6} className="text-center py-10 text-text-secondary">Loading...</td></tr>
              : fees.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-text-secondary">No fee records found.</td></tr>
              : fees.map((fee: any) => (
                <tr key={fee._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-text">{fee.title}</p>
                    <p className="text-xs text-text-secondary capitalize">{fee.feeType}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{fee.child?.name ?? '—'}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-text">₹{fee.finalAmount?.toLocaleString('en-IN')}</p>
                    {(fee.discount ?? 0) > 0 && <p className="text-xs text-success">−₹{fee.discount}</p>}
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLASS[fee.status] ?? 'bg-gray-100 text-gray-600'}`}>{fee.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      {fee.status !== 'paid' && (
                        <button className="px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors" onClick={() => recordPayment(fee)}>
                          Mark Paid
                        </button>
                      )}
                      <button className="p-1.5 hover:text-primary text-text-light transition-colors" onClick={() => openEdit(fee)}><Edit2 className="w-4 h-4" /></button>
                      <button className="p-1.5 hover:text-error text-text-light transition-colors" onClick={() => { if (confirm('Mark fee as overdue?')) deleteMutation.mutate(fee._id); }}><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-text">{modal.mode === 'add' ? 'Add Fee Record' : 'Edit Fee Record'}</h2>
              <button onClick={close}><X className="w-5 h-5 text-text-light" /></button>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="label">Fee Title</label><input className="input-field" value={form.title} onChange={f('title')} placeholder="e.g. Robotics Course Fee — July 2025" /></div>
              <div><label className="label">Student</label>
                <select className="input-field" value={form.childId} onChange={(e) => onChildChange(e.target.value)}>
                  <option value="">Select student</option>
                  {(children as any[]).map((c: any) => <option key={c._id} value={c._id}>{c.name} ({c.section})</option>)}
                </select>
              </div>
              <div><label className="label">Fee Type</label>
                <select className="input-field" value={form.feeType} onChange={f('feeType')}>
                  {FEE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div><label className="label">Amount (₹)</label><input className="input-field" type="number" value={form.amount} onChange={f('amount')} placeholder="0" /></div>
              <div><label className="label">Discount (₹)</label><input className="input-field" type="number" value={form.discount} onChange={f('discount')} placeholder="0" /></div>
              <div className="sm:col-span-2 py-1 px-3 bg-gray-50 rounded-xl text-sm text-text-secondary">
                Final Amount: <strong className="text-text">₹{(Number(form.amount) - Number(form.discount)).toLocaleString('en-IN')}</strong>
              </div>
              <div><label className="label">Due Date</label><input className="input-field" type="date" value={form.dueDate} onChange={f('dueDate')} /></div>
              <div><label className="label">Month</label><input className="input-field" value={form.month} onChange={f('month')} placeholder="June 2025" /></div>
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
