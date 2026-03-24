/* ═══════════════════════════════════════════════════════════
   SopranoChat Mobil2 — EmojiReactions
   Ekranda uçuşan emoji reaksiyon animasyonları
   ═══════════════════════════════════════════════════════════ */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, Easing, ScrollView,
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
        {
          left: x,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.floatingEmojiText}>{emoji}</Text>
    </Animated.View>
  );
}

// ─── Emoji Reaction Bar ───────────────────────────────
interface EmojiReactionsProps {
  onEmojiSent?: (emoji: string) => void;
  showBar: boolean;
}

export default function EmojiReactions({ onEmojiSent, showBar }: EmojiReactionsProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const idRef = useRef(0);

  // ── Açılış/kapanış animasyonu ──
  const barHeight = useRef(new Animated.Value(0)).current;
  const barOpacity = useRef(new Animated.Value(0)).current;
  const barScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (showBar) {
      Animated.parallel([
        Animated.spring(barHeight, { toValue: 54, friction: 10, tension: 80, useNativeDriver: false }),
        Animated.timing(barOpacity, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.spring(barScale, { toValue: 1, friction: 8, tension: 100, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(barHeight, { toValue: 0, duration: 180, easing: Easing.in(Easing.ease), useNativeDriver: false }),
        Animated.timing(barOpacity, { toValue: 0, duration: 120, useNativeDriver: false }),
        Animated.timing(barScale, { toValue: 0.85, duration: 150, useNativeDriver: false }),
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

    // Animasyon: yukarı uç + büyü + kaybol
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -(200 + Math.random() * 150),
        duration: 2000 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1 + Math.random() * 0.3,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    });
  }, [onEmojiSent]);

  return (
    <>
      {/* Floating emojis — yukarı uçan */}
      {floatingEmojis.map(e => (
        <FloatingEmojiView key={e.id} emoji={e.emoji} x={e.x} translateY={e.translateY} opacity={e.opacity} scale={e.scale} />
      ))}

      {/* Quick reaction bar — animasyonlu açılış/kapanış */}
      <Animated.View
        style={[
          styles.emojiBarWrap,
          {
            height: barHeight,
            opacity: barOpacity,
            transform: [{ scale: barScale }],
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.emojiBarContent}
          bounces={false}
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
        </ScrollView>
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
    overflow: 'hidden',
    marginHorizontal: 14,
    marginBottom: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emojiBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
    height: '100%',
  },
  emojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  emojiBtnText: {
    fontSize: 20,
  },
});
