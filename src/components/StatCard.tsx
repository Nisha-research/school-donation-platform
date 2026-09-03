import type { ReactNode } from 'react';
import { TrendingUp, Users, Package, HandHeart, CheckCircle2, Clock } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: 'trending' | 'users' | 'package' | 'heart' | 'check' | 'clock';
  accent?: 'navy' | 'ocean' | 'cta' | 'success' | 'warning';
  sublabel?: string;
}

const iconMap = {
  trending: TrendingUp,
  users: Users,
  package: Package,
  heart: HandHeart,
  check: CheckCircle2,
  clock: Clock,
};

const accentMap = {
  navy: 'bg-navy-800 text-white',
  ocean: 'bg-ocean-500 text-white',
  cta: 'bg-cta-500 text-white',
  success: 'bg-success-500 text-white',
  warning: 'bg-warning-500 text-white',
};

export function StatCard({ label, value, icon, accent = 'navy', sublabel }: StatCardProps) {
  const Icon = iconMap[icon];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-navy-700 dark:bg-navy-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
          <p className="mt-1 font-display text-3xl font-bold text-navy-900 dark:text-navy-100">{value}</p>
          {sublabel && <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-500">{sublabel}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentMap[accent]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export function StatCardGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
