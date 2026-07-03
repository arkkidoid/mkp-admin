import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, Layers, Percent, IndianRupee, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import apiClient from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border-light rounded-xl shadow-medium px-3 py-2 text-sm">
      <p className="font-semibold text-text mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-xs">{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await apiClient.get('/reports/analytics')).data.data,
  });

  const stats = data || { totalStudents: 0, totalTeachers: 0, totalBatches: 0, attendanceRate: 0, pendingFeeAmount: 0 };

  if (isLoading) return (
    <div className="page-container">
      <PageHeader title="Analytics & Reports" subtitle="School-wide performance overview" />
      <div className="flex items-center justify-center py-24"><div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader title="Analytics & Reports" subtitle="School-wide performance overview" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} iconBg="bg-blue-50" iconColor="text-info" />
        <StatCard title="Total Teachers" value={stats.totalTeachers} icon={GraduationCap} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatCard title="Active Batches" value={stats.totalBatches} icon={Layers} iconBg="bg-emerald-50" iconColor="text-success" />
        <StatCard title="Attendance Rate" value={`${stats.attendanceRate}%`} icon={Percent} iconBg="bg-primary-bg" iconColor="text-primary" />
        <StatCard title="Pending Fees" value={`₹${((stats.pendingFeeAmount ?? 0) / 1000).toFixed(1)}k`} icon={IndianRupee} iconBg="bg-yellow-50" iconColor="text-warning" />
        <StatCard title="Monthly Growth" value="—" icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-success" sub="Coming soon" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <p className="section-title mb-4">Attendance Trend (Monthly)</p>
          {(stats.attendanceTrend?.length ?? 0) === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-text-light">No trend data yet</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.attendanceTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} domain={[0, 100]} dx={-8} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="attendanceRate" name="Attendance %" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3.5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <p className="section-title mb-4">Fee Collection</p>
          {(stats.revenueTrend?.length ?? 0) === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-text-light">No revenue data yet</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} dx={-8} />
                  <Tooltip content={<CustomTooltip />} formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, '']} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                  <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
