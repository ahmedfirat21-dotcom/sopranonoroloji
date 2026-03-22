/* ═══════════════════════════════════════════════════════════
   SopranoChat Mobil — LiveChat (Instagram/TikTok Live Tarzı)
   Mesajlar tamamen şeffaf overlay, zemine entegre.
   Arka plan YOK — sadece text shadow ile okunabilirlik.
   ═══════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { getRoleColor } from '../../utils/roleHelpers';

const { width } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  userId?: string;
  sender?: string;
  displayName?: string;
  senderName?: string;
  avatar?: string;
  senderAvatar?: string;
  role?: string;
  text?: string;
  content?: string;
  timestamp?: number;
  createdAt?: string;
}

const FADE_DELAY = 6000;
const FADE_DURATION = 2000;

/* ── Tek Mesaj — fade-in aşağıdan kayarak gelir, sonra erir ── */
function ChatLine({ msg, onFaded }: { msg: ChatMessage; onFaded?: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(12)).current;

  const roleColor = getRoleColor(msg.role);
  const name = msg.displayName || msg.senderName || 'Kullanıcı';
  const text = msg.text || msg.content || '';

  useEffect(() => {
    // Giriş — aşağıdan kayarak fade in
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      // Bekleme sonrası fade out
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0, duration: FADE_DURATION, useNativeDriver: true,
        }).start(() => onFaded?.());
      }, FADE_DELAY);
    });
  }, []);

  return (
    <Animated.View style={[s.line, { opacity, transform: [{ translateY: slideY }] }]}>
      <Text style={s.lineText}>
        <Text style={[s.lineName, { color: roleColor }]}>{name}  </Text>
        <Text style={s.lineMsg}>{text}</Text>
      </Text>
    </Animated.View>
  );
}

/* ══════════════════════════════════════════
   LIVE CHAT — Instagram/TikTok Live Style
   Tamamen şeffaf, arkaplanla bütünleşik
   ══════════════════════════════════════════ */
export default function LiveChat({
  messages,
  maxVisible = 3,
  onOpenFullChat,
}: {
  messages: ChatMessage[];
  maxVisible?: number;
  onOpenFullChat?: () => void;
}) {
  const [fadedIds, setFadedIds] = useState<Set<string>>(new Set());

  const visibleMessages = messages
    .filter(m => !fadedIds.has(m.id))
    .slice(-maxVisible);

  const handleFaded = (id: string) => {
    setFadedIds(prev => new Set(prev).add(id));
  };

  return (
    <View style={s.container} pointerEvents="box-none">
      {visibleMessages.map(msg => (
        <ChatLine
          key={msg.id || `${msg.userId || msg.sender}-${msg.timestamp}`}
          msg={msg}
          onFaded={() => handleFaded(msg.id)}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 140,
    paddingHorizontal: 12,
    justifyContent: 'flex-end',
  },

  line: {
    marginVertical: 2,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },

  lineText: {
    flexWrap: 'wrap',
  },

  lineName: {
    fontSize: 12,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  lineMsg: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
