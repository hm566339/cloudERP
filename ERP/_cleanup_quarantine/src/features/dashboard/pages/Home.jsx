import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Building2, RefreshCw, Download, Filter } from 'lucide-react'
import Header from '../../../components/layout/Header'
import ApiFilterBar from '../../../components/common/ApiFilterBar'
import CompanyTable from '../../../features/company-management/components/CompanyTable'
import Pagination from '../../../components/common/Pagination'
import EmptyState from '../../../components/common/EmptyState'
import ErrorState from '../../../components/common/ErrorState'
import useDebounce from '../../../hooks/useDebounce'
import { useGetCompaniesQuery, useGetOpenCompaniesQuery } from '../../../api/sso';
import { useAppSelector } from '../../../app/store';
import useApiFilters from '../../../hooks/useApiFilters'
import { FILTER_CONFIGS } from '../../../constants/filterConfigs'
export default function Home() {
  const currentUser = useAppSelector((s) => s.auth?.user ?? null);
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role?.toLowerCase().includes('super');

  const { filterBarProps, apiParams, paginationProps, page, pageSize } = useApiFilters(FILTER_CONFIGS.companies, { defaultPageSize: 10 });

  const { data: adminData, isLoading: loadingAdmin, error: fetchErrorAdmin, refetch: refetchAdmin } = useGetCompaniesQuery(apiParams, { skip: !isSuperAdmin });
  const { data: openData, isLoading: loadingOpen, error: fetchErrorOpen, refetch: refetchOpen } = useGetOpenCompaniesQuery(apiParams, { skip: isSuperAdmin });

  const data = isSuperAdmin ? adminData : openData;
  const loading = isSuperAdmin ? loadingAdmin : loadingOpen;
  const fetchError = isSuperAdmin ? fetchErrorAdmin : fetchErrorOpen;
  const refetch = isSuperAdmin ? refetchAdmin : refetchOpen;

  const companies = data?.companies || [];
  const pagination = data || null;
  const error = fetchError?.data?.message || (fetchError ? 'Failed to load companies.' : null);

  const handlePageChange = useCallback((newPage) => {
    paginationProps.onPageChange(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [paginationProps]);

 const breadcrumbs = useMemo(
 () => [{ label: 'Home', href: '/' }, { label: 'Companies' }],
 []
 )

 const isEmpty = !loading && !error && companies.length === 0

 return (
 <div className="min-h-screen bg-zinc-50">
 <Header breadcrumbs={breadcrumbs} />

 <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Page header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
 <div>
 <div className="flex items-center gap-2.5 mb-1">
 <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
 <Building2 size={16} className="text-white" />
 </div>
 <h1 className="text-2xl font-bold text-zinc-900">
 User Management
 </h1>
 </div>
 <p className="text-sm text-zinc-500 ml-10.5">
 Manage and navigate your company entities
 </p>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={refetch}
 disabled={loading}
 className="btn-secondary"
 >
 <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
 Refresh
 </button>
 </div>
 </div>

 <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up">
 <ApiFilterBar {...filterBarProps} />
 <div className="flex items-center gap-2">
 {pagination && !loading && (
 <span className="hidden sm:inline-flex items-center px-3 py-2 text-xs font-medium text-zinc-500 bg-white border border-zinc-200 rounded-xl">
 {pagination.totalElements} total
 </span>
 )}
 </div>
 </div>

 {/* Table card */}
 <div className="card overflow-hidden animate-slide-up">
 {error ? (
 <ErrorState
 message={error}
 onRetry={refetch}
 />
 ) : isEmpty ? (
 <EmptyState
 title={filterBarProps.searchTerm ? 'No matching companies' : 'No companies yet'}
 description={
 filterBarProps.searchTerm
 ? `No results for "${filterBarProps.searchTerm}". Try a different search term.`
 : 'Companies you create will appear here.'
 }
 />
 ) : (
 <>
 <CompanyTable companies={companies} loading={loading} />
 {pagination && (
 <Pagination
 page={page}
 totalPages={pagination.totalPages}
 totalElements={pagination.totalElements}
 pageSize={PAGE_SIZE}
 onPageChange={handlePageChange}
 />
 )}
 </>
 )}
 </div>
 </div>
 </div>
 )
}
