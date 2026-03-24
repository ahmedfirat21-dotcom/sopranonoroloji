// ═══════════════════════════════════════════════════════
// SopranoChat — Ağ Katmanı (Network Layer)
//
// Vercel API ile iletişim kuran servis fonksiyonları.
// Tüm fonksiyonlar async/await ile çalışır.
// ═══════════════════════════════════════════════════════

// Vercel base URL — production
const BASE_URL = 'https://sopranochat.com';

// Request timeout (ms)
const REQUEST_TIMEOUT = 15000;

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export interface BuyVisaResponse {
  success: boolean;
  message?: string;
  error?: string;
  required?: number;
  current?: number;
  deficit?: number;
  data?: {
    transactionId: string;
    newRole: string;
    walletBalance: number;
    payment: {
      total: number;
      ownerReceived: number;
      platformCommission: number;
    };
  };
}

export interface LiveKitTokenResponse {
  token: string;
  identity: string;
  room: string;
  role: string;
  grants: {
    canPublish: boolean;
    canSubscribe: boolean;
    canPublishData: boolean;
  };
  error?: string;
}

export type ParticipantRole = 'owner' | 'speaker' | 'listener';

// ─────────────────────────────────────────────────────
// Fetch Wrapper (Timeout + Error Handling)
// ─────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// ─────────────────────────────────────────────────────
// API: Mikrofon Vizesi Satın Al
// POST /api/economy/buy-visa
// ─────────────────────────────────────────────────────

export async function buySpeakerVisa(
  userId: string,
  roomId: string,
  tenantId?: string,
): Promise<BuyVisaResponse> {
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/economy/buy-visa`,
      {
        method: 'POST',
        body: JSON.stringify({ userId, roomId, tenantId }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `İşlem başarısız (${response.status})`,
        required: data.required,
        current: data.current,
        deficit: data.deficit,
      };
    }

    return data as BuyVisaResponse;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Bağlantı zaman aşımına uğradı' };
    }
    return { success: false, error: error.message || 'Ağ hatası oluştu' };
  }
}

// ─────────────────────────────────────────────────────
// API: LiveKit Token Al
// GET /api/livekit/get-token
// ─────────────────────────────────────────────────────

export async function getLiveKitToken(
  roomName: string,
  participantName: string,
  role: ParticipantRole = 'listener',
): Promise<LiveKitTokenResponse> {
  try {
    const params = new URLSearchParams({
      roomName,
      participantName,
      role,
    });

    const response = await fetchWithTimeout(
      `${BASE_URL}/api/livekit/get-token?${params.toString()}`,
      { method: 'GET' },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        token: '',
        identity: '',
        room: '',
        role: '',
        grants: { canPublish: false, canSubscribe: false, canPublishData: false },
        error: data.error || `Token alınamadı (${response.status})`,
      };
    }

    return data as LiveKitTokenResponse;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        token: '',
        identity: '',
        room: '',
        role: '',
        grants: { canPublish: false, canSubscribe: false, canPublishData: false },
        error: 'Bağlantı zaman aşımına uğradı',
      };
    }
    return {
      token: '',
      identity: '',
      room: '',
      role: '',
      grants: { canPublish: false, canSubscribe: false, canPublishData: false },
      error: error.message || 'Ağ hatası oluştu',
    };
  }
}

// ─────────────────────────────────────────────────────
// API: Herkese Açık Odalar
// GET /rooms/public
// ─────────────────────────────────────────────────────

export interface RoomData {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  ownerDisplayName?: string;
  ownerAvatarUrl?: string;
  maxCapacity: number;
  currentParticipants?: number;
  isPrivate: boolean;
  tags?: string[];
  createdAt?: string;
}

export async function getPublicRooms(): Promise<RoomData[]> {
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/rooms/public`,
      { method: 'GET' },
    );

    const data = await response.json();

    if (!response.ok) {
      console.warn('[API] Odalar alınamadı:', data?.error || response.status);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.warn('[API] Oda listesi hatası:', error.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────
// API: Lider Tablosu
// GET /api/economy/leaderboard
// ─────────────────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  points: number;
  rank: number;
  isVip: boolean;
}

export async function getLeaderboard(
  type: 'spenders' | 'earners' = 'spenders',
  period: 'daily' | 'weekly' | 'monthly' = 'weekly',
): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/economy/leaderboard?type=${type}&period=${period}`,
      { method: 'GET' },
    );

    const data = await response.json();
    if (!response.ok) {
      console.warn('[API] Liderlik alınamadı:', data?.error || response.status);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.warn('[API] Liderlik hatası:', error.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────
// API: Popüler/Trend Odalar (Discover)
// GET /rooms/discover
// ─────────────────────────────────────────────────────

export async function getDiscoverRooms(): Promise<RoomData[]> {
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/rooms/discover`,
      { method: 'GET' },
    );

    const data = await response.json();
    if (!response.ok) {
      console.warn('[API] Discover odaları alınamadı:', data?.error || response.status);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.warn('[API] Discover hatası:', error.message);
    return [];
  }
}
