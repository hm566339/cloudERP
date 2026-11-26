import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, UserPlus, Check, Loader2, AlertCircle, Shield, User } from 'lucide-react';
import { getUsers } from '../../../api/sso/user';
import chatApiService from '../services/chatApiService';

export default function AddMembersModal({
  isOpen,
  channel,
  companyId,
  currentUserId,
  onClose,
  onMembersAdded,
}) {
  const [companyUsers, setCompanyUsers] = useState([]);
  const [existingMemberIds, setExistingMemberIds] = useState(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [role, setRole] = useState('MEMBER');
  const [search, setSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !channel?.id || !companyId) return;

    let isMounted = true;
    setIsLoadingUsers(true);
    setError(null);
    setSelectedUserIds([]);
    setSearch('');

    // Fetch existing channel members and company users in parallel
    Promise.all([
      chatApiService.getChannelMembers(channel.id, companyId).catch(() => []),
      getUsers(companyId).catch(() => []),
    ])
      .then(([members, users]) => {
        if (!isMounted) return;

        // Existing member IDs
        const existingSet = new Set((members || []).map((m) => m.userId || m.id));
        setExistingMemberIds(existingSet);

        // Normalize company users
        const userList = Array.isArray(users)
          ? users
          : users?.content || users?.data || [];
        setCompanyUsers(userList);
      })
      .catch((err) => {
        if (isMounted) {
          setError('Failed to load company users: ' + (err?.message || 'Unknown error'));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingUsers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, channel?.id, companyId]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return companyUsers.filter((u) => {
      const name = (u.fullName || u.name || u.userName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const q = search.toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [companyUsers, search]);

  if (!isOpen || !channel) return null;

  const toggleSelectUser = (userId) => {
    if (existingMemberIds.has(userId)) return;

    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllNonMembers = () => {
    const nonMemberIds = filteredUsers
      .map((u) => u.id || u.userId)
      .filter((id) => !existingMemberIds.has(id));

    const allSelected = nonMemberIds.every((id) => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !nonMemberIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...nonMemberIds])));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      setError('Please select at least one user to add.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await chatApiService.addChannelMembers(
        channel.id,
        {
          memberUserIds: selectedUserIds,
          role: role,
        },
        companyId
      );

      if (onMembersAdded) {
        onMembersAdded(selectedUserIds.length);
      }
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to add members to channel.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#161922] w-full max-w-lg rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-[#2A2F3D] shrink-0">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              Add Users to #{channel.name}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Select company members to invite to this group channel.
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

        {/* Modal Search & Filter Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3 shrink-0">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#4C8DFF]"
              />
            </div>

            {/* Role picker for new members */}
            <div className="flex items-center gap-1.5 shrink-0">
              <label className="text-[11px] font-medium text-zinc-500">Role:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#4C8DFF]"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>
              {selectedUserIds.length} user{selectedUserIds.length === 1 ? '' : 's'} selected
            </span>
            <button
              type="button"
              onClick={handleSelectAllNonMembers}
              className="text-[#4C8DFF] hover:underline font-medium"
            >
              Select / Deselect All
            </button>
          </div>
        </div>

        {/* Users List Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#4C8DFF]" />
              <span>Loading company users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              {search ? 'No users matching your search' : 'No company users found'}
            </div>
          ) : (
            filteredUsers.map((user) => {
              const uId = user.id || user.userId;
              const isAlreadyMember = existingMemberIds.has(uId);
              const isSelected = selectedUserIds.includes(uId);
              const userName = user.fullName || user.name || user.userName || 'Unnamed User';
              const userEmail = user.email || '';

              return (
                <div
                  key={uId}
                  onClick={() => !isAlreadyMember && toggleSelectUser(uId)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    isAlreadyMember
                      ? 'border-transparent bg-zinc-50/50 dark:bg-zinc-900/30 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-[#4C8DFF] bg-blue-50/60 dark:bg-blue-950/20 cursor-pointer'
                      : 'border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-200 truncate">
                        {userName}
                      </p>
                      {userEmail && (
                        <p className="text-[11px] text-zinc-400 truncate">{userEmail}</p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isAlreadyMember ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        In Group
                      </span>
                    ) : (
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#4C8DFF] border-[#4C8DFF] text-white'
                            : 'border-zinc-300 dark:border-zinc-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 p-3.5 border-t border-zinc-100 dark:border-[#2A2F3D] shrink-0 bg-zinc-50/50 dark:bg-[#161922]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedUserIds.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#4C8DFF] hover:bg-blue-600 text-white font-medium text-xs transition-colors shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <span>Add {selectedUserIds.length > 0 ? `${selectedUserIds.length} Members` : 'Members'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
