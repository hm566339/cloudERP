import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Hash,
  Users,
  Lock,
  Search,
  Check,
  Loader2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { getUsers } from '../../../api/sso/user';

export default function CreateChannelModal({
  isOpen,
  onClose,
  onSubmit,
  existingChannels = [],
  companyId,
  currentUserId,
  onSelectExistingChannel,
  isSubmitting = false,
}) {
  const [mode, setMode] = useState('GROUP'); // 'GROUP' | 'DIRECT'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  // User picker states for DIRECT mode
  const [companyUsers, setCompanyUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState(null);

  // Reset or load data when modal opens
  useEffect(() => {
    if (!isOpen) {
      setMode('GROUP');
      setName('');
      setDescription('');
      setInitialMessage('');
      setSelectedUsers([]);
      setSearch('');
      setError(null);
      return;
    }

    // Load company users when modal opens
    if (companyId) {
      let isMounted = true;
      setIsLoadingUsers(true);

      getUsers(companyId)
        .then((data) => {
          if (!isMounted) return;
          const list = Array.isArray(data)
            ? data
            : data?.content || data?.data || [];
          // Filter out current user so they don't DM themselves
          const filtered = list.filter((u) => {
            const uId = u.id || u.userId;
            return uId && uId !== currentUserId;
          });
          setCompanyUsers(filtered);
        })
        .catch((err) => {
          if (isMounted) {
            console.error('Failed to load company users for chat:', err);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingUsers(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, companyId, currentUserId]);

  // Filtered users matching search query
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return companyUsers;
    const q = search.toLowerCase();
    return companyUsers.filter((u) => {
      const uName = (u.fullName || u.name || u.userName || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uRole = (u.role || u.roleName || '').toLowerCase();
      return uName.includes(q) || uEmail.includes(q) || uRole.includes(q);
    });
  }, [companyUsers, search]);

  // Toggle user selection
  const handleToggleUser = (user) => {
    const uId = user.id || user.userId;
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => (u.id || u.userId) === uId);
      if (exists) {
        return prev.filter((u) => (u.id || u.userId) !== uId);
      }
      return [...prev, user];
    });
  };

  const handleRemoveSelectedUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => (u.id || u.userId) !== userId));
  };

  // Check if a direct chat with a single user already exists
  const existingDirectChannel = useMemo(() => {
    if (mode !== 'DIRECT' || selectedUsers.length !== 1) return null;
    const targetUser = selectedUsers[0];
    const targetName = (targetUser.fullName || targetUser.name || targetUser.userName || '').toLowerCase().trim();

    return existingChannels.find((ch) => {
      if (ch.type !== 'DIRECT') return false;
      const chName = (ch.name || '').toLowerCase().trim();
      return chName === targetName;
    }) || null;
  }, [mode, selectedUsers, existingChannels]);

  // Auto-generated name for multi-user direct chat
  const autoGroupName = useMemo(() => {
    if (selectedUsers.length > 1) {
      return selectedUsers.map((u) => u.fullName || u.name || u.userName || 'User').join(', ');
    }
    return '';
  }, [selectedUsers]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (mode === 'DIRECT') {
      if (selectedUsers.length === 0) {
        setError('Please select at least one recipient to start a chat.');
        return;
      }

      // 1-on-1 Direct Chat
      if (selectedUsers.length === 1) {
        const targetUser = selectedUsers[0];
        const targetName = targetUser.fullName || targetUser.name || targetUser.userName || 'Direct Chat';
        const targetId = targetUser.id || targetUser.userId;

        // If existing direct channel found, select it instead of duplicating
        if (existingDirectChannel && onSelectExistingChannel) {
          onSelectExistingChannel(existingDirectChannel.id, initialMessage.trim() || undefined);
          return;
        }

        onSubmit({
          name: targetName,
          type: 'DIRECT',
          memberUserIds: [targetId],
          initialMessage: initialMessage.trim() || undefined,
        });
        return;
      }

      // 2 or more users selected: automatically creates a GROUP
      const finalGroupName = name.trim() || autoGroupName;
      const memberIds = selectedUsers.map((u) => u.id || u.userId);

      onSubmit({
        name: finalGroupName,
        description: description.trim() || `Group conversation with ${autoGroupName}`,
        type: 'GROUP',
        memberUserIds: memberIds,
        initialMessage: initialMessage.trim() || undefined,
      });
      return;
    }

    // Standard GROUP creation
    if (!name.trim()) {
      setError('Please provide a channel name.');
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      type: 'GROUP',
      initialMessage: initialMessage.trim() || undefined,
    });
  };

  // Dynamic button label & subtitle logic
  const isMultiUser = mode === 'DIRECT' && selectedUsers.length > 1;
  const isSingleUser = mode === 'DIRECT' && selectedUsers.length === 1;

  let submitButtonLabel = 'Create Channel';
  if (mode === 'DIRECT') {
    if (selectedUsers.length === 0) {
      submitButtonLabel = 'Select Recipient';
    } else if (isSingleUser) {
      if (existingDirectChannel) {
        submitButtonLabel = initialMessage.trim() ? 'Open Chat & Send' : 'Open Existing Chat';
      } else {
        submitButtonLabel = initialMessage.trim() ? 'Send Message' : 'Start Direct Chat';
      }
    } else {
      submitButtonLabel = `Create Group & Message (${selectedUsers.length})`;
    }
  } else {
    submitButtonLabel = 'Create Group Channel';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#161922] w-full max-w-md rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-[#2A2F3D] shrink-0">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  {mode === 'DIRECT' ? (
                    <>
                      <Lock className="w-4 h-4 text-[#4C8DFF]" />
                      <span>New Direct Message</span>
                    </>
                  ) : (
                    <>
                      <Hash className="w-4 h-4 text-[#4C8DFF]" />
                      <span>Create Channel</span>
                    </>
                  )}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {mode === 'DIRECT'
                    ? 'Send a 1-on-1 message or group message with company colleagues'
                    : 'Create a dedicated topic channel for company coordination'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

                  {/* Modal Body */}
                  <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
                    {error && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-rose-600 dark:text-rose-400">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
          )}

                {/* Channel Type Selector Tabs */}
                <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Conversation Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                onClick={() => setMode('GROUP')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${mode === 'GROUP'
                            ? 'border-[#4C8DFF] bg-blue-50/70 dark:bg-blue-950/30 text-[#4C8DFF]'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                          }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Group Channel</span>
                      </button>
                      <button
                        type="button"
                onClick={() => setMode('DIRECT')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${mode === 'DIRECT'
                            ? 'border-[#4C8DFF] bg-blue-50/70 dark:bg-blue-950/30 text-[#4C8DFF]'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                          }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Direct Message</span>
                      </button>
                    </div>
                </div>

                  {/* DIRECT MODE: User Picker Section */}
                  {mode === 'DIRECT' && (
                    <div className="space-y-2.5 pt-1">
                      {/* Dynamic Header Badge */}
                      <div className="flex items-center justify-between text-[11px]">
                        <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                          Select Recipients <span className="text-rose-500">*</span>
                        </label>
                        {selectedUsers.length > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isMultiUser
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                                : 'bg-blue-50 text-[#4C8DFF] dark:bg-blue-950/40 dark:text-blue-400'
                              }`}
                          >
                            {isMultiUser
                              ? `Group Mode (${selectedUsers.length} Selected)`
                              : '1-on-1 Direct Message'}
                          </span>
                        )}
                      </div>

                      {/* Selected User Chips */}
                      {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 max-h-24 overflow-y-auto">
                          {selectedUsers.map((user) => {
                            const uId = user.id || user.userId;
                            const uName = user.fullName || user.name || user.userName || 'User';
                            return (
                              <span
                                key={uId}
                                className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium shadow-2xs"
                              >
                                <span className="truncate max-w-[120px]">{uName}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSelectedUser(uId)}
                                  className="p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* User Search Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search colleagues by name, email, or role..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#4C8DFF]"
                        />
                      </div>

                      {/* User Selection List */}
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-44 overflow-y-auto p-1 space-y-0.5 bg-white dark:bg-zinc-900/30">
                        {isLoadingUsers ? (
                          <div className="flex items-center justify-center py-6 text-zinc-400 gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4C8DFF]" />
                            <span>Loading company users...</span>
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="text-center py-6 text-zinc-400">
                            {search ? 'No users matching search' : 'No company colleagues found'}
                          </div>
                        ) : (
                          filteredUsers.map((user) => {
                            const uId = user.id || user.userId;
                            const isSelected = selectedUsers.some((u) => (u.id || u.userId) === uId);
                            const uName = user.fullName || user.name || user.userName || 'Unnamed';
                            const uEmail = user.email || user.role || '';

                            return (
                              <div
                                key={uId}
                                onClick={() => handleToggleUser(user)}
                                className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer select-none ${isSelected
                                    ? 'bg-blue-50/80 dark:bg-blue-950/30 text-zinc-900 dark:text-white'
                                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300'
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {uName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs truncate">{uName}</p>
                                    {uEmail && (
                                      <p className="text-[10px] text-zinc-400 truncate">{uEmail}</p>
                                    )}
                                  </div>
                                </div>

                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ml-2 ${isSelected
                                      ? 'bg-[#4C8DFF] border-[#4C8DFF] text-white'
                                      : 'border-zinc-300 dark:border-zinc-700'
                                    }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Single User Existing Direct Chat Alert */}
                      {isSingleUser && existingDirectChannel && (
                        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-blue-700 dark:text-blue-300 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>Existing direct chat found for this colleague.</span>
                          </div>
                          <span className="font-bold flex items-center gap-0.5">
                            Will open <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      )}

                      {/* Multi-User Group Transition: Optional Custom Group Name */}
                      {isMultiUser && (
                        <div className="pt-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                              Group Name (Optional)
                            </label>
                            <span className="text-[10px] text-zinc-400">
                              Defaults to member names
                            </span>
                          </div>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={autoGroupName || 'e.g. Sales Team'}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#4C8DFF]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* GROUP MODE: Standard Channel Name & Topic Inputs */}
                  {mode === 'GROUP' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Channel Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Hash className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Sales & Accounts or Project-Alpha"
                            className="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#4C8DFF]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Description / Topic (Optional)
                        </label>
                        <input
                          type="text"
                          maxLength={500}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g. Channel for sales quotes and customer negotiations"
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#4C8DFF]"
                        />
                      </div>
                    </>
                  )}

                  {/* Welcome / Initial Message (Optional for BOTH Group and Direct modes) */}
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Welcome / Initial Message (Optional)
                    </label>
                    <input
                      type="text"
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      placeholder={
                        mode === 'DIRECT'
                          ? 'Say hello or ask a question to start the conversation...'
                          : 'Welcome team! Channel created for quotation coordination...'
                      }
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#4C8DFF]"
                    />
                  </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-[#2A2F3D] flex items-center justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-3.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || (mode === 'DIRECT' && selectedUsers.length === 0)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#4C8DFF] hover:bg-blue-600 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>{submitButtonLabel}</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              );
}
