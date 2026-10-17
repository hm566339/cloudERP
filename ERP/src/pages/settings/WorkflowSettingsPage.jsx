import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Workflow,
  CheckCircle2,
  GitBranch,
  Clock,
  ArrowRight,
  Shield,
  FileCheck,
  BellRing
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../features/notifications/notificationSlice';
import {
  SettingsLayout,
  SettingsCard,
  SettingsSelect,
  SettingsToggle,
  SettingsSaveButton,
} from '../../components/settings/shared';

export default function WorkflowSettingsPage() {
  const dispatch = useDispatch();
  const { companyId } = useParams();
  const prefix = companyId ? `/company/${companyId}` : '';

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [requireQuotationApproval, setRequireQuotationApproval] = useState(true);
  const [requireInvoiceApproval, setRequireInvoiceApproval] = useState(true);
  const [requirePOApproval, setRequirePOApproval] = useState(true);
  const [escalationHours, setEscalationHours] = useState('24');
  const [notifyOnTaskAssignment, setNotifyOnTaskAssignment] = useState(true);
  const [autoApproveLowValue, setAutoApproveLowValue] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSuccess(true);
      dispatch(
        addAlert({
          type: 'success',
          message: 'Workflow settings updated successfully',
        })
      );
      setTimeout(() => setIsSuccess(false), 2000);
    }, 600);
  };

  return (
    <SettingsLayout
      title="Workflow Automation Settings"
      description="Manage approval chains, state machines, document flow triggers, and task escalations."
      badge="WORKFLOW"
    >
      {/* ── Active Features & Direct Management Shortcuts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <Link
          to={`${prefix}/workflows`}
          className="p-3.5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Workflow size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Workflow Definitions</p>
              <p className="text-[10px] text-zinc-500">Design approval flows & steps</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to={`${prefix}/workflows/approvals`}
          className="p-3.5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-300 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileCheck size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">Pending Approvals</p>
              <p className="text-[10px] text-zinc-500">Review & approve transaction queue</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* ── Global Approval Rules ── */}
      <SettingsCard
        title="Document Approval Policies"
        description="Choose which financial and sales documents require formal approval before confirmation."
      >
        <div className="space-y-4">
          <SettingsToggle
            label="Quotation Approval Required"
            description="Require sales manager approval before sending quotations above threshold to customers."
            checked={requireQuotationApproval}
            onChange={setRequireQuotationApproval}
          />
          <div className="border-t border-zinc-100 my-2"></div>
          <SettingsToggle
            label="Sales Invoice Approval Required"
            description="Prevent posting sales invoices to General Ledger without authorized accountant sign-off."
            checked={requireInvoiceApproval}
            onChange={setRequireInvoiceApproval}
          />
          <div className="border-t border-zinc-100 my-2"></div>
          <SettingsToggle
            label="Purchase Order Approval Required"
            description="Require procurement director approval before issuing POs to external vendors."
            checked={requirePOApproval}
            onChange={setRequirePOApproval}
          />
          <div className="border-t border-zinc-100 my-2"></div>
          <SettingsToggle
            label="Auto-Approve Low Value Orders"
            description="Automatically approve purchase orders and invoices under ₹10,000 without human intervention."
            checked={autoApproveLowValue}
            onChange={setAutoApproveLowValue}
          />
        </div>
      </SettingsCard>

      {/* ── Escalations & SLA ── */}
      <SettingsCard
        title="SLA & Escalation Deadlines"
        description="Configure automatic reassignment when approval tasks sit unhandled."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsSelect
            id="escalation-hours"
            label="Approval Task Timeout"
            description="Reassign to secondary approver if unacted upon."
            value={escalationHours}
            onChange={(e) => setEscalationHours(e.target.value)}
            options={[
              { label: '12 Hours', value: '12' },
              { label: '24 Hours (1 Day)', value: '24' },
              { label: '48 Hours (2 Days)', value: '48' },
              { label: '72 Hours (3 Days)', value: '72' },
              { label: 'Never (No timeout)', value: '0' },
            ]}
          />
        </div>

        <div className="border-t border-zinc-100 my-4 pt-4">
          <SettingsToggle
            label="Email Dispatch on Task Assignment"
            description="Immediately email assigned approver with a direct one-click review link."
            checked={notifyOnTaskAssignment}
            onChange={setNotifyOnTaskAssignment}
          />
        </div>
      </SettingsCard>

      <SettingsSaveButton onClick={handleSave} isSaving={isSaving} isSuccess={isSuccess} />
    </SettingsLayout>
  );
}
