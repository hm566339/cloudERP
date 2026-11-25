import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const getFreshToken = () => {
  if (typeof document !== 'undefined') {
    // 1. Canonical cookie
    const match =
      document.cookie.match(/(^| )ACCESS_TOKEN=([^;]+)/) ||
      document.cookie.match(/(^| )auth_token=([^;]+)/) ||
      document.cookie.match(/(^| )access_token=([^;]+)/);
    if (match) return match[2];
  }
  if (typeof localStorage !== 'undefined') {
    return (
      localStorage.getItem('ACCESS_TOKEN') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      ''
    );
  }
  return '';
};

const resolveWsUrl = () => {
  // 1. Explicit environment variable if configured
  const envUrl = import.meta.env?.VITE_COMMUNICATION_WS_URL;
  if (envUrl) {
    // If absolute URL pointing to localhost while running on non-localhost domain, disregard baked localhost
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && envUrl.includes('localhost')) {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      return `${protocol}//${window.location.host}/ws-chat`;
    }
    // If relative path like '/ws-chat', resolve against current origin
    if (envUrl.startsWith('/') && typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      return `${protocol}//${window.location.host}${envUrl}`;
    }
    return envUrl;
  }

  // 2. Gateway/host routed WebSocket endpoint (/ws-chat)
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.host}/ws-chat`;
  }
  return 'http://localhost:8080/ws-chat';
};

/**
 * Custom React hook for managing STOMP over SockJS connection and channel subscriptions.
 *
 * @param {Object} options
 * @param {string} options.companyId - Current company UUID
 * @param {string} [options.userId] - Current user UUID
 * @param {string} [options.userName] - Current user name
 * @param {string} options.activeChannelId - Currently selected channel UUID
 * @param {Function} options.onMessageReceived - Callback when a message arrives on active channel topic
 * @param {Function} options.onNotificationReceived - Callback for targeted user notifications
 */
export function useChatWebSocket({
  companyId,
  userId,
  userName,
  activeChannelId,
  onMessageReceived,
  onNotificationReceived,
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const clientRef = useRef(null);
  const channelSubRef = useRef(null);
  const notifSubRef = useRef(null);

  // Keep callback refs fresh
  const onMessageRef = useRef(onMessageReceived);
  onMessageRef.current = onMessageReceived;
  const onNotifRef = useRef(onNotificationReceived);
  onNotifRef.current = onNotificationReceived;

  // Initialize and maintain STOMP Client
  useEffect(() => {
    if (!companyId) return;

    const token = getFreshToken();
    const wsUrl = resolveWsUrl();

    const connectHeaders = {
      'X-Company-Id': companyId,
    };
    if (token) {
      connectHeaders['Authorization'] = `Bearer ${token}`;
    }
    if (userId) {
      connectHeaders['X-User-Id'] = userId;
    }
    if (userName) {
      connectHeaders['X-User-Name'] = userName;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        setConnectionError(null);

        // Subscribe to targeted user alerts
        if (client.connected) {
          try {
            notifSubRef.current = client.subscribe('/user/queue/notifications', (frame) => {
              try {
                const payload = JSON.parse(frame.body);
                if (onNotifRef.current) onNotifRef.current(payload);
              } catch (e) {
                console.error('Failed to parse STOMP notification:', e);
              }
            });
          } catch (e) {
            console.error('Failed to subscribe to /user/queue/notifications:', e);
          }
        }
      },
      onStompError: (frame) => {
        console.warn('STOMP broker reported error:', frame.headers?.['message'], frame.body);
        setConnectionError(frame.headers?.['message'] || 'STOMP connection error');
      },
      onWebSocketClose: () => {
        setIsConnected(false);
      },
      onWebSocketError: (err) => {
        console.warn('WebSocket transport error:', err);
        setConnectionError('WebSocket transport failure');
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (channelSubRef.current) {
        channelSubRef.current.unsubscribe();
        channelSubRef.current = null;
      }
      if (notifSubRef.current) {
        notifSubRef.current.unsubscribe();
        notifSubRef.current = null;
      }
      if (client.active) {
        client.deactivate();
      }
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [companyId, userId, userName]);

  // Handle active channel topic subscription
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !isConnected || !companyId || !activeChannelId) {
      return;
    }

    // Unsubscribe from previous channel
    if (channelSubRef.current) {
      channelSubRef.current.unsubscribe();
      channelSubRef.current = null;
    }

    const topic = `/topic/company.${companyId}.channel.${activeChannelId}`;

    try {
      channelSubRef.current = client.subscribe(topic, (frame) => {
        try {
          const message = JSON.parse(frame.body);
          if (onMessageRef.current) {
            onMessageRef.current(message);
          }
        } catch (e) {
          console.error('Failed to parse channel message:', e);
        }
      });
    } catch (err) {
      console.error(`Failed to subscribe to topic ${topic}:`, err);
    }

    return () => {
      if (channelSubRef.current) {
        channelSubRef.current.unsubscribe();
        channelSubRef.current = null;
      }
    };
  }, [isConnected, companyId, activeChannelId]);

  // Send message over STOMP
  const publishMessage = useCallback(
    (channelId, requestBody) => {
      const client = clientRef.current;
      if (!client || !client.connected) {
        return false;
      }
      try {
        client.publish({
          destination: `/app/chat.send.${channelId}`,
          body: JSON.stringify(requestBody),
        });
        return true;
      } catch (e) {
        console.error('Failed to publish message over STOMP:', e);
        return false;
      }
    },
    []
  );

  // Mark channel read over STOMP
  const markReadOverWs = useCallback(
    (channelId) => {
      const client = clientRef.current;
      if (!client || !client.connected) {
        return false;
      }
      try {
        client.publish({
          destination: `/app/chat.read.${channelId}`,
          body: JSON.stringify({}),
        });
        return true;
      } catch (e) {
        console.error('Failed to publish read receipt over STOMP:', e);
        return false;
      }
    },
    []
  );

  return {
    isConnected,
    connectionError,
    publishMessage,
    markReadOverWs,
  };
}

export default useChatWebSocket;
