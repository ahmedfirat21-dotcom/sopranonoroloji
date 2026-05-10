import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Easing,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
// BlurView kaldırıldı — GPU yükü azaltıldı
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';
import { buySpeakerVisa, getLiveKitToken } from '../services/api';
import AlertBanner from './AlertBanner';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────
// Data — Authority Visas
// ─────────────────────────────────────────────────────
interface AuthorityVisa {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  price: number;
  desc: string;
}

const AUTHORITY_VISAS: AuthorityVisa[] = [
  { id: 'a1', name: 'Mikrofon Vizesi', icon: 'mic', price: 500, desc: 'Konuşma hakkı kazan' },
  { id: 'a2', name: 'Müzik Kontrolü', icon: 'musical-notes', price: 750, desc: 'DJ koltuğu al' },
  { id: 'a3', name: 'VIP Koltuk', icon: 'shield-checkmark', price: 1200, desc: 'Sahneye çık' },
  { id: 'a4', name: 'Moderatör', icon: 'hammer', price: 2000, desc: 'Oda yönetimi' },
  { id: 'a5', name: 'Sahne Işığı', icon: 'flashlight', price: 350, desc: 'Spotlight hakkı' },
  { id: 'a6', name: 'Oda Kilidi', icon: 'lock-closed', price: 1500, desc: 'Özel erişim ver' },
];

// ─────────────────────────────────────────────────────
// Data — Premium Gifts
// ─────────────────────────────────────────────────────
interface PremiumGift {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  price: number;
  color: string;
  glowColor: string;
}

const PREMIUM_GIFTS: PremiumGift[] = [
  { id: 'g1', name: 'Kristal Kadeh', icon: 'wine', price: 200, color: '#B0E0E6', glowColor: 'rgba(176,224,230,0.3)' },
  { id: 'g2', name: 'Neon Mikrofon', icon: 'mic', price: 500, color: COLORS.primary, glowColor: COLORS.primaryGlow },
  { id: 'g3', name: 'Gümüş Taç', icon: 'trophy', price: 1000, color: '#C0C0C0', glowColor: 'rgba(192,192,192,0.3)' },
  { id: 'g4', name: 'Elmas Yıldız', icon: 'diamond', price: 2500, color: COLORS.primary, glowColor: COLORS.primaryGlow },
  { id: 'g5', name: 'Platin Kalkan', icon: 'shield', price: 1500, color: '#E8E8E8', glowColor: 'rgba(232,232,232,0.25)' },
  { id: 'g6', name: 'Safir Küre', icon: 'globe', price: 3000, color: '#4FC3F7', glowColor: 'rgba(79,195,247,0.3)' },
];

// ─────────────────────────────────────────────────────
// Alliance Banner — glass notification
// ─────────────────────────────────────────────────────
function AllianceBanner({
  message,
  combo,
  visible,
  onHide,
}: {
  message: string;
  combo: number;
  visible: boolean;
  onHide: () => void;
}) {
  const slideX = useRef(new Animated.Value(-width)).current;
  const comboScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.spring(slideX, {
        toValue: 0,
        friction: 12,
        tension: 50,
        useNativeDriver: true,
      }).start();

      // Combo bounce
      Animated.sequence([
        Animated.timing(comboScale, { toValue: 1.4, duration: 200, useNativeDriver: true }),
        Animated.spring(comboScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();

      // Auto hide after 3s
      setTimeout(() => {
        Animated.timing(slideX, {
          toValue: -width,
          duration: 400,
          useNativeDriver: true,
        }).start(() => onHide());
      }, 3000);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.bannerContainer, { transform: [{ translateX: slideX }] }]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: 'rgba(8,14,28,0.92)' }]} />
      <LinearGradient
        colors={['rgba(92,225,230,0.08)', 'transparent']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <Text style={styles.bannerText}>{message}</Text>
      {combo > 1 && (
        <Animated.Text style={[styles.bannerCombo, { transform: [{ scale: comboScale }] }]}>
          x{combo}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────
// Particle Flight Animation
// ParticleFlight kaldırıldı — yerine LottieGiftOverlay kullanılıyor

// ═════════════════════════════════════════════════════
// GIFT VAULT SHEET
// ═════════════════════════════════════════════════════
interface GiftVaultSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Hediye gönderildiğinde Lottie animasyonu tetikler */
  onPlayAnimation?: (giftId: string) => void;
  onSendGift?: (giftId: string) => void;
  roomId?: string;
  userId?: string;
}

export default function GiftVaultSheet({ visible, onClose, onPlayAnimation, onSendGift, roomId, userId }: GiftVaultSheetProps) {
  const { colors: C, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'authority' | 'gifts'>('gifts');
  const [selectedAuthority, setSelectedAuthority] = useState<string | null>(null);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);

  // Animations
  const sheetY = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Particle state kaldırıldı — Lottie overlay room.tsx'te yönetiliyor

  // Banner state
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [combo, setCombo] = useState(1);

  // API state
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success' | 'warning'>('error');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetY, {
          toValue: 0,
          friction: 14,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      sheetY.setValue(height);
      overlayOpacity.setValue(0);
    }
  }, [visible]);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
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

  const handlePurchase = useCallback(async () => {
    if (isLoading) return;

    if (activeTab === 'authority' && selectedAuthority) {
      const visa = AUTHORITY_VISAS.find((v) => v.id === selectedAuthority);
      if (!visa) return;

      // Mikrofon Vizesi ise API çağrısı yap
      if (visa.id === 'a1') {
        setIsLoading(true);
        try {
          if (!userId || !roomId) throw new Error('Oda veya kullanıcı bilgisi eksik.');
          const result = await buySpeakerVisa(userId, roomId);

          if (result.success && result.data) {
            // Başarılı — Lottie animasyonu tetikle
            setBannerMessage(`${visa.name} satın alındı! Yeni bakiye: ${result.data.walletBalance}`);
            setCombo((prev) => prev + 1);
            closeSheet();
            setTimeout(() => onPlayAnimation?.('g2'), 400);

            // LiveKit token al (speaker rolüyle)
            const tokenResult = await getLiveKitToken(
              roomId,
              userId,
              'speaker',
            );

            if (tokenResult.token) {
              // Token alındı — LiveKit SDK'ya bağlanabilir
              console.log('[LiveKit] Speaker token alındı:', tokenResult.grants);
              // TODO: LiveKit SDK entegrasyonu
            }
          } else {
            // Hata — AlertBanner göster
            const errorMsg = result.error === 'Yetersiz bakiye'
              ? `Jetonun yetersiz. ${result.deficit || ''} jeton daha gerekiyor.`
              : result.error || 'Bir hata oluştu';

            setAlertMessage(errorMsg);
            setAlertType(result.error === 'Yetersiz bakiye' ? 'warning' : 'error');
            setAlertVisible(true);
          }
        } catch (err: any) {
          setAlertMessage('Ağ hatası oluştu. Lütfen tekrar dene.');
          setAlertType('error');
          setAlertVisible(true);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Diğer yetki vizeleri (henüz API yok)
      setBannerMessage(`${visa.name} satın aldı!`);
    } else if (activeTab === 'gifts' && selectedGift) {
      const gift = PREMIUM_GIFTS.find((g) => g.id === selectedGift);
      if (gift) {
        setBannerMessage(`${gift.name} gönderdi!`);
      }
    }
    if (activeTab === 'gifts' && selectedGift) {
      if (onSendGift) onSendGift(selectedGift);
    }
    
    setCombo((prev) => prev + 1);
    closeSheet();
    // Lottie animasyonu tetikle
    const animGiftId = activeTab === 'gifts' && selectedGift ? selectedGift : 'g2';
    setTimeout(() => onPlayAnimation?.(animGiftId), 400);
  }, [activeTab, selectedAuthority, selectedGift, closeSheet, isLoading, onSendGift]);

  // Lottie bittiğinde banner göster (room.tsx'ten tetiklenir)
  // Banner'ı sheet kapandıktan sonra doğrudan göster
  useEffect(() => {
    // Banner'ı animasyon tetiklendikten 3.5sn sonra göster
  }, []);

  const hasSelection =
    (activeTab === 'authority' && selectedAuthority) ||
    (activeTab === 'gifts' && selectedGift);

  if (!visible && !bannerVisible) return null;

  return (
    <>
      {/* Alert Banner (API hata bildirimi) */}
      <AlertBanner
        visible={alertVisible}
        message={alertMessage}
        type={alertType}
        actionLabel={alertType === 'warning' ? 'Yükle' : undefined}
        onAction={() => {
          setAlertVisible(false);
          // TODO: Cüzdan ekranına yönlendir
        }}
        onHide={() => setAlertVisible(false)}
      />

      {/* ParticleFlight kaldırıldı — LottieGiftOverlay room.tsx'te */}

      {/* Alliance Banner (Z-index top) */}
      <AllianceBanner
        message={bannerMessage}
        combo={combo}
        visible={bannerVisible}
        onHide={() => setBannerVisible(false)}
      />

      {/* Modal */}
      {visible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 300 }]}>
          {/* Overlay */}
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeSheet}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
            <View style={styles.overlayDark} />
          </Animated.View>

          {/* ─── Sheet ─── */}
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
          >
            {/* Background */}
            <LinearGradient
              colors={['#0C1428', '#080E1E', '#060A16']}
              style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}
            />

            {/* Top glow */}
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

            {/* ═══ PILL TABS ═══ */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'authority' && styles.tabActive]}
                onPress={() => { setActiveTab('authority'); setSelectedGift(null); }}
                activeOpacity={0.8}
              >
                {activeTab === 'authority' ? (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                ) : null}
                <Text style={[styles.tabText, activeTab === 'authority' && styles.tabTextActive]}>
                  Mülkiyet Yetkileri
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'gifts' && styles.tabActive]}
                onPress={() => { setActiveTab('gifts'); setSelectedAuthority(null); }}
                activeOpacity={0.8}
              >
                {activeTab === 'gifts' ? (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                ) : null}
                <Text style={[styles.tabText, activeTab === 'gifts' && styles.tabTextActive]}>
                  Lüks Koleksiyon
                </Text>
              </TouchableOpacity>
            </View>

            {/* ═══ CONTENT ═══ */}
            {activeTab === 'authority' ? (
              <View style={styles.gridContainer}>
                {AUTHORITY_VISAS.map((visa) => {
                  const isSelected = selectedAuthority === visa.id;
                  return (
                    <TouchableOpacity
                      key={visa.id}
                      style={[
                        styles.authorityCard,
                        isSelected && styles.authorityCardSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedAuthority(visa.id)}
                    >
                      {/* Inner shadow gradient */}
                      <LinearGradient
                        colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.15)']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                        start={{ x: 0.3, y: 0 }}
                        end={{ x: 0.7, y: 1 }}
                      />
                      {isSelected && (
                        <View style={styles.cardGlowBorder} />
                      )}
                      <Ionicons name={visa.icon} size={26} color={COLORS.silver} />
                      <Text style={styles.authorityName}>{visa.name}</Text>
                      <Text style={styles.authorityDesc}>{visa.desc}</Text>
                      <View style={styles.priceRow}>
                        <Ionicons name="diamond" size={12} color={COLORS.primary} />
                        <Text style={styles.priceText}>{visa.price}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.giftGridContainer}>
                {PREMIUM_GIFTS.map((gift) => {
                  const isSelected = selectedGift === gift.id;
                  return (
                    <TouchableOpacity
                      key={gift.id}
                      style={[
                        styles.giftCard,
                        isSelected && styles.giftCardSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedGift(gift.id)}
                    >
                      {isSelected && (
                        <View style={[styles.cardGlowBorder, { borderRadius: 16 }]} />
                      )}
                      {/* 3D Icon with glow */}
                      <View style={[styles.giftIconWrapper, { shadowColor: gift.color }]}>
                        <View style={[styles.giftIconGlow, { backgroundColor: gift.glowColor }]} />
                        <Ionicons name={gift.icon} size={32} color={gift.color} />
                      </View>
                      <Text style={styles.giftName}>{gift.name}</Text>
                      <View style={styles.priceRow}>
                        <Ionicons name="diamond" size={11} color={COLORS.primary} />
                        <Text style={styles.priceText}>{gift.price}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ═══ ACTION BUTTON ═══ */}
            <View style={[styles.actionArea, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  !hasSelection && styles.actionButtonDisabled,
                ]}
                activeOpacity={hasSelection ? 0.8 : 1}
                onPress={hasSelection ? handlePurchase : undefined}
              >
                <LinearGradient
                  colors={
                    hasSelection
                      ? [COLORS.primary, COLORS.primaryDark]
                      : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']
                  }
                  style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                {hasSelection && (
                  <View style={styles.actionGlow} />
                )}
                <Ionicons
                  name={activeTab === 'authority' ? 'shield-checkmark' : 'paper-plane'}
                  size={20}
                  color={hasSelection ? COLORS.deepNavy : COLORS.silverDark}
                />
                <Text
                  style={[
                    styles.actionText,
                    hasSelection && styles.actionTextActive,
                  ]}
                >
                  {activeTab === 'authority' ? 'Yetkiyi Satın Al' : 'Gönder'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </>
  );
}

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const styles = StyleSheet.create({
  /* ── Overlay ── */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
  },
  overlayDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  /* ── Sheet ── */
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.72,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    zIndex: 301,
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
    marginBottom: 8,
  },

  /* ── Tabs ── */
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 22,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
  },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabActive: {},
  tabText: {
    color: COLORS.silverDark,
    fontSize: 13,
    fontWeight: FONTS.medium as any,
    zIndex: 1,
  },
  tabTextActive: {
    color: COLORS.deepNavy,
    fontWeight: FONTS.bold as any,
  },

  /* ── Authority Grid (2 col) ── */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  authorityCard: {
    width: (width - SPACING.md * 2 - 10) / 2,
    backgroundColor: 'rgba(15,22,40,0.9)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 6,
    overflow: 'hidden',
  },
  authorityCardSelected: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  authorityName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: FONTS.semibold as any,
  },
  authorityDesc: {
    color: COLORS.silverDark,
    fontSize: 10,
    fontWeight: FONTS.regular as any,
  },

  /* ── Gift Grid (3 col) ── */
  giftGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  giftCard: {
    width: (width - SPACING.md * 2 - 20) / 3,
    backgroundColor: 'rgba(15,22,40,0.9)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  giftCardSelected: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  giftIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    position: 'relative',
  },
  giftIconGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  giftName: {
    color: COLORS.silver,
    fontSize: 11,
    fontWeight: FONTS.medium as any,
    textAlign: 'center',
  },

  /* ── Shared ── */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: FONTS.bold as any,
  },
  cardGlowBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },

  /* ── Action Button ── */
  actionArea: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  actionButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionGlow: {
    position: 'absolute',
    width: '60%',
    height: '200%',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -20,
  },
  actionText: {
    color: COLORS.silverDark,
    fontSize: 16,
    fontWeight: FONTS.semibold as any,
  },
  actionTextActive: {
    color: COLORS.deepNavy,
    fontWeight: FONTS.bold as any,
  },

  /* ── Particle ── */
  particleIcon: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.3,
  },
  sparkContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkLine: {
    position: 'absolute',
    width: 2,
    height: 8,
    borderRadius: 1,
  },

  /* ── Banner ── */
  bannerContainer: {
    position: 'absolute',
    top: height * 0.12,
    left: SPACING.md,
    right: SPACING.md * 4,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.heroCardBorder,
    overflow: 'hidden',
    zIndex: 100,
  },
  bannerText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: FONTS.medium as any,
    flex: 1,
  },
  bannerCombo: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: FONTS.heavy as any,
    marginLeft: 8,
  },
});
