import React, { useState, useMemo, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  Globe,
  Mail,
  Phone,
  Building2,
  FileText,
  MapPin,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import {
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useUpdateCompanyStatusMutation,
  useDeleteCompanyMutation,
  useGetModulesQuery,
} from '../../../../api/sso';
import PageHeader from '../../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../../components/data-table';
import CompanyCreateEditModal from '../../../company-management/components/CompanyCreateEditModal';
import ExportModal from '../../../../components/common/ExportModal';
import { confirmDialog } from '../../../../utils/confirmDialog';

const DEFAULT_COLUMNS = ['code', 'name', 'contact', 'location', 'status'];

export default function OrgCompaniesView({
  organization,
  companies: initialCompanies = [],
  maxCapacity = 4,
}) {
  const dispatch = useAppDispatch();

  // State
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');

  // Table filters & pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Form Fields State for CompanyCreateEditModal
  const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [domain, setDomain] = useState('');
    const [legalName, setLegalName] = useState('');
    const [companyType, setCompanyType] = useState('Private Limited');
    const [gst, setGst] = useState('');
    const [pan, setPan] = useState('');
    const [address, setAddress] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('India');
    const [postalCode, setPostalCode] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [logo, setLogo] = useState('');
    const [moduleId, setModuleId] = useState('');
    const [baseCurrency, setBaseCurrency] = useState('INR');
    const [status, setStatus] = useState('Active');

    // Advanced filter states
    const [filterValues, setFilterValues] = useState({
      companyCode: '',
      companyName: '',
      email: '',
      phone: '',
      gstin: '',
      pan: '',
      city: '',
      state: '',
      country: '',
    });

    const queryParams = useMemo(() => {
      const p = {
        page,
        pageSize,
      };
      if (searchTerm?.trim()) p.search = searchTerm.trim();
      if (statusFilter === 'Active') p.active = true;
      if (statusFilter === 'Inactive' || statusFilter === 'Suspended') p.active = false;
      return p;
    }, [page, pageSize, searchTerm, statusFilter]);

    // Data fetching
    const { data: companiesData, isLoading, isFetching, refetch } = useGetCompaniesQuery(queryParams);
    const { data: modulesData, isLoading: modulesLoading } = useGetModulesQuery(
      { page: 0, pageSize: 100 },
      { skip: !showModal }
    );

    const [createCompany, { isLoading: isCreating }] = useCreateCompanyMutation();
    const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation();
    const [updateCompanyStatus] = useUpdateCompanyStatusMutation();
    const [deleteCompany] = useDeleteCompanyMutation();

    const isSubmitting = isCreating || isUpdating;

    // Process companies list
    const companies = useMemo(() => {
      let list = [];
      if (Array.isArray(companiesData)) list = companiesData;
      else if (Array.isArray(companiesData?.companies)) list = companiesData.companies;
      else if (Array.isArray(companiesData?.data)) list = companiesData.data;
      else if (Array.isArray(companiesData?.content)) list = companiesData.content;
      else if (initialCompanies && initialCompanies.length > 0) list = initialCompanies;

      // Apply client-side filters if needed
      return list.filter((c) => {
        if (filterValues.companyCode && !c.code?.toLowerCase().includes(filterValues.companyCode.toLowerCase())) return false;
        if (filterValues.companyName && !c.name?.toLowerCase().includes(filterValues.companyName.toLowerCase())) return false;
        if (filterValues.city && !c.city?.toLowerCase().includes(filterValues.city.toLowerCase())) return false;
        if (filterValues.state && !c.state?.toLowerCase().includes(filterValues.state.toLowerCase())) return false;
        if (filterValues.gstin && !c.gstin?.toLowerCase().includes(filterValues.gstin.toLowerCase())) return false;
        if (filterValues.pan && !c.pan?.toLowerCase().includes(filterValues.pan.toLowerCase())) return false;
        return true;
      });
    }, [companiesData, initialCompanies, filterValues]);

    const pageInfo = companiesData?._pageInfo || companiesData?.pagination || null;
    const totalPages = pageInfo?.totalPages || Math.ceil((companiesData?.totalElements || companies.length) / pageSize) || 1;
    const totalElements = pageInfo?.totalElements || companiesData?.totalElements || companies.length;

    const resetForm = useCallback(() => {
      setEditingId(null);
      setFormError('');
      setName('');
      setCode('');
      setDomain('');
      setLegalName('');
      setCompanyType('Private Limited');
      setGst('');
      setPan('');
      setAddress('');
      setAddressLine2('');
      setCity('');
      setState('');
      setCountry('India');
      setPostalCode('');
      setEmail('');
      setPhone('');
      setWebsite('');
      setLogo('');
      setModuleId('');
      setBaseCurrency('INR');
      setStatus('Active');
    }, []);

    const handleOpenCreate = () => {
      resetForm();
      setShowModal(true);
    };

    const handleOpenEdit = (tenant) => {
      resetForm();
      setEditingId(tenant.id);
      setName(tenant.name || '');
      setCode(tenant.code || '');
      setDomain(tenant.domain || (tenant.email?.includes('@') ? tenant.email.split('@')[1] : ''));
      setLegalName(tenant.legalName || '');
      setCompanyType(tenant.companyType || 'Private Limited');
      setGst(tenant.gstin || '');
      setPan(tenant.pan || '');
      setAddress(tenant.address || '');
      setAddressLine2(tenant.addressLine2 || '');
      setCity(tenant.city || '');
      setState(tenant.state || '');
      setCountry(tenant.country || 'India');
      setPostalCode(tenant.postalCode || '');
      setEmail(tenant.email || '');
      setPhone(tenant.phone || '');
      setWebsite(tenant.website || '');
      setLogo(tenant.logoUrl || tenant.logo || '');
      setBaseCurrency(tenant.baseCurrency || 'INR');
      setStatus(tenant.active ? 'Active' : 'Inactive');
      setShowModal(true);
    };

    const handleToggleStatus = (tenant) => {
      const isActivating = !tenant.active;
      confirmDialog(
        `${isActivating ? 'Activate' : 'Deactivate'} Company`,
        `Are you sure you want to ${isActivating ? 'activate' : 'deactivate'} ${tenant.name || 'this company'}?`,
        async () => {
          try {
            await updateCompanyStatus({ id: tenant.id, active: isActivating }).unwrap();
            dispatch(addAlert({ type: 'success', message: `Company ${isActivating ? 'activated' : 'deactivated'} successfully` }));
            refetch();
          } catch (err) {
            dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to update company status' }));
          }
        }
      );
};

const handleDelete = (tenant) => {
  confirmDialog(
    'Delete Company',
    `Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`,
    async () => {
      try {
        await deleteCompany(tenant.id).unwrap();
        dispatch(addAlert({ type: 'success', message: 'Company deleted successfully' }));
        refetch();
      } catch (err) {
        dispatch(addAlert({ type: 'error', message: err?.data?.message || err?.message || 'Failed to delete company' }));
      }
    }
  );
};

  const handleSaveModal = async (e) => {
    if (e?.preventDefault) e.preventDefault();
      setFormError('');

    if (!name.trim() || !code.trim()) {
      const msg = 'Company Name and Code are required';
        setFormError(msg);
        dispatch(addAlert({type: 'warning', message: msg }));
        return;
    }

        const payload = {
          name: name.trim(),
        companyName: name.trim(),
        code: code.trim().toUpperCase(),
        companyCode: code.trim().toUpperCase(),
        legalName: legalName.trim(),
        companyType,
        domain: domain.trim() || (email?.includes('@') ? email.split('@')[1] : 'kasdenge.com'),
        gstin: gst.trim(),
        pan: pan.trim(),
        address: address.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        postalCode: postalCode.trim(),
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        baseCurrency,
        active: status === 'Active',
    };

        try {
      if (editingId) {
          await updateCompany({ id: editingId, ...payload }).unwrap();
        dispatch(addAlert({type: 'success', message: 'Company updated successfully' }));
      } else {
          await createCompany(payload).unwrap();
        dispatch(addAlert({type: 'success', message: 'Company created successfully' }));
      }
        setShowModal(false);
        resetForm();
        refetch();
    } catch (err) {
      const errorMsg = err?.data?.message || err?.message || 'Failed to save company';
        setFormError(errorMsg);
        dispatch(addAlert({type: 'error', message: errorMsg }));
    }
  };

  // Table Column Definitions
  const columns = useMemo(() => [
        {
          id: 'code',
        label: 'Code',
        sortable: true,
      render: (val, row) => (
        <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-700 dark:text-zinc-300 font-medium">
          {row.code || '-'}
        </span>
        ),
    },
        {
          id: 'name',
        label: 'Company Name',
        sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name || '-'}</span>
          {row.legalName && row.legalName !== row.name && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{row.legalName}</span>
          )}
        </div>
          ),
    },
          {
            id: 'contact',
          label: 'Contact',
          sortable: false,
      render: (val, row) => (
          <div className="flex flex-col">
            <span className="text-zinc-800 dark:text-zinc-200 font-medium text-xs">{row.email || '-'}</span>
            <span className="text-zinc-500 dark:text-zinc-400 text-xs">{row.phone || '-'}</span>
          </div>
              ),
    },
              {
                id: 'location',
              label: 'Location',
              sortable: false,
      render: (val, row) => (
              <div className="flex flex-col">
                <span className="text-zinc-800 dark:text-zinc-200 font-medium text-xs">{row.city || '-'}</span>
                <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                  {[row.state, row.country].filter(Boolean).join(', ') || '-'}
                </span>
              </div>
              ),
    },
              {
                id: 'status',
              label: 'Status',
              sortable: true,
              sortKey: 'active',
              align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.active} />,
    },
              ], []);

  // Quick toolbar filters
  const basicFilters = useMemo(() => [
          {
            id: 'status',
          label: 'Status',
          type: 'select',
          value: statusFilter,
          options: [
          {label: 'All Statuses', value: 'All' },
          {label: 'Active', value: 'Active' },
          {label: 'Suspended / Inactive', value: 'Inactive' },
          ],
    },
          ], [statusFilter]);

  // Advanced Filters
  const advancedFilters = useMemo(() => [
            {
              title: 'Company Identification',
            fields: [
            {id: 'companyCode', label: 'Company Code', placeholder: 'e.g. COMP01' },
            {id: 'companyName', label: 'Company Name', placeholder: 'Partial or full name' },
            {id: 'gstin', label: 'GSTIN', placeholder: '15-digit GSTIN', uppercase: true },
            {id: 'pan', label: 'PAN', placeholder: '10-digit PAN', uppercase: true },
            ],
    },
            {
              title: 'Location Details',
            fields: [
            {id: 'city', label: 'City', placeholder: 'City' },
            {id: 'state', label: 'State', placeholder: 'State' },
            {id: 'country', label: 'Country', placeholder: 'Country' },
            ],
    },
            ], []);

  // Row Actions
  const rowActions = useMemo(() => [
            {
              key: 'view',
            label: 'View Details',
            icon: Eye,
      onClick: (row) => setExpandedRowId((prev) => (prev === row.id ? null : row.id)),
            tooltip: 'View Details',
            className: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40',
    },
            {
              key: 'toggle-status',
      label: (row) => (row.active ? 'Deactivate' : 'Activate'),
      icon: (row) => (row.active ? AlertCircle : CheckCircle),
      onClick: (row) => handleToggleStatus(row),
      tooltip: (row) => (row.active ? 'Deactivate Company' : 'Activate Company'),
      className: (row) =>
            row.active
            ? 'hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            : 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
    },
            {
              key: 'edit',
            label: 'Edit',
            icon: Edit2,
      onClick: (row) => handleOpenEdit(row),
            tooltip: 'Edit Company',
            className: 'hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
    },
            {
              key: 'delete',
            label: 'Delete',
            icon: Trash2,
            danger: true,
      onClick: (row) => handleDelete(row),
            tooltip: 'Delete Company',
    },
            ], []);

  // Sub-row expanded drawer
  const renderExpandedRow = (tenant) => (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 p-2 text-xs">
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Legal Name</span>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{tenant.legalName || tenant.name || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Domain</span>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">{tenant.domain || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Base Currency</span>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">{tenant.baseCurrency || 'INR'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">GSTIN</span>
                <p className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{tenant.gstin || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">PAN</span>
                <p className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{tenant.pan || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Address</span>
                <p className="font-medium text-zinc-700 dark:text-zinc-300 truncate" title={[tenant.address, tenant.city, tenant.state, tenant.postalCode].filter(Boolean).join(', ')}>
                  {[tenant.address, tenant.city, tenant.state, tenant.postalCode].filter(Boolean).join(', ') || '-'}
                </p>
              </div>
            </div>
            );

                      const handleResetFilters = () => {
                        setSearchTerm('');
                        setStatusFilter('All');
                        setFilterValues({
                          companyCode: '',
                          companyName: '',
                          email: '',
                          phone: '',
                          gstin: '',
                          pan: '',
                          city: '',
                          state: '',
                          country: '',
                        });
                        setPage(0);
                        setSelectedRows([]);
                      };

                          const handleSortChange = ({key}) => {
    if (sortBy === key) {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
                            setSortBy(key);
                          setSortOrder('asc');
    }
                          setPage(0);
  };

                          return (
                          <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
                            <PageHeader
                              title="Companies Management"
                              description="Manage operating companies, subsidiary entities, and workspaces"
                            >
                              <button
                                type="button"
                                onClick={handleOpenCreate}
                                className="btn-primary flex items-center gap-2"
                              >
                                <Plus size={16} />
                                <span>New Company</span>
                              </button>
                            </PageHeader>

                            {/* Main Content Area */}
                            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                              <DataTable
                                permissionFeature="COMPANY"
                                selectable
                                selectedRows={selectedRows}
                                onSelectionChange={setSelectedRows}
                                columns={columns}
                                data={companies}
                                rowKey="id"
                                loading={isLoading}
                                isRefreshing={isFetching}

          // Search
                              searchable
                              searchValue={searchTerm}
                              searchPlaceholder="Name, Code, Email..."
                              onSearchChange={(val) => {
                                setSearchTerm(val);
                                setPage(0);
                              }}

          // Filters
          filters = { basicFilters }
                      filterValues = {{ status: statusFilter }
                    }
          onFilterChange = {(key, val) => {
            if (key === 'status') setStatusFilter(val);
                  setPage(0);
          }}
                  advancedFilters={advancedFilters}

          // Reset & Refresh & Export
                  onReset={handleResetFilters}
                  onRefresh={refetch}
                  onExport={() => setIsExportModalOpen(true)}

          // Columns
                  visibleColumns={visibleColumns}
                  onVisibleColumnsChange={setVisibleColumns}

          // Sorting
                  sort={{ key: sortBy, direction: sortOrder }}
                  onSortChange={handleSortChange}

          // Row Actions & Expansion
                  rowActions={rowActions}
                  expandedRowId={expandedRowId}
                  onToggleExpand={(id) => setExpandedRowId((prev) => (prev === id ? null : id))}
                  renderExpandedRow={renderExpandedRow}

          // Pagination
                  pagination={{
                    page,
                    pageSize,
                    totalPages,
                    totalElements,
                  }}
                  pageIndexBase={0}
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(0);
                  }}
                  itemName="companies"

                  // Empty State matching Customer Management
                  emptyMessage="No companies found"
                  emptyDescription="Try adjusting your search keywords or filter criteria to find company accounts."
        />
                </div>

                <CompanyCreateEditModal
                  isOpen={showModal}
                  onClose={() => setShowModal(false)}
                  isSubmitting={isSubmitting}
                  editingId={editingId}
                  formError={formError}
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
                  handleSave={handleSaveModal}
                />

                <ExportModal
                  isOpen={isExportModalOpen}
                  onClose={() => setIsExportModalOpen(false)}
                  reportName="companies-management-export"
                  hideDateRange={true}
                  selectedIds={selectedRows}
                  selectedCount={selectedRows.length}
                />
            </div>
            );
}
