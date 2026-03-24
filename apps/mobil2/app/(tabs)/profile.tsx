import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
  Easing,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';
import { useUser } from '../../contexts/UserContext';
import WalletVIPSheet from '../../components/WalletVIPSheet';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────
// Assets (Showcase items)
// ─────────────────────────────────────────────────────
interface AssetItem {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  rarity: string;
  desc: string;
}

const SHOWCASE_ASSETS: AssetItem[] = [
  { id: 'a1', name: 'Elmas Taç', icon: 'diamond', color: COLORS.primary, rarity: 'Efsanevi', desc: 'Profilinde parıltılı taç görünsün' },
  { id: 'a2', name: 'Altın Anahtar', icon: 'key', color: COLORS.goldMetallic, rarity: 'Nadir', desc: 'VIP odalara özel giriş yetkisi' },
  { id: 'a3', name: 'Kristal Kadeh', icon: 'wine', color: '#A78BFA', rarity: 'Epik', desc: 'Elit etkinliklere katılım rozeti' },
  { id: 'a4', name: 'VIP Pasaport', icon: 'document-text', color: COLORS.goldLight, rarity: 'Ultra Nadir', desc: 'Tüm sınırlı içeriklere erişim' },
  { id: 'a5', name: 'Platin Kalkan', icon: 'shield-checkmark', color: COLORS.silverMetallic, rarity: 'Efsanevi', desc: 'Profilini koruma altına al' },
];



// ─────────────────────────────────────────────────────
// Level Badge (3D feel)
// ─────────────────────────────────────────────────────
function LevelBadge({ level }: { level: number }) {
  return (
    <View style={styles.levelBadge}>
      <LinearGradient
        colors={[COLORS.goldMetallic, COLORS.goldLight, COLORS.goldMetallic]}
        style={styles.levelBadgeGrad}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        {/* Inner shadow overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'transparent', 'rgba(0,0,0,0.1)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
        />
        <Text style={styles.levelText}>Lv.{level}</Text>
      </LinearGradient>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// Showcase Card — clean & elegant
// ─────────────────────────────────────────────────────
function ShowcaseCard({ asset, equipped, onToggle }: { asset: AssetItem; equipped: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onToggle} style={styles.showcaseCard}>
      <LinearGradient
        colors={['rgba(12,18,36,0.82)', 'rgba(8,14,28,0.90)']}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      {/* Soft bottom glow — replaces ugly circle */}
      <LinearGradient
        colors={[`${asset.color}00`, `${asset.color}18`]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
      />
      <Ionicons name={asset.icon} size={32} color={asset.color} style={{ zIndex: 1 }} />
      <Text style={styles.showcaseName}>{asset.name}</Text>
      <View style={[styles.rarityBadge, { borderColor: asset.color }]}>
        <Text style={[styles.rarityText, { color: asset.color }]}>{asset.rarity}</Text>
      </View>
      {equipped && (
        <View style={[styles.equippedBadge, { backgroundColor: asset.color }]}>
          <Ionicons name="checkmark" size={10} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ═════════════════════════════════════════════════════
// PROFILE SCREEN
// ═════════════════════════════════════════════════════
export default function ProfileScreen() {
  const router = useRouter();
  const { colors: C, isDark } = useTheme();
  const { user, profileExtra, logout, update } = useUser();
  const [walletVisible, setWalletVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatarUrl || '');
  const [editBio, setEditBio] = useState(profileExtra?.bio || 'SopranoChat\'ta sesimi duyurun 🎤');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [equippedAssets, setEquippedAssets] = useState<Set<string>>(new Set(['a1']));
  const scrollY = useRef(new Animated.Value(0)).current;

  // AsyncStorage'dan kapak ve kuşanılan servetleri yükle
  useEffect(() => {
    (async () => {
      try {
        const [savedCover, savedEquipped] = await AsyncStorage.multiGet([
          '@soprano_cover_image',
          '@soprano_equipped_assets',
        ]);
        if (savedCover[1]) setCoverImage(savedCover[1]);
        if (savedEquipped[1]) setEquippedAssets(new Set(JSON.parse(savedEquipped[1])));
      } catch (e) { /* sessiz hata */ }
    })();
  }, []);

  // coverImage değiştiğinde kaydet
  const updateCoverImage = useCallback(async (uri: string) => {
    setCoverImage(uri);
    await AsyncStorage.setItem('@soprano_cover_image', uri);
  }, []);

  // equippedAssets değiştiğinde kaydet
  const toggleEquipped = useCallback(async (assetId: string) => {
    setEquippedAssets(prev => {
      const next = new Set(prev);
      if (next.has(assetId)) { next.delete(assetId); }
      else { next.add(assetId); }
      AsyncStorage.setItem('@soprano_equipped_assets', JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Avatar glow animation
  const avatarGlow = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarGlow, { toValue: 0.9, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(avatarGlow, { toValue: 0.4, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Parallax for header
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });
  const headerScale = scrollY.interpolate({
    inputRange: [-80, 0],
    outputRange: [1.15, 1],
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

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ═══ HERO HEADER ═══ */}
        <Animated.View
          style={[styles.heroHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}
          pointerEvents="none"
        >
          {/* Cover image or gradient fallback */}
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverGrad} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[COLORS.primaryDark, '#0A2E3F', COLORS.deepNavy]}
              style={styles.coverGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          {/* Dark overlay for readability */}
          <LinearGradient
            colors={['transparent', 'rgba(6,11,24,0.7)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          {/* Ambient orbs */}
          {!coverImage && <View style={styles.ambientOrb1} />}
          {!coverImage && <View style={styles.ambientOrb2} />}
        </Animated.View>

        {/* Cover edit button — OUTSIDE hero header for touch to work */}
        {isEditing && (
          <TouchableOpacity
            style={styles.coverEditBtn}
            activeOpacity={0.7}
            onPress={async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Galeri izni gerekiyor.'); return; }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) { updateCoverImage(result.assets[0].uri); }
            }}
          >
            <Ionicons name="image-outline" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Kapak Değiştir</Text>
          </TouchableOpacity>
        )}

        {/* ═══ AVATAR ═══ */}
        <View style={styles.avatarArea}>
          <Animated.View style={[styles.avatarGlowRing, { opacity: avatarGlow }]} />
          <TouchableOpacity
            style={styles.avatarOuter}
            activeOpacity={0.8}
            onPress={async () => {
              if (!isEditing) return;
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Galeriden fotoğraf seçmek için izin vermeniz gerekiyor.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setEditAvatar(result.assets[0].uri);
              }
            }}
          >
            <LinearGradient
              colors={[COLORS.goldMetallic, COLORS.goldLight, COLORS.goldMetallic]}
              style={styles.avatarBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatarInner}>
                {(isEditing ? editAvatar : user?.avatarUrl) ? (
                  <Image
                    source={{ uri: isEditing ? editAvatar : user?.avatarUrl }}
                    style={{ width: 82, height: 82, borderRadius: 41 }}
                  />
                ) : (
                  <Ionicons name="person" size={36} color={COLORS.silver} />
                )}
              </View>
            </LinearGradient>
            {isEditing && (
              <View style={{
                position: 'absolute', top: -2, right: -2,
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: COLORS.primary,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: COLORS.deepNavy,
                zIndex: 10,
              }}>
                <Ionicons name="camera" size={14} color={COLORS.deepNavy} />
              </View>
            )}
          </TouchableOpacity>
          <LevelBadge level={user?.points ? Math.min(Math.floor(user.points / 100) + 1, 99) : 1} />
        </View>

        {/* Name & Username */}
        {isEditing ? (
          <TextInput
            style={[styles.profileName, { borderBottomWidth: 1, borderBottomColor: COLORS.primary, paddingBottom: 4 }]}
            value={editName}
            onChangeText={setEditName}
            placeholder="İsminiz"
            placeholderTextColor={COLORS.silverDark}
            selectionColor={COLORS.primary}
          />
        ) : (
          <Text style={styles.profileName}>{user?.displayName || 'Kullanıcı'}</Text>
        )}
        <Text style={styles.profileHandle}>
          @{user?.username || 'kullanici'}
          {user?.isVip && ' 👑'}
        </Text>

        {/* Bio */}
        {isEditing ? (
          <TextInput
            style={[styles.profileBio, { borderBottomWidth: 1, borderBottomColor: COLORS.primary, paddingBottom: 4 }]}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Kendinizden bahsedin..."
            placeholderTextColor={COLORS.silverDark}
            selectionColor={COLORS.primary}
            multiline
            maxLength={100}
          />
        ) : (
          <Text style={styles.profileBio}>{editBio}</Text>
        )}

        {/* Edit / Save Button */}
        <TouchableOpacity
          style={{
            marginTop: 10,
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: isEditing ? COLORS.primary : 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: isEditing ? COLORS.primary : COLORS.cardGlassBorder,
            alignSelf: 'center',
          }}
          activeOpacity={0.7}
          onPress={async () => {
            if (isEditing) {
              await update({
                displayName: editName.trim() || user?.displayName,
                avatar: editAvatar || user?.avatarUrl,
                bio: editBio,
              });
              setIsEditing(false);
            } else {
              setEditName(user?.displayName || '');
              setEditAvatar(user?.avatarUrl || '');
              setEditBio(profileExtra?.bio || editBio);
              setIsEditing(true);
            }
          }}
        >
          <Text style={{
            color: isEditing ? COLORS.deepNavy : COLORS.silver,
            fontSize: 13,
            fontWeight: '600',
          }}>
            {isEditing ? '✓ Kaydet' : '✎ Profili Düzenle'}
          </Text>
        </TouchableOpacity>

        {/* ═══ STATS BAR ═══ */}
        <View style={styles.statsBar}>
          <TouchableOpacity style={styles.statItem} activeOpacity={0.7} onPress={() => Alert.alert('Takipçiler', `${profileExtra?.followersCount || 0} kişi seni takip ediyor`)}>
            <Text style={styles.statNum}>{profileExtra?.followersCount?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} activeOpacity={0.7} onPress={() => Alert.alert('Takip Edilen', `${profileExtra?.followingCount || 0} kişiyi takip ediyorsun`)}>
            <Text style={styles.statNum}>{profileExtra?.followingCount?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>Takip Edilen</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} activeOpacity={0.7} onPress={() => Alert.alert('İttifaklar', `${profileExtra?.alliancesCount || 0} ittifakın var`)}>
            <Text style={styles.statNum}>{profileExtra?.alliancesCount?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>İttifaklar</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} activeOpacity={0.7} onPress={() => Alert.alert('Ziyaretçiler', `${profileExtra?.visitorsCount || 0} profil ziyareti`)}>
            <Text style={styles.statNum}>{profileExtra?.visitorsCount?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>Ziyaretçi</Text>
          </TouchableOpacity>
        </View>

        {/* ═══ ASSET SHOWCASE ═══ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dijital Servet</Text>
          <Text style={styles.sectionSub}>Koleksiyon & Mülkler</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.showcaseList}
        >
          {SHOWCASE_ASSETS.map((asset) => (
            <ShowcaseCard
              key={asset.id}
              asset={asset}
              equipped={equippedAssets.has(asset.id)}
              onToggle={() => toggleEquipped(asset.id)}
            />
          ))}
        </ScrollView>

        {/* ═══ QUICK ACTIONS ═══ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.7} onPress={() => setWalletVisible(true)}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(207,181,59,0.12)' }]}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.goldMetallic} />
            </View>
            <Text style={styles.quickActionLabel}>Cüzdan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.7} onPress={() => setWalletVisible(true)}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(207,181,59,0.12)' }]}>
              <Ionicons name="ribbon-outline" size={20} color={COLORS.goldMetallic} />
            </View>
            <Text style={styles.quickActionLabel}>VIP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.7} onPress={() => router.push('/notifications')}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(92,225,230,0.12)' }]}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Bildirimler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} activeOpacity={0.7} onPress={() => router.push('/settings')}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(167,139,250,0.12)' }]}>
              <Ionicons name="settings-outline" size={20} color="#A78BFA" />
            </View>
            <Text style={styles.quickActionLabel}>Ayarlar</Text>
          </TouchableOpacity>
        </View>

        {/* ═══ LOGOUT ═══ */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert('Oturumu Kapat', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
              { text: 'İptal', style: 'cancel' },
              {
                text: 'Çıkış Yap',
                style: 'destructive',
                onPress: async () => {
                  await logout();
                  router.replace('/login');
                },
              },
            ]);
          }}
        >
          <LinearGradient
            colors={['rgba(180,40,40,0.15)', 'rgba(140,20,20,0.20)']}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
          <View style={styles.logoutGlow} />
          <Ionicons name="log-out-outline" size={20} color="#E05252" />
          <Text style={styles.logoutText}>Oturumu Kapat</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>SopranoChat v2.0 Elite</Text>
        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* ═══ TOP BAR ═══ */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.silver} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profil</Text>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={18} color={COLORS.silver} />
        </TouchableOpacity>
      </View>

      {/* ═══ Wallet & VIP Sheet ═══ */}
      <WalletVIPSheet
        visible={walletVisible}
        onClose={() => setWalletVisible(false)}
      />
    </View>
  );
}

// ═════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deepNavy },
  scrollContent: { paddingBottom: 120 },

  /* ── Top Bar ── */
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 10,
    zIndex: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: FONTS.bold as any,
    letterSpacing: 0.3,
  },

  /* ── Hero Header ── */
  heroHeader: {
    height: 180,
    overflow: 'hidden',
    position: 'relative',
  },
  coverGrad: {
    ...StyleSheet.absoluteFillObject,
  },
  ambientOrb1: {
    position: 'absolute',
    top: 20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryGlow,
    opacity: 0.15,
  },
  ambientOrb2: {
    position: 'absolute',
    bottom: 10,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.goldGlow,
    opacity: 0.1,
  },

  /* ── Avatar ── */
  avatarArea: {
    alignItems: 'center',
    marginTop: -46,
    position: 'relative',
    zIndex: 5,
  },
  avatarGlowRing: {
    position: 'absolute',
    top: -10,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.goldGlow,
  },
  avatarOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  avatarBorder: {
    flex: 1,
    borderRadius: 46,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 44,
    backgroundColor: COLORS.cardGlassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Level Badge ── */
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: width / 2 - 60,
    zIndex: 6,
  },
  levelBadgeGrad: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.deepNavy,
    overflow: 'hidden',
  },
  levelText: {
    color: '#1A1F35',
    fontSize: 10,
    fontWeight: FONTS.heavy as any,
    zIndex: 1,
  },

  /* ── Name ── */
  profileName: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: FONTS.bold as any,
    textAlign: 'center',
    marginTop: 10,
  },
  profileHandle: {
    color: COLORS.silverDark,
    fontSize: 13,
    fontWeight: FONTS.regular as any,
    textAlign: 'center',
    marginBottom: 4,
  },
  profileBio: {
    color: COLORS.silver,
    fontSize: 13,
    fontWeight: FONTS.regular as any,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },

  /* ── Stats Bar ── */
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNum: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: FONTS.bold as any,
  },
  statLabel: {
    color: COLORS.silverDark,
    fontSize: 11,
    fontWeight: FONTS.regular as any,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  /* ── Section ── */
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: FONTS.bold as any,
  },
  sectionSub: {
    color: COLORS.silverDark,
    fontSize: 12,
    fontWeight: FONTS.regular as any,
    marginTop: 1,
  },

  /* ── Showcase ── */
  showcaseList: {
    paddingHorizontal: SPACING.md,
    gap: 10,
    paddingBottom: SPACING.lg,
  },
  showcaseCard: {
    width: 110,
    height: 130,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 6,
    position: 'relative',
  },
  showcaseName: {
    color: COLORS.silver,
    fontSize: 11,
    fontWeight: FONTS.semibold as any,
    textAlign: 'center',
    zIndex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: FONTS.bold as any,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  equippedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  coverEditBtn: {
    position: 'absolute',
    top: 140,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 8,
  },

  /* ── Quick Actions ── */
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickAction: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  quickActionLabel: {
    color: COLORS.silver,
    fontSize: 11,
    fontWeight: FONTS.medium as any,
  },

  /* ── Logout ── */
  logoutBtn: {
    marginHorizontal: SPACING.lg,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(224,82,82,0.15)',
    overflow: 'hidden',
    marginTop: SPACING.sm,
    position: 'relative',
  },
  logoutGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(224,82,82,0.06)',
    alignSelf: 'center',
  },
  logoutText: {
    color: '#E05252',
    fontSize: 15,
    fontWeight: FONTS.semibold as any,
    zIndex: 1,
  },

  /* ── Version ── */
  versionText: {
    color: COLORS.silverDark,
    fontSize: 11,
    fontWeight: FONTS.regular as any,
    textAlign: 'center',
    marginTop: SPACING.lg,
    opacity: 0.5,
  },
});
