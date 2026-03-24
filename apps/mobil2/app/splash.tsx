import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  // Animasyon değerleri
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const sloganY = useRef(new Animated.Value(10)).current;

  // Glow hareketi (orijinal konsept korundu)
  const glowX = useRef(new Animated.Value(-width * 0.6)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Ek derinlik katmanları
  const glow2Scale = useRef(new Animated.Value(0.85)).current;
  const glow3Y = useRef(new Animated.Value(0)).current;

  // İnce yıldız parçacıkları
  const star1 = useRef(new Animated.Value(0)).current;
  const star2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Ana glow fade-in
    Animated.timing(glowOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // 2. Ana glow yatay hareket (orijinal pattern)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowX, {
          toValue: width * 0.6,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowX, {
          toValue: -width * 0.6,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. İkinci glow — nefes alıp veriyor (3D derinlik)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2Scale, {
          toValue: 1.1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow2Scale, {
          toValue: 0.85,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Üçüncü glow — hafif dikey kayma
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow3Y, {
          toValue: -30,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow3Y, {
          toValue: 30,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 5. Yıldız kırpışması
    Animated.loop(
      Animated.sequence([
        Animated.timing(star1, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(star1, { toValue: 0.1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(star2, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(star2, { toValue: 0.2, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // 6. Logo fade-in + scale (500ms delay)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    // 7. Slogan fade-in + yukarı kayma (1200ms delay)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(sloganOpacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sloganY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1250);

    // 8. 3sn sonra login'e geç (slogan ile senkronize exit)
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 0.88, duration: 500, useNativeDriver: true }),
        Animated.timing(sloganOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(sloganY, { toValue: 4, duration: 350, useNativeDriver: true }),
      ]).start(() => {
        router.replace('/login');
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.container}>
      {/* Derin arka plan — gradient katmanlı */}
      <LinearGradient
        colors={['#020510', '#060B18', '#0A1228', '#060B18', '#020510']}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Katman 1: Yavaşça hareket eden turkuaz glow (orijinal) — iyileştirildi */}
      <Animated.View
        style={[
          s.glowOrb,
          {
            opacity: glowOpacity,
            transform: [{ translateX: glowX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(92,225,230,0.03)',
            'rgba(92,225,230,0.08)',
            'rgba(92,225,230,0.12)',
            'rgba(92,225,230,0.08)',
            'rgba(92,225,230,0.03)',
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={s.glowGradient}
        />
      </Animated.View>

      {/* Katman 2: Nefes alan merkez glow (3D derinlik) */}
      <Animated.View
        style={[
          s.glowCenter,
          {
            opacity: glowOpacity,
            transform: [{ scale: glow2Scale }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(92,225,230,0.04)',
            'rgba(92,225,230,0.07)',
            'rgba(92,225,230,0.04)',
            'transparent',
          ]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Katman 3: Alt mor glow (derinlik hissi) */}
      <Animated.View
        style={[
          s.glowPurple,
          {
            opacity: glowOpacity,
            transform: [{ translateY: glow3Y }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(120,80,220,0.03)',
            'rgba(120,80,220,0.05)',
            'rgba(120,80,220,0.03)',
            'transparent',
          ]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Mini yıldız parçacıkları */}
      <Animated.View style={[s.star, { top: height * 0.18, left: width * 0.22 }, { opacity: star1 }]} />
      <Animated.View style={[s.star, { top: height * 0.28, right: width * 0.18 }, { opacity: star2 }]} />
      <Animated.View style={[s.star, { top: height * 0.62, left: width * 0.68 }, { opacity: star1 }]} />
      <Animated.View style={[s.star, { bottom: height * 0.22, left: width * 0.32 }, { opacity: star2 }]} />

      {/* İkon + Slogan — birlikte merkeze hizalı */}
      <View style={{ alignItems: 'center' }}>
        {/* Ana ikon */}
        <Animated.View
          style={[
            s.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../assets/images/ikon.png')}
            style={s.appIcon}
            resizeMode="contain"
          />
        </Animated.View>

        {/* ikon2.png — ikon'un hemen altında, gecikmeli beliriyor */}
        <Animated.View
          style={[
            s.sloganWrap,
            {
              opacity: sloganOpacity,
              transform: [{ translateY: sloganY }],
            },
          ]}
        >
          <Image
            source={require('../assets/images/ikon2.png')}
            style={s.ikon2}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020510',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Ana glow (orijinal pattern korundu, daha yumuşak gradientler) */
  glowOrb: {
    position: 'absolute',
    width: width * 1.4,
    height: height * 0.55,
    top: height * 0.18,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  /* Merkez nefes glow */
  glowCenter: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    top: height * 0.28,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  /* Alt mor glow */
  glowPurple: {
    position: 'absolute',
    width: width * 0.8,
    height: height * 0.3,
    bottom: height * 0.1,
    alignSelf: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  /* Yıldız */
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  /* Logo */
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    width: 380,
    height: 380,
    borderRadius: 80,
  },
  /* ikon2.png slogan */
  sloganWrap: {
    position: 'absolute',
    right: 54,   // Bir tık daha sola
    bottom: 110, // Çok az aşağı (bottom değeri küçüldükçe aşağı iner)
  },
  ikon2: {
    width: 170, // Özel talep ölçüsü (büyütüldü)
    height: 52,
  },
  /* Eski bottomLine kaldırıldı (sloganın içine taşındı) */
  bottomLine: { display: 'none' as any },
  lineGradient: { width: '100%', height: '100%' },
});
