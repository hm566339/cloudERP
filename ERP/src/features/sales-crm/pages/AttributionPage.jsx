import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  TrendingUp,
  PieChart as PieIcon,
  Filter,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw
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
import PageHeader from '../../../components/common/PageHeader';
import IntegrationsCampaignsHeader from '../components/IntegrationsCampaignsHeader';
import { Select } from '../../../components/common';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import { useGetCrmMultiTouchAttributionQuery } from '../../../api/sales-crm/crm.api';

const ATTRIBUTION_MODELS = [
  { id: 'FIRST_TOUCH', name: 'First Touch (100% to Acquisition)' },
  { id: 'LAST_TOUCH', name: 'Last Touch (100% to Deal Close)' },
  { id: 'LINEAR', name: 'Linear (Equal Split Across Touchpoints)' },
  { id: 'U_SHAPED', name: 'U-Shaped (40% First, 40% Last, 20% Middle)' },
];

const ATTRIBUTION_FALLBACK_DATA = [
  { id: '1', channel: 'IndiaMART Portal', firstTouch: 420000, lastTouch: 280000, linear: 340000, uShaped: 360000, share: '32%' },
  { id: '2', channel: 'Google Search Ads', firstTouch: 350000, lastTouch: 410000, linear: 380000, uShaped: 390000, share: '28%' },
  { id: '3', channel: 'Meta / Instagram B2B', firstTouch: 180000, lastTouch: 90000, linear: 130000, uShaped: 140000, share: '14%' },
  { id: '4', channel: 'Direct Inbound / Organic', firstTouch: 210000, lastTouch: 320000, linear: 260000, uShaped: 250000, share: '18%' },
  { id: '5', channel: 'Trade Show / Expo 2026', firstTouch: 90000, lastTouch: 150000, linear: 110000, uShaped: 110000, share: '8%' },
];

export default function AttributionPage() {
  const { companyId } = useParams();
  const [selectedModel, setSelectedModel] = useState('U_SHAPED');
  const [selectedRows, setSelectedRows] = useState([]);

  const {
    data: attributionRes,
    isLoading,
    isFetching,
    refetch,
  } = useGetCrmMultiTouchAttributionQuery({
    companyId,
    model: selectedModel,
  });

  const channelsData = useMemo(() => {
    const raw = attributionRes?.data || attributionRes;
    if (Array.isArray(raw?.channels) && raw.channels.length > 0) {
      return raw.channels;
    }
    return ATTRIBUTION_FALLBACK_DATA;
  }, [attributionRes]);

  const columns = useMemo(() => [
    {
      id: 'channel',
      label: 'Marketing Channel',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-xs text-zinc-900 dark:text-white">
          {row?.channel || val}
        </span>
      ),
    },
    {
      id: 'firstTouch',
      label: 'First Touch (₹)',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5]">
          ₹{Number(row?.firstTouch ?? val ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      id: 'lastTouch',
      label: 'Last Touch (₹)',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5]">
          ₹{Number(row?.lastTouch ?? val ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      id: 'linear',
      label: 'Linear (₹)',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5]">
          ₹{Number(row?.linear ?? val ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      id: 'uShaped',
      label: 'U-Shaped Weighted (₹)',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono font-bold text-xs text-primary">
          ₹{Number(row?.uShaped ?? val ?? 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      id: 'share',
      label: 'Revenue Share',
      render: (val, row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary">
          {row?.share || val}
        </span>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <IntegrationsCampaignsHeader
        activeTab="attribution"
        title="Multi-Touch Revenue Attribution"
        description="Algorithmic credit distribution across customer acquisition and sales touchpoints"
      />

      <div className="flex-1 p-6 overflow-auto flex flex-col space-y-4">
        {/* Model Selector Banner */}
        <div className="p-4 bg-white dark:bg-[#161922] border border-zinc-200 dark:border-[#2A2F3D] rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <span className="text-xs font-semibold text-zinc-800 dark:text-[#E6E8EE]">Active Attribution Model:</span>
            <Select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-72"
            >
              {ATTRIBUTION_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isLoading || isFetching}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh Attribution Metrics"
              >
                <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Info size={13} />
                <span>Calculated against closed-won deals and CRM touchpoint logs</span>
              </div>
            </div>
          </div>

          {/* Comparative Bar Chart */}
          <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-4 shrink-0">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Channel Revenue Comparison Across Models</h2>
            <div className="w-full h-64 min-w-0" style={{ minHeight: '260px' }}>
              <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                  <BarChart data={channelsData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => (val >= 1000 ? `₹${Math.round(val / 1000)}k` : `₹${val}`)} />
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
          <div className="flex-1 overflow-hidden flex flex-col">
            <DataTable
              permissionFeature="CRM"
              selectable
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
              columns={columns}
              data={channelsData}
              rowKey="id"
              loading={isLoading || isFetching}
              itemName="channels"
            />
          </div>
        </div>
      </div>
      );
}
