import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Megaphone,
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { PageHeader, StatCard } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';
import { useGetCrmCampaignsQuery } from '../../../api/sales-crm/crm.api';
import CampaignFormModal from '../components/CampaignFormModal';

export default function CampaignsPage() {
  const { companyId } = useParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: campaignsRes, isLoading, refetch } = useGetCrmCampaignsQuery({ companyId });
  const campaigns = campaignsRes?.data?.content || campaignsRes?.data || [];

  const totalBudget = campaigns.reduce((acc, c) => acc + (Number(c.budget) || 0), 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + (Number(c.actualRevenueWon) || 0), 0);
  const overallRoi = totalBudget > 0 ? (((totalRevenue - totalBudget) / totalBudget) * 100).toFixed(1) : 0;

  const columns = [
    {
      header: 'Campaign & Code',
      accessorKey: 'name',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-semibold text-zinc-900 dark:text-white text-xs block">{c.name}</span>
            <span className="text-[11px] font-mono text-zinc-500">{c.code}</span>
          </div>
        );
      },
    },
    {
      header: 'Channel & Type',
      accessorKey: 'channel',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-zinc-800 dark:text-[#E6E8EE] block">
            {row.original.channel || 'MARKETPLACE'}
          </span>
          <span className="text-[11px] text-zinc-500">{row.original.type || 'Inbound'}</span>
        </div>
      ),
    },
    {
      header: 'Budget & Spend',
      accessorKey: 'budget',
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5">
          <span className="font-mono font-semibold text-zinc-900 dark:text-white block">
            Budget: ₹{(row.original.budget || 0).toLocaleString('en-IN')}
          </span>
          <span className="font-mono text-[11px] text-zinc-500">
            Spend: ₹{(row.original.actualSpend || row.original.budget || 0).toLocaleString('en-IN')}
          </span>
        </div>
      ),
    },
    {
      header: 'Revenue Won',
      accessorKey: 'actualRevenueWon',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-emerald-600 text-xs">
          ₹{(row.original.actualRevenueWon || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'ROI %',
      accessorKey: 'roiPercent',
      cell: ({ row }) => {
        const budget = Number(row.original.budget) || 0;
        const revenue = Number(row.original.actualRevenueWon) || 0;
        const roi = budget > 0 ? (((revenue - budget) / budget) * 100).toFixed(0) : 0;
        const isPositive = Number(roi) > 0;

        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
            isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-100 text-zinc-600'
          }`}>
            {isPositive ? `+${roi}%` : `${roi}%`}
          </span>
        );
      },
    },
    {
      header: 'Leads Generated',
      accessorKey: 'leadsCount',
      cell: ({ row }) => (
        <span className="font-semibold text-xs text-zinc-800 dark:text-[#E6E8EE]">
          {row.original.leadsCount || 0} Leads
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Marketing Campaigns & Spend"
        subtitle={`Monitoring ${campaigns.length} campaigns across digital, search, and marketplace channels.`}
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={14} /> New Campaign
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Budget Allocated"
          value={`₹${(totalBudget / 100000).toFixed(1)}L`}
          description="Cumulative marketing budget"
          icon={<DollarSign className="w-5 h-5 text-indigo-500" />}
        />
        <StatCard
          title="Revenue Won"
          value={`₹${(totalRevenue / 100000).toFixed(1)}L`}
          trend="up"
          change="+24%"
          description="Attributed closed deals"
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          title="Portfolio ROI"
          value={`${overallRoi}%`}
          trend="up"
          description="Marketing return on investment"
          icon={<Target className="w-5 h-5 text-amber-500" />}
        />
      </div>

      <DataTable
        data={campaigns}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
      />

      <CampaignFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

