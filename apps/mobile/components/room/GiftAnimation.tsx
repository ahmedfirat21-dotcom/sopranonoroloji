/* ═══════════════════════════════════════════════════════════
   SopranoChat Mobil — GiftAnimation v4 (Minimal)
   Eski ağır parçacık/shockwave/flame sistemi kaldırıldı.
   İleride buraya profesyonel Lottie animasyonları eklenecek.
   Şimdilik sadece şık bir bildirim bandı gösterilir.
   ═══════════════════════════════════════════════════════════ */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';

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

/*
 * ════════════════════════════════════════════════════
 * ESKİ PARÇACIK SİSTEMİ (DEVRE DIŞI)
 * Aşağıdaki bileşenler kaldırıldı:
 *   - Particle (rastgele dağılım)
 *   - Shockwave (genişleyen halka)
 *   - FlameTrail (yanan iz)
 *   - ScreenFlash (ekran flaşı)
 *   - BasicAnimation, PremiumAnimation, LegendaryAnimation
 *
 * İleride Lottie entegrasyonu yapılacak.
 * ════════════════════════════════════════════════════
 */

/* ═══════════════════════════════════════════
   MİNİMAL HEDİYE BANDI
   Temiz bir fade-in/out banner — emoji + isimler
   ═══════════════════════════════════════════ */
export default function GiftAnimation({ data, onDone }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const emojiScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!data) return;

    // Giriş
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.spring(emojiScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start(() => {
      // Bekle
      Animated.delay(2500).start(() => {
        // Çıkış
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 400, useNativeDriver: true }),
        ]).start(() => {
          // Sıfırla
          opacity.setValue(0);
          translateY.setValue(20);
          emojiScale.setValue(0.5);
          onDone();
        });
      });
    });
  }, [data]);

  if (!data) return null;

  const categoryColor = data.giftCategory === 'legendary' ? '#fbbf24'
    : data.giftCategory === 'premium' ? '#c084fc'
    : '#4ade80';

  return (
    <Animated.View
      style={[s.container, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <View style={[s.band, { borderColor: categoryColor + '40' }]}>
        {/* Gönderen */}
        <Text style={[s.sender, { color: categoryColor }]}>{data.senderName}</Text>

        {/* Ok + Emoji */}
        <View style={s.emojiRow}>
          <View style={[s.arrowLine, { backgroundColor: categoryColor + '40' }]} />
          <Animated.Text style={[s.emoji, { transform: [{ scale: emojiScale }] }]}>
            {data.giftEmoji}
          </Animated.Text>
          <View style={[s.arrowLine, { backgroundColor: categoryColor + '40' }]} />
        </View>

        {/* Hediye adı + fiyat */}
        <View style={s.giftInfoRow}>
          <Text style={[s.giftName, { color: categoryColor }]}>{data.giftName}</Text>
          <View style={s.costChip}>
            <Text style={{ fontSize: 10 }}>🪙</Text>
            <Text style={[s.costText, { color: categoryColor + 'CC' }]}>{data.totalCost.toLocaleString()}</Text>
          </View>
        </View>

        {/* Alıcı */}
        <Text style={[s.receiver, { color: categoryColor }]}>{data.receiverName}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  band: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    gap: 4,
    minWidth: 200,
  },
  sender: {
    fontSize: 15,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  arrowLine: {
    width: 20,
    height: 1,
  },
  emoji: {
    fontSize: 40,
  },
  giftInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  giftName: {
    fontSize: 13,
    fontWeight: '700',
  },
  costChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  costText: {
    fontSize: 11,
    fontWeight: '700',
  },
  receiver: {
    fontSize: 15,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
