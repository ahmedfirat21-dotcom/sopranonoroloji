import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// BlurView kaldırıldı — GPU yükü azaltıldı
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';
import { getFriendsList } from '../services/api';
import { useUser } from '../contexts/UserContext';
import { useRouter } from 'expo-router';

interface FollowersModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
}

export default function FollowersModal({ visible, onClose, title }: FollowersModalProps) {
  const { token, user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    if (visible && token) {
      fetchData();
    }
  }, [visible, token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await getFriendsList(token!);
      if (Array.isArray(resp)) {
        setFriends(resp);
      }
    } catch (e) {
      console.warn('Arkadaş listesi çekilemedi:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const friend = item.friend;
    if (!friend) return null;

    return (
      <View style={styles.userCard}>
        <View style={styles.avatarWrap}>
          {friend.avatarUrl ? (
            <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} />
          ) : (
            <Ionicons name="person" size={20} color={COLORS.silverDark} />
          )}
          {friend.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {friend.displayName || 'Kullanıcı'}
          </Text>
          <Text style={styles.userRole}>
            {friend.role === 'admin' ? 'Yönetici' : friend.role === 'host' ? 'VIP Üye' : 'Üye'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            onClose();
            // İleride DM sayfasına gidebilir: router.push(`/messages/${friend.id}`)
          }}
        >
          <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
        <TouchableOpacity style={styles.bgClick} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['rgba(12,18,36,0.95)', 'rgba(8,14,28,0.98)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.silver} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="people-outline" size={48} color={COLORS.silverDark} />
              <Text style={styles.emptyText}>Henüz kimse yok.</Text>
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.friendshipId}
              renderItem={renderItem}
              contentContainerStyle={{ padding: SPACING.md }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bgClick: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    height: '75%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.primary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    color: COLORS.silverDark,
    marginTop: 12,
    fontSize: 15,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: '#080E1C',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  userRole: {
    color: COLORS.silver,
    fontSize: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(92,225,230,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
