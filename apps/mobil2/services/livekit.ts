// ═══════════════════════════════════════════════════════════
// SopranoChat Mobil2 — LiveKit Audio + Data Service (Singleton)
// WebRTC ses + DataChannel (chat/katılımcılar)
//
// livekit-client lazy-load ile korunur.
// ═══════════════════════════════════════════════════════════

import { Platform, PermissionsAndroid } from 'react-native';

const BASE_URL = 'https://sopranochat.com';

// ─── Types ──────────────────────────────────────────────────
export type LiveKitConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export interface LiveKitParticipant {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isLocal: boolean;
  audioEnabled: boolean;
  metadata?: any;
}

export interface LiveKitChatMessage {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface LiveKitCallbacks {
  onConnectionStateChanged?: (state: LiveKitConnectionState) => void;
  onSpeakingChanged?: (participantId: string, isSpeaking: boolean) => void;
  onError?: (error: string) => void;
  onParticipantsChanged?: (participants: LiveKitParticipant[]) => void;
  onDataReceived?: (message: LiveKitChatMessage) => void;
}

// ─── Debug Logger ───────────────────────────────────────────
function log(...args: any[]) {
  console.log('[LiveKit]', ...args);
}
function warn(...args: any[]) {
  console.warn('[LiveKit]', ...args);
}

// ─── Lazy-loaded LiveKit ────────────────────────────────────
let _lk: any = null;
let _available: boolean | null = null;

function getLK(): any {
  if (_available === false) return null;
  if (_lk) return _lk;

  try {
    _lk = require('livekit-client');
    _available = true;
    log('livekit-client yüklendi');
    return _lk;
  } catch {
    _available = false;
    warn('livekit-client bulunamadı — ses odası devre dışı');
    return null;
  }
}

// Helper
function safeParseJSON(str: string): any {
  try { return JSON.parse(str); } catch { return undefined; }
}

// ─── Service ────────────────────────────────────────────────
class LiveKitAudioService {
  private room: any = null;
  private connectionState: LiveKitConnectionState = 'idle';
  private callbacks: LiveKitCallbacks = {};
  private isMicPublished = false;

  // ── Connect ──────────────────────────────────────────────
  async connect(roomName: string, userId: string, displayName: string, role: 'owner' | 'speaker' | 'listener' = 'listener'): Promise<boolean> {
    const lk = getLK();
    if (!lk) {
      warn('LiveKit kullanılamıyor — paket yüklü değil');
      this.callbacks.onError?.('Sesli sohbet şu an kullanılamıyor');
      return false;
    }

    try {
      if (this.room?.state === lk.ConnectionState.Connected) {
        log('Zaten bağlı');
        return true;
      }

      this.setState('connecting');

      const token = await this.fetchToken(roomName, userId, role);
      if (!token) {
        this.setState('error');
        return false;
      }

      this.room = new lk.Room();
      this.setupListeners(lk);

      await this.room.connect(`wss://soprano-chat-98fpupmw.livekit.cloud`, token, {
        autoSubscribe: true,
      });

      this.setState('connected');
      log('Bağlandı:', roomName, 'Rol:', role);

      // Owner ise otomatik mikrofon aç
      if (role === 'owner' || role === 'speaker') {
        const published = await this.publishAudio();
        log('Otomatik ses yayını:', published ? 'başarılı' : 'başarısız');
      }

      // İlk katılımcı listesini yayınla
      this.emitParticipants();

      return true;
    } catch (err: any) {
      warn('Bağlantı hatası:', err.message);
      this.setState('error');
      this.callbacks.onError?.(`Bağlantı hatası: ${err.message}`);
      return false;
    }
  }

  // ── Disconnect ───────────────────────────────────────────
  async disconnect(): Promise<void> {
    try {
      if (this.isMicPublished) await this.unpublishAudio();
      if (this.room) {
        await this.room.disconnect();
        this.room = null;
      }
      this.isMicPublished = false;
      this.setState('disconnected');
      log('Bağlantı kesildi');
    } catch (err: any) {
      warn('Disconnect hatası:', err.message);
      this.room = null;
      this.setState('disconnected');
    }
  }

  // ── Publish Audio ────────────────────────────────────────
  async publishAudio(): Promise<boolean> {
    const lk = getLK();
    if (!lk || !this.room || this.room.state !== lk.ConnectionState.Connected) {
      warn('Ses yayınamıyor — bağlı değil');
      return false;
    }

    if (this.isMicPublished) return true;

    const hasPerm = await this.requestMicPermission();
    if (!hasPerm) {
      this.callbacks.onError?.('Mikrofon izni verilmedi');
      return false;
    }

    try {
      const track = await lk.createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      await this.room.localParticipant.publishTrack(track);
      this.isMicPublished = true;
      log('Ses yayını başladı');
      return true;
    } catch (err: any) {
      warn('Ses yayını başlatılamadı:', err.message);
      this.callbacks.onError?.(`Ses hatası: ${err.message}`);
      return false;
    }
  }

  // ── Unpublish Audio ──────────────────────────────────────
  async unpublishAudio(): Promise<void> {
    if (!this.room || !this.isMicPublished) return;
    try {
      const lp = this.room.localParticipant;
      for (const [, pub] of lp.audioTrackPublications) {
        if (pub.track) {
          await lp.unpublishTrack(pub.track);
          pub.track.stop();
        }
      }
      this.isMicPublished = false;
      log('Ses yayını durduruldu');
    } catch (err: any) {
      warn('Unpublish hatası:', err.message);
    }
  }

  // ── Mic Mute/Unmute ──────────────────────────────────────
  async setMicEnabled(enabled: boolean): Promise<void> {
    if (!this.room || !this.isMicPublished) return;
    try {
      await this.room.localParticipant.setMicrophoneEnabled(enabled);
      log('Mikrofon:', enabled ? 'Açık' : 'Kapalı');
    } catch (err: any) {
      warn('Mic toggle hatası:', err.message);
    }
  }

  // ── Send Data (Chat Message) ─────────────────────────────
  async sendChatMessage(text: string): Promise<boolean> {
    const lk = getLK();
    if (!lk || !this.room || this.room.state !== lk.ConnectionState.Connected) {
      warn('Data gönderilemedi — bağlı değil');
      return false;
    }
    try {
      const msg: LiveKitChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sender: this.room.localParticipant.identity,
        senderName: this.room.localParticipant.name || this.room.localParticipant.identity,
        text,
        timestamp: Date.now(),
      };
      const data = new TextEncoder().encode(JSON.stringify({ type: 'chat', payload: msg }));
      await this.room.localParticipant.publishData(data, { reliable: true });
      log('Mesaj gönderildi:', text.slice(0, 30));
      return true;
    } catch (err: any) {
      warn('Data gönderim hatası:', err.message);
      return false;
    }
  }

  // ── Get Participants ─────────────────────────────────────
  getParticipants(): LiveKitParticipant[] {
    if (!this.room) return [];
    const participants: LiveKitParticipant[] = [];

    // Yerel katılımcı
    const lp = this.room.localParticipant;
    if (lp) {
      participants.push({
        identity: lp.identity,
        name: lp.name || lp.identity,
        isSpeaking: lp.isSpeaking || false,
        isLocal: true,
        audioEnabled: this.isMicPublished,
        metadata: lp.metadata ? safeParseJSON(lp.metadata) : undefined,
      });
    }

    // Uzak katılımcılar
    for (const [, p] of this.room.remoteParticipants) {
      const hasAudio = Array.from(p.audioTrackPublications?.values?.() || []).some(
        (pub: any) => pub.track && !pub.isMuted
      );
      participants.push({
        identity: p.identity,
        name: p.name || p.identity,
        isSpeaking: p.isSpeaking || false,
        isLocal: false,
        audioEnabled: hasAudio,
        metadata: p.metadata ? safeParseJSON(p.metadata) : undefined,
      });
    }

    return participants;
  }

  // ── Getters ──────────────────────────────────────────────
  get isConnected(): boolean {
    const lk = getLK();
    if (!lk) return false;
    return this.room?.state === lk.ConnectionState.Connected;
  }

  get isPublishing(): boolean {
    return this.isMicPublished;
  }

  get state(): LiveKitConnectionState {
    return this.connectionState;
  }

  // ── Callbacks ────────────────────────────────────────────
  setCallbacks(cb: LiveKitCallbacks): void {
    this.callbacks = cb;
  }

  clearCallbacks(): void {
    this.callbacks = {};
  }

  // ── Private ──────────────────────────────────────────────
  private setState(s: LiveKitConnectionState): void {
    this.connectionState = s;
    this.callbacks.onConnectionStateChanged?.(s);
  }

  private emitParticipants(): void {
    const participants = this.getParticipants();
    this.callbacks.onParticipantsChanged?.(participants);
  }

  private async fetchToken(room: string, username: string, role: 'owner' | 'speaker' | 'listener' = 'listener'): Promise<string | null> {
    try {
      const url = `${BASE_URL}/api/livekit/get-token?roomName=${encodeURIComponent(room)}&participantName=${encodeURIComponent(username)}&role=${role}`;
      log('Token alınıyor:', url);
      const res = await fetch(url);
      if (!res.ok) {
        warn('Token hatası:', res.status);
        return null;
      }
      const data = await res.json();
      log('Token alındı, uzunluk:', data.token?.length);
      return data.token;
    } catch (err: any) {
      warn('Token fetch hatası:', err.message);
      this.callbacks.onError?.(`Token alınamadı: ${err.message}`);
      return null;
    }
  }

  private async requestMicPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Mikrofon İzni',
          message: 'SopranoChat sesli sohbet için mikrofon erişimi gerektirir.',
          buttonPositive: 'İzin Ver',
          buttonNegative: 'Reddet',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      warn('Mikrofon izni hatası');
      return false;
    }
  }

  private setupListeners(lk: any): void {
    if (!this.room) return;

    this.room.on(lk.RoomEvent.ConnectionStateChanged, (state: any) => {
      switch (state) {
        case lk.ConnectionState.Connected:
          this.setState('connected');
          break;
        case lk.ConnectionState.Reconnecting:
          this.setState('reconnecting');
          break;
        case lk.ConnectionState.Disconnected:
          this.setState('disconnected');
          break;
      }
    });

    this.room.on(
      lk.RoomEvent.TrackSubscribed,
      (track: any, _pub: any, participant: any) => {
        if (track.kind === lk.Track.Kind.Audio) {
          try {
            track.attach();
            log('Ses bağlandı:', participant.identity);
          } catch (err: any) {
            warn('Ses bağlama hatası:', err.message);
          }
        }
        this.emitParticipants();
      },
    );

    // Katılımcı olayları
    this.room.on(lk.RoomEvent.ParticipantConnected, (participant: any) => {
      log('Katılımcı bağlandı:', participant.identity);
      this.emitParticipants();
    });

    this.room.on(lk.RoomEvent.ParticipantDisconnected, (participant: any) => {
      log('Katılımcı ayrıldı:', participant.identity);
      this.emitParticipants();
    });

    this.room.on(lk.RoomEvent.ActiveSpeakersChanged, (speakers: any[]) => {
      if (this.room) {
        for (const [, p] of this.room.remoteParticipants) {
          const speaking = speakers.some((s: any) => s.identity === p.identity);
          this.callbacks.onSpeakingChanged?.(p.identity, speaking);
        }
        const localSpeaking = speakers.some(
          (s: any) => s.identity === this.room.localParticipant.identity
        );
        this.callbacks.onSpeakingChanged?.(this.room.localParticipant.identity, localSpeaking);
        this.emitParticipants();
      }
    });

    // DataChannel — Chat mesajları
    this.room.on(lk.RoomEvent.DataReceived, (payload: Uint8Array, participant: any) => {
      try {
        const text = new TextDecoder().decode(payload);
        const parsed = JSON.parse(text);
        if (parsed.type === 'chat' && parsed.payload) {
          log('Mesaj alındı:', parsed.payload.text?.slice(0, 30));
          this.callbacks.onDataReceived?.(parsed.payload as LiveKitChatMessage);
        }
      } catch (err: any) {
        warn('Data parse hatası:', err.message);
      }
    });

    this.room.on(lk.RoomEvent.Disconnected, () => {
      log('Oda bağlantısı kesildi');
      this.isMicPublished = false;
    });

    this.room.on(lk.RoomEvent.Reconnected, () => {
      log('Yeniden bağlandı');
      this.setState('connected');
      this.emitParticipants();
    });
  }
}

// Singleton export
export const livekitService = new LiveKitAudioService();
