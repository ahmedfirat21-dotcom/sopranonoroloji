// ═══════════════════════════════════════════════════════
// SopranoChat — Lobi (Home Screen)
// Keşfet Sayfası ile Uyumlu Kart Stili (TrendingCard)
// ═══════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { Loca } from '../../constants/types';
import WalletVIPSheet from '../../components/WalletVIPSheet';
import CreateRoomSheet from '../../components/CreateRoomSheet';
import { getPublicRooms } from '../../services/api';
import { EmptyState } from '../../components/UXHelpers';
import AlertBanner from '../../components/AlertBanner';
import { hapticError } from '../../utils/haptics';
import { createRoomEvents } from '../../utils/createRoomEvents';

const { width } = Dimensions.get('window');

// ═══════════════════════════════════════
//  SAHTE VERİLER (Dummy Data)
// ═══════════════════════════════════════
interface DummyUser {
  id: string;
  isim: string;
  avatarUrl: string | null;
  vipLevel: 'Standart' | 'VIP' | 'Elite';
}

interface DummyRoom {
  id: string;
  baslik: string;
  host: DummyUser;
  dinleyiciSayisi: number;
  maxKapasite: number;
  odaTuru: string;
  isLive: boolean;
  badge?: 'trend' | 'hot' | 'new' | 'standard';
}

const DUMMY_USERS: DummyUser[] = [
  { id: 'u1', isim: 'Ahmet Kaan',   avatarUrl: null, vipLevel: 'VIP'      },
  { id: 'u2', isim: 'Elif Deniz',   avatarUrl: null, vipLevel: 'Elite'    },
  { id: 'u3', isim: 'Burak Yılmaz', avatarUrl: null, vipLevel: 'Standart' },
  { id: 'u4', isim: 'Zeynep Aras',  avatarUrl: null, vipLevel: 'VIP'      },
  { id: 'u5', isim: 'Can Demir',    avatarUrl: null, vipLevel: 'Standart' },
  { id: 'u6', isim: 'Selin Kaya',   avatarUrl: null, vipLevel: 'Elite'    },
];

const DUMMY_ROOMS: DummyRoom[] = [
  { id: 'r1', baslik: "Ahmet'in Gece Locası",   host: DUMMY_USERS[0], dinleyiciSayisi: 5, maxKapasite: 8,  odaTuru: '🎵 Müzik',   isLive: true,  badge: 'trend' },
  { id: 'r2', baslik: "Elif ile Sohbet",         host: DUMMY_USERS[1], dinleyiciSayisi: 3, maxKapasite: 6,  odaTuru: '💬 Sohbet',   isLive: true,  badge: 'hot'   },
  { id: 'r3', baslik: "Burak'ın Oyun Odası",     host: DUMMY_USERS[2], dinleyiciSayisi: 7, maxKapasite: 12, odaTuru: '🎮 Oyun',     isLive: true,  badge: 'new'   },
  { id: 'r4', baslik: "VIP Kültür Kulübü",       host: DUMMY_USERS[3], dinleyiciSayisi: 2, maxKapasite: 4,  odaTuru: '📚 Kültür',   isLive: false, badge: 'standard' },
  { id: 'r5', baslik: "Gece Muhabbeti",           host: DUMMY_USERS[4], dinleyiciSayisi: 8, maxKapasite: 12, odaTuru: '🌙 Gece',     isLive: true,  badge: 'trend' },
  { id: 'r6', baslik: "Selin'in Yarışma Arenası", host: DUMMY_USERS[5], dinleyiciSayisi: 4, maxKapasite: 8,  odaTuru: '🏆 Yarışma',  isLive: true,  badge: 'hot'   },
];

// ═══════════════════════════════════════
//  Ses Dalgası (3 çubuk)
// ═══════════════════════════════════════
function SoundWave() {
  const b1 = useSharedValue(0.25);
  const b2 = useSharedValue(0.55);
  const b3 = useSharedValue(0.35);
  useEffect(() => {
    const c = { easing: Easing.inOut(Easing.ease) };
    b1.value = withRepeat(withSequence(withTiming(1, { duration: 380, ...c }), withTiming(0.2, { duration: 340, ...c })), -1, true);
    b2.value = withDelay(100, withRepeat(withSequence(withTiming(0.85, { duration: 360, ...c }), withTiming(0.3, { duration: 400, ...c })), -1, true));
    b3.value = withDelay(200, withRepeat(withSequence(withTiming(1, { duration: 320, ...c }), withTiming(0.15, { duration: 440, ...c })), -1, true));
  }, []);
  const s1 = useAnimatedStyle(() => ({ height: 16 * b1.value }));
  const s2 = useAnimatedStyle(() => ({ height: 16 * b2.value }));
  const s3 = useAnimatedStyle(() => ({ height: 16 * b3.value }));
  return (
    <View style={st.wave}>
      <Animated.View style={[st.waveBar, s1]} />
      <Animated.View style={[st.waveBar, s2]} />
      <Animated.View style={[st.waveBar, s3]} />
    </View>
  );
}

// ═══════════════════════════════════════
//  Loca Kartı (Keşfet TrendingCard Stili)
// ═══════════════════════════════════════
const BADGE_CFG: Record<string, { label: string; colors: [string, string] }> = {
  trend:    { label: '🔥 Trend', colors: [COLORS.goldMetallic, COLORS.goldLight] },
  hot:      { label: '⚡ Hot',   colors: ['#E05252', '#FF7070'] },
  new:      { label: '✨ Yeni',  colors: [COLORS.primary, COLORS.primaryDark] },
  standard: { label: '◆ Aktif',  colors: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'] },
};

function LocaCard({ room, onPress }: { room: DummyRoom; onPress: () => void }) {
  const badge = BADGE_CFG[room.badge || 'standard'];
  const initials = room.host.isim.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isVip = room.host.vipLevel === 'VIP';

  return (
    <TouchableOpacity style={st.card} activeOpacity={0.8} onPress={onPress} delayPressIn={100}>
      {/* Keşfet ile aynı: Glassmorphism gradient arka plan */}
      <LinearGradient
        colors={['rgba(12,18,36,0.80)', 'rgba(8,14,28,0.92)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        pointerEvents="none"
      />
      {/* Glassmorphism border highlight */}
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'transparent']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Badge (sağ üst) */}
      <View style={st.badge}>
        <LinearGradient
          colors={badge.colors}
          style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <Text style={st.badgeText}>{badge.label}</Text>
      </View>

      {/* Avatar */}
      <View style={st.avatar}>
        <Text style={st.avatarText}>{initials}</Text>
      </View>

      {/* İsim + Host */}
      <Text style={st.cardName} numberOfLines={1}>{room.baslik}</Text>
      <Text style={st.cardHost} numberOfLines={1}>{room.host.isim}</Text>

      {/* Alt satır: Tür + Kapasite + Canlı */}
      <View style={st.cardBottom}>
        <View style={st.capRow}>
          <Ionicons name="people" size={11} color={COLORS.silverDark} />
          <Text style={st.capText}>{room.dinleyiciSayisi}/{room.maxKapasite}</Text>
        </View>
        {isVip && (
          <View style={st.capRow}>
            <Ionicons name="diamond" size={11} color={COLORS.primary} />
            <Text style={st.vipText}>VIP</Text>
          </View>
        )}
        {room.isLive && <SoundWave />}
      </View>
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════
//  HOME SCREEN
// ════════════════════════════════════════════
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const { user } = useUser();

  const [walletVis,  setWalletVis]  = useState(false);
  const [createVis,  setCreateVis]  = useState(false);
  const [rooms,      setRooms]      = useState<DummyRoom[]>(DUMMY_ROOMS);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [apiError,   setApiError]   = useState('');

  // FAB event listener
  useEffect(() => {
    const unsub = createRoomEvents.subscribe(() => setCreateVis(true));
    return unsub;
  }, []);

  // Backend'den veri çek (yoksa dummy kalır)
  const loadRooms = useCallback(async () => {
    try {
      const apiRooms = await getPublicRooms();
      if (apiRooms.length > 0) {
        setRooms(apiRooms.map((r, i) => ({
          id: r.id,
          baslik: r.name,
          host: { id: 'api', isim: r.ownerDisplayName || 'Anonim', avatarUrl: r.ownerAvatarUrl || null, vipLevel: r.isPrivate ? 'VIP' as const : 'Standart' as const },
          dinleyiciSayisi: r.currentParticipants || 0,
          maxKapasite: r.maxCapacity || 10,
          odaTuru: r.tags?.[0] || '💬 Sohbet',
          isLive: true,
          badge: (['trend', 'hot', 'new', 'standard'] as const)[i % 4],
        })));
      }
    } catch { /* dummy'den devam */ }
  }, []);

  useEffect(() => { loadRooms(); }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  }, [loadRooms]);

  // Keşfet ile aynı: staggered 2 sütunlu grid
  const leftCards  = useMemo(() => rooms.filter((_, i) => i % 2 === 0), [rooms]);
  const rightCards = useMemo(() => rooms.filter((_, i) => i % 2 !== 0), [rooms]);

  return (
    <View style={st.container}>
      {/* ── Keşfet ile aynı zemin gradient ── */}
      <LinearGradient
        colors={isDark ? [COLORS.deepNavy, '#040810', COLORS.deepNavy] : ['#F2F2F7', '#EEEDF5', '#F2F2F7']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ═══ Scrollable Content ═══ */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.deepNavy}
          />
        }
      >
        {/* Section Title */}
        <View style={st.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={{ width: 3, height: 18, borderRadius: 2 }}
            />
            <Text style={st.sectionTitle}>Aktif Localar</Text>
          </View>
          <Text style={st.sectionSub}>Şu an yayında olan mekanlar</Text>
        </View>

        {/* Keşfet ile aynı staggered grid */}
        {rooms.length === 0 ? (
          <EmptyState
            icon="home-outline"
            title="Henüz aktif loca yok"
            subtitle="İlk locayı sen kur, sahneyi al!"
          />
        ) : (
          <View style={st.gridContainer}>
            <View style={st.gridColumn}>
              {leftCards.map(room => (
                <LocaCard
                  key={room.id}
                  room={room}
                  onPress={() => router.push({ pathname: '/room', params: { id: room.id } })}
                />
              ))}
            </View>
            <View style={[st.gridColumn, { marginTop: SPACING.xl }]}>
              {rightCards.map(room => (
                <LocaCard
                  key={room.id}
                  room={room}
                  onPress={() => router.push({ pathname: '/room', params: { id: room.id } })}
                />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ═══ Glassmorphism Header (Keşfet'teki gibi üstten blur) ═══ */}
      <View style={[st.headerWrapper, { paddingTop: insets.top + 8 }]}>
        <BlurView intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        {/* Yarı saydam koyu katman (blur desteği olmayan cihazlar için fallback) */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18, 18, 20, 0.8)' }]} />
        {/* Alt sınır ince ışık çizgisi */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <View style={st.headerContent}>
          {/* Sol: Avatar + Logo */}
          <View style={st.headerLeft}>
            <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.8}>
              <View style={st.headerAvatarWrap}>
                <View style={st.headerAvatar}>
                  {user?.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={st.headerAvatarImg} />
                  ) : (
                    <Text style={st.headerAvatarText}>
                      {(user?.displayName || 'K').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  )}
                </View>
                {/* Online yeşil nokta */}
                <View style={st.onlineDot} />
              </View>
            </TouchableOpacity>
            <Image
              source={require('../../assets/images/logo.png')}
              style={st.logo}
              resizeMode="contain"
            />
          </View>

          {/* Sağ: Arama + Bildirim */}
          <View style={st.headerRight}>
            <TouchableOpacity style={st.iconBtn} onPress={() => {}} activeOpacity={0.7}>
              <Ionicons name="search-outline" size={20} color={COLORS.silverDark} />
            </TouchableOpacity>
            <TouchableOpacity style={st.iconBtn} onPress={() => router.push('/notifications')} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.silverDark} />
              <View style={st.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={st.iconBtn} onPress={() => setWalletVis(true)} activeOpacity={0.7}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.goldMetallic} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ═══ Modals ═══ */}
      <WalletVIPSheet visible={walletVis} onClose={() => setWalletVis(false)} />
      <CreateRoomSheet
        visible={createVis}
        onClose={() => setCreateVis(false)}
        onRoomCreated={loadRooms}
      />
      <AlertBanner
        visible={!!apiError}
        message={apiError}
        type="warning"
        actionLabel="Tekrar Dene"
        onAction={() => { setApiError(''); loadRooms(); }}
        onHide={() => setApiError('')}
      />
    </View>
  );
}

// ════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deepNavy },

  /* Scroll */
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 120,
  },

  /* Header (Keşfet stili blur) */
  headerWrapper: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    // Neon glow çerçeve
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  headerAvatarImg: { width: 38, height: 38, borderRadius: 19 },
  headerAvatarText: { color: COLORS.white, fontSize: 15, fontWeight: FONTS.bold as any },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2, borderColor: '#060B18',
  },
  logo: { height: 26, width: 120 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#060B18',
  },

  /* Section */
  sectionHeader: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  sectionTitle: { color: COLORS.white, fontSize: 20, fontWeight: FONTS.bold as any },
  sectionSub: { color: COLORS.silverDark, fontSize: 13, fontWeight: FONTS.regular as any, marginTop: 2 },

  /* Keşfet stili: Staggered Grid */
  gridContainer: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: 10 },
  gridColumn: { flex: 1, gap: 10 },

  /* Keşfet TrendingCard ile BİREBİR aynı kart stili */
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    padding: 14,
    gap: 8,
    position: 'relative' as const,
    ...(Platform.OS === 'android' ? {
      elevation: 4,
      shadowColor: '#000',
    } : {
      shadowColor: 'rgba(0,0,0,0.3)',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    }),
  },
  badge: {
    position: 'absolute' as const, top: 10, right: 10,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    overflow: 'hidden', zIndex: 2,
  },
  badgeText: { color: '#1A1F35', fontSize: 9, fontWeight: FONTS.bold as any, zIndex: 1 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.silver, fontSize: 14, fontWeight: FONTS.semibold as any },
  cardName: { color: COLORS.white, fontSize: 14, fontWeight: FONTS.semibold as any },
  cardHost: { color: COLORS.silverDark, fontSize: 11, fontWeight: FONTS.regular as any },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  capRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  capText: { color: COLORS.silverDark, fontSize: 11, fontWeight: FONTS.regular as any },
  vipText: { color: COLORS.primary, fontSize: 11, fontWeight: FONTS.bold as any },

  /* Ses Dalgası */
  wave: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14 },
  waveBar: { width: 3, borderRadius: 1.5, backgroundColor: COLORS.primary },
});
