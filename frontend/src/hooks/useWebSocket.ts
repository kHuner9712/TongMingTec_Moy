import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from 'react-query';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
const WS_NAMESPACE = '/ws';

interface UseWebSocketOptions {
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface WebSocketData {
  conversationId?: string;
  ticketId?: string;
  [key: string]: unknown;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (event: string, callback: (data: WebSocketData) => void) => void;
  unsubscribe: (event: string, callback: (data: WebSocketData) => void) => void;
  emit: (event: string, data: WebSocketData) => void;
  subscribeConversation: (conversationId: string) => void;
  unsubscribeConversation: (conversationId: string) => void;
  subscribeTicket: (ticketId: string) => void;
  unsubscribeTicket: (ticketId: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { token, onConnect, onDisconnect, onError } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(`${WS_URL}${WS_NAMESPACE}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      onConnect?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      onError?.(error);
    });

    socket.on('connected', (data) => {
      console.log('WebSocket connected:', data);
    });

    socket.on('conversation.message.created', (message) => {
      queryClient.invalidateQueries(['messages', message.conversationId]);
      queryClient.invalidateQueries(['conversations']);
    });

    socket.on('conversation.status.changed', (data) => {
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['conversation', data.conversationId]);
    });

    socket.on('ticket.created', () => {
      queryClient.invalidateQueries(['tickets']);
    });

    socket.on('ticket.status.changed', (data) => {
      queryClient.invalidateQueries(['tickets']);
      queryClient.invalidateQueries(['ticket', data.ticketId]);
    });

    socket.on('notification.created', () => {
      queryClient.invalidateQueries(['notifications']);
    });

    socket.on('ai.task.status.changed', () => {
      queryClient.invalidateQueries(['ai-tasks']);
    });

    socket.on('opportunity.stage.changed', () => {
      queryClient.invalidateQueries(['opportunities']);
      queryClient.invalidateQueries(['opportunity']);
      queryClient.invalidateQueries(['opportunity-summary']);
    });

    socket.on('opportunity.result.changed', () => {
      queryClient.invalidateQueries(['opportunities']);
      queryClient.invalidateQueries(['opportunity']);
      queryClient.invalidateQueries(['opportunity-summary']);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, onConnect, onDisconnect, onError, queryClient]);

  const subscribe = useCallback((event: string, callback: (data: WebSocketData) => void) => {
    socketRef.current?.on(event, callback);
  }, []);

  const unsubscribe = useCallback((event: string, callback: (data: WebSocketData) => void) => {
    socketRef.current?.off(event, callback);
  }, []);

  const emit = useCallback((event: string, data: WebSocketData) => {
    socketRef.current?.emit(event, data);
  }, []);

  const subscribeConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('subscribe:conversation', conversationId);
  }, []);

  const unsubscribeConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('unsubscribe:conversation', conversationId);
  }, []);

  const subscribeTicket = useCallback((ticketId: string) => {
    socketRef.current?.emit('subscribe:ticket', ticketId);
  }, []);

  const unsubscribeTicket = useCallback((ticketId: string) => {
    socketRef.current?.emit('unsubscribe:ticket', ticketId);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    subscribe,
    unsubscribe,
    emit,
    subscribeConversation,
    unsubscribeConversation,
    subscribeTicket,
    unsubscribeTicket,
  };
}

export function useConversationWebSocket(conversationId: string | undefined, token: string) {
  const { socket, isConnected, subscribeConversation, unsubscribeConversation } = useWebSocket({
    token,
  });

  useEffect(() => {
    if (!conversationId || !isConnected) return;

    subscribeConversation(conversationId);

    return () => {
      unsubscribeConversation(conversationId);
    };
  }, [conversationId, isConnected, subscribeConversation, unsubscribeConversation]);

  return { socket, isConnected };
}

export function useTicketWebSocket(ticketId: string | undefined, token: string) {
  const { socket, isConnected, subscribeTicket, unsubscribeTicket } = useWebSocket({
    token,
  });

  useEffect(() => {
    if (!ticketId || !isConnected) return;

    subscribeTicket(ticketId);

    return () => {
      unsubscribeTicket(ticketId);
    };
  }, [ticketId, isConnected, subscribeTicket, unsubscribeTicket]);

  return { socket, isConnected };
}
