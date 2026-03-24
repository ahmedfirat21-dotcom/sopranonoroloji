// ═══════════════════════════════════════════════════════
// SopranoChat Mobil2 — Auth Service
// Backend: POST /auth/guest, POST /auth/update-profile
// ═══════════════════════════════════════════════════════

const BASE_URL = 'https://sopranochat.com';
const TIMEOUT = 15000;

export interface UserData {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  gender?: string;
  role: string;
  walletBalance: number;
  points: number;
  isVip: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: UserData;
}

async function fetchJSON<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Misafir girişi — isim + avatar + cinsiyet
 * POST /auth/guest
 */
export async function guestLogin(
  username: string,
  avatar?: string,
  gender?: string,
): Promise<AuthResponse> {
  return fetchJSON<AuthResponse>(`${BASE_URL}/auth/guest`, {
    method: 'POST',
    body: JSON.stringify({ username, avatar, gender }),
  });
}

/**
 * Profil güncelleme (JWT gerekli)
 * POST /auth/update-profile
 */
export async function updateProfile(
  token: string,
  payload: {
    displayName?: string;
    avatar?: string;
    gender?: string;
  },
): Promise<UserData> {
  return fetchJSON<UserData>(`${BASE_URL}/auth/update-profile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}
