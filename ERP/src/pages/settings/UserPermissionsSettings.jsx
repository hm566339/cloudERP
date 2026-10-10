import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, Save, Loader2, Info } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectSelectedCompany } from '../../features/company-management/companySlice';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { addAlert } from '../../features/notifications/notificationSlice';
import { getUsers } from '../../api/sso/user';
import { getUserPermissions, getUserEffectivePermissions, syncUserPermissions } from '../../api/sso/permission';
import { getAllFeatures } from '../../api/sso/feature';

import PageHeader from '../../components/common/PageHeader';
import ModuleTabs, { userTabs } from '../../components/module-tabs';
import DataTable from '../../components/data-table/DataTable';

export default function UserPermissionsSettings() {
  const dispatch = useAppDispatch();
  const routeParams = useParams();
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const currentUser = useAppSelector(selectCurrentUser);
  const companyId = routeParams?.companyId || selectedCompany?.id || currentUser?.companyId || currentUser?.companyCode || (() => {
    try {
      return JSON.parse(localStorage.getItem('selected_company'))?.id || JSON.parse(localStorage.getItem('auth_user'))?.companyCode;
    } catch {
      return null;
    }
  })();

  const [users, setUsers] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const [userPermissions, setUserPermissions] = useState([]);
  const [effectivePermissions, setEffectivePermissions] = useState([]);
  
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' or 'effective'

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('module');
  const [sortOrder, setSortOrder] = useState('asc');

  // Initial Data Load
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingUsers(true);
      try {
        const [usersData, featuresData] = await Promise.all([
          getUsers(companyId, { page: 0, pageSize: 100 }),
          getAllFeatures()
        ]);
        const usersList = Array.isArray(usersData) ? usersData : usersData?.users || usersData?.content || [];
        setUsers(usersList);
        setFeatures(featuresData || []);
        
        if (usersList.length > 0) {
          setSelectedUserId(usersList[0].id);
        }
      } catch (error) {
        dispatch(addAlert({ type: 'error', title: 'Error', message: 'Failed to load initial data.' }));
      } finally {
        setIsLoadingUsers(false);
      }
    };
    if (companyId) fetchData();
  }, [companyId, dispatch]);

  // Load Permissions when User changes
  useEffect(() => {
    if (!selectedUserId) return;
    const fetchPermissions = async () => {
      setIsLoadingMatrix(true);
      try {
        const [directData, effectiveData] = await Promise.all([
          getUserPermissions(selectedUserId),
          getUserEffectivePermissions(selectedUserId)
        ]);
        setUserPermissions(directData || []);
        setEffectivePermissions(effectiveData?.permissions || []);
      } catch (error) {
        dispatch(addAlert({ type: 'error', title: 'Error', message: 'Failed to load user permissions.' }));
      } finally {
        setIsLoadingMatrix(false);
      }
    };
    fetchPermissions();
  }, [selectedUserId, dispatch]);

  const hasDirectPermission = useCallback((featureCode, action) => {
    return userPermissions.some(p => p.featureCode === featureCode && p.action === action && p.active !== false);
  }, [userPermissions]);

  const hasEffectivePermission = useCallback((featureCode, action) => {
    return effectivePermissions.some(p => p.featureCode === featureCode && p.action === action && p.allowed === true);
  }, [effectivePermissions]);

  const handleToggle = useCallback((featureCode, action) => {
    setUserPermissions(prev => {
      const exists = prev.find(p => p.featureCode === featureCode && p.action === action);
      if (exists) {
        return prev.filter(p => !(p.featureCode === featureCode && p.action === action));
      } else {
        return [...prev, { featureCode, action, enabled: true }];
      }
    });
  }, []);

  const handleSave = async () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    try {
      const payload = userPermissions.map(p => ({
        featureCode: p.featureCode,
        action: p.action,
        enabled: true
      }));
      await syncUserPermissions(selectedUserId, payload);
      dispatch(addAlert({ type: 'success', title: 'Success', message: 'User direct permissions synchronized successfully.' }));
      // Refetch to get updated effective permissions
      const effectiveData = await getUserEffectivePermissions(selectedUserId);
      setEffectivePermissions(effectiveData?.permissions || []);
    } catch (error) {
      dispatch(addAlert({ type: 'error', title: 'Error', message: 'Failed to sync permissions.' }));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredFeatures = useMemo(() => {
    return features.map(f => ({ ...f, id: f.id || f.code })).filter(f => {
      const search = searchTerm.toLowerCase();
      return f.name?.toLowerCase().includes(search) || f.moduleName?.toLowerCase().includes(search);
    }).sort((a, b) => {
      const valA = a[sortBy === 'module' ? 'moduleName' : sortBy === 'feature' ? 'name' : sortBy] || '';
      const valB = b[sortBy === 'module' ? 'moduleName' : sortBy === 'feature' ? 'name' : sortBy] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [features, searchTerm, sortBy, sortOrder]);

  const displayedFeatures = useMemo(() => {
    const pageFeatures = filteredFeatures.slice(page * pageSize, (page + 1) * pageSize);
    return pageFeatures.map((feature, index) => {
      const isDuplicateModule = index > 0 && feature.moduleName === pageFeatures[index - 1].moduleName;
      return { ...feature, _isDuplicateModule: isDuplicateModule };
    });
  }, [filteredFeatures, page, pageSize]);

  const totalPages = Math.ceil(filteredFeatures.length / pageSize);
  const totalElements = filteredFeatures.length;

  const handleColumnSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    if (users.length > 0) setSelectedUserId(users[0].id);
    setPage(0);
  };

  const columns = useMemo(() => [
    {
      id: 'module',
      label: 'Module',
      sortable: true,
      render: (val, row) => (
        row._isDuplicateModule ? null : <span className="font-medium text-zinc-900">{row.moduleName}</span>
      )
    },
    {
      id: 'feature',
      label: 'Feature',
      sortable: true,
      render: (val, row) => (
        <div>
           <div className="font-medium text-zinc-900">{row.name}</div>
           <div className="text-xs text-zinc-500">{row.code}</div>
        </div>
      )
    },
    ...['READ', 'WRITE', 'DELETE'].map(action => ({
      id: action,
      label: action,
      sortable: false,
      align: 'center',
      render: (val, row) => {
        const isSupported = row.supportedActions ? row.supportedActions.includes(action) : true;
        
        if (activeTab === 'effective') {
          return isSupported ? (
            hasEffectivePermission(row.code, action) ? (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                <ShieldCheck size={14} />
              </span>
            ) : (
              <span className="text-zinc-300 text-xs">-</span>
            )
          ) : (
            <span className="text-zinc-300 text-xs">-</span>
          );
        }

        return isSupported ? (
          <input
            type="checkbox"
            checked={hasDirectPermission(row.code, action)}
            onChange={() => handleToggle(row.code, action)}
            className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500 cursor-pointer"
          />
        ) : (
          <span className="text-zinc-300 text-xs">-</span>
        );
      }
    }))
  ], [hasDirectPermission, hasEffectivePermission, handleToggle, activeTab]);

  const basicFilters = useMemo(() => [
    {
      id: 'userId',
      label: 'Select User',
      type: 'select',
      options: users.map(u => ({ label: `${u.fullName || u.username} (${u.email})`, value: u.id }))
    }
  ], [users]);

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 relative">
      <PageHeader
        title="User Permissions"
        description="Manage direct permission overrides or view effective access resolving role inheritance."
      >
        {activeTab === 'direct' && (
          <button
            onClick={handleSave}
            disabled={isSaving || isLoadingMatrix || !selectedUserId}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save Direct Grants</span>
          </button>
        )}
      </PageHeader>
      
      <ModuleTabs tabs={userTabs} activeKey="user-permissions" />

      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="flex border-b border-zinc-200 mb-4 shrink-0">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'direct'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
            onClick={() => setActiveTab('direct')}
          >
            Direct Grants (Overrides)
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'effective'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
            }`}
            onClick={() => setActiveTab('effective')}
          >
            Effective Access (Read-only)
          </button>
        </div>

        {activeTab === 'effective' && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-blue-50 text-blue-700 rounded-lg text-sm shrink-0">
            <Info size={16} />
            This view shows the final resolved access for this user, including permissions inherited from their assigned roles. It cannot be edited directly.
          </div>
        )}

        <DataTable
          columns={columns}
          data={displayedFeatures}
          rowKey="code"
          loading={isLoadingMatrix || isLoadingUsers}
          
          // Search
          searchable
          searchValue={searchTerm}
          searchPlaceholder="Search features or modules..."
          onSearchChange={(val) => {
            setSearchTerm(val);
            setPage(0);
          }}

          // Basic Filters
          filters={basicFilters}
          filterValues={{ userId: selectedUserId }}
          onFilterChange={(key, val) => {
            if (key === 'userId' && val) {
              setSelectedUserId(val);
              setPage(0);
            }
          }}

          // Reset
          onReset={handleReset}

          // Sorting
          sort={{ key: sortBy, direction: sortOrder }}
          onSortChange={({ key }) => handleColumnSort(key)}

          // Pagination
          pagination={totalPages > 0 ? {
            page: page,
            pageSize: pageSize,
            totalPages: totalPages,
            totalElements: totalElements
          } : undefined}
          pageIndexBase={0}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
          itemName="features"

          emptyMessage="No features found"
          emptyDescription="Try adjusting your search keywords to find features."
        />
      </div>
    </div>
  );
}
