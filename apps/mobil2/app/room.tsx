import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Easing,
  PanResponder,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';
import { useUser } from '../contexts/UserContext';
import useLiveKit from '../hooks/useLiveKit';
import { DUMMY_LOCALAR } from '../constants/types';
import GiftVaultSheet from '../components/GiftVaultSheet';
import LottieGiftOverlay from '../components/LottieGiftOverlay';
import EmojiReactions from '../components/EmojiReactions';
import {
  connectSocket, disconnectSocket, joinRoom as socketJoinRoom,
  leaveRoom as socketLeaveRoom, sendChatMessage,
  onParticipantsUpdate, onChatMessage, onParticipantJoined, onParticipantLeft,
  type RoomParticipant, type ChatMessage,
} from '../services/socket';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────
// Dummy Chat Messages
// ─────────────────────────────────────────────────────
const DUMMY_MESSAGES = [
  { id: '1', user: 'Emre D.', text: 'Bu locadaki atmosfer bir başka 🔥', time: '21:24' },
  { id: '2', user: 'Selin A.', text: 'Abi vokal muhteşem', time: '21:25' },
  { id: '3', user: 'Arda K.', text: 'Sonraki şarkı ne olsun?', time: '21:26' },
  { id: '4', user: 'Mert Ö.', text: 'Chill vibes tonight ✨', time: '21:27' },
  { id: '5', user: 'Elif Y.', text: 'Kaan bey yine formsunuz', time: '21:28' },
];

// ─────────────────────────────────────────────────────
// Dummy Seat Data
// ─────────────────────────────────────────────────────
interface Seat {
  id: string;
  name: string;
  isSpeaking: boolean;
  isOwner?: boolean;
  role?: 'owner' | 'admin' | 'mod' | 'vip' | 'member' | 'guest';
  handRaised?: boolean;
  muted?: boolean;
  camOn?: boolean;
  avatar?: string;
}

const DUMMY_SEATS: Seat[] = [
  { id: 's1', name: 'Kaan Yıldız', isSpeaking: true, isOwner: true, role: 'owner', muted: false },
  { id: 's2', name: 'Emre Demir', isSpeaking: false, role: 'vip', muted: true },
  { id: 's3', name: 'Selin Arslan', isSpeaking: true, role: 'member', muted: false },
  { id: 's4', name: 'Arda Kaya', isSpeaking: false, role: 'guest', handRaised: true },
  { id: 's5', name: 'Mert Öztürk', isSpeaking: false, role: 'member', muted: true },
];

// Rol renkleri
const ROLE_COLORS: Record<string, string> = {
  owner: '#D4AF37', admin: '#3B82F6', mod: '#22C55E',
  vip: '#A855F7', member: '#94A3B8', guest: '#64748B',
};

// ─────────────────────────────────────────────────────
// Speaking Glow Animation
// ─────────────────────────────────────────────────────
function SpeakingGlow({ size }: { size: number }) {
  const glow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.speakingGlow,
        {
          width: size + 14,
          height: size + 14,
          borderRadius: (size + 14) / 2,
          opacity: glow,
        },
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────
// VIP Seat (Koltuk Yuvası)
// ─────────────────────────────────────────────────────
function VIPSeat({ seat, size = 60, onPress }: { seat: Seat; size?: number; onPress?: () => void }) {
  const initials = seat.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const roleColor = ROLE_COLORS[seat.role || 'guest'] || '#64748B';

  return (
    <TouchableOpacity style={styles.seatWrapper} activeOpacity={0.7} onPress={onPress}>
      {/* Speaking glow */}
      {seat.isSpeaking && <SpeakingGlow size={size} />}

      {/* Seat shell — glassmorphism inner shadow */}
      <View
        style={[
          styles.seatShell,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: seat.isOwner
              ? COLORS.vipGold
              : seat.isSpeaking
              ? COLORS.primary
              : COLORS.cardGlassBorder,
          },
        ]}
      >
        {/* Inner shadow gradient */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.15)']}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
        />
        <Text style={[styles.seatInitials, { fontSize: size * 0.32 }]}>
          {initials}
        </Text>
      </View>

      {/* Owner crown */}
      {seat.isOwner && (
        <View style={styles.ownerBadge}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.vipGold} />
        </View>
      )}

      {/* Name */}
      <Text style={styles.seatName} numberOfLines={1}>
        {seat.name.split(' ')[0]}
      </Text>

      {/* Hand raised badge */}
      {seat.handRaised && (
        <View style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFB800', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0B1222' }}>
          <Text style={{ fontSize: 10 }}>🖐️</Text>
        </View>
      )}

      {/* Muted badge */}
      {seat.muted && (
        <View style={{ position: 'absolute', bottom: 18, left: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0B1222' }}>
          <Ionicons name="mic-off" size={8} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────
// Chat Message Bubble
// ─────────────────────────────────────────────────────
function ChatBubble({
  user,
  text,
  opacity,
}: {
  user: string;
  text: string;
  opacity: number;
}) {
  return (
    <View style={[styles.chatBubble, { opacity }]}>
      <Text style={styles.chatUser}>{user}</Text>
      <Text style={styles.chatText}>{text}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Gift Button (Hediye Kasası — 3D glow)
// ─────────────────────────────────────────────────────
function GiftButton({ onPress }: { onPress?: () => void }) {
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.4,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.giftBtnWrapper}>
      <Animated.View style={[styles.giftGlow, { opacity: glow }]} />
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark, '#1a8a8e']}
          style={styles.giftBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="diamond-outline" size={22} color={COLORS.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ═════════════════════════════════════════════════════
// ROOM SCREEN
// ═════════════════════════════════════════════════════
export default function RoomScreen() {
  const router = useRouter();
  const { colors: C, isDark } = useTheme();
  const { user, token } = useUser();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const loca = DUMMY_LOCALAR.find((l) => l.id === id) || DUMMY_LOCALAR[0];
  const [vaultVisible, setVaultVisible] = useState(false);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<string | null>(null);

  // Socket state
  const [seats, setSeats] = useState<Seat[]>(DUMMY_SEATS);
  const [messages, setMessages] = useState(DUMMY_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Room kontrolleri
  const [handRaised, setHandRaised] = useState(false);
  const [micQueue, setMicQueue] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Seat | null>(null);
  const [showMicQueue, setShowMicQueue] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const isOwner = seats[0]?.id === 's1'; // TODO: backend'den gelecek

  // El kaldır/indir toggle
  const toggleHandRaise = () => {
    setHandRaised(!handRaised);
    if (!handRaised) {
      // Sıraya ekle
      setMicQueue(prev => [...prev, user?.id || 'me']);
    } else {
      setMicQueue(prev => prev.filter(id => id !== (user?.id || 'me')));
    }
  };

  // Kamera toggle
  const toggleCamera = () => setCamOn(!camOn);

  // Mute toggle
  const toggleMute = async () => {
    setIsMuted(!isMuted);
    if (liveKit.isPublishing) {
      await liveKit.setMicEnabled(isMuted);
    }
  };

  // Oda sahibi: Mikrofon ver (el kaldırana)
  const grantMic = (userId: string) => {
    setMicQueue(prev => prev.filter(id => id !== userId));
    setSeats(prev => prev.map(s =>
      s.id === userId ? { ...s, isSpeaking: true, handRaised: false, muted: false } : s
    ));
  };

  // Oda sahibi: Sustur
  const muteSeat = (seatId: string) => {
    setSeats(prev => prev.map(s =>
      s.id === seatId ? { ...s, muted: true, isSpeaking: false } : s
    ));
  };

  // Oda sahibi: At
  const kickSeat = (seatId: string) => {
    setSeats(prev => prev.filter(s => s.id !== seatId));
    setSelectedUser(null);
  };

  // LiveKit ses bağlantısı
  const liveKit = useLiveKit({
    roomSlug: loca.locaAdi.toLowerCase().replace(/\s+/g, '-'),
    enabled: true,
    isSocketConnected: isConnected,
    userId: user?.id || user?.username,
    displayName: user?.displayName,
  });

  // Socket bağlantısı ve oda katılımı
  useEffect(() => {
    try {
      const socket = connectSocket(token || undefined);

      socket.on('connect', () => {
        setIsConnected(true);
        // Odaya katıl
        socketJoinRoom(
          loca.locaAdi.toLowerCase().replace(/\s+/g, '-'),
          user?.avatarUrl,
          user?.gender,
        );
      });

      socket.on('disconnect', () => setIsConnected(false));

      // Katılımcı listesi güncellemesi
      const offParticipants = onParticipantsUpdate((participants) => {
        const mapped: Seat[] = participants.map((p, i) => ({
          id: p.socketId,
          name: p.displayName,
          isSpeaking: false,
          isOwner: i === 0,
        }));
        if (mapped.length > 0) setSeats(mapped);
      });

      // Canlı mesajlar
      const offChat = onChatMessage((msg) => {
        setMessages(prev => [
          ...prev.slice(-19),
          {
            id: msg.id,
            user: msg.displayName,
            text: msg.text,
            time: new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      });

      return () => {
        offParticipants();
        offChat();
        socketLeaveRoom();
      };
    } catch (e) {
      console.warn('[Room] Socket bağlantı hatası:', e);
    }
  }, []);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    // Kendi mesajımızı hemen göster (optimistic)
    setMessages(prev => [
      ...prev.slice(-19),
      {
        id: `local_${Date.now()}`,
        user: user?.displayName || 'Sen',
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
  };

  // Panel slide-up animation
  const panelY = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(panelY, {
        toValue: 0,
        friction: 16,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    socketLeaveRoom();
    Animated.parallel([
      Animated.timing(panelY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => router.back());
  };

  // ── Swipe-to-dismiss PanResponder ──
  const roomPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
    onPanResponderMove: (_, g) => {
      if (g.dy > 0) panelY.setValue(g.dy);
    },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 100 || g.vy > 0.5) {
        handleClose();
      } else {
        Animated.spring(panelY, { toValue: 0, friction: 14, tension: 45, useNativeDriver: true }).start();
      }
    },
  }), []);

  // Owner seat is first, VIP seats follow
  const ownerSeat = seats.find((s) => s.isOwner) || seats[0];
  const vipSeats = seats.filter((s) => !s.isOwner);

  return (
    <View style={styles.container}>
      {/* ─── Blur Overlay ─── */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}
      >
        <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={styles.darkOverlay} />
      </Animated.View>

      {/* ─── Floating Panel (95% height) ─── */}
      <Animated.View
        style={[
          styles.panel,
          { transform: [{ translateY: panelY }] },
        ]}
      >
        {/* Panel background */}
        <LinearGradient
          colors={isDark ? ['#0B1222', '#070D1A', '#050912'] : ['#F2F2F7', '#EEEDF5', '#F2F2F7']}
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}
        />

        {/* Subtle top glow line */}
        <LinearGradient
          colors={['transparent', COLORS.primaryGlow, 'transparent']}
          style={styles.panelTopGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        {/* Drag handle — swipe-to-dismiss (geniş dokunma alanı) */}
        <View
          {...roomPanResponder.panHandlers}
          style={{ paddingVertical: 12, alignItems: 'center' as const }}
        >
          <View style={styles.dragHandle} />
        </View>

        {/* ═══ AUTHORITY HEADER ═══ */}
        <View style={styles.header}>
          {/* Left: Owner + Loca info */}
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatarRow}>
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>
                  {loca.sahipAdi.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {loca.locaAdi}
                </Text>
                <View style={styles.tokenRow}>
                  <Ionicons name="diamond" size={12} color={COLORS.primary} />
                  <Text style={styles.tokenText}>2,847</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right: Actions */}
          <View style={styles.headerRight}>
            {/* Connection status + People count */}
            <View style={styles.headerBadge}>
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: isConnected ? '#4ADE80' : '#F87171',
                marginRight: 4,
              }} />
              <Ionicons name="people" size={14} color={COLORS.silverLight} />
              <Text style={styles.headerBadgeText}>
                {seats.length}
              </Text>
            </View>

            {/* Authority shop */}
            <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.6}>
              <Ionicons name="shield-half-outline" size={18} color={COLORS.silver} />
            </TouchableOpacity>

            {/* Minimize / Close */}
            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.6}
              onPress={handleClose}
            >
              <Ionicons name="chevron-down" size={20} color={COLORS.silver} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══ STAGE & SEATS ═══ */}
        <View style={styles.stageArea}>
          {/* Ambient glow behind stage */}
          <View style={styles.stageGlow} />

          {/* Owner — center, larger */}
          <View style={styles.ownerRow}>
            <VIPSeat seat={ownerSeat} size={72} onPress={() => setSelectedUser(ownerSeat)} />
          </View>

          {/* VIP Seats — symmetric row */}
          <View style={styles.seatsRow}>
            {vipSeats.map((seat) => (
              <VIPSeat key={seat.id} seat={seat} size={56} onPress={() => setSelectedUser(seat)} />
            ))}
          </View>
        </View>

        {/* ═══ CHAT FEED ═══ */}
        <View style={styles.chatArea}>
          {/* Fade mask at top */}
          <LinearGradient
            colors={['#0B1222', 'transparent']}
            style={styles.chatFadeMask}
            pointerEvents="none"
          />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chatScroll}
          >
            {DUMMY_MESSAGES.map((msg, index) => {
              const opacityVal = Math.min(1, 0.4 + (index / DUMMY_MESSAGES.length) * 0.6);
              return (
                <ChatBubble
                  key={msg.id}
                  user={msg.user}
                  text={msg.text}
                  opacity={opacityVal}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* ═══ MİCROFON SIRASI PANELİ ═══ */}
        {showMicQueue && (
          <View style={styles.micQueuePanel}>
            <View style={styles.micQueueHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Mikrofon Sırası</Text>
                <View style={{ backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#818CF8' }}>{micQueue.length}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowMicQueue(false)}>
                <Ionicons name="close" size={20} color={COLORS.silver} />
              </TouchableOpacity>
            </View>
            {micQueue.length === 0 ? (
              <Text style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', paddingVertical: 16, fontSize: 12 }}>Sırada kimse yok</Text>
            ) : (
              micQueue.map((uid, i) => (
                <View key={uid} style={styles.micQueueRow}>
                  <View style={styles.micQueueNum}><Text style={{ fontSize: 10, fontWeight: '800', color: i === 0 ? '#FBBF24' : '#999' }}>{i + 1}</Text></View>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 }}>{uid === (user?.id || 'me') ? 'Sen' : `Kullanıcı ${i + 1}`}</Text>
                  {i === 0 && <View style={{ backgroundColor: 'rgba(251,191,36,0.15)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}><Text style={{ fontSize: 9, fontWeight: '700', color: '#FBBF24' }}>Sıradaki</Text></View>}
                  {isOwner && (
                    <TouchableOpacity onPress={() => grantMic(uid)} style={styles.grantMicBtn}>
                      <Ionicons name="mic" size={12} color="#22C55E" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* ═══ KULLANICI PROFİL POPUP ═══ */}
        {selectedUser && (
          <View style={styles.profilePopup}>
            <View style={styles.profilePopupInner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={[styles.popupAvatar, { borderColor: ROLE_COLORS[selectedUser.role || 'guest'] }]}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                    {selectedUser.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{selectedUser.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ROLE_COLORS[selectedUser.role || 'guest'] }} />
                    <Text style={{ color: ROLE_COLORS[selectedUser.role || 'guest'], fontSize: 11, fontWeight: '600', textTransform: 'uppercase' as const }}>
                      {selectedUser.role || 'guest'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedUser(null)}>
                  <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              </View>
              {/* Mod aksiyonları (sadece owner görür) */}
              {isOwner && !selectedUser.isOwner && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TouchableOpacity style={[styles.modBtn, { backgroundColor: 'rgba(34,197,94,0.12)' }]} onPress={() => grantMic(selectedUser.id)}>
                    <Ionicons name="mic" size={14} color="#22C55E" />
                    <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600' }}>Mik Ver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modBtn, { backgroundColor: 'rgba(245,158,11,0.12)' }]} onPress={() => { muteSeat(selectedUser.id); setSelectedUser(null); }}>
                    <Ionicons name="mic-off" size={14} color="#F59E0B" />
                    <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '600' }}>Sustur</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modBtn, { backgroundColor: 'rgba(239,68,68,0.12)' }]} onPress={() => kickSeat(selectedUser.id)}>
                    <Ionicons name="exit-outline" size={14} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '600' }}>At</Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* Takip et & Hediye gönder (herkes görür) */}
              {!selectedUser.isOwner && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.modBtn, { backgroundColor: 'rgba(59,130,246,0.12)', flex: 1 }]}
                    onPress={() => {
                      Alert.alert('Takip', `${selectedUser.name} takip edildi!`);
                    }}
                  >
                    <Ionicons name="person-add" size={14} color="#3B82F6" />
                    <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '600' }}>Takip Et</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modBtn, { backgroundColor: 'rgba(168,85,247,0.12)', flex: 1 }]}
                    onPress={() => {
                      setSelectedUser(null);
                      setVaultVisible(true);
                    }}
                  >
                    <Ionicons name="gift" size={14} color="#A855F7" />
                    <Text style={{ color: '#A855F7', fontSize: 11, fontWeight: '600' }}>Hediye</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ═══ BOTTOM ACTION BAR — panel içinde, en altta ═══ */}
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 8) + 4 }]}>
          {/* Kontrol butonları satırı */}
          <View style={styles.controlRow}>
            <TouchableOpacity style={[styles.ctrlBtn, handRaised && { backgroundColor: 'rgba(255,184,0,0.2)', borderColor: 'rgba(255,184,0,0.35)' }]} onPress={toggleHandRaise}>
              <Ionicons name="hand-left" size={18} color={handRaised ? '#FFB800' : COLORS.silver} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ctrlBtn, camOn && { backgroundColor: 'rgba(139,92,246,0.2)', borderColor: 'rgba(139,92,246,0.35)' }]} onPress={toggleCamera}>
              <Ionicons name={camOn ? 'videocam' : 'videocam-off-outline'} size={18} color={camOn ? '#A855F7' : COLORS.silver} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mainMicBtn, liveKit.isPublishing ? styles.mainMicOn : styles.mainMicOff]}
              activeOpacity={0.7}
              onPress={async () => {
                if (liveKit.isPublishing) { await liveKit.unpublishAudio(); }
                else { await liveKit.publishAudio(); }
              }}
            >
              <Ionicons name={liveKit.isPublishing ? 'mic' : 'mic-off'} size={24} color={liveKit.isPublishing ? '#fff' : 'rgba(255,255,255,0.7)'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ctrlBtn, showMicQueue && { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.35)' }]} onPress={() => setShowMicQueue(!showMicQueue)}>
              <Ionicons name="list" size={18} color={showMicQueue ? '#6366F1' : COLORS.silver} />
              {micQueue.length > 0 && (
                <View style={styles.queueBadge}><Text style={{ fontSize: 8, color: '#fff', fontWeight: '800' }}>{micQueue.length}</Text></View>
              )}
            </TouchableOpacity>
            <GiftButton onPress={() => setVaultVisible(true)} />
          </View>

          {/* Emoji bar — kontrol ile input arasında */}
          <EmojiReactions
            showBar={showEmojiBar}
            onEmojiSent={(emoji) => { console.log('[Reaction]', emoji); setShowEmojiBar(false); }}
          />

          {/* Mesaj input satırı */}
          <View style={styles.actionBarInner}>
            <TouchableOpacity style={styles.emojiInlineBtn} activeOpacity={0.7} onPress={() => setShowEmojiBar(!showEmojiBar)}>
              <Text style={{ fontSize: 18 }}>😊</Text>
            </TouchableOpacity>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Locaya fısılda..."
                placeholderTextColor={COLORS.silverDark}
                selectionColor={COLORS.primary}
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
            </View>
            <TouchableOpacity style={styles.micBtn} activeOpacity={0.7} onPress={chatInput.trim() ? handleSendMessage : undefined}>
              <Ionicons name="send" size={18} color={chatInput.trim() ? COLORS.primary : COLORS.silverDark} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* ─── Gift Vault Sheet ─── */}
      <GiftVaultSheet
        visible={vaultVisible}
        onClose={() => setVaultVisible(false)}
        onPlayAnimation={(giftId) => setActiveGiftAnimation(giftId)}
      />

      {/* ─── Lottie Sinematik Overlay (Z-index TOP) ─── */}
      <LottieGiftOverlay
        giftId={activeGiftAnimation}
        onFinish={() => setActiveGiftAnimation(null)}
      />
    </View>
  );
}

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const PANEL_TOP = height * 0.05;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  /* ── Panel ── */
  panel: {
    position: 'absolute',
    top: PANEL_TOP,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  panelTopGlow: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1.5,
    zIndex: 2,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  headerLeft: {
    flex: 1,
  },
  headerAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.vipGold,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: COLORS.vipGold,
    fontSize: 14,
    fontWeight: FONTS.bold as any,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: FONTS.semibold as any,
    letterSpacing: 0.3,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tokenText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: FONTS.medium as any,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
  },
  headerBadgeText: {
    color: COLORS.silverLight,
    fontSize: 12,
    fontWeight: FONTS.medium as any,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Stage ── */
  stageArea: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    position: 'relative',
  },
  stageGlow: {
    position: 'absolute',
    top: 20,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: COLORS.primaryGlow,
    opacity: 0.08,
  },
  ownerRow: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  seatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    flexWrap: 'wrap',
  },

  /* ── Seat ── */
  seatWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  speakingGlow: {
    position: 'absolute',
    top: -7,
    left: -7,
    backgroundColor: COLORS.primaryGlow,
    zIndex: -1,
  },
  seatShell: {
    borderWidth: 1.5,
    backgroundColor: COLORS.cardGlassBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  seatInitials: {
    color: COLORS.white,
    fontWeight: FONTS.semibold as any,
  },
  ownerBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.deepNavy,
    borderWidth: 1,
    borderColor: COLORS.vipGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatName: {
    color: COLORS.silverLight,
    fontSize: 10,
    fontWeight: FONTS.medium as any,
    marginTop: 6,
    maxWidth: 76,
    textAlign: 'center',
  },

  /* ── Chat ── */
  chatArea: {
    flex: 1,
    position: 'relative',
    marginHorizontal: SPACING.md,
  },
  chatFadeMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 2,
  },
  chatScroll: {
    paddingTop: 40,
    paddingBottom: SPACING.sm,
  },
  chatBubble: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 6,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  chatUser: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: FONTS.semibold as any,
    marginBottom: 2,
  },
  chatText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: FONTS.regular as any,
    lineHeight: 18,
  },

  /* ── Action Bar ── */
  actionBar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  actionBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emojiInlineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  inputWrapper: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    // Inner shadow simulation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONTS.regular as any,
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Gift Button ── */
  giftBtnWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primaryGlow,
  },
  giftBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },

  /* ── Control Row ── */
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  ctrlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainMicBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  mainMicOn: {
    backgroundColor: '#FF2D78',
    borderColor: '#FF2D78',
    shadowColor: '#FF2D78',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  mainMicOff: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  queueBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0B1222',
  },

  /* ── Mic Queue Panel ── */
  micQueuePanel: {
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  micQueueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  micQueueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  micQueueNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantMicBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Profile Popup ── */
  profilePopup: {
    marginHorizontal: 14,
    marginBottom: 8,
  },
  profilePopupInner: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  popupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
});
