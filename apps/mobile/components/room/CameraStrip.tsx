/* ═══════════════════════════════════════════════════════════
   SopranoChat Mobil — CameraStrip
   Kamera açmış kullanıcıların yatay video tile şeridi
   (Discord Stages / Twitter Spaces tarzı)
   ═══════════════════════════════════════════════════════════ */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getRoleColor, getRoleIcon } from '../../utils/roleHelpers';

const { width } = Dimensions.get('window');
const TILE_W = 88;
const TILE_H = 116;
const AVATAR_SIZE = 60;

export interface CameraUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  speaking?: boolean;
  muted?: boolean;
}

/* ── Canlı Border Pulse ── */
function LiveBorderPulse() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, {
      borderRadius: 16,
      borderWidth: 2,
      borderColor: '#8b5cf6',
      opacity,
    }]} />
  );
}

/* ── Video Tile — Her kullanıcı için ── */
function VideoTile({ user, onPress }: { user: CameraUser; onPress?: () => void }) {
  const roleColor = getRoleColor(user.role);
  const roleIcon = getRoleIcon(user.role);

  // Simüle edilmiş "video" — avatar + gradient overlay
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={s.tile}>
      <LiveBorderPulse />
      <View style={s.tileInner}>
        {/* Video alanı (gerçek videoda RTCView olacak) */}
        <View style={s.videoArea}>
          <Image source={{ uri: user.avatar }} style={s.videoAvatar} />
          {/* Canlı video göstergesi */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={s.videoGradient}
          />
          {/* Konuşma göstergesi — yeşil dalga */}
          {user.speaking && (
            <View style={s.speakingIndicator}>
              {[0, 1, 2].map(i => (
                <SpeakingBar key={i} delay={i * 100} />
              ))}
            </View>
          )}
        </View>

        {/* Alt bilgi bar */}
        <View style={s.tileInfo}>
          <View style={s.tileNameRow}>
            {roleIcon ? <Text style={{ fontSize: 8 }}>{roleIcon}</Text> : null}
            <Text style={[s.tileName, { color: roleColor }]} numberOfLines={1}>
              {user.name}
            </Text>
          </View>
          <View style={s.tileBadges}>
            {/* Kamera ikonu */}
            <View style={s.camBadge}>
              <Ionicons name="videocam" size={8} color="#8b5cf6" />
            </View>
            {/* Mikrofon durumu */}
            <View style={[s.micBadge, user.muted && { backgroundColor: 'rgba(239,68,68,0.3)' }]}>
              <Ionicons name={user.muted ? 'mic-off' : 'mic'} size={8}
                color={user.speaking ? '#00ff88' : user.muted ? '#ef4444' : 'rgba(255,255,255,0.5)'} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ── Konuşma Animasyonu Bar ── */
function SpeakingBar({ delay }: { delay: number }) {
  const height = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(height, { toValue: 12, duration: 200 + Math.random() * 200, useNativeDriver: false }),
      Animated.timing(height, { toValue: 4, duration: 300 + Math.random() * 200, useNativeDriver: false }),
    ])).start();
  }, []);

  return (
    <Animated.View style={{
      width: 3, borderRadius: 1.5,
      backgroundColor: '#00ff88',
      height,
    }} />
  );
}

/* ══════════════════════════════════════════
   CAMERA STRIP — Video Tile Şeridi
   ══════════════════════════════════════════ */
export default function CameraStrip({
  users,
  onPress,
}: {
  users: CameraUser[];
  onPress?: (userId: string) => void;
}) {
  if (users.length === 0) return null;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerIconWrap}>
          <Ionicons name="videocam" size={11} color="#8b5cf6" />
        </View>
        <Text style={s.headerTitle}>KAMERALAR</Text>
        <View style={s.countPill}>
          <View style={s.liveDot} />
          <Text style={s.countText}>{users.length} canlı</Text>
        </View>
      </View>

      {/* Yatay kaydırmalı tile şeridi */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}>
        {users.map(u => (
          <VideoTile key={u.id} user={u} onPress={() => onPress?.(u.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 8, paddingHorizontal: 4,
  },
  headerIconWrap: {
    width: 22, height: 22, borderRadius: 7,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(139,92,246,0.1)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  liveDot: {
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#ef4444',
  },
  countText: { fontSize: 9, fontWeight: '700', color: '#a78bfa' },

  scrollContent: {
    paddingHorizontal: 2, gap: 8, paddingBottom: 4,
  },

  /* Tile */
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tileInner: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    margin: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  /* Video alanı */
  videoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,14,39,0.8)',
  },
  videoAvatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
  },
  videoGradient: {
    ...StyleSheet.absoluteFillObject,
    top: '50%',
  },
  speakingIndicator: {
    position: 'absolute', bottom: 4, right: 4,
    flexDirection: 'row', alignItems: 'flex-end', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6,
    paddingHorizontal: 4, paddingVertical: 3,
  },

  /* Alt bilgi */
  tileInfo: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
  },
  tileNameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1,
  },
  tileName: {
    fontSize: 9, fontWeight: '700', maxWidth: 50,
  },
  tileBadges: {
    flexDirection: 'row', gap: 3,
  },
  camBadge: {
    width: 16, height: 16, borderRadius: 4,
    backgroundColor: 'rgba(139,92,246,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  micBadge: {
    width: 16, height: 16, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
});
