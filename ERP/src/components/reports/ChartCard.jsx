import React, { useRef, useState, useEffect } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, AreaChart, Area, 
  LineChart, Line 
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const DEFAULT_COLORS = ['#3b82f6', '#f97316', '#10b981', '#ef4444', '#8b5cf6'];
const DEFAULT_DATA_KEYS = [];
const DEFAULT_DATA = [];

function areChartPropsEqual(prevProps, nextProps) {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.description !== nextProps.description) return false;
  if (prevProps.type !== nextProps.type) return false;
  if (prevProps.height !== nextProps.height) return false;
  if (prevProps.loading !== nextProps.loading) return false;
  if (prevProps.xAxisKey !== nextProps.xAxisKey) return false;

  // Compare data array
  if (prevProps.data !== nextProps.data) {
    const prevData = prevProps.data || DEFAULT_DATA;
    const nextData = nextProps.data || DEFAULT_DATA;
    if (prevData.length !== nextData.length) return false;
    for (let i = 0; i < prevData.length; i++) {
      if (prevData[i] !== nextData[i]) {
        if (typeof prevData[i] === 'object' && typeof nextData[i] === 'object' && prevData[i] && nextData[i]) {
          const pKeys = Object.keys(prevData[i]);
          const nKeys = Object.keys(nextData[i]);
          if (pKeys.length !== nKeys.length) return false;
          for (const k of pKeys) {
            if (prevData[i][k] !== nextData[i][k]) return false;
          }
        } else {
          return false;
        }
      }
    }
  }

  // Compare dataKeys array
  if (prevProps.dataKeys !== nextProps.dataKeys) {
    const prevKeys = prevProps.dataKeys || DEFAULT_DATA_KEYS;
    const nextKeys = nextProps.dataKeys || DEFAULT_DATA_KEYS;
    if (prevKeys.length !== nextKeys.length) return false;
    for (let i = 0; i < prevKeys.length; i++) {
      if (prevKeys[i] !== nextKeys[i]) return false;
    }
  }

  // Compare colors array
  if (prevProps.colors !== nextProps.colors) {
    const prevC = prevProps.colors || DEFAULT_COLORS;
    const nextC = nextProps.colors || DEFAULT_COLORS;
    if (prevC.length !== nextC.length) return false;
    for (let i = 0; i < prevC.length; i++) {
      if (prevC[i] !== nextC[i]) return false;
    }
  }

  return true;
}

function ChartCard({ 
  title, 
  description,
  type = 'bar', // 'bar' | 'area' | 'line'
  data = DEFAULT_DATA, 
  dataKeys = DEFAULT_DATA_KEYS, 
  colors = DEFAULT_COLORS,
  xAxisKey = 'name',
  height = 208,
  loading = false
}) {
  const containerRef = useRef(null);
  const [hasDimensions, setHasDimensions] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    if (containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) {
      setHasDimensions(true);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setHasDimensions(true);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-zinc-400">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-gray-700 rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium">Loading chart data...</p>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-zinc-400">
          <BarChart3 size={32} className="opacity-50 mb-2" />
          <p className="text-sm font-medium">No data available for chart</p>
        </div>
      );
    }

    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: -20, bottom: 0 }
    };

    const tooltipStyle = {
      backgroundColor: 'var(--color-surface-elevated, #ffffff)',
      borderColor: 'var(--color-border, #e4e4e7)',
      color: 'var(--color-text-primary, #09090b)',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    };
    const axisTick = { fontSize: 12, fill: 'var(--color-text-secondary, #71717a)' };
    const gridStroke = 'var(--color-border, #e4e4e7)';

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              {dataKeys.map((key, i) => (
                <linearGradient key={`color-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey={xAxisKey} tick={axisTick} stroke={gridStroke} />
            <YAxis tick={axisTick} stroke={gridStroke} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: 'var(--color-text-secondary, #71717a)' }} />
            {dataKeys.map((key, i) => (
              <Area 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={colors[i % colors.length]} 
                fillOpacity={1} 
                fill={`url(#color-${key})`} 
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        );
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey={xAxisKey} tick={axisTick} stroke={gridStroke} />
            <YAxis tick={axisTick} stroke={gridStroke} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: 'var(--color-text-secondary, #71717a)' }} />
            {dataKeys.map((key, i) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={colors[i % colors.length]} 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        );
      case 'bar':
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey={xAxisKey} tick={axisTick} stroke={gridStroke} />
            <YAxis tick={axisTick} stroke={gridStroke} />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: 'var(--color-text-secondary, #71717a)' }} />
            {dataKeys.map((key, i) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={colors[i % colors.length]} 
                radius={[4, 4, 0, 0]} 
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm p-4 flex flex-col h-full min-w-0">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-[#E6E8EE]">{title}</h3>
        {description && <p className="text-xs text-zinc-500 dark:text-[#A0A6B5] mt-1">{description}</p>}
      </div>
      <div 
        ref={containerRef}
        style={{ height: `${height}px`, minHeight: `${height}px`, minWidth: 0 }} 
        className="w-full relative overflow-hidden"
      >
        {!loading && data && data.length > 0 && hasDimensions ? (
          <ResponsiveContainer width="100%" height={height} minWidth={0} minHeight={height}>
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          renderChart()
        )}
      </div>
    </div>
  );
}

export default React.memo(ChartCard, areChartPropsEqual);
