import React, { useState } from 'react';
import { Modal } from '../../../components/common';
import { Cpu, AlertCircle } from 'lucide-react';
import { useCreateCrmAutomationRuleMutation } from '../../../api/sales-crm/crm.api';

export default function AutomationRuleModal({
  isOpen,
  onClose,
  companyId,
  pools = [],
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    ruleName: '',
    triggerEvent: 'LEAD_CREATED',
    conditionExpression: '#lead.leadScore >= 50',
    actionType: 'AUTO_ASSIGN_ROUND_ROBIN',
    poolId: '',
    taskTitle: '',
    isActive: true,
  });

  const [errorMsg, setErrorMsg] = useState(null);
  const [createRule, { isLoading }] = useCreateCrmAutomationRuleMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ruleName.trim()) {
      setErrorMsg('Rule name is required.');
      return;
    }

    try {
      setErrorMsg(null);
      const actionPayload = {};
      if (formData.actionType === 'AUTO_ASSIGN_ROUND_ROBIN') {
        actionPayload.poolId = formData.poolId || (pools[0]?.id || null);
      } else if (formData.actionType === 'CREATE_TASK') {
        actionPayload.taskTitle = formData.taskTitle || 'Follow up Lead immediately';
        actionPayload.priority = 'HIGH';
      }

      await createRule({
        companyId,
        data: {
          ruleName: formData.ruleName.trim(),
          triggerEvent: formData.triggerEvent,
          conditionExpression: formData.conditionExpression.trim(),
          actionType: formData.actionType,
          actionPayload: JSON.stringify(actionPayload),
          isActive: formData.isActive,
        },
      }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err.message || 'Failed to create automation rule');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Automation Rule"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
            Rule Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Auto-assign high intent website leads"
            value={formData.ruleName}
            onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Trigger Event
            </label>
            <select
              value={formData.triggerEvent}
              onChange={(e) => setFormData({ ...formData, triggerEvent: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            >
              <option value="LEAD_CREATED">When New Lead is Created</option>
              <option value="LEAD_SCORE_CHANGED">When Lead Score Changes</option>
              <option value="DEAL_STAGE_CHANGED">When Opportunity Moves Stage</option>
              <option value="DEAL_WON">When Opportunity is Won</option>
              <option value="QUOTATION_APPROVED">When Quotation is Approved</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Action to Execute
            </label>
            <select
              value={formData.actionType}
              onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            >
              <option value="AUTO_ASSIGN_ROUND_ROBIN">Auto Assign via Round-Robin Pool</option>
              <option value="CREATE_TASK">Generate Automated Task</option>
              <option value="DISPATCH_NOTIFICATION">Send Alert Notification</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
            Condition Expression (Spring SpEL)
          </label>
          <input
            type="text"
            placeholder="#lead.leadScore >= 50 or #lead.state == 'Maharashtra'"
            value={formData.conditionExpression}
            onChange={(e) => setFormData({ ...formData, conditionExpression: e.target.value })}
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#161922] text-zinc-800 dark:text-[#E6E8EE]"
          />
          <span className="text-[10px] text-zinc-500 mt-1 block">
            Safe expression evaluated against inbound entity context (e.g. #lead.leadScore, #deal.dealValue)
          </span>
        </div>

        {formData.actionType === 'AUTO_ASSIGN_ROUND_ROBIN' && (
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Select Round-Robin Sales Pool
            </label>
            <select
              value={formData.poolId}
              onChange={(e) => setFormData({ ...formData, poolId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            >
              <option value="">Default Sales Rep Pool</option>
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.poolName} ({p.routingStrategy})
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.actionType === 'CREATE_TASK' && (
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#E6E8EE] mb-1">
              Automated Task Title
            </label>
            <input
              type="text"
              placeholder="e.g. Connect within 15 minutes - High Intent Lead"
              value={formData.taskTitle}
              onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] text-zinc-900 dark:text-white"
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isRuleActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-zinc-300 dark:border-[#2A2F3D] text-primary"
          />
          <label htmlFor="isRuleActive" className="text-xs text-zinc-700 dark:text-[#A0A6B5] cursor-pointer">
            Rule is active and evaluated on all real-time events
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs px-3.5 py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
          >
            <Cpu size={13} />
            {isLoading ? 'Saving...' : 'Save Automation Rule'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

