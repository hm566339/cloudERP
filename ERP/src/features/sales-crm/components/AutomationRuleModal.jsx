import React, { useState, useMemo } from 'react';
import { Modal, FormField, Input, Select, Button } from '../../../components/common';
import { Cpu, AlertCircle } from 'lucide-react';
import {
  useCreateCrmAutomationRuleMutation,
  useGetCrmRoundRobinPoolsQuery,
} from '../../../api/sales-crm/crm.api';

const toArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
};

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

  const { data: fetchedPoolsRes } = useGetCrmRoundRobinPoolsQuery(companyId, { skip: !isOpen });

  const availablePools = useMemo(() => {
    const fromProps = toArray(pools);
    if (fromProps.length > 0) return fromProps;
    return toArray(fetchedPoolsRes);
  }, [pools, fetchedPoolsRes]);

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
        actionPayload.poolId = formData.poolId || (availablePools[0]?.id || null);
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

        <FormField label="Rule Name" required>
          <Input
            type="text"
            required
            placeholder="e.g. Auto-assign high intent website leads"
            value={formData.ruleName}
            onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Trigger Event">
            <Select
              value={formData.triggerEvent}
              onChange={(e) => setFormData({ ...formData, triggerEvent: e.target.value })}
            >
              <option value="LEAD_CREATED">When New Lead is Created</option>
              <option value="LEAD_SCORE_CHANGED">When Lead Score Changes</option>
              <option value="DEAL_STAGE_CHANGED">When Opportunity Moves Stage</option>
              <option value="DEAL_WON">When Opportunity is Won</option>
              <option value="QUOTATION_APPROVED">When Quotation is Approved</option>
            </Select>
          </FormField>

          <FormField label="Action to Execute">
            <Select
              value={formData.actionType}
              onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
            >
              <option value="AUTO_ASSIGN_ROUND_ROBIN">Auto Assign via Round-Robin Pool</option>
              <option value="CREATE_TASK">Generate Automated Task</option>
              <option value="DISPATCH_NOTIFICATION">Send Alert Notification</option>
            </Select>
          </FormField>
        </div>

        <FormField
          label="Condition Expression (Spring SpEL)"
          hint="Safe expression evaluated against inbound entity context (e.g. #lead.leadScore, #deal.dealValue)"
        >
          <Input
            type="text"
            placeholder="#lead.leadScore >= 50 or #lead.state == 'Maharashtra'"
            value={formData.conditionExpression}
            onChange={(e) => setFormData({ ...formData, conditionExpression: e.target.value })}
            className="font-mono"
          />
        </FormField>

        {formData.actionType === 'AUTO_ASSIGN_ROUND_ROBIN' && (
          <FormField label="Select Round-Robin Sales Pool">
            <Select
              value={formData.poolId}
              onChange={(e) => setFormData({ ...formData, poolId: e.target.value })}
            >
              <option value="">Default Sales Rep Pool</option>
              {availablePools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.poolName} ({p.routingStrategy})
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {formData.actionType === 'CREATE_TASK' && (
          <FormField label="Automated Task Title">
            <Input
              type="text"
              placeholder="e.g. Connect within 15 minutes - High Intent Lead"
              value={formData.taskTitle}
              onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
            />
          </FormField>
        )}

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isRuleActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-zinc-300 dark:border-[#2A2F3D] text-primary cursor-pointer"
          />
          <label htmlFor="isRuleActive" className="text-xs text-zinc-700 dark:text-[#A0A6B5] cursor-pointer">
            Rule is active and evaluated on all real-time events
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#2A2F3D]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isLoading}
            icon={Cpu}
          >
            Save Automation Rule
          </Button>
        </div>
      </form>
    </Modal>
  );
}

