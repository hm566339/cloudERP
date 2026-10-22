import React from 'react'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { SkeletonBox } from './SkeletonLoader'

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
}

function StatCard({
 label,
 title,
 value,
 icon: Icon = Activity,
 trend = null, // null | 'up' | 'down' | 'neutral'
 trendValue = null, // e.g."+12.5%"
 variant = 'default',
 loading = false,
 subtitle = null,
}) {
 const styles = CARD_VARIANTS[variant] || CARD_VARIANTS.default

  if (loading) {
  return (
  <div className="card p-4 border-l-[2.4px] border-l-zinc-200 dark:border-l-[#2A2F3D] bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl">
   <div className="flex items-start justify-between mb-3">
     <SkeletonBox className="w-8 h-8 rounded-xl" />
     <SkeletonBox className="w-16 h-5 rounded-lg" />
   </div>
   <SkeletonBox className="w-24 h-6 rounded-lg mb-1.5" />
   <SkeletonBox className="w-20 h-3 rounded-full" />
  </div>
  )
  }

 const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

 return (
 <div
 className={`
 card p-4 group cursor-default min-w-0 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl
 border-l-[2.4px] ${styles.border}
 hover:shadow-sm
 transition-shadow duration-micro ease-enter
 animate-fade-in
 `}
 >
 <div className="flex items-start justify-between mb-2">
 <div className={`w-8 h-8 rounded-lg ${styles.icon} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
 <Icon size={16} />
 </div>

 {trend && trendValue && (
 <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${styles.badge}`}>
 <TrendIcon size={10} />
 {trendValue}
 </div>
 )}
 </div>

 <p className="text-xl font-bold text-zinc-900 dark:text-[#E6E8EE] leading-none mb-1 tracking-tight">
 {value}
 </p>
 <p className="text-xs font-medium text-zinc-500 dark:text-[#A0A6B5]">{label || title}</p>

 {subtitle && (
 <p className="text-xs text-zinc-400 dark:text-[#6B7184] mt-1">{subtitle}</p>
 )}
 </div>
 )
}

export default React.memo(StatCard);
