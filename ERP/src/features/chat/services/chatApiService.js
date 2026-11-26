import apiClient from '../../../api/common/client.js';
import { getActiveCompanyId } from '../../../api/common/roleCompanyContext.js';

/**
 * Chat and Quotation Request API Service for communication-service.
 * Routes through API Gateway via /api/communication/v1/chat/**
 */

const getHeaders = (companyId) => {
  const cid = companyId || getActiveCompanyId();
  const headers = {};
  if (cid) {
    headers['X-Company-Id'] = cid;
  }
  return { headers };
};

export const chatApiService = {
  /**
   * List all chat channels for current company & user with unread counts
   */
  async getChannels(companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.get('/api/communication/v1/chat/channels', config);
    return data;
  },

  /**
   * Get single channel details
   */
  async getChannel(channelId, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.get(`/api/communication/v1/chat/channels/${channelId}`, config);
    return data;
  },

  /**
   * Create a new chat channel
   */
  async createChannel(channelData, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.post('/api/communication/v1/chat/channels', channelData, config);
    return data;
  },

  /**
   * Get paginated message history for a channel
   */
  async getMessages(channelId, page = 0, size = 50, companyId) {
    const cid = companyId || getActiveCompanyId();
    const config = {
      ...getHeaders(cid),
      params: { page, size },
    };
    const { data } = await apiClient.get(`/api/communication/v1/chat/channels/${channelId}/messages`, config);
    return data;
  },

  /**
   * Send a chat message (TEXT, QUOTATION_REQUEST, etc.)
   */
  async sendMessage(channelId, messageData, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.post(`/api/communication/v1/chat/channels/${channelId}/messages`, messageData, config);
    return data;
  },

  /**
   * Mark a channel as read for the current user
   */
  async markChannelRead(channelId, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.post(`/api/communication/v1/chat/channels/${channelId}/read`, {}, config);
    return data;
  },

  /**
   * Update quotation action status (OPEN -> IN_PROGRESS -> COMPLETED)
   */
  async updateActionStatus(channelId, messageId, statusData, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.put(
      `/api/communication/v1/chat/channels/${channelId}/messages/${messageId}/status`,
      statusData,
      config
    );
    return data;
  },

  /**
   * Post external quotation event
   */
  async postQuotationEvent(eventData, companyId) {
    const cid = companyId || getActiveCompanyId();
    const config = getHeaders(cid);
    const payload = {
      companyId: cid,
      ...eventData,
    };
    const { data } = await apiClient.post('/api/communication/v1/chat/quotations/event', payload, config);
    return data;
  },

  /**
   * Update channel details (name, description)
   */
  async updateChannel(channelId, updateData, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.put(
      `/api/communication/v1/chat/channels/${channelId}`,
      updateData,
      config
    );
    return data;
  },

  /**
   * Delete channel (admin/creator only)
   */
  async deleteChannel(channelId, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.delete(
      `/api/communication/v1/chat/channels/${channelId}`,
      config
    );
    return data;
  },

  /**
   * Get all members of a channel
   */
  async getChannelMembers(channelId, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.get(
      `/api/communication/v1/chat/channels/${channelId}/members`,
      config
    );
    return data;
  },

  /**
   * Add members to a channel
   * @param {Object} memberData - { memberUserIds: string[], role: 'MEMBER' | 'ADMIN' }
   */
  async addChannelMembers(channelId, memberData, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.post(
      `/api/communication/v1/chat/channels/${channelId}/members`,
      memberData,
      config
    );
    return data;
  },

  /**
   * Remove a member from a channel (admin only, or redirects to leave if self)
   */
  async removeChannelMember(channelId, memberUserId, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.delete(
      `/api/communication/v1/chat/channels/${channelId}/members/${memberUserId}`,
      config
    );
    return data;
  },

  /**
   * Update member role in channel (ADMIN / MEMBER)
   * @param {Object} roleData - { role: 'ADMIN' | 'MEMBER' }
   */
  async updateMemberRole(channelId, memberUserId, roleData, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.put(
      `/api/communication/v1/chat/channels/${channelId}/members/${memberUserId}/role`,
      roleData,
      config
    );
    return data;
  },

  /**
   * Leave a channel (removes current user from channel)
   */
  async leaveChannel(channelId, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.post(
      `/api/communication/v1/chat/channels/${channelId}/leave`,
      {},
      config
    );
    return data;
  },

  /**
   * Get user notifications (paginated, newest first)
   */
  async getNotifications({ page = 0, size = 20, unreadOnly = false } = {}, companyId) {
    const cid = companyId || getActiveCompanyId();
    const config = {
      ...getHeaders(cid),
      params: { page, size, unreadOnly },
    };
    const { data } = await apiClient.get('/api/communication/v1/notifications', config);
    return data;
  },

  /**
   * Get total unread notifications count for current user
   */
  async getUnreadNotificationCount(companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.get('/api/communication/v1/notifications/unread-count', config);
    return data;
  },

  /**
   * Mark a single notification as read
   */
  async markNotificationAsRead(notificationId, companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.patch(
      `/api/communication/v1/notifications/${notificationId}/read`,
      {},
      config
    );
    return data;
  },

  /**
   * Mark all notifications for the current user as read
   */
  async markAllNotificationsAsRead(companyId) {
    const config = getHeaders(companyId);
    const { data } = await apiClient.patch(
      '/api/communication/v1/notifications/read-all',
      {},
      config
    );
    return data;
  },
};

export default chatApiService;
