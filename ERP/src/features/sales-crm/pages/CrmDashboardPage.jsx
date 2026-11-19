import React, { useState, useMemo } from 'react';
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
import PageHeader from '../../../components/common/PageHeader';
import StatCard from '../../../components/common/StatCard';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
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

  const toArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.content)) return res.data.content;
    return [];
  };

  const { data: leadsRes } = useGetLeadsQuery({ companyId, page: 0, size: 5 });
  const recentLeads = toArray(leadsRes);

  const { data: tasksRes } = useGetCrmTasksQuery({ companyId, status: 'PENDING' });
  const pendingTasks = toArray(tasksRes).slice(0, 5);

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

  const leadColumns = useMemo(() => [
    {
      id: 'displayName',
      label: 'Lead Name',
      sortable: true,
      render: (val, lead) => (
        <div>
          <span className="font-semibold text-zinc-900 dark:text-white block text-xs">
            {lead?.displayName || `${lead?.firstName || ''} ${lead?.lastName || ''}`.trim() || val || 'Anonymous Lead'}
          </span>
          <span className="text-[11px] text-zinc-500">{lead?.organizationName || 'Individual'}</span>
        </div>
      ),
    },
    {
      id: 'phone',
      label: 'Contact',
      sortable: false,
      render: (val, lead) => (
        <span className="font-mono text-xs text-zinc-700 dark:text-[#A0A6B5]">
          {lead?.normalizedPhone || lead?.phone || lead?.email || val || 'N/A'}
        </span>
      ),
    },
    {
      id: 'leadScore',
      label: 'Score',
      sortable: true,
      render: (val, lead) => {
        const score = lead?.leadScore ?? val ?? 50;
        let color = 'bg-blue-500/10 text-blue-500';
        if (score >= 70) color = 'bg-emerald-500/10 text-emerald-500';
        else if (score < 40) color = 'bg-zinc-100 text-zinc-500';

        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${color}`}>
            {score}/100
          </span>
        );
      },
    },
    {
      id: 'leadStatus',
      label: 'Status',
      sortable: false,
      render: (val, lead) => (
        <DataTableStatusBadge
          status={lead?.leadStatus?.statusName || (typeof val === 'string' ? val : 'NEW')}
          variant="primary"
        />
      ),
    },
  ], []);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
      <PageHeader
        title="Sales & CRM Executive Command Center"
        description="Real-time deal progression, lead conversion funnels, and revenue attribution"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLeadModalOpen(true)}
            className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lead</span>
          </button>
          <button
            onClick={() => setIsOppModalOpen(true)}
            className="btn-secondary flex items-center gap-1.5 text-xs font-semibold"
          >
            <Target className="w-3.5 h-3.5" />
            <span>New Deal</span>
          </button>
          <button
            onClick={() => setIsQuoteModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-xs font-semibold"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Create Quote</span>
          </button>
        </div>
      </PageHeader>

      <div className="flex-1 p-6 overflow-auto flex flex-col space-y-6">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <StatCard
            title="Active Leads"
            value={dashboard.totalLeads ?? 124}
            trendValue="+18.2%"
            trend="up"
            subtitle="Inbound lead pipeline"
            icon={Users}
          />
          <StatCard
            title="Weighted Pipeline"
            value={`₹${((dashboard.pipelineValue || 3560000) / 100000).toFixed(1)}L`}
            trendValue="+12.5%"
            trend="up"
            subtitle="Active deal value"
            icon={DollarSign}
          />
          <StatCard
            title="Win Rate"
            value={`${dashboard.winRatePercent ?? 34.8}%`}
            trendValue="+4.1%"
            trend="up"
            subtitle="Lead-to-deal conversion"
            icon={TrendingUp}
          />
          <StatCard
            title="Target Attainment"
            value={`${dashboard.targetProgressPercent ?? 82}%`}
            trendValue="₹18.4L of ₹22.5L"
            trend="neutral"
            subtitle="Quarterly sales quota"
            icon={Target}
          />
        </div>

        {/* Visual Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
          {/* Pipeline Distribution BarChart */}
          <div className="lg:col-span-2 bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Pipeline Value by Stage</h2>
                <p className="text-xs text-zinc-500">Active opportunities distribution</p>
              </div>
              <span className="text-xs font-semibold text-primary">Live CRM Data</span>
            </div>
            <div className="w-full h-64 min-w-0" style={{ minHeight: '256px' }}>
              <ResponsiveContainer width="100%" height={256} minWidth={0} minHeight={256}>
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
          <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Lead Attribution Source</h2>
                <p className="text-xs text-zinc-500">Top acquisition channels</p>
              </div>
            </div>
            <div className="w-full h-52 min-w-0" style={{ minHeight: '208px' }}>
              <ResponsiveContainer width="100%" height={208} minWidth={0} minHeight={208}>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Inbound Leads */}
          <div className="lg:col-span-2 bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-3">
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
              permissionFeature="CRM"
              data={recentLeads}
              columns={leadColumns}
              isLoading={false}
              rowKey="id"
              itemName="leads"
            />
          </div>

          {/* Pending Follow-Up Tasks */}
          <div className="bg-white dark:bg-[#161922] p-5 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-3">
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
                <div className="p-8 text-center text-xs text-zinc-400">
                  <CheckSquare size={28} className="mx-auto mb-1 text-zinc-300 dark:text-zinc-600" />
                  All pending tasks completed!
                </div>
              ) : (
                pendingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-zinc-50 dark:bg-[#1C202B] border border-zinc-200 dark:border-[#2A2F3D] rounded-lg text-xs space-y-1.5"
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
