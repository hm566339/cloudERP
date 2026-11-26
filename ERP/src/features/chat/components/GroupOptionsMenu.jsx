import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Info,
  UserPlus,
  Users,
  Trash2,
  LogOut,
} from 'lucide-react';

export default function GroupOptionsMenu({
  channel,
  onOpenInfo,
  onOpenAddMembers,
  onOpenManageMembers,
  onOpenDeleteConfirm,
  onOpenLeaveConfirm,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!channel || channel.type !== 'GROUP') {
    return null;
  }

  const handleAction = (actionFn) => {
    setIsOpen(false);
    if (actionFn) {
      actionFn();
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Group options"
        title="Group Options & Member Management"
        className={`p-1.5 rounded-lg border text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors ${
          isOpen
            ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white'
            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
          <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
            <p className="font-semibold text-zinc-900 dark:text-zinc-200 truncate">
              #{channel.name}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {channel.memberCount || 1} members · Group
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleAction(onOpenInfo)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>Group Info & Settings</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onOpenAddMembers)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
            <span>Add Company Users</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onOpenManageMembers)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Manage Members</span>
          </button>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800/60" />

          {onOpenLeaveConfirm && (
            <button
              type="button"
              onClick={() => handleAction(onOpenLeaveConfirm)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-amber-500" />
              <span>Leave Group</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleAction(onOpenDeleteConfirm)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete Group</span>
          </button>
        </div>
      )}
    </div>
  );
}
