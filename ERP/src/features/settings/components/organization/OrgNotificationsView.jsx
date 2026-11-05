import React, { useState, useMemo } from 'react';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Mail,
  MessageSquare,
  Radio,
  Send,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { useAppDispatch } from '../../../../app/hooks';
import { addAlert } from '../../../notifications/notificationSlice';
import PageHeader from '../../../../components/common/PageHeader';
import DataTable, { DataTableStatusBadge } from '../../../../components/data-table';
import Modal from '../../../../components/common/Modal';
import ExportModal from '../../../../components/common/ExportModal';
import { confirmDialog } from '../../../../utils/confirmDialog';

  const DEFAULT_COLUMNS = [
    'name',
    'type',
    'channel',
    'eventTrigger',
    'recipients',
    'status',
  ];

  const INITIAL_NOTIFICATIONS = [
    {
      id: 'notif-1',
      name: 'New User Signup & Member Invitation',
      type: 'Security',
      channel: 'Email',
      eventTrigger: 'User Invited / Joined Organization',
      recipients: 'Organization Admins',
      description: 'Sends email alert when a new user accepts an invitation or is provisioned.',
      status: true,
    },
    {
      id: 'notif-2',
      name: 'Role & Permissions Assignment Alert',
      type: 'Security',
      channel: 'In-App & Email',
      eventTrigger: 'Role Assigned / Permissions Modified',
      recipients: 'Affected Member, Admins',
      description: 'Instant security notification when user privileges or company roles change.',
      status: true,
    },
    {
      id: 'notif-3',
      name: 'Subscription Renewal & Billing Invoice',
      type: 'Billing',
      channel: 'Email',
      eventTrigger: 'Invoice Generated / Payment Due',
      recipients: 'Organization Owners',
      description: 'Automated receipt and invoice reminder before subscription cycle billing.',
      status: true,
    },
    {
      id: 'notif-4',
      name: 'Workflow Approval Escalation',
      type: 'Workflow',
      channel: 'In-App',
      eventTrigger: 'Task Pending > 24 Hours',
      recipients: 'Approver, Assigned Manager',
      description: 'Reminder sent when a pending purchase or sales requisition awaits approval.',
      status: true,
    },
    {
      id: 'notif-5',
      name: 'Suspicious Login / Multiple Failed Attempts',
      type: 'Security',
      channel: 'Email & SMS',
      eventTrigger: '5 Consecutive Failed Logins',
      recipients: 'Organization Admins, User',
      description: 'High-priority security notification triggered upon account lockout.',
      status: true,
    },
    {
      id: 'notif-6',
      name: 'Weekly Organization Digest',
      type: 'Digest',
      channel: 'Email',
      eventTrigger: 'Every Monday 08:00 AM',
      recipients: 'All Members',
      description: 'Summary of company transactions, member headcount, and workflow tasks.',
      status: false,
    },
  ];

  export default function OrgNotificationsView({ organization }) {
    const dispatch = useAppDispatch();

    // State
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
    const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
    const [selectedRows, setSelectedRows] = useState([]);
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

      // Filters & Pagination
      const [searchTerm, setSearchTerm] = useState('');
      const [statusFilter, setStatusFilter] = useState('All');
      const [channelFilter, setChannelFilter] = useState('All');
      const [typeFilter, setTypeFilter] = useState('All');
      const [page, setPage] = useState(0);
      const [pageSize, setPageSize] = useState(10);
      const [sortBy, setSortBy] = useState('name');
      const [sortOrder, setSortOrder] = useState('asc');

      // Modals
      const [isCreateOpen, setIsCreateOpen] = useState(false);
      const [isEditOpen, setIsEditOpen] = useState(false);
      const [editingItem, setEditingItem] = useState(null);

      // Form State
      const [formName, setFormName] = useState('');
      const [formType, setFormType] = useState('Security');
      const [formChannel, setFormChannel] = useState('Email');
      const [formTrigger, setFormTrigger] = useState('User Invited / Joined Organization');
      const [formRecipients, setFormRecipients] = useState('Organization Admins');
      const [formDescription, setFormDescription] = useState('');

      // Filtered Notifications
      const filteredNotifications = useMemo(() => {
        return notifications
          .filter((n) => {
            if (searchTerm.trim()) {
              const term = searchTerm.toLowerCase();
              const matchesName = n.name.toLowerCase().includes(term);
              const matchesTrigger = n.eventTrigger.toLowerCase().includes(term);
              const matchesRecipients = n.recipients.toLowerCase().includes(term);
              if (!matchesName && !matchesTrigger && !matchesRecipients) return false;
            }

            if (statusFilter === 'Active' && !n.status) return false;
            if (statusFilter === 'Inactive' && n.status) return false;

            if (channelFilter !== 'All' && !n.channel.includes(channelFilter)) return false;
            if (typeFilter !== 'All' && n.type !== typeFilter) return false;

            return true;
          })
          .sort((a, b) => {
            let valA = a[sortBy] ?? '';
            let valB = b[sortBy] ?? '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
          });
      }, [notifications, searchTerm, statusFilter, channelFilter, typeFilter, sortBy, sortOrder]);

      const totalElements = filteredNotifications.length;
      const totalPages = Math.ceil(totalElements / pageSize) || 1;
      const paginatedNotifications = useMemo(() => {
        const start = page * pageSize;
        return filteredNotifications.slice(start, start + pageSize);
      }, [filteredNotifications, page, pageSize]);

      // Handlers
      const handleOpenCreate = () => {
        setFormName('');
        setFormType('Security');
        setFormChannel('Email');
        setFormTrigger('User Invited / Joined Organization');
        setFormRecipients('Organization Admins');
        setFormDescription('');
        setIsCreateOpen(true);
      };

        const handleOpenEdit = (item) => {
          setEditingItem(item);
          setFormName(item.name);
          setFormType(item.type);
          setFormChannel(item.channel);
          setFormTrigger(item.eventTrigger);
          setFormRecipients(item.recipients);
          setFormDescription(item.description || '');
          setIsEditOpen(true);
        };

        const handleCreateSubmit = (e) => {
          e.preventDefault();
          if (!formName.trim()) {
            dispatch(addAlert({ type: 'warning', message: 'Notification name is required' }));
            return;
          }

          const newItem = {
            id: `notif-${Date.now()}`,
            name: formName.trim(),
            type: formType,
            channel: formChannel,
            eventTrigger: formTrigger,
            recipients: formRecipients,
            description: formDescription.trim(),
            status: true,
          };

          setNotifications((prev) => [newItem, ...prev]);
          dispatch(addAlert({ type: 'success', message: 'Notification rule created successfully' }));
          setIsCreateOpen(false);
        };

  const handleEditSubmit = (e) => {
                  e.preventDefault();
                if (!formName.trim()) {
                  dispatch(addAlert({ type: 'warning', message: 'Notification name is required' }));
                return;
    }

    setNotifications((prev) =>
      prev.map((n) =>
                n.id === editingItem.id
                ? {
                  ...n,
                  name: formName.trim(),
                type: formType,
                channel: formChannel,
                eventTrigger: formTrigger,
                recipients: formRecipients,
                description: formDescription.trim(),
            }
                : n
                )
                );

                dispatch(addAlert({type: 'success', message: 'Notification rule updated successfully' }));
                setIsEditOpen(false);
  };

  const handleToggleStatus = (item) => {
    const newStatus = !item.status;
                confirmDialog(
                `${newStatus ? 'Enable' : 'Disable'} Notification`,
                `Are you sure you want to ${newStatus ? 'enable' : 'disable'} "${item.name}"?`,
      () => {
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === item.id ? { ...n, status: newStatus } : n))
                  );
                dispatch(
                addAlert({
                  type: 'success',
                message: `Notification ${newStatus ? 'enabled' : 'disabled'} successfully`,
          })
                );
      }
                );
  };

  const handleDelete = (item) => {
                  confirmDialog(
                    'Delete Notification Rule',
                    `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
                    () => {
                      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
                      dispatch(addAlert({ type: 'success', message: 'Notification rule deleted successfully' }));
                    }
                  );
  };

  // Columns definition
  const columns = useMemo(() => [
                {
                  id: 'name',
                label: 'Notification Name',
                sortable: true,
      render: (val, row) => (
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    <Bell size={15} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</span>
                    {row.description && (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-sm">
                        {row.description}
                      </span>
                    )}
                  </div>
                </div>
                ),
    },
                {
                  id: 'type',
                label: 'Notification Type',
                sortable: true,
      render: (val, row) => (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  {row.type}
                </span>
                ),
    },
                {
                  id: 'channel',
                label: 'Channel',
                sortable: true,
      render: (val, row) => (
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                  <Mail size={13} className="text-zinc-400" />
                  <span>{row.channel}</span>
                </span>
                ),
    },
                {
                  id: 'eventTrigger',
                label: 'Event Trigger',
                sortable: true,
      render: (val, row) => (
                <span className="text-xs text-zinc-800 dark:text-zinc-200 font-mono bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                  {row.eventTrigger}
                </span>
                ),
    },
                {
                  id: 'recipients',
                label: 'Recipients',
                sortable: true,
      render: (val, row) => (
                <span className="inline-flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-300">
                  <Users size={12} className="text-zinc-400" />
                  <span>{row.recipients}</span>
                </span>
                ),
    },
                {
                  id: 'status',
                label: 'Status',
                sortable: true,
                align: 'center',
      render: (val, row) => <DataTableStatusBadge status={row.status} />,
    },
                ], []);

  // Basic Filters
  const basicFilters = useMemo(() => [
                {
                  id: 'status',
                label: 'Status',
                type: 'select',
                value: statusFilter,
                options: [
                {label: 'All Statuses', value: 'All' },
                {label: 'Active', value: 'Active' },
                {label: 'Inactive', value: 'Inactive' },
                ],
    },
                {
                  id: 'channel',
                label: 'Channel',
                type: 'select',
                value: channelFilter,
                options: [
                {label: 'All Channels', value: 'All' },
                {label: 'Email', value: 'Email' },
                {label: 'In-App', value: 'In-App' },
                {label: 'SMS', value: 'SMS' },
                ],
    },
                {
                  id: 'type',
                label: 'Type',
                type: 'select',
                value: typeFilter,
                options: [
                {label: 'All Types', value: 'All' },
                {label: 'Security', value: 'Security' },
                {label: 'Billing', value: 'Billing' },
                {label: 'Workflow', value: 'Workflow' },
                {label: 'Digest', value: 'Digest' },
                ],
    },
                ], [statusFilter, channelFilter, typeFilter]);

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
                  key: 'edit',
                label: 'Edit',
                icon: Edit2,
      onClick: (row) => handleOpenEdit(row),
                tooltip: 'Edit Notification Rule',
                className: 'hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
    },
                {
                  key: 'toggle-status',
      label: (row) => (row.status ? 'Disable' : 'Enable'),
      icon: (row) => (row.status ? AlertCircle : CheckCircle),
      onClick: (row) => handleToggleStatus(row),
      tooltip: (row) => (row.status ? 'Disable Alert' : 'Enable Alert'),
      className: (row) =>
                row.status
                ? 'hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                : 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
    },
                {
                  key: 'delete',
                label: 'Delete',
                icon: Trash2,
                danger: true,
      onClick: (row) => handleDelete(row),
                tooltip: 'Delete Rule',
    },
                ], []);

  // Sub-row expanded drawer
  const renderExpandedRow = (item) => (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-2 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Trigger Rule</span>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.eventTrigger}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Delivery Channel</span>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">{item.channel}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Target Recipients</span>
                    <p className="font-medium text-zinc-700 dark:text-zinc-300">{item.recipients}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Rule Description</span>
                    <p className="text-zinc-700 dark:text-zinc-300">{item.description || '-'}</p>
                  </div>
                </div>
                );

  const handleResetFilters = () => {
                          setSearchTerm('');
                        setStatusFilter('All');
                        setChannelFilter('All');
                        setTypeFilter('All');
                        setPage(0);
                        setSelectedRows([]);
  };

                        return (
                        <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0F1117]">
                          <PageHeader
                            title="Notifications"
                            description="Manage organization notification rules, channels, and event alert triggers"
                          >
                            <button
                              type="button"
                              onClick={handleOpenCreate}
                              className="btn-primary flex items-center gap-2"
                            >
                              <Plus size={16} />
                              <span>New Notification</span>
                            </button>
                          </PageHeader>

                          {/* Main Content Area */}
                          <div className="flex-1 p-6 overflow-hidden flex flex-col">
                            <DataTable
                              permissionFeature="NOTIFICATION_MANAGEMENT"
                              selectable
                              selectedRows={selectedRows}
                              onSelectionChange={setSelectedRows}
                              columns={columns}
                              data={paginatedNotifications}
                              rowKey="id"
                              loading={false}

                              // Search
                              searchable
                              searchValue={searchTerm}
                              searchPlaceholder="Name, Type, Trigger..."
                              onSearchChange={(val) => {
                                setSearchTerm(val);
                                setPage(0);
                              }}

                              // Filters
                              filters={basicFilters}
                              filterValues={{ status: statusFilter, channel: channelFilter, type: typeFilter }}
                              onFilterChange={(key, val) => {
                                if (key === 'status') setStatusFilter(val);
                                if (key === 'channel') setChannelFilter(val);
                                if (key === 'type') setTypeFilter(val);
                                setPage(0);
                              }}

                              // Reset & Refresh & Export
                              onReset={handleResetFilters}
                              onRefresh={() => { }}
                              onExport={() => setIsExportModalOpen(true)}

                              // Columns
                              visibleColumns={visibleColumns}
                              onVisibleColumnsChange={setVisibleColumns}

                              // Sorting
                              sort={{ key: sortBy, direction: sortOrder }}
                              onSortChange={({ key }) => {
                                if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                else { setSortBy(key); setSortOrder('asc'); }
                                setPage(0);
                              }}

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
                              itemName="notifications"

                              // Empty State matching Customer Management
                              emptyMessage="No notifications found"
                              emptyDescription="Try adjusting your search keywords or filter criteria to find notification rules."
                            />
                          </div>

                          {/* Create / Edit Modal */}
                          <Modal
                            isOpen={isCreateOpen || isEditOpen}
                            onClose={() => {
                              setIsCreateOpen(false);
                              setIsEditOpen(false);
                            }}
                            title={isEditOpen ? 'Edit Notification Rule' : 'New Notification Rule'}
                            size="md"
                          >
                            <form onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                  Notification Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formName}
                                  onChange={(e) => setFormName(e.target.value)}
                                  placeholder="e.g. User Signup Alert"
                                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                />
                              </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                        Notification Type
                                      </label>
                                      <select
                                        value={formType}
                                        onChange={(e) => setFormType(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                      >
                                        <option value="Security">Security</option>
                                        <option value="Billing">Billing</option>
                                        <option value="Workflow">Workflow</option>
                                        <option value="Digest">Digest</option>
                                      </select>
                                    </div>

                                      <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                          Delivery Channel
                                        </label>
                                        <select
                                          value={formChannel}
                                          onChange={(e) => setFormChannel(e.target.value)}
                                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                        >
                                          <option value="Email">Email</option>
                                          <option value="In-App">In-App</option>
                                          <option value="In-App & Email">In-App & Email</option>
                                          <option value="SMS">SMS</option>
                                          <option value="Webhook">Webhook</option>
                                        </select>
                                      </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                      Event Trigger
                                    </label>
                                    <input
                                      type="text"
                                      value={formTrigger}
                                      onChange={(e) => setFormTrigger(e.target.value)}
                                      placeholder="e.g. User Invited / Joined Organization"
                                      className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                    />
                                  </div>

                                      <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                          Recipients
                                        </label>
                                        <input
                                          type="text"
                                          value={formRecipients}
                                          onChange={(e) => setFormRecipients(e.target.value)}
                                          placeholder="e.g. Organization Admins"
                                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                        />
                                      </div>

                                          <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                                              Description
                                            </label>
                                            <textarea
                                              rows={2}
                                              value={formDescription}
                                              onChange={(e) => setFormDescription(e.target.value)}
                                              placeholder="Detailed trigger description..."
                                              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
                                            />
                                          </div>

                                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsCreateOpen(false);
                                          setIsEditOpen(false);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 rounded-lg"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        className="btn-primary"
                                      >
                                        Save Notification
                                      </button>
                                    </div>
                                  </form>
                                </Modal>

                                {/* Export Modal */}
                                <ExportModal
                                  isOpen={isExportModalOpen}
                                  onClose={() => setIsExportModalOpen(false)}
                                  reportName="notifications-export"
                                  hideDateRange={true}
                                  selectedIds={selectedRows}
                                  selectedCount={selectedRows.length}
                                />
                              </div>
                              );
}
