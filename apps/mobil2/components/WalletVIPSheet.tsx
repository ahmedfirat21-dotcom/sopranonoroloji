import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Easing,
  ScrollView,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';
import { getOfferings, purchasePackage, fetchBalance, CoinPackageOffering } from '../services/purchases';
import AlertBanner from './AlertBanner';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────
// Coin Packages
// ─────────────────────────────────────────────────────
interface CoinPackage {
  id: string;
  coins: number;
  price: string;
  popular?: boolean;
  bonusPercent?: number;
}

const COIN_PACKAGES: CoinPackage[] = [
  { id: 'c1', coins: 100, price: '₺29.99' },
  { id: 'c2', coins: 500, price: '₺99.99', popular: true, bonusPercent: 10 },
  { id: 'c3', coins: 1000, price: '₺179.99', bonusPercent: 15 },
  { id: 'c4', coins: 2500, price: '₺399.99', bonusPercent: 20 },
  { id: 'c5', coins: 5000, price: '₺699.99', bonusPercent: 25 },
  { id: 'c6', coins: 10000, price: '₺1,199.99', bonusPercent: 35 },
];

// ─────────────────────────────────────────────────────
// 3D Diamond Icon (Jeton)
// ─────────────────────────────────────────────────────
function DiamondIcon3D({ size = 48 }: { size?: number }) {
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.diamond3d, { width: size, height: size }]}>
      {/* Outer glow */}
      <Animated.View style={[styles.diamondGlow, { width: size * 1.6, height: size * 1.6, borderRadius: size * 0.8, opacity: pulse }]} />
      {/* Diamond body */}
      <LinearGradient
        colors={[COLORS.primary, '#3DD8DD', COLORS.primaryDark]}
        style={[styles.diamondBody, { width: size, height: size, borderRadius: size * 0.25 }]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        {/* Inner highlight */}
        <LinearGradient
          colors={['rgba(255,255,255,0.35)', 'transparent']}
          style={[styles.diamondHighlight, { borderRadius: size * 0.25 }]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 0.5 }}
        />
        <Ionicons name="diamond" size={size * 0.55} color="rgba(255,255,255,0.95)" />
      </LinearGradient>
      {/* Shadow beneath */}
      <View style={[styles.diamondShadow, { width: size * 0.7, height: 6, borderRadius: 3, bottom: -4 }]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Gold Border Animation for Popular Card
// ─────────────────────────────────────────────────────
function GoldBorderAnim() {
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

  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.4],
  });

  return (
    <Animated.View style={[styles.goldBorder, { opacity }]}>
      <LinearGradient
        colors={[COLORS.goldMetallic, COLORS.goldLight, COLORS.goldMetallic]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────
// Shimmer Effect for CTA Button
// ─────────────────────────────────────────────────────
function ShimmerOverlay() {
  const shimmerX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(shimmerX, {
          toValue: width,
          duration: 1200,
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
      style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerX }] }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────
// VIP Card Holographic Effect
// ─────────────────────────────────────────────────────
function VIPHolographicCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const holoOpacity = shimmer.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0.05, 0.15, 0.05, 0.15],
  });

  return (
    <View style={styles.vipCard}>
      {/* Base gradient — dark metallic */}
      <LinearGradient
        colors={['#1A1F35', '#0F1525', '#1A1F35', '#141830']}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Inner shadow top */}
      <LinearGradient
        colors={['rgba(207,181,59,0.08)', 'transparent']}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      {/* Inner shadow bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.25)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
        start={{ x: 0.5, y: 0.6 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Holographic sweeping light */}
      <Animated.View style={[styles.holoSweep, { opacity: holoOpacity }]}>
        <LinearGradient
          colors={['transparent', COLORS.goldShimmer, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.vipContent}>
        {/* Crown icon */}
        <View style={styles.vipCrownWrapper}>
          <LinearGradient
            colors={[COLORS.goldMetallic, COLORS.goldLight, COLORS.goldMetallic]}
            style={styles.vipCrownBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="shield-checkmark" size={28} color="#1A1F35" />
          </LinearGradient>
        </View>

        <View style={styles.vipTextArea}>
          <Text style={styles.vipTitle}>Soprano VIP Vatandaşı Ol</Text>
          <Text style={styles.vipSubtitle}>
            Sınırsız yetki, özel rozetler ve ayrıcalıklar
          </Text>
        </View>

        {/* Price */}
        <View style={styles.vipPriceRow}>
          <Text style={styles.vipPrice}>₺249.99</Text>
          <Text style={styles.vipPricePeriod}>/ay</Text>
        </View>

        {/* Features */}
        <View style={styles.vipFeatures}>
          {['VIP Rozet & Taç', 'Sınırsız Oda Kurma', 'Özel Hediye Seti', '+50% Bonus Jeton'].map((feat, i) => (
            <View key={i} style={styles.vipFeatureRow}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.goldMetallic} />
              <Text style={styles.vipFeatureText}>{feat}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Gold edge lines */}
      <View style={styles.vipEdgeTop} />
      <View style={styles.vipEdgeBottom} />
    </View>
  );
}

// ═════════════════════════════════════════════════════
// WALLET VIP SHEET
// ═════════════════════════════════════════════════════
interface WalletVIPSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function WalletVIPSheet({ visible, onClose }: WalletVIPSheetProps) {
  const { colors: C, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'coins' | 'vip'>('coins');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // IAP state
  const [offerings, setOfferings] = useState<CoinPackageOffering[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(1250);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'success' | 'warning'>('error');

  // Counting-up animation ref
  const balanceAnimValue = useRef(new Animated.Value(1250)).current;
  const [animatedBalance, setAnimatedBalance] = useState('1.250');

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

  // Offerings yükle
  useEffect(() => {
    if (visible) {
      getOfferings().then(setOfferings);
    }
  }, [visible]);

  // Counting-up listener
  useEffect(() => {
    const id = balanceAnimValue.addListener(({ value }) => {
      setAnimatedBalance(Math.floor(value).toLocaleString('tr-TR'));
    });
    return () => balanceAnimValue.removeListener(id);
  }, []);

  // countUp fonksiyonu
  const countUpBalance = useCallback((newBalance: number) => {
    Animated.timing(balanceAnimValue, {
      toValue: newBalance,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setDisplayBalance(newBalance);
    });
  }, []);

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

  const selectedPkg = offerings.length > 0
    ? offerings.find(p => p.id === selectedPackage)
    : COIN_PACKAGES.find(p => p.id === selectedPackage);

  // ─── Satın Alma Aksiyonu ───
  const handlePurchase = useCallback(async () => {
    if (isLoading) return;

    if (activeTab === 'coins' && selectedPackage) {
      const pkg = offerings.find(p => p.id === selectedPackage);
      if (!pkg) return;

      setIsLoading(true);
      try {
        const result = await purchasePackage(pkg);

        if (result.success) {
          // Ödeme başarılı — webhook'un işlemesi için 2s bekle
          setAlertMessage(`${pkg.coins.toLocaleString()} jeton yükleniyor...`);
          setAlertType('success');
          setAlertVisible(true);

          await new Promise(r => setTimeout(r, 2000));

          // Yeni bakiyeyi al ve counting-up animasyonu başlat
          const balanceInfo = await fetchBalance('current-user-id');
          if (balanceInfo) {
            countUpBalance(balanceInfo.balance);
          } else {
            // Fallback: mevcut bakiyeye jeton ekle
            const newBalance = displayBalance + pkg.coins + Math.floor(pkg.coins * pkg.bonusPercent / 100);
            countUpBalance(newBalance);
          }

          setAlertMessage(`${pkg.coins.toLocaleString()} jeton başarıyla yüklendi!`);
          setAlertType('success');
          setAlertVisible(true);
        } else if (result.cancelled) {
          // İptal
          setAlertMessage('Ödeme iptal edildi');
          setAlertType('warning');
          setAlertVisible(true);
        } else {
          // Hata
          setAlertMessage(result.error || 'Ödeme başarısız oldu');
          setAlertType('error');
          setAlertVisible(true);
        }
      } catch (err: any) {
        setAlertMessage('Bir hata oluştu. Lütfen tekrar dene.');
        setAlertType('error');
        setAlertVisible(true);
      } finally {
        setIsLoading(false);
      }
    } else if (activeTab === 'vip') {
      // VIP satın alma (ileride)
      closeSheet();
    }
  }, [activeTab, selectedPackage, offerings, isLoading, displayBalance, countUpBalance, closeSheet]);

  if (!visible) return null;

  return (
    <>
      {/* AlertBanner */}
      <AlertBanner
        visible={alertVisible}
        message={alertMessage}
        type={alertType}
        actionLabel={alertType === 'error' ? 'Tekrar Dene' : undefined}
        onAction={() => {
          setAlertVisible(false);
          if (activeTab === 'coins' && selectedPackage) handlePurchase();
        }}
        onHide={() => setAlertVisible(false)}
      />

    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeSheet} />
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.overlayDark} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
        {/* Background */}
        <LinearGradient
          colors={['#0C1428', '#080E1E', '#060A16']}
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 32, borderTopRightRadius: 32 }]}
        />

        {/* Top glow */}
        <LinearGradient
          colors={['transparent', activeTab === 'vip' ? COLORS.goldGlow : COLORS.primaryGlow, 'transparent']}
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
            style={[styles.tab, activeTab === 'coins' && styles.tabActive]}
            onPress={() => setActiveTab('coins')}
            activeOpacity={0.8}
          >
            {activeTab === 'coins' && (
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <Ionicons name="diamond-outline" size={16} color={activeTab === 'coins' ? COLORS.deepNavy : COLORS.silverDark} style={{ zIndex: 1 }} />
            <Text style={[styles.tabText, activeTab === 'coins' && styles.tabTextActive]}>Jeton Yükle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'vip' && styles.tabActive]}
            onPress={() => setActiveTab('vip')}
            activeOpacity={0.8}
          >
            {activeTab === 'vip' && (
              <LinearGradient
                colors={[COLORS.goldMetallic, COLORS.goldLight]}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <Ionicons name="shield-checkmark" size={16} color={activeTab === 'vip' ? '#1A1F35' : COLORS.silverDark} style={{ zIndex: 1 }} />
            <Text style={[styles.tabText, activeTab === 'vip' && styles.tabTextVipActive]}>VIP Vatandaşlık</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'coins' ? (
            <>
              {/* ═══ HERO BALANCE ═══ */}
              <View style={styles.heroBalance}>
                <DiamondIcon3D size={52} />
                <View style={styles.balanceTextCol}>
                  <Text style={styles.balanceLabel}>Mevcut Bakiye</Text>
                  <Text style={styles.balanceAmount}>{animatedBalance}</Text>
                </View>
              </View>

              {/* ═══ COIN PACKAGES GRID ═══ */}
              <Text style={styles.sectionLabel}>Jeton Paketleri</Text>
              <View style={styles.coinGrid}>
                {(offerings.length > 0 ? offerings : COIN_PACKAGES.map(p => ({
                  ...p,
                  priceAmount: 0,
                  currencyCode: 'TRY',
                  bonusPercent: p.bonusPercent || 0,
                })) as CoinPackageOffering[]).map((pkg) => {
                  const isSelected = selectedPackage === pkg.id;
                  const scaleVal = isSelected ? 1.03 : 1;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[styles.coinCard, { transform: [{ scale: scaleVal }] }]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedPackage(pkg.id)}
                    >
                      {/* Popular gold border */}
                      {pkg.popular && <GoldBorderAnim />}

                      {/* Selected glow */}
                      {isSelected && <View style={styles.coinCardGlow} />}

                      {/* Inner gradient */}
                      <LinearGradient
                        colors={['rgba(15,22,40,0.95)', 'rgba(10,16,32,0.98)']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                      />

                      {/* Bonus badge */}
                      {pkg.bonusPercent && (
                        <View style={styles.bonusBadge}>
                          <LinearGradient
                            colors={[COLORS.goldMetallic, COLORS.goldLight]}
                            style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          />
                          <Text style={styles.bonusText}>+{pkg.bonusPercent}%</Text>
                        </View>
                      )}

                      {/* Content */}
                      <View style={styles.coinCardContent}>
                        <Ionicons name="diamond" size={22} color={COLORS.primary} />
                        <Text style={styles.coinAmount}>{pkg.coins.toLocaleString()}</Text>
                        <Text style={styles.coinPrice}>{pkg.price}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            /* ═══ VIP TAB ═══ */
            <VIPHolographicCard />
          )}
        </ScrollView>

        {/* ═══ CHECKOUT BUTTON ═══ */}
        <View style={styles.checkoutArea}>
          <TouchableOpacity
            style={[
              styles.checkoutBtn,
              !(activeTab === 'coins' ? selectedPackage : true) && styles.checkoutDisabled,
            ]}
            activeOpacity={0.8}
            onPress={activeTab === 'coins' && !selectedPackage ? undefined : closeSheet}
          >
            <LinearGradient
              colors={
                activeTab === 'vip'
                  ? [COLORS.goldMetallic, COLORS.goldLight, COLORS.goldMetallic]
                  : (activeTab === 'coins' && selectedPackage)
                    ? [COLORS.primary, COLORS.primaryDark]
                    : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']
              }
              style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {/* Shimmer sweep */}
            {(activeTab === 'vip' || selectedPackage) && <ShimmerOverlay />}
              {isLoading ? (
                <>
                  <Animated.View style={styles.spinnerDot} />
                  <Text style={[styles.checkoutText, styles.checkoutTextActive]}>İşleniyor...</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="lock-closed"
                    size={16}
                    color={activeTab === 'vip' ? '#1A1F35' : (selectedPackage ? COLORS.deepNavy : COLORS.silverDark)}
                  />
                  <Text style={[
                    styles.checkoutText,
                    (activeTab === 'vip' || selectedPackage) && styles.checkoutTextActive,
                    activeTab === 'vip' && { color: '#1A1F35' },
                  ]}>
                    {activeTab === 'vip'
                      ? 'VIP Vatandaş Ol'
                      : selectedPkg
                        ? `${selectedPkg.coins.toLocaleString()} Jeton — ${selectedPkg.price}`
                        : 'Paket Seçin'
                    }
                  </Text>
                </>
              )}
            </TouchableOpacity>
        </View>
        </Animated.View>
      </View>
    </>
  );
}

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  overlayDark: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: height * 0.85,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    zIndex: 100,
    elevation: 100,
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
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 22,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.cardGlassBorder,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
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
  tabTextVipActive: {
    color: '#1A1F35',
    fontWeight: FONTS.bold as any,
    zIndex: 1,
  },

  scrollContent: {
    paddingBottom: SPACING.sm,
  },

  /* ── Hero Balance ── */
  heroBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: SPACING.lg,
    marginHorizontal: SPACING.md,
  },
  balanceTextCol: {
    alignItems: 'flex-start',
  },
  balanceLabel: {
    color: COLORS.silverDark,
    fontSize: 12,
    fontWeight: FONTS.regular as any,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 38,
    fontWeight: FONTS.heavy as any,
    letterSpacing: 1,
  },

  /* ── Diamond 3D ── */
  diamond3d: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  diamondGlow: {
    position: 'absolute',
    backgroundColor: COLORS.primaryGlow,
  },
  diamondBody: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  diamondHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  diamondShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(92,225,230,0.15)',
  },

  /* ── Section ── */
  sectionLabel: {
    color: COLORS.silver,
    fontSize: 15,
    fontWeight: FONTS.semibold as any,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },

  /* ── Coin Grid ── */
  coinGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  coinCard: {
    width: (width - SPACING.md * 2 - 10) / 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    position: 'relative',
  },
  coinCardGlow: {
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
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 1,
  },
  coinCardContent: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 6,
  },
  coinAmount: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: FONTS.bold as any,
  },
  coinPrice: {
    color: COLORS.silverLight,
    fontSize: 13,
    fontWeight: FONTS.medium as any,
  },

  /* ── Gold Border ── */
  goldBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 15,
    borderWidth: 1.5,
    overflow: 'hidden',
    zIndex: 1,
  },

  /* ── Bonus Badge ── */
  bonusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 3,
  },
  bonusText: {
    color: '#1A1F35',
    fontSize: 10,
    fontWeight: FONTS.bold as any,
    zIndex: 1,
  },

  /* ── VIP Card ── */
  vipCard: {
    marginHorizontal: SPACING.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(207,181,59,0.15)',
    overflow: 'hidden',
    position: 'relative',
  },
  holoSweep: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  vipContent: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 14,
  },
  vipCrownWrapper: {
    shadowColor: COLORS.goldMetallic,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  vipCrownBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipTextArea: {
    alignItems: 'center',
    gap: 4,
  },
  vipTitle: {
    color: COLORS.goldLight,
    fontSize: 18,
    fontWeight: FONTS.bold as any,
    letterSpacing: 0.5,
  },
  vipSubtitle: {
    color: COLORS.silverLight,
    fontSize: 12,
    fontWeight: FONTS.regular as any,
    textAlign: 'center',
  },
  vipPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 4,
  },
  vipPrice: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: FONTS.heavy as any,
  },
  vipPricePeriod: {
    color: COLORS.silverDark,
    fontSize: 14,
    fontWeight: FONTS.regular as any,
  },
  vipFeatures: {
    alignSelf: 'stretch',
    gap: 8,
    marginTop: 8,
  },
  vipFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vipFeatureText: {
    color: COLORS.silver,
    fontSize: 13,
    fontWeight: FONTS.regular as any,
  },
  vipEdgeTop: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: COLORS.goldGlow,
  },
  vipEdgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: COLORS.goldGlow,
  },

  /* ── Checkout ── */
  checkoutArea: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 40,
  },
  checkoutBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  checkoutDisabled: {
    opacity: 0.4,
  },
  checkoutText: {
    color: COLORS.silverDark,
    fontSize: 15,
    fontWeight: FONTS.semibold as any,
    zIndex: 1,
  },
  checkoutTextActive: {
    color: COLORS.deepNavy,
    fontWeight: FONTS.bold as any,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
  },
  spinnerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.deepNavy,
    borderTopColor: 'transparent',
    zIndex: 1,
  },
});
