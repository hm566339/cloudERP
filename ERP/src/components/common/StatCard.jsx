import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { SkeletonBox } from './SkeletonLoader';

const CARD_VARIANTS = {
  default: {
    icon: 'bg-primary/10 dark:bg-[#4C8DFF]/15 text-primary dark:text-[#4C8DFF]',
    border: 'border-l-primary-400 dark:border-l-[#4C8DFF]',
    badge: 'text-primary dark:text-[#4C8DFF] bg-primary/10 dark:bg-[#4C8DFF]/15',
  },
  success: {
    icon: 'bg-emerald-50 dark:bg-[#34C38F]/15 text-emerald-600 dark:text-[#34C38F]',
    border: 'border-l-emerald-400 dark:border-l-[#34C38F]',
    badge: 'text-emerald-600 dark:text-[#34C38F] bg-emerald-50 dark:bg-[#34C38F]/15',
  },
  warning: {
    icon: 'bg-amber-50 dark:bg-[#F5B544]/15 text-amber-600 dark:text-[#F5B544]',
    border: 'border-l-amber-400 dark:border-l-[#F5B544]',
    badge: 'text-amber-600 dark:text-[#F5B544] bg-amber-50 dark:bg-[#F5B544]/15',
  },
  danger: {
    icon: 'bg-red-50 dark:bg-[#F0616D]/15 text-red-600 dark:text-[#F0616D]',
    border: 'border-l-red-400 dark:border-l-[#F0616D]',
    badge: 'text-red-600 dark:text-[#F0616D] bg-red-50 dark:bg-[#F0616D]/15',
  },
  info: {
    icon: 'bg-sky-50 dark:bg-[#38BDF8]/15 text-sky-600 dark:text-[#38BDF8]',
    border: 'border-l-sky-400 dark:border-l-[#38BDF8]',
    badge: 'text-sky-600 dark:text-[#38BDF8] bg-sky-50 dark:bg-[#38BDF8]/15',
  },
};

function StatCard({
  label,
  title,
  value,
  icon = Activity,
  trend = null, // null | 'up' | 'down' | 'neutral'
  trendValue = null, // e.g. "+12.5%"
  change = null,
  variant = 'default',
  loading = false,
  subtitle = null,
  description = null,
}) {
  const styles = CARD_VARIANTS[variant] || CARD_VARIANTS.default;

  if (loading) {
    return (
      <div className="card p-4 border-l-[2.4px] border-l-[#D5D8CA] dark:border-l-[#2A2F3D] bg-[#F7F7F0] dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-xl">
        <div className="flex items-start justify-between mb-3">
          <SkeletonBox className="w-8 h-8 rounded-xl" />
          <SkeletonBox className="w-16 h-5 rounded-lg" />
        </div>
        <SkeletonBox className="w-24 h-6 rounded-lg mb-1.5" />
        <SkeletonBox className="w-20 h-3 rounded-full" />
      </div>
    );
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const effectiveTrendValue = trendValue || change;
  const effectiveSubtitle = subtitle || description;

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = typeof icon === 'function' ? icon : Activity;
    return <IconComponent size={16} />;
  };

  return (
    <div
      className={`
      card p-4 group cursor-default min-w-0 bg-[#F7F7F0] dark:bg-[#161922] border border-[#D5D8CA] dark:border-[#2A2F3D] rounded-xl
      border-l-[2.4px] ${styles.border}
      hover:shadow-sm
      transition-shadow duration-micro ease-enter
      animate-fade-in
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg ${styles.icon} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
          {renderIcon()}
        </div>

        {trend && effectiveTrendValue && (
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${styles.badge}`}>
            <TrendIcon size={10} />
            {effectiveTrendValue}
          </div>
        )}
      </div>

      <p className="text-xl font-bold text-[#2E3D28] dark:text-[#E6E8EE] leading-none mb-1 tracking-tight">
        {value}
      </p>
      <p className="text-xs font-medium text-[#485942] dark:text-[#A0A6B5]">{label || title}</p>

      {effectiveSubtitle && (
        <p className="text-xs text-[#7A8A6E] dark:text-[#6B7184] mt-1">{effectiveSubtitle}</p>
      )}
    </div>
  );
}

export default React.memo(StatCard);
