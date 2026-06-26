import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Download } from 'lucide-react';
import apiClient from '../../api/client';

export default function AttendanceReports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [batchId, setBatchId] = useState('');

  const { data: batchesData } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => (await apiClient.get('/batches')).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['attendanceReport', month, year, batchId],
    queryFn: async () => {
      const params = new URLSearchParams({ month: String(month), year: String(year) });
      if (batchId) params.set('batchId', batchId);
      const res = await apiClient.get(`/reports/attendance?${params}`);
      return res.data.data;
    },
  });

  const summary = data?.summary || [];

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Attendance Reports</h1>
          <p className="text-sm text-text-secondary mt-1">Monthly attendance overview by student</p>
        </div>
        <button className="btn-outline flex items-center text-sm py-2 px-4">
          <Download className="w-4 h-4 mr-2" />Export
        </button>
      </div>

      {/* Filters */}
      <div className="card border border-border-light flex gap-4 items-end">
        <div>
          <label className="label">Batch</label>
          <select className="input-field py-2" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">All Batches</option>
            {batchesData?.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Month</label>
          <select className="input-field py-2" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <select className="input-field py-2" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="card border border-border-light overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {['Student','Class','Present','Absent','Late','Total','Attendance %'].map((h) => (
                <th key={h} className="py-3 px-4 text-sm font-semibold text-text-secondary border-b border-border-light">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-text-secondary">Loading...</td></tr>
            ) : summary.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-text-secondary">No attendance data for this period.</td></tr>
            ) : summary.map((row: any, i: number) => {
              const color = row.percentage >= 80 ? 'text-green-600' : row.percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-text">{row.child?.name}</td>
                  <td className="py-3 px-4 text-text-secondary">{row.child?.class}</td>
                  <td className="py-3 px-4 text-green-600 font-semibold">{row.present}</td>
                  <td className="py-3 px-4 text-red-500 font-semibold">{row.absent}</td>
                  <td className="py-3 px-4 text-yellow-600 font-semibold">{row.late}</td>
                  <td className="py-3 px-4 text-text-secondary">{row.total}</td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${color}`}>{row.percentage}%</span>
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
