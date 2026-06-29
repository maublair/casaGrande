import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  color?: 'navy' | 'olive' | 'gold' | 'green' | 'red';
}

const colorMap = {
  navy: { bg: 'bg-navy-50', icon: 'bg-navy text-white', text: 'text-navy' },
  olive: { bg: 'bg-olive-50', icon: 'bg-olive text-white', text: 'text-olive-800' },
  gold: { bg: 'bg-gold-50', icon: 'bg-gold text-white', text: 'text-gold-800' },
  green: { bg: 'bg-green-50', icon: 'bg-green-500 text-white', text: 'text-green-800' },
  red: { bg: 'bg-red-50', icon: 'bg-red-500 text-white', text: 'text-red-800' },
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'navy' }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} rounded-2xl p-5 border border-white shadow-sm`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-11 h-11 ${c.icon} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${c.text} leading-tight`}>{value}</p>
      <p className="text-gray-600 text-sm font-medium mt-0.5">{title}</p>
      {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
    </div>
  );
}
