import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Plus, Filter } from 'lucide-react';
import { addAlert } from '../../notifications/notificationSlice';
import { 
  getCompanyModules, 
  deleteCompanyModule, 
  updateCompanyModuleStatus 
} from '../../../api/sso/companyModules';
import CompanyModuleTable from '../components/CompanyModuleTable';
import CompanyModuleFormModal from '../components/CompanyModuleFormModal';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/common/ConfirmModal';
import SkeletonLoader from '../../../components/common/SkeletonLoader';
import CustomSelect from '../../../components/common/CustomSelect';

export default function CompanyModuleManagement() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [activeFilter, setActiveFilter] = useState(''); // '' | 'true' | 'false'
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchModules = async (page = pagination.currentPage, limit = pagination.pageSize, active = activeFilter) => {
    setLoading(true);
    try {
      const params = { page, pageSize: limit };
      if (active !== '') {
        params.active = active === 'true';
      }
      const response = await getCompanyModules(params);
      setData(response?.companyModuleResponse || []);
      if (response?.pagination) {
        setPagination({
          currentPage: response.pagination.currentPage || 1,
          pageSize: response.pagination.pageSize || 10,
          totalPages: response.pagination.totalPages || 1,
          totalCount: response.pagination.totalCount || 0
        });
      }
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: 'Failed to load company modules' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const handlePageChange = (newPage) => {
    fetchModules(newPage);
  };

  const handleCreate = () => {
    setEditItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (item) => {
    setDeleteItem(item);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteCompanyModule(deleteItem.id);
      dispatch(addAlert({ type: 'success', message: 'Assignment deleted successfully' }));
      setDeleteItem(null);
      fetchModules();
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to delete assignment' }));
    }
  };

  const handleToggleStatus = async (item, newStatus) => {
    try {
      await updateCompanyModuleStatus(item.id, newStatus);
      dispatch(addAlert({ type: 'success', message: 'Status updated successfully' }));
      fetchModules(); // refresh data
    } catch (err) {
      dispatch(addAlert({ type: 'error', message: 'Failed to update status' }));
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    dispatch(addAlert({ type: 'success', message: editItem ? 'Assignment updated' : 'Module assigned successfully' }));
    fetchModules();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-[#E6E8EE] tracking-tight">Company Modules</h1>
          <p className="text-sm text-zinc-500 dark:text-[#A0A6B5] mt-1">Manage which modules are assigned to which companies.</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Assign Module
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-[#161922] p-4 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-[#A0A6B5]">
          <Filter size={16} />
          Status:
        </div>
        <CustomSelect
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="border border-zinc-200 dark:border-[#2A2F3D] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </CustomSelect>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] p-6">
          <SkeletonLoader count={5} height={40} />
        </div>
      ) : (
        <>
          <CompanyModuleTable 
            data={data}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
          
          {data.length > 0 && (
            <div className="mt-4">
              <Pagination 
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalRecords={pagination.totalCount}
                pageSize={pagination.pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <CompanyModuleFormModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
          editData={editItem}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        title="Delete Company Module Assignment?"
        message={`This will permanently remove the assignment of ${deleteItem?.module?.name} for ${deleteItem?.company?.companyName}. This action cannot be undone.`}
        confirmText="Delete Assignment"
        type="danger"
      />
    </div>
  );
}
