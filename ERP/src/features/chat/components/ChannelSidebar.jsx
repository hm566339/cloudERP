import React, { useState } from 'react';
import { Hash, Users, Plus, Search, Radio, Lock, Bell, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function ChannelSidebar({
  channels = [],
  activeChannelId,
  onSelectChannel,
  onOpenCreateModal,
  isConnected = false,
  isLoading = false,
}) {
  const [search, setSearch] = useState('');

  const filteredChannels = channels.filter((ch) =>
    ch.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = channels.reduce((acc, ch) => acc + (ch.unreadCount || 0), 0);

  const getChannelIcon = (type) => {
    switch (type) {
      case 'DIRECT':
        return <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
      case 'SYSTEM_ALERT':
        return <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'GROUP':
      default:
        return <Hash className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    }
  };

  const formatLastActive = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'HH:mm');
    } catch {
      return '';
    }
  };

  return (
    <div className="w-72 shrink-0 flex flex-col h-full bg-white dark:bg-[#161922] border-r border-zinc-200 dark:border-[#2A2F3D] select-none">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-zinc-100 dark:border-[#2A2F3D]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-[#E6E8EE]">
              Company Chat
            </h2>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                {totalUnread}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Live WebSocket Indicator */}
            <div
              title={isConnected ? 'Live WebSocket Connected' : 'Connecting to Chat Server...'}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline font-mono text-[9px]">
                {isConnected ? 'LIVE' : 'SYNC'}
              </span>
            </div>

            {/* Create Channel Button */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              title="Create New Channel"
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#4C8DFF]"
          />
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-zinc-400">Loading channels...</div>
        ) : filteredChannels.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-400">
            {search ? 'No matching channels' : 'No channels found'}
          </div>
        ) : (
          filteredChannels.map((channel) => {
            const isActive = channel.id === activeChannelId;
            const unread = channel.unreadCount || 0;

            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelectChannel(channel.id)}
                className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-all ${
                  isActive
                    ? 'bg-blue-50/70 dark:bg-[#1E2433] text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                }`}
              >
                <div className="mt-0.5">{getChannelIcon(channel.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-xs truncate ${
                        isActive || unread > 0
                          ? 'font-bold text-zinc-900 dark:text-white'
                          : 'font-medium'
                      }`}
                    >
                      {channel.name}
                    </span>
                    {channel.lastMessageAt && (
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {formatLastActive(channel.lastMessageAt)}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                    {channel.lastMessageContent || 'No messages yet'}
                  </p>
                </div>

                {unread > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#4C8DFF] text-white shrink-0 self-center">
                    {unread}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
