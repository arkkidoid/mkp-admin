import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  sub?: string;
  trend?: { value: string; up: boolean };
}

export default function StatCard({ title, value, icon: Icon, iconColor, iconBg, sub, trend }: StatCardProps) {
  return (
    <div className="bg-surface border border-border-light rounded-xl p-5 shadow-card hover:shadow-soft transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-text tracking-tight">{value}</p>
        <p className="text-xs font-medium text-text-secondary mt-0.5">{title}</p>
        {sub && <p className="text-xs text-text-light mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
