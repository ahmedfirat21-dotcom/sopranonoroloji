// ═══════════════════════════════════════════════════════════
// SopranoChat Mobil2 — useLiveKit Hook
// Room ekranında LiveKit ses bağlantısını yönetir
// ═══════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { livekitService, LiveKitConnectionState } from '../services/livekit';

interface UseLiveKitOptions {
  roomSlug: string | undefined;
  enabled?: boolean;
  isSocketConnected?: boolean;
  userId?: string;
  displayName?: string;
}

interface UseLiveKitReturn {
  connectionState: LiveKitConnectionState;
  isPublishing: boolean;
  error: string | null;
  publishAudio: () => Promise<boolean>;
  unpublishAudio: () => Promise<void>;
  setMicEnabled: (enabled: boolean) => Promise<void>;
}

export default function useLiveKit({
  roomSlug,
  enabled = true,
  isSocketConnected = false,
  userId,
  displayName,
}: UseLiveKitOptions): UseLiveKitReturn {
  const [connectionState, setConnectionState] = useState<LiveKitConnectionState>('idle');
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectAttemptedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const wasPublishingRef = useRef(false);

  // ─── Connect/Disconnect lifecycle ─────────────────────────
  useEffect(() => {
    if (!roomSlug || !enabled) return;
    if (!isSocketConnected) return;
    if (connectAttemptedRef.current && livekitService.isConnected) return;

    const uid = userId || `guest_${Date.now()}`;
    const name = displayName || 'Misafir';

    connectAttemptedRef.current = true;

    livekitService.setCallbacks({
      onConnectionStateChanged: (state) => setConnectionState(state),
      onError: (errMsg) => {
        setError(errMsg);
        setTimeout(() => setError(null), 5000);
      },
      onSpeakingChanged: () => {},
    });

    livekitService.connect(roomSlug, uid, name).then((success) => {
      if (!success) {
        setError('LiveKit bağlantısı kurulamadı');
        connectAttemptedRef.current = false;
      }
    });

    return () => {
      connectAttemptedRef.current = false;
      livekitService.clearCallbacks();
      livekitService.disconnect();
      setConnectionState('idle');
      setIsPublishing(false);
      setError(null);
    };
  }, [roomSlug, isSocketConnected, enabled, userId, displayName]);

  // ─── App State (arka plan/ön plan) ────────────────────────
  useEffect(() => {
    const handleAppState = async (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/active/) && nextState.match(/inactive|background/)) {
        if (livekitService.isPublishing) {
          wasPublishingRef.current = true;
          await livekitService.setMicEnabled(false);
        }
      } else if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        if (wasPublishingRef.current) {
          wasPublishingRef.current = false;
          await livekitService.setMicEnabled(true);
        }
      }
      appStateRef.current = nextState;
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  // ─── Actions ──────────────────────────────────────────────
  const publishAudio = useCallback(async (): Promise<boolean> => {
    const success = await livekitService.publishAudio();
    setIsPublishing(success);
    return success;
  }, []);

  const unpublishAudio = useCallback(async (): Promise<void> => {
    await livekitService.unpublishAudio();
    setIsPublishing(false);
  }, []);

  const setMicEnabled = useCallback(async (en: boolean): Promise<void> => {
    await livekitService.setMicEnabled(en);
  }, []);

  return {
    connectionState,
    isPublishing,
    error,
    publishAudio,
    unpublishAudio,
    setMicEnabled,
  };
}
