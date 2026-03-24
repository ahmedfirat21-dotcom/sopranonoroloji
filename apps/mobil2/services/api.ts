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
      `${BASE_URL}/api/rooms/public`,
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
  rank: number;
  id: string;
  name: string;
  avatar: string | null;
  points: number;
  giftsSent: number;
  giftsReceived: number;
  duelWins: number;
  duelLosses: number;
  isPremium: boolean;
  role: string;
  isOnline: boolean;
}

export type LeaderboardType = 'points' | 'gifts' | 'duels';

export async function getLeaderboard(
  type: LeaderboardType = 'points',
  limit: number = 50,
): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/leaderboard?type=${type}&limit=${limit}`,
      { method: 'GET' },
    );
    if (!response.ok) return [];
    return (await response.json()) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────
// API: Popüler/Trend Odalar (Discover)
// GET /api/rooms/discover
// ─────────────────────────────────────────────────────

export interface DiscoverRoom extends RoomData {
  badge?: 'trend' | 'hot' | 'new' | 'standard';
}

export interface RadarUserData {
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
  ring: number;
  angle: number;
  tier: 'gold' | 'silver' | 'standard';
}

export interface DiscoverResponse {
  rooms: DiscoverRoom[];
  radarUsers: RadarUserData[];
}

export async function getDiscoverData(): Promise<DiscoverResponse> {
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/rooms/discover`,
      { method: 'GET' },
    );

    const data = await response.json();
    if (!response.ok) {
      console.warn('[API] Discover alınamadı:', data?.error || response.status);
      // Fallback: public rooms kullan
      const rooms = await getPublicRooms();
      return { rooms, radarUsers: [] };
    }
    return {
      rooms: data.rooms || [],
      radarUsers: data.radarUsers || [],
    };
  } catch (error: any) {
    console.warn('[API] Discover hatası:', error.message);
    // Fallback
    const rooms = await getPublicRooms();
    return { rooms, radarUsers: [] };
  }
}

// ─────────────────────────────────────────────────────
// API: Oda Oluştur
// POST /api/rooms/create
// ─────────────────────────────────────────────────────

export interface CreateRoomPayload {
  name: string;
  category?: string;
  maxParticipants?: number;
  speakerVisaPrice?: number;
  ownerId: string;
  tenantId?: string;
}

export interface CreateRoomResponse {
  success: boolean;
  room?: RoomData & { speakerVisaPrice?: number };
  error?: string;
}

export async function createRoom(payload: CreateRoomPayload): Promise<CreateRoomResponse> {
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/rooms/create`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Oda oluşturulamadı (${response.status})`,
      };
    }

    return data as CreateRoomResponse;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Bağlantı zaman aşımına uğradı' };
    }
    return { success: false, error: error.message || 'Ağ hatası oluştu' };
  }
}

// ─────────────────────────────────────────────────────
// Notifications (Read from backend)
// ─────────────────────────────────────────────────────

export interface NotificationData {
  id: string;
  type: string;
  fromName: string;
  message: string;
  time: string;
  isRead: boolean;
  fromAvatar?: string | null;
}

export async function getNotifications(
  userId: string,
): Promise<NotificationData[]> {
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/notifications?userId=${userId}`,
      { method: 'GET' },
    );
    if (!response.ok) return [];
    return (await response.json()) as NotificationData[];
  } catch {
    return [];
  }
}
