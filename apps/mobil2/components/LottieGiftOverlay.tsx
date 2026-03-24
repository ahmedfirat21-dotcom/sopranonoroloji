import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────
// Hediye → Animasyon Mapping (Lüks Test URL)
// ─────────────────────────────────────────────────────
const PREMIUM_CONFETTI_URL = 'https://assets2.lottiefiles.com/packages/lf20_u4yrau.json';

const GIFT_ANIMATIONS: Record<string, any> = {
  g1: require('../assets/animations/g1.json'),
  g2: require('../assets/animations/g2.json'),
  g3: require('../assets/animations/g3.json'),
  g4: require('../assets/animations/g4.json'),
  g5: require('../assets/animations/g5.json'),
  g6: require('../assets/animations/g6.json'),
};

// Default — bilinmeyen hediyeler için
const DEFAULT_ANIMATION = require('../assets/animations/g1.json');

interface LottieGiftOverlayProps {
  /** Şu an oynatılacak hediyenin ID'si (null = pasif) */
  giftId: string | null;
  /** Animasyon bittiğinde çağrılır */
  onFinish: () => void;
}

/**
 * Full-screen sinematik Lottie animasyon overlay'i.
 * Room ekranının en üst Z-index katmanında durur.
 * pointerEvents="none" ile dokunma engellenmez.
 */
export default function LottieGiftOverlay({ giftId, onFinish }: LottieGiftOverlayProps) {
  const handleAnimationFinish = useCallback(() => {
    onFinish();
  }, [onFinish]);

  if (!giftId) return null;

  const source = GIFT_ANIMATIONS[giftId] || DEFAULT_ANIMATION;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <LottieView
        key={giftId + Date.now()}
        source={source}
        style={styles.lottie}
        loop={false}
        autoPlay={true}
        speed={0.8}
        resizeMode="cover"
        onAnimationFinish={handleAnimationFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  lottie: {
    width: width,
    height: height,
  },
});
