import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { EmptyState, SkeletonList } from '../../components/UXHelpers';
import { getDirectMessageConversations, ConversationData } from '../../services/api';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────
// Swipeable Chat Row
// ─────────────────────────────────────────────────────
function ChatRow({
  convo,
  onPress,
}: {
  convo: ConversationData;
  onPress: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const handleSwipe = useCallback(() => {
    if (!swiped) {
      Animated.spring(translateX, { toValue: -90, friction: 12, useNativeDriver: true }).start();
      setSwiped(true);
    } else {
      Animated.spring(translateX, { toValue: 0, friction: 12, useNativeDriver: true }).start();
      setSwiped(false);
    }
  }, [swiped]);

  return (
    <View style={styles.rowContainer}>
      {/* Delete action behind */}
      <TouchableOpacity style={styles.deleteAction} activeOpacity={0.8}>
        <LinearGradient
          colors={['#8B0000', '#CC2222']}
          style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <Ionicons name="trash-outline" size={22} color={COLORS.white} />
        <Text style={styles.deleteText}>Sil</Text>
      </TouchableOpacity>

      {/* Main row */}
      <Animated.View style={[styles.chatRow, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={styles.chatRowInner}
          activeOpacity={0.7}
          onPress={onPress}
          onLongPress={handleSwipe}
        >
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={[
              styles.avatar,
              convo.isAlliance && styles.avatarGold, // Alliance is boolean in ConversationData, we simplified it.
            ]}>
              {convo.avatar?.length > 4 ? (
                <Text style={{color:'transparent'}}>A</Text> 
              ) : (
                 <Text style={styles.avatarText}>{convo.avatar || convo.name.charAt(0)}</Text>
              )}
            </View>
            {/* Online dot */}
            {convo.isOnline && (
              <View style={styles.onlineDotOuter}>
                <View style={styles.onlineDot} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.chatInfo}>
            <View style={styles.chatNameRow}>
              <Text style={styles.chatName} numberOfLines={1}>{convo.name}</Text>
              {convo.isAlliance && (
                <View style={styles.allianceBadge}>
                  <Ionicons
                    name="shield-checkmark"
                    size={13}
                    color={COLORS.goldMetallic}
                  />
                </View>
              )}
            </View>
            <Text style={styles.lastMsg} numberOfLines={1}>{convo.lastMessage}</Text>
          </View>

          {/* Right: time + unread */}
          <View style={styles.chatRight}>
            <Text style={styles.timeText}>{convo.time}</Text>
            {convo.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{convo.unread}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ═════════════════════════════════════════════════════
// MESSAGES SCREEN
// ═════════════════════════════════════════════════════
export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      const data = await getDirectMessageConversations();
      setConversations(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unread, 0);

  const topBarOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
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

      {/* Scrollable content */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadConversations(); }} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={[styles.headerArea, { paddingTop: insets.top + 4 }]}>
          <View style={styles.headerRow}>
            {/* Geri oku sekme sayfasında gereksiz olduğu için silindi. */}
            <Text style={styles.headerTitle}>Mesajlar</Text>
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={20} color={COLORS.silver} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={COLORS.silverDark} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ara..."
              placeholderTextColor={COLORS.silverDark}
              selectionColor={COLORS.primary}
            />
          </View>
        </View>

        {/* Conversations */}
        <View style={styles.listArea}>
          {loading ? (
            <SkeletonList count={6} />
          ) : conversations.length === 0 ? (
            <EmptyState
              icon="chatbubbles-outline"
              title="Henüz mesaj yok"
              subtitle="Keşfet'ten birini takip et ve ilk mesajını gönder!"
            />
          ) : (
            conversations.map((convo, index) => (
              <React.Fragment key={convo.id}>
                <ChatRow
                  convo={convo}
                  onPress={() => router.push({ pathname: '/chat', params: { targetId: convo.id, name: convo.name, avatar: convo.avatar } })}
                />
                {!!(index < conversations.length - 1) && <View style={styles.divider} />}
              </React.Fragment>
            ))
          )}
        </View>
      </Animated.ScrollView>

      {/* Blur top bar */}
      <Animated.View style={[styles.topBarBlur, { opacity: topBarOpacity }]}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deepNavy },

  scrollContent: { paddingBottom: 180 },

  /* ── Header ── */
  headerArea: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: 12,
    paddingBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: FONTS.bold as any,
    letterSpacing: 0.3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONTS.regular as any,
  },

  /* ── Top bar blur ── */
  topBarBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 44 : 56,
  },

  /* ── List ── */
  listArea: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 68,
  },

  /* ── Chat Row ── */
  rowContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 14,
    marginBottom: 2,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 85,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  deleteText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: FONTS.semibold as any,
  },
  chatRow: {
    backgroundColor: COLORS.deepNavy,
    borderRadius: 14,
  },
  chatRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },

  /* ── Avatar ── */
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.cardGlassBg,
    borderWidth: 1.5,
    borderColor: COLORS.cardGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGold: {
    borderColor: COLORS.goldMetallic,
    backgroundColor: 'rgba(207,181,59,0.06)',
  },
  avatarSilver: {
    borderColor: COLORS.silverMetallic,
    backgroundColor: 'rgba(192,192,192,0.06)',
  },
  avatarText: {
    color: COLORS.silver,
    fontSize: 16,
    fontWeight: FONTS.semibold as any,
  },
  onlineDotOuter: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.deepNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },

  /* ── Chat info ── */
  chatInfo: {
    flex: 1,
    gap: 3,
  },
  chatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chatName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: FONTS.semibold as any,
    flexShrink: 1,
  },
  allianceBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastMsg: {
    color: COLORS.silverLight,
    fontSize: 13,
    fontWeight: FONTS.regular as any,
  },

  /* ── Right ── */
  chatRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeText: {
    color: COLORS.silverDark,
    fontSize: 11,
    fontWeight: FONTS.regular as any,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: COLORS.deepNavy,
    fontSize: 11,
    fontWeight: FONTS.bold as any,
  },
});
