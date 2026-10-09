import React, { useState } from 'react';
import {
  FileText, CheckSquare, MessageSquare, Paperclip, History, ArrowLeft,
} from 'lucide-react';
import WorkflowStatusBadge from './WorkflowStatusBadge';
import WorkflowStepper from './WorkflowStepper';
import DynamicFormRenderer from './DynamicFormRenderer';
import WorkflowActionBar from './WorkflowActionBar';
import WorkflowTaskPanel from './WorkflowTaskPanel';
import WorkflowCommentsPanel from './WorkflowCommentsPanel';
import WorkflowAttachmentsPanel from './WorkflowAttachmentsPanel';
import WorkflowTimeline from './WorkflowTimeline';

export default function WorkflowRenderer({
  workflowData,
  onAction,
  onAddComment,
  onUploadAttachment,
  onBack,
  isActionLoading = false,
}) {
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'tasks' | 'comments' | 'attachments' | 'timeline'
  const [formData, setFormData] = useState({});

  if (!workflowData) {
    return null;
  }

  const {
    transaction,
    definition,
    currentStage,
    permittedActions = {},
    tasks = [],
    currentTask,
    comments = [],
    attachments = [],
    auditTrail = [],
    formSchema,
  } = workflowData;

  const stages = definition?.stages || [];
  const currentStageSequence = transaction?.currentStageSequence || 1;

  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const tabs = [
    { id: 'form', label: 'Document & Form', icon: FileText, count: null },
    { id: 'tasks', label: 'Approval Tasks', icon: CheckSquare, count: tasks.length },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
    { id: 'attachments', label: 'Attachments', icon: Paperclip, count: attachments.length },
    { id: 'timeline', label: 'Audit Timeline', icon: History, count: auditTrail.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors"
                title="Go Back"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  {transaction?.documentType} #{transaction?.documentNumber || transaction?.id}
                </h2>
                <WorkflowStatusBadge status={transaction?.status} />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Workflow: <span className="font-semibold text-zinc-700">{definition?.workflowName || 'Default'}</span> &bull;
                Initiated by <span className="font-semibold text-zinc-700">{transaction?.initiatedByName || 'User'}</span> on{' '}
                {transaction?.initiatedAt ? new Date(transaction?.initiatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {transaction?.currentStageName && (
              <div className="text-right">
                <span className="text-[11px] text-zinc-400 block font-medium">Current Stage</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {transaction.currentStageName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stepper Progress */}
      {stages.length > 0 && (
        <WorkflowStepper
          stages={stages}
          currentStageId={transaction?.currentStageId}
          currentStageSequence={currentStageSequence}
          status={transaction?.status}
        />
      )}

      {/* Action Bar */}
      <WorkflowActionBar
        permittedActions={permittedActions}
        onAction={onAction}
        isSubmitting={isActionLoading}
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'form' && (
          <DynamicFormRenderer
            formSchema={formSchema}
            formData={formData}
            onChange={handleFieldChange}
            readOnly={!permittedActions.canSubmit}
          />
        )}

        {activeTab === 'tasks' && (
          <WorkflowTaskPanel
            tasks={tasks}
            currentTaskId={currentTask?.id}
          />
        )}

        {activeTab === 'comments' && (
          <WorkflowCommentsPanel
            comments={comments}
            onAddComment={onAddComment}
            canAddComment={permittedActions.canAddComment}
            isPosting={isActionLoading}
          />
        )}

        {activeTab === 'attachments' && (
          <WorkflowAttachmentsPanel
            attachments={attachments}
            onUpload={onUploadAttachment}
            canUpload={permittedActions.canUploadAttachment}
            isUploading={isActionLoading}
          />
        )}

        {activeTab === 'timeline' && (
          <WorkflowTimeline auditTrail={auditTrail} />
        )}
      </div>
    </div>
  );
}
