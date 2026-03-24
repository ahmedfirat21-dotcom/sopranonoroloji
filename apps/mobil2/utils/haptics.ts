/**
 * SopranoChat — Haptic Feedback Utility
 *
 * expo-haptics yerine yerleşik Vibration API kullanır.
 * Android'de titreşim, iOS'ta veya desteklenmeyen cihazlarda sessiz çalışır.
 */
import { Platform, Vibration } from 'react-native';

/** Hafif tıklama feedback'i (buton basma) */
export function hapticLight() {
  if (Platform.OS === 'android') {
    Vibration.vibrate(15);
  }
}

/** Orta tıklama (navigasyon, toggle) */
export function hapticMedium() {
  if (Platform.OS === 'android') {
    Vibration.vibrate(30);
  }
}

/** Başarı feedback'i */
export function hapticSuccess() {
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 20, 80, 20]);
  }
}

/** Hata/uyarı feedback'i */
export function hapticError() {
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 40, 60, 40]);
  }
}
