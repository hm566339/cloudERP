import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  TrendingUp,
  PieChart as PieIcon,
  Filter,
  Layers,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { PageHeader } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';

const ATTRIBUTION_MODELS = [
  { id: 'FIRST_TOUCH', name: 'First Touch (100% to Acquisition)' },
  { id: 'LAST_TOUCH', name: 'Last Touch (100% to Deal Close)' },
  { id: 'LINEAR', name: 'Linear (Equal Split Across Touchpoints)' },
  { id: 'U_SHAPED', name: 'U-Shaped (40% First, 40% Last, 20% Middle)' },
];

const ATTRIBUTION_DATA = [
  { channel: 'IndiaMART Portal', firstTouch: 420000, lastTouch: 280000, linear: 340000, uShaped: 360000, share: '32%' },
  { channel: 'Google Search Ads', firstTouch: 350000, lastTouch: 410000, linear: 380000, uShaped: 390000, share: '28%' },
  { channel: 'Meta / Instagram B2B', firstTouch: 180000, lastTouch: 90000, linear: 130000, uShaped: 140000, share: '14%' },
  { channel: 'Direct Inbound / Organic', firstTouch: 210000, lastTouch: 320000, linear: 260000, uShaped: 250000, share: '18%' },
  { channel: 'Trade Show / Expo 2026', firstTouch: 90000, lastTouch: 150000, linear: 110000, uShaped: 110000, share: '8%' },
];

export default function AttributionPage() {
  const { companyId } = useParams();
  const [selectedModel, setSelectedModel] = useState('U_SHAPED');

  const columns = [
    {
      header: 'Marketing Channel',
      accessorKey: 'channel',
      cell: ({ row }) => (
        <span className="font-semibold text-xs text-zinc-900 dark:text-white">
          {row.original.channel}
        </span>
      ),
    },
    {
      header: 'First Touch (₹)',
      accessorKey: 'firstTouch',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5]">
          ₹{row.original.firstTouch.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Last Touch (₹)',
      accessorKey: 'lastTouch',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5]">
          ₹{row.original.lastTouch.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Linear (₹)',
      accessorKey: 'linear',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5]">
          ₹{row.original.linear.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'U-Shaped Weighted (₹)',
      accessorKey: 'uShaped',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          ₹{row.original.uShaped.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Revenue Share',
      accessorKey: 'share',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary">
          {row.original.share}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Multi-Touch Revenue Attribution"
        subtitle="Algorithmic credit distribution across customer acquisition and sales touchpoints."
      />

      {/* Model Selector Banner */}
      <div className="p-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <span className="text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE]">Active Attribution Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]"
          >
            {ATTRIBUTION_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <Info size={13} />
          <span>Calculated against closed-won deals and CRM touchpoint logs</span>
        </div>
      </div>

      {/* Comparative Bar Chart */}
      <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Channel Revenue Comparison Across Models</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ATTRIBUTION_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
              <RechartsTooltip
                formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Attributed Revenue']}
                contentStyle={{ backgroundColor: '#1C202B', borderColor: '#2A2F3D', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="firstTouch" name="First Touch" fill="#6366F1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="lastTouch" name="Last Touch" fill="#EC4899" radius={[3, 3, 0, 0]} />
              <Bar dataKey="uShaped" name="U-Shaped (Hybrid)" fill="#10B981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Table */}
      <DataTable
        data={ATTRIBUTION_DATA}
        columns={columns}
        isLoading={false}
        enablePagination={false}
      />
    </div>
  );
}

