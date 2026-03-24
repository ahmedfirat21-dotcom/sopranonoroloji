/**
 * SopranoChat — Room.tsx
 * Canlı Oda Ekranı
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Easing,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';
import { useUser } from '../contexts/UserContext';
import useLiveKit from '../hooks/useLiveKit';
import GiftVaultSheet from '../components/GiftVaultSheet';
import LottieGiftOverlay from '../components/LottieGiftOverlay';

const { width: W, height: H } = Dimensions.get('window');

/* ────────────────────────────────────────────────
   SİMÜLASYON VERİSİ (LiveKit yokken önizleme)
   ──────────────────────────────────────────────── */
const MOCK_USERS = [
  { id: 'host', nick: 'DJ_Soprano', role: 'host', speaking: true, mic: true },
  { id: 'sp1', nick: 'AylaVIP', role: 'speaker', speaking: true, mic: true },
  { id: 'sp2', nick: 'Melek', role: 'speaker', speaking: false, mic: true },
  { id: 'sp3', nick: 'Emir', role: 'speaker', speaking: false, mic: true },
  { id: 'sp4', nick: 'Rana', role: 'speaker', speaking: false, mic: false },
];

const MOCK_AUDIENCE = Array.from({ length: 25 }, (_, i) => ({
  id: `au${i}`, nick: ['Lina', 'Kaan', 'Naz', 'Bora', 'Dilara', 'Yiğit', 'İpek', 'Ozan',
    'Ceren', 'Alper', 'Deniz', 'Merve', 'Tolga', 'Sude', 'Onur', 'Zeynep', 'Arda',
    'Pelin', 'Serkan', 'Gizem', 'Ege', 'Burcu', 'Mert', 'Aslı', 'Volkan'][i],
  role: 'listener', speaking: false, mic: false,
}));

const MOCK_CHAT = [
  { sender: 'Lina', text: 'Selam herkese! 🙌' },
  { sender: 'Kaan', text: 'Bu oda çok iyi ya' },
  { sender: 'AylaVIP', text: 'Teşekkürler 💎' },
  { sender: 'Deniz', text: 'Müzik harika 🎵' },
  { sender: 'Merve', text: 'DJ açsana şarkıyı!' },
  { sender: 'Bora', text: 'Selam millet 👋' },
  { sender: 'Dilara', text: 'Bu gece eğlenceli olacak' },
  { sender: 'Yiğit', text: 'Kameralar ne zaman açılıyor?' },
  { sender: 'İpek', text: 'Harika oda ❤️' },
  { sender: 'Ozan', text: 'Ses kalitesi çok iyi' },
  { sender: 'Ceren', text: 'Hediye gelsin 💫' },
  { sender: 'Alper', text: 'O şarkıyı tekrar çal!' },
  { sender: 'Naz', text: 'Ben de sahnedeyim mi?' },
];

/* ────────────────────────────────────────────────
   KONUŞMA ANİMASYONU — SpeakingRipple
   Ses dalgasını yansıtan saydam halka
   ──────────────────────────────────────────────── */
function SpeakingRipple({ diameter }: { diameter: number }) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (v: Animated.Value, del: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(del),
        Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]));
    anim(ring1, 0).start();
    anim(ring2, 600).start();
  }, []);

  const makeStyle = (v: Animated.Value) => ({
    position: 'absolute' as const,
    width: diameter, height: diameter, borderRadius: diameter / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(92,225,230,0.55)',
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
  });

  return (
    <>
      <Animated.View style={makeStyle(ring1)} />
      <Animated.View style={makeStyle(ring2)} />
    </>
  );
}

/* ────────────────────────────────────────────────
   KOLTUK KARTI — glassmorphism + iç gölge
   ──────────────────────────────────────────────── */
function SeatCard({ nick, role, speaking, mic, size, onPress }: {
  nick: string; role: string; speaking: boolean; mic: boolean;
  size: number; onPress?: () => void;
}) {
  const initials = nick.slice(0, 2).toUpperCase();
  const isHost = role === 'host';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={{ alignItems: 'center', marginHorizontal: 6, marginBottom: 8 }}
    >
      {/* Avatar container */}
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {speaking && <SpeakingRipple diameter={size} />}

        {/* Glassmorphism zemin */}
        <View style={[
          sty.seatGlass,
          { width: size, height: size, borderRadius: size / 2 },
          isHost && { borderColor: COLORS.vipGold, borderWidth: 2 },
        ]}>
          <LinearGradient
            colors={['rgba(12,18,36,0.80)', 'rgba(8,14,28,0.92)']}
            style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          />
          {/* İç gölge efekti */}
          <View style={[sty.innerShadow, { borderRadius: size / 2 }]} />
          <Text style={[sty.seatInitials, { fontSize: size * 0.3 }]}>{initials}</Text>
        </View>
      </View>

      {/* İsim */}
      <Text style={sty.seatNick} numberOfLines={1}>{nick}</Text>

      {/* Rol rozeti */}
      {isHost && (
        <View style={sty.hostBadge}>
          <Ionicons name="star" size={8} color={COLORS.vipGold} />
        </View>
      )}

      {/* Mikrofon durumu */}
      <View style={[sty.micIndicator, mic ? sty.micOn : sty.micOff]}>
        <Ionicons name={mic ? 'mic' : 'mic-off'} size={7} color={mic ? '#fff' : 'rgba(255,255,255,0.35)'} />
      </View>
    </TouchableOpacity>
  );
}

/* ────────────────────────────────────────────────
   SOHBET MESAJI BALONCUĞU — saydam koyu zemin
   ──────────────────────────────────────────────── */
function ChatBubble({ sender, text, isEntry }: { sender: string; text: string; isEntry?: boolean }) {
  return (
    <View style={sty.chatBubble}>
      {isEntry ? (
        <Text style={sty.entryText}>
          <Text style={{ color: COLORS.primary, fontWeight: '600' }}>{sender}</Text>
          {' katıldı'}
        </Text>
      ) : (
        <>
          <Text style={sty.chatSender}>{sender}</Text>
          <Text style={sty.chatBody}> {text}</Text>
        </>
      )}
    </View>
  );
}

/* ────────────────────────────────────────────────
   VIP GİRİŞ BANT EFEKTİ
   ──────────────────────────────────────────────── */
function VIPEntryBanner({ name, onDone }: { name: string; onDone: () => void }) {
  const slideY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, friction: 12, tension: 70, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(2200),
      Animated.parallel([
        Animated.timing(slideY, { toValue: -60, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[sty.vipBanner, { transform: [{ translateY: slideY }], opacity }]}>
      <LinearGradient colors={[COLORS.vipGoldGlow, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Ionicons name="diamond" size={14} color={COLORS.vipGold} />
      <Text style={sty.vipBannerText}>⭐ {name} odaya giriş yaptı!</Text>
    </Animated.View>
  );
}

/* ────────────────────────────────────────────────
   PROFİL KARTI — Host moderasyon paneli
   ──────────────────────────────────────────────── */
function ProfileCard({ nick, role, onClose, onMute, onKick, onRemoveFromStage }: {
  nick: string; role: string;
  onClose: () => void; onMute?: () => void; onKick?: () => void; onRemoveFromStage?: () => void;
}) {
  return (
    <View style={sty.profileOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      <View style={sty.profileCard}>
        <View style={sty.profileHeader}>
          <View style={[sty.profileAvatar, role === 'host' && { borderColor: COLORS.vipGold }]}>
            <Text style={sty.profileInitials}>{nick.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={sty.profileNick}>{nick}</Text>
            <Text style={sty.profileRole}>{role === 'host' ? '👑 Oda Sahibi' : role === 'speaker' ? '🎤 Konuşmacı' : '👂 Dinleyici'}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>
        <View style={sty.profileActions}>
          {onMute && (
            <TouchableOpacity style={sty.profileBtn} onPress={onMute}>
              <Ionicons name="volume-mute" size={16} color={COLORS.error} />
              <Text style={sty.profileBtnText}>Sustur</Text>
            </TouchableOpacity>
          )}
          {onRemoveFromStage && (
            <TouchableOpacity style={sty.profileBtn} onPress={onRemoveFromStage}>
              <Ionicons name="arrow-down-circle" size={16} color="#FBBF24" />
              <Text style={sty.profileBtnText}>İndir</Text>
            </TouchableOpacity>
          )}
          {onKick && (
            <TouchableOpacity style={[sty.profileBtn, { borderColor: 'rgba(239,68,68,0.2)' }]} onPress={onKick}>
              <Ionicons name="exit" size={16} color={COLORS.error} />
              <Text style={[sty.profileBtnText, { color: COLORS.error }]}>Çıkar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════
   ANA EKRAN
   ════════════════════════════════════════════════ */
export default function RoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const roomName = title || 'Loca';

  // LiveKit
  const lk = useLiveKit({
    roomSlug: id || 'default-room',
    enabled: true,
    userId: user?.id || user?.username,
    displayName: user?.displayName,
    role: 'owner',
  });

  // Durum
  const [chatInput, setChatInput] = useState('');
  const [chatFocused, setChatFocused] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [giftAnim, setGiftAnim] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [vipEntry, setVipEntry] = useState<string | null>(null);

  // Simülasyon mu gerçek mi?
  const isLive = lk.participants.length > 1;
  const stageUsers = isLive
    ? lk.participants.filter(p => p.audioEnabled || p.isSpeaking).map(p => ({
      id: p.identity, nick: p.name, role: p.isLocal ? 'host' : 'speaker',
      speaking: p.isSpeaking, mic: p.audioEnabled,
    }))
    : MOCK_USERS;

  const audienceUsers = isLive
    ? lk.participants.filter(p => !p.audioEnabled && !p.isSpeaking).map(p => ({
      id: p.identity, nick: p.name, role: 'listener', speaking: false, mic: false,
    }))
    : MOCK_AUDIENCE;

  const chatList = isLive
    ? lk.chatMessages.map(m => ({ sender: m.senderName, text: m.text }))
    : MOCK_CHAT;

  const viewerCount = stageUsers.length + audienceUsers.length;

  // Dinamik mesaj limiti — oda büyüklüğüne göre
  const getMessageLimit = (count: number) => {
    if (count < 10) return 20;
    if (count < 30) return 40;
    if (count < 100) return 80;
    return 150;
  };
  const msgLimit = getMessageLimit(viewerCount);
  const visibleChat = chatList.slice(-msgLimit);

  // Giriş animasyonu
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const handleClose = useCallback(() => {
    Animated.timing(fadeIn, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => router.back());
  }, []);

  const handleSend = useCallback(async () => {
    if (!chatInput.trim()) return;
    await lk.sendMessage(chatInput.trim());
    setChatInput('');
  }, [chatInput, lk]);

  return (
    <Animated.View style={[sty.root, { opacity: fadeIn }]}>
      <StatusBar hidden />
      <LinearGradient colors={[COLORS.deepNavy, '#040810', COLORS.deepNavy]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />

      {/* ═══ ÜST BİLGİ ÇUBUĞU (Header) ═══ */}
      <View style={[sty.header, { paddingTop: Math.max(insets.top, 12) + 2 }]}>
        {/* Sol: Host avatarı + oda adı */}
        <View style={sty.headerL}>
          <View style={sty.headerHostAvatar}>
            <Text style={sty.headerHostInitials}>
              {(user?.displayName || roomName).slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={sty.headerRoom} numberOfLines={1}>{roomName}</Text>
            <Text style={sty.headerStatus}>
              {lk.connectionState === 'connected' ? '🟢 Canlı' : lk.connectionState === 'connecting' ? '🟡 Bağlanıyor' : '🔴 Çevrimdışı'}
            </Text>
          </View>
        </View>

        {/* Sağ: İzleyici sayısı + paylaş + kapat */}
        <View style={sty.headerR}>
          <View style={sty.viewerPill}>
            <Ionicons name="people" size={12} color={COLORS.primary} />
            <Text style={sty.viewerCount}>{viewerCount}</Text>
          </View>
          <TouchableOpacity style={sty.headerIcon}>
            <Ionicons name="share-outline" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <TouchableOpacity style={sty.headerIcon} onPress={handleClose}>
            <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ SAHNE (Speakers) — glassmorphism koltuklar ═══ */}
      <View style={sty.stage}>
        <View style={sty.stageGrid}>
          {stageUsers.map(u => (
            <SeatCard
              key={u.id}
              nick={u.nick}
              role={u.role}
              speaking={u.speaking}
              mic={u.mic}
              size={62}
              onPress={() => setSelectedUser(u)}
            />
          ))}
        </View>
      </View>

      {/* ═══ DİNLEYİCİLER ═══ */}
      {audienceUsers.length > 0 && (
        <View style={sty.audience}>
          <Text style={sty.audienceLabel}>Dinleyiciler · {audienceUsers.length}</Text>
          <ScrollView contentContainerStyle={sty.audienceGrid} showsVerticalScrollIndicator={false}>
            {audienceUsers.map(u => (
              <SeatCard
                key={u.id}
                nick={u.nick}
                role={u.role}
                speaking={u.speaking}
                mic={u.mic}
                size={36}
                onPress={() => setSelectedUser(u)}
              />
            ))}
          </ScrollView>
          {/* Dinleyici altında yumuşak fade-out */}
          <LinearGradient
            colors={['transparent', COLORS.deepNavy]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20 }}
            pointerEvents="none"
          />
        </View>
      )}

      {/* ═══ SOHBET AKIŞI — Instagram tarzı fade ═══ */}
      <View style={sty.chatArea}>
        {/* Üst fade — mesajlar yukarı doğru kaybolur */}
        <LinearGradient
          colors={[COLORS.deepNavy, 'transparent']}
          style={sty.chatFadeTop}
          pointerEvents="none"
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: 12 }}>
          {visibleChat.map((m, i) => (
            <ChatBubble key={i} sender={m.sender} text={m.text} />
          ))}
        </ScrollView>
        {/* Alt fade — mesajlar aşağı doğru kaybolur */}
        <LinearGradient
          colors={['transparent', COLORS.deepNavy]}
          style={sty.chatFadeBottom}
          pointerEvents="none"
        />
      </View>

      {/* ═══ VIP GİRİŞ BANTI ═══ */}
      {vipEntry && (
        <VIPEntryBanner name={vipEntry} onDone={() => setVipEntry(null)} />
      )}

      {/* ═══ FADE — chat → bottom bar geçişi ═══ */}
      <LinearGradient
        colors={['transparent', 'rgba(4,8,16,0.6)', 'rgba(4,8,16,0.94)']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 110 }}
        pointerEvents="none"
      />

      {/* ═══ PREMIUM DOCK ═══ */}
      <View style={[sty.dock, { paddingBottom: Math.max(insets.bottom, 6) }]}>
        {/* Glassmorphism bg */}
        <LinearGradient
          colors={['rgba(8,14,28,0.88)', 'rgba(4,8,18,0.96)']}
          style={StyleSheet.absoluteFill}
        />

        {/* ─── Input strip ─── */}
        <View style={sty.inputStrip}>
          <TouchableOpacity activeOpacity={0.7} style={sty.dockEmoji}>
            <Text style={{ fontSize: 13 }}>😊</Text>
          </TouchableOpacity>
          <TextInput
            style={sty.dockInput}
            placeholder="Mesaj yaz..."
            placeholderTextColor="rgba(255,255,255,0.15)"
            selectionColor={COLORS.primary}
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={handleSend}
            onFocus={() => setChatFocused(true)}
            onBlur={() => setChatFocused(false)}
            returnKeyType="send"
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={chatInput.trim() ? handleSend : undefined}
            style={[sty.dockSend, chatInput.trim() && sty.dockSendActive]}
          >
            <Ionicons
              name="paper-plane"
              size={12}
              color={chatInput.trim() ? '#fff' : 'rgba(255,255,255,0.12)'}
            />
          </TouchableOpacity>
        </View>

        {/* ─── Control strip ─── */}
        <View style={sty.controlStrip}>
          {/* Left utility */}
          <TouchableOpacity activeOpacity={0.7} style={sty.ghostBtn}>
            <Ionicons name="volume-medium" size={20} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={sty.ghostBtn}>
            <Ionicons name="hand-left" size={18} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>

          {/* Primary: Mic pill */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={sty.micPill}
            onPress={async () => {
              if (lk.isPublishing) await lk.unpublishAudio();
              else await lk.publishAudio();
            }}
          >
            <LinearGradient
              colors={lk.isPublishing
                ? ['rgba(92,225,230,0.25)', 'rgba(56,189,248,0.15)']
                : ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={sty.micPillGrad}
            >
              <Ionicons
                name={lk.isPublishing ? 'mic' : 'mic-off'}
                size={17}
                color={lk.isPublishing ? COLORS.primary : 'rgba(255,255,255,0.3)'}
              />
              <Text style={[
                sty.micPillLabel,
                lk.isPublishing && { color: COLORS.primary }
              ]}>
                {lk.isPublishing ? 'Canlı' : 'Sessiz'}
              </Text>
            </LinearGradient>
            {lk.isPublishing && <View style={sty.micPillGlow} />}
          </TouchableOpacity>

          {/* Right actions */}
          <TouchableOpacity activeOpacity={0.7} style={sty.ghostBtn}>
            <Ionicons name="videocam" size={20} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={sty.ghostBtn} onPress={() => setVaultOpen(true)}>
            <Ionicons name="diamond" size={17} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={sty.ghostBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.25)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ HOST PROFİL KARTI (overlay) ═══ */}
      {selectedUser && (
        <ProfileCard
          nick={selectedUser.nick}
          role={selectedUser.role}
          onClose={() => setSelectedUser(null)}
          onMute={() => { setSelectedUser(null); }}
          onRemoveFromStage={selectedUser.role === 'speaker' ? () => { setSelectedUser(null); } : undefined}
          onKick={selectedUser.role !== 'host' ? () => { setSelectedUser(null); } : undefined}
        />
      )}

      {/* ═══ HEDİYE ÖRTÜLERİ ═══ */}
      <GiftVaultSheet visible={vaultOpen} onClose={() => setVaultOpen(false)} onPlayAnimation={id => setGiftAnim(id)} />
      <LottieGiftOverlay giftId={giftAnim} onFinish={() => setGiftAnim(null)} />
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════
   STİLLER
   ════════════════════════════════════════════════ */
const sty = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.deepNavy },

  /* Header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 4, zIndex: 20,
  },
  headerL: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerHostAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1.5, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  headerHostInitials: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  headerRoom: { color: COLORS.white, fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  headerStatus: { color: COLORS.silverDark, fontSize: 9, marginTop: 1 },
  headerR: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  viewerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(92,225,230,0.06)', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 0.5, borderColor: 'rgba(92,225,230,0.15)',
  },
  viewerCount: { color: COLORS.primary, fontSize: 10, fontWeight: '600' },
  headerIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Stage */
  stage: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  stageGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 2,
  },

  /* Seat */
  seatGlass: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
    borderColor: 'rgba(0,0,0,0.2)',
    opacity: 0.4,
  },
  seatInitials: { color: COLORS.silver, fontWeight: '700', letterSpacing: 0.5 },
  seatNick: { color: COLORS.silverDark, fontSize: 10, fontWeight: '500', marginTop: 3, maxWidth: 60, textAlign: 'center' },
  hostBadge: {
    position: 'absolute', top: -1, right: -1,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 0.5, borderColor: COLORS.vipGold,
    alignItems: 'center', justifyContent: 'center',
  },
  micIndicator: {
    position: 'absolute', bottom: 12, right: 0,
    width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5,
  },
  micOn: { backgroundColor: 'rgba(92,225,230,0.18)', borderColor: 'rgba(92,225,230,0.5)' },
  micOff: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },

  /* Audience */
  audience: { maxHeight: H * 0.18, paddingHorizontal: 12, marginBottom: 0 },
  audienceLabel: {
    color: COLORS.silverDark, fontSize: 10, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, marginLeft: 4,
  },
  audienceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },

  /* Chat */
  chatArea: {
    flex: 1,
    marginHorizontal: 14,
    marginBottom: 90,
  },
  chatFadeTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 36, zIndex: 2,
  },
  chatFadeBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, zIndex: 2,
  },
  chatBubble: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: 4, alignSelf: 'flex-start',
  },
  chatSender: { color: COLORS.primary, fontSize: 11, fontWeight: '600' },
  chatBody: { color: COLORS.silver, fontSize: 11, flexShrink: 1 },
  entryText: { color: COLORS.silverDark, fontSize: 10, fontStyle: 'italic' },

  /* VIP Banner */
  vipBanner: {
    position: 'absolute', top: 70, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(212,175,55,0.08)', borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.25)',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6,
    zIndex: 100,
  },
  vipBannerText: { color: COLORS.vipGold, fontSize: 11, fontWeight: '600' },

  /* Premium Dock */
  dock: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 12, paddingTop: 8,
    overflow: 'hidden',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(92,225,230,0.06)',
  },
  inputStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    paddingLeft: 6, paddingRight: 2,
    marginBottom: 6,
  },
  dockEmoji: {
    marginRight: 4,
  },
  dockInput: {
    flex: 1, color: '#fff', fontSize: 12,
    paddingVertical: 0, paddingHorizontal: 2,
  },
  dockSend: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dockSendActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 }, elevation: 3,
  },
  controlStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 2,
  },
  ghostBtn: {
    width: 40, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 12,
  },
  giftBtn: {
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }, elevation: 4,
    borderRadius: 12, overflow: 'hidden',
  },
  giftBtnGrad: {
    width: 42, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 12,
  },
  micPill: {
    position: 'relative',
    marginHorizontal: 6,
  },
  micPillGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38, borderRadius: 19,
    paddingHorizontal: 14, gap: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(92,225,230,0.08)',
  },
  micPillLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11, fontWeight: '600',
    letterSpacing: 0.3,
  },
  micPillGlow: {
    position: 'absolute',
    top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(92,225,230,0.12)',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },

  /* Profile Card */
  profileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', zIndex: 200,
  },
  profileCard: {
    width: W * 0.82, backgroundColor: 'rgba(16,24,42,0.95)',
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  profileAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitials: { color: '#fff', fontSize: 16, fontWeight: '700' },
  profileNick: { color: '#fff', fontSize: 15, fontWeight: '700' },
  profileRole: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  profileActions: { flexDirection: 'row', gap: 8 },
  profileBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  profileBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
});