import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getActiveCompanyId } from '../../../api/common/roleCompanyContext';
import chatApiService from '../services/chatApiService';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import ChannelSidebar from '../components/ChannelSidebar';
import ChatThread from '../components/ChatThread';
import CreateChannelModal from '../components/CreateChannelModal';
import RequestQuotationModal from '../components/RequestQuotationModal';
import GroupInfoModal from '../components/GroupInfoModal';
import AddMembersModal from '../components/AddMembersModal';
import ManageMembersModal from '../components/ManageMembersModal';
import DeleteGroupConfirmModal from '../components/DeleteGroupConfirmModal';
import LeaveGroupConfirmModal from '../components/LeaveGroupConfirmModal';

export default function ChatPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const authUser = useSelector((state) => state.auth?.user);
  const currentCompanyId = params.companyId || getActiveCompanyId() || authUser?.companyId;
  const currentUserId = authUser?.id || authUser?.userId;

  const urlChannelId = searchParams.get('channelId') || location.state?.channelId;

  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(urlChannelId || null);

  // Sync active channel when query param changes
  useEffect(() => {
    const qChannelId = searchParams.get('channelId');
    if (qChannelId) {
      setActiveChannelId(qChannelId);
    }
  }, [searchParams]);

  // Listen for custom event from NotificationBell
  useEffect(() => {
    const handleOpenChannel = (e) => {
      if (e.detail?.channelId) {
        setActiveChannelId(e.detail.channelId);
      }
    };
    window.addEventListener('mark2:open-chat-channel', handleOpenChannel);
    return () => {
      window.removeEventListener('mark2:open-chat-channel', handleOpenChannel);
    };
  }, []);
  const [messages, setMessages] = useState([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isRequestQuoteOpen, setIsRequestQuoteOpen] = useState(false);

  // Group Management Modals state
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

  // Active channel object
  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId) || null,
    [channels, activeChannelId]
  );

  // Handle live incoming message on WebSocket topic
  const handleLiveMessage = useCallback(
    (newMsg) => {
      if (!newMsg) return;

      // Update messages list if on current channel
      if (newMsg.channelId === activeChannelId) {
        setMessages((prev) => {
          const index = prev.findIndex((m) => m.id === newMsg.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = newMsg;
            return updated;
          }
          return [...prev, newMsg];
        });

        // Mark read on backend
        chatApiService.markChannelRead(newMsg.channelId, currentCompanyId).catch(() => {});
      }

      // Update channels list (update last message, move to top, bump unread if inactive)
      setChannels((prevChannels) => {
        return prevChannels.map((ch) => {
          if (ch.id === newMsg.channelId) {
            const isCurrent = ch.id === activeChannelId;
            return {
              ...ch,
              lastMessageContent: newMsg.content,
              lastMessageAt: newMsg.createdAt,
              unreadCount: isCurrent ? 0 : (ch.unreadCount || 0) + 1,
            };
          }
          return ch;
        });
      });
    },
    [activeChannelId, currentCompanyId]
  );

  // WebSocket Hook
  const { isConnected, publishMessage, markReadOverWs } = useChatWebSocket({
    companyId: currentCompanyId,
    userId: currentUserId,
    userName: authUser?.name || authUser?.username || authUser?.fullName || 'User',
    activeChannelId,
    onMessageReceived: handleLiveMessage,
  });

  // Load channels on mount or company change
  useEffect(() => {
    if (!currentCompanyId) return;

    let isMounted = true;
    setIsLoadingChannels(true);

    chatApiService
      .getChannels(currentCompanyId)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setChannels(list);

        // Auto-select target channel from URL/props or first channel
        if (list.length > 0) {
          const preferredId = urlChannelId && list.some((c) => c.id === urlChannelId)
            ? urlChannelId
            : activeChannelId && list.some((c) => c.id === activeChannelId)
            ? activeChannelId
            : list[0].id;
          setActiveChannelId(preferredId);
        } else if (list.length === 0) {
          // Auto-provision initial Quotations & Sales channel
          chatApiService
            .createChannel(
              {
                name: 'Quotations & Sales',
                type: 'GROUP',
                initialMessage: 'Channel initialized for company sales and quotation coordination.',
              },
              currentCompanyId
            )
            .then((created) => {
              if (isMounted) {
                setChannels([created]);
                setActiveChannelId(created.id);
              }
            })
            .catch((err) => console.error('Failed to create default channel:', err));
        }
      })
      .catch((err) => console.error('Failed to load chat channels:', err))
      .finally(() => {
        if (isMounted) setIsLoadingChannels(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentCompanyId]);

  // Load message history when active channel changes
  useEffect(() => {
    if (!activeChannelId || !currentCompanyId) return;

    let isMounted = true;
    setIsLoadingMessages(true);

    chatApiService
      .getMessages(activeChannelId, 0, 50, currentCompanyId)
      .then((res) => {
        if (!isMounted) return;
        const pageContent = res?.content || res?.data || (Array.isArray(res) ? res : []);
        // API returns descending (newest first); reverse for display (oldest at top)
        setMessages([...pageContent].reverse());

        // Mark as read locally and on server
        setChannels((prev) =>
          prev.map((c) => (c.id === activeChannelId ? { ...c, unreadCount: 0 } : c))
        );
        chatApiService.markChannelRead(activeChannelId, currentCompanyId).catch(() => {});
      })
      .catch((err) => console.error('Failed to load channel messages:', err))
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeChannelId, currentCompanyId]);

  // Send message
  const handleSendMessage = async (payload) => {
    if (!activeChannelId || !currentCompanyId) return;

    setIsSending(true);
    try {
      // Direct REST API send (server broadcasts over STOMP to all subscribers)
      const res = await chatApiService.sendMessage(activeChannelId, payload, currentCompanyId);

      // Append locally immediately for instantaneous UI feedback
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.id)) return prev;
        return [...prev, res];
      });

      // Update channels list
      setChannels((prev) =>
        prev.map((c) =>
          c.id === activeChannelId
            ? { ...c, lastMessageContent: res.content, lastMessageAt: res.createdAt }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Create Channel
  const handleCreateChannel = async (channelData) => {
    try {
      const created = await chatApiService.createChannel(channelData, currentCompanyId);
      setChannels((prev) => [created, ...prev]);
      setActiveChannelId(created.id);
      setIsCreateChannelOpen(false);

      // If initial message was provided, reload messages so the thread reflects it immediately
      if (channelData.initialMessage && channelData.initialMessage.trim()) {
        chatApiService
          .getMessages(created.id, 0, 50, currentCompanyId)
          .then((msgs) => {
            const pageContent = msgs?.content || msgs?.data || (Array.isArray(msgs) ? msgs : []);
            setMessages([...pageContent].reverse());
          })
          .catch(() => {});
      }
      return created;
    } catch (err) {
      console.error('Failed to create channel:', err);
      throw err;
    }
  };

  // Submit Quotation Request Card
  const handleRequestQuotationSubmit = async (quotationPayload) => {
    try {
      await handleSendMessage(quotationPayload);
      setIsRequestQuoteOpen(false);
    } catch (err) {
      console.error('Failed to submit quotation request:', err);
    }
  };

  // Update Quotation Card Status
  const handleUpdateStatus = async (messageId, newStatus, comment) => {
    if (!activeChannelId || !currentCompanyId) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await chatApiService.updateActionStatus(
        activeChannelId,
        messageId,
        { actionStatus: newStatus, comment },
        currentCompanyId
      );

      // Update message card locally
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      console.error('Failed to update action status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Update Group Details (name, description)
  const handleUpdateChannel = async (updateData) => {
    if (!activeChannelId || !currentCompanyId) return;

    setIsUpdatingGroup(true);
    try {
      const updated = await chatApiService.updateChannel(
        activeChannelId,
        updateData,
        currentCompanyId
      );

      // Reflect in channels list
      setChannels((prev) =>
        prev.map((c) => (c.id === activeChannelId ? { ...c, ...updated } : c))
      );
      return updated;
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  // Delete Channel
  const handleDeleteChannel = async (channelId) => {
    if (!channelId || !currentCompanyId) return;

    await chatApiService.deleteChannel(channelId, currentCompanyId);

    // Remove from channels list and select another channel cleanly
    setChannels((prev) => {
      const remaining = prev.filter((c) => c.id !== channelId);
      if (activeChannelId === channelId) {
        setActiveChannelId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  // Leave Channel
  const handleLeaveChannel = async (channelId) => {
    if (!channelId || !currentCompanyId) return;

    await chatApiService.leaveChannel(channelId, currentCompanyId);

    // Remove from user's channels list and select another channel cleanly
    setChannels((prev) => {
      const remaining = prev.filter((c) => c.id !== channelId);
      if (activeChannelId === channelId) {
        setActiveChannelId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  // Refresh active channel details (e.g. member count)
  const handleRefreshChannel = async () => {
    if (!activeChannelId || !currentCompanyId) return;

    try {
      const fresh = await chatApiService.getChannel(activeChannelId, currentCompanyId);
      if (fresh) {
        setChannels((prev) =>
          prev.map((c) => (c.id === activeChannelId ? { ...c, ...fresh } : c))
        );
      }
    } catch (err) {
      console.error('Failed to refresh channel metadata:', err);
    }
  };

  // Handle members added
  const handleMembersAdded = async (count) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === activeChannelId
          ? { ...c, memberCount: (c.memberCount || 1) + count }
          : c
      )
    );
    await handleRefreshChannel();
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden bg-white dark:bg-[#161922] rounded-xl border border-zinc-200 dark:border-[#2A2F3D] shadow-xs m-2 sm:m-4">
      {/* Channels Sidebar */}
      <ChannelSidebar
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
        onOpenCreateModal={() => setIsCreateChannelOpen(true)}
        isConnected={isConnected}
        isLoading={isLoadingChannels}
      />

      {/* Main Chat Thread */}
      <ChatThread
        channel={activeChannel}
        messages={messages}
        currentUserId={currentUserId}
        onSendMessage={handleSendMessage}
        onOpenQuotationModal={() => setIsRequestQuoteOpen(true)}
        onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
        onOpenAddMembers={() => setIsAddMembersOpen(true)}
        onOpenManageMembers={() => setIsManageMembersOpen(true)}
        onOpenDeleteConfirm={() => setIsDeleteConfirmOpen(true)}
        onOpenLeaveConfirm={() => setIsLeaveConfirmOpen(true)}
        onUpdateStatus={handleUpdateStatus}
        isSending={isSending}
        isUpdatingStatus={isUpdatingStatus}
        isLoadingMessages={isLoadingMessages}
        isConnected={isConnected}
      />

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        onSubmit={handleCreateChannel}
        existingChannels={channels}
        companyId={currentCompanyId}
        currentUserId={currentUserId}
        onSelectExistingChannel={async (channelId, initialMsg) => {
          setActiveChannelId(channelId);
          setIsCreateChannelOpen(false);
          if (initialMsg && initialMsg.trim()) {
            await handleSendMessage({
              content: initialMsg.trim(),
              messageType: 'TEXT',
            });
          }
        }}
      />

      {/* Request Quotation Modal */}
      <RequestQuotationModal
        isOpen={isRequestQuoteOpen}
        onClose={() => setIsRequestQuoteOpen(false)}
        onSubmit={handleRequestQuotationSubmit}
        isSubmitting={isSending}
      />

      {/* Group Info & Settings Modal */}
      <GroupInfoModal
        isOpen={isGroupInfoOpen}
        channel={activeChannel}
        onClose={() => setIsGroupInfoOpen(false)}
        onUpdateChannel={handleUpdateChannel}
        isSubmitting={isUpdatingGroup}
      />

      {/* Add Company Users Modal */}
      <AddMembersModal
        isOpen={isAddMembersOpen}
        channel={activeChannel}
        companyId={currentCompanyId}
        currentUserId={currentUserId}
        onClose={() => setIsAddMembersOpen(false)}
        onMembersAdded={handleMembersAdded}
      />

      {/* Manage Members Modal */}
      <ManageMembersModal
        isOpen={isManageMembersOpen}
        channel={activeChannel}
        companyId={currentCompanyId}
        currentUserId={currentUserId}
        onClose={() => setIsManageMembersOpen(false)}
        onOpenAddMembers={() => setIsAddMembersOpen(true)}
        onMemberChanged={handleRefreshChannel}
        onLeftChannel={handleLeaveChannel}
      />

      {/* Delete Group Confirm Modal */}
      <DeleteGroupConfirmModal
        isOpen={isDeleteConfirmOpen}
        channel={activeChannel}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirmDelete={handleDeleteChannel}
      />

      {/* Leave Group Confirm Modal */}
      <LeaveGroupConfirmModal
        isOpen={isLeaveConfirmOpen}
        channel={activeChannel}
        onClose={() => setIsLeaveConfirmOpen(false)}
        onConfirmLeave={handleLeaveChannel}
      />
    </div>
  );
}
