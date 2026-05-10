import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Rolex/Gucci Ultra-Premium Palette
const OLED_BLACK = '#000000';
const DEEP_NAVY = '#040712';
const NEON_CYAN = 'rgba(92, 225, 230, ';
const VIP_PURPLE = 'rgba(120, 80, 220, ';

export default function SplashScreen() {
  const router = useRouter();

  // Animasyon state referansları
  const logoOpacity = useRef(new Animated.Value(0)).current;
  // Minimalist hafif açılma efekti için 0.95'ten 1'e scale animasyonu
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const bgGlowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Arkaplan Glow Fade-in
    Animated.timing(bgGlowOpacity, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // 2. Rolex/Gucci tarzı sakin ve statik logo "Fade-in"
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 2500, useNativeDriver: true })
      ]).start();
    }, 400);

    // 3. Ekranı temizle ve sakin bir şekilde Login'e geç
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.timing(bgGlowOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]).start(() => {
        router.replace('/login');
      });
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.container}>
      {/* OLED Deep Black Zemin */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient 
          colors={[OLED_BLACK, DEEP_NAVY, OLED_BLACK]} 
          style={StyleSheet.absoluteFill} 
          locations={[0, 0.5, 1]} 
        />
      </View>

      {/* Lüks Arkaplan Glow (Sakin Mesh) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgGlowOpacity }]}>
        <View style={s.glowOrbTop} />
        <View style={s.glowOrbBottom} />
      </Animated.View>

      {/* Sakin, sabit ikon.png */}
      <View style={s.centerContent}>
        <Animated.View style={[
          s.logoWrap, 
          { 
            opacity: logoOpacity, 
            transform: [{ scale: logoScale }] 
          }
        ]}>
          <Image source={require('../assets/images/ikon.png')} style={s.appIcon} resizeMode="contain" />
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OLED_BLACK,
  },
  glowOrbTop: {
    position: 'absolute',
    top: -height * 0.15,
    left: -width * 0.3,
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: width * 0.8,
    backgroundColor: NEON_CYAN + '0.04)',
    transform: [{ scaleY: 0.7 }],
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -height * 0.2,
    right: -width * 0.3,
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: width * 0.8,
    backgroundColor: VIP_PURPLE + '0.05)',
    transform: [{ scaleY: 0.7 }],
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    width: 250,
    height: 250,
  }
});
