// ═══════════════════════════════════════════════════════════
// SopranoChat Mobil2 — Push Notification Service
// Expo Push Token alma ve backend'e kaydetme
// ═══════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://sopranochat.com';
const PUSH_TOKEN_KEY = '@soprano_push_token';

// ─── Lazy-loaded expo-notifications ─────────────────────────
let _notifications: any = null;
let _device: any = null;
let _available: boolean | null = null;

function getNotifications(): any {
  if (_available === false) return null;
  if (_notifications) return _notifications;

  try {
    _notifications = require('expo-notifications');
    _device = require('expo-device');
    _available = true;
    return _notifications;
  } catch {
    _available = false;
    console.warn('[Push] expo-notifications bulunamadı');
    return null;
  }
}

// ─── Token Alma ─────────────────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = getNotifications();
  const Device = _device;
  if (!Notifications || !Device) {
    console.warn('[Push] Bildirim servisi kullanılamıyor');
    return null;
  }

  // Fiziksel cihaz kontrolü
  if (!Device.isDevice) {
    console.warn('[Push] Push bildirimleri yalnızca fiziksel cihazlarda çalışır');
    return null;
  }

  try {
    // İzin kontrolü
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Bildirim izni verilmedi');
      return null;
    }

    // Token al
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Expo config'den otomatik alır
    });
    const token = tokenData.data;

    console.log('[Push] Token alındı:', token.slice(0, 30) + '...');

    // Lokal kaydet
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // Android bildirim kanalı
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'SopranoChat',
        importance: Notifications.AndroidImportance?.MAX || 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
      });
    }

    return token;
  } catch (error: any) {
    console.warn('[Push] Token alma hatası:', error.message);
    return null;
  }
}

// ─── Token Backend'e Kaydet ─────────────────────────────────
export async function savePushTokenToBackend(
  expoPushToken: string,
  authToken: string,
): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/push/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ expoPushToken, platform: Platform.OS }),
    });

    if (response.ok) {
      console.log('[Push] Token backend\'e kaydedildi');
      return true;
    }
    console.warn('[Push] Token kayıt hatası:', response.status);
    return false;
  } catch (error: any) {
    console.warn('[Push] Backend iletişim hatası:', error.message);
    return false;
  }
}

// ─── Bildirim Dinleyicileri ─────────────────────────────────
export function setupNotificationListeners(
  onNotification?: (notification: any) => void,
  onNotificationResponse?: (response: any) => void,
) {
  const Notifications = getNotifications();
  if (!Notifications) return { remove: () => {} };

  const subscriptions: any[] = [];

  // Uygulama açıkken gelen bildirimler
  if (onNotification) {
    subscriptions.push(
      Notifications.addNotificationReceivedListener(onNotification),
    );
  }

  // Bildirime tıklandığında
  if (onNotificationResponse) {
    subscriptions.push(
      Notifications.addNotificationResponseReceivedListener(onNotificationResponse),
    );
  }

  return {
    remove: () => subscriptions.forEach((s) => s.remove()),
  };
}

// ─── Kayıtlı Token'ı Al ────────────────────────────────────
export async function getSavedPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}
