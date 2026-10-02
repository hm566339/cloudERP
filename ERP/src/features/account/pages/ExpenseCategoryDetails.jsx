import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Edit2, 
  AlertCircle, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../../../hooks/useApi';
import { expenseCategoriesApi } from '../../../api/account';
import { useAppDispatch } from '../../../app/hooks';
import { addAlert } from '../../notifications/notificationSlice';
import { useRoutePath } from '../../../hooks/useRoutePath';
import { confirmDialog } from '../../../utils/confirmDialog';
import RequirePermission from '../../../components/common/RequirePermission';
import { PageLoader } from '../../../components/common/SkeletonLoader';
import EmptyState from '../../../components/common/EmptyState';
import EntityHeader from '../../../components/common/EntityHeader';
import StatusBadge from '../../../components/common/StatusBadge';
import InfoCard, { InfoField } from '../../../components/common/InfoCard';
import QuickActionsCard from '../../../components/common/QuickActionsCard';
import ExpenseCategoryFormModal from '../components/ExpenseCategoryFormModal';

export default function ExpenseCategoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // API Queries & Mutations
  const { data: responseData, isLoading, refetch } = useApiQuery(
    () => expenseCategoriesApi.getById(id),
    null,
    { enabled: !!id }
  );

  const category = responseData?.data || responseData;

  const activateMutation = useApiMutation(expenseCategoriesApi.activate);
  const deactivateMutation = useApiMutation(expenseCategoriesApi.deactivate);
  const updateMutation = useApiMutation(expenseCategoriesApi.update);

  if (isLoading) return <PageLoader />;
  if (!category) return <EmptyState onBack={() => navigate(buildPath('/accounts/masters/expense-categories'))} />;

  const isActivating = !category.isActive;

  // Handlers
  const handleToggleStatus = () => {
    confirmDialog(
      `${isActivating ? 'Activate' : 'Deactivate'} Expense Category`,
      `Are you sure you want to ${isActivating ? 'activate' : 'deactivate'} ${category.categoryName}?`,
      async () => {
        try {
          if (isActivating) {
            await activateMutation.mutateAsync(category.id);
          } else {
            await deactivateMutation.mutateAsync(category.id);
          }
          dispatch(addAlert({ type: 'success', message: `Category ${isActivating ? 'activated' : 'deactivated'} successfully` }));
          refetch();
        } catch (error) {
          dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Status update failed' }));
        }
      }
    );
  };

  const handleFormSubmit = async (payload) => {
    try {
      await updateMutation.mutateAsync(payload);
      dispatch(addAlert({ type: 'success', message: 'Category updated successfully' }));
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: 'error', message: error?.response?.data?.message || 'Failed to save category' }));
    }
  };

  // Quick Actions Configuration
  const quickActions = [
    {
      label: 'Edit Category',
      icon: Edit2,
      onClick: () => setIsFormOpen(true),
      permission: { module: 'EXPENSE_CATEGORIES', action: 'UPDATE' } // Assuming this exists or falls back to something else
    },
    {
      label: isActivating ? 'Activate Category' : 'Deactivate Category',
      icon: isActivating ? CheckCircle : AlertCircle,
      onClick: handleToggleStatus,
      danger: !isActivating,
      permission: { module: 'EXPENSE_CATEGORIES', action: 'UPDATE' }
    }
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <EntityHeader
        title={category.categoryName || 'Unknown Category'}
        subtitle={category.categoryCode || 'No Code'}
        icon={Building2}
        badge={<StatusBadge status={category.isActive} />}
        onBack={() => navigate(buildPath('/accounts/masters/expense-categories'))}
        actions={
          <RequirePermission module="EXPENSE_CATEGORIES" action="UPDATE">
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Edit2 size={16} />
              <span>Edit</span>
            </button>
          </RequirePermission>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-7xl mx-auto">
          {/* Left Column - Details */}
          <div className="xl:col-span-4 space-y-6">
            <InfoCard title="Category Information" icon={FileText}>
              <InfoField label="Category Code" value={category.categoryCode} />
              <InfoField label="Category Name" value={category.categoryName} />
              <InfoField label="Description" value={category.description} />
            </InfoCard>

            <QuickActionsCard actions={quickActions} />
          </div>

          {/* Right Column - Main Content */}
          <div className="xl:col-span-8">
            <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="text-zinc-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">No Transactions Yet</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                Expenses recorded against this category will appear here. This feature may not be fully integrated yet.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ExpenseCategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={category}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
