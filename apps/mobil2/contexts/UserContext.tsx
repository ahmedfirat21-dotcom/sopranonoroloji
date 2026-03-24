// ═══════════════════════════════════════════════════════════
// SopranoChat Mobil2 — User Context
// Firebase Auth + Offline-first: Önce lokal kaydet, sonra backend'e gönder
// ═══════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { guestLogin, updateProfile, type UserData, type AuthResponse } from '../services/auth';
import {
  type FirebaseUser,
  type AuthResult,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  firebaseSignOut,
  getIdToken,
} from '../services/firebaseAuth';

const STORAGE_KEYS = {
  TOKEN: '@soprano_token',
  USER: '@soprano_user',
  PROFILE_EXTRA: '@soprano_profile_extra',
  AUTH_PROVIDER: '@soprano_auth_provider',
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
  email?: string;
  avatarUrl?: string;  // lokal dosya URI veya remote URL
  gender?: string;
  phoneNumber?: string;
  role: string;
  walletBalance: number;
  points: number;
  isVip: boolean;
  authProvider?: 'guest' | 'google' | 'apple' | 'phone';
  isProfileComplete?: boolean;
}

interface UserContextType {
  user: LocalUser | null;
  token: string | null;
  profileExtra: ProfileExtra;
  isLoading: boolean;
  isLoggedIn: boolean;
  isProfileComplete: boolean;

  // Auth
  login: (username: string, avatar?: string, gender?: string) => Promise<void>;
  loginWithFirebase: (authResult: AuthResult, provider: 'google' | 'apple' | 'phone') => Promise<{ isNewUser: boolean }>;
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
  isProfileComplete: false,
  login: async () => {},
  loginWithFirebase: async () => ({ isNewUser: false }),
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

  // Firebase auth state değişikliklerini izle
  useEffect(() => {
    const unsubscribe = firebaseOnAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        // Firebase'den çıkış yapılmışsa ve provider firebase ise temizle
        const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.authProvider && parsed.authProvider !== 'guest') {
            // Firebase user çıkış yapmış — lokal temizle
            setUser(null);
            setToken(null);
            await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // ─── Firebase ile giriş ──────────────────────────────────────
  const loginWithFirebase = useCallback(async (
    authResult: AuthResult,
    provider: 'google' | 'apple' | 'phone',
  ): Promise<{ isNewUser: boolean }> => {
    if (!authResult.success || !authResult.user || !authResult.token) {
      throw new Error(authResult.error || 'Firebase giriş başarısız');
    }

    const fbUser = authResult.user;

    // Firebase user → LocalUser mapping
    // Profil tamamlama kontrolü: displayName VE gender doluysa tamamlanmış sayılır
    const hasProfile = !!(fbUser.displayName && fbUser.displayName.trim().length > 0);
    const localUser: LocalUser = {
      id: fbUser.uid,
      username: fbUser.email?.split('@')[0] || fbUser.phoneNumber || fbUser.uid.slice(0, 8),
      displayName: fbUser.displayName || '',
      email: fbUser.email || undefined,
      avatarUrl: fbUser.photoURL || undefined,
      phoneNumber: fbUser.phoneNumber || undefined,
      gender: undefined,
      role: 'member',
      walletBalance: 0,
      points: 0,
      isVip: false,
      authProvider: provider,
      isProfileComplete: false, // Firebase'den gelince her zaman false — setup gerekli
    };

    // Lokal kaydet
    setUser(localUser);
    setToken(authResult.token);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, authResult.token],
      [STORAGE_KEYS.USER, JSON.stringify(localUser)],
      [STORAGE_KEYS.AUTH_PROVIDER, provider],
    ]);

    console.log(`[UserContext] Firebase ${provider} giriş başarılı: ${localUser.displayName || localUser.username}`);

    // Backend'e Firebase token gönder (opsiyonel — backend hazır olunca aktif edilecek)
    try {
      const result: AuthResponse = await guestLogin(
        localUser.username,
        localUser.avatarUrl,
        localUser.gender,
      );
      // Backend'den gelen güncel veriyi uygula
      const mergedUser: LocalUser = {
        ...localUser,
        walletBalance: result.user.walletBalance || 0,
        points: result.user.points || 0,
        isVip: result.user.isVip || false,
        role: result.user.role || 'member',
      };
      setUser(mergedUser);
      setToken(result.access_token);
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TOKEN, result.access_token],
        [STORAGE_KEYS.USER, JSON.stringify(mergedUser)],
      ]);
    } catch (e: any) {
      console.warn('[UserContext] Backend sync başarısız, lokal devam:', e.message);
    }

    return { isNewUser: authResult.isNewUser || false };
  }, []);

  // ─── Misafir girişi (eski mantık korundu) ─────────────────────
  const login = useCallback(async (username: string, avatar?: string, gender?: string) => {
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
      authProvider: 'guest',
      isProfileComplete: !!(username && gender), // Guest: setup'tan geliyorsa true
    };

    setUser(localUser);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(localUser));

    try {
      const result: AuthResponse = await guestLogin(username, avatar, gender);
      const remoteUser: LocalUser = {
        ...result.user,
        avatarUrl: avatar || result.user.avatarUrl,
        authProvider: 'guest',
      };
      setUser(remoteUser);
      setToken(result.access_token);
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TOKEN, result.access_token],
        [STORAGE_KEYS.USER, JSON.stringify(remoteUser)],
      ]);
    } catch (e: any) {
      console.warn('[UserContext] Backend giriş başarısız, lokal devam:', e.message);
    }
  }, []);

  // Profil güncelle
  const update = useCallback(async (payload: { displayName?: string; avatar?: string; gender?: string; bio?: string }) => {
    if (user) {
      const updated: LocalUser = {
        ...user,
        displayName: payload.displayName || user.displayName,
        avatarUrl: payload.avatar || user.avatarUrl,
        gender: payload.gender || user.gender,
        isProfileComplete: true, // Profil güncellendi → tamamlandı
      };
      setUser(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    }

    if (payload.bio !== undefined) {
      const merged = { ...profileExtra, bio: payload.bio };
      setProfileExtra(merged);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_EXTRA, JSON.stringify(merged));
    }

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

  // Çıkış — Firebase + lokal temizle
  const logout = useCallback(async () => {
    // Firebase sign out
    try {
      await firebaseSignOut();
    } catch (e: any) {
      console.warn('[UserContext] Firebase çıkış hatası:', e.message);
    }

    setUser(null);
    setToken(null);
    setProfileExtra({});
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.PROFILE_EXTRA,
      STORAGE_KEYS.AUTH_PROVIDER,
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
        isProfileComplete: !!user?.isProfileComplete,
        login,
        loginWithFirebase,
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
