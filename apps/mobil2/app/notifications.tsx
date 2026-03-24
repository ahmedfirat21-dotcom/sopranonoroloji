import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../constants/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { EmptyState } from '../components/UXHelpers';
import { getNotifications, type NotificationData } from '../services/api';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────
// Bildirim Tipleri
// ─────────────────────────────────────────────────────
interface Notification {
  id: string;
  type: 'like' | 'follow' | 'gift' | 'mention' | 'system';
  fromName: string;
  fromAvatar?: string;
  message: string;
  time: string;
  isRead: boolean;
}

const DUMMY_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'follow', fromName: 'Selin Arslan', message: 'seni takip etmeye başladı', time: '2dk', isRead: false },
  { id: '2', type: 'like', fromName: 'Emre Demir', message: 'profilini beğendi', time: '5dk', isRead: false },
  { id: '3', type: 'gift', fromName: 'Arda Kaya', message: 'sana 🌹 Gül hediye etti', time: '12dk', isRead: false },
  { id: '4', type: 'mention', fromName: 'Mert Öztürk', message: 'seni "Gece Locası" odasında etiketledi', time: '1sa', isRead: true },
  { id: '5', type: 'system', fromName: 'SopranoChat', message: 'VIP üyeliğiniz yenilendi', time: '3sa', isRead: true },
  { id: '6', type: 'follow', fromName: 'Zeynep Kara', message: 'seni takip etmeye başladı', time: '5sa', isRead: true },
  { id: '7', type: 'gift', fromName: 'Kaan Yıldız', message: 'sana 👑 Taç hediye etti', time: '1g', isRead: true },
  { id: '8', type: 'like', fromName: 'Elif Yılmaz', message: 'profilini beğendi', time: '2g', isRead: true },
];

const NOTIF_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  like: { icon: 'heart', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  follow: { icon: 'person-add', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  gift: { icon: 'gift', color: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
  mention: { icon: 'at', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  system: { icon: 'megaphone', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors: C, isDark } = useTheme();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const data = await getNotifications(user.id);
    setNotifications(data.map(d => ({
      id: d.id,
      type: (d.type || 'system') as Notification['type'],
      fromName: d.fromName,
      fromAvatar: d.fromAvatar || undefined,
      message: d.message,
      time: d.time,
      isRead: d.isRead,
    })));
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <View style={[styles.container, { backgroundColor: C.deepNavy }]}>
      <LinearGradient
        colors={isDark ? ['#0B1222', '#070D1A'] : ['#F2F2F7', '#EEEDF5']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.silver} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
              <Ionicons name="checkmark-done" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <View style={styles.unreadDot} />
          <Text style={styles.unreadText}>{unreadCount} yeni bildirim</Text>
        </View>
      )}

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingHorizontal: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {notifications.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title="Bildirim yok"
            subtitle="Yeni takipçiler, hediyeler ve etiketlemeler burada görünecek"
          />
        ) : (
          notifications.map((notif) => {
            const config = NOTIF_CONFIG[notif.type];
            return (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.isRead && styles.notifUnread]}
                activeOpacity={0.7}
                onPress={() => {
                  setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                }}
              >
                {/* Icon */}
                <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                  <Ionicons name={config.icon as any} size={18} color={config.color} />
                </View>

                {/* Content */}
                <View style={styles.notifContent}>
                  <Text style={styles.notifText}>
                    <Text style={styles.notifName}>{notif.fromName}</Text>
                    {' '}{notif.message}
                  </Text>
                  <Text style={styles.notifTime}>{notif.time}</Text>
                </View>

                {/* Unread dot */}
                {!notif.isRead && <View style={styles.notifDot} />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  markReadBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(35,186,196,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(59,130,246,0.15)',
  },
  unreadDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6',
  },
  unreadText: {
    fontSize: 12, fontWeight: '600', color: '#60A5FA',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  notifUnread: {
    backgroundColor: 'rgba(59,130,246,0.05)',
    borderColor: 'rgba(59,130,246,0.1)',
  },
  notifIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  notifContent: { flex: 1, gap: 2 },
  notifText: { fontSize: 13, color: '#CBD5E1', lineHeight: 18 },
  notifName: { fontWeight: '700', color: '#F1F5F9' },
  notifTime: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  notifDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
});
