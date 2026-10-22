import React from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

/**
 * Reusable Chart Card for Dashboard Visualizations
 */
function arePieChartPropsEqual(prevProps, nextProps) {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.data !== nextProps.data) {
    const pData = prevProps.data || [];
    const nData = nextProps.data || [];
    if (pData.length !== nData.length) return false;
    for (let i = 0; i < pData.length; i++) {
      if (pData[i]?.value !== nData[i]?.value || pData[i]?.name !== nData[i]?.name) return false;
    }
  }
  if (prevProps.colors !== nextProps.colors) {
    const pC = prevProps.colors || [];
    const nC = nextProps.colors || [];
    if (pC.length !== nC.length) return false;
    for (let i = 0; i < pC.length; i++) {
      if (pC[i] !== nC[i]) return false;
    }
  }
  return true;
}

function ChartCard({ title, data, colors }) {
  const containerRef = React.useRef(null);
  const [hasDimensions, setHasDimensions] = React.useState(false);

  React.useEffect(() => {
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

  // Ensure we only render chart if there is data > 0
  const hasData = data && data.some(d => d.value > 0);

  return (
    <div className="card p-5 h-[240px] flex flex-col bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm">
      <h3 className="text-sm font-bold text-zinc-700 dark:text-[#E6E8EE] mb-4">{title}</h3>
      <div 
        ref={containerRef}
        style={{ height: '160px', minHeight: '160px', minWidth: 0 }} 
        className="flex-1 w-full relative overflow-hidden"
      >
        {hasData && hasDimensions ? (
          <ResponsiveContainer width="100%" height={160} minWidth={0} minHeight={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                isAnimationActive={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid var(--color-border, #e4e4e7)', 
                  backgroundColor: 'var(--color-surface-elevated, #ffffff)', 
                  color: 'var(--color-text-primary, #09090b)', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
                itemStyle={{ fontWeight: 600 }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary, #6B7184)' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 dark:text-[#6B7184]">
            <PieChartIcon size={32} className="opacity-50 mb-2" />
            <p className="text-sm font-medium">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(ChartCard, arePieChartPropsEqual);
