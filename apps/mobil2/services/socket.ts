// ═══════════════════════════════════════════════════════
// SopranoChat Mobil2 — Socket Service
// Backend: WebSocket Gateway (chat.gateway.ts)
// Events: room:join, room:leave, chat:send, etc.
// ═══════════════════════════════════════════════════════

import { io, Socket } from 'socket.io-client';

const WS_URL = 'https://sopranochat.com';

let socket: Socket | null = null;

/**
 * Socket bağlantısını başlat veya mevcut bağlantıyı döndür
 */
export function connectSocket(token?: string): Socket {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    transports: ['websocket'],
    auth: token ? { token } : undefined,
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 5,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Bağlandı:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Bağlantı hatası:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Bağlantı kesildi:', reason);
  });

  return socket;
}

/**
 * Bağlantıyı kes
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Mevcut socket'i döndür (null olabilir)
 */
export function getSocket(): Socket | null {
  return socket;
}

// ─────────────────────────────────────────────────────
// Room Events
// ─────────────────────────────────────────────────────

export interface RoomParticipant {
  userId: string;
  displayName: string;
  avatar: string;
  role: string;
  socketId: string;
  isMuted?: boolean;
  isGagged?: boolean;
  gender?: string;
  platform?: string;
}

export interface ChatMessage {
  id: string;
  userId?: string;
  displayName: string;
  text: string;
  timestamp: string;
  type?: 'text' | 'gift' | 'system';
}

/**
 * Odaya katıl
 */
export function joinRoom(roomSlug: string, avatar?: string, gender?: string) {
  socket?.emit('room:join', {
    roomId: roomSlug,
    avatar,
    gender,
    platform: 'mobile',
  });
}

/**
 * Odadan ayrıl
 */
export function leaveRoom() {
  socket?.emit('room:leave');
}

/**
 * Mesaj gönder
 */
export function sendChatMessage(text: string) {
  socket?.emit('chat:send', { text });
}

/**
 * Room event listener'ları
 */
export function onParticipantsUpdate(
  callback: (participants: RoomParticipant[]) => void,
): () => void {
  const handler = (data: { participants: RoomParticipant[] }) => {
    callback(data.participants || []);
  };
  socket?.on('room:participants', handler);
  return () => { socket?.off('room:participants', handler); };
}

export function onChatMessage(
  callback: (message: ChatMessage) => void,
): () => void {
  const handler = (data: any) => {
    callback({
      id: data.id || `msg_${Date.now()}`,
      userId: data.userId,
      displayName: data.displayName || data.senderName || 'Anonim',
      text: data.text || data.message || '',
      timestamp: data.timestamp || new Date().toISOString(),
      type: data.type || 'text',
    });
  };
  socket?.on('chat:message', handler);
  return () => { socket?.off('chat:message', handler); };
}

export function onParticipantJoined(
  callback: (participant: RoomParticipant) => void,
): () => void {
  socket?.on('room:participant-joined', callback);
  return () => { socket?.off('room:participant-joined', callback); };
}

export function onParticipantLeft(
  callback: (data: { userId: string; socketId: string }) => void,
): () => void {
  socket?.on('room:participant-left', callback);
  return () => { socket?.off('room:participant-left', callback); };
}

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinRoom,
  leaveRoom,
  sendChatMessage,
  onParticipantsUpdate,
  onChatMessage,
  onParticipantJoined,
  onParticipantLeft,
};
