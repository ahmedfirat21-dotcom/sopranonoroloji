/* ═══════════════════════════════════════════════════════════
   SopranoChat Mobil2 — EmojiReactions
   Ekranda uçuşan emoji reaksiyon animasyonları
   ═══════════════════════════════════════════════════════════ */

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, Easing,
} from 'react-native';

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

      {/* Quick reaction bar — input satırının hemen üstünde, inline akışta gösterilecek */}
      {showBar && (
        <View style={styles.emojiBar}>
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
        </View>
      )}
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
  emojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 14,
    marginBottom: 6,
  },
  emojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  emojiBtnText: {
    fontSize: 20,
  },
});
