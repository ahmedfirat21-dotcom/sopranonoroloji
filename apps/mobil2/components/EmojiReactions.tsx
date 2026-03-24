/* ═══════════════════════════════════════════════════════════
   SopranoChat Mobil2 — EmojiReactions
   Yanal açılan ince emoji çubuğu + uçuşan reaksiyonlar
   ═══════════════════════════════════════════════════════════ */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, Easing,
} from 'react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '😂', '😍', '🎵', '💎', '👑'];

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  translateY: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

// ─── Floating Emoji ───────────────────────────────────
function FloatingEmojiView({ emoji, x, translateY, opacity, scale }: Omit<FloatingEmoji, 'id'>) {
  return (
    <Animated.View
      style={[
        styles.floatingEmoji,
        { left: x, transform: [{ translateY }, { scale }], opacity },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.floatingEmojiText}>{emoji}</Text>
    </Animated.View>
  );
}

// ─── Emoji Reaction Bar — yanal slide ─────────────────
interface EmojiReactionsProps {
  onEmojiSent?: (emoji: string) => void;
  showBar: boolean;
}

export default function EmojiReactions({ onEmojiSent, showBar }: EmojiReactionsProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const idRef = useRef(0);

  // ── Yanal açılış/kapanış animasyonu ──
  const slideWidth = useRef(new Animated.Value(0)).current;
  const barOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showBar) {
      Animated.parallel([
        Animated.spring(slideWidth, { toValue: 1, friction: 14, tension: 80, useNativeDriver: false }),
        Animated.timing(barOpacity, { toValue: 1, duration: 180, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideWidth, { toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: false }),
        Animated.timing(barOpacity, { toValue: 0, duration: 120, useNativeDriver: false }),
      ]).start();
    }
  }, [showBar]);

  const sendEmoji = useCallback((emoji: string) => {
    const id = `emoji_${idRef.current++}`;
    const x = 20 + Math.random() * (width - 80);
    const translateY = new Animated.Value(0);
    const opacity = new Animated.Value(1);
    const scale = new Animated.Value(0.3);

    const newEmoji: FloatingEmoji = { id, emoji, x, translateY, opacity, scale };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    onEmojiSent?.(emoji);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -(200 + Math.random() * 150),
        duration: 2000 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scale, { toValue: 1 + Math.random() * 0.3, friction: 4, tension: 100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    });
  }, [onEmojiSent]);

  // Emoji bar max genişliği
  const MAX_BAR_W = QUICK_EMOJIS.length * 34 + 12;
  const animatedWidth = slideWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MAX_BAR_W],
  });

  return (
    <>
      {/* Floating emojis — yukarı uçan */}
      {floatingEmojis.map(e => (
        <FloatingEmojiView key={e.id} emoji={e.emoji} x={e.x} translateY={e.translateY} opacity={e.opacity} scale={e.scale} />
      ))}

      {/* Yanal açılan ince emoji çubuğu — arka plan yok */}
      <Animated.View
        style={[
          styles.emojiBarWrap,
          { width: animatedWidth, opacity: barOpacity },
        ]}
      >
        {QUICK_EMOJIS.map(emoji => (
          <TouchableOpacity
            key={emoji}
            style={styles.emojiBtn}
            activeOpacity={0.6}
            onPress={() => sendEmoji(emoji)}
          >
            <Text style={styles.emojiBtnText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  floatingEmoji: {
    position: 'absolute',
    bottom: 180,
    zIndex: 999,
  },
  floatingEmojiText: {
    fontSize: 28,
  },
  emojiBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 4,
    paddingHorizontal: 4,
    gap: 2,
    // Arka plan yok — şeffaf
  },
  emojiBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnText: {
    fontSize: 18,
  },
});
