// ═══════════════════════════════════════════════════════════
// SopranoChat Mobil2 — useRoomSocket Hook
// Socket.IO üzerinden gerçek zamanlı oda senkronizasyonu
// ═══════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ParticipantRole } from '../services/api';

const SOCKET_URL = 'https://api.sopranochat.com';

// ─── Types ──────────────────────────────────────────────
export interface RoomParticipant {
  userId: string;
  displayName: string;
  avatar: string;
  role: string;
  socketId: string;
  isMuted?: boolean;
  isGagged?: boolean;
  isSpeaking?: boolean;
  status?: string;
  gender?: string;
  platform?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  text: string;
  type?: string;
  timestamp: string;
  role?: string;
}

interface UseRoomSocketOptions {
  roomSlug: string | undefined;
  token: string | null;
  displayName?: string;
  avatar?: string;
  gender?: string;
  enabled?: boolean;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseRoomSocketReturn {
  connectionState: ConnectionState;
  participants: RoomParticipant[];
  chatMessages: ChatMessage[];
  error: string | null;
  localUserId: string | null;
  sendMessage: (text: string) => void;
  requestMic: () => void;
  releaseMic: () => void;
  sendGift: (giftId: string, receiverId: string, quantity?: number) => void;
  grantMic: (targetUserId: string) => void;
  denyMic: (targetUserId: string) => void;
  muteUser: (targetUserId: string) => void;
  unmuteUser: (targetUserId: string) => void;
  kickUser: (targetUserId: string) => void;
  banUser: (targetUserId: string) => void;
  forceStage: (targetUserId: string) => void;
  reportUser: (targetUserId: string, reason?: string) => void;
  blockUser: (targetUserId: string) => void;
  socket: Socket | null;
}

export default function useRoomSocket({
  roomSlug,
  token,
  displayName,
  avatar,
  gender,
  enabled = true,
}: UseRoomSocketOptions): UseRoomSocketReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ─── Connect ─────────────────────────────────────────────
  useEffect(() => {
    if (!roomSlug || !enabled) return;

    let socket: Socket | null = null;
    let cancelled = false;

    const connectSocket = async () => {
      // ─── Backend JWT al (Firebase token gateway'de çalışmaz) ───
      let backendToken = token;
      
      // Firebase RS256 token'ları "eyJhbGciOiJSUzI1" ile başlar
      // Backend JWT'ler "eyJhbGciOiJIUzI1" ile başlar  
      const isFirebaseToken = token?.startsWith('eyJhbGciOiJSUzI1');
      const hasNoToken = !token;

      if (isFirebaseToken || hasNoToken) {
        console.log('🔑 [Socket] Backend JWT alınıyor... (Firebase token:', isFirebaseToken, ')');
        try {
          const name = displayName || `Misafir_${Date.now().toString(36).slice(-4)}`;
          const res = await fetch(`https://api.sopranochat.com/auth/guest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: name, avatar: avatar || '', gender: gender || '' }),
          });
          if (res.ok) {
            const data = await res.json();
            backendToken = data.access_token || data.token;
            console.log('🔑 [Socket] Backend JWT alındı ✅, uzunluk:', backendToken?.length);
          } else {
            console.warn('🔑 [Socket] Backend JWT alınamadı:', res.status);
          }
        } catch (err: any) {
          console.warn('🔑 [Socket] JWT fetch hatası:', err.message);
        }
      }

      if (cancelled) return;

      console.log('🔌 [Socket] Bağlanılıyor...', SOCKET_URL, '| Oda:', roomSlug, '| Token:', backendToken ? `${backendToken.slice(0, 20)}...` : 'YOK ❌');
      setConnectionState('connecting');

      socket = io(SOCKET_URL, {
        auth: {
          token: backendToken || undefined,
          platform: 'mobile',
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
        timeout: 15000,
      });

      socketRef.current = socket;

      // ─── Connection Events ─────────────────────────────────
      socket.on('connect', () => {
        console.log('✅ [Socket] Bağlandı! ID:', socket!.id);
        setConnectionState('connected');
        setError(null);

        // Odaya katıl
        console.log('🚪 [Socket] Odaya katılıyor:', roomSlug);
        socket!.emit('room:join', {
          roomId: roomSlug,
          avatar: avatar || '',
          gender: gender || '',
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('🔴 [Socket] Bağlantı kesildi:', reason);
        setConnectionState('disconnected');
      });

      socket.on('connect_error', (err) => {
        console.warn('❌ [Socket] Bağlantı hatası:', err.message);
        setConnectionState('error');
        setError(`Bağlantı hatası: ${err.message}`);
      });

      // ─── Room Events ───────────────────────────────────────
      socket.on('room:participants', (data: { participants: RoomParticipant[] }) => {
        console.log('👥 [Socket] Katılımcı güncellemesi:', data.participants?.length, 'kişi');
        setParticipants(data.participants || []);
      });

      socket.on('room:joined', (data: any) => {
        console.log('🎉 [Socket] Odaya katıldı!', JSON.stringify(data).slice(0, 300));
        if (data?.userId) setLocalUserId(data.userId);
        if (data?.participants) setParticipants(data.participants);
      });

      socket.on('room:participant-joined', (data: any) => {
        console.log('➕ [Socket] Yeni katılımcı:', data?.displayName);
      });

      socket.on('room:participant-left', (data: any) => {
        console.log('➖ [Socket] Ayrıldı:', data?.userId);
      });

      socket.on('room:error', (data: any) => {
        console.warn('⚠️ [Socket] Oda hatası:', data?.message);
        setError(data?.message || 'Oda hatası');
      });

      // ─── Chat Events ───────────────────────────────────────
      socket.on('chat:newMessage', (msg: any) => {
        console.log('💬 [Socket] Mesaj:', msg?.displayName, '-', msg?.text?.slice(0, 30));
        const chatMsg: ChatMessage = {
          id: msg.id || `msg_${Date.now()}`,
          userId: msg.userId || '',
          displayName: msg.displayName || msg.senderName || 'Bilinmeyen',
          avatar: msg.avatar || '',
          text: msg.text || msg.content || '',
          type: msg.type || 'text',
          timestamp: msg.timestamp || new Date().toISOString(),
          role: msg.role,
        };
        setChatMessages(prev => [...prev.slice(-99), chatMsg]);
      });

      socket.on('chat:giftMessage', (msg: any) => {
        console.log('🎁 [Socket] Hediye:', msg?.senderName, '→', msg?.receiverName);
        const giftMsg: ChatMessage = {
          id: msg.id || `gift_${Date.now()}`,
          userId: '',
          displayName: msg.senderName || '',
          avatar: '',
          text: `${msg.giftEmoji} ${msg.senderName} → ${msg.receiverName}: ${msg.quantity}x ${msg.giftName}`,
          type: 'gift',
          timestamp: msg.timestamp || new Date().toISOString(),
        };
        setChatMessages(prev => [...prev.slice(-99), giftMsg]);
      });

      // ─── Mic Events ────────────────────────────────────────
      socket.on('room:speaker-update', (data: any) => {
        console.log('🎤 [Socket] Konuşmacı güncellendi:', data?.displayName || 'boş');
      });

      socket.on('room:mic-queue', (data: any) => {
        console.log('📋 [Socket] Mikrofon kuyruğu:', data?.queue?.length || 0, 'kişi');
      });

      socket.on('room:roleUpdate', (data: { userId: string; role: ParticipantRole }) => {
        console.log(`👑 [Socket] Rol güncellendi: ${data.userId} -> ${data.role}`);
        setParticipants(prev => prev.map(p =>
          p.userId === data.userId ? { ...p, role: data.role } : p
        ));
      });
    };

    connectSocket();

    // ─── Cleanup ───────────────────────────────────────────
    return () => {
      cancelled = true;
      console.log('🔌 [Socket] Bağlantı kapatılıyor...');
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
      setConnectionState('idle');
      setParticipants([]);
      setChatMessages([]);
      setError(null);
      setLocalUserId(null);
    };
  }, [roomSlug, token, enabled]);

  // ─── Actions ──────────────────────────────────────────────
  const sendMessage = useCallback((text: string) => {
    const socket = socketRef.current;
    if (!socket?.connected || !text.trim()) return;
    console.log('📤 [Socket] Mesaj gönderiliyor:', text.slice(0, 30));
    // Gateway chat:send bekliyor
    socket.emit('chat:send', { text: text.trim() });
  }, []);

  const requestMic = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    console.log('🎤 [Socket] Mikrofon isteniyor...');
    socket.emit('mic:request');
  }, []);

  const releaseMic = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    console.log('🎤 [Socket] Mikrofon bırakılıyor...');
    socket.emit('mic:release');
  }, []);

  const sendGift = useCallback((giftId: string, receiverId: string, quantity: number = 1) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    console.log(`🎁 [Socket] Hediye gönderiliyor: ${giftId} x${quantity} -> ${receiverId}`);
    socket.emit('gift:send', { giftId, receiverId, quantity });
  }, []);

  // ─── Moderator / Admin Actions ───────────────────────────
  const grantMic = useCallback((targetUserId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    console.log(`🎤 [Socket] Mikrofon yetkisi veriliyor -> ${targetUserId}`);
    socket.emit('mic:grant', { roomId: roomSlug, userId: targetUserId });
  }, [roomSlug]);

  const denyMic = useCallback((targetUserId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    console.log(`🎤 [Socket] Mikrofon yetkisi reddediliyor -> ${targetUserId}`);
    socket.emit('mic:deny', { roomId: roomSlug, userId: targetUserId });
  }, [roomSlug]);

  const muteUser = useCallback((targetUserId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('user:mute', { targetUserId, roomId: roomSlug });
  }, [roomSlug]);

  const unmuteUser = useCallback((targetUserId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('user:unmute', { targetUserId, roomId: roomSlug });
  }, [roomSlug]);

  const kickUser = useCallback((targetUserId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('user:kick', { targetUserId, roomId: roomSlug });
  }, [roomSlug]);

  const banUser = useCallback((targetUserId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('user:ban', { targetUserId, roomId: roomSlug });
  }, [roomSlug]);

  const forceStage = useCallback((targetUserId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('user:forceStage', { targetUserId, roomId: roomSlug });
  }, [roomSlug]);

  const reportUser = useCallback((targetUserId: string, reason?: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('user:report', { targetUserId, roomId: roomSlug, reason });
  }, [roomSlug]);

  const blockUser = useCallback((targetUserId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit('user:block', { targetUserId, roomId: roomSlug });
  }, [roomSlug]);
  return {
    connectionState,
    participants,
    chatMessages,
    error,
    localUserId,
    sendMessage,
    requestMic,
    releaseMic,
    sendGift,
    grantMic,
    denyMic,
    muteUser,
    unmuteUser,
    kickUser,
    banUser,
    forceStage,
    reportUser,
    blockUser,
    socket: socketRef.current,
  };
}
