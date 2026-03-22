/* ═══════════════════════════════════════════════════════════
   SopranoChat Mobil — GiftAnimation v3
   Kategori bazlı dramatik animasyonlar:
   ▪ basic    → yumuşak yükselme + soft glow
   ▪ premium  → dönerek giriş + neon shockwave
   ▪ legendary→ meteor çarpması + ekran sarsıntısı + patlama
   ═══════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Easing } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

export interface GiftAnimData {
  senderName: string;
  receiverName: string;
  giftEmoji: string;
  giftName: string;
  totalCost: number;
  giftCategory: string;
}

interface Props {
  data: GiftAnimData | null;
  onDone: () => void;
}

/* ════ PARÇACIK SİSTEMİ ════ */
function Particle({ delay, color, x, y, distance, size }: {
  delay: number; color: string; x: number; y: number; distance: number; size: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const angle = Math.random() * Math.PI * 2;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color,
      opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance] }) },
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance] }) },
        { scale: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1.5, 0] }) },
      ],
      shadowColor: color, shadowOpacity: 0.9, shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
    }} />
  );
}

/* ════ SHOCKWAVE HALKASI ════ */
function Shockwave({ color, delay, x, y }: { color: string; delay: number; x: number; y: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', left: x - 80, top: y - 80,
      width: 160, height: 160, borderRadius: 80,
      borderWidth: 3, borderColor: color,
      opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.8, 0] }),
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 3] }) }],
    }} />
  );
}

/* ════ YANAN İZ (FLAME TRAIL) ════ */
function FlameTrail({ progress, color }: { progress: Animated.Value; color: string }) {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => {
        const size = 12 - i * 1.5;
        const offsetY = i * 12;
        return (
          <Animated.View key={i} style={{
            position: 'absolute',
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: color,
            opacity: progress.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [0, 0.8 - i * 0.1, 0.5 - i * 0.08, 0],
            }),
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [W / 2, W / 2] }) },
              { translateY: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-100, H * 0.35 + offsetY, H * 0.35 + offsetY] }) },
              { scale: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [2, 1 - i * 0.1, 0] }) },
            ],
            shadowColor: color, shadowOpacity: 0.6, shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          }} />
        );
      })}
    </>
  );
}

/* ════ EKRAN FLASH ════ */
function ScreenFlash({ color }: { color: string }) {
  const flash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(flash, { toValue: 0.6, duration: 100, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, {
      backgroundColor: color, opacity: flash,
    }]} />
  );
}

/* ════ GÖNDEREN / ALAN BİLGİ BANDI ════ */
function InfoBand({ data, color, opacity, yOffset }: {
  data: GiftAnimData; color: string;
  opacity: Animated.Value; yOffset?: Animated.Value;
}) {
  return (
    <Animated.View style={[s.infoBand, {
      opacity,
      transform: yOffset ? [{ translateY: yOffset }] : [],
    }]}>
      <View style={[s.infoBandInner, { borderColor: color + '40' }]}>
        <Text style={[s.infoSender, { color }]}>{data.senderName}</Text>
        <View style={s.infoGiftRow}>
          <Text style={{ fontSize: 20 }}>{data.giftEmoji}</Text>
          <View>
            <Text style={[s.infoGiftName, { color }]}>{data.giftName}</Text>
            <View style={s.infoCostRow}>
              <Text style={{ fontSize: 10 }}>🪙</Text>
              <Text style={[s.infoCostText, { color: color + 'CC' }]}>{data.totalCost.toLocaleString()}</Text>
            </View>
          </View>
        </View>
        <View style={s.infoArrowRow}>
          <View style={[s.infoArrowLine, { backgroundColor: color + '40' }]} />
          <Text style={[s.infoArrowIcon, { color: color + '80' }]}>▶</Text>
          <View style={[s.infoArrowLine, { backgroundColor: color + '40' }]} />
        </View>
        <Text style={[s.infoReceiver, { color }]}>{data.receiverName}</Text>
      </View>
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════
   ▪▪▪ BASIC — Yumuşak Yükselme ▪▪▪
   Emoji yavaşça yukarı süzülür + soft glow
   ═══════════════════════════════════════════ */
function BasicAnimation({ data, onDone }: { data: GiftAnimData; onDone: () => void }) {
  const float = useRef(new Animated.Value(0)).current;
  const emojiOp = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0.5)).current;
  const textOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(emojiOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(emojiScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(float, { toValue: 1, duration: 2500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(textOp, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(emojiOp, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(textOp, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(onDone);
  }, []);

  return (
    <View style={s.overlay} pointerEvents="none">
      {/* Emoji yumuşak yükselme */}
      <Animated.View style={{
        position: 'absolute',
        opacity: emojiOp,
        transform: [
          { translateX: W / 2 - 30 },
          { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [H * 0.6, H * 0.3] }) },
          { scale: emojiScale },
        ],
      }}>
        <Text style={{ fontSize: 56 }}>{data.giftEmoji}</Text>
      </Animated.View>

      {/* Parçacıklar */}
      {Array.from({ length: 8 }, (_, i) => (
        <Particle key={i} delay={400 + i * 80} color="#4ade80" x={W / 2} y={H * 0.38} distance={60} size={4} />
      ))}

      <InfoBand data={data} color="#4ade80" opacity={textOp} />
    </View>
  );
}

/* ═══════════════════════════════════════════
   ▪▪▪ PREMIUM — Dönerek Giriş + Neon Shockwave ▪▪▪
   Emoji hızla dönerek gelir, shockwave yayılır
   ═══════════════════════════════════════════ */
function PremiumAnimation({ data, onDone }: { data: GiftAnimData; onDone: () => void }) {
  const spin = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const emojiOp = useRef(new Animated.Value(0)).current;
  const textOp = useRef(new Animated.Value(0)).current;
  const bgOp = useRef(new Animated.Value(0)).current;
  const [showShock, setShowShock] = useState(false);

  useEffect(() => {
    Animated.sequence([
      // Arka plan karartma
      Animated.timing(bgOp, { toValue: 0.3, duration: 200, useNativeDriver: true }),
      // Emoji dönerek giriş
      Animated.parallel([
        Animated.timing(emojiOp, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(spin, { toValue: 2, duration: 800, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.spring(emojiScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
      ]),
      // Bounce + shockwave
      Animated.sequence([
        Animated.timing(emojiScale, { toValue: 1.4, duration: 150, useNativeDriver: true }),
        Animated.timing(emojiScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setShowShock(true);
      Animated.sequence([
        Animated.timing(textOp, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.parallel([
          Animated.timing(emojiOp, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(textOp, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(bgOp, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start(onDone);
    });
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 2], outputRange: ['0deg', '720deg'] });

  return (
    <View style={s.overlay} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a0a2e', opacity: bgOp }]} />

      {/* Shockwave halkaları */}
      {showShock && (
        <>
          <Shockwave color="#c084fc" delay={0} x={W / 2} y={H * 0.37} />
          <Shockwave color="#a855f7" delay={150} x={W / 2} y={H * 0.37} />
          <Shockwave color="#8b5cf6" delay={300} x={W / 2} y={H * 0.37} />
        </>
      )}

      {/* Dönen Emoji */}
      <Animated.View style={{
        position: 'absolute', left: W / 2 - 45, top: H * 0.3,
        opacity: emojiOp,
        transform: [{ scale: emojiScale }, { rotate }],
      }}>
        <Text style={{ fontSize: 80, textShadowColor: '#a855f7', textShadowRadius: 20, textShadowOffset: { width: 0, height: 0 } }}>
          {data.giftEmoji}
        </Text>
      </Animated.View>

      {/* Parçacıklar */}
      {showShock && Array.from({ length: 16 }, (_, i) => (
        <Particle key={i} delay={i * 50} color={['#c084fc', '#a855f7', '#e879f9'][i % 3]} x={W / 2} y={H * 0.37} distance={100 + Math.random() * 60} size={4 + Math.random() * 4} />
      ))}

      <InfoBand data={data} color="#c084fc" opacity={textOp} />
    </View>
  );
}

/* ═══════════════════════════════════════════
   ▪▪▪ LEGENDARY — Meteor Çarpması ▪▪▪
   Emoji yukarıdan meteor gibi çarpar,
   ekran sarsılır, dev patlama, flash
   ═══════════════════════════════════════════ */
function LegendaryAnimation({ data, onDone }: { data: GiftAnimData; onDone: () => void }) {
  const meteorY = useRef(new Animated.Value(-150)).current;
  const emojiScale = useRef(new Animated.Value(3)).current;
  const emojiOp = useRef(new Animated.Value(0)).current;
  const textOp = useRef(new Animated.Value(0)).current;
  const bgOp = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const [showFlash, setShowFlash] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [showShock, setShowShock] = useState(false);
  const textSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      // Arka plan
      Animated.timing(bgOp, { toValue: 0.5, duration: 300, useNativeDriver: true }),
      // Trail + meteor düşüşü
      Animated.parallel([
        Animated.timing(emojiOp, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(meteorY, { toValue: H * 0.32, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(emojiScale, { toValue: 1.2, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start(() => {
      // ÇARPMA ANI
      setShowFlash(true);
      setShowBurst(true);
      setShowShock(true);

      // Sarsıntı
      Animated.sequence([
        Animated.timing(shake, { toValue: 12, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 4, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -2, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      // Emoji duraklama + büyüme
      Animated.sequence([
        Animated.spring(emojiScale, { toValue: 1.5, friction: 3, tension: 80, useNativeDriver: true }),
        Animated.timing(emojiScale, { toValue: 1.2, duration: 300, useNativeDriver: true }),
      ]).start();

      // Metin göster
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(textOp, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(textSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        ]),
        Animated.delay(2500),
        // Çıkış
        Animated.parallel([
          Animated.timing(emojiOp, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(textOp, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(bgOp, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(emojiScale, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ]),
      ]).start(onDone);
    });
  }, []);

  return (
    <Animated.View style={[s.overlay, { transform: [{ translateX: shake }] }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a0505', opacity: bgOp }]} />

      {/* Ekran flash */}
      {showFlash && <ScreenFlash color="#fbbf24" />}

      {/* Flame trail */}
      <FlameTrail progress={useRef(new Animated.Value(0)).current} color="#f59e0b" />

      {/* Shockwave halkaları */}
      {showShock && (
        <>
          <Shockwave color="#fbbf24" delay={0} x={W / 2} y={H * 0.37} />
          <Shockwave color="#f97316" delay={120} x={W / 2} y={H * 0.37} />
          <Shockwave color="#ef4444" delay={240} x={W / 2} y={H * 0.37} />
          <Shockwave color="#fbbf24" delay={400} x={W / 2} y={H * 0.37} />
        </>
      )}

      {/* Meteor Emoji */}
      <Animated.View style={{
        position: 'absolute', left: W / 2 - 55,
        opacity: emojiOp,
        transform: [
          { translateY: meteorY },
          { scale: emojiScale },
        ],
      }}>
        <Text style={{
          fontSize: 100,
          textShadowColor: '#f59e0b',
          textShadowRadius: 30,
          textShadowOffset: { width: 0, height: 0 },
        }}>
          {data.giftEmoji}
        </Text>
      </Animated.View>

      {/* Dev patlama parçacıkları */}
      {showBurst && Array.from({ length: 30 }, (_, i) => (
        <Particle key={i}
          delay={i * 30}
          color={['#fbbf24', '#f59e0b', '#ef4444', '#f97316', '#fcd34d'][i % 5]}
          x={W / 2} y={H * 0.37}
          distance={80 + Math.random() * 120}
          size={4 + Math.random() * 8}
        />
      ))}

      <InfoBand data={data} color="#fbbf24" opacity={textOp} yOffset={textSlide} />
    </Animated.View>
  );
}

/* ══════════════════════════════════════════
   ANA BILEŞEN — Kategori yönlendirici
   ══════════════════════════════════════════ */
export default function GiftAnimation({ data, onDone }: Props) {
  if (!data) return null;

  switch (data.giftCategory) {
    case 'legendary':
      return <LegendaryAnimation data={data} onDone={onDone} />;
    case 'premium':
      return <PremiumAnimation data={data} onDone={onDone} />;
    default:
      return <BasicAnimation data={data} onDone={onDone} />;
  }
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },

  /* Info Band — Alt bilgi şeridi */
  infoBand: {
    position: 'absolute',
    bottom: H * 0.22,
    left: 0, right: 0,
    alignItems: 'center',
  },
  infoBandInner: {
    alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    gap: 4,
  },
  infoSender: {
    fontSize: 16, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  infoGiftRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  infoGiftName: {
    fontSize: 13, fontWeight: '700',
  },
  infoCostRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1,
  },
  infoCostText: {
    fontSize: 11, fontWeight: '700',
  },
  infoArrowRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  infoArrowLine: {
    width: 16, height: 1,
  },
  infoArrowIcon: {
    fontSize: 8,
  },
  infoReceiver: {
    fontSize: 16, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
