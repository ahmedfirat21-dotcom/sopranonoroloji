import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, Image,
  TouchableOpacity, TextInput, ScrollView, Easing, Platform, KeyboardAvoidingView,
  Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';
import { useUser } from '../contexts/UserContext';

const { width, height } = Dimensions.get('window');

// ─── Vibe options ───
const VIBES = [
  { id: 'music', label: '🎵 Müzik Locaları' },
  { id: 'chat', label: '💬 Özel Sohbetler' },
  { id: 'invest', label: '📈 Yatırım/Ticaret' },
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'culture', label: '📚 Kültür/Edebiyat' },
  { id: 'sports', label: '⚽ Spor' },
  { id: 'tech', label: '💻 Teknoloji' },
  { id: 'art', label: '🎨 Sanat' },
];

const GENDERS = [
  { id: 'male', label: 'Erkek' },
  { id: 'female', label: 'Kadın' },
  { id: 'other', label: 'Belirtmek İstemiyorum' },
];

// ─── Date picker data ───
const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => (currentYear - 14 - i).toString());

// ─── ScrollPicker component ───
function ScrollPicker({
  data,
  selectedIndex,
  onSelect,
  itemWidth,
}: {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  itemWidth?: number;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const paddingItems = Math.floor(VISIBLE_ITEMS / 2);

  useEffect(() => {
    if (scrollRef.current && selectedIndex >= 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const onMomentumEnd = useCallback(
    (e: any) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, data.length - 1));
      onSelect(clamped);
    },
    [data.length, onSelect]
  );

  return (
    <View style={[pickerStyles.column, itemWidth ? { width: itemWidth } : { flex: 1 }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        nestedScrollEnabled={true}
      >
        {/* Top padding */}
        {Array.from({ length: paddingItems }).map((_, i) => (
          <View key={`pad-top-${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}
        {/* Data items */}
        {data.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <View key={`item-${index}`} style={[pickerStyles.item, { height: ITEM_HEIGHT }]}>
              <Text
                style={[
                  pickerStyles.itemText,
                  isSelected && pickerStyles.itemTextSelected,
                ]}
              >
                {item}
              </Text>
            </View>
          );
        })}
        {/* Bottom padding */}
        {Array.from({ length: paddingItems }).map((_, i) => (
          <View key={`pad-bot-${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}
      </ScrollView>
      {/* Seçili satır vurgusu */}
      <View style={pickerStyles.highlight} pointerEvents="none">
        <View style={pickerStyles.highlightLine} />
        <View style={{ height: ITEM_HEIGHT }} />
        <View style={pickerStyles.highlightLine} />
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  column: {
    height: PICKER_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 15,
    fontWeight: '500',
  },
  itemTextSelected: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  highlightLine: {
    height: 1,
    backgroundColor: 'rgba(92,225,230,0.25)',
  },
});

export default function SetupScreen() {
  const router = useRouter();
  const { colors: C, isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [birthDay, setBirthDay] = useState(0);
  const [birthMonth, setBirthMonth] = useState(0);
  const [birthYear, setBirthYear] = useState(0);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { user, login, update, saveProfileExtra } = useUser();

  // Animasyonlar
  const panelY = useRef(new Animated.Value(height * 0.3)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const avatarGlow = useRef(new Animated.Value(1)).current;
  const shimmerX = useRef(new Animated.Value(-width)).current;
  const step2Opacity = useRef(new Animated.Value(0)).current;
  const step2Y = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Panel slide-up
    Animated.parallel([
      Animated.spring(panelY, {
        toValue: 0,
        friction: 12,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(panelOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Avatar nefes alan halka
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarGlow, {
          toValue: 1.08,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(avatarGlow, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer loop
    Animated.loop(
      Animated.timing(shimmerX, {
        toValue: width * 2,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const goToStep2 = async () => {
    // Adım 1 → Adım 2 geçişi (login henüz yapılmıyor!)
    setStep(2);
    Animated.parallel([
      Animated.timing(step2Opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(step2Y, {
        toValue: 0,
        friction: 10,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleVibe = (id: string) => {
    setSelectedVibes(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    const birthDate = `${DAYS[birthDay]}/${birthMonth + 1}/${YEARS[birthYear]}`;
    setIsSaving(true);
    try {
      if (!user) {
        // Henüz kullanıcı yok → oluştur
        await login(name.trim(), avatar || undefined, gender || undefined);
      }
      // Profili güncelle → isProfileComplete = true yapılır
      await update({ displayName: name.trim(), avatar: avatar || undefined, gender: gender || undefined });
      // Profil ekstra bilgileri kaydet
      await saveProfileExtra({ birthDate, vibes: selectedVibes });
    } catch (e: any) {
      console.warn('[Setup] Profil kayıt hatası:', e.message);
    } finally {
      setIsSaving(false);
    }
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Arka plan */}
      <LinearGradient
        colors={isDark ? ['#060B18', '#0C1630', '#060B18'] : ['#F2F2F7', '#EEEDF5', '#F2F2F7']}
        style={StyleSheet.absoluteFill}
      />

      {/* Üst glow */}
      <View style={s.topGlow}>
        <LinearGradient
          colors={isDark ? ['rgba(92,225,230,0.06)', 'transparent'] : ['rgba(5,163,164,0.04)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Başlık */}
      <Animated.View style={[s.header, { opacity: panelOpacity }]}>
        <Text style={[s.stepIndicator, { color: C.primary }]}>ADIM {step}/2</Text>
        <Text style={[s.headerTitle, { color: C.white }]}>
          {step === 1 ? 'Profilini Oluştur' : 'İlgi Alanların'}
        </Text>
        <Text style={[s.headerSub, { color: C.silverLight }]}>
          {step === 1
            ? 'Kulüp kimliğini oluştur'
            : 'Sana uygun odaları bulalım'}
        </Text>
      </Animated.View>

      {/* Glass Panel */}
      <Animated.View
        style={[
          s.panelWrap,
          {
            opacity: panelOpacity,
            transform: [{ translateY: panelY }],
          },
        ]}
      >
        <BlurView intensity={isDark ? 20 : 50} tint={isDark ? 'dark' : 'light'} style={s.blurPanel}>
          <ScrollView
            style={s.panelScroll}
            contentContainerStyle={s.panelContent}
            showsVerticalScrollIndicator={false}
          >
            {step === 1 ? (
              <>
                {/* Avatar */}
                <View style={s.avatarSection}>
                  <Animated.View
                    style={[
                      s.avatarGlowRing,
                      { transform: [{ scale: avatarGlow }] },
                    ]}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark, COLORS.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.avatarGlowGradient}
                    />
                  </Animated.View>
                  <TouchableOpacity
                    style={s.avatarCircle}
                    onPress={pickAvatar}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(12,20,40,0.95)', 'rgba(8,14,28,0.98)']}
                      style={StyleSheet.absoluteFill}
                    />
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={s.avatarImage} />
                    ) : (
                      <View style={s.avatarPlaceholder}>
                        <Ionicons name="camera" size={36} color={COLORS.primary} />
                        <Text style={s.avatarHint}>Fotoğraf Ekle</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {avatar && (
                    <TouchableOpacity style={s.changePhotoBtn} onPress={pickAvatar} activeOpacity={0.7}>
                      <Ionicons name="camera-outline" size={14} color={COLORS.primary} />
                      <Text style={s.changePhotoText}>{'Foto\u011Fraf\u0131 De\u011Fi\u015Ftir'}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* İsim Input */}
                <View style={s.inputSection}>
                  <Text style={s.inputLabel}>Kullanıcı Adı</Text>
                  <View style={s.inputWrap}>
                    <TextInput
                      style={s.input}
                      placeholder="Adını gir..."
                      placeholderTextColor={COLORS.silverDark}
                      selectionColor={COLORS.primary}
                      value={name}
                      onChangeText={setName}
                      maxLength={24}
                    />
                  </View>
                </View>

                {/* Devam Butonu */}
                <TouchableOpacity
                  style={[s.continueBtn, !name.trim() && s.continueBtnDisabled]}
                  activeOpacity={0.8}
                  onPress={goToStep2}
                  disabled={!name.trim()}
                >
                  <LinearGradient
                    colors={
                      name.trim()
                        ? [COLORS.primary, COLORS.primaryDark]
                        : ['rgba(92,225,230,0.15)', 'rgba(92,225,230,0.08)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.continueBtnGrad}
                  >
                    <Text
                      style={[
                        s.continueBtnText,
                        !name.trim() && { color: COLORS.silverDark },
                      ]}
                    >
                      Devam
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={name.trim() ? COLORS.deepNavy : COLORS.silverDark}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <Animated.View
                style={{
                  opacity: step2Opacity,
                  transform: [{ translateY: step2Y }],
                }}
              >
                {/* Cinsiyet */}
                <Text style={s.sectionTitle}>Cinsiyet</Text>
                <View style={s.pillRow}>
                  {GENDERS.map(g => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        s.pill,
                        gender === g.id && s.pillActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setGender(g.id)}
                    >
                      <Text
                        style={[
                          s.pillText,
                          gender === g.id && s.pillTextActive,
                        ]}
                      >
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Doğum Tarihi */}
                <Text style={[s.sectionTitle, { marginTop: SPACING.xl }]}>
                  Doğum Tarihi
                </Text>
                <View style={s.datePickerWrap}>
                  <View style={s.datePickerInner}>
                    <View style={s.dateColumn}>
                      <Text style={s.dateLabel}>Gün</Text>
                      <ScrollPicker
                        data={DAYS}
                        selectedIndex={birthDay}
                        onSelect={setBirthDay}
                      />
                    </View>
                    <View style={s.dateSeparator} />
                    <View style={[s.dateColumn, { flex: 1.5 }]}>
                      <Text style={s.dateLabel}>Ay</Text>
                      <ScrollPicker
                        data={MONTHS}
                        selectedIndex={birthMonth}
                        onSelect={setBirthMonth}
                      />
                    </View>
                    <View style={s.dateSeparator} />
                    <View style={s.dateColumn}>
                      <Text style={s.dateLabel}>Yıl</Text>
                      <ScrollPicker
                        data={YEARS}
                        selectedIndex={birthYear}
                        onSelect={setBirthYear}
                      />
                    </View>
                  </View>
                </View>

                {/* Vibe/Tarz */}
                <Text style={[s.sectionTitle, { marginTop: SPACING.xl }]}>
                  İlgi Alanların
                </Text>
                <Text style={s.sectionSub}>
                  Birden fazla seçebilirsin
                </Text>
                <View style={s.vibeGrid}>
                  {VIBES.map(v => {
                    const isSelected = selectedVibes.includes(v.id);
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={[
                          s.vibePill,
                          isSelected && s.vibePillActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => toggleVibe(v.id)}
                      >
                        <Text
                          style={[
                            s.vibePillText,
                            isSelected && s.vibePillTextActive,
                          ]}
                        >
                          {v.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Soprano'ya Katıl Butonu — Shimmer */}
                <TouchableOpacity
                  style={s.joinBtn}
                  activeOpacity={0.85}
                  onPress={handleComplete}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.joinBtnGrad}
                  >
                    {/* Shimmer efekti */}
                    <Animated.View
                      style={[
                        s.shimmer,
                        { transform: [{ translateX: shimmerX }] },
                      ]}
                    >
                      <LinearGradient
                        colors={[
                          'transparent',
                          'rgba(255,255,255,0.25)',
                          'transparent',
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </Animated.View>
                    <Ionicons
                      name="diamond-outline"
                      size={18}
                      color={COLORS.deepNavy}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={s.joinBtnText}>Soprano'ya Katıl</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </BlurView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepNavy,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.25,
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.07,
    marginBottom: SPACING.lg,
  },
  stepIndicator: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: FONTS.bold,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: FONTS.bold,
  },
  headerSub: {
    color: COLORS.silverLight,
    fontSize: 14,
    fontWeight: FONTS.regular,
    marginTop: SPACING.xs,
  },
  panelWrap: {
    flex: 1,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  blurPanel: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  panelScroll: {
    flex: 1,
  },
  panelContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.glassBg,
  },

  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
    position: 'relative',
  },
  avatarGlowRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    overflow: 'hidden',
    top: -4,
    alignSelf: 'center',
  },
  avatarGlowGradient: {
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: COLORS.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  avatarHint: {
    color: COLORS.silver,
    fontSize: 13,
    fontWeight: FONTS.medium,
  },

  /* Input */
  inputSection: {
    marginTop: SPACING.lg,
  },
  inputLabel: {
    color: COLORS.silver,
    fontSize: 14,
    fontWeight: FONTS.semibold,
    marginBottom: SPACING.sm,
    marginLeft: 2,
  },
  inputWrap: {
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(92,225,230,0.2)',
    paddingBottom: 4,
  },
  input: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: FONTS.medium,
    paddingVertical: 12,
    paddingHorizontal: 2,
  },

  /* Continue button */
  continueBtn: {
    marginTop: SPACING.xl,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  continueBtnText: {
    color: COLORS.deepNavy,
    fontSize: 16,
    fontWeight: FONTS.bold,
  },

  /* Step 2 */
  sectionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: FONTS.bold,
    marginBottom: SPACING.md,
  },
  sectionSub: {
    color: COLORS.silverDark,
    fontSize: 12,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pillActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(92,225,230,0.12)',
  },
  pillText: {
    color: COLORS.silverLight,
    fontSize: 14,
    fontWeight: FONTS.medium,
  },
  pillTextActive: {
    color: COLORS.primary,
    fontWeight: FONTS.bold,
  },

  /* Vibe Grid */
  vibeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  vibePill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  vibePillActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(92,225,230,0.15)',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  vibePillText: {
    color: COLORS.silverLight,
    fontSize: 13,
    fontWeight: FONTS.medium,
  },
  vibePillTextActive: {
    color: COLORS.white,
    fontWeight: FONTS.bold,
  },

  /* Date Picker */
  datePickerWrap: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    padding: SPACING.sm,
  },
  datePickerInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    color: COLORS.silverDark,
    fontSize: 11,
    fontWeight: FONTS.medium,
    marginBottom: SPACING.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dateSeparator: {
    width: 1,
    height: PICKER_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: SPACING.lg,
  },

  /* Join Button */
  joinBtn: {
    marginTop: SPACING.xl,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  joinBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  joinBtnText: {
    color: COLORS.deepNavy,
    fontSize: 17,
    fontWeight: FONTS.heavy,
    letterSpacing: 0.5,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.3,
    height: '100%',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryStroke,
    backgroundColor: COLORS.primarySubtle,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: FONTS.medium as any,
  },
});
