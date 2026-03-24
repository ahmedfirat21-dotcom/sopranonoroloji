import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Platform,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';

const { width } = Dimensions.get('window');
const RADAR_SIZE = width * 0.72;

// ─────────────────────────────────────────────────────
// VIP users orbiting the radar
// ─────────────────────────────────────────────────────
interface RadarUser {
  id: string;
  name: string;
  avatar: string;
  ring: number; // 1=inner, 2=mid, 3=outer
  angle: number; // starting angle in degrees
  tier: 'gold' | 'silver' | 'standard';
}

const RADAR_USERS: RadarUser[] = [
  { id: 'r1', name: 'Kaan', avatar: 'KY', ring: 1, angle: 30, tier: 'gold' },
  { id: 'r2', name: 'Selin', avatar: 'SA', ring: 1, angle: 190, tier: 'silver' },
  { id: 'r3', name: 'Emre', avatar: 'ED', ring: 2, angle: 75, tier: 'gold' },
  { id: 'r4', name: 'Zeynep', avatar: 'ZÇ', ring: 2, angle: 250, tier: 'standard' },
  { id: 'r5', name: 'Arda', avatar: 'AK', ring: 3, angle: 140, tier: 'silver' },
  { id: 'r6', name: 'Mert', avatar: 'MÖ', ring: 3, angle: 320, tier: 'standard' },
];

// ─────────────────────────────────────────────────────
// Neon Category Chips
// ─────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: '#Tümü', icon: 'apps' as const },
  { id: 't1', label: '#CanlıMüzik', icon: 'musical-notes' as const },
  { id: 't2', label: '#Yatırım', icon: 'trending-up' as const },
  { id: 't3', label: '#VIPSohbet', icon: 'chatbubble-ellipses' as const },
  { id: 't4', label: '#Oyun', icon: 'game-controller' as const },
  { id: 't5', label: '#Podcast', icon: 'mic' as const },
  { id: 't6', label: '#Kripto', icon: 'logo-bitcoin' as const },
];

// ─────────────────────────────────────────────────────
// Trending Locas for the Discover grid
// ─────────────────────────────────────────────────────
interface TrendingLoca {
  id: string;
  name: string;
  owner: string;
  avatar: string;
  capacity: string;
  badge: 'trend' | 'new' | 'hot' | 'elite';
  tokens: number;
  tags: string[]; // kategori etiketleri
}

const TRENDING_LOCAS: TrendingLoca[] = [
  { id: 'd1', name: 'Midnight Lounge', owner: 'Kaan Yıldız', avatar: 'KY', capacity: '8/12', badge: 'trend', tokens: 45200, tags: ['t1', 't3'] },
  { id: 'd2', name: 'Crypto Alpha', owner: 'Emre Demir', avatar: 'ED', capacity: '15/20', badge: 'hot', tokens: 38100, tags: ['t2', 't6'] },
  { id: 'd3', name: 'Jazz & Chill', owner: 'Selin Arslan', avatar: 'SA', capacity: '6/8', badge: 'elite', tokens: 29800, tags: ['t1'] },
  { id: 'd4', name: 'Game Vault', owner: 'Arda Kaya', avatar: 'AK', capacity: '4/10', badge: 'new', tokens: 18500, tags: ['t4'] },
  { id: 'd5', name: 'Beat Factory', owner: 'Mert Öztürk', avatar: 'MÖ', capacity: '9/15', badge: 'trend', tokens: 32700, tags: ['t1', 't5'] },
  { id: 'd6', name: 'Sanat Galerisi', owner: 'Elif Yılmaz', avatar: 'EY', capacity: '3/6', badge: 'new', tokens: 12400, tags: ['t3'] },
];

// ─────────────────────────────────────────────────────
// Pulsing Radar Ring
// ─────────────────────────────────────────────────────
function PulsingRing({ size, delay }: { size: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.12, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.04, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.3, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.95, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.radarRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────
// Orbiting VIP Avatar
// ─────────────────────────────────────────────────────
function OrbitAvatar({ user, onPress }: { user: RadarUser; onPress?: () => void }) {
  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 3000 + user.ring * 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0, duration: 3000 + user.ring * 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const ringRadius = (RADAR_SIZE / 2) * (0.32 + user.ring * 0.22);
  const angleRad = (user.angle * Math.PI) / 180;
  const baseX = Math.cos(angleRad) * ringRadius;
  const baseY = Math.sin(angleRad) * ringRadius;

  const wobbleX = wobble.interpolate({ inputRange: [0, 1], outputRange: [baseX - 4, baseX + 4] });
  const wobbleY = wobble.interpolate({ inputRange: [0, 1], outputRange: [baseY - 3, baseY + 3] });

  const avatarSize = user.ring === 1 ? 38 : user.ring === 2 ? 32 : 28;
  const borderColor = user.tier === 'gold' ? COLORS.goldMetallic : user.tier === 'silver' ? COLORS.silverMetallic : COLORS.primaryStroke;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{ position: 'absolute' }}
    >
      <Animated.View
        style={[
          styles.orbitAvatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderColor,
            transform: [{ translateX: wobbleX }, { translateY: wobbleY }],
          },
        ]}
      >
        <Text style={[styles.orbitAvatarText, { fontSize: avatarSize * 0.3 }]}>{user.avatar}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────
// Trending Card
// ─────────────────────────────────────────────────────
function TrendingCard({ loca, onPress }: { loca: TrendingLoca; onPress?: () => void }) {
  const badgeConfig: Record<string, { label: string; colors: [string, string] }> = {
    trend: { label: '🔥 Trend', colors: [COLORS.goldMetallic, COLORS.goldLight] },
    hot: { label: '⚡ Hot', colors: ['#E05252', '#FF7070'] },
    new: { label: '✨ Yeni', colors: [COLORS.primary, COLORS.primaryDark] },
    elite: { label: '👑 Elite', colors: [COLORS.goldMetallic, COLORS.goldLight] },
  };

  const badge = badgeConfig[loca.badge];

  return (
    <TouchableOpacity style={styles.trendCard} activeOpacity={0.8} onPress={onPress} delayPressIn={100}>
      <LinearGradient
        colors={['rgba(12,18,36,0.80)', 'rgba(8,14,28,0.90)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        pointerEvents="none"
      />

      {/* Badge */}
      <View style={styles.trendBadge}>
        <LinearGradient
          colors={badge.colors}
          style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={styles.trendBadgeText}>{badge.label}</Text>
      </View>

      {/* Avatar */}
      <View style={styles.trendAvatar}>
        <Text style={styles.trendAvatarText}>{loca.avatar}</Text>
      </View>

      {/* Info */}
      <Text style={styles.trendName} numberOfLines={1}>{loca.name}</Text>
      <Text style={styles.trendOwner} numberOfLines={1}>{loca.owner}</Text>

      {/* Bottom row */}
      <View style={styles.trendBottom}>
        <View style={styles.trendCapacity}>
          <Ionicons name="people" size={11} color={COLORS.silverDark} />
          <Text style={styles.trendCapText}>{loca.capacity}</Text>
        </View>
        <View style={styles.trendTokens}>
          <Ionicons name="diamond" size={11} color={COLORS.primary} />
          <Text style={styles.trendTokenText}>{(loca.tokens / 1000).toFixed(1)}K</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ═════════════════════════════════════════════════════
// DISCOVER SCREEN
// ═════════════════════════════════════════════════════
export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedChip, setSelectedChip] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocas = useMemo(() => {
    let result = TRENDING_LOCAS;
    // Chip filtresi
    if (selectedChip !== 'all') {
      result = result.filter((l) => l.tags.includes(selectedChip));
    }
    // Arama filtresi
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) => l.name.toLowerCase().includes(q) || l.owner.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery, selectedChip]);

  const leftCards = useMemo(() => filteredLocas.filter((_, i) => i % 2 === 0), [filteredLocas]);
  const rightCards = useMemo(() => filteredLocas.filter((_, i) => i % 2 !== 0), [filteredLocas]);

  // Search bar blur as user scrolls
  const searchBlurOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={isDark ? [COLORS.deepNavy, '#040810', COLORS.deepNavy] : ['#F2F2F7', '#EEEDF5', '#F2F2F7']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ═══ FLOATING SEARCH PILL (stays on top via z-index) ═══ */}
      <View style={[styles.searchPillWrapper, { paddingTop: insets.top + 8 }]}>
        <Animated.View style={[styles.searchBlurBg, { opacity: searchBlurOpacity }]}>
          <BlurView intensity={isDark ? 50 : 70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <View style={styles.searchPill}>
          <LinearGradient
            colors={['rgba(12,18,36,0.88)', 'rgba(8,14,28,0.92)']}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
          <Ionicons name="search-outline" size={17} color={COLORS.silverDark} />
          <TextInput
            style={styles.searchInput}
            placeholder="VIP'leri, Locaları veya Etiketleri ara..."
            placeholderTextColor={COLORS.silverDark}
            selectionColor={COLORS.primary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ═══ LIVE RADAR / SONAR ═══ */}
        <View style={styles.radarArea}>
          {/* Concentric pulsing rings */}
          <PulsingRing size={RADAR_SIZE * 0.98} delay={0} />
          <PulsingRing size={RADAR_SIZE * 0.72} delay={600} />
          <PulsingRing size={RADAR_SIZE * 0.46} delay={1200} />

          {/* Center avatar */}
          <View style={styles.radarCenter}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.radarCenterGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="person" size={22} color={COLORS.deepNavy} />
            </LinearGradient>
          </View>

          {/* Orbiting VIP avatars */}
          {RADAR_USERS.map((user) => (
            <OrbitAvatar
              key={user.id}
              user={user}
              onPress={() => router.push({ pathname: '/room', params: { id: user.id, name: user.name } })}
            />
          ))}

          {/* Label */}
          <View style={styles.radarLabel}>
            <View style={styles.radarLiveDot} />
            <Text style={styles.radarLabelText}>Canlı Radar</Text>
          </View>
        </View>

        {/* ═══ NEON CATEGORY CHIPS ═══ */}
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
          renderItem={({ item }) => {
            const isActive = selectedChip === item.id;
            return (
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                activeOpacity={0.7}
                onPress={() => setSelectedChip(item.id)}
              >
                {isActive && (
                  <View style={styles.chipGlow} />
                )}
                <Ionicons name={item.icon} size={14} color={isActive ? COLORS.primary : COLORS.silverDark} />
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* ═══ SECTION TITLE ═══ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trend Localar</Text>
          <Text style={styles.sectionSub}>En popüler mekanlar</Text>
        </View>

        {/* ═══ STAGGERED GRID ═══ */}
        <View style={styles.gridContainer}>
          <View style={styles.gridColumn}>
            {leftCards.map((loca) => (
              <TrendingCard key={loca.id} loca={loca} onPress={() => router.push({ pathname: '/room', params: { id: loca.id } })} />
            ))}
          </View>
          <View style={[styles.gridColumn, { marginTop: SPACING.xl }]}>
            {rightCards.map((loca) => (
              <TrendingCard key={loca.id} loca={loca} onPress={() => router.push({ pathname: '/room', params: { id: loca.id } })} />
            ))}
          </View>
        </View>

        <View style={{ height: insets.bottom + 80 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deepNavy },

  /* ── Search Pill ── */
  searchPillWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    zIndex: 10,
  },
  searchBlurBg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: FONTS.regular as any,
  },

  /* ── Scroll Content ── */
  scrollContent: {
    paddingTop: 100,
    paddingBottom: SPACING.md,
  },

  /* ── Radar ── */
  radarArea: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: COLORS.primaryStroke,
    backgroundColor: 'transparent',
  },
  radarCenter: {
    position: 'absolute',
    zIndex: 5,
  },
  radarCenterGrad: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  radarLabel: {
    position: 'absolute',
    bottom: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  radarLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  radarLabelText: {
    color: COLORS.silverLight,
    fontSize: 11,
    fontWeight: FONTS.medium as any,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  /* ── Orbit Avatar ── */
  orbitAvatar: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: COLORS.cardGlassBg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  orbitAvatarText: {
    color: COLORS.white,
    fontWeight: FONTS.bold as any,
  },

  /* ── Chips ── */
  chipList: {
    paddingHorizontal: SPACING.md,
    gap: 8,
    paddingBottom: SPACING.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  chipActive: {
    borderColor: COLORS.primaryStroke,
    backgroundColor: COLORS.primarySubtle,
  },
  chipGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  chipText: {
    color: COLORS.silverDark,
    fontSize: 12,
    fontWeight: FONTS.medium as any,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: FONTS.semibold as any,
  },

  /* ── Section ── */
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: FONTS.bold as any,
  },
  sectionSub: {
    color: COLORS.silverDark,
    fontSize: 13,
    fontWeight: FONTS.regular as any,
    marginTop: 2,
  },

  /* ── Grid ── */
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  gridColumn: {
    flex: 1,
    gap: 10,
  },

  /* ── Trending Card ── */
  trendCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    padding: 14,
    gap: 8,
    position: 'relative',
  },
  trendBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 2,
  },
  trendBadgeText: {
    color: '#1A1F35',
    fontSize: 9,
    fontWeight: FONTS.bold as any,
    zIndex: 1,
  },
  trendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardGlassBg,
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendAvatarText: {
    color: COLORS.silver,
    fontSize: 14,
    fontWeight: FONTS.semibold as any,
  },
  trendName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONTS.semibold as any,
  },
  trendOwner: {
    color: COLORS.silverDark,
    fontSize: 11,
    fontWeight: FONTS.regular as any,
  },
  trendBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  trendCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendCapText: {
    color: COLORS.silverDark,
    fontSize: 11,
    fontWeight: FONTS.regular as any,
  },
  trendTokens: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendTokenText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: FONTS.bold as any,
  },
});
