import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Platform, Image, RefreshControl, ActivityIndicator,
  ScrollView, TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import { DiscoverRoom, getDiscoverData } from '../../services/api';
import WalletVIPSheet from '../../components/WalletVIPSheet';
import CreateRoomSheet from '../../components/CreateRoomSheet';
import { createRoomEvents } from '../../utils/createRoomEvents';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// ── Müşterinin Görselindeki Birebir Renkler ──
const OLED_BLACK = '#000000';
const CYAN_ACTIVE = '#00E5FF';
const PURPLE_GRADIENT_START = '#3D2073';
const PURPLE_GRADIENT_END = '#140A28';
const BLUE_TEXT = '#4A90E2';
const GRAY_BORDER = '#333333';

// ═══════════════════════════════════════
// Öne Çıkan Banner (Günün Kraliçesi)
// ═══════════════════════════════════════
function FeaturedQueenBanner() {
  return (
    <View style={st.bannerWrap}>
      <LinearGradient colors={[PURPLE_GRADIENT_START, PURPLE_GRADIENT_END]} style={st.bannerBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={st.bannerContent}>
        {/* Sol Avatar */}
        <View style={st.bannerAvatarWrap}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=47' }} style={st.bannerAvatar} />
          {/* Mavi/Turkuaz Glow */}
          <View style={st.bannerAvatarGlow} />
        </View>

        {/* Sağ Metin Alanı */}
        <View style={st.bannerTextWrap}>
          <Text style={st.bannerTitle}>Günün Kraliçesi 👑</Text>
          <Text style={st.bannerSubtitle}>Bu hafta en çok hediye alan</Text>
          <Text style={st.bannerUsername}>@DiamondQueen</Text>
          
          <View style={st.bannerScoreRow}>
            <Ionicons name="bar-chart" size={24} color={BLUE_TEXT} />
            <Text style={st.bannerScore}><Text style={{ fontWeight: '900', fontSize: 20 }}>48.500</Text> puan</Text>
          </View>
        </View>
      </View>
      
      {/* Slider Noktaları */}
      <View style={st.dotRow}>
        <View style={[st.dot, st.dotActive]} />
        <View style={st.dot} />
        <View style={st.dot} />
      </View>
    </View>
  );
}

// ═══════════════════════════════════════
// İnce Uzun Hap Görünümlü Loca Kartı (Görseldeki Gibi)
// ═══════════════════════════════════════
const LocaCardTall = React.memo(({ room, onPress }: { room: DiscoverRoom; onPress: () => void }) => {
  const isClipped = room.name.slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity style={st.tallCard} activeOpacity={0.8} onPress={onPress}>
      <LinearGradient colors={['#171B2F', '#090B14']} style={StyleSheet.absoluteFill} />
      
      {/* Üst Glow Halka/Çizgi Yanılsaması */}
      <View style={st.cardRingGlow} />
      
      {/* Göz İkonu ve Sayı (En Üst Sağ) */}
      <View style={st.viewerBadge}>
        <Ionicons name="eye" size={10} color="#FFF" />
        <Text style={st.viewerCount}>{room.onlineCount}</Text>
      </View>

      {/* Büyük Ortalanmış Avatar */}
      <View style={st.tallCardAvatarWrap}>
        <Image source={{ uri: `https://i.pravatar.cc/100?u=${room.roomId}` }} style={st.tallCardAvatar} />
      </View>

      {/* Yazı Alanı */}
      <View style={st.tallCardTexts}>
        <Text style={st.tallCardName} numberOfLines={1}>{isClipped}...</Text>
        <Text style={st.tallCardSub} numberOfLines={1}>Pr...</Text>
      </View>

      {/* Alt Destekçiler Mini Avatarlar */}
      <View style={st.tallSupporters}>
        <Image source={{ uri: `https://i.pravatar.cc/40?u=${room.roomId}a` }} style={[st.microAvatar, { right: -12, zIndex: 3 }]} />
        <Image source={{ uri: `https://i.pravatar.cc/40?u=${room.roomId}b` }} style={[st.microAvatar, { right: -6, zIndex: 2 }]} />
        <Image source={{ uri: `https://i.pravatar.cc/40?u=${room.roomId}c` }} style={[st.microAvatar, { zIndex: 1 }]} />
      </View>
    </TouchableOpacity>
  );
});

// ════════════════════════════════════════════
//  HOME SCREEN
// ════════════════════════════════════════════
const CATEGORIES = [
  { id: '1', label: '🔥 Zirvedekiler', active: true },
  { id: '2', label: '🎤 Sesli Sohbet', active: false },
  { id: '3', label: '🎥 Görüntülü', active: false },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [walletVis, setWalletVis] = useState(false);
  const [createVis, setCreateVis] = useState(false);
  const [rooms, setRooms] = useState<DiscoverRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = createRoomEvents.subscribe(() => setCreateVis(true));
    return unsub;
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      if (rooms.length === 0) setIsLoading(true);
      const res = await getDiscoverData();
      if (res.rooms) {
        // Kart sayısını ekranı dolduracak kadar artıralım görüntü için
        setRooms([...res.rooms, ...res.rooms, ...res.rooms].slice(0, 10));
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  }, [rooms.length]);

  useEffect(() => { 
    loadRooms(); 
  }, [loadRooms]);

  return (
    <View style={st.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: OLED_BLACK }]} />

      <ScrollView 
        contentContainerStyle={[st.scrollContent, { paddingTop: insets.top + 10 }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header (Logo) */}
        <View style={st.headerTop}>
          <Image source={require('../../assets/images/logo.png')} style={{ width: 110, height: 26 }} resizeMode="contain" />
        </View>

        {/* 2. Günün Kraliçesi Banner */}
        <FeaturedQueenBanner />

        {/* 3. Kategori Hapları (Pills) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.catList}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} style={[st.catPill, cat.active && st.catPillActive]} activeOpacity={0.8}>
              <Text style={[st.catText, cat.active && st.catTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 4. Canlı Odalar Başlık */}
        <View style={st.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 18 }}>🏠</Text>
            <Text style={st.sectionTitle}>Canlı Odalar</Text>
          </View>
          <TouchableOpacity>
            <Text style={st.seeAllBtn}>Tümünü Gör →</Text>
          </TouchableOpacity>
        </View>

        {/* 5. İnce Uzun Loca Kartları (Horizontal Scroll) */}
        {isLoading && rooms.length === 0 ? (
          <ActivityIndicator size="large" color={CYAN_ACTIVE} style={{ marginTop: 50 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tallCardList}>
            {rooms.map((r, idx) => (
              <LocaCardTall key={`${r.roomId}-${idx}`} room={r} onPress={() => router.push({ pathname: '/room', params: { id: r.roomId } })} />
            ))}
          </ScrollView>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Modals */}
      <WalletVIPSheet visible={walletVis} onClose={() => setWalletVis(false)} />
      <CreateRoomSheet visible={createVis} onClose={() => setCreateVis(false)} onRoomCreated={loadRooms} />
    </View>
  );
}

// ════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: OLED_BLACK },
  scrollContent: { paddingBottom: 100 },
  headerTop: { alignItems: 'center', marginBottom: 16 },
  
  /* Featured Queen Banner */
  bannerWrap: {
    marginHorizontal: 16,
    borderRadius: 24,
    height: 180, // Görseldeki gibi yüksek
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bannerBg: { ...StyleSheet.absoluteFillObject },
  bannerContent: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', padding: 20 
  },
  bannerAvatarWrap: { position: 'relative', marginRight: 16 },
  bannerAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: BLUE_TEXT, zIndex: 2 },
  bannerAvatarGlow: {
    position: 'absolute', top: -10, left: -10, right: -10, bottom: -10,
    backgroundColor: '#4A90E2', opacity: 0.3, borderRadius: 50, filter: 'blur(20px)', zIndex: 1
  },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { color: BLUE_TEXT, fontSize: 16, fontWeight: '700' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  bannerUsername: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  bannerScoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  bannerScore: { color: BLUE_TEXT, fontSize: 14 },
  dotRow: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555' },
  dotActive: { width: 16, backgroundColor: '#9D4EDD' },

  /* Category Pills */
  catList: {
    paddingHorizontal: 16, marginTop: 24, marginBottom: 24, gap: 10,
  },
  catPill: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#333',
  },
  catPillActive: { backgroundColor: CYAN_ACTIVE, borderColor: CYAN_ACTIVE },
  catText: { color: '#888', fontSize: 14, fontWeight: '600' },
  catTextActive: { color: '#000', fontWeight: '800' },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 16,
  },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  seeAllBtn: { color: '#9D4EDD', fontSize: 13, fontWeight: '700' },

  /* İnce Uzun Loca Kartı (Görseldeki Birebir Form) */
  tallCardList: { paddingHorizontal: 16, gap: 12 },
  tallCard: {
    width: 80, // Aşırı ince
    height: 250, // Aşırı uzun
    borderRadius: 40, // Hap görünümü tam yuvarlak omuzlar
    backgroundColor: '#111',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  cardRingGlow: {
    position: 'absolute',
    top: 50, left: -20, right: -20, height: 60,
    borderRadius: 30, borderWidth: 1, borderColor: 'rgba(92,225,230,0.5)',
    opacity: 0.4,
  },
  viewerBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
    zIndex: 10,
  },
  viewerCount: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  tallCardAvatarWrap: { marginTop: 60, zIndex: 10 },
  tallCardAvatar: { width: 56, height: 56, borderRadius: 28 },
  tallCardTexts: { alignItems: 'center', marginTop: 24, paddingHorizontal: 8 },
  tallCardName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  tallCardSub: { color: '#888', fontSize: 10, marginTop: 4 },
  tallSupporters: {
    flexDirection: 'row', alignItems: 'center', position: 'absolute', bottom: 20,
  },
  microAvatar: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#111',
  }
});
