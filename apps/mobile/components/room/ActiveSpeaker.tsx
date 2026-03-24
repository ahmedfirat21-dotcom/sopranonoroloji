import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions, LayoutAnimation, Platform, UIManager, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getRoleIcon, getRoleColor, getRoleLabel } from '../../utils/roleHelpers';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 80;
const RING_SIZE = AVATAR_SIZE + 16;
const MOON_SIZE = 72;

interface ActiveSpeakerProps {
  userId?: string;
  displayName?: string;
  avatar?: string;
  role?: string;
  speaking?: boolean;
  muted?: boolean;
  camOn?: boolean;
  duration?: number;
  startedAt?: number;
  onExitComplete?: () => void;
}

/* ── Ses Dalgası — 3 genişleyen halka + Ay ışığı glow ── */
function NeonSpeakingRing({ speaking, hideMoon }: { speaking: boolean; hideMoon?: boolean }) {
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring3 = useRef(new Animated.Value(1)).current;
  const op1 = useRef(new Animated.Value(0)).current;
  const op2 = useRef(new Animated.Value(0)).current;
  const op3 = useRef(new Animated.Value(0)).current;
  const glowOp = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    if (!speaking) {
      [ring1, ring2, ring3].forEach(r => r.setValue(1));
      [op1, op2, op3].forEach(o => o.setValue(0));
      glowOp.setValue(0.15);
      return;
    }

    const animate = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.4, duration: 1600, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.7, duration: 300, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 1300, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
      ])).start();
    };

    animate(ring1, op1, 0);
    animate(ring2, op2, 530);
    animate(ring3, op3, 1060);

    // Ay ışığı glow pulse
    Animated.loop(Animated.sequence([
      Animated.timing(glowOp, { toValue: 0.35, duration: 1500, useNativeDriver: true }),
      Animated.timing(glowOp, { toValue: 0.15, duration: 1500, useNativeDriver: true }),
    ])).start();
  }, [speaking]);

  const ringStyle = {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: '#00ff88',
  };

  return (
    <>
      {/* Ay ışığı — blur hüzmeleri (kamera açıkken gizle) */}
      {!hideMoon && (
        <>
      <Animated.View style={{
        ...StyleSheet.absoluteFillObject,
        margin: -25,
        borderRadius: 999,
        backgroundColor: '#c8e6ff',
        opacity: Animated.multiply(glowOp, 0.3),
      }} />
      <Animated.View style={{
        ...StyleSheet.absoluteFillObject,
        margin: -15,
        borderRadius: 999,
        backgroundColor: '#dbeeff',
        opacity: Animated.multiply(glowOp, 0.5),
      }} />
      <Animated.View style={{
        ...StyleSheet.absoluteFillObject,
        margin: -7,
        borderRadius: 999,
        backgroundColor: '#e8f4ff',
        opacity: glowOp,
      }} />
      </>)}

      {/* Konuşma halkaları */}
      {speaking && (
        <>
          <Animated.View style={[ringStyle, { opacity: op1, transform: [{ scale: ring1 }] }]} />
          <Animated.View style={[ringStyle, { opacity: op2, transform: [{ scale: ring2 }] }]} />
          <Animated.View style={[ringStyle, { opacity: op3, transform: [{ scale: ring3 }], borderWidth: 1.5 }]} />
        </>
      )}
    </>
  );
}

/* ── Yıldız Parçacıkları ── */
function TwinklingStars() {
  const stars = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      x: Math.cos((i / 10) * Math.PI * 2) * (MOON_SIZE / 2 + 10 + Math.random() * 16),
      y: Math.sin((i / 10) * Math.PI * 2) * (MOON_SIZE / 2 + 10 + Math.random() * 16),
      size: 1 + Math.random() * 1.2,
      opacity: new Animated.Value(0.1 + Math.random() * 0.2),
    }))
  ).current;

  useEffect(() => {
    stars.forEach((star) => {
      Animated.loop(Animated.sequence([
        Animated.timing(star.opacity, { toValue: 0.03, duration: 1500 + Math.random() * 2000, useNativeDriver: true }),
        Animated.timing(star.opacity, { toValue: 0.4 + Math.random() * 0.3, duration: 1500 + Math.random() * 2000, useNativeDriver: true }),
      ])).start();
    });
  }, []);

  const center = (MOON_SIZE + 40) / 2;
  return (
    <>
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: star.size, height: star.size, borderRadius: star.size / 2,
            backgroundColor: '#fff', opacity: star.opacity,
            left: center + star.x - star.size / 2,
            top: center + star.y - star.size / 2,
          }}
        />
      ))}
    </>
  );
}

/* ── Süre Sayacı ── */
function DurationCounter({ duration, startedAt }: { duration?: number; startedAt?: number }) {
  const [remaining, setRemaining] = React.useState<number | null>(null);
  useEffect(() => {
    if (!duration || !startedAt) { setRemaining(null); return; }
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      setRemaining(Math.max(0, Math.ceil((duration - elapsed) / 1000)));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [duration, startedAt]);
  if (remaining == null) return null;
  return (
    <View style={s.timerPill}>
      <Ionicons name="timer-outline" size={11} color="#00ff88" />
      <Text style={s.timerText}>{Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}</Text>
    </View>
  );
}

/* ══════════════════════════════════════════
   ACTIVE SPEAKER SPOTLIGHT
   ══════════════════════════════════════════ */
export default function ActiveSpeaker(props: ActiveSpeakerProps) {
  const { userId, displayName, avatar, role, speaking, muted, camOn, duration, startedAt, onExitComplete } = props;
  const roleColor = getRoleColor(role);
  const roleIcon = getRoleIcon(role);
  const roleLabel = getRoleLabel(role);

  const breathe = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1.03, duration: 2000, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 1, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  /* Konuşmacı YOK — GERÇEKÇİ AY */
  if (!userId) {
    return (
      <View style={s.container}>
        <View style={s.moonWrapper}>
          <TwinklingStars />

          {/* Ay — tek daire, glow yok, doğrudan yüzey */}
          <View style={s.moonOuter}>
            {/* Ana ay yüzeyi */}
            <LinearGradient
              colors={['#e8deb5', '#d8ce9f', '#c8be8f', '#bab080']}
              start={{ x: 0.2, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
              style={s.moonSurface}
            >
              {/* Maria — koyu lekeler */}
              <View style={[ms.m, { width: 28, height: 24, top: 16, left: 18, borderRadius: 14, opacity: 0.22, transform: [{ rotate: '-12deg' }] }]} />
              <View style={[ms.m, { width: 16, height: 14, top: 12, left: 48, borderRadius: 8, opacity: 0.15, transform: [{ rotate: '20deg' }] }]} />
              <View style={[ms.m, { width: 20, height: 18, top: 48, left: 14, borderRadius: 11, opacity: 0.18, transform: [{ rotate: '8deg' }] }]} />
              <View style={[ms.m, { width: 12, height: 10, top: 38, left: 55, borderRadius: 6, opacity: 0.12 }]} />
              <View style={[ms.m, { width: 15, height: 12, top: 65, left: 38, borderRadius: 7, opacity: 0.14, transform: [{ rotate: '-18deg' }] }]} />
              <View style={[ms.m, { width: 8, height: 7, top: 28, left: 35, borderRadius: 4, opacity: 0.10 }]} />

              {/* Krateler */}
              <View style={[ms.c, { width: 7, height: 7, top: 25, left: 62 }]} />
              <View style={[ms.c, { width: 4, height: 4, top: 76, left: 26 }]} />
              <View style={[ms.c, { width: 5, height: 5, top: 58, left: 68 }]} />
              <View style={[ms.c, { width: 3, height: 3, top: 14, left: 72 }]} />
              <View style={[ms.c, { width: 6, height: 6, top: 78, left: 54 }]} />

              {/* Mikrofon ikonu — çok hafif */}
              <View style={s.moonMicWrap}>
                <Ionicons name="mic-outline" size={26} color="rgba(90,80,50,0.45)" />
              </View>
            </LinearGradient>
          </View>

          <Text style={s.moonText}>Mikrofon boşta</Text>
          <Text style={s.moonSubText}>El kaldırarak söz isteyebilirsiniz</Text>
        </View>
      </View>
    );
  }

  const camSize = camOn ? 140 : AVATAR_SIZE;
  const camRing = camSize + 16;

  // Ay animasyonu hook'ları (her zaman çağrılmalı — conditional hook yasak)
  const moonRotation = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;
  const isEmpty = userId === 'empty';

  // Önceki konuşmacı verilerini sakla (exit animasyonu için)
  const lastSpeaker = useRef({ avatar, displayName, role, speaking, muted, camOn });
  if (!isEmpty) {
    lastSpeaker.current = { avatar, displayName, role, speaking, muted, camOn };
  }
  // Exit animasyonunda eskiyi kullan
  const sp = isEmpty ? lastSpeaker.current : { avatar, displayName, role, speaking, muted, camOn };
  const spRoleIcon = getRoleIcon(sp.role);
  const spRoleColor = getRoleColor(sp.role);
  const spRoleLabel = getRoleLabel(sp.role);
  useEffect(() => {
    if (!isEmpty) return;
    const r = Animated.loop(
      Animated.timing(moonRotation, { toValue: 1, duration: 120000, useNativeDriver: true })
    );
    r.start();
    const g = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.7, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    g.start();
    return () => { r.stop(); g.stop(); };
  }, [isEmpty]);

  const moonSpin = moonRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const MOON_S = RING_SIZE;

  // Crossfade: 1 = ay görünür, 0 = avatar görünür
  const crossfade = useRef(new Animated.Value(isEmpty ? 1 : 0)).current;
  const badgeAnim = useRef(new Animated.Value(isEmpty ? 0 : 1)).current;
  // Avatar'ı animasyon bitene kadar DOM'da tut
  const [showAvatar, setShowAvatar] = useState(!isEmpty);

  useEffect(() => {
    if (isEmpty) {
      // Mikrofon bırakıldı: önce badge'ler → sonra avatar küçülsün → ay doğsun → sonra unmount
      Animated.sequence([
        Animated.timing(badgeAnim, { toValue: 0, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(crossfade, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]).start(() => {
        setShowAvatar(false);
        onExitComplete?.();
      });
    } else {
      // Mikrofon alındı: hemen avatar'ı DOM'a ekle, sonra animasyon
      setShowAvatar(true);
      crossfade.setValue(1); // Başlangıç: ay görünür
      badgeAnim.setValue(0); // Badge'ler gizli
      Animated.sequence([
        Animated.timing(crossfade, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(badgeAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      ]).start();
    }
  }, [isEmpty]);

  const moonOpacity = crossfade;
  const moonScale = crossfade;
  const avatarOpacity = crossfade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const avatarScale = crossfade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const badgeScale = badgeAnim;
  const badgeOpacity = badgeAnim;

  return (
    <View style={s.container}>
      {/* ── AY KATMANI ── */}
      <Animated.View style={[s.avatarOuter, { transform: [{ scale: Animated.multiply(breathe, moonScale) }], opacity: moonOpacity }]}>
        {/* Glow — 2 katman (eskiden 6 idi, sadeleştirildi) */}
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, margin: -30, borderRadius: 999, backgroundColor: '#fff2cc', opacity: Animated.multiply(glowPulse, 0.08), shadowColor: '#fff2cc', shadowOpacity: 0.3, shadowRadius: 16, elevation: 5 }} />
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, margin: -10, borderRadius: 999, backgroundColor: '#fffae8', opacity: Animated.multiply(glowPulse, 0.18), shadowColor: '#fffae8', shadowOpacity: 0.4, shadowRadius: 10, elevation: 3 }} />
        <View style={{ width: MOON_S, height: MOON_S, borderRadius: MOON_S / 2, overflow: 'hidden' }}>
          <Animated.Image
            source={require('../../assets/moon.png')}
            style={{ width: MOON_S * 1.3, height: MOON_S * 1.3, marginTop: -MOON_S * 0.15, marginLeft: -MOON_S * 0.15, transform: [{ rotate: moonSpin }] }}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {/* ── AVATAR — ayın merkezinden doğar, geri çekilir ── */}
      {showAvatar && (
        <Animated.View style={[s.avatarOuter, { position: 'absolute', transform: [{ scale: Animated.multiply(breathe, avatarScale) }], opacity: avatarOpacity }]}>
          <NeonSpeakingRing speaking={!!sp.speaking} hideMoon={!!sp.camOn} />
          <View style={[s.avatarBorder, { width: camSize, height: camSize, borderRadius: camSize / 2 }, sp.speaking && { borderColor: '#00ff88' }]}>
            {sp.camOn ? (
              <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f3460']}
                style={[{ width: camSize - 8, height: camSize - 8, borderRadius: (camSize - 8) / 2, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="videocam" size={32} color="rgba(255,255,255,0.6)" />
                <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>CANLI</Text>
              </LinearGradient>
            ) : (
              <Image source={{ uri: sp.avatar || 'https://sopranochat.com/avatars/neutral_1.png' }} style={s.avatarImg} />
            )}
          </View>
          <Animated.View style={[s.micBadge, { transform: [{ scale: badgeScale }], opacity: badgeOpacity }, sp.speaking ? { backgroundColor: '#00ff88' } : sp.muted ? { backgroundColor: '#ef4444' } : { backgroundColor: 'rgba(100,100,100,0.8)' }]}>
            <Ionicons name={sp.muted ? 'mic-off' : 'mic'} size={12} color={sp.speaking ? '#0a0e27' : '#fff'} />
          </Animated.View>
          {spRoleIcon ? (
            <Animated.View style={[s.roleBadge, { backgroundColor: spRoleColor, transform: [{ scale: badgeScale }], opacity: badgeOpacity }]}>
              <Text style={s.roleEmoji}>{spRoleIcon}</Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      )}

      {/* ── İSİM + BİLGİ ── */}
      <Animated.Text style={[s.name, isEmpty ? { color: 'rgba(255,248,220,0.4)', marginTop: 10, opacity: moonOpacity } : { color: spRoleColor, opacity: avatarOpacity }]} numberOfLines={1}>
        {isEmpty && !showAvatar ? 'Mikrofon boş' : (sp.displayName || 'Bilinmiyor')}
      </Animated.Text>
      {showAvatar && (
        <Animated.View style={[s.infoRow, { opacity: badgeOpacity, transform: [{ scale: badgeScale }] }]}>
          <View style={[s.rolePill, { borderColor: spRoleColor + '40' }]}>
            <Text style={[s.roleText, { color: spRoleColor }]}>{spRoleLabel}</Text>
          </View>
          <DurationCounter duration={duration} startedAt={startedAt} />
        </Animated.View>
      )}
    </View>
  );
}

/* Ay yüzey stilleri */
const ms = StyleSheet.create({
  m: { position: 'absolute', backgroundColor: 'rgba(90,80,55,0.5)' },
  c: { position: 'absolute', borderRadius: 50, borderWidth: 0.8, borderColor: 'rgba(100,90,65,0.25)', backgroundColor: 'rgba(80,70,50,0.15)', opacity: 0.5 },
});

const s = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 16, paddingBottom: 14, paddingHorizontal: 20 },

  /* ── Ay ── */
  moonWrapper: {
    width: MOON_SIZE + 40, height: MOON_SIZE + 40,
    alignItems: 'center', justifyContent: 'center',
  },
  moonOuter: {
    width: MOON_SIZE, height: MOON_SIZE, borderRadius: MOON_SIZE / 2,
    overflow: 'hidden',
  },
  moonSurface: {
    width: MOON_SIZE, height: MOON_SIZE, borderRadius: MOON_SIZE / 2,
  },
  moonMicWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  moonText: { fontSize: 11, fontWeight: '600', color: 'rgba(210,200,150,0.4)', marginTop: 6 },
  moonSubText: { fontSize: 9, color: 'rgba(210,200,150,0.22)', marginTop: 2, textAlign: 'center' },

  /* Avatar */
  avatarOuter: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  avatarBorder: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0e27',
  },
  avatarImg: { width: AVATAR_SIZE - 8, height: AVATAR_SIZE - 8, borderRadius: (AVATAR_SIZE - 8) / 2 },
  micBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#0a0e27',
  },
  roleBadge: {
    position: 'absolute', top: 2, left: 2,
    minWidth: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 2, borderColor: '#0a0e27',
  },
  roleEmoji: { fontSize: 11 },
  name: {
    fontSize: 17, fontWeight: '800', marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  rolePill: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  roleText: { fontSize: 10, fontWeight: '700' },
  timerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, backgroundColor: 'rgba(0,255,136,0.1)',
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.2)',
  },
  timerText: { fontSize: 11, fontWeight: '700', color: '#00ff88', fontVariant: ['tabular-nums'] },
});
