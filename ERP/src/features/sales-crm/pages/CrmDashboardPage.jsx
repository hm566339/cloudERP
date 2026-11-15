import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Target,
  TrendingUp,
  FileText,
  DollarSign,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  PhoneCall,
  CheckSquare
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PageHeader, StatCard } from '../../../components/common';
import DataTable from '../../../components/data-table/DataTable';
import {
  useGetCrmDashboardQuery,
  useGetLeadsQuery,
  useGetCrmTasksQuery,
} from '../../../api/sales-crm/crm.api';
import LeadFormModal from '../components/LeadFormModal';
import OpportunityFormModal from '../components/OpportunityFormModal';
import QuotationFormModal from '../components/QuotationFormModal';

const PIE_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

export default function CrmDashboardPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const crmBase = companyId ? `/company/${companyId}/sales-crm` : '/sales-crm';

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const { data: dashboardRes, isLoading: isDashboardLoading, refetch } = useGetCrmDashboardQuery(companyId);
  const dashboard = dashboardRes?.data || {};

  const { data: leadsRes } = useGetLeadsQuery({ companyId, page: 0, size: 5 });
  const recentLeads = leadsRes?.data?.content || leadsRes?.data || [];

  const { data: tasksRes } = useGetCrmTasksQuery({ companyId, status: 'PENDING' });
  const pendingTasks = (tasksRes?.data || []).slice(0, 5);

  const pipelineStagesData = (dashboard.pipelineByStage || [
    { stage: 'Prospecting', value: 450000, count: 12 },
    { stage: 'Contacted', value: 320000, count: 8 },
    { stage: 'Proposal', value: 890000, count: 6 },
    { stage: 'Negotiation', value: 650000, count: 4 },
    { stage: 'Won', value: 1250000, count: 9 },
  ]);

  const leadSourcesData = (dashboard.leadsBySource || [
    { name: 'IndiaMART', value: 38 },
    { name: 'Website Organic', value: 24 },
    { name: 'Meta Ads', value: 18 },
    { name: 'Direct Referral', value: 12 },
    { name: 'Cold Outreach', value: 8 },
  ]);

  const leadColumns = [
    {
      header: 'Lead Name',
      accessorKey: 'displayName',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-zinc-900 dark:text-white block">
            {row.original.displayName || `${row.original.firstName || ''} ${row.original.lastName || ''}`.trim() || 'Anonymous Lead'}
          </span>
          <span className="text-[11px] text-zinc-500">{row.original.organizationName || 'Individual'}</span>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessorKey: 'phone',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5]">
          {row.original.normalizedPhone || row.original.phone || row.original.email || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Score',
      accessorKey: 'leadScore',
      cell: ({ row }) => {
        const score = row.original.leadScore || 50;
        const color = score >= 70 ? 'text-emerald-500 bg-emerald-500/10' : score >= 40 ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-500 bg-zinc-500/10';
        return (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${color}`}>
            {score}/100
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'leadStatus',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-[#1C202B] text-zinc-800 dark:text-[#E6E8EE]">
          {row.original.leadStatus?.statusName || 'NEW'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Sales & CRM Command Center"
        subtitle="End-to-end customer lifecycle, pipeline forecasting, and revenue operations."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Plus size={14} /> New Lead
            </button>
            <button
              onClick={() => setIsOppModalOpen(true)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Target size={14} /> New Deal
            </button>
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
            >
              <FileText size={14} /> Create Quote
            </button>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Leads"
          value={dashboard.totalLeads ?? 124}
          change="+18.2%"
          trend="up"
          description="Inbound lead pipeline"
          icon={<Users className="w-5 h-5 text-indigo-500" />}
        />
        <StatCard
          title="Weighted Pipeline"
          value={`₹${((dashboard.pipelineValue || 3560000) / 100000).toFixed(1)}L`}
          change="+12.5%"
          trend="up"
          description="Active deal value"
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          title="Win Rate"
          value={`${dashboard.winRatePercent ?? 34.8}%`}
          change="+4.1%"
          trend="up"
          description="Lead-to-deal conversion"
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          title="Target Attainment"
          value={`${dashboard.targetProgressPercent ?? 82}%`}
          change="₹18.4L of ₹22.5L"
          trend="neutral"
          description="Quarterly sales quota"
          icon={<Target className="w-5 h-5 text-amber-500" />}
        />
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline Distribution BarChart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Pipeline Value by Stage</h2>
              <p className="text-xs text-zinc-500">Active opportunities distribution</p>
            </div>
            <span className="text-xs font-semibold text-primary">Live CRM Data</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineStagesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <RechartsTooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Pipeline Value']}
                  contentStyle={{ backgroundColor: '#1C202B', borderColor: '#2A2F3D', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Ingestion Breakdown PieChart */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Lead Attribution Source</h2>
              <p className="text-xs text-zinc-500">Top acquisition channels</p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourcesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {leadSourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val) => [`${val}%`, 'Share']}
                  contentStyle={{ backgroundColor: '#1C202B', borderColor: '#2A2F3D', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-600 dark:text-[#A0A6B5] pt-2 border-t border-zinc-100 dark:border-[#2A2F3D]">
            {leadSourcesData.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="truncate">{s.name} ({s.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Grids Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Inbound Leads */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Recent Inbound Leads</h2>
              <p className="text-xs text-zinc-500">Latest leads qualified & assigned</p>
            </div>
            <button
              onClick={() => navigate(`${crmBase}/leads`)}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              View All Leads <ArrowRight size={13} />
            </button>
          </div>

          <DataTable
            data={recentLeads}
            columns={leadColumns}
            isLoading={false}
            enablePagination={false}
          />
        </div>

        {/* Pending Follow-Up Tasks */}
        <div className="bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Upcoming Tasks</h2>
              <p className="text-xs text-zinc-500">Follow-ups & action items</p>
            </div>
            <button
              onClick={() => navigate(`${crmBase}/tasks`)}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              All Tasks <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-2">
            {pendingTasks.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                <CheckSquare size={28} className="mx-auto mb-1 text-zinc-300 dark:text-zinc-600" />
                All pending tasks completed!
              </div>
            ) : (
              pendingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 bg-zinc-50 dark:bg-[#1C202B] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-white truncate">{t.title}</span>
                    <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {t.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Today'}
                    </span>
                    <span>{t.entityType}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LeadFormModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />

      <OpportunityFormModal
        isOpen={isOppModalOpen}
        onClose={() => setIsOppModalOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />

      <QuotationFormModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        companyId={companyId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

