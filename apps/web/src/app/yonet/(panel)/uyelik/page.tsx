/**
 * SopranoChat Admin — Üyelik Planları
 * Tier konfigürasyonu (Free/Plus/Pro/GodMaster).
 * Şu an read-only — değerler mobil app'in constants/tiers.ts dosyasında sabit.
 */
import { Crown } from 'lucide-react';
import TierEditor from './TierEditor';

// ────────────────────────────────────────────────────────────────
// Mobil app constants/tiers.ts ile birebir senkron tutulmalı.
// Değişiklik yapmak istersen: o dosyayı güncelle + yeni APK build.
// ────────────────────────────────────────────────────────────────
export const TIER_DATA = [
  {
    name: 'Free',
    label: 'Ücretsiz',
    emoji: '🆓',
    color: '#94A3B8',
    monthlyPrice: 0,
    yearlyPrice: 0,
    tagline: 'SopranoChat dünyasını keşfet',
    spBonus: 0,
    limits: {
      maxSpeakers: 5,
      maxListeners: 15,
      maxCameras: 2,
      maxModerators: 0,
      durationHours: 24,
      dailyRooms: 5,
      maxPersistentRooms: 0,
      audioSampleRate: 24000,
      audioChannels: 1,
      videoMaxRes: 720,
      canCustomizeImage: false,
      canCustomizeTheme: false,
      canUseRoomMusic: false,
      canUseFollowersOnly: false,
      ownerLeavePolicy: 'close',
    },
  },
  {
    name: 'Plus',
    label: 'Plus',
    emoji: '🚀',
    color: '#A855F7',
    monthlyPrice: 39.99,
    yearlyPrice: 349.99,
    tagline: 'Daha fazla güç, daha fazla özgürlük',
    spBonus: 600,
    limits: {
      maxSpeakers: 8,
      maxListeners: 25,
      maxCameras: 6,
      maxModerators: 2,
      durationHours: 12,
      dailyRooms: 10,
      maxPersistentRooms: 3,
      audioSampleRate: 32000,
      audioChannels: 1,
      videoMaxRes: 720,
      canCustomizeImage: true,
      canCustomizeTheme: true,
      canUseRoomMusic: false,
      canUseFollowersOnly: true,
      ownerLeavePolicy: 'keep_alive',
    },
  },
  {
    name: 'Pro',
    label: 'Pro',
    emoji: '👑',
    color: '#F59E0B',
    monthlyPrice: 99.99,
    yearlyPrice: 899.99,
    tagline: 'Sınırsız güç, maksimum prestij',
    spBonus: 1500,
    limits: {
      maxSpeakers: 13,
      maxListeners: 999,
      maxCameras: 10,
      maxModerators: 5,
      durationHours: 0,
      dailyRooms: 999,
      maxPersistentRooms: 999,
      audioSampleRate: 48000,
      audioChannels: 2,
      videoMaxRes: 1080,
      canCustomizeImage: true,
      canCustomizeTheme: true,
      canUseRoomMusic: true,
      canUseFollowersOnly: true,
      ownerLeavePolicy: 'keep_alive',
    },
  },
  {
    name: 'GodMaster',
    label: 'GodMaster',
    emoji: '⚡',
    color: '#EF4444',
    monthlyPrice: 0,
    yearlyPrice: 0,
    tagline: 'Sistemin mutlak hâkimi — sınırsız yetki',
    spBonus: 999999,
    limits: {
      maxSpeakers: 999,
      maxListeners: 999,
      maxCameras: 999,
      maxModerators: 999,
      durationHours: 0,
      dailyRooms: 999,
      maxPersistentRooms: 999,
      audioSampleRate: 48000,
      audioChannels: 2,
      videoMaxRes: 1080,
      canCustomizeImage: true,
      canCustomizeTheme: true,
      canUseRoomMusic: true,
      canUseFollowersOnly: true,
      ownerLeavePolicy: 'keep_alive',
    },
  },
];

export default function UyelikPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-400" /> Üyelik Planları
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Free, Plus, Pro ve GodMaster — fiyat ve limitler
        </p>
      </div>

      <TierEditor tiers={TIER_DATA} />
    </div>
  );
}
