import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, Layers, IndianRupee,
  TrendingUp, CheckCircle, AlertCircle, UserPlus,
  ClipboardList, Bell, ArrowRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import apiClient from '../api/client';
import StatCard from '../components/ui/StatCard';
import { useAuthStore } from '../store/authStore';

const QUICK_ACTIONS = [
  { label: 'Add Student',    icon: UserPlus,     path: '/children',       color: 'bg-blue-50 text-blue-600' },
  { label: 'Add Teacher',    icon: GraduationCap, path: '/teachers',      color: 'bg-purple-50 text-purple-600' },
  { label: 'Create Batch',   icon: Layers,        path: '/batches',       color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Attendance',     icon: ClipboardList, path: '/attendance',    color: 'bg-orange-50 text-orange-600' },
  { label: 'Record Fee',     icon: IndianRupee,   path: '/fees',          color: 'bg-yellow-50 text-yellow-600' },
  { label: 'Send Notice',    icon: Bell,          path: '/notifications', color: 'bg-red-50 text-red-600' },
];

function fmt(n: number) { return n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border-light rounded-lg px-3 py-2 shadow-medium text-xs">
      <p className="font-semibold text-text mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}{p.unit ?? ''}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => (await apiClient.get('/admin/dashboard')).data.data,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-text-secondary">
        Failed to load dashboard — check if the backend is running.
      </div>
    );
  }

  const s = data?.stats ?? {};
  const totalStudents  = s.totalChildren   ?? 0;
  const totalTeachers  = s.totalTeachers   ?? 0;
  const activeBatches  = s.activeBatches   ?? 0;
  const pendingFeeAmt  = s.pendingFees?.total ?? 0;
  const monthlyRevenue = s.monthlyRevenue?.total ?? 0;
  const todayAtt       = s.todayAttendance ?? {};
  const presentToday   = (todayAtt.present ?? 0) + (todayAtt.late ?? 0);
  const absentToday    = todayAtt.absent   ?? 0;
  const totalToday     = presentToday + absentToday;
  const attRate        = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;
  const recentPayments = data?.recentPayments ?? [];

  const attendanceTrend = s.attendanceTrend ?? [];
  const revenueTrend    = s.revenueTrend    ?? [];

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hour  = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const alerts = [
    absentToday > 0    && { type: 'warn',    text: `${absentToday} student${absentToday > 1 ? 's' : ''} absent today` },
    pendingFeeAmt > 0  && { type: 'info',    text: `${fmt(pendingFeeAmt)} in pending fees` },
    monthlyRevenue > 0 && { type: 'success', text: `${fmt(monthlyRevenue)} collected this month` },
  ].filter(Boolean) as { type: string; text: string }[];

  if (!alerts.length) alerts.push({ type: 'success', text: 'All systems normal — no alerts today.' });

  return (
    <div className="page-container">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-text">{greeting}, {user?.name?.split(' ')[0] ?? 'Admin'} 👋</h1>
          <p className="text-xs text-text-secondary mt-0.5">{today}</p>
        </div>
        <button onClick={() => navigate('/reports')} className="btn-primary self-start sm:self-auto">
          <TrendingUp className="w-3.5 h-3.5 mr-1.5" />View Reports
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={totalStudents} icon={Users}
          iconColor="text-blue-600" iconBg="bg-blue-50"
          sub="Enrolled students" />
        <StatCard title="Instructors" value={totalTeachers} icon={GraduationCap}
          iconColor="text-purple-600" iconBg="bg-purple-50"
          sub="Active staff" />
        <StatCard title="Active Batches" value={activeBatches} icon={Layers}
          iconColor="text-emerald-600" iconBg="bg-emerald-50"
          sub="Running this term" />
        <StatCard title="Pending Fees" value={fmt(pendingFeeAmt)} icon={IndianRupee}
          iconColor="text-orange-600" iconBg="bg-orange-50"
          sub="To be collected" />
      </div>

      {/* Today's Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Present Today', value: presentToday, color: 'text-emerald-600', bg: 'bg-emerald-50/60' },
          { label: 'Absent Today',  value: absentToday,  color: 'text-red-500',     bg: 'bg-red-50/60' },
          { label: 'Attendance Rate', value: `${attRate}%`, color: 'text-primary',  bg: 'bg-orange-50/60' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border border-border-light p-4 text-center ${item.bg}`}>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-text-secondary mt-0.5 font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Attendance Trend */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-text">Attendance Trend</h2>
              <p className="text-xs text-text-secondary">Monthly attendance rate</p>
            </div>
            <button onClick={() => navigate('/reports')} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Full report <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {attendanceTrend.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#F97316" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="attendanceRate" name="Rate" stroke="#F97316" strokeWidth={2} fill="url(#attGrad)" dot={false} unit="%" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl">
              <ClipboardList className="w-6 h-6 text-text-light" />
              <p className="text-xs text-text-secondary">No trend data yet — check Reports</p>
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-text">Revenue</h2>
              <p className="text-xs text-text-secondary">Monthly collection</p>
            </div>
          </div>
          {revenueTrend.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl">
              <IndianRupee className="w-6 h-6 text-text-light" />
              <p className="text-xs text-text-secondary">No revenue data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions + Alerts + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-text mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border-light hover:border-primary/30 hover:bg-primary-bg/30 transition-all duration-150 text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.color}`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-text-secondary text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-text mb-3">Alerts</h2>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-lg text-xs font-medium ${
                alert.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                alert.type === 'warn'    ? 'bg-orange-50 text-orange-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {alert.type === 'success'
                  ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  : <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                {alert.text}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-text">Recent Payments</h2>
            <button onClick={() => navigate('/fees/payments')} className="text-xs text-primary font-semibold hover:underline">
              See all
            </button>
          </div>
          {recentPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IndianRupee className="w-6 h-6 text-text-light mb-2" />
              <p className="text-xs text-text-secondary">No recent payments</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentPayments.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-emerald-600">
                        {(p.parent?.name ?? 'P')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text truncate">{p.parent?.name ?? 'Parent'}</p>
                      <p className="text-[10px] text-text-light">{p.title ?? 'Fee'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 ml-2 flex-shrink-0">
                    +₹{(p.paidAmount ?? p.amount ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
