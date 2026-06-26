import { useQuery } from '@tanstack/react-query';
import {
  Users, GraduationCap, BookOpen, IndianRupee,
  TrendingUp, AlertCircle, CheckCircle, Clock,
} from 'lucide-react';
import apiClient from '../api/client';

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/dashboard');
      return res.data.data;
    },
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
      <div className="flex h-full items-center justify-center text-text-secondary">
        Failed to load dashboard. Is the backend running on port 5001?
      </div>
    );
  }

  // API shape: { stats: { totalChildren, totalTeachers, activeBatches, todayAttendance, pendingFees, monthlyRevenue }, recentPayments, attendanceTrends }
  const s = data?.stats ?? {};
  const totalChildren   = s.totalChildren  ?? 0;
  const totalTeachers   = s.totalTeachers  ?? 0;
  const activeBatches   = s.activeBatches  ?? 0;
  const pendingFeeAmt   = s.pendingFees?.total ?? 0;
  const monthlyRevenue  = s.monthlyRevenue?.total ?? 0;
  const todayAtt        = s.todayAttendance ?? {};
  const presentToday    = (todayAtt.present ?? 0) + (todayAtt.late ?? 0);
  const absentToday     = todayAtt.absent ?? 0;
  const recentPayments  = data?.recentPayments ?? [];

  const statCards = [
    { title: 'Total Students', value: totalChildren,                                  icon: Users,         color: 'text-accent-blue',   bg: 'bg-blue-50'   },
    { title: 'Instructors',    value: totalTeachers,                                  icon: GraduationCap, color: 'text-accent-purple', bg: 'bg-purple-50' },
    { title: 'Active Batches', value: activeBatches,                                  icon: BookOpen,      color: 'text-accent-green',  bg: 'bg-green-50'  },
    { title: 'Pending Fees',   value: `₹${(pendingFeeAmt / 1000).toFixed(1)}k`,       icon: IndianRupee,   color: 'text-warning',       bg: 'bg-orange-50' },
  ];

  // Generate alerts from live data
  const alerts = [
    absentToday > 0 && {
      id: 'att', type: 'warning',
      text: `${absentToday} student${absentToday > 1 ? 's' : ''} marked absent today`,
    },
    pendingFeeAmt > 0 && {
      id: 'fee', type: 'info',
      text: `₹${(pendingFeeAmt / 1000).toFixed(1)}k in course fees pending collection`,
    },
    monthlyRevenue > 0 && {
      id: 'rev', type: 'success',
      text: `₹${(monthlyRevenue / 1000).toFixed(1)}k collected this month`,
    },
  ].filter(Boolean) as { id: string; type: string; text: string }[];

  if (alerts.length === 0) {
    alerts.push({ id: 'ok', type: 'success', text: 'All systems normal. No alerts today.' });
  }

  const alertIcon = (type: string) => {
    if (type === 'success') return <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-success" />;
    if (type === 'warning') return <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-warning" />;
    return <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-accent-blue" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard Overview</h1>
          <p className="text-sm text-text-secondary mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <a href="/reports" className="btn-primary flex items-center text-sm">
          <TrendingUp className="w-4 h-4 mr-2" />
          View Reports
        </a>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div key={i} className="card border border-border-light flex items-center hover:shadow-medium transition-shadow">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bg} mr-4 flex-shrink-0`}>
              <card.icon className={`w-7 h-7 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-text-secondary font-medium">{card.title}</p>
              <p className="text-2xl font-bold text-text mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Attendance Mini Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Present Today',    value: presentToday, cls: 'text-success',   bg: 'bg-green-50'  },
          { label: 'Absent Today',     value: absentToday,  cls: 'text-error',     bg: 'bg-red-50'    },
          { label: 'Revenue (Month)',  value: `₹${(monthlyRevenue/1000).toFixed(1)}k`, cls: 'text-primary', bg: 'bg-orange-50' },
        ].map((item, i) => (
          <div key={i} className={`card border border-border-light text-center ${item.bg}`}>
            <p className={`text-3xl font-extrabold ${item.cls}`}>{item.value}</p>
            <p className="text-xs text-text-secondary mt-1 font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart placeholder */}
        <div className="lg:col-span-2 card border border-border-light">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text">Attendance Trends</h2>
            <span className="text-xs bg-primary-bg text-primary-dark px-2.5 py-1 rounded-full font-medium">Last 30 days</span>
          </div>
          <div className="h-56 bg-gray-50 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2">
            <Clock className="w-8 h-8 text-border" />
            <p className="text-text-secondary text-sm font-medium">Chart coming in Phase 2 (Recharts)</p>
            <p className="text-text-light text-xs">{(data?.attendanceTrends ?? []).length} data points available</p>
          </div>
        </div>

        {/* Alerts */}
        <div className="card border border-border-light flex flex-col">
          <h2 className="text-lg font-bold text-text mb-4">Activity & Alerts</h2>
          <div className="flex-1 space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start p-3 bg-gray-50 rounded-xl border border-border-light">
                {alertIcon(alert.type)}
                <p className="text-sm text-text font-medium leading-snug">{alert.text}</p>
              </div>
            ))}
          </div>

          {/* Recent Payments */}
          {recentPayments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-light">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Recent Payments</p>
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
