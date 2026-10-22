import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  User, 
  Tag, 
  Truck, 
  ShoppingCart, 
  IndianRupee, 
  RotateCcw,
  LayoutDashboard
} from 'lucide-react';
import CustomSelect from '../../../../components/common/CustomSelect';
import { SkeletonBox as Skeleton } from '../../../../components/common/SkeletonLoader';
import Pagination from '../../../../components/common/Pagination';
import { expenseReportsApi } from '../../../../api/account/expenseReports';
import { employeeDriverService } from '../../services/employeeDriverService';
import { expenseCategoriesApi } from '../../../../api/account/expenseCategories';
import { vehiclesApi } from '../../../../api/fleet/vehicles';


export default function ExpenseReportsTab({ companyId }) {
  // Filters State
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    employeeId: 'ALL',
    categoryId: 'ALL',
    vehicleId: 'ALL',
    paymentType: 'ALL'
  });

  // UI State
  const [activeTab, setActiveTab] = useState('staff-driver'); // 'staff-driver', 'category', 'vehicles', 'sales-order-dc'
  const [pagination, setPagination] = useState({ page: 0, size: 50, totalElements: 0, totalPages: 0 });

  // Data State
  const [summaryData, setSummaryData] = useState(null);
  const [reportData, setReportData] = useState([]);
  
  // Loading States
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  
  // Options State
  const [staffOptions, setStaffOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);

  // Load dropdown options on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadOptions = async () => {
      try {
        // Load Staff
        const staffRes = await employeeDriverService.getCompanyPeople(companyId);
        if (isMounted && staffRes?.all) {
          setStaffOptions(staffRes.all.map(s => ({ value: s.id, label: s.name })));
        }

        // Load Categories
        const catRes = await expenseCategoriesApi.getList({ page: 0, size: 200, isActive: true });
        const catItems = catRes?.data?.content || catRes?.content || (Array.isArray(catRes?.data) ? catRes.data : []);
        if (isMounted) {
          setCategoryOptions(catItems.map(c => ({ value: c.id, label: c.categoryName || c.name || c.categoryCode })));
        }

        // Load Vehicles
        try {
          const vehRes = await vehiclesApi.getList({ page: 0, size: 500, status: 'ACTIVE' });
          const vehItems = vehRes?.data?.content || vehRes?.content || (Array.isArray(vehRes?.data) ? vehRes.data : []);
          if (isMounted) {
            setVehicleOptions(vehItems.map(v => ({ value: v.id, label: v.vehicleNumber || v.registrationNumber })));
          }
        } catch (vErr) {
          // Vehicles endpoint optional; ignore if unavailable
        }

      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };
    
    loadOptions();
    return () => { isMounted = false; };
  }, [companyId]);

  // Fetch Summary Data
  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const res = await expenseReportsApi.getSummary(filters);
      setSummaryData(res?.data?.data || res?.data || {});
    } catch (err) {
      console.error('Failed to load summary', err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [filters]);

  // Fetch Report Data
  const fetchReport = useCallback(async () => {
    setIsLoadingReport(true);
    try {
      const pagedFilters = { ...filters, page: pagination.page, size: pagination.size };
      let res;
      switch (activeTab) {
        case 'staff-driver':
          res = await expenseReportsApi.getStaffDriverAnalysis(pagedFilters);
          break;
        case 'category':
          res = await expenseReportsApi.getCategoryBreakdown(pagedFilters);
          break;
        case 'vehicles':
          res = await expenseReportsApi.getVehicleFleetExpenses(pagedFilters);
          break;
        case 'sales-order-dc':
          res = await expenseReportsApi.getSalesOrderDcExpenses(pagedFilters);
          break;
        default:
          return;
      }
      
      const items = res?.data?.data?.content || res?.data?.content || res?.data?.data || res?.data || [];
      const pageInfo = res?.data?.data?.pagination || res?.data?.pagination || res?.pagination;
      
      setReportData(Array.isArray(items) ? items : []);
      if (pageInfo) {
        setPagination(prev => ({
          ...prev,
          totalElements: pageInfo.totalElements || 0,
          totalPages: pageInfo.totalPages || 0
        }));
      } else {
        // Non-paginated response fallback
        setPagination(prev => ({
          ...prev,
          totalElements: Array.isArray(items) ? items.length : 0,
          totalPages: 1
        }));
      }
    } catch (err) {
      console.error('Failed to load report', err);
      setReportData([]);
    } finally {
      setIsLoadingReport(false);
    }
  }, [filters, activeTab, pagination.page, pagination.size]);

  // Effect to refetch on filter change or tab change
  useEffect(() => {
    fetchSummary();
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab, pagination.page, pagination.size]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset page
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      employeeId: 'ALL',
      categoryId: 'ALL',
      vehicleId: 'ALL',
      paymentType: 'ALL'
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      console.error('No data to export');
      return;
    }
    
    let headers = [];
    let rows = [];
    
    if (activeTab === 'staff-driver') {
      headers = ['Employee/Driver Name', 'Role', 'Vouchers', 'Self Paid (Reimbursable)', 'Company Paid', 'Total Amount'];
      rows = reportData.map(r => [
        r.employeeName || '—',
        r.role || '—',
        r.voucherCount || 0,
        r.selfPaidReimbursable || 0,
        r.companyPaid || 0,
        r.totalAmount || 0
      ]);
    } else if (activeTab === 'category') {
      headers = ['Category', 'Vouchers', 'Self Paid', 'Company Paid', 'Total Amount'];
      rows = reportData.map(r => [
        r.categoryName || '—',
        r.voucherCount || 0,
        r.selfPaidAmount || 0,
        r.companyPaidAmount || 0,
        r.totalAmount || 0
      ]);
    } else if (activeTab === 'vehicles') {
      headers = ['Vehicle', 'Vouchers', 'Fuel', 'Maintenance', 'Total Amount'];
      rows = reportData.map(r => [
        r.vehicleNumber || '—',
        r.voucherCount || 0,
        r.fuelAmount || 0,
        r.maintenanceAmount || 0,
        r.totalAmount || 0
      ]);
    } else if (activeTab === 'sales-order-dc') {
      headers = ['Sales Order', 'Delivery Challan', 'Employee/Driver', 'Vehicle', 'Vouchers', 'Total Amount'];
      rows = reportData.map(r => [
        r.salesOrderNo || '—',
        r.deliveryChallanNo || '—',
        r.employeeName || '—',
        r.vehicleNumber || '—',
        r.voucherCount || 0,
        r.totalAmount || 0
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expense_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paymentTypeOptions = [
    { value: 'ALL', label: 'All Types' },
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'SELF_PAID', label: 'Self Paid (Reimbursable)' }
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1 */}
        <div className="p-4 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <IndianRupee size={48} />
          </div>
          <span className="text-[8.8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Total Recorded Expenses</span>
          {isLoadingSummary ? (
            <div className="mt-1 space-y-1.5">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          ) : (
            <>
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-[#E6E8EE] mt-1 block">
                ₹{(summaryData?.totalRecordedExpenses || 0).toLocaleString()}
              </span>
              <span className="text-[8.8px] text-zinc-500 dark:text-[#6B7184] mt-0.5 block">
                {summaryData?.totalRecordedExpenseCount || 0} vouchers in selected period
              </span>
            </>
          )}
        </div>

        {/* CARD 2 */}
        <div className="p-4 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <LayoutDashboard size={48} />
          </div>
          <span className="text-[8.8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Pending Advance / Requests</span>
          {isLoadingSummary ? (
             <div className="mt-1 space-y-1.5">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          ) : (
            <>
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">
                ₹{(summaryData?.pendingAdvanceRequests || 0).toLocaleString()}
              </span>
              <span className="text-[8.8px] text-zinc-500 dark:text-[#6B7184] mt-0.5 block">Awaiting management authorization</span>
            </>
          )}
        </div>

        {/* CARD 3 */}
        <div className="p-4 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <RotateCcw size={48} />
          </div>
          <span className="text-[8.8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Pending Reimbursement Due</span>
          {isLoadingSummary ? (
             <div className="mt-1 space-y-1.5">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          ) : (
            <>
              <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">
                ₹{(summaryData?.pendingReimbursementDue || 0).toLocaleString()}
              </span>
              <span className="text-[8.8px] text-zinc-500 dark:text-[#6B7184] mt-0.5 block">Driver & staff payable balance</span>
            </>
          )}
        </div>

        {/* CARD 4 */}
        <div className="p-4 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingCart size={48} />
          </div>
          <span className="text-[8.8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider block">Total Reimbursements Settled</span>
          {isLoadingSummary ? (
             <div className="mt-1 space-y-1.5">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          ) : (
            <>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                ₹{(summaryData?.totalReimbursementsSettled || 0).toLocaleString()}
              </span>
              <span className="text-[8.8px] text-zinc-500 dark:text-[#6B7184] mt-0.5 block">Disbursed via bank / cash accounts</span>
            </>
          )}
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="p-4 bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 size={14} className="text-zinc-500 dark:text-[#A0A6B5]" />
            Report Filters & Range
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-600 dark:text-[#A0A6B5] bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] hover:bg-zinc-50 dark:hover:bg-[#222736] rounded-lg transition-colors"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] bg-zinc-100 dark:bg-[#222736] hover:bg-zinc-200 dark:hover:bg-[#2A2F3D] rounded-lg transition-colors"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div>
            <label className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider mb-1 block">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full h-8 px-2 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-xs text-zinc-800 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#1D212C] outline-none"
            />
          </div>

          <div>
            <label className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider mb-1 block">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full h-8 px-2 bg-zinc-50 dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] rounded-md text-xs text-zinc-800 dark:text-[#E6E8EE] focus:bg-white dark:focus:bg-[#1D212C] outline-none"
            />
          </div>

          <div>
            <label className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider mb-1 block">Staff / Driver</label>
            <CustomSelect
              options={[{ value: 'ALL', label: 'All Staff' }, ...staffOptions]}
              value={filters.employeeId}
              onChange={(e) => handleFilterChange('employeeId', e.target.value)}
              placeholder="Select Staff"
              className="h-8"
            />
          </div>

          <div>
            <label className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider mb-1 block">Category</label>
            <CustomSelect
              options={[{ value: 'ALL', label: 'All Categories' }, ...categoryOptions]}
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              placeholder="Select Category"
              className="h-8"
            />
          </div>

          <div>
            <label className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider mb-1 block">Vehicle</label>
            <CustomSelect
              options={[{ value: 'ALL', label: 'All Vehicles' }, ...vehicleOptions]}
              value={filters.vehicleId}
              onChange={(e) => handleFilterChange('vehicleId', e.target.value)}
              placeholder="Select Vehicle"
              className="h-8"
            />
          </div>
          
          <div>
            <label className="text-[8px] font-bold text-zinc-400 dark:text-[#6B7184] uppercase tracking-wider mb-1 block">Payment Type</label>
            <CustomSelect
              options={paymentTypeOptions}
              value={filters.paymentType}
              onChange={(e) => handleFilterChange('paymentType', e.target.value)}
              placeholder="Select Type"
              className="h-8"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center overflow-x-auto border-b border-zinc-200 dark:border-[#2A2F3D] hide-scrollbar">
          <button
            onClick={() => { setActiveTab('staff-driver'); setPagination(p => ({...p, page: 0})); }}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-colors relative ${
              activeTab === 'staff-driver' ? 'text-indigo-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-blue-950/20' : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#1D212C] hover:text-zinc-900 dark:hover:text-[#E6E8EE]'
            }`}
          >
            <User size={14} />
            Staff & Driver Analysis
            {activeTab === 'staff-driver' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-blue-500" />}
          </button>
          <button
            onClick={() => { setActiveTab('category'); setPagination(p => ({...p, page: 0})); }}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-colors relative ${
              activeTab === 'category' ? 'text-indigo-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-blue-950/20' : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#1D212C] hover:text-zinc-900 dark:hover:text-[#E6E8EE]'
            }`}
          >
            <Tag size={14} />
            Category-wise Breakdown
            {activeTab === 'category' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-blue-500" />}
          </button>
          <button
            onClick={() => { setActiveTab('vehicles'); setPagination(p => ({...p, page: 0})); }}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-colors relative ${
              activeTab === 'vehicles' ? 'text-indigo-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-blue-950/20' : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#1D212C] hover:text-zinc-900 dark:hover:text-[#E6E8EE]'
            }`}
          >
            <Truck size={14} />
            Vehicle & Fleet Expenses
            {activeTab === 'vehicles' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-blue-500" />}
          </button>
          <button
            onClick={() => { setActiveTab('sales-order-dc'); setPagination(p => ({...p, page: 0})); }}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-colors relative ${
              activeTab === 'sales-order-dc' ? 'text-indigo-600 dark:text-blue-400 bg-indigo-50/50 dark:bg-blue-950/20' : 'text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-50 dark:hover:bg-[#1D212C] hover:text-zinc-900 dark:hover:text-[#E6E8EE]'
            }`}
          >
            <ShoppingCart size={14} />
            Sales Order / DC Linked Expenses
            {activeTab === 'sales-order-dc' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-blue-500" />}
          </button>
        </div>

        {/* Tab Content (Table Container) */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-zinc-50/50 dark:bg-[#1D212C] border-b border-zinc-200 dark:border-[#2A2F3D]">
              <tr>
                {activeTab === 'staff-driver' && (
                  <>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Staff / Driver Name</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Role</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Vouchers</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Self Paid (Reimbursable)</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Company Paid</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Total Amount (₹)</th>
                  </>
                )}
                {activeTab === 'category' && (
                  <>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Category</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Vouchers</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Self Paid</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Company Paid</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Total Amount (₹)</th>
                  </>
                )}
                {activeTab === 'vehicles' && (
                  <>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Vehicle</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Vouchers</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Fuel</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Maintenance</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Total Amount (₹)</th>
                  </>
                )}
                {activeTab === 'sales-order-dc' && (
                  <>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Sales Order</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Delivery Challan</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Employee / Driver</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider">Vehicle</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Vouchers</th>
                    <th className="px-4 py-2.5 text-[9.6px] font-bold text-zinc-500 dark:text-[#6B7184] uppercase tracking-wider text-right">Total Amount (₹)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#2A2F3D]">
              {isLoadingReport ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: activeTab === 'sales-order-dc' ? 6 : activeTab === 'staff-driver' ? 6 : 5 }).map((_, j) => (
                      <td key={j} className="p-3.5"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-[#6B7184]">
                      <BarChart3 size={40} className="mb-3 opacity-20" />
                      <span className="text-sm font-bold text-zinc-600 dark:text-[#A0A6B5]">No report data found</span>
                      <span className="text-xs mt-1 text-zinc-400 dark:text-[#6B7184]">Try changing your filters or date range.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {activeTab === 'staff-driver' && reportData.map((row, idx) => (
                    <tr key={row.employeeId || idx} className="hover:bg-zinc-50/60 dark:hover:bg-[#1D212C]/60 transition-colors group">
                      <td className="p-3.5 pl-4 text-[10.4px] font-bold text-zinc-900 dark:text-[#E6E8EE]">{row.employeeName || '—'}</td>
                      <td className="p-3.5 text-[10.4px] text-zinc-600 dark:text-[#A0A6B5]">{row.role || '—'}</td>
                      <td className="p-3.5 text-[10.4px] text-right font-medium text-zinc-900 dark:text-[#E6E8EE]">{row.voucherCount || 0}</td>
                      <td className="p-3.5 text-[10.4px] text-right text-rose-600 dark:text-rose-400 font-medium">₹{(row.selfPaidReimbursable || 0).toLocaleString()}</td>
                      <td className="p-3.5 text-[10.4px] text-right text-emerald-600 dark:text-emerald-400 font-medium">₹{(row.companyPaid || 0).toLocaleString()}</td>
                      <td className="p-3.5 pr-4 text-[10.4px] text-right font-extrabold text-zinc-900 dark:text-[#E6E8EE]">₹{(row.totalAmount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  
                  {activeTab === 'category' && reportData.map((row, idx) => (
                    <tr key={row.categoryId || idx} className="hover:bg-zinc-50/60 dark:hover:bg-[#1D212C]/60 transition-colors group">
                      <td className="p-3.5 pl-4 text-[10.4px] font-bold text-zinc-900 dark:text-[#E6E8EE]">{row.categoryName || '—'}</td>
                      <td className="p-3.5 text-[10.4px] text-right font-medium text-zinc-900 dark:text-[#E6E8EE]">{row.voucherCount || 0}</td>
                      <td className="p-3.5 text-[10.4px] text-right text-rose-600 dark:text-rose-400 font-medium">₹{(row.selfPaidAmount || 0).toLocaleString()}</td>
                      <td className="p-3.5 text-[10.4px] text-right text-emerald-600 dark:text-emerald-400 font-medium">₹{(row.companyPaidAmount || 0).toLocaleString()}</td>
                      <td className="p-3.5 pr-4 text-[10.4px] text-right font-extrabold text-zinc-900 dark:text-[#E6E8EE]">₹{(row.totalAmount || 0).toLocaleString()}</td>
                    </tr>
                  ))}

                  {activeTab === 'vehicles' && reportData.map((row, idx) => (
                    <tr key={row.vehicleId || idx} className="hover:bg-zinc-50/60 dark:hover:bg-[#1D212C]/60 transition-colors group">
                      <td className="p-3.5 pl-4 text-[10.4px] font-mono font-bold text-zinc-900 dark:text-[#E6E8EE]">{row.vehicleNumber || '—'}</td>
                      <td className="p-3.5 text-[10.4px] text-right font-medium text-zinc-900 dark:text-[#E6E8EE]">{row.voucherCount || 0}</td>
                      <td className="p-3.5 text-[10.4px] text-right text-amber-600 dark:text-amber-400 font-medium">₹{(row.fuelAmount || 0).toLocaleString()}</td>
                      <td className="p-3.5 text-[10.4px] text-right text-blue-600 dark:text-blue-400 font-medium">₹{(row.maintenanceAmount || 0).toLocaleString()}</td>
                      <td className="p-3.5 pr-4 text-[10.4px] text-right font-extrabold text-zinc-900 dark:text-[#E6E8EE]">₹{(row.totalAmount || 0).toLocaleString()}</td>
                    </tr>
                  ))}

                  {activeTab === 'sales-order-dc' && reportData.map((row, idx) => (
                    <tr key={row.salesOrderId || row.deliveryChallanId || idx} className="hover:bg-zinc-50/60 dark:hover:bg-[#1D212C]/60 transition-colors group">
                      <td className="p-3.5 pl-4 text-[10.4px] font-bold text-indigo-600 dark:text-indigo-400">{row.salesOrderNo || '—'}</td>
                      <td className="p-3.5 text-[10.4px] font-bold text-blue-600 dark:text-blue-400">{row.deliveryChallanNo || '—'}</td>
                      <td className="p-3.5 text-[10.4px] font-medium text-zinc-700 dark:text-[#A0A6B5]">{row.employeeName || '—'}</td>
                      <td className="p-3.5 text-[10.4px] font-mono text-zinc-600 dark:text-[#A0A6B5]">{row.vehicleNumber || '—'}</td>
                      <td className="p-3.5 text-[10.4px] text-right font-medium text-zinc-900 dark:text-[#E6E8EE]">{row.voucherCount || 0}</td>
                      <td className="p-3.5 pr-4 text-[10.4px] text-right font-extrabold text-zinc-900 dark:text-[#E6E8EE]">₹{(row.totalAmount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-zinc-200 dark:border-[#2A2F3D] bg-zinc-50 dark:bg-[#1D212C] rounded-b-xl">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              pageSize={pagination.size}
              onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
              onPageSizeChange={(s) => setPagination({ page: 0, size: s, totalElements: pagination.totalElements, totalPages: pagination.totalPages })}
              itemName="rows"
            />
          </div>
        )}
      </div>
    </div>
  );
}
