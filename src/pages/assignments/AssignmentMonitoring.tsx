import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import apiClient from '../../api/client';

export default function AssignmentMonitoring() {
  const [search, setSearch] = useState('');
  const [batchId, setBatchId] = useState('');

  const { data: batchesData } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => (await apiClient.get('/batches')).data.data,
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['assignmentReport', batchId],
    queryFn: async () => {
      const params = batchId ? `?batchId=${batchId}` : '';
      const res = await apiClient.get(`/reports/assignments${params}`);
      return res.data.data;
    },
  });

  const rows = (reportData || []).filter((r: any) =>
    r.assignment.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Assignment Monitoring</h1>
        <p className="text-sm text-text-secondary mt-1">Track submission rates across all assignments</p>
      </div>

      <div className="card border border-border-light flex gap-4 items-end">
        <div className="flex-1">
          <label className="label">Search Assignment</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input className="input-field pl-9 py-2" placeholder="Search by title..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Batch</label>
          <select className="input-field py-2" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">All Batches</option>
            {batchesData?.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card border border-border-light overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {['Assignment','Batch','Due Date','Submitted','Total','Completion Rate'].map((h) => (
                <th key={h} className="py-3 px-4 text-sm font-semibold text-text-secondary border-b border-border-light">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-secondary">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-text-secondary">No assignments found.</td></tr>
            ) : rows.map((row: any, i: number) => {
              const pct = row.completionRate;
              const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';
              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-text">{row.assignment.title}</td>
                  <td className="py-3 px-4 text-text-secondary">{row.batch?.name || '—'}</td>
                  <td className="py-3 px-4 text-text-secondary">{new Date(row.assignment.dueDate).toLocaleDateString('en-IN')}</td>
                  <td className="py-3 px-4 font-semibold text-accent-blue">{row.submitted}</td>
                  <td className="py-3 px-4 text-text-secondary">{row.totalChildren}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-bold text-text">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
