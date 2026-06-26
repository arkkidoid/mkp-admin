import { useQuery } from '@tanstack/react-query';
import {
  Users, GraduationCap, BookOpen, IndianRupee,
  TrendingUp, AlertCircle, CheckCircle, Clock,
} from 'lucide-react';
import apiClient from '../api/client';

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => (await apiClient.get('/admin/dashboard')).data.data,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center text-center text-text-secondary px-4">
        Failed to load dashboard. Is the backend running on port 5001?
      </div>
    );
  }

  const s = data?.stats ?? {};
  const totalChildren  = s.totalChildren  ?? 0;
  const totalTeachers  = s.totalTeachers  ?? 0;
  const activeBatches  = s.activeBatches  ?? 0;
  const pendingFeeAmt  = s.pendingFees?.total ?? 0;
  const monthlyRevenue = s.monthlyRevenue?.total ?? 0;
  const todayAtt       = s.todayAttendance ?? {};
  const presentToday   = (todayAtt.present ?? 0) + (todayAtt.late ?? 0);
  const absentToday    = todayAtt.absent ?? 0;
  const recentPayments = data?.recentPayments ?? [];

  const statCards = [
    { title: 'Students',     value: totalChildren,                             icon: Users,         color: 'text-accent-blue',   bg: 'bg-blue-50'   },
    { title: 'Instructors',  value: totalTeachers,                             icon: GraduationCap, color: 'text-accent-purple', bg: 'bg-purple-50' },
    { title: 'Batches',      value: activeBatches,                             icon: BookOpen,      color: 'text-accent-green',  bg: 'bg-green-50'  },
    { title: 'Pending Fees', value: `₹${(pendingFeeAmt / 1000).toFixed(1)}k`, icon: IndianRupee,   color: 'text-warning',       bg: 'bg-orange-50' },
  ];

  const alerts = [
    absentToday > 0 && { id: 'att', type: 'warning', text: `${absentToday} student${absentToday > 1 ? 's' : ''} absent today` },
    pendingFeeAmt > 0 && { id: 'fee', type: 'info',    text: `₹${(pendingFeeAmt / 1000).toFixed(1)}k fees pending` },
    monthlyRevenue > 0 && { id: 'rev', type: 'success', text: `₹${(monthlyRevenue / 1000).toFixed(1)}k collected this month` },
  ].filter(Boolean) as { id: string; type: string; text: string }[];

  if (alerts.length === 0) alerts.push({ id: 'ok', type: 'success', text: 'All systems normal. No alerts today.' });

  const alertIcon = (type: string) => {
    if (type === 'success') return <CheckCircle className="w-4 h-4 mr-2.5 mt-0.5 flex-shrink-0 text-success" />;
    if (type === 'warning') return <AlertCircle className="w-4 h-4 mr-2.5 mt-0.5 flex-shrink-0 text-warning" />;
    return <AlertCircle className="w-4 h-4 mr-2.5 mt-0.5 flex-shrink-0 text-accent-blue" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-xs md:text-sm text-text-secondary mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <a href="/reports" className="btn-primary flex items-center text-sm self-start sm:self-auto whitespace-nowrap">
          <TrendingUp className="w-4 h-4 mr-2" />View Reports
        </a>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="card p-4 md:p-6 border border-border-light flex items-center hover:shadow-medium transition-shadow">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${card.bg} mr-3 flex-shrink-0`}>
              <card.icon className={`w-5 h-5 md:w-6 md:h-6 ${card.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary font-medium truncate">{card.title}</p>
              <p className="text-lg md:text-2xl font-bold text-text mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today mini-stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {[
          { label: 'Present Today',   value: presentToday,                              cls: 'text-success', bg: 'bg-green-50'  },
          { label: 'Absent Today',    value: absentToday,                               cls: 'text-error',   bg: 'bg-red-50'    },
          { label: 'Revenue (Month)', value: `₹${(monthlyRevenue / 1000).toFixed(1)}k`, cls: 'text-primary', bg: 'bg-orange-50' },
        ].map((item, i) => (
          <div key={i} className={`card p-3 md:p-6 border border-border-light text-center ${item.bg}`}>
            <p className={`text-xl md:text-3xl font-extrabold ${item.cls}`}>{item.value}</p>
            <p className="text-xs text-text-secondary mt-1 font-medium leading-tight">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 card border border-border-light p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base md:text-lg font-bold text-text">Attendance Trends</h2>
            <span className="text-xs bg-primary-bg text-primary-dark px-2 py-0.5 rounded-full font-medium">Last 30 days</span>
          </div>
          <div className="h-44 md:h-56 bg-gray-50 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2">
            <Clock className="w-7 h-7 text-border" />
            <p className="text-text-secondary text-sm font-medium text-center px-4">Chart available in Reports section</p>
          </div>
        </div>

        <div className="card border border-border-light flex flex-col p-4 md:p-6">
          <h2 className="text-base md:text-lg font-bold text-text mb-3">Alerts</h2>
          <div className="flex-1 space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start p-2.5 bg-gray-50 rounded-xl border border-border-light">
                {alertIcon(alert.type)}
                <p className="text-sm text-text font-medium leading-snug">{alert.text}</p>
              </div>
            ))}
          </div>
          {recentPayments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border-light">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Recent Payments</p>
              {recentPayments.slice(0, 3).map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-1.5">
                  <p className="text-sm text-text truncate flex-1">{p.parent?.name ?? 'Parent'}</p>
                  <p className="text-sm font-bold text-success ml-2">₹{p.amount?.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
