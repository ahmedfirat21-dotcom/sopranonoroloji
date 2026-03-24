import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { useUser } from '../contexts/UserContext';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────
// Leaderboard Dummy Data
// ─────────────────────────────────────────────────────
interface LeaderUser {
  id: string;
  name: string;
  tokens: number;
  avatar: string; // initials
}

const DUMMY_LEADERS: LeaderUser[] = [
  { id: 'l1', name: 'Kaan Yıldız', tokens: 87500, avatar: 'KY' },
  { id: 'l2', name: 'Selin Arslan', tokens: 64200, avatar: 'SA' },
  { id: 'l3', name: 'Emre Demir', tokens: 51800, avatar: 'ED' },
  { id: 'l4', name: 'Mert Öztürk', tokens: 45300, avatar: 'MÖ' },
  { id: 'l5', name: 'Zeynep Çelik', tokens: 38700, avatar: 'ZÇ' },
  { id: 'l6', name: 'Arda Kaya', tokens: 31200, avatar: 'AK' },
  { id: 'l7', name: 'Elif Yılmaz', tokens: 27800, avatar: 'EY' },
  { id: 'l8', name: 'Burak Şahin', tokens: 24100, avatar: 'BŞ' },
  { id: 'l9', name: 'Ceren Aydın', tokens: 21500, avatar: 'CA' },
  { id: 'l10', name: 'Deniz Koç', tokens: 18900, avatar: 'DK' },
  { id: 'l11', name: 'Gizem Demir', tokens: 16400, avatar: 'GD' },
  { id: 'l12', name: 'Hakan Aksoy', tokens: 14200, avatar: 'HA' },
];

// ─────────────────────────────────────────────────────
// Crown / Medal Icon — 3D feel
// ─────────────────────────────────────────────────────
function CrownIcon({ size = 24 }: { size?: number }) {
  return (
    <View style={[styles.crownWrapper, { width: size + 8, height: size + 8 }]}>
      <LinearGradient
        colors={[COLORS.goldMetallic, COLORS.goldLight, COLORS.goldMetallic]}
        style={[styles.crownBg, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        <Ionicons name="trophy" size={size * 0.6} color="#1A1F35" />
      </LinearGradient>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Podium Avatar with Glow Ring
// ─────────────────────────────────────────────────────
function PodiumAvatar({
  user,
  rank,
  size,
}: {
  user: LeaderUser;
  rank: 1 | 2 | 3;
  size: number;
}) {
  const ringGlow = useRef(new Animated.Value(0.5)).current;

  const ringColors: Record<1 | 2 | 3, { border: string; glow: string; gradStart: string; gradEnd: string }> = {
    1: { border: COLORS.goldMetallic, glow: COLORS.goldGlow, gradStart: COLORS.goldMetallic, gradEnd: COLORS.goldLight },
    2: { border: COLORS.silverMetallic, glow: COLORS.silverGlow, gradStart: '#C0C0C0', gradEnd: COLORS.silverShine },
    3: { border: COLORS.bronze, glow: COLORS.bronzeGlow, gradStart: COLORS.bronze, gradEnd: COLORS.bronzeLight },
  };

  const colors = ringColors[rank];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringGlow, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(ringGlow, { toValue: 0.5, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.podiumAvatarWrap, { width: size + 30, alignItems: 'center' }]}>
      {/* Crown for #1 */}
      {rank === 1 && (
        <View style={styles.crownPosition}>
          <CrownIcon size={28} />
        </View>
      )}

      {/* Glow ring */}
      <Animated.View
        style={[
          styles.podiumGlowRing,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
            backgroundColor: colors.glow,
            opacity: ringGlow,
          },
        ]}
      />

      {/* Avatar circle */}
      <View style={[styles.podiumAvatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        <LinearGradient
          colors={[colors.gradStart, colors.gradEnd]}
          style={[styles.podiumAvatarBorder, { borderRadius: size / 2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Inner shadow */}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.15)']}
            style={[styles.podiumAvatarInner, { borderRadius: (size - 6) / 2 }]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
          >
            <Text style={[styles.podiumInitials, { fontSize: size * 0.3 }]}>{user.avatar}</Text>
          </LinearGradient>
        </LinearGradient>
      </View>

      {/* Rank badge */}
      <View style={[styles.rankBadge, { backgroundColor: colors.border }]}>
        <Text style={styles.rankBadgeText}>{rank}</Text>
      </View>

      {/* Name & Tokens */}
      <Text style={[styles.podiumName, rank === 1 && { color: COLORS.goldLight }]} numberOfLines={1}>
        {user.name.split(' ')[0]}
      </Text>
      <View style={styles.podiumTokenRow}>
        <Ionicons name="diamond" size={12} color={COLORS.primary} />
        <Text style={styles.podiumTokens}>{(user.tokens / 1000).toFixed(1)}K</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Rank Row (4+)
// ─────────────────────────────────────────────────────
function RankRow({ user, rank, opacity }: { user: LeaderUser; rank: number; opacity: number }) {
  return (
    <View style={[styles.rankRow, { opacity }]}>
      <LinearGradient
        colors={['rgba(15,22,40,0.75)', 'rgba(10,16,32,0.85)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
      />
      <Text style={styles.rankNumber}>{rank}</Text>
      <View style={styles.rankAvatar}>
        <Text style={styles.rankAvatarText}>{user.avatar}</Text>
      </View>
      <View style={styles.rankInfo}>
        <Text style={styles.rankName}>{user.name}</Text>
      </View>
      <View style={styles.rankTokens}>
        <Ionicons name="diamond" size={14} color={COLORS.primary} />
        <Text style={styles.rankTokenText}>{user.tokens.toLocaleString()}</Text>
      </View>
    </View>
  );
}

// ═════════════════════════════════════════════════════
// LEADERBOARD SCREEN
// ═════════════════════════════════════════════════════
export default function LeaderboardScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [mainTab, setMainTab] = useState<'spenders' | 'earners'>('spenders');
  const [timeTab, setTimeTab] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const { user } = useUser();

  const top3 = useMemo(() => DUMMY_LEADERS.slice(0, 3), []);
  const rest = useMemo(() => DUMMY_LEADERS.slice(3), []);

  // Parallax for podium
  const podiumTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });
  const podiumOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={[COLORS.deepNavy, '#040810', COLORS.deepNavy]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ═══ TOP BAR ═══ */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.silver} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Liderlik Kürsüsü</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* ═══ FILTER TABS (2-layer) ═══ */}
      <View style={styles.filterArea}>
        {/* Main tabs */}
        <View style={styles.filterRow}>
          {(['spenders', 'earners'] as const).map((tab) => {
            const isActive = mainTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                activeOpacity={0.8}
                onPress={() => setMainTab(tab)}
              >
                {isActive && (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab === 'spenders' ? 'En Çok Harcayanlar' : 'En Çok Kazananlar'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Time tabs */}
        <View style={styles.filterRow}>
          {(['daily', 'weekly', 'monthly'] as const).map((tab) => {
            const isActive = timeTab === tab;
            const labels = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.timePill, isActive && styles.timePillActive]}
                activeOpacity={0.8}
                onPress={() => setTimeTab(tab)}
              >
                <Text style={[styles.timeText, isActive && styles.timeTextActive]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ═══ PODIUM — TOP 3 ═══ */}
        <Animated.View
          style={[
            styles.podiumArea,
            { transform: [{ translateY: podiumTranslateY }], opacity: podiumOpacity },
          ]}
        >
          {/* Ambient glow */}
          <View style={styles.podiumAmbient} />

          {/* 2nd — left */}
          <View style={styles.podiumSide}>
            <PodiumAvatar user={top3[1]} rank={2} size={64} />
            <View style={[styles.podiumPillar, styles.podiumPillar2]}>
              <LinearGradient
                colors={['rgba(192,192,192,0.12)', 'rgba(192,192,192,0.04)']}
                style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 12, borderTopRightRadius: 12 }]}
              />
            </View>
          </View>

          {/* 1st — center */}
          <View style={styles.podiumCenter}>
            <PodiumAvatar user={top3[0]} rank={1} size={80} />
            <View style={[styles.podiumPillar, styles.podiumPillar1]}>
              <LinearGradient
                colors={['rgba(207,181,59,0.15)', 'rgba(207,181,59,0.04)']}
                style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 12, borderTopRightRadius: 12 }]}
              />
            </View>
          </View>

          {/* 3rd — right */}
          <View style={styles.podiumSide}>
            <PodiumAvatar user={top3[2]} rank={3} size={64} />
            <View style={[styles.podiumPillar, styles.podiumPillar3]}>
              <LinearGradient
                colors={['rgba(205,127,50,0.12)', 'rgba(205,127,50,0.04)']}
                style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 12, borderTopRightRadius: 12 }]}
              />
            </View>
          </View>
        </Animated.View>

        {/* ═══ RANK LIST (4+) ═══ */}
        <View style={styles.rankListArea}>
          {rest.map((user, index) => {
            const rank = index + 4;
            const opacityVal = Math.max(0.6, 1 - index * 0.04);
            return (
              <RankRow key={user.id} user={user} rank={rank} opacity={opacityVal} />
            );
          })}
        </View>

        {/* Bottom padding for sticky bar */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* ═══ STICKY MOTIVATION BAR ═══ */}
      <View style={styles.motivationWrapper}>
        <View style={styles.motivationBar}>
          <LinearGradient
            colors={['rgba(15,22,42,0.95)', 'rgba(10,16,32,0.98)']}
            style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
          />
          {/* Metallic edge */}
          <LinearGradient
            colors={['transparent', COLORS.goldGlow, 'transparent']}
            style={styles.motivationGlow}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <View style={styles.motivationContent}>
            <View style={styles.motivationLeft}>
              <Ionicons name="trophy-outline" size={18} color={COLORS.goldMetallic} />
              <Text style={styles.motivationRank}>Sıran: <Text style={styles.motivationRankNum}>142.</Text> — {user?.displayName || 'Sen'}</Text>
            </View>
            <View style={styles.motivationDivider} />
            <Text style={styles.motivationGoal}>
              İlk 100'e girmek için <Text style={styles.motivationHighlight}>5K</Text> jeton daha kazan!
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepNavy,
  },

  /* ── Top Bar ── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: FONTS.bold as any,
    letterSpacing: 0.5,
  },

  /* ── Filter Tabs ── */
  filterArea: {
    paddingHorizontal: SPACING.md,
    gap: 8,
    paddingBottom: SPACING.sm,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
  },
  filterPill: {
    flex: 1,
    height: 34,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filterPillActive: {},
  filterText: {
    color: COLORS.silverDark,
    fontSize: 12,
    fontWeight: FONTS.medium as any,
    zIndex: 1,
  },
  filterTextActive: {
    color: COLORS.deepNavy,
    fontWeight: FONTS.bold as any,
  },
  timePill: {
    flex: 1,
    height: 30,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePillActive: {
    backgroundColor: 'rgba(92,225,230,0.10)',
    borderWidth: 1,
    borderColor: COLORS.primaryStroke,
  },
  timeText: {
    color: COLORS.silverDark,
    fontSize: 11,
    fontWeight: FONTS.medium as any,
  },
  timeTextActive: {
    color: COLORS.primary,
    fontWeight: FONTS.semibold as any,
  },

  /* ── Scroll Content ── */
  scrollContent: {
    paddingBottom: SPACING.md,
  },

  /* ── Podium ── */
  podiumArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    position: 'relative',
  },
  podiumAmbient: {
    position: 'absolute',
    top: 40,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: COLORS.goldGlow,
    opacity: 0.06,
    alignSelf: 'center',
  },
  podiumSide: {
    alignItems: 'center',
    flex: 1,
  },
  podiumCenter: {
    alignItems: 'center',
    flex: 1.2,
    marginTop: -16, // raise center
  },

  /* Pillars */
  podiumPillar: {
    width: '80%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  podiumPillar1: {
    height: 50,
    borderColor: 'rgba(207,181,59,0.12)',
  },
  podiumPillar2: {
    height: 35,
    borderColor: 'rgba(192,192,192,0.10)',
  },
  podiumPillar3: {
    height: 25,
    borderColor: 'rgba(205,127,50,0.10)',
  },

  /* Podium Avatar */
  podiumAvatarWrap: {
    position: 'relative',
  },
  crownPosition: {
    position: 'absolute',
    top: -8,
    zIndex: 10,
    alignSelf: 'center',
  },
  crownWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownBg: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.goldMetallic,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  podiumGlowRing: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
  },
  podiumAvatarCircle: {
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  podiumAvatarBorder: {
    flex: 1,
    padding: 3,
  },
  podiumAvatarInner: {
    flex: 1,
    backgroundColor: COLORS.cardGlassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumInitials: {
    color: COLORS.white,
    fontWeight: FONTS.bold as any,
  },
  rankBadge: {
    position: 'absolute',
    bottom: 40,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.deepNavy,
    zIndex: 5,
  },
  rankBadgeText: {
    color: '#1A1F35',
    fontSize: 10,
    fontWeight: FONTS.heavy as any,
  },
  podiumName: {
    color: COLORS.silver,
    fontSize: 12,
    fontWeight: FONTS.semibold as any,
    marginTop: 4,
    textAlign: 'center',
  },
  podiumTokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  podiumTokens: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: FONTS.bold as any,
  },

  /* ── Rank List ── */
  rankListArea: {
    paddingHorizontal: SPACING.md,
    gap: 8,
    marginTop: SPACING.sm,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    gap: 12,
  },
  rankNumber: {
    color: COLORS.silverDark,
    fontSize: 16,
    fontWeight: FONTS.bold as any,
    width: 22,
    textAlign: 'center',
  },
  rankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardGlassBg,
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankAvatarText: {
    color: COLORS.silver,
    fontSize: 13,
    fontWeight: FONTS.semibold as any,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONTS.medium as any,
  },
  rankTokens: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankTokenText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: FONTS.bold as any,
  },

  /* ── Motivation Bar ── */
  motivationWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? SPACING.md : SPACING.lg,
    left: SPACING.md,
    right: SPACING.md,
  },
  motivationBar: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(207,181,59,0.12)',
    overflow: 'hidden',
    position: 'relative',
  },
  motivationGlow: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
  },
  motivationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  motivationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  motivationRank: {
    color: COLORS.silver,
    fontSize: 13,
    fontWeight: FONTS.medium as any,
  },
  motivationRankNum: {
    color: COLORS.goldLight,
    fontWeight: FONTS.bold as any,
  },
  motivationDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  motivationGoal: {
    flex: 1,
    color: COLORS.silverLight,
    fontSize: 11,
    fontWeight: FONTS.regular as any,
  },
  motivationHighlight: {
    color: COLORS.primary,
    fontWeight: FONTS.bold as any,
  },
});
