import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import apiClient from '../../api/client';

export default function PaymentHistory() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: async () => (await apiClient.get('/fees/payments')).data.data,
  });

  const payments = (data || []).filter((p: any) =>
    p.child?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.fee?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const total = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Payment History</h1>
          <p className="text-sm text-text-secondary mt-1">All recorded fee payments</p>
        </div>
        <div className="card border border-border-light py-3 px-6 text-right">
          <p className="text-xs text-text-secondary">Total Collected</p>
          <p className="text-xl font-bold text-green-600">₹{total.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="card border border-border-light">
        <div className="relative w-72 mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input className="input-field pl-9 py-2" placeholder="Search by child or fee..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {['Child','Fee Type','Amount','Payment Mode','Date','Recorded By'].map((h) => (
                <th key={h} className="py-3 px-4 text-sm font-semibold text-text-secondary border-b border-border-light">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-secondary">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-secondary">No payment records found.</td></tr>
            ) : payments.map((p: any) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-text">{p.child?.name || '—'}</p>
                  <p className="text-xs text-text-secondary">{p.child?.class}</p>
                </td>
                <td className="py-3 px-4 text-text-secondary capitalize">{p.fee?.title || p.fee?.feeType || '—'}</td>
                <td className="py-3 px-4 font-bold text-green-600">₹{p.amount?.toLocaleString('en-IN')}</td>
                <td className="py-3 px-4 text-text-secondary capitalize">{p.paymentMode || 'cash'}</td>
                <td className="py-3 px-4 text-text-secondary">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="py-3 px-4 text-text-secondary">{p.recordedBy?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
