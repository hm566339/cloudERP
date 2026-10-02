import { TableRowSkeleton, TableSkeleton, ListSkeleton } from '../../../components/common/SkeletonLoader';
import React, { useState } from 'react'
import { Plus, Search, GitCommit, ArrowRight, ArrowRightLeft } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetTransfersQuery, useCreateTransferMutation } from '../../../api/inventory'
import TransferFormModal from '../components/TransferFormModal'
import DataDetailsModal from '../../../components/common/DataDetailsModal'
import ApiFilterBar from '../../../components/common/ApiFilterBar'
import SortableHeader from '../../../components/common/SortableHeader'
import Pagination from '../../../components/common/Pagination'
import useApiFilters from '../../../hooks/useApiFilters'
import FILTER_CONFIGS from '../../../constants/filterConfigs'
import { useAppDispatch } from '../../../app/hooks'
import { addAlert } from '../../notifications/notificationSlice'

export default function TransfersPage() {
    const navigate = useNavigate();
  const [expandedRowId, setExpandedRowId] = React.useState(null);
import ExpandedRowDetails from '../components/ExpandedRowDetails';
    const { filterBarProps, paginationProps, sortBy, setSortBy, sortOrder, setSortOrder, filters, page, pageSize, handleColumnSort } = useApiFilters(FILTER_CONFIGS.stockTransfers, { defaultPageSize: 10, defaultSortBy: 'date-desc' });

    const search = filterBarProps.searchTerm || '';
    const statusFilter = filters.status || '';
    
    
    const dispatch = useAppDispatch()

    const { data: transfers = [], isLoading, refetch } = useGetTransfersQuery(companyId)
    const [createTransfer] = useCreateTransferMutation()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [viewingTransfer, setViewingTransfer] = useState(null)

    const handleCreateTransfer = async (data) => {
        await createTransfer({ companyId, ...data })
        setIsFormOpen(false)
        dispatch(addAlert({ type: 'success', message: 'Transfer initiated successfully' }))
    }

    const filtered = transfers.filter(t => {
        const matchesSearch = t.item?.toLowerCase().includes(search.toLowerCase()) || 
                              t.id?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter ? t.status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
        const valA = sortBy === 'date' ? a.date : (sortBy === 'quantity' ? a.quantity : a.item);
        const valB = sortBy === 'date' ? b.date : (sortBy === 'quantity' ? b.quantity : b.item);
        
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

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const paginatedTransfers = sorted.slice(page * pageSize, (page + 1) * pageSize);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Stock Transfers</h1>
                    <p className="page-subtitle">Track inventory movement between warehouses</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsFormOpen(true)} className="btn-primary"><Plus size={15} /> New Transfer</button>
                </div>
            </div>

            <ApiFilterBar 
                {...filterBarProps}
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
                    <th className="w-16">S.No.</th>
                <th className="w-12 text-center">S.No.</th>
                                    <th>Transfer ID</th>
                                    <th>Source & Destination</th>
                                    <SortableHeader field="item" label="Item" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                                    <SortableHeader field="quantity" label="Qty" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                                    <SortableHeader field="date" label="Date" sortBy={sortBy} sortOrder={sortOrder} onSort={handleColumnSort} />
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody className="staggered-list">
                                {paginatedTransfers.length === 0 && (
                                    <tr>
                                        <td colSpan={9}>
                                            <div className="p-8 text-center border-2 border-dashed border-zinc-200 m-4 rounded-xl">
                                                <ArrowRightLeft className="mx-auto text-zinc-300 mb-3" size={28} />
                                                <p className="text-sm font-medium text-zinc-600">No stock transfers found</p>
                                                <p className="text-xs text-zinc-400 mt-1">Initiate a transfer to get started.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {paginatedTransfers.map((t, index) => [
                    <tr key={t.id} onClick={() => setExpandedRowId(expandedRowId === t.id ? null : t.id)}>
                      <td className="text-zinc-500 font-medium">{typeof page !== 'undefined' && typeof size !== 'undefined' ? (page * size) + index + 1 : index + 1}</td>
                    <td className="text-center font-medium text-zinc-500">{(page * (pageSize || 10)) + index + 1}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <GitCommit size={14} className="text-zinc-400" />
                                                <span className="font-mono text-xs font-semibold text-primary">{t.id}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1 text-xs font-medium">
                                                <span className="text-zinc-500 line-clamp-1 border border-zinc-200 px-1.5 py-0.5 rounded inline-block bg-zinc-50 w-fit">{t.from}</span>
                                                <ArrowRight size={10} className="text-zinc-300 ml-2" />
                                                <span className="text-zinc-700 line-clamp-1 border border-primary px-1.5 py-0.5 rounded inline-block bg-primary/10 w-fit">{t.to}</span>
                                            </div>
                                        </td>
                                        <td className="font-medium text-zinc-800">{t.item}</td>
                                        <td className="text-zinc-600">{t.quantity}</td>
                                        <td className="text-zinc-500">{t.date}</td>
                                        <td>
                                            <span className={`badge ${t.status === 'Completed' ? 'badge-success' :
                                                t.status === 'In Transit' ? 'badge-info' : 'badge-draft'
                                                }`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button onClick={() => navigate(`../transfer/${t.id}`)} className="text-xs text-primary hover:underline font-medium">View</button>
                                        </td>
                                    </tr>,
                    expandedRowId === t.id && <ExpandedRowDetails key={`exp-${t.id}`} data={t} colSpan={100} />
                  ])}
                </tbody>
                        </table>
                    </div>
                )}
                {!isLoading && (
                    <div className="p-4 border-t border-zinc-100 bg-white rounded-b-xl">
                        <Pagination
                            {...paginationProps}
                            totalPages={totalPages}
                            totalElements={filtered.length}
                            itemName="transfers"
                        />
                    </div>
                )}
            </div>
            <TransferFormModal 
              isOpen={isFormOpen} 
              onClose={() => setIsFormOpen(false)} 
              onSubmit={handleCreateTransfer} 
            />
            <DataDetailsModal 
              isOpen={!!viewingTransfer} 
              onClose={() => setViewingTransfer(null)} 
              data={viewingTransfer} 
              title="Transfer Details" 
            />
        </div>
    )
}

