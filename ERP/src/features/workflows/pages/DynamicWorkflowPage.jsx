import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { workflowExecutionApi } from '../services/workflowService';
import WorkflowRenderer from '../components/WorkflowRenderer';
import { ListSkeleton } from '../../../components/common/SkeletonLoader';
import ErrorState from '../../../components/common/ErrorState';

export default function DynamicWorkflowPage() {
  const { transactionId, documentType, documentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedCompany = useAppSelector((state) => state.company?.selectedCompany);
  const currentUser = useAppSelector((state) => state.auth?.user);

  const companyId =
    selectedCompany?.id ||
    selectedCompany?.code ||
    currentUser?.companyId ||
    currentUser?.companyCode ||
    null;

  const [workflowData, setWorkflowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadWorkflowDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (transactionId) {
        data = await workflowExecutionApi.getUiDetails(transactionId, companyId);
      } else if (documentType && documentId) {
        data = await workflowExecutionApi.getUiDetailsByDocument(documentType, documentId, companyId);
      } else {
        throw new Error('Missing transactionId or documentType/documentId parameter');
      }

      setWorkflowData(data);
    } catch (err) {
      console.error('Failed to load workflow details:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load workflow state.');
    } finally {
      setLoading(false);
    }
  }, [transactionId, documentType, documentId, companyId]);

  useEffect(() => {
    loadWorkflowDetails();
  }, [loadWorkflowDetails]);

  const handleAction = async ({ action, comment, targetUserId }) => {
    try {
      setIsActionLoading(true);
      const currentTask = workflowData?.currentTask;
      const currentTxnId = workflowData?.transaction?.id;

      switch (action) {
        case 'APPROVE':
          if (!currentTask?.id) throw new Error('No active task to approve.');
          await workflowExecutionApi.approveTask(currentTask.id, comment || 'Approved');
          dispatch(addAlert({ type: 'success', message: 'Task approved successfully.' }));
          break;

        case 'REJECT':
          if (!currentTask?.id) throw new Error('No active task to reject.');
          await workflowExecutionApi.rejectTask(currentTask.id, comment || 'Rejected');
          dispatch(addAlert({ type: 'success', message: 'Task rejected.' }));
          break;

        case 'RETURN':
          if (!currentTask?.id) throw new Error('No active task to return.');
          await workflowExecutionApi.returnTask(currentTask.id, comment || 'Returned for revision');
          dispatch(addAlert({ type: 'success', message: 'Task returned to initiator.' }));
          break;

        case 'DELEGATE':
          if (!currentTask?.id) throw new Error('No active task to delegate.');
          if (!targetUserId) throw new Error('Target user is required for delegation.');
          await workflowExecutionApi.delegateTask(currentTask.id, targetUserId, comment || 'Delegated');
          dispatch(addAlert({ type: 'success', message: 'Task delegated successfully.' }));
          break;

        case 'CANCEL':
          if (!currentTxnId) throw new Error('Transaction ID is required to cancel.');
          await workflowExecutionApi.cancelWorkflow(currentTxnId, comment || 'Cancelled by user');
          dispatch(addAlert({ type: 'success', message: 'Workflow cancelled.' }));
          break;

        case 'SUBMIT':
          if (!currentTxnId) throw new Error('Transaction ID is required.');
          dispatch(addAlert({ type: 'info', message: 'Submitting workflow update...' }));
          break;

        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      // Reload authoritative workflow details from backend
      await loadWorkflowDetails();
    } catch (err) {
      console.error(`Workflow action ${action} failed:`, err);
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || err.message || `Action ${action} failed.`,
      }));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddComment = async (commentText, isInternal) => {
    const txnId = workflowData?.transaction?.id;
    if (!txnId) return;

    try {
      setIsActionLoading(true);
      await workflowExecutionApi.addComment(txnId, commentText, isInternal);
      dispatch(addAlert({ type: 'success', message: 'Comment posted.' }));
      await loadWorkflowDetails();
    } catch (err) {
      console.error('Failed to post comment:', err);
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || err.message || 'Failed to post comment.',
      }));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUploadAttachment = async (file) => {
    const txnId = workflowData?.transaction?.id;
    if (!txnId || !file) return;

    try {
      setIsActionLoading(true);
      const taskId = workflowData?.currentTask?.id;
      await workflowExecutionApi.uploadAttachment(txnId, file, taskId);
      dispatch(addAlert({ type: 'success', message: 'File uploaded successfully.' }));
      await loadWorkflowDetails();
    } catch (err) {
      console.error('Failed to upload file:', err);
      dispatch(addAlert({
        type: 'error',
        message: err?.response?.data?.message || err.message || 'Failed to upload attachment.',
      }));
    } finally {
      setIsActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <ListSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ErrorState
          title="Workflow Unavailable"
          message={error}
          onRetry={loadWorkflowDetails}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto dark:bg-page-dark">
      <WorkflowRenderer
        workflowData={workflowData}
        onAction={handleAction}
        onAddComment={handleAddComment}
        onUploadAttachment={handleUploadAttachment}
        onBack={() => navigate(-1)}
        isActionLoading={isActionLoading}
      />
    </div>
  );
}
