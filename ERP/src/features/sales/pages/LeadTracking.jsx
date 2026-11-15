import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import { Plus, Search, Phone, Mail, UserPlus, CheckCircle, XCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useGetLeadsQuery, useCreateLeadMutation, useUpdateLeadStatusMutation } from '../../../api/sales-crm'
import DataDetailsModal from '../../../components/common/DataDetailsModal'
import ApiFilterBar from '../../../components/common/ApiFilterBar'
import SortableHeader from '../../../components/common/SortableHeader'
import Pagination from '../../../components/common/Pagination'
import useApiFilters from '../../../hooks/useApiFilters'
import FILTER_CONFIGS from '../../../constants/filterConfigs'
import { getSerialNumber } from '../../../utils/serialNumberHelper'
import { useAppDispatch } from '../../../app/hooks'
import { addAlert } from '../../notifications/notificationSlice'
import LeadFormModal from '../components/LeadFormModal'

export default function LeadsPage() {

  const companyId = useParams().companyId || JSON.parse(localStorage.getItem("selected_company"))?.id || JSON.parse(localStorage.getItem("auth_user"))?.companyCode;

  const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort, apiParams } = useApiFilters(FILTER_CONFIGS.leads, { defaultPageSize: 10, defaultSortBy: 'createdAt-desc' });

  const search = filterBarProps.searchTerm || '';
  const stageFilter = filters.stage || '';


  const dispatch = useAppDispatch()

  const { data: apiResponse, isLoading, refetch } = useGetLeadsQuery({ companyId, ...apiParams })
  const [createLead] = useCreateLeadMutation()
  const [updateLeadStatus] = useUpdateLeadStatusMutation()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewingLead, setViewingLead] = useState(null)

  const handleCreateLead = async (data) => {
    await createLead(data)
    setIsFormOpen(false)
    dispatch(addAlert({ type: 'success', message: 'Lead added successfully' }))
  }

  const handleUpdateStatus = async (id, stage) => {
    await updateLeadStatus({ id, stage })
    dispatch(addAlert({ type: 'success', message: `Lead moved to ${stage}` }))
  }

  const leads = Array.isArray(apiResponse) ? apiResponse : (apiResponse?.data || apiResponse?.content || []);
  const serverPagination = apiResponse?.pagination || {};
  const totalElements = serverPagination.totalElements || serverPagination.totalCount || leads.length;
  const totalPages = serverPagination.totalPages || Math.max(1, Math.ceil(leads.length / pageSize));

  // Fallback: if server didn't paginate, we slice it. If it did, we use as-is.
  const isServerPaginated = !!serverPagination.totalPages;
  const paginatedLeads = isServerPaginated ? leads : leads.slice(page * pageSize, (page + 1) * pageSize);

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'New': return 'badge-info'
      case 'Qualified': return 'badge-warning'
      case 'Proposal': return 'badge-primary bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400'
      case 'Won': return 'badge-success'
      case 'Lost': return 'badge-danger'
      default: return 'badge-draft'
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads Pipeline</h1>
          <p className="page-subtitle">Track and convert prospects into customers</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsFormOpen(true)} className="btn-primary"><Plus size={15} /> New Lead</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card p-4">
          <p className="kpi-label mb-1">Total Leads</p>
          <p className="kpi-value text-2xl">45</p>
        </div>
        <div className="kpi-card p-4">
          <p className="kpi-label mb-1">Qualified</p>
          <p className="kpi-value text-2xl text-amber-600 dark:text-amber-400">12</p>
        </div>
        <div className="kpi-card p-4">
          <p className="kpi-label mb-1">Proposals Sent</p>
          <p className="kpi-value text-2xl text-primary dark:text-blue-400">8</p>
        </div>
        <div className="kpi-card p-4">
          <p className="kpi-label mb-1">Conversion Rate</p>
          <p className="kpi-value text-2xl text-emerald-600 dark:text-emerald-400">24%</p>
        </div>
      </div>

      <ApiFilterBar
        {...filterBarProps}
        onRefresh={refetch}
        isLoading={isLoading}
      />

      {isLoading ? (
        <div className="p-6 w-full"><TableSkeleton columns={5} rows={3} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="w-12 text-center">S.No.</th>
                <SortableHeader field="organizationName" label="Company / Contact" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                <th>Source</th>
                <SortableHeader field="createdAt" label="Date Added" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                <SortableHeader field="annualRevenue" label="Est. Value (₹)" align="right" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                <th>Stage</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="staggered-list">
              {paginatedLeads.map((l, index) => (
                <tr key={l.id}>
                  <td className="text-center font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {getSerialNumber({ page, pageSize, rowIndex: index, pageBase: 0 })}
                  </td>
                  <td>
                    <div className="font-medium text-zinc-900 dark:text-zinc-200">{l.organizationName || l.company || '—'}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                      <UserPlus size={12} /> {l.displayName || l.contact || '—'}
                    </div>
                  </td>
                  <td className="text-zinc-600 dark:text-zinc-300">{l.leadSourceName || l.source || 'Direct'}</td>
                  <td className="text-zinc-500 dark:text-zinc-400">{l.createdAt ? (typeof l.createdAt === 'string' ? l.createdAt.slice(0, 10) : l.createdAt) : (l.date || '—')}</td>
                  <td className="text-right font-semibold text-zinc-800 dark:text-zinc-200">
                    ₹{(l.annualRevenue ?? l.value ?? 0).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${getStageBadge(l.leadStage || l.stage)}`}>
                      {l.leadStage || l.stage || 'NEW'}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2 text-zinc-400 dark:text-zinc-500">
                      {l.stage !== 'Won' && l.stage !== 'Lost' && <button onClick={() => handleUpdateStatus(l.id, 'Won')} className="hover:text-emerald-600 p-1" title="Mark Won"><CheckCircle size={15} /></button>}
                      {l.stage !== 'Won' && l.stage !== 'Lost' && <button onClick={() => handleUpdateStatus(l.id, 'Lost')} className="hover:text-red-500 p-1" title="Mark Lost"><XCircle size={15} /></button>}
                      <button className="hover:text-primary transition-colors p-1" title="Email"><Mail size={15} /></button>
                      <button className="hover:text-primary transition-colors p-1" title="Call"><Phone size={15} /></button>
                      <button onClick={() => setViewingLead(l)} className="text-xs text-primary dark:text-blue-400 hover:underline font-medium ml-2">View</button>
                      <button className="text-xs text-primary dark:text-blue-400 hover:underline font-medium ml-2">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {!isLoading && (
        <div className="p-4 border-t border-zinc-100 dark:border-border-dark bg-white dark:bg-card-dark rounded-b-xl">
          <Pagination
            {...paginationProps}
            totalPages={totalPages}
            totalElements={totalElements}
            itemName="leads"
          />
        </div>
      )}

      <LeadFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateLead}
      />
      <DataDetailsModal
        isOpen={!!viewingLead}
        onClose={() => setViewingLead(null)}
        data={viewingLead}
        title="Lead Details"
      />
    </div>
  )
}

