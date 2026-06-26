import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, Layers, TrendingUp, Percent, IndianRupee } from 'lucide-react';
import apiClient from '../../api/client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await apiClient.get('/reports/analytics')).data.data,
  });

  const stats = data || {
    totalStudents: 0, totalTeachers: 0, totalBatches: 0,
    attendanceRate: 0, pendingFeeAmount: 0,
  };

  const cards = [
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-accent-blue', bg: 'bg-blue-50' },
    { title: 'Total Teachers', value: stats.totalTeachers, icon: GraduationCap, color: 'text-accent-purple', bg: 'bg-purple-50' },
    { title: 'Active Batches', value: stats.totalBatches, icon: Layers, color: 'text-accent-green', bg: 'bg-green-50' },
    { title: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: Percent, color: 'text-primary', bg: 'bg-orange-50' },
    { title: 'Pending Fees', value: `₹${(stats.pendingFeeAmount / 1000).toFixed(1)}k`, icon: IndianRupee, color: 'text-warning', bg: 'bg-yellow-50' },
    { title: 'Monthly Growth', value: '—', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Analytics & Reports</h1>
        <p className="text-sm text-text-secondary mt-1">School-wide performance overview</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cards.map((card, i) => (
              <div key={i} className="card border border-border-light flex items-center hover:shadow-medium transition-shadow">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bg} mr-4 flex-shrink-0`}>
                  <card.icon className={`w-7 h-7 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{card.title}</p>
                  <p className="text-2xl font-bold text-text">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card border border-border-light">
              <h2 className="text-lg font-bold text-text mb-4">Attendance Trend (Monthly)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.attendanceTrend || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} domain={[0, 100]} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      cursor={{ stroke: '#F47A3A', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Line type="monotone" dataKey="attendanceRate" name="Attendance %" stroke="#F47A3A" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="card border border-border-light">
              <h2 className="text-lg font-bold text-text mb-4">Fee Collection</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenueTrend || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      cursor={{ fill: '#F3F4F6' }}
                      formatter={((value: any) => [`₹${Number(value).toLocaleString()}`, '']) as any}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
