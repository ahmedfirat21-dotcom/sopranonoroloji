// ═══════════════════════════════════════════════════════════
// SopranoChat Mobil2 — Firebase Auth Service
// Google, Apple, Phone (OTP) kimlik doğrulama
// ═══════════════════════════════════════════════════════════

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// ─── Google Sign-In Yapılandırması ──────────────────────────
// webClientId: google-services.json'daki oauth_client[type=3] → client_id
// Lazy init: Native modül hazır olduktan sonra configure edilir
let googleConfigured = false;
function ensureGoogleConfigured() {
  if (!googleConfigured) {
    GoogleSignin.configure({
      webClientId: '236660998634-rk3hae9hu4a75sem79ep4l773ekd9rt2.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
    googleConfigured = true;
  }
}

// ─── Types ──────────────────────────────────────────────────
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  providerId: string;
}

export interface AuthResult {
  success: boolean;
  user?: FirebaseUser;
  token?: string;
  error?: string;
  isNewUser?: boolean;
}

// ─── Firebase User → Serializable mapping ───────────────────
function mapFirebaseUser(fbUser: FirebaseAuthTypes.User): FirebaseUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
    phoneNumber: fbUser.phoneNumber,
    providerId: fbUser.providerData?.[0]?.providerId || 'firebase',
  };
}

// ═══════════════════════════════════════════════════════════
// 1. GOOGLE İLE GİRİŞ
// ═══════════════════════════════════════════════════════════

export async function loginWithGoogle(): Promise<AuthResult> {
  try {
    // Lazy configure
    ensureGoogleConfigured();

    // Google Play Services kontrolü
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Google Sign-In popup
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult?.data?.idToken;

    if (!idToken) {
      return { success: false, error: 'Google token alınamadı' };
    }

    // Firebase credential oluştur
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Firebase ile giriş
    const userCredential = await auth().signInWithCredential(googleCredential);
    const firebaseUser = userCredential.user;
    const token = await firebaseUser.getIdToken();

    return {
      success: true,
      user: mapFirebaseUser(firebaseUser),
      token,
      isNewUser: userCredential.additionalUserInfo?.isNewUser || false,
    };
  } catch (error: any) {
    console.warn('[FirebaseAuth] Google giriş hatası:', error.code, error.message);

    // Kullanıcı iptal ettiyse
    if (error.code === 'SIGN_IN_CANCELLED' || error.code === '12501') {
      return { success: false, error: 'İptal edildi' };
    }

    return { success: false, error: error.message || 'Google giriş başarısız' };
  }
}

// ═══════════════════════════════════════════════════════════
// 2. APPLE İLE GİRİŞ (sadece iOS)
// ═══════════════════════════════════════════════════════════

export async function loginWithApple(): Promise<AuthResult> {
  if (Platform.OS !== 'ios') {
    return { success: false, error: 'Apple Sign-In sadece iOS\'ta desteklenir' };
  }

  try {
    // Lazy-load Apple Authentication (iOS only)
    const AppleAuth = require('expo-apple-authentication');
    const Crypto = require('expo-crypto');

    // Nonce oluştur (güvenlik için)
    const rawNonce = Math.random().toString(36).substring(2, 10);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    // Apple Sign-In popup
    const appleCredential = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    // Firebase credential oluştur
    const { identityToken } = appleCredential;
    if (!identityToken) {
      return { success: false, error: 'Apple token alınamadı' };
    }

    const credential = auth.AppleAuthProvider.credential(identityToken, rawNonce);
    const userCredential = await auth().signInWithCredential(credential);
    const firebaseUser = userCredential.user;
    const token = await firebaseUser.getIdToken();

    return {
      success: true,
      user: mapFirebaseUser(firebaseUser),
      token,
      isNewUser: userCredential.additionalUserInfo?.isNewUser || false,
    };
  } catch (error: any) {
    console.warn('[FirebaseAuth] Apple giriş hatası:', error.message);

    if (error.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'İptal edildi' };
    }

    return { success: false, error: error.message || 'Apple giriş başarısız' };
  }
}

// ═══════════════════════════════════════════════════════════
// 3. TELEFON İLE GİRİŞ (OTP)
// ═══════════════════════════════════════════════════════════

/**
 * SMS OTP gönder
 * @returns confirmation objesi (verifyPhoneOTP'de kullanılacak)
 */
export async function sendPhoneOTP(
  phoneNumber: string,
): Promise<{ success: boolean; confirmation?: FirebaseAuthTypes.ConfirmationResult; error?: string }> {
  try {
    // Telefon numarası formatı kontrolü
    const cleanNumber = phoneNumber.replace(/\s+/g, '');
    if (!cleanNumber.startsWith('+')) {
      return { success: false, error: 'Telefon numarası + ile başlamalı (örn: +905551234567)' };
    }

    const confirmation = await auth().signInWithPhoneNumber(cleanNumber);

    return { success: true, confirmation };
  } catch (error: any) {
    console.warn('[FirebaseAuth] OTP gönderim hatası:', error.message);

    if (error.code === 'auth/invalid-phone-number') {
      return { success: false, error: 'Geçersiz telefon numarası' };
    }
    if (error.code === 'auth/too-many-requests') {
      return { success: false, error: 'Çok fazla deneme. Lütfen biraz bekleyin.' };
    }

    return { success: false, error: error.message || 'SMS gönderilemedi' };
  }
}

/**
 * OTP kodunu doğrula
 */
export async function verifyPhoneOTP(
  confirmation: FirebaseAuthTypes.ConfirmationResult,
  code: string,
): Promise<AuthResult> {
  try {
    const userCredential = await confirmation.confirm(code);
    if (!userCredential?.user) {
      return { success: false, error: 'Doğrulama başarısız' };
    }

    const firebaseUser = userCredential.user;
    const token = await firebaseUser.getIdToken();

    return {
      success: true,
      user: mapFirebaseUser(firebaseUser),
      token,
      isNewUser: userCredential.additionalUserInfo?.isNewUser || false,
    };
  } catch (error: any) {
    console.warn('[FirebaseAuth] OTP doğrulama hatası:', error.message);

    if (error.code === 'auth/invalid-verification-code') {
      return { success: false, error: 'Geçersiz doğrulama kodu' };
    }
    if (error.code === 'auth/session-expired') {
      return { success: false, error: 'Kodun süresi doldu. Yeni kod isteyin.' };
    }

    return { success: false, error: error.message || 'Doğrulama başarısız' };
  }
}

// ═══════════════════════════════════════════════════════════
// 4. ÇIKIŞ & DURUM İZLEME
// ═══════════════════════════════════════════════════════════

/**
 * Firebase'den çıkış yap
 */
export async function firebaseSignOut(): Promise<void> {
  try {
    // Google Sign-In'dan da çık
    try {
      await GoogleSignin.signOut();
    } catch {
      // Google Sign-In ile giriş yapılmamışsa hata verebilir — yok say
    }

    await auth().signOut();
    console.log('[FirebaseAuth] Çıkış yapıldı');
  } catch (error: any) {
    console.warn('[FirebaseAuth] Çıkış hatası:', error.message);
  }
}

/**
 * Mevcut Firebase kullanıcısını al
 */
export function getCurrentFirebaseUser(): FirebaseUser | null {
  const user = auth().currentUser;
  return user ? mapFirebaseUser(user) : null;
}

/**
 * Firebase auth state değişikliklerini dinle
 */
export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void,
): () => void {
  return auth().onAuthStateChanged((fbUser) => {
    callback(fbUser ? mapFirebaseUser(fbUser) : null);
  });
}

/**
 * Mevcut kullanıcının taze ID token'ını al
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth().currentUser;
  if (!user) return null;
  return user.getIdToken(true); // true = force refresh
}
