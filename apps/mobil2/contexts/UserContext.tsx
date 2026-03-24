// ═══════════════════════════════════════════════════════
// SopranoChat Mobil2 — User Context
// Offline-first: Önce lokal kaydet, sonra backend'e gönder
// ═══════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { guestLogin, updateProfile, type UserData, type AuthResponse } from '../services/auth';

const STORAGE_KEYS = {
  TOKEN: '@soprano_token',
  USER: '@soprano_user',
  PROFILE_EXTRA: '@soprano_profile_extra',
};

export interface ProfileExtra {
  birthDate?: string;
  vibes?: string[];
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  alliancesCount?: number;
  visitorsCount?: number;
}

// Lokal kullanıcı — API'den gelmese bile setup'tan dolduruluyor
export interface LocalUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;  // lokal dosya URI veya remote URL
  gender?: string;
  role: string;
  walletBalance: number;
  points: number;
  isVip: boolean;
}

interface UserContextType {
  user: LocalUser | null;
  token: string | null;
  profileExtra: ProfileExtra;
  isLoading: boolean;
  isLoggedIn: boolean;

  // Auth
  login: (username: string, avatar?: string, gender?: string) => Promise<void>;
  update: (payload: { displayName?: string; avatar?: string; gender?: string; bio?: string }) => Promise<void>;
  saveProfileExtra: (extra: ProfileExtra) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  token: null,
  profileExtra: {},
  isLoading: true,
  isLoggedIn: false,
  login: async () => {},
  update: async () => {},
  saveProfileExtra: async () => {},
  logout: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profileExtra, setProfileExtra] = useState<ProfileExtra>({});
  const [isLoading, setIsLoading] = useState(true);

  // Uygulama açılışında AsyncStorage'dan yükle
  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser, savedExtra] = await AsyncStorage.multiGet([
          STORAGE_KEYS.TOKEN,
          STORAGE_KEYS.USER,
          STORAGE_KEYS.PROFILE_EXTRA,
        ]);
        if (savedToken[1]) setToken(savedToken[1]);
        if (savedUser[1]) setUser(JSON.parse(savedUser[1]));
        if (savedExtra[1]) setProfileExtra(JSON.parse(savedExtra[1]));
      } catch (e) {
        console.warn('[UserContext] AsyncStorage yükleme hatası:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Giriş — ÖNCE LOKAL KAYDET, sonra backend'e dene
  const login = useCallback(async (username: string, avatar?: string, gender?: string) => {
    // 1. Lokal kullanıcı oluştur (hemen yansısın)
    const localUser: LocalUser = {
      id: `local_${Date.now()}`,
      username: username.toLowerCase().replace(/\s+/g, '_'),
      displayName: username,
      avatarUrl: avatar || undefined,
      gender: gender || undefined,
      role: 'guest',
      walletBalance: 0,
      points: 0,
      isVip: false,
    };

    setUser(localUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(localUser));

    // 2. Backend'e gönder (başarısız olursa lokal veri kalır)
    try {
      const result: AuthResponse = await guestLogin(username, avatar, gender);
      const remoteUser: LocalUser = {
        ...result.user,
        avatarUrl: avatar || result.user.avatarUrl, // Lokal fotoğraf URI'sını koru
      };
      setUser(remoteUser);
      setToken(result.access_token);
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TOKEN, result.access_token],
        [STORAGE_KEYS.USER, JSON.stringify(remoteUser)],
      ]);
      console.log('[UserContext] Backend giriş başarılı:', result.user.displayName);
    } catch (e: any) {
      console.warn('[UserContext] Backend giriş başarısız, lokal devam:', e.message);
      // Lokal user zaten kaydedildi — uygulama çalışmaya devam eder
    }
  }, []);

  // Profil güncelle
  const update = useCallback(async (payload: { displayName?: string; avatar?: string; gender?: string; bio?: string }) => {
    // Lokal güncelle
    if (user) {
      const updated: LocalUser = {
        ...user,
        displayName: payload.displayName || user.displayName,
        avatarUrl: payload.avatar || user.avatarUrl,
        gender: payload.gender || user.gender,
      };
      setUser(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    }

    // Bio'yu profileExtra'ya kaydet
    if (payload.bio !== undefined) {
      const merged = { ...profileExtra, bio: payload.bio };
      setProfileExtra(merged);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_EXTRA, JSON.stringify(merged));
    }

    // Backend'e dene
    if (token) {
      try {
        await updateProfile(token, payload);
      } catch (e: any) {
        console.warn('[UserContext] Backend profil güncelleme başarısız:', e.message);
      }
    }
  }, [user, token, profileExtra]);

  // Ekstra profil bilgileri (lokal — birthDate, vibes)
  const saveProfileExtra = useCallback(async (extra: ProfileExtra) => {
    const merged = { ...profileExtra, ...extra };
    setProfileExtra(merged);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_EXTRA, JSON.stringify(merged));
  }, [profileExtra]);

  // Çıkış
  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    setProfileExtra({});
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.PROFILE_EXTRA,
    ]);
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        profileExtra,
        isLoading,
        isLoggedIn: !!user,
        login,
        update,
        saveProfileExtra,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}

export default UserContext;
