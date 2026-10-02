import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from "react";
import { Plus, Search, Download, UserCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
} from '../../../api/hr';
import EmployeeFormModal from "../components/EmployeeFormModal";
import DataDetailsModal from "../../../components/common/DataDetailsModal";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import ApiFilterBar from "../../../components/common/ApiFilterBar";
import ExportModal from "../../../components/common/ExportModal";
import SortableHeader from "../../../components/common/SortableHeader";
import Pagination from "../../../components/common/Pagination";
import useApiFilters from "../../../hooks/useApiFilters";
import FILTER_CONFIGS from "../../../constants/filterConfigs";

export default function EmployeeList() {
  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;
  const dispatch = useAppDispatch();
  
  const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort } = useApiFilters(FILTER_CONFIGS.employees, { defaultPageSize: 10, defaultSortBy: 'name-asc' });

  const search = filterBarProps.searchTerm || '';
  const statusFilter = filters.status || '';
  
  

  const { data: employeesData = {}, isLoading, refetch } = useGetEmployeesQuery({ 
    companyId, 
    page: page + 1, 
    pageSize, 
    search 
  });
  
  const employees = employeesData?.employees || [];
  const filtered = employees.filter(emp => statusFilter ? emp.status === statusFilter : true);
  
  const sorted = [...filtered].sort((a, b) => {
    const valA = sortBy === 'name' ? a.name : (sortBy === 'joinDate' ? a.joinDate : a.name);
    const valB = sortBy === 'name' ? b.name : (sortBy === 'joinDate' ? b.joinDate : b.name);
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  const [createEmployee] = useCreateEmployeeMutation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleCreateEmployee = async (data) => {
    await createEmployee(data);
    setIsFormOpen(false);
    dispatch(
      addAlert({ type: "success", message: "Employee added successfully" }),
    );
  };

  const finalFilterBarProps = {
    ...filterBarProps,
    filters: filterBarProps.filters.map(f => {
      if (f.key === 'department') {
        const uniqueDepartments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
        return { ...f, options: uniqueDepartments.map(d => ({ label: d, value: d })) };
      }
      if (f.key === 'designation') {
        const uniqueDesignations = Array.from(new Set(employees.map(e => e.designation).filter(Boolean)));
        return { ...f, options: uniqueDesignations.map(d => ({ label: d, value: d })) };
      }
      return f;
    })
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage company workforce</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsExportModalOpen(true)} className="btn-secondary">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setIsFormOpen(true)} className="btn-primary">
            <Plus size={15} /> Add Employee
          </button>
        </div>
      </div>

      <ApiFilterBar 
        {...finalFilterBarProps}
        onRefresh={refetch}
        isLoading={isLoading}
      />

      <div className="erp-table-container">
        {isLoading ? (
          <div className="p-6 w-full"><TableSkeleton columns={5} rows={3} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                <th className="w-12 text-center">S.No.</th>
                  <SortableHeader field="name" label="Employee" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Role</th>
                  <SortableHeader field="joinDate" label="Join Date" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="staggered-list">
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="p-8 text-center border-2 border-dashed border-zinc-200 m-4 rounded-xl">
                        <UserCircle className="mx-auto text-zinc-300 mb-3" size={28} />
                        <p className="text-sm font-medium text-zinc-600">No employees found</p>
                        <p className="text-xs text-zinc-400 mt-1">Adjust your filters or add a new employee.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {sorted.map((emp, index) => (
                  <tr key={emp.id}>
                    <td className="text-center font-medium text-zinc-500">{(page * (pageSize || 10)) + index + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {emp.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-zinc-900">
                          {emp.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-zinc-500">
                        {emp.id}
                      </span>
                    </td>
                    <td className="text-zinc-700">{emp.department}</td>
                    <td className="text-zinc-500">{emp.role}</td>
                    <td className="text-zinc-500">{emp.joinDate}</td>
                    <td>
                      <span
                        className={`badge ${
                          emp.status === "Active"
                            ? "badge-success"
                            : emp.status === "On Leave"
                              ? "badge-warning"
                              : "badge-danger"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setViewingEmployee(emp)}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && (
          <div className="p-4 border-t border-zinc-100 bg-white rounded-b-xl">
             <Pagination
               {...paginationProps}
               totalPages={employeesData?.totalPages || 1}
               totalElements={employeesData?.totalCount || sorted.length}
               itemName="employees"
             />
          </div>
        )}
      </div>
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateEmployee}
      />
      <DataDetailsModal
        isOpen={!!viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        data={viewingEmployee}
        title="Employee Details"
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportName="employee-list"
      />
    </div>
  );
}

