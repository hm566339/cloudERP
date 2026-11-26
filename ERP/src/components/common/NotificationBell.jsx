import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  UserPlus,
  Zap,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getActiveCompanyId } from '../../api/common/roleCompanyContext';
import chatApiService from '../../features/chat/services/chatApiService';
import { useChatWebSocket } from '../../features/chat/hooks/useChatWebSocket';

export default function NotificationBell({ companyId: propCompanyId }) {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth?.user);
  const activeCompanyId = propCompanyId || getActiveCompanyId() || authUser?.companyId;
  const currentUserId = authUser?.id || authUser?.userId;
  const currentUserName = authUser?.name || authUser?.username || authUser?.fullName || 'User';

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const panelRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
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

  // Close on Escape key
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

  // Fetch initial unread count on load / company change
  const refreshUnreadCount = useCallback(() => {
    if (!activeCompanyId) return;

    chatApiService
      .getUnreadNotificationCount(activeCompanyId)
      .then((data) => {
        const count = typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
        setUnreadCount(count);
      })
      .catch((err) => {
        console.error('Failed to load notification unread count:', err);
      });
  }, [activeCompanyId]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Load recent notifications when panel is opened
  const loadNotifications = useCallback(() => {
    if (!activeCompanyId) return;

    setIsLoading(true);
    chatApiService
      .getNotifications({ page: 0, size: 20 }, activeCompanyId)
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : data?.content || data?.data || [];
        setNotifications(list);
      })
      .catch((err) => {
        console.error('Failed to load notifications list:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeCompanyId]);

  const handleTogglePanel = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      loadNotifications();
    }
  };

  // Real-time STOMP notification handler
  const handleLiveNotification = useCallback(
    (newNotif) => {
      if (!newNotif) return;

      // Check if user is currently looking at this active channel in the chat page
      const searchParams = new URLSearchParams(window.location.search);
      const activeChannelInUrl = searchParams.get('channelId');
      const isViewingThisChannel =
        newNotif.referenceId && activeChannelInUrl === String(newNotif.referenceId);

      if (!isViewingThisChannel) {
        setUnreadCount((prev) => prev + 1);
      }

      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  // Subscribe to real-time notifications via WebSocket
  useChatWebSocket({
    companyId: activeCompanyId,
    userId: currentUserId,
    userName: currentUserName,
    onNotificationReceived: handleLiveNotification,
  });

  // Also listen for local custom events (e.g. from chat activities)
  useEffect(() => {
    const handleCustomNotif = (e) => {
      if (e.detail) {
        handleLiveNotification(e.detail);
      }
    };
    window.addEventListener('mark2:new-notification', handleCustomNotif);
    return () => {
      window.removeEventListener('mark2:new-notification', handleCustomNotif);
    };
  }, [handleLiveNotification]);

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId) => {
    if (!activeCompanyId || !notificationId) return;

    try {
      await chatApiService.markNotificationAsRead(notificationId, activeCompanyId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!activeCompanyId || unreadCount === 0 || isMarkingAll) return;

    setIsMarkingAll(true);
    try {
      await chatApiService.markAllNotificationsAsRead(activeCompanyId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Handle click on notification item
  const handleNotificationClick = async (notif) => {
    // 1. Mark as read immediately if unread
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }

    // 2. Close dropdown
    setIsOpen(false);

    // 3. Deep link if chat or group reference
    if (notif.referenceId) {
      const channelId = notif.referenceId;
      const chatPath = activeCompanyId
        ? `/company/${activeCompanyId}/sales-crm/chat?channelId=${channelId}`
        : `/sales-crm/chat?channelId=${channelId}`;

      // Dispatch event for currently open ChatPage instance
      window.dispatchEvent(
        new CustomEvent('mark2:open-chat-channel', {
          detail: { channelId },
        })
      );

      navigate(chatPath, { state: { channelId } });
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CHAT_MESSAGE':
        return <MessageSquare className="w-3.5 h-3.5 text-[#4C8DFF]" />;
      case 'GROUP_ADDED':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-500" />;
      case 'WORKFLOW':
        return <Zap className="w-3.5 h-3.5 text-purple-500" />;
      case 'SYSTEM':
      default:
        return <Bell className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  // Badge text: empty if 0, "99+" if >99, otherwise number
  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className="relative inline-block text-left" ref={panelRef}>
      {/* Bell Icon Trigger Button */}
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={handleTogglePanel}
        className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors border ${
          isOpen
            ? 'bg-zinc-100 dark:bg-[#222736] text-zinc-900 dark:text-white border-zinc-200 dark:border-[#2A2F3D]'
            : 'hover:bg-zinc-100 dark:hover:bg-[#222736] text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-700 dark:hover:text-[#E6E8EE] border-transparent hover:border-zinc-200 dark:hover:border-[#2A2F3D]'
        }`}
      >
        <Bell size={18} className="transition-transform group-hover:scale-105" />

        {/* Dynamic Unread Badge */}
        {badgeLabel && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#161922] shadow-xs animate-in zoom-in-50 duration-150">
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-zinc-200 dark:border-[#2A2F3D] bg-white dark:bg-[#161922] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-[#2A2F3D] shrink-0 bg-zinc-50/50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-[#4C8DFF]">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="text-[11px] font-semibold text-[#4C8DFF] hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3 h-3" />
                )}
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {isLoading ? (
              <div className="py-10 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#4C8DFF]" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2 text-zinc-400">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  No notifications yet
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  When you receive messages or group updates, they'll appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.isRead;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 flex items-start gap-3 transition-colors cursor-pointer select-none ${
                      isUnread
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 bg-white dark:bg-[#161922]'
                    }`}
                  >
                    {/* Type Icon */}
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-xs truncate ${isUnread ? 'font-bold text-zinc-900 dark:text-white' : 'font-medium text-zinc-700 dark:text-zinc-300'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#4C8DFF] shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-2.5 border-t border-zinc-100 dark:border-[#2A2F3D] bg-zinc-50/50 dark:bg-zinc-900/40 text-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                const chatPath = activeCompanyId
                  ? `/company/${activeCompanyId}/sales-crm/chat`
                  : '/sales-crm/chat';
                navigate(chatPath);
              }}
              className="text-[11px] font-medium text-[#4C8DFF] hover:underline inline-flex items-center gap-1"
            >
              <span>Go to Company Chat</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
