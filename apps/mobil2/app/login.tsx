import React, { useEffect, useRef, useState } from 'react';
import { 
  View, Text, StyleSheet, Animated, Dimensions, Image, 
  TouchableOpacity, Platform, TextInput, KeyboardAvoidingView, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { loginWithGoogle, loginWithApple, sendPhoneOTP, verifyPhoneOTP } from '../services/firebaseAuth';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Rolex/Gucci Ultra-Premium Palette
const OLED_BLACK = '#000000';
const DEEP_NAVY = '#040712';
const NEON_CYAN = 'rgba(92, 225, 230, ';
const VIP_PURPLE = 'rgba(120, 80, 220, ';
const GOLD_ACCENT = '#D4AF37';

export default function LoginScreen() {
  const router = useRouter();
  const { isLoggedIn, loginWithFirebase } = useUser();
  const [guestLoading, setGuestLoading] = useState(false);
  
  const [authLoading, setAuthLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'methods' | 'phone' | 'otp'>('methods');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmResult, setConfirmResult] = useState<any>(null);

  // Animasyon Ref'leri
  const panelY = useRef(new Animated.Value(height * 0.4)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Haptic yardımcı fonksiyonu
  const hapticImpact = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // 1. "logo.png" Sabit ve Sakin Giriş
    Animated.timing(logoOpacity, { toValue: 1, duration: 1500, useNativeDriver: true }).start();

    // 2. Alt Panel Süzülerek Çıkışı
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(panelY, { toValue: 0, friction: 10, tension: 45, useNativeDriver: true }),
        Animated.timing(panelOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 400);
  }, []);

  const switchStep = (step: 'methods' | 'phone' | 'otp') => {
    hapticImpact();
    setAuthStep(step);
  };

  // ─── AUTH FONKSİYONLARI ───
  const handleGoogleLogin = async () => {
    hapticImpact();
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

  const handleAppleLogin = async () => {
    hapticImpact();
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

  const handleSendOTP = async () => {
    if (!phoneNumber) return Alert.alert('Hata', 'Telefon Numaranızı formatında girin.');
    hapticImpact();
    setAuthLoading(true);
    try {
      const res = await sendPhoneOTP(phoneNumber);
      if (!res.success) {
        Alert.alert('Hata', res.error || 'SMS Gönderilemedi');
        return;
      }
      setConfirmResult(res.confirmation);
      switchStep('otp');
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || !confirmResult) return Alert.alert('Hata', 'Kodu girmelisiniz.');
    hapticImpact();
    setAuthLoading(true);
    try {
      const res = await verifyPhoneOTP(confirmResult, otpCode);
      if (!res.success) {
        Alert.alert('Hata', res.error || 'Kod geçersiz.');
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

  const handleGuestLogin = () => {
    hapticImpact();
    router.push('/setup'); 
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* OLED Deep Black & Mesh Glow Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient 
          colors={[OLED_BLACK, DEEP_NAVY, OLED_BLACK]} 
          style={StyleSheet.absoluteFill} 
          locations={[0, 0.6, 1]} 
        />
        <View style={s.glowOrbTop} />
        <View style={s.glowOrbBottom} />
      </View>

      {/* Sabit Logonun Alanı (login.png dediğiniz logo.png) */}
      <View style={s.logoArea}>
        <Animated.View style={[s.logoCenter, { opacity: logoOpacity }]}>
          <Image source={require('../assets/images/logo.png')} style={s.logo} resizeMode="contain" />
        </Animated.View>
      </View>

      {/* Gerçek Glassmorphism Auth Panel */}
      <Animated.View style={[s.panelWrap, { opacity: panelOpacity, transform: [{ translateY: panelY }] }]}>
        <BlurView intensity={65} tint="dark" style={s.blurContainer}>
          <View style={s.panelInner}>
            <Text style={s.panelTitle}>Giriş Yap</Text>
            <Text style={s.panelSubtitle}>
              {authStep === 'methods' && 'Soprano ekosistemine katılmak için bir yöntem seçin'}
              {authStep === 'phone' && 'Telefon numaranızı (+90...) formatında girin'}
              {authStep === 'otp' && 'Cihazınıza gönderilen 6 haneli kodu girin'}
            </Text>

            {/* SEÇENEKLER FORMU */}
            {authStep === 'methods' && (
              <View style={s.formContainer}>
                <TouchableOpacity style={s.authBtn} activeOpacity={0.8} onPress={handleGoogleLogin} disabled={authLoading}>
                  <View style={s.authBtnBackground}>
                    <Ionicons name="logo-google" size={20} color="#fff" />
                    <Text style={s.authBtnText}>{authLoading ? 'Bağlanıyor...' : 'Google ile Devam Et'}</Text>
                  </View>
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={s.authBtn} activeOpacity={0.8} onPress={handleAppleLogin} disabled={authLoading}>
                    <View style={s.authBtnBackground}>
                      <Ionicons name="logo-apple" size={22} color="#fff" />
                      <Text style={s.authBtnText}>{authLoading ? 'Bağlanıyor...' : 'Apple ile Devam Et'}</Text>
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={s.authBtnBase} activeOpacity={0.8} onPress={() => switchStep('phone')} disabled={authLoading}>
                  <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} />
                  <Ionicons name="call-outline" size={20} color={GOLD_ACCENT} />
                  <Text style={[s.authBtnText, { color: GOLD_ACCENT }]}>Telefon Numarası ile Giriş</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* TELEFON NUMARASI FORMU */}
            {authStep === 'phone' && (
              <View style={s.formContainer}>
                <TextInput
                  style={s.numpadInput}
                  placeholder="+90 555 123 45 67"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  editable={!authLoading}
                  autoFocus
                />
                
                <TouchableOpacity style={s.primaryBtn} activeOpacity={0.8} onPress={handleSendOTP} disabled={authLoading}>
                  <LinearGradient colors={['#D4AF37', '#AA8222']} style={StyleSheet.absoluteFill} />
                  <Text style={s.primaryBtnText}>{authLoading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.cancelLink} onPress={() => switchStep('methods')} disabled={authLoading}>
                  <Text style={s.cancelLinkText}>Vazgeç ve Seçeneklere Dön</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* OTP DOĞRULAMA FORMU */}
            {authStep === 'otp' && (
              <View style={s.formContainer}>
                <TextInput
                  style={[s.numpadInput, { textAlign: 'center', letterSpacing: 10, fontSize: 24 }]}
                  placeholder="123456"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  editable={!authLoading}
                  autoFocus
                />
                
                <TouchableOpacity style={s.primaryBtn} activeOpacity={0.8} onPress={handleVerifyOTP} disabled={authLoading}>
                  <LinearGradient colors={['#D4AF37', '#AA8222']} style={StyleSheet.absoluteFill} />
                  <Text style={s.primaryBtnText}>{authLoading ? 'Doğrulanıyor...' : 'Uygulamaya Giriş Yap'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.cancelLink} onPress={() => switchStep('phone')} disabled={authLoading}>
                  <Text style={s.cancelLinkText}>Numaramı Değiştirmek İstiyorum</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Ayırıcı */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>veya</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity style={s.guestBtn} activeOpacity={0.7} onPress={handleGuestLogin} disabled={guestLoading}>
              <Text style={s.guestText}>Misafir Vitrini ile Göz At</Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* Gizlilik Politikası Text'i */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Devam ederek {' '}
            <Text style={s.footerLink}>Gizlilik Politikası</Text> ve {' '}
            <Text style={s.footerLink}>Kullanım Koşulları</Text>'nı kabul etmiş olursunuz.
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OLED_BLACK,
  },
  glowOrbTop: {
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.2,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: NEON_CYAN + '0.03)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -height * 0.1,
    right: -width * 0.2,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: VIP_PURPLE + '0.04)',
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  logoCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 120, // logoya uygun biraz yayvan boyut
  },
  panelWrap: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? height * 0.16 : height * 0.12,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', // Gerçek Glassmorphism Kenarlığı
    backgroundColor: 'rgba(255,255,255,0.03)', // Hafif buzlu zemin
  },
  panelInner: {
    padding: 24,
  },
  panelTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  panelSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  formContainer: {
    width: '100%',
  },
  authBtn: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  authBtnBase: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)', 
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  authBtnBackground: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  authBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  numpadInput: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontWeight: '600',
  },
  primaryBtn: {
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: OLED_BLACK, 
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  cancelLinkText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginHorizontal: 16,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: GOLD_ACCENT,
    fontWeight: '600',
  },
});
