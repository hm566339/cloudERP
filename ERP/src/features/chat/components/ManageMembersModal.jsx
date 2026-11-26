import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Shield,
  ShieldCheck,
  UserMinus,
  LogOut,
  Loader2,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import Badge from '../../../components/common/Badge';
import chatApiService from '../services/chatApiService';

export default function ManageMembersModal({
  isOpen,
  channel,
  companyId,
  currentUserId,
  onClose,
  onOpenAddMembers,
  onMemberChanged,
  onLeftChannel,
}) {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);

  const loadMembers = () => {
    if (!channel?.id || !companyId) return;

    setIsLoading(true);
    setError(null);

    chatApiService
      .getChannelMembers(channel.id, companyId)
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load channel members'
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, channel?.id, companyId]);

  if (!isOpen || !channel) return null;

  // Check if current user is admin
  const currentMember = members.find((m) => m.userId === currentUserId);
  const isCurrentUserAdmin = currentMember?.role === 'ADMIN';

  // Toggle role: ADMIN <-> MEMBER
  const handleToggleRole = async (member) => {
    if (!channel?.id || !companyId) return;

    const newRole = member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    setActionLoadingId(member.id || member.userId);
    setError(null);

    try {
      await chatApiService.updateMemberRole(
        channel.id,
        member.userId,
        { role: newRole },
        companyId
      );

      // Refresh locally
      setMembers((prev) =>
        prev.map((m) => (m.userId === member.userId ? { ...m, role: newRole } : m))
      );

      if (onMemberChanged) {
        onMemberChanged();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update member role.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove member or leave
  const handleRemoveMember = async (member) => {
    if (!channel?.id || !companyId) return;

    const isSelf = member.userId === currentUserId;
    const confirmPrompt = isSelf
      ? 'Are you sure you want to leave this group?'
      : `Are you sure you want to remove ${member.userName || 'this user'} from the group?`;

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    setActionLoadingId(member.id || member.userId);
    setError(null);

    try {
      if (isSelf) {
        await chatApiService.leaveChannel(channel.id, companyId);
        onClose();
        if (onLeftChannel) {
          onLeftChannel(channel.id);
        }
      } else {
        await chatApiService.removeChannelMember(channel.id, member.userId, companyId);
        setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
        if (onMemberChanged) {
          onMemberChanged();
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to remove member from group.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#161922] w-full max-w-lg rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-[#2A2F3D] shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Group Members ({members.length})
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Manage participants and permissions in #{channel.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-2.5 bg-zinc-50/60 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-500">
            {isCurrentUserAdmin ? 'You are an Admin of this channel' : 'Channel Member'}
          </span>
          {onOpenAddMembers && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddMembers();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Users</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#4C8DFF]" />
              <span>Loading members...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">No members found</div>
          ) : (
            members.map((member) => {
              const isSelf = member.userId === currentUserId;
              const isAdmin = member.role === 'ADMIN';
              const isLoadingThis = actionLoadingId === (member.id || member.userId);

              return (
                <div
                  key={member.id || member.userId}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/30"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isAdmin
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {(member.userName || 'U').charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-200 truncate">
                          {member.userName || 'User'}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 text-[#4C8DFF] font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <span>Joined {formatDate(member.joinedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        isAdmin
                          ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {isAdmin ? (
                        <ShieldCheck className="w-3 h-3 text-amber-500" />
                      ) : (
                        <Shield className="w-3 h-3 text-zinc-400" />
                      )}
                      <span>{member.role}</span>
                    </span>

                    {/* Admin Actions */}
                    {isCurrentUserAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => handleToggleRole(member)}
                          title={isAdmin ? 'Demote to Member' : 'Promote to Admin'}
                          className="px-2 py-1 text-[11px] rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                        >
                          {isLoadingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isAdmin ? (
                            'Demote'
                          ) : (
                            'Make Admin'
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => handleRemoveMember(member)}
                          title={isSelf ? 'Leave Group' : 'Remove User'}
                          className={`p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-40 ${
                            isSelf ? 'text-amber-500 hover:text-amber-600' : ''
                          }`}
                        >
                          {isLoadingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isSelf ? (
                            <LogOut className="w-3.5 h-3.5" />
                          ) : (
                            <UserMinus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Non-admin self leave button */}
                    {!isCurrentUserAdmin && isSelf && (
                      <button
                        type="button"
                        disabled={isLoadingThis}
                        onClick={() => handleRemoveMember(member)}
                        title="Leave Group"
                        className="p-1 rounded text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                      >
                        {isLoadingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-3.5 border-t border-zinc-100 dark:border-[#2A2F3D] shrink-0 bg-zinc-50/50 dark:bg-[#161922]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
