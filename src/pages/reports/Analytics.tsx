import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, Layers, TrendingUp, Percent, IndianRupee } from 'lucide-react';
import apiClient from '../../api/client';

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

          {/* Chart placeholders - will be replaced with recharts in Phase 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card border border-border-light">
              <h2 className="text-lg font-bold text-text mb-4">Attendance Trend (Monthly)</h2>
              <div className="h-48 bg-gray-50 rounded-xl border border-dashed border-border flex items-center justify-center">
                <p className="text-text-secondary text-sm">Chart — install recharts to enable</p>
              </div>
            </div>
            <div className="card border border-border-light">
              <h2 className="text-lg font-bold text-text mb-4">Fee Collection</h2>
              <div className="h-48 bg-gray-50 rounded-xl border border-dashed border-border flex items-center justify-center">
                <p className="text-text-secondary text-sm">Chart — install recharts to enable</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
