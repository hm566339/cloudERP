import React, { useState, useMemo, useCallback } from "react";
import {
  Building2,
  PlusCircle,
  Trash2,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Users,
  Eye,
  AlertCircle,
  Edit,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText
} from "lucide-react";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import { setSelectedCompany } from "../../company-management/companySlice";
import { useNavigate, useLocation } from "react-router-dom";
import { useRBAC } from '../../../utils/rbac';
import { 
  useGetCompaniesQuery, 
  useCreateCompanyMutation, 
  useUpdateCompanyStatusMutation, 
  useDeleteCompanyMutation,
  useUpdateCompanyMutation,
  useGetModulesQuery,
  useGetCompanyModulesQuery,
  useCreateCompanyModuleMutation,
  useDeleteCompanyModuleMutation
} from '../../../api/sso';

import useApiFilters from '../../../hooks/useApiFilters';
import FILTER_CONFIGS from '../../../constants/filterConfigs';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../components/data-table';
import CompanyCreateEditModal from '../components/CompanyCreateEditModal';
import CompanyAssignModulesModal from '../components/CompanyAssignModulesModal';
import ConfirmModal from '../../../components/common/ConfirmModal';

export default function CompanyList() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin, isOwner, canDelete } = useRBAC();
  const isOwnerPortal = location.pathname.startsWith('/owner') || (isOwner && !isSuperAdmin);

  const [visibleColumns, setVisibleColumns] = useState(['code', 'name', 'contact', 'domain', 'taxInfo', 'city', 'active']);
  const { 
    apiParams, 
    paginationProps, 
    sortBy, 
    setSortBy, 
    sortOrder, 
    setSortOrder, 
    filters, 
    setFilter, 
    removeFilter, 
    resetFilters, 
    page, 
    pageSize, 
    searchTerm, 
    setSearchTerm, 
    handleColumnSort 
  } = useApiFilters(FILTER_CONFIGS.companies, { defaultPageSize: 10, defaultSortBy: 'name-asc' });

  const statusFilter = filters.status || "All";

  const [showModal, setShowModal] = useState(false);
  const [assignTenant, setAssignTenant] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const queryParams = { 
    ...apiParams
  };
  
  if (statusFilter === "Active") queryParams.active = true;
  if (statusFilter === "Suspended") queryParams.active = false;

  const { data: companiesData, isLoading, isFetching, refetch } = useGetCompaniesQuery(queryParams);
  const tenants = Array.isArray(companiesData) ? companiesData : (companiesData?.companies || companiesData?.content || []);
  const pageInfo = Array.isArray(companiesData) ? companiesData._pageInfo : (companiesData?.pagination || companiesData || {});
  const totalPages = pageInfo?.totalPages || 0;
  const totalElements = pageInfo?.totalCount || pageInfo?.totalElements || tenants.length;

  const [createCompany] = useCreateCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();
  const [updateCompanyStatus] = useUpdateCompanyStatusMutation();
  const [deleteCompany] = useDeleteCompanyMutation();

  const { data: modulesData, isLoading: modulesLoading } = useGetModulesQuery(
    { page: 0, pageSize: 1000 },
    { skip: !assignTenant && !showModal }
  );
  const { data: companyModulesData, isLoading: companyModulesLoading } = useGetCompanyModulesQuery(
    { page: 1, pageSize: 5000 },
    { skip: !assignTenant }
  );
  const [createCompanyModule] = useCreateCompanyModuleMutation();
  const [deleteCompanyModule] = useDeleteCompanyModuleMutation();
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [domain, setDomain] = useState("");
  const [legalName, setLegalName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [gst, setGst] = useState("");
  const [pan, setPan] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [logo, setLogo] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("INR");
  const [status, setStatus] = useState("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName("");
    setCode("");
    setDomain("");
    setLegalName("");
    setCompanyType("");
    setGst("");
    setPan("");
    setEmail("");
    setPhone("");
    setWebsite("");
    setAddress("");
    setAddressLine2("");
    setCity("");
    setState("");
    setCountry("");
    setPostalCode("");
    setLogo("");
    setModuleId("");
    setBaseCurrency("INR");
    setStatus("Active");
  }, []);

  const handleOpenCreate = useCallback((prefillData = null) => {
    resetForm();
    if (prefillData && prefillData.name) {
      setName(prefillData.name);
    }
    setShowModal(true);
  }, [resetForm]);

  const handleOpenEdit = useCallback((tenant) => {
    setEditingId(tenant.id);
    setName(tenant.name || "");
    setCode(tenant.code || "");
    setDomain(tenant.domain || "");
    setLegalName(tenant.legalName || "");
    setCompanyType(tenant.companyType || "");
    setGst(tenant.gstin || "");
    setPan(tenant.pan || "");
    setEmail(tenant.email || "");
    setPhone(tenant.phone || "");
    setWebsite(tenant.website || "");
    setAddress(tenant.address || "");
    setAddressLine2(tenant.addressLine2 || "");
    setCity(tenant.city || "");
    setState(tenant.state || "");
    setCountry(tenant.country || "");
    setPostalCode(tenant.postalCode || "");
    setLogo(tenant.logoUrl || tenant.logo || "");
    setModuleId(tenant.modulesid || "");
    setBaseCurrency(tenant.baseCurrency || "INR");
    setStatus(tenant.active ? "Active" : "Inactive");
    setShowModal(true);
  }, []);

  const handleToggle = useCallback(async (id, currentStatus) => {
    try {
      await updateCompanyStatus({ id, active: !currentStatus }).unwrap();
      dispatch(addAlert({ type: "success", message: "Company status updated" }));
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: "error", message: "Failed to update company status" }));
    }
  }, [updateCompanyStatus, dispatch, refetch]);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    if (!name || !code || !domain) {
      dispatch(
        addAlert({ type: "warning", message: "Please complete all required fields (Name, Code, Domain)" }),
      );
      return;
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      dispatch(addAlert({ type: "warning", message: "Please enter a valid email address" }));
      return;
    }

    if (phone && !/^[0-9]{10,15}$/.test(phone)) {
      dispatch(addAlert({ type: "warning", message: "Please enter a valid phone number (10-15 digits)" }));
      return;
    }

    if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) {
      dispatch(addAlert({ type: "warning", message: "Please enter a valid 15-character GSTIN (e.g. 22AAAAA0000A1Z5)" }));
      return;
    }
    
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      dispatch(addAlert({ type: "warning", message: "Please enter a valid PAN (e.g. ABCDE1234F)" }));
      return;
    }

    if (website && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(website)) {
      dispatch(addAlert({ type: "warning", message: "Please enter a valid website URL" }));
      return;
    }

    setIsSubmitting(true);
    try {
        const payload = {
          name,
          code: code.toUpperCase(),
          domain: domain.toLowerCase(),
          legalName,
          companyType,
          gstin: gst.toUpperCase(),
          pan: pan.toUpperCase(),
          email,
          phone,
          website,
          address,
          addressLine2,
          city,
          state,
          country,
          postalCode,
          logo,
          modulesid: moduleId || undefined,
          baseCurrency,
          active: status === "Active"
        };
        
      if (editingId) {
        await updateCompany({ id: editingId, ...payload }).unwrap();
        dispatch(addAlert({ type: "success", message: `Company "${name}" updated successfully` }));
      } else {
        await createCompany(payload).unwrap();
        dispatch(addAlert({ type: "success", message: `Company "${name}" created successfully` }));
      }
      
      setShowModal(false);
      resetForm();
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: "error", message: error?.data?.message || "Failed to save company" }));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name, code, domain, email, phone, gst, pan, website, legalName, companyType,
    address, addressLine2, city, state, country, postalCode, logo, moduleId, baseCurrency, status,
    editingId, updateCompany, createCompany, dispatch, resetForm, refetch
  ]);

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '', loading: false });

  const handleOpenDelete = (id, name) => {
    setDeleteConfirm({ open: true, id, name, loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id || deleteConfirm.loading) return;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      await deleteCompany(deleteConfirm.id).unwrap();
      dispatch(
        addAlert({
          type: "success",
          message: `Company deleted permanently.`,
        })
      );
      setDeleteConfirm({ open: false, id: null, name: '', loading: false });
      refetch();
    } catch (error) {
      dispatch(addAlert({ type: "error", message: error?.data?.message || "Failed to delete company" }));
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCancelDelete = () => {
    if (!deleteConfirm.loading) {
      setDeleteConfirm({ open: false, id: null, name: '', loading: false });
    }
  };

  const handleToggleAssign = useCallback(async (m, isAssigned, assignedCompanyModule) => {
    try {
      if (isAssigned) {
        await deleteCompanyModule(assignedCompanyModule.id).unwrap();
        dispatch(addAlert({ type: "success", message: `Removed ${m.name} from ${assignTenant.name}` }));
      } else {
        await createCompanyModule({
          company: assignTenant.id,
          module: m.moduleId || m.id
        }).unwrap();
        dispatch(addAlert({ type: "success", message: `Assigned ${m.name} to ${assignTenant.name}` }));
      }
    } catch (error) {
      dispatch(addAlert({ type: "error", message: "Failed to update module assignment" }));
    }
  }, [deleteCompanyModule, createCompanyModule, assignTenant, dispatch]);

  const handleReset = () => {
    resetFilters();
    setSearchTerm('');
    setSelectedRows([]);
  };

  // DataTable Columns
  const columns = useMemo(() => [
    {
      id: 'code',
      label: 'Code',
      sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-700 font-medium">
          {row.code || '-'}
        </span>
      )
    },
    {
      id: 'name',
      label: 'Company Name',
      sortable: true,
      render: (val, row) => (
        <span 
          className="font-semibold text-zinc-900 cursor-pointer hover:text-indigo-600 transition-colors"
          onClick={() => {
            dispatch(setSelectedCompany(row));
            navigate(`/company/${row.id}/modules`);
          }}
        >
          {row.name || '-'}
        </span>
      )
    },
    {
      id: 'contact',
      label: 'Contact Info',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-zinc-800 font-medium truncate max-w-[150px]" title={row.email}>{row.email || '-'}</span>
          <span className="text-zinc-500 text-xs truncate max-w-[150px]" title={row.phone}>{row.phone || '-'}</span>
        </div>
      )
    },
    {
      id: 'domain',
      label: 'Domain & Type',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-zinc-800 font-medium truncate max-w-[120px]" title={row.domain}>{row.domain || '-'}</span>
          <span className="text-zinc-500 text-xs truncate max-w-[120px]" title={row.companyType}>{row.companyType || '-'}</span>
        </div>
      )
    },
    {
      id: 'taxInfo',
      label: 'Tax Info',
      sortable: false,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-zinc-800 font-mono font-medium text-xs truncate max-w-[150px]" title={row.gstin}>{row.gstin || '-'}</span>
          <span className="text-zinc-500 font-mono text-[11px] truncate max-w-[150px]" title={row.pan}>{row.pan || '-'}</span>
        </div>
      )
    },
    {
      id: 'city',
      label: 'Location',
      sortable: true,
      render: (val, row) => {
        const locationText = [row.city, row.state, row.country].filter(Boolean).join(", ");
        return (
          <span className="text-zinc-700 truncate max-w-[150px]" title={locationText}>
            {locationText || '-'}
          </span>
        );
      }
    },
    {
      id: 'active',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.active} />
    }
  ], [dispatch, navigate]);

  // Filters
  const basicFilters = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: 'All' },
        { label: 'Active', value: 'Active' },
        { label: 'Suspended', value: 'Suspended' },
      ]
    }
  ], []);

  // Row actions
  const rowActions = useMemo(() => {
    const actions = [
      {
        key: 'view',
        label: 'View Details',
        icon: Eye,
        onClick: (row) => navigate(isOwnerPortal ? `/owner/companies/${row.id}` : `/super-admin/companies/${row.id}`),
        tooltip: 'View Details',
        className: 'hover:text-indigo-600 hover:bg-indigo-50'
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: Edit,
        onClick: (row) => handleOpenEdit(row),
        tooltip: 'Edit Company',
        className: 'hover:text-indigo-600 hover:bg-indigo-50'
      },
      {
        key: 'manage-users',
        label: 'Manage Users',
        icon: Users,
        onClick: (row) => {
          dispatch(setSelectedCompany(row));
          navigate(`/company/${row.id}/users`);
        },
        tooltip: 'Manage Users',
        className: 'hover:text-blue-600 hover:bg-blue-50'
      },
    ];

    // Only expose Super Admin-only operations (system module assignment) to Super Admin
    if (isSuperAdmin) {
      actions.push({
        key: 'manage-access',
        label: 'Manage Access',
        icon: ShieldAlert,
        onClick: (row) => setAssignTenant(row),
        tooltip: 'Manage Access',
        className: 'hover:text-emerald-600 hover:bg-emerald-50'
      });
    }

    // Toggle status (Active / Suspend)
    actions.push({
      key: 'toggle-status',
      label: (row) => (row.active ? 'Suspend' : 'Activate'),
      icon: (row) => (row.active ? AlertCircle : CheckCircle),
      onClick: (row) => handleToggle(row.id, row.active),
      tooltip: (row) => (row.active ? 'Suspend Company' : 'Activate Company'),
      className: (row) => row.active 
        ? 'hover:text-amber-600 hover:bg-amber-50' 
        : 'hover:text-emerald-600 hover:bg-emerald-50'
    });

    // Delete company - allowed for Super Admin and Owners (or users with explicit delete capability)
    if (isSuperAdmin || isOwner || canDelete?.('COMPANIES')) {
      actions.push({
        key: 'delete',
        label: 'Delete',
        icon: Trash2,
        danger: true,
        onClick: (row) => handleOpenDelete(row.id, row.name),
        tooltip: 'Delete Company'
      });
    }

    return actions;
  }, [navigate, dispatch, handleOpenEdit, handleToggle, isOwnerPortal, isSuperAdmin, isOwner, canDelete]);

  // Expanded Row
  const renderExpandedRow = (company) => {
    const location = [
      company.address,
      company.addressLine2,
      company.city,
      company.state,
      company.country,
      company.postalCode,
    ].filter(Boolean).join(', ');

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Legal Name</span>
          <p className="text-sm font-semibold text-zinc-900">{company.legalName || '-'}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Base Currency</span>
          <p className="text-sm font-medium text-zinc-700">{company.baseCurrency || '-'}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Website</span>
          <p className="text-sm font-medium text-zinc-700">{company.website || '-'}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Full Address</span>
          <p className="text-sm font-medium text-zinc-700">{location || '-'}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">Created At</span>
          <p className="text-sm font-medium text-zinc-700">
            {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : '-'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Company Management"
        description="Super Administrator console to monitor and toggle client tenant instances."
      >
        <button onClick={() => handleOpenCreate()} className="btn-primary flex items-center gap-2">
          <PlusCircle size={16} />
          <span>Provision Tenant</span>
        </button>
      </PageHeader>

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <DataTable
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          columns={columns}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          data={tenants}
          rowKey="id"
          loading={isLoading}
          isRefreshing={isFetching}
          
          // Search
          searchable
          searchValue={searchTerm || ''}
          searchPlaceholder="Search companies by name, code, domain, or email..."
          onSearchChange={setSearchTerm}
          createOption={{
            enabled: true,
            label: (val) => `Provision "${val}"`,
            description: 'Provision new tenant',
            onCreate: (term) => handleOpenCreate({ name: term })
          }}

          // Basic Filters
          filters={basicFilters}
          filterValues={filters}
          onFilterChange={(id, val) => {
            if (val === 'All') removeFilter(id);
            else setFilter(id, val);
          }}

          // Reset & Refresh
          onReset={handleReset}
          onRefresh={refetch}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Row Actions
          rowActions={rowActions}

          // Expandable Sub-rows
          expandedRowId={expandedRowId}
          onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
          renderExpandedRow={renderExpandedRow}

          // Pagination
          pagination={{
            page: paginationProps.currentPage,
            pageSize: paginationProps.pageSize,
            totalPages: totalPages || 1,
            totalElements: totalElements
          }}
          onPageChange={paginationProps.onPageChange}
          onPageSizeChange={paginationProps.onPageSizeChange}
          itemName="companies"

          // Empty State
          emptyMessage="No companies found"
          emptyDescription="Try adjusting your search keywords or filter criteria to find companies."
        />
      </div>

      <CompanyCreateEditModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isSubmitting={isSubmitting}
        editingId={editingId}
        name={name} setName={setName}
        code={code} setCode={setCode}
        domain={domain} setDomain={setDomain}
        legalName={legalName} setLegalName={setLegalName}
        companyType={companyType} setCompanyType={setCompanyType}
        gst={gst} setGst={setGst}
        pan={pan} setPan={setPan}
        address={address} setAddress={setAddress}
        addressLine2={addressLine2} setAddressLine2={setAddressLine2}
        city={city} setCity={setCity}
        state={state} setState={setState}
        country={country} setCountry={setCountry}
        postalCode={postalCode} setPostalCode={setPostalCode}
        email={email} setEmail={setEmail}
        phone={phone} setPhone={setPhone}
        website={website} setWebsite={setWebsite}
        logo={logo} setLogo={setLogo}
        moduleId={moduleId} setModuleId={setModuleId}
        baseCurrency={baseCurrency} setBaseCurrency={setBaseCurrency}
        status={status} setStatus={setStatus}
        modulesLoading={modulesLoading}
        modulesData={modulesData}
        handleSave={handleSave}
      />

      <CompanyAssignModulesModal
        assignTenant={assignTenant}
        setAssignTenant={setAssignTenant}
        modulesLoading={modulesLoading}
        companyModulesLoading={companyModulesLoading}
        modulesData={modulesData}
        companyModulesData={companyModulesData}
        handleToggleAssign={handleToggleAssign}
      />

      <ConfirmModal
        open={deleteConfirm.open}
        title="Delete Company"
        message={
          <span>
            Are you sure you want to delete <span className="font-semibold text-zinc-900">"{deleteConfirm.name}"</span>?
          </span>
        }
        details="This action is irreversible and will permanently remove this company and its associated configuration."
        confirmLabel="Delete Company"
        cancelLabel="Cancel"
        loading={deleteConfirm.loading}
        loadingText="Deleting..."
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

export { CompanyList as CompanyManagement };
