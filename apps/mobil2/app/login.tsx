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

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { colors: C, isDark } = useTheme();
  const { isLoggedIn, login } = useUser();
  const [guestLoading, setGuestLoading] = useState(false);

  const panelY = useRef(new Animated.Value(height * 0.4)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-width)).current;

  // Zaten giriş yapmışsa home'a yönlendir
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/home');
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

  // Google/Apple/Telefon — setup'a yönlendir (profil oluşturma)
  const handleLogin = () => {
    router.replace('/setup');
  };

  // Misafir girişi — rastgele isimle direkt giriş
  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const guestNames = ['Misafir', 'Ziyaretçi', 'Konuk', 'Gezgin'];
      const randomName = guestNames[Math.floor(Math.random() * guestNames.length)] + '_' + Math.floor(Math.random() * 9999);
      await login(randomName);
      router.replace('/home');
    } catch (e: any) {
      console.warn('[Login] Misafir giriş hatası:', e.message);
      // Hata olsa bile home'a git (offline mod)
      router.replace('/home');
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
              Soprano ailesine katılmak için bir yöntem seçin
            </Text>

            {/* Google Butonu */}
            <TouchableOpacity style={[s.authBtn, { borderColor: C.primaryStroke, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]} activeOpacity={0.7} onPress={handleLogin}>
              <View style={s.authBtnInner}>
                <Ionicons name="logo-google" size={20} color={C.white} />
                <Text style={[s.authBtnText, { color: C.white }]}>Google ile devam et</Text>
              </View>
            </TouchableOpacity>

            {/* Apple Butonu */}
            <TouchableOpacity style={[s.authBtn, { borderColor: C.primaryStroke, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]} activeOpacity={0.7} onPress={handleLogin}>
              <View style={s.authBtnInner}>
                <Ionicons name="logo-apple" size={22} color={C.white} />
                <Text style={[s.authBtnText, { color: C.white }]}>Apple ile devam et</Text>
              </View>
            </TouchableOpacity>

            {/* Telefon Butonu */}
            <TouchableOpacity style={[s.authBtn, { borderColor: C.primaryStroke, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]} activeOpacity={0.7} onPress={handleLogin}>
              <View style={s.authBtnInner}>
                <Ionicons name="call-outline" size={20} color={C.white} />
                <Text style={[s.authBtnText, { color: C.white }]}>Telefon numarası ile giriş</Text>
              </View>
            </TouchableOpacity>

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
});
