import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, ClipboardList } from 'lucide-react';
import apiClient from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
      return (await apiClient.get(`/reports/attendance?${params}`)).data.data;
    },
  });

  const summary: any[] = data?.summary || [];

  return (
    <div className="page-container">
      <PageHeader
        title="Attendance Reports"
        subtitle="Monthly attendance overview by student"
        action={
          <button className="btn-outline">
            <Download className="w-3.5 h-3.5 mr-1.5" />Export
          </button>
        }
      />

      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Batch</label>
            <select className="select-field w-44" value={batchId} onChange={e => setBatchId(e.target.value)}>
              <option value="">All Batches</option>
              {batchesData?.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Month</label>
            <select className="select-field w-32" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select className="select-field w-28" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-background border-b border-border-light">
              <tr>{['Student', 'Class', 'Present', 'Absent', 'Total', 'Attendance %'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-text-secondary">Loading…</td></tr>
              ) : summary.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={ClipboardList} title="No attendance data" description="No records for this period. Select a different month or batch." /></td></tr>
              ) : summary.map((row: any, i: number) => {
                const pct = row.percentage ?? 0;
                const badgeCls = pct >= 80 ? 'badge-green' : pct >= 60 ? 'badge-orange' : 'badge-red';
                return (
                  <tr key={i} className="border-b border-border-light last:border-0 hover:bg-background/60 transition-colors">
                    <td className="table-cell font-semibold text-text">{row.child?.name}</td>
                    <td className="table-cell text-sm text-text-secondary">{row.child?.class}</td>
                    <td className="table-cell font-semibold text-success">{row.present}</td>
                    <td className="table-cell font-semibold text-error">{row.absent}</td>
                    <td className="table-cell text-sm text-text-secondary">{row.total}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden min-w-[60px]">
                          <div className={`h-full rounded-full ${pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-error'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`badge ${badgeCls} flex-shrink-0`}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
