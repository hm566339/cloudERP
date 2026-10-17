import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Target,
  Users,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Mail,
  Clock,
  Sparkles
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../features/notifications/notificationSlice';
import {
  SettingsLayout,
  SettingsCard,
  SettingsSelect,
  SettingsToggle,
  SettingsInput,
  SettingsSaveButton,
} from '../../components/settings/shared';

export default function CrmSettingsPage() {
  const dispatch = useDispatch();
  const { companyId } = useParams();
  const prefix = companyId ? `/company/${companyId}` : '';

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [defaultLeadSource, setDefaultLeadSource] = useState('WEBSITE');
  const [autoAssignLeads, setAutoAssignLeads] = useState(true);
  const [quotationValidityDays, setQuotationValidityDays] = useState('30');
  const [emailOnNewLead, setEmailOnNewLead] = useState(true);
  const [requireDiscountApproval, setRequireDiscountApproval] = useState(true);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSuccess(true);
      dispatch(
        addAlert({
          type: 'success',
          message: 'CRM settings updated successfully',
        })
      );
      setTimeout(() => setIsSuccess(false), 2000);
    }, 600);
  };

  return (
    <SettingsLayout
      title="CRM Module Settings"
      description="Configure lead intake, customer communication, sales pipeline thresholds, and quote validity."
      badge="CRM"
    >
      {/* ── Active Features & Direct Management Shortcuts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link
          to={`${prefix}/crm/leads`}
          className="p-3.5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Target size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Leads Pipeline</p>
              <p className="text-[10px] text-zinc-500">Track deal stages</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to={`${prefix}/crm/communication`}
          className="p-3.5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Communication</p>
              <p className="text-[10px] text-zinc-500">Customer touchpoints & logs</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to={`${prefix}/crm/analytics`}
          className="p-3.5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <BarChart3 size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Sales Analytics</p>
              <p className="text-[10px] text-zinc-500">Performance & win rates</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* ── Lead Intake & Lifecycle Rules ── */}
      <SettingsCard
        title="Lead Management Rules"
        description="Set default sources and routing rules for incoming inquiries."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsSelect
            id="lead-source"
            label="Default Lead Source"
            description="Assigned to new leads when not specified."
            value={defaultLeadSource}
            onChange={(e) => setDefaultLeadSource(e.target.value)}
            options={[
              { label: 'Website Form / Inbound', value: 'WEBSITE' },
              { label: 'Direct Referral', value: 'REFERRAL' },
              { label: 'Trade Show / Conference', value: 'EVENT' },
              { label: 'Outbound Campaign', value: 'CAMPAIGN' },
            ]}
          />
          <SettingsInput
            id="quotation-validity"
            label="Quotation Default Validity (Days)"
            description="Days before a dispatched quote expires automatically."
            type="number"
            value={quotationValidityDays}
            onChange={(e) => setQuotationValidityDays(e.target.value)}
          />
        </div>

        <div className="border-t border-zinc-100 my-4 pt-4 space-y-4">
          <SettingsToggle
            label="Round-Robin Auto Assignment"
            description="Evenly distribute new inbound leads among active sales representatives."
            checked={autoAssignLeads}
            onChange={setAutoAssignLeads}
          />
          <div className="border-t border-zinc-100 my-2"></div>
          <SettingsToggle
            label="Email Alert on New Inbound Lead"
            description="Notify the sales team immediately upon new customer registration or inquiry."
            checked={emailOnNewLead}
            onChange={setEmailOnNewLead}
          />
          <div className="border-t border-zinc-100 my-2"></div>
          <SettingsToggle
            label="Require Discount Approval (> 15%)"
            description="Trigger quotation approval if line-item or header discount exceeds 15%."
            checked={requireDiscountApproval}
            onChange={setRequireDiscountApproval}
          />
        </div>
      </SettingsCard>

      <SettingsSaveButton onClick={handleSave} isSaving={isSaving} isSuccess={isSuccess} />
    </SettingsLayout>
  );
}
