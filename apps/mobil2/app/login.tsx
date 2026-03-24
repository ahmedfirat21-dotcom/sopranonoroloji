import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, Image,
  TouchableOpacity, Easing, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { useTheme } from '../constants/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { loginWithGoogle, loginWithApple, sendPhoneOTP, verifyPhoneOTP } from '../services/firebaseAuth';
import { TextInput, Alert } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { colors: C, isDark } = useTheme();
  const { isLoggedIn, login, loginWithFirebase } = useUser();
  const [guestLoading, setGuestLoading] = useState(false);
  
  // Auth Form State
  const [authLoading, setAuthLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'methods' | 'phone' | 'otp'>('methods');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmResult, setConfirmResult] = useState<any>(null);

  const panelY = useRef(new Animated.Value(height * 0.4)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-width)).current;

  // Zaten giriş yapmışsa home'a yönlendir
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn]);

  useEffect(() => {
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
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
    }, 300);

    Animated.loop(
      Animated.timing(shimmerX, {
        toValue: width * 2,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // ─── Google Giriş ───
  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const authResult = await loginWithGoogle();
      if (!authResult.success) {
        if (authResult.error !== 'İptal edildi') Alert.alert('Hata', authResult.error || 'Google girişi başarısız');
        return;
      }
      const { isNewUser } = await loginWithFirebase(authResult, 'google');
      router.replace(isNewUser ? '/setup' : '/(tabs)');
    } catch (e: any) {
      Alert.alert('Giriş Hatası', e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── Apple Giriş ───
  const handleAppleLogin = async () => {
    setAuthLoading(true);
    try {
      const authResult = await loginWithApple();
      if (!authResult.success) {
        if (authResult.error !== 'İptal edildi') Alert.alert('Hata', authResult.error || 'Apple girişi başarısız');
        return;
      }
      const { isNewUser } = await loginWithFirebase(authResult, 'apple');
      router.replace(isNewUser ? '/setup' : '/(tabs)');
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── Telefon SMS Gönder ───
  const handleSendOTP = async () => {
    if (!phoneNumber) return Alert.alert('Hata', 'Telefon Numaranızı (örn: +90...) formatında girin.');
    setAuthLoading(true);
    try {
      const res = await sendPhoneOTP(phoneNumber);
      if (!res.success) {
        Alert.alert('Hata', res.error || 'SMS Gönderilemedi');
        return;
      }
      setConfirmResult(res.confirmation);
      setAuthStep('otp'); // Kod girme sayfasına geç
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── SMS Kodu Doğrula ───
  const handleVerifyOTP = async () => {
    if (!otpCode || !confirmResult) return Alert.alert('Hata', 'Kodu girmelisiniz.');
    setAuthLoading(true);
    try {
      const res = await verifyPhoneOTP(confirmResult, otpCode);
      if (!res.success) {
        Alert.alert('Hata', res.error || 'Kod geçersiz veya süre doldu.');
        return;
      }
      const { isNewUser } = await loginWithFirebase(res, 'phone');
      router.replace(isNewUser ? '/setup' : '/(tabs)');
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Misafir girişi — rastgele isimle direkt giriş
  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const guestNames = ['Misafir', 'Ziyaretçi', 'Konuk', 'Gezgin'];
      const randomName = guestNames[Math.floor(Math.random() * guestNames.length)] + '_' + Math.floor(Math.random() * 9999);
      await login(randomName);
      router.replace('/(tabs)');
    } catch (e: any) {
      console.warn('[Login] Misafir giriş hatası:', e.message);
      router.replace('/(tabs)');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: C.deepNavy }]}>
      {/* Derin arka plan */}
      <LinearGradient
        colors={isDark ? ['#060B18', '#0C1630', '#060B18'] : ['#F2F2F7', '#EEEDF5', '#F2F2F7']}
        style={StyleSheet.absoluteFill}
      />

      {/* Üstte çok hafif turkuaz radial glow */}
      <View style={s.topGlow}>
        <LinearGradient
          colors={isDark ? ['rgba(92,225,230,0.08)', 'rgba(92,225,230,0.03)', 'transparent'] : ['rgba(10,126,140,0.08)', 'rgba(10,126,140,0.03)', 'transparent']}
          style={s.topGlowGrad}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Logo üstte küçük */}
      <Animated.View style={[s.logoArea, { opacity: logoOpacity }]}>
        <Image
          source={require('../assets/images/logo.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={[s.welcomeText, { color: C.silverLight }]}>{'HO\u015E GELD\u0130N\u0130Z'}</Text>
      </Animated.View>

      {/* Glassmorphism Panel */}
      <Animated.View
        style={[
          s.panelWrap,
          {
            opacity: panelOpacity,
            transform: [{ translateY: panelY }],
          },
        ]}
      >
        <BlurView intensity={isDark ? 25 : 60} tint={isDark ? 'dark' : 'light'} style={s.blurPanel}>
          <View style={s.panelInner}>
            <Text style={[s.panelTitle, { color: C.white }]}>Giriş Yap</Text>
            <Text style={[s.panelSubtitle, { color: C.silverLight }]}>
              {authStep === 'methods' && 'Soprano ailesine katılmak için bir yöntem seçin'}
              {authStep === 'phone' && 'Telefon numaranızı başında + ülke kodu ile birlikte girin'}
              {authStep === 'otp' && 'Cihazınıza gönderilen 6 haneli kodu girin'}
            </Text>

            {/* SEÇİM MENÜSÜ */}
            {authStep === 'methods' && (
              <>
                {/* Google Butonu */}
                <TouchableOpacity style={[s.authBtn, { borderColor: C.primaryStroke, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]} activeOpacity={0.7} onPress={handleGoogleLogin} disabled={authLoading}>
                  <View style={s.authBtnInner}>
                    <Ionicons name="logo-google" size={20} color={C.white} />
                    <Text style={[s.authBtnText, { color: C.white }]}>{authLoading ? 'Bağlanıyor...' : 'Google ile devam et'}</Text>
                  </View>
                </TouchableOpacity>

                {/* Apple Butonu */}
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={[s.authBtn, { borderColor: C.primaryStroke, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]} activeOpacity={0.7} onPress={handleAppleLogin} disabled={authLoading}>
                    <View style={s.authBtnInner}>
                      <Ionicons name="logo-apple" size={22} color={C.white} />
                      <Text style={[s.authBtnText, { color: C.white }]}>{authLoading ? 'Bağlanıyor...' : 'Apple ile devam et'}</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Telefon Butonu */}
                <TouchableOpacity style={[s.authBtn, { borderColor: C.primaryStroke, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]} activeOpacity={0.7} onPress={() => setAuthStep('phone')} disabled={authLoading}>
                  <View style={s.authBtnInner}>
                    <Ionicons name="call-outline" size={20} color={C.white} />
                    <Text style={[s.authBtnText, { color: C.white }]}>Telefon numarası ile giriş</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* TELEFON VERİ GİRİŞ EKRANI */}
            {authStep === 'phone' && (
              <>
                <TextInput
                  style={[s.phoneInput, { color: C.white, borderColor: C.glassBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
                  placeholder="+90 555 123 45 67"
                  placeholderTextColor={C.silverDark}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  editable={!authLoading}
                  autoFocus
                />
                
                <TouchableOpacity style={[s.authBtn, { backgroundColor: C.primary, borderColor: C.primaryStroke, marginTop: 12 }]} activeOpacity={0.8} onPress={handleSendOTP} disabled={authLoading}>
                  <View style={s.authBtnInner}>
                    <Text style={[s.authBtnText, { color: '#000', fontWeight: 'bold' }]}>{authLoading ? 'SMS Gönderiliyor...' : 'Doğrulama Kodu Gönder'}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={() => setAuthStep('methods')} disabled={authLoading}>
                  <Text style={{ color: C.silverDark, fontSize: 13 }}>Vazgeç ve Seçeneklere Dön</Text>
                </TouchableOpacity>
              </>
            )}

            {/* OTP DOĞRULAMA KODU EKRANI */}
            {authStep === 'otp' && (
              <>
                <TextInput
                  style={[s.phoneInput, { textAlign: 'center', letterSpacing: 8, fontSize: 24, paddingHorizontal: 0, color: C.white, borderColor: C.glassBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
                  placeholder="123456"
                  placeholderTextColor={C.silverDark}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  editable={!authLoading}
                  autoFocus
                />
                
                <TouchableOpacity style={[s.authBtn, { backgroundColor: C.primary, borderColor: C.primaryStroke, marginTop: 12 }]} activeOpacity={0.8} onPress={handleVerifyOTP} disabled={authLoading}>
                  <View style={s.authBtnInner}>
                    <Text style={[s.authBtnText, { color: '#000', fontWeight: 'bold' }]}>{authLoading ? 'Bilgiler Doğrulanıyor...' : 'Uygulamaya Giriş Yap'}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={() => setAuthStep('phone')} disabled={authLoading}>
                  <Text style={{ color: C.silverDark, fontSize: 13 }}>Numaramı Değiştirmek İstiyorum</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Ayırıcı */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>veya</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Misafir */}
            <TouchableOpacity style={s.guestBtn} activeOpacity={0.7} onPress={handleGuestLogin} disabled={guestLoading}>
              {guestLoading ? (
                <ActivityIndicator color={C.primary} size="small" />
              ) : (
                <Text style={[s.guestText, { color: C.silverLight }]}>Misafir olarak göz at</Text>
              )}
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      {/* Alt yazı */}
      <Animated.Text style={[s.footer, { opacity: panelOpacity, color: C.silverDark }]}>
        Devam ederek{' '}
        <Text style={[s.footerLink, { color: C.primary }]}>Gizlilik Politikası</Text> ve{' '}
        <Text style={[s.footerLink, { color: C.primary }]}>Kullanım Koşulları</Text>'nı kabul etmiş olursunuz.
      </Animated.Text>
    </View>
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
    height: height * 0.35,
  },
  topGlowGrad: {
    width: '100%',
    height: '100%',
  },
  logoArea: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logo: {
    width: width * 0.75,
    height: width * 0.75 * 0.35,
  },
  welcomeText: {
    color: COLORS.silverLight,
    fontSize: 14,
    fontWeight: FONTS.regular,
    marginTop: SPACING.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  panelWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: Platform.OS === 'android' ? height * 0.12 : height * 0.08,
  },
  blurPanel: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  panelInner: {
    padding: SPACING.lg,
    backgroundColor: COLORS.glassBg,
  },
  panelTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  panelSubtitle: {
    color: COLORS.silverLight,
    fontSize: 13,
    fontWeight: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 18,
  },
  authBtn: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryStroke,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  authBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  authBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: FONTS.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: COLORS.silverDark,
    fontSize: 12,
    marginHorizontal: SPACING.md,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  guestText: {
    color: COLORS.silverLight,
    fontSize: 14,
    fontWeight: FONTS.medium,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 48 : SPACING.lg,
    left: SPACING.xl,
    right: SPACING.xl,
    textAlign: 'center',
    color: COLORS.silverDark,
    fontSize: 11,
    lineHeight: 16,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 11,
  },
  phoneInput: {
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 8,
  },
});
