import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
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
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';
import {
  getDiscoverData,
  type DiscoverRoom,
  type RadarUserData,
} from '../../services/api';
import { EmptyState } from '../../components/UXHelpers';

const { width } = Dimensions.get('window');
const RADAR_SIZE = width * 0.68;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Neon Category Chips
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CATEGORIES = [
  { id: 'all', label: '#TÃ¼mÃ¼', icon: 'apps' as const },
  { id: 'MÃ¼zik', label: '#CanlÄ±MÃ¼zik', icon: 'musical-notes' as const },
  { id: 'YatÄ±rÄ±m', label: '#YatÄ±rÄ±m', icon: 'trending-up' as const },
  { id: 'Sohbet', label: '#VIPSohbet', icon: 'chatbubble-ellipses' as const },
  { id: 'Oyun', label: '#Oyun', icon: 'game-controller' as const },
  { id: 'Podcast', label: '#Podcast', icon: 'mic' as const },
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sonar Pulse â€” merkezde nefes alan halka
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SonarPulse() {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse1, { toValue: 1, duration: 3000, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ).start();
    setTimeout(() => {
      Animated.loop(
        Animated.timing(pulse2, { toValue: 1, duration: 3000, easing: Easing.out(Easing.ease), useNativeDriver: true })
      ).start();
    }, 1500);
  }, []);

  const ring = (anim: Animated.Value) => ({
    position: 'absolute' as const,
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 1.5, borderColor: COLORS.primary,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.5] }) }],
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 50, marginBottom: 4 }}>
      <Animated.View style={ring(pulse1)} />
      <Animated.View style={ring(pulse2)} />
      <View style={{
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(92,225,230,0.08)',
        borderWidth: 1, borderColor: 'rgba(92,225,230,0.25)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="wifi" size={18} color={COLORS.primary} />
      </View>
    </View>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Nearby User Card â€” yatay scroll premium kart
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function NearbyUserCard({ user, onPress }: { user: RadarUserData; onPress?: () => void }) {
  const accent = user.tier === 'gold' ? COLORS.goldMetallic
    : user.tier === 'silver' ? COLORS.silverMetallic : COLORS.primary;
  const tierLabel = user.tier === 'gold' ? 'VIP' : user.tier === 'silver' ? 'Elite' : '';

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={{ width: 80, alignItems: 'center', marginRight: 14 }}>
      <View style={{
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: 'rgba(15,20,40,0.9)',
        borderWidth: 2, borderColor: accent,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: accent, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
        marginBottom: 6,
      }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{user.initials}</Text>
        <View style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 12, height: 12, borderRadius: 6,
          backgroundColor: '#4ADE80', borderWidth: 2, borderColor: COLORS.deepNavy,
        }} />
      </View>
      <Text style={{ color: '#E2E8F0', fontSize: 11, fontWeight: '600', textAlign: 'center' }} numberOfLines={1}>{user.name}</Text>
      {tierLabel ? (
        <View style={{ marginTop: 2, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: `${accent}22`, borderWidth: 0.5, borderColor: `${accent}66` }}>
          <Text style={{ color: accent, fontSize: 8, fontWeight: '800' }}>{tierLabel}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Trending Card (Premium)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TrendingCard({ room, onPress }: { room: DiscoverRoom; onPress?: () => void }) {
  const badgeConfig: Record<string, { label: string; colors: [string, string] }> = {
    trend: { label: 'ğŸ”¥ Trend', colors: [COLORS.goldMetallic, COLORS.goldLight] },
    hot: { label: 'âš¡ Hot', colors: ['#E05252', '#FF7070'] },
    new: { label: 'âœ¨ Yeni', colors: [COLORS.primary, COLORS.primaryDark] },
    standard: { label: 'â—† Aktif', colors: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'] },
  };

  const badge = badgeConfig[room.badge || 'standard'];
  const initials = (room.ownerDisplayName || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity style={styles.trendCard} activeOpacity={0.8} onPress={onPress} delayPressIn={100}>
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
        <Text style={styles.trendAvatarText}>{initials}</Text>
      </View>

      {/* Info */}
      <Text style={styles.trendName} numberOfLines={1}>{room.name}</Text>
      <Text style={styles.trendOwner} numberOfLines={1}>{room.ownerDisplayName || 'Anonim'}</Text>

      {/* Bottom row */}
      <View style={styles.trendBottom}>
        <View style={styles.trendCapacity}>
          <Ionicons name="people" size={11} color={COLORS.silverDark} />
          <Text style={styles.trendCapText}>
            {room.currentParticipants || 0}/{room.maxCapacity || 10}
          </Text>
        </View>
        {room.isPrivate && (
          <View style={styles.trendCapacity}>
            <Ionicons name="diamond" size={11} color={COLORS.primary} />
            <Text style={styles.trendTokenText}>VIP</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Dummy Fallback Data
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DUMMY_DISCOVER_ROOMS: DiscoverRoom[] = [
  { id: 'dr1', name: "Gece MÃ¼ziÄŸi LocasÄ±", ownerDisplayName: 'Ahmet Kaan', maxCapacity: 8, currentParticipants: 5, isPrivate: false, tags: ['MÃ¼zik'], badge: 'trend' },
  { id: 'dr2', name: "VIP Sohbet KulÃ¼bÃ¼", ownerDisplayName: 'Elif Deniz', maxCapacity: 6, currentParticipants: 3, isPrivate: true, tags: ['Sohbet'], badge: 'hot' },
  { id: 'dr3', name: "YatÄ±rÄ±m Akademisi", ownerDisplayName: 'Can Demir', maxCapacity: 12, currentParticipants: 8, isPrivate: false, tags: ['YatÄ±rÄ±m'], badge: 'new' },
  { id: 'dr4', name: "Gaming Arena", ownerDisplayName: 'Burak YÄ±lmaz', maxCapacity: 10, currentParticipants: 7, isPrivate: false, tags: ['Oyun'], badge: 'trend' },
  { id: 'dr5', name: "Podcast Sahnesi", ownerDisplayName: 'Zeynep Aras', maxCapacity: 4, currentParticipants: 2, isPrivate: false, tags: ['Podcast'], badge: 'standard' },
  { id: 'dr6', name: "CanlÄ± Akustik", ownerDisplayName: 'Selin Kaya', maxCapacity: 8, currentParticipants: 6, isPrivate: false, tags: ['MÃ¼zik'], badge: 'hot' },
];

const DUMMY_RADAR_USERS: RadarUserData[] = [
  { id: 'ru1', name: 'Ahmet K.', avatar: null, initials: 'AK', ring: 1, angle: 30, tier: 'gold' },
  { id: 'ru2', name: 'Elif D.',  avatar: null, initials: 'ED', ring: 2, angle: 120, tier: 'silver' },
  { id: 'ru3', name: 'Can D.',   avatar: null, initials: 'CD', ring: 1, angle: 220, tier: 'standard' },
  { id: 'ru4', name: 'Zeynep A.',avatar: null, initials: 'ZA', ring: 3, angle: 310, tier: 'gold' },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DISCOVER SCREEN
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedChip, setSelectedChip] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<DiscoverRoom[]>([]);
  const [radarUsers, setRadarUsers] = useState<RadarUserData[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const data = await getDiscoverData();
      setRooms(data.rooms.length > 0 ? data.rooms : DUMMY_DISCOVER_ROOMS);
      setRadarUsers(data.radarUsers.length > 0 ? data.radarUsers : DUMMY_RADAR_USERS);
    } catch {
      // API eriÅŸilemezse dummy veriden devam
      setRooms(DUMMY_DISCOVER_ROOMS);
      setRadarUsers(DUMMY_RADAR_USERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredRooms = useMemo(() => {
    let result = rooms;
    if (selectedChip !== 'all') {
      result = result.filter(r => r.tags?.includes(selectedChip));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        r => r.name.toLowerCase().includes(q) || (r.ownerDisplayName || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [rooms, searchQuery, selectedChip]);

  const leftCards = useMemo(() => filteredRooms.filter((_, i) => i % 2 === 0), [filteredRooms]);
  const rightCards = useMemo(() => filteredRooms.filter((_, i) => i % 2 !== 0), [filteredRooms]);

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

      {/* â•â•â• PREMIUM SEARCH BAR â•â•â• */}
      <View style={[styles.searchPillWrapper, { paddingTop: insets.top + 8 }]}>
        <Animated.View style={[styles.searchBlurBg, { opacity: searchBlurOpacity }]}>
          <BlurView intensity={isDark ? 50 : 70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <View style={styles.searchPill}>
          <LinearGradient
            colors={['rgba(12,18,36,0.92)', 'rgba(8,14,28,0.96)']}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
          {/* Inner shadow illusion */}
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <Ionicons name="search-outline" size={17} color={COLORS.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="LocalarÄ± veya KullanÄ±cÄ±larÄ± ara..."
            placeholderTextColor={'rgba(148,163,184,0.5)'}
            selectionColor={COLORS.primary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.silverDark} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* â•â•â• SCROLLABLE CONTENT â•â•â• */}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.deepNavy}
          />
        }
      >
        {/* ═══ NEARBY USERS ═══ */}
        <View style={{ paddingTop: 8, marginBottom: SPACING.lg }}>
          {/* Sonar + Başlık */}
          <SonarPulse />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary }} />
            <Text style={{ color: COLORS.silverLight, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Canlı Keşifler
            </Text>
            {radarUsers.length > 0 && (
              <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: '700' }}>· {radarUsers.length} çevrimiçi</Text>
            )}
          </View>
          {/* Yatay scroll kullanıcı kartları */}
          <FlatList
            data={radarUsers}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.md }}
            renderItem={({ item }) => (
              <NearbyUserCard
                user={item}
                onPress={() => router.push({ pathname: '/room', params: { id: item.id, name: item.name } })}
              />
            )}
            ListEmptyComponent={
              <Text style={{ color: COLORS.silverDark, fontSize: 12, textAlign: 'center', flex: 1 }}>
                Yakında çevrimiçi kullanıcı yok
              </Text>
            }
          />
        </View>

        {/* â•â•â• NEON CATEGORY CHIPS â•â•â• */}
        <FlatList
          data={CATEGORIES}
          keyExtractor={item => item.id}
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
                {isActive && <View style={styles.chipGlow} />}
                <Ionicons name={item.icon} size={14} color={isActive ? COLORS.primary : COLORS.silverDark} />
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* â•â•â• SECTION TITLE â•â•â• */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LinearGradient
              colors={[COLORS.goldMetallic, COLORS.goldLight]}
              style={{ width: 3, height: 18, borderRadius: 2 }}
            />
            <Text style={styles.sectionTitle}>Trend Localar</Text>
          </View>
          <Text style={styles.sectionSub}>En popÃ¼ler mekanlar</Text>
        </View>

        {/* â•â•â• CONTENT â•â•â• */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ color: COLORS.silverDark, marginTop: 12, fontSize: 13 }}>Localar yÃ¼kleniyor...</Text>
          </View>
        ) : filteredRooms.length === 0 ? (
          <EmptyState
            icon="compass-outline"
            title="SonuÃ§ bulunamadÄ±"
            subtitle={searchQuery ? 'FarklÄ± bir arama deneyin' : 'HenÃ¼z trend loca yok'}
          />
        ) : (
          <View style={styles.gridContainer}>
            <View style={styles.gridColumn}>
              {leftCards.map(room => (
                <TrendingCard key={room.id} room={room} onPress={() => router.push({ pathname: '/room', params: { id: room.id } })} />
              ))}
            </View>
            <View style={[styles.gridColumn, { marginTop: SPACING.xl }]}>
              {rightCards.map(room => (
                <TrendingCard key={room.id} room={room} onPress={() => router.push({ pathname: '/room', params: { id: room.id } })} />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STYLES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deepNavy },

  /* â”€â”€ Search Pill (Premium Glassmorphism) â”€â”€ */
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
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: FONTS.regular as any,
  },

  /* â”€â”€ Scroll Content â”€â”€ */
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 120,
  },

  /* â”€â”€ Radar â”€â”€ */
  radarArea: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
    borderRadius: RADAR_SIZE / 2,
    backgroundColor: '#030810',
    borderWidth: 1,
    borderColor: 'rgba(92,225,230,0.08)',
  },
  radarRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: COLORS.primaryStroke,
    backgroundColor: 'transparent',
  },
  radarSweep: {
    position: 'absolute',
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
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
  radarCountText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: FONTS.semibold as any,
  },

  /* â”€â”€ Orbit Avatar â”€â”€ */
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

  /* â”€â”€ Chips â”€â”€ */
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

  /* â”€â”€ Section â”€â”€ */
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

  /* â”€â”€ Grid â”€â”€ */
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  gridColumn: {
    flex: 1,
    gap: 10,
  },

  /* â”€â”€ Trending Card â”€â”€ */
  trendCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    padding: 14,
    gap: 8,
    position: 'relative',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
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
  trendTokenText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: FONTS.bold as any,
  },
});
