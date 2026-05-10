import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  PanResponder,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// BlurView kaldırıldı — GPU yükü azaltıldı
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';
import { useRouter } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { hapticSuccess, hapticError } from '../utils/haptics';
import { createRoom } from '../services/api';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────
const ROOM_CATEGORIES = [
  { id: 'sohbet', label: '#Sohbet', icon: 'chatbubble-ellipses' as const },
  { id: 'muzik', label: '#Müzik', icon: 'musical-notes' as const },
  { id: 'yatirim', label: '#Yatırım', icon: 'trending-up' as const },
  { id: 'ozel', label: '#Özel', icon: 'lock-closed' as const },
];

const CAPACITY_OPTIONS = [4, 6, 8, 12];

// ─────────────────────────────────────────────────────
// Shimmer Sweep for Ignition Button
// ─────────────────────────────────────────────────────
function IgnitionShimmer() {
  const shimmerX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(shimmerX, {
          toValue: width,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerX, {
          toValue: -width,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.18)', 'transparent']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────
// Ignition Glow (behind button)
// ─────────────────────────────────────────────────────
// IgnitionGlow — loop kaldırıldı, sabit opacity
function IgnitionGlow() {
  return (
    <View style={[styles.ignitionGlow, { opacity: 0.5 }]} />
  );
}

// ═════════════════════════════════════════════════════
// CREATE ROOM SHEET
// ═════════════════════════════════════════════════════
interface CreateRoomSheetProps {
  visible: boolean;
  onClose: () => void;
  onRoomCreated?: () => void;
}

export default function CreateRoomSheet({ visible, onClose, onRoomCreated }: CreateRoomSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const [roomTitle, setRoomTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('sohbet');
  const [selectedCapacity, setSelectedCapacity] = useState(8);
  const [visaOnly, setVisaOnly] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const sheetY = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY, { toValue: 0, friction: 14, tension: 45, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    } else {
      sheetY.setValue(height);
      overlayOpacity.setValue(0);
    }
  }, [visible]);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetY, { toValue: height, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onClose());
  }, [onClose]);

  // ── Swipe-to-dismiss PanResponder ──
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
    onPanResponderMove: (_, g) => {
      if (g.dy > 0) sheetY.setValue(g.dy);
    },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80 || g.vy > 0.5) {
        closeSheet();
      } else {
        Animated.spring(sheetY, { toValue: 0, friction: 14, tension: 45, useNativeDriver: true }).start();
      }
    },
  }), [closeSheet]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeSheet}
    >
    <View style={StyleSheet.absoluteFill}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeSheet} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
        <View style={styles.overlayDark} />
      </Animated.View>

      {/* Sheet */}
      <KeyboardAvoidingView
        style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
        {/* Background */}
        <LinearGradient
          colors={['#0C1428', '#080E1E', '#060A16']}
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 32, borderTopRightRadius: 32 }]}
        />

        {/* Top glow line */}
        <LinearGradient
          colors={['transparent', COLORS.primaryGlow, 'transparent']}
          style={styles.sheetTopGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        {/* Drag handle — swipe-to-dismiss (geniş dokunma alanı) */}
        <View
          {...panResponder.panHandlers}
          style={{ paddingVertical: 12, alignItems: 'center' as const }}
        >
          <View style={styles.dragHandle} />
        </View>

        <ScrollView 
          style={{ flexShrink: 1, width: '100%' }} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ═══ HEADER ═══ */}
          <Text style={styles.sheetTitle}>Loca Kur</Text>
          <Text style={styles.sheetSubtitle}>Kendi VIP mekanını oluştur</Text>

          {/* ═══ COVER PHOTO AREA ═══ */}
          <TouchableOpacity style={styles.coverArea} activeOpacity={0.7}>
            <LinearGradient
              colors={['rgba(8,14,28,0.95)', 'rgba(12,18,36,0.90)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
            />
            {/* Inner shadow effect */}
            <LinearGradient
              colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.15)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.cameraIconWrap}>
              <Ionicons name="camera" size={28} color={COLORS.silverDark} />
            </View>
            <Text style={styles.coverText}>Kapak Fotoğrafı Ekle</Text>
          </TouchableOpacity>

          {/* ═══ TITLE INPUT ═══ */}
          <View style={[styles.titleInputWrap, inputFocused && styles.titleInputFocused]}>
            <TextInput
              style={styles.titleInput}
              placeholder="Loca Başlığı..."
              placeholderTextColor={COLORS.silverDark}
              selectionColor={COLORS.primary}
              value={roomTitle}
              onChangeText={setRoomTitle}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              maxLength={40}
            />
            <Text style={styles.charCount}>{roomTitle.length}/40</Text>
          </View>

          {/* ═══ CATEGORY CHIPS ═══ */}
          <Text style={styles.sectionLabel}>Kategori</Text>
          <View style={styles.chipRow}>
            {ROOM_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, isActive && styles.chipActive]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  {isActive && <View style={styles.chipGlow} />}
                  <Ionicons
                    name={cat.icon}
                    size={14}
                    color={isActive ? COLORS.primary : COLORS.silverDark}
                  />
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ═══ CAPACITY ═══ */}
          <Text style={styles.sectionLabel}>Koltuk Sayısı</Text>
          <View style={styles.capacityRow}>
            {CAPACITY_OPTIONS.map((cap) => {
              const isActive = selectedCapacity === cap;
              return (
                <TouchableOpacity
                  key={cap}
                  style={[styles.capacityBtn, isActive && styles.capacityBtnActive]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCapacity(cap)}
                >
                  {isActive && (
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                  <Text style={[styles.capacityNum, isActive && styles.capacityNumActive]}>
                    {cap}
                  </Text>
                  <Text style={[styles.capacitySub, isActive && styles.capacitySubActive]}>
                    kişi
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ═══ VISA TOGGLE ═══ */}
          <View style={styles.visaRow}>
            <View style={styles.visaLeft}>
              <View style={styles.visaIconWrap}>
                <Ionicons name="lock-closed" size={18} color={COLORS.goldMetallic} />
              </View>
              <View>
                <Text style={styles.visaTitle}>Sadece Vizeliler Girebilir</Text>
                <Text style={styles.visaSub}>Giriş için vize gereksin</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.toggle, visaOnly && styles.toggleActive]}
              activeOpacity={0.8}
              onPress={() => setVisaOnly(!visaOnly)}
            >
              <LinearGradient
                colors={visaOnly ? [COLORS.primary, COLORS.primaryDark] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <View style={[styles.toggleThumb, visaOnly && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          {/* ═══ DESCRIPTION ═══ */}
          <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>Açıklama (opsiyonel)</Text>
          <View style={styles.descInputWrap}>
            <TextInput
              style={styles.descInput}
              placeholder="Locanız hakkında kısa bir açıklama..."
              placeholderTextColor={COLORS.silverDark}
              selectionColor={COLORS.primary}
              multiline
              maxLength={120}
              textAlignVertical="top"
            />
          </View>

          {/* ═══ TAGS ═══ */}
          <Text style={[styles.sectionLabel, { marginTop: SPACING.sm }]}>Etiketler</Text>
          <View style={styles.chipRow}>
            {['🎶 Canlı Müzik', '💬 Sohbet', '🎮 Oyun', '📚 Kültür', '🏆 Yarışma', '🌙 Gece'].map(tag => (
              <TouchableOpacity key={tag} style={styles.chip} activeOpacity={0.7}>
                <Text style={styles.chipText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Spacer */}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ═══ IGNITION BUTTON ═══ */}
        <View style={[styles.ignitionArea, { paddingBottom: Math.max(insets.bottom, 12) + SPACING.md }]}>
          <IgnitionGlow />
          <TouchableOpacity
            style={[styles.ignitionBtn, isCreating && { opacity: 0.6 }]}
            activeOpacity={0.85}
            disabled={isCreating}
            onPress={async () => {
              if (!roomTitle.trim()) {
                Alert.alert('Loca İsmi', 'Lütfen locanıza bir isim verin');
                hapticError();
                return;
              }
              if (!user?.id) {
                Alert.alert('Giriş Gerekli', 'Oda oluşturmak için giriş yapmalısınız');
                hapticError();
                return;
              }

              setIsCreating(true);
              const result = await createRoom({
                name: roomTitle.trim(),
                category: selectedCategory,
                maxParticipants: selectedCapacity,
                speakerVisaPrice: visaOnly ? 500 : 0,
                ownerId: user.id,
              });
              setIsCreating(false);

              if (result.success && result.room) {
                hapticSuccess();
                onRoomCreated?.();
                closeSheet();
                setTimeout(() => {
                  router.push({ pathname: '/room', params: { id: result.room!.id, title: result.room!.name } });
                }, 350);
              } else {
                hapticError();
                Alert.alert('Hata', result.error || 'Oda oluşturulamadı');
              }
            }}
          >
            <LinearGradient
              colors={[COLORS.primary, '#2BB8BD', COLORS.primaryDark, '#0A5E60']}
              style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <IgnitionShimmer />
            {isCreating ? (
              <ActivityIndicator color={COLORS.deepNavy} size="small" style={{ zIndex: 1 }} />
            ) : (
              <Ionicons name="radio" size={20} color={COLORS.deepNavy} style={{ zIndex: 1 }} />
            )}
            <Text style={styles.ignitionText}>{isCreating ? 'Oluşturuluyor...' : 'Locayı Aç — Yayını Başlat'}</Text>
          </TouchableOpacity>
        </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  overlayDark: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },

  sheet: {
    width: '100%',
    maxHeight: height * 0.88,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    zIndex: 100,
  },
  sheetTopGlow: {
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
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },

  /* ── Header ── */
  sheetTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: FONTS.bold as any,
    textAlign: 'center',
    marginTop: 4,
  },
  sheetSubtitle: {
    color: COLORS.silverDark,
    fontSize: 13,
    fontWeight: FONTS.regular as any,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },

  /* ── Cover ── */
  coverArea: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: SPACING.md,
    gap: 6,
  },
  cameraIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: {
    color: COLORS.silverDark,
    fontSize: 12,
    fontWeight: FONTS.medium as any,
  },

  /* ── Title Input ── */
  titleInputWrap: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleInputFocused: {
    borderColor: COLORS.primaryStroke,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  titleInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: FONTS.semibold as any,
    height: 50,
  },
  charCount: {
    color: COLORS.silverDark,
    fontSize: 11,
  },

  /* ── Section ── */
  sectionLabel: {
    color: COLORS.silver,
    fontSize: 14,
    fontWeight: FONTS.semibold as any,
    marginBottom: SPACING.sm,
  },

  /* ── Chips ── */
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
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
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  chipText: {
    color: COLORS.silverDark,
    fontSize: 13,
    fontWeight: FONTS.medium as any,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: FONTS.semibold as any,
  },

  /* ── Capacity ── */
  capacityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  capacityBtn: {
    flex: 1,
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  capacityBtnActive: {
    borderColor: 'transparent',
  },
  capacityNum: {
    color: COLORS.silverLight,
    fontSize: 18,
    fontWeight: FONTS.bold as any,
    zIndex: 1,
  },
  capacityNumActive: {
    color: COLORS.deepNavy,
  },
  capacitySub: {
    color: COLORS.silverDark,
    fontSize: 9,
    fontWeight: FONTS.regular as any,
    zIndex: 1,
  },
  capacitySubActive: {
    color: 'rgba(6,11,24,0.6)',
  },

  /* ── Visa Toggle ── */
  visaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(207,181,59,0.08)',
  },
  visaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  visaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(207,181,59,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visaTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: FONTS.semibold as any,
  },
  visaSub: {
    color: COLORS.silverDark,
    fontSize: 11,
    fontWeight: FONTS.regular as any,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  toggleActive: {},
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.silverDark,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  /* ── Ignition ── */
  ignitionArea: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    position: 'relative',
    alignItems: 'center',
  },
  ignitionGlow: {
    position: 'absolute',
    top: 4,
    left: width * 0.15,
    right: width * 0.15,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryGlow,
  },
  ignitionBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
    zIndex: 1,
  },
  ignitionText: {
    color: COLORS.deepNavy,
    fontSize: 16,
    fontWeight: FONTS.bold as any,
    letterSpacing: 0.3,
    zIndex: 1,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 90,
  },

  /* ── Description ── */
  descInputWrap: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: SPACING.md,
    minHeight: 72,
  },
  descInput: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONTS.regular as any,
    minHeight: 52,
  },
});
