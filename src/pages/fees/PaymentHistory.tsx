import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import apiClient from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';

const MODE_BADGE: Record<string, string> = {
  cash: 'badge-green', online: 'badge-blue', cheque: 'badge-gray', upi: 'badge-purple',
};

export default function PaymentHistory() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: async () => (await apiClient.get('/fees/payments')).data.data ?? [],
  });

  const payments = (data || []).filter((p: any) =>
    (p.child?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.fee?.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const total = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);

  return (
    <div className="page-container">
      <PageHeader
        title="Payment History"
        subtitle="All recorded fee payments"
        action={
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-right">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Total Collected</p>
            <p className="text-lg font-bold text-emerald-700">₹{total.toLocaleString('en-IN')}</p>
          </div>
        }
      />

      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-border-light">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student or fee…" className="w-full sm:w-72" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-background border-b border-border-light">
              <tr>
                {['Student', 'Fee', 'Amount', 'Mode', 'Date', 'By'].map(h => <th key={h} className="table-header">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={CreditCard} title="No payment records" description={search ? 'Try a different search.' : 'Payments will appear here once recorded.'} /></td></tr>
              ) : payments.map((p: any) => (
                <tr key={p._id} className="border-b border-border-light last:border-0 hover:bg-background/60 transition-colors">
                  <td className="table-cell">
                    <p className="font-semibold text-text">{p.child?.name || '—'}</p>
                    <p className="text-xs text-text-light">{p.child?.class}</p>
                  </td>
                  <td className="table-cell text-sm text-text-secondary capitalize">{p.fee?.title || p.fee?.feeType || '—'}</td>
                  <td className="table-cell font-bold text-emerald-600">₹{(p.amount ?? 0).toLocaleString('en-IN')}</td>
                  <td className="table-cell">
                    <span className={`badge ${MODE_BADGE[p.paymentMode] ?? 'badge-gray'} capitalize`}>{p.paymentMode ?? 'cash'}</span>
                  </td>
                  <td className="table-cell text-sm text-text-secondary">
                    {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="table-cell text-sm text-text-secondary">{p.recordedBy?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
