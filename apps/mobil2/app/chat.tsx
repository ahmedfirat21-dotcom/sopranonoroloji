import React, { useRef, useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { hapticLight } from '../utils/haptics';

const { width } = Dimensions.get('window');

import { getDirectMessages, sendDirectMessageAPI, DirectMessageData } from '../services/api';
import { useUser } from '../contexts/UserContext';
// Dummy data ve tip silindi, yerine DirectMessageData (API) kullanılıyor.

// ─────────────────────────────────────────────────────
// Alliance Invite Bar
// ─────────────────────────────────────────────────────
function AllianceInviteBar({ onPress }: { onPress: () => void }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: [0.3, 0.8, 0.3, 0.3],
  });

  return (
    <TouchableOpacity style={styles.allianceBar} activeOpacity={0.8} onPress={onPress}>
      <LinearGradient
        colors={['rgba(20,28,50,0.95)', 'rgba(15,22,40,0.98)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
      />
      <Animated.View style={[styles.allianceShimmer, { opacity: shimmerOpacity }]}>
        <LinearGradient
          colors={['transparent', COLORS.goldShimmer, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
      <Ionicons name="shield-checkmark" size={16} color={COLORS.goldMetallic} />
      <Text style={styles.allianceBarText}>Bu kişiyle İttifak Kur</Text>
      <Text style={styles.allianceBarSub}>(Birlikte kazan)</Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────
// Chat Bubble
// ─────────────────────────────────────────────────────
function ChatBubble({ message, isMine }: { message: DirectMessageData; isMine: boolean }) {
  const timeStr = new Date(message.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  if (isMine) {
    return (
      <View style={styles.bubbleRowMine}>
        <View style={styles.bubbleWrapMine}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark, '#1a9a9e']}
            style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 4 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.bubbleTextMine}>{message.content}</Text>
          <Text style={styles.bubbleTimeMine}>{timeStr}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bubbleRowOther}>
      <View style={styles.bubbleWrapOther}>
        <LinearGradient
          colors={['rgba(20,28,48,0.85)', 'rgba(15,22,38,0.90)']}
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 4, borderBottomRightRadius: 18 }]}
        />
        {/* Frosted edge */}
        <View style={styles.bubbleFrost} />
        <Text style={styles.bubbleTextOther}>{message.content}</Text>
        <Text style={styles.bubbleTimeOther}>{timeStr}</Text>
      </View>
    </View>
  );
}

// ═════════════════════════════════════════════════════
// CHAT SCREEN
// ═════════════════════════════════════════════════════
export default function ChatScreen() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams<any>();
  const finalTargetId = params.targetId || params.id;
  const name = params.name;
  const avatar = params.avatar;
  const isAlliance = params.isAlliance;
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<DirectMessageData[]>([]);
  const isAlly = isAlliance === '1';
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Entrance animation
  const slideIn = useRef(new Animated.Value(width * 0.3)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  // Load Messages
  useEffect(() => {
    if (finalTargetId) {
      getDirectMessages(finalTargetId, 50).then((data) => {
         setMessages(data);
         setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      });
    }
  }, [finalTargetId]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideIn, { toValue: 0, friction: 14, tension: 50, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Background — soft gradient */}
      <LinearGradient
        colors={[COLORS.deepNavy, '#070D1A', '#0A1020', '#060B18']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
      {/* Soft ambient glow */}
      <View style={styles.ambientGlow} />

      <Animated.View style={[{ flex: 1 }, { transform: [{ translateX: slideIn }], opacity: fadeIn }]}>
        {/* ═══ TOP BAR ═══ */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.silver} />
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <View style={styles.topBarAvatar}>
              <Text style={styles.topBarAvatarText}>{avatar || 'U'}</Text>
            </View>
            <View>
              <View style={styles.topBarNameRow}>
                <Text style={styles.topBarName}>{name || 'Kullanıcı'}</Text>
                {isAlly && <Ionicons name="shield-checkmark" size={14} color={COLORS.goldMetallic} />}
              </View>
              <Text style={styles.topBarStatus}>Çevrimiçi</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="ellipsis-vertical" size={18} color={COLORS.silver} />
          </TouchableOpacity>
        </View>

        {/* ═══ ALLIANCE INVITE (if not allied) ═══ */}
        {!isAlly && (
          <View style={styles.allianceBarWrap}>
            <AllianceInviteBar onPress={() => {}} />
          </View>
        )}

        {/* ═══ MESSAGES ═══ */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatScrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} isMine={msg.senderId === user?.id} />
          ))}
        </ScrollView>

        {/* ═══ FLOATING INPUT PILL ═══ */}
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <View style={styles.inputPill}>
            <LinearGradient
              colors={['rgba(12,18,36,0.92)', 'rgba(8,14,28,0.95)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
            />
            <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
              <Ionicons name="add" size={22} color={COLORS.silver} />
            </TouchableOpacity>
            <TextInput
              style={styles.inputField}
              placeholder="Mesaj yaz..."
              placeholderTextColor={COLORS.silverDark}
              selectionColor={COLORS.primary}
              value={messageText}
              onChangeText={setMessageText}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              activeOpacity={0.7}
              onPress={async () => {
                if (!messageText.trim() || !finalTargetId) return;
                hapticLight();
                const content = messageText.trim();
                setMessageText('');
                
                // Optimistic UI Update (Kendinde hemen göster)
                const tempMsg: DirectMessageData = {
                  id: `temp-${Date.now()}`,
                  content,
                  senderId: user?.id || '',
                  receiverId: finalTargetId,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                  sender: { id: user?.id || '', displayName: 'Ben' },
                };
                setMessages(prev => [...prev, tempMsg]);
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

                // API Çağrısı
                await sendDirectMessageAPI(finalTargetId, content);
              }}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.sendBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="send" size={16} color={COLORS.deepNavy} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deepNavy },

  ambientGlow: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: COLORS.primaryGlow,
    opacity: 0.04,
  },

  /* ── Top Bar ── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.04)',
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
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topBarAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardGlassBg,
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarAvatarText: {
    color: COLORS.silver,
    fontSize: 13,
    fontWeight: FONTS.semibold as any,
  },
  topBarNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  topBarName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: FONTS.semibold as any,
  },
  topBarStatus: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: FONTS.regular as any,
  },

  /* ── Alliance Bar ── */
  allianceBarWrap: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  allianceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(207,181,59,0.12)',
    overflow: 'hidden',
    position: 'relative',
  },
  allianceShimmer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  allianceBarText: {
    color: COLORS.goldLight,
    fontSize: 13,
    fontWeight: FONTS.semibold as any,
    zIndex: 1,
  },
  allianceBarSub: {
    color: COLORS.silverDark,
    fontSize: 11,
    fontWeight: FONTS.regular as any,
    zIndex: 1,
  },

  /* ── Chat Area ── */
  chatScroll: { flex: 1 },
  chatScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },

  /* ── Bubble Mine ── */
  bubbleRowMine: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  bubbleWrapMine: {
    maxWidth: '78%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  bubbleTextMine: {
    color: COLORS.deepNavy,
    fontSize: 14,
    fontWeight: FONTS.regular as any,
    lineHeight: 20,
  },
  bubbleTimeMine: {
    color: 'rgba(6,11,24,0.5)',
    fontSize: 10,
    fontWeight: FONTS.regular as any,
    textAlign: 'right',
    marginTop: 3,
  },

  /* ── Bubble Other ── */
  bubbleRowOther: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bubbleWrapOther: {
    maxWidth: '78%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  bubbleFrost: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  bubbleTextOther: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontWeight: FONTS.regular as any,
    lineHeight: 20,
    zIndex: 1,
  },
  bubbleTimeOther: {
    color: COLORS.silverDark,
    fontSize: 10,
    fontWeight: FONTS.regular as any,
    textAlign: 'right',
    marginTop: 3,
    zIndex: 1,
  },

  /* ── Floating Input ── */
  inputArea: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    height: 50,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingLeft: 4,
    paddingRight: 4,
    gap: 2,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONTS.regular as any,
    paddingHorizontal: 10,
  },
  sendBtn: {
    marginLeft: 2,
  },
  sendBtnGrad: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
});
