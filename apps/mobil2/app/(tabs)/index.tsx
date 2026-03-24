import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import { Loca } from '../../constants/types';
import WalletVIPSheet from '../../components/WalletVIPSheet';
import CreateRoomSheet from '../../components/CreateRoomSheet';
import { getPublicRooms, type RoomData } from '../../services/api';
import { EmptyState, SkeletonList } from '../../components/UXHelpers';
import AlertBanner from '../../components/AlertBanner';
import { hapticLight, hapticMedium, hapticError } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');
const CARD_HORIZONTAL_GAP = 10;
const COLUMN_WIDTH = (width - SPACING.md * 2 - CARD_HORIZONTAL_GAP) / 2;

// ─────────────────────────────────────────────────────
// Pulsing Live Dot
// ─────────────────────────────────────────────────────
function LiveDot() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.liveBadge}>
      <Animated.View
        style={[
          styles.liveDotOuter,
          { opacity: pulse },
        ]}
      />
      <View style={styles.liveDotInner} />
      <Text style={styles.liveText}>Canlı</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Turu Badge
// ─────────────────────────────────────────────────────
function TuruBadge({ turu }: { turu: Loca['locaTuru'] }) {
  const config = {
    VIP: { colors: [COLORS.goldMetallic, COLORS.goldLight] as [string, string], text: '#1A1F35', border: COLORS.goldMetallic },
    Elite: { colors: ['#A855F7', '#7C3AED'] as [string, string], text: '#fff', border: '#A855F7' },
    Standart: { colors: ['rgba(92,225,230,0.15)', 'rgba(92,225,230,0.05)'] as [string, string], text: COLORS.primary, border: COLORS.primaryStroke },
  };
  const c = config[turu] || config.Standart;

  return (
    <View style={[styles.turuBadge, { borderColor: c.border }]}>
      <LinearGradient
        colors={c.colors}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text style={[styles.turuText, { color: c.text }]}>{turu}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Avatar (fotoğraf veya initials)
// ─────────────────────────────────────────────────────
function AvatarCircle({
  name,
  size = 36,
  borderColor,
  avatarUrl,
}: {
  name: string;
  size?: number;
  borderColor?: string;
  avatarUrl?: string;
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.avatarCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: borderColor || COLORS.primaryStroke,
        },
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size - 3, height: size - 3, borderRadius: (size - 3) / 2 }}
        />
      ) : (
        <Text
          style={[
            styles.avatarInitials,
            { fontSize: size * 0.36 },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Hero Carousel Card
// ─────────────────────────────────────────────────────
function HeroCard({ loca, onPress }: { loca: Loca; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.heroCard} delayPressIn={100}>
      {/* Inner shadow overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.15)', 'transparent', 'rgba(0,0,0,0.30)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* VIP badge */}
      <View style={styles.heroTopRow}>
        <TuruBadge turu={loca.locaTuru} />
        {loca.isLive && <LiveDot />}
      </View>

      <View style={styles.heroContent}>
        <AvatarCircle
          name={loca.sahipAdi}
          size={44}
          borderColor={
            loca.locaTuru === 'VIP' ? COLORS.vipGold : COLORS.primary
          }
        />
        <View style={styles.heroInfo}>
          <Text style={styles.heroLocaName} numberOfLines={1}>
            {loca.locaAdi}
          </Text>
          <Text style={styles.heroSahip} numberOfLines={1}>
            {loca.sahipAdi}
          </Text>
        </View>
      </View>

      {/* Bottom: capacity */}
      <View style={styles.heroBottom}>
        {!!loca.aciklama && (
          <Text style={styles.heroDesc} numberOfLines={1}>
            {loca.aciklama}
          </Text>
        )}
        <View style={styles.capacityRow}>
          <Ionicons
            name="people-outline"
            size={13}
            color={COLORS.silverLight}
          />
          <Text style={styles.capacityText}>
            {loca.anlikKapasite}/{loca.maksKapasite}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────
// Loca Card (Grid item)
// ─────────────────────────────────────────────────────
function LocaCard({ loca, isLeft, onPress }: { loca: Loca; isLeft: boolean; onPress: () => void }) {
  const cardHeight = isLeft ? 190 : 160;
  const glowColor =
    loca.locaTuru === 'VIP' ? COLORS.goldGlow
    : loca.locaTuru === 'Elite' ? 'rgba(168,85,247,0.12)'
    : COLORS.primaryGlow;

  return (
    <TouchableOpacity activeOpacity={0.7} style={{ marginBottom: CARD_HORIZONTAL_GAP }} onPress={onPress} delayPressIn={100}>
      <View style={[styles.locaCard, { height: cardHeight }]}>
        {/* Glassmorphism gradient border highlight */}
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.02)', 'transparent']}
          style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.md }]}
          pointerEvents="none"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Radial corner glow when Live */}
        {loca.isLive && (
          <View style={{
            position: 'absolute', top: -20, right: -20,
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: glowColor, opacity: 0.35,
          }} />
        )}

        {/* Inner depth gradient */}
        <LinearGradient
          colors={['rgba(15,22,42,0.0)', 'rgba(6,11,24,0.6)']}
          style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.md }]}
          pointerEvents="none"
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Top: Live dot + Turu */}
        <View style={styles.locaCardTop}>
          {loca.isLive ? <LiveDot /> : <View />}
          <TuruBadge turu={loca.locaTuru} />
        </View>

        {/* Middle: Avatar + Name */}
        <View style={styles.locaCardMiddle}>
          <AvatarCircle
            name={loca.sahipAdi}
            size={32}
            borderColor={
              loca.locaTuru === 'VIP'
                ? COLORS.vipGold
                : loca.locaTuru === 'Elite'
                ? COLORS.elitePurple
                : COLORS.primaryStroke
            }
            avatarUrl={loca.sahipAvatar || undefined}
          />
          <Text style={styles.locaCardName} numberOfLines={1}>
            {loca.locaAdi}
          </Text>
          <Text style={styles.locaCardSahip} numberOfLines={1}>
            {loca.sahipAdi}
          </Text>
        </View>

        {/* Bottom: Capacity */}
        <View style={styles.locaCardBottom}>
          <View style={styles.capacityRow}>
            <Ionicons name="people-outline" size={12} color={COLORS.silverLight} />
            <Text style={styles.capacityText}>
              {loca.anlikKapasite}/{loca.maksKapasite}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}



// ═════════════════════════════════════════════════════
// HOME SCREEN
// ═════════════════════════════════════════════════════
export default function HomeScreen() {
  const router = useRouter();
  const { colors: C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [walletVisible, setWalletVisible] = useState(false);
  const [createRoomVisible, setCreateRoomVisible] = useState(false);
  const [localar, setLocalar] = useState<Loca[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Entrance animation
  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Oda listesini yükle (Backend + fallback)
  const loadRooms = async () => {
    try {
      const rooms = await getPublicRooms();
      if (rooms.length > 0) {
        const mapped: Loca[] = rooms.map((r) => ({
          id: r.id,
          locaAdi: r.name,
          sahipAdi: r.ownerDisplayName || 'Anonim',
          sahipAvatar: r.ownerAvatarUrl || null,
          anlikKapasite: r.currentParticipants || 0,
          maksKapasite: r.maxCapacity || 10,
          locaTuru: r.isPrivate ? 'VIP' as const : 'Standart' as const,
          isLive: true,
          kategori: r.tags?.[0] || 'Genel',
          aciklama: r.description,
        }));
        setLocalar(mapped);
        console.log(`[Home] ${rooms.length} oda backend'den yüklendi`);
      }
    } catch (e: any) {
      console.warn('[Home] Oda verisi alınamadı:', e.message);
      setApiError('Sunucuya bağlanılamadı — çevrimdışı mod');
      hapticError();
    } finally {
      setIsLoading(false);
    }
  };

  // Backend'den gerçek oda verisi çek
  useEffect(() => {
    loadRooms();
  }, []);

  // Pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  // Split locas for staggered grid
  const vipLocalar = useMemo(
    () => localar.filter((l) => l.locaTuru === 'VIP' || l.locaTuru === 'Elite'),
    [localar]
  );
  const gridLocalar = useMemo(() => localar, [localar]);
  const leftColumn = useMemo(
    () => gridLocalar.filter((_, i) => i % 2 === 0),
    [gridLocalar]
  );
  const rightColumn = useMemo(
    () => gridLocalar.filter((_, i) => i % 2 !== 0),
    [gridLocalar]
  );

  // Top bar blur intensity based on scroll
  const topBarOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: C.deepNavy }]}>
      {/* ─── Background ─── */}
      <LinearGradient
        colors={isDark ? [COLORS.deepNavy, '#040810', COLORS.deepNavy] : ['#F2F2F7', '#EEEDF5', '#F2F2F7']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ─── Scrollable Content ─── */}
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeIn }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
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
        {/* ─── Öne Çıkanlar (VIP) — Coşullu render ─── */}
        {vipLocalar.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <LinearGradient
                  colors={[COLORS.goldMetallic, COLORS.goldLight]}
                  style={{ width: 3, height: 18, borderRadius: 2 }}
                />
                <Text style={[styles.sectionTitle, { color: C.white }]}>Öne Çıkanlar</Text>
              </View>
              <Text style={[styles.sectionSubtitle, { color: C.silverDark }]}>VIP & Elite Localar</Text>
            </View>

            <FlatList
              data={vipLocalar}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
              snapToInterval={width * 0.78 + SPACING.sm}
              decelerationRate="fast"
              renderItem={({ item }) => (
                <HeroCard
                  loca={item}
                  onPress={() => router.push({ pathname: '/room', params: { id: item.id } })}
                />
              )}
            />
          </>
        )}

        {/* ─── Grid Section Title ─── */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={{ width: 3, height: 18, borderRadius: 2 }}
            />
            <Text style={[styles.sectionTitle, { color: C.white }]}>Loca Vitrini</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: C.silverDark }]}>Tüm aktif localar</Text>
        </View>

        {/* ─── Staggered Grid ─── */}
        {isLoading ? (
          <SkeletonList count={4} />
        ) : gridLocalar.length === 0 ? (
          <EmptyState
            icon="home-outline"
            title="Henüz aktif loca yok"
            subtitle="İlk locayı sen kur, sahneyi al!"
          />
        ) : (
          <View style={styles.gridContainer}>
            {/* Left Column */}
            <View style={styles.gridColumn}>
              {leftColumn.map((loca) => (
                <LocaCard key={loca.id} loca={loca} isLeft onPress={() => router.push({ pathname: '/room', params: { id: loca.id } })} />
              ))}
            </View>
            {/* Right Column — offset for stagger effect */}
            <View style={[styles.gridColumn, { marginTop: SPACING.xl }]}>
              {rightColumn.map((loca) => (
                <LocaCard key={loca.id} loca={loca} isLeft={false} onPress={() => router.push({ pathname: '/room', params: { id: loca.id } })} />
              ))}
            </View>
          </View>
        )}

        {/* Bottom spacing for nav */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* ─── Luxury Top Bar (overlay) ─── */}
      <Animated.View
        style={[
          styles.topBar,
          { opacity: topBarOpacity },
        ]}
      >
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Top bar content (always visible) */}
      <View style={styles.topBarContent}>
        {/* Left: Avatar */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/profile')}>
          <AvatarCircle
            name={user?.displayName || 'K'}
            size={34}
            borderColor={COLORS.primary}
            avatarUrl={user?.avatarUrl}
          />
        </TouchableOpacity>

        {/* Center: Logo */}
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.topBarLogo}
          resizeMode="contain"
        />

        {/* Right: Icons */}
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.topBarIconBtn} activeOpacity={0.6} onPress={() => router.push('/notifications')}>
            <View>
              <Ionicons name="notifications-outline" size={21} color={COLORS.silver} />
              <View style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#0B1222' }} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarIconBtn} activeOpacity={0.6} onPress={() => router.push('/leaderboard')}>
            <Ionicons name="trophy-outline" size={21} color={COLORS.silver} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarIconBtn} activeOpacity={0.6} onPress={() => setWalletVisible(true)}>
            <View>
              {/* Altın parlama halkası */}
              <View style={{
                position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
                borderRadius: 14, backgroundColor: COLORS.goldGlow, opacity: 0.35,
              }} />
              <Ionicons
                name="wallet-outline"
                size={21}
                color={COLORS.goldMetallic}
              />
              <View style={styles.notifDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>



      {/* ─── Wallet & VIP Sheet ─── */}
      <WalletVIPSheet
        visible={walletVisible}
        onClose={() => setWalletVisible(false)}
      />

      {/* ─── Create Room Sheet ─── */}
      <CreateRoomSheet
        visible={createRoomVisible}
        onClose={() => setCreateRoomVisible(false)}
        onRoomCreated={loadRooms}
      />

      {/* ─── Alert Banner ─── */}
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

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const TOP_BAR_H = Platform.OS === 'android' ? 88 : 100;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepNavy,
  },

  /* ── Scroll ── */
  scrollContent: {
    paddingTop: TOP_BAR_H + SPACING.sm,
    paddingBottom: 120,
  },

  /* ── Top Bar ── */
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TOP_BAR_H,
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.navBarBorder,
  },
  topBarContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TOP_BAR_H,
    zIndex: 11,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: 12,
  },
  topBarLogo: {
    height: 36,
    width: 160,
  },
  topBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBarIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
  },
  notifDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primary,
  },

  /* ── Section Headers ── */
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: FONTS.bold as any,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    color: COLORS.silverDark,
    fontSize: 13,
    fontWeight: FONTS.regular as any,
    marginTop: 2,
  },

  /* ── Hero Carousel ── */
  carouselContainer: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
  },
  heroCard: {
    width: width * 0.78,
    height: 190,
    backgroundColor: 'rgba(14,20,38,0.85)',
    borderRadius: RADIUS.lg + 2,
    borderWidth: 1.5,
    borderColor: 'rgba(207,181,59,0.20)',
    marginRight: SPACING.sm,
    padding: SPACING.md,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...(Platform.OS === 'android' ? {
      elevation: 10,
      shadowColor: '#000',
    } : {
      shadowColor: 'rgba(207,181,59,0.15)',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroInfo: {
    flex: 1,
  },
  heroLocaName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: FONTS.semibold as any,
    letterSpacing: 0.3,
  },
  heroSahip: {
    color: COLORS.silverLight,
    fontSize: 13,
    fontWeight: FONTS.regular as any,
    marginTop: 2,
  },
  heroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroDesc: {
    color: COLORS.silverDark,
    fontSize: 11,
    fontWeight: FONTS.regular as any,
    flex: 1,
    marginRight: 8,
  },

  /* ── Live Badge & Dot ── */
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDotOuter: {
    position: 'absolute',
    left: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  liveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginLeft: 0,
  },
  liveText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: FONTS.medium as any,
    marginLeft: 6,
    letterSpacing: 0.5,
  },

  /* ── Turu Badge (Premium) ── */
  turuBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  turuText: {
    fontSize: 9,
    fontWeight: FONTS.heavy as any,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    zIndex: 1,
  },

  /* ── Avatar ── */
  avatarCircle: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  avatarInitials: {
    color: COLORS.white,
    fontWeight: FONTS.semibold as any,
  },

  /* ── Capacity ── */
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacityText: {
    color: COLORS.silverLight,
    fontSize: 12,
    fontWeight: FONTS.medium as any,
  },

  /* ── Staggered Grid ── */
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: CARD_HORIZONTAL_GAP,
  },
  gridColumn: {
    flex: 1,
  },

  /* ── Loca Card (Premium Glassmorphism) ── */
  locaCard: {
    backgroundColor: 'rgba(12,18,36,0.75)',
    borderRadius: RADIUS.md + 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 14,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...(Platform.OS === 'android' ? {
      elevation: 6,
      shadowColor: '#000',
    } : {
      shadowColor: 'rgba(0,0,0,0.4)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
    }),
  },
  locaCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locaCardMiddle: {
    alignItems: 'flex-start',
    gap: 6,
  },
  locaCardName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONTS.semibold as any,
    letterSpacing: 0.2,
  },
  locaCardSahip: {
    color: COLORS.silverDark,
    fontSize: 11,
    fontWeight: FONTS.regular as any,
  },
  locaCardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  /* ── Floating Bottom Nav ── */
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 24, // override edilecek inline style ile
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: Platform.OS === 'android' ? 'rgba(10,16,30,0.97)' : COLORS.navBarBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'visible',
    paddingHorizontal: SPACING.sm,
    ...(Platform.OS === 'android' ? {
      elevation: 12,
      shadowColor: '#000',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    }),
  },
  navTopGlow: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    borderRadius: 1,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    flex: 1,
  },
  navLabel: {
    color: COLORS.silverDark,
    fontSize: 10,
    fontWeight: FONTS.medium as any,
    marginTop: 3,
  },
  navLabelActive: {
    color: COLORS.primary,
  },

  /* ── Center Button (Premium) ── */
  centerBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    flex: 1,
  },
  centerGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primaryGlow,
  },
  centerGlowOuter: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryGlow,
  },
  centerBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.20)',
  },
});
