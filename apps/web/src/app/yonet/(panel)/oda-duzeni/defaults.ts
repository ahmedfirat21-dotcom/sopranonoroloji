import type { RoomLayoutConfig } from './types';

// ★ v1.7.13.30 (19 May 2026): Tüm varsayılanlar elden geçirildi (mobile ile birebir).
export const DEFAULT_LAYOUT: RoomLayoutConfig = {
  host: {
    avatarShape: 'circle', avatarSize: 144, borderRadius: 48, ringWidth: 3, ringColor: '#FBBF24',
    ringStyle: 'solid', namePosition: 'below', nameFontSize: 14, nameFontWeight: '700', nameColor: '#FFFFFF',
    badgePosition: 'topRight', haloEnabled: true, haloColor: '#FBBF24', haloOpacity: 0.40, haloBlur: 28,
    containerPadding: 8,
  },
  speakers: {
    avatarShape: 'circle', borderRadius: 50, maxCols: 3, colGap: 12, rowGap: 20, ringWidth: 2,
    ringColor: '#14B8A6', speakingRingColor: '#10B981', namePosition: 'below', nameFontSize: 12, nameMaxChars: 0,
    showMicIcon: true, muteOpacity: 0.55, sizePresets: { small: 76, medium: 92, large: 116 },
  },
  listeners: {
    avatarShape: 'circle', borderRadius: 50, maxCols: 6, colGap: 10, rowGap: 14, showName: true,
    nameFontSize: 10, nameMaxChars: 0, ringWidth: 0, ringColor: 'transparent', ownerCrownEnabled: true,
    ownerScale: 1.12, sizePresets: { small: 44, medium: 52, large: 64 },
  },
  stage: {
    backgroundColor: 'rgba(15,25,38,0)', borderRadius: 0, padding: 12, dividerStyle: 'none',
    dividerColor: 'rgba(255,255,255,0.08)', gapBetweenSpeakersAndListeners: 32,
  },
  global: {
    background: 'gradient', bgColor: '#0A0F1A', bgGradient: ['#0F1926', '#0A0F1A'], bgImageUrl: null,
    safePaddingTop: 12, safePaddingBottom: 12, horizontalPadding: 16,
  },
  animations: {
    speakingPulseEnabled: true, speakingPulseSpeed: 1400, speakingRingExpand: 1.25,
    haloPulseEnabled: false, haloPulseSpeed: 2000, haloPulseAmplitude: 0.20,
    avatarTapScale: 0.96, enterTransition: 'fade', enterDurationMs: 400, reduceMotion: false,
  },
  accents: {
    ownerHighlight: '#FBBF24', ownerRingWidth: 3, ownerHaloEnabled: true,
    moderatorHighlight: '#A78BFA', moderatorRingWidth: 2,
    handRaiseColor: '#FBBF24', handRaiseEnabled: true,
    newJoinHighlight: '#10B981', newJoinDurationMs: 4000, selectedHighlight: '#14B8A6',
  },
  indicators: {
    onlineDotEnabled: true, onlineDotColor: '#10B981', onlineDotSize: 8, onlineDotPosition: 'bottomRight',
    muteIndicatorEnabled: true, muteIndicatorColor: '#EF4444', muteIndicatorSize: 18, muteIndicatorPosition: 'bottomRight',
    cameraIndicatorEnabled: true, cameraIndicatorColor: '#3B82F6',
    verifiedTickEnabled: true, verifiedTickColor: '#3B82F6',
  },
  shadows: {
    hostShadowColor: '#FBBF24', hostShadowBlur: 18, hostShadowOpacity: 0.50,
    speakerShadowColor: '#14B8A6', speakerShadowBlur: 12, speakerShadowOpacity: 0.30, speakerShadowEnabled: false,
    listenerShadowEnabled: false, listenerShadowColor: '#000000', listenerShadowBlur: 4, listenerShadowOpacity: 0.30,
  },
  header: {
    titleFontSize: 16, titleFontWeight: '700', titleColor: '#F1F5F9',
    subtitleFontSize: 11, subtitleColor: '#94A3B8',
    showLiveIndicator: true, liveDotColor: '#EF4444', liveDotPulse: true,
    showListenerCount: true, headerBgOpacity: 0.55, headerBorderBottom: true, headerBorderColor: 'rgba(20,184,166,0.45)',
    // ★ v300: Host avatar görsel ayarları — APK ile birebir.
    showHostAvatar: true, hostAvatarSize: 36, hostAvatarBorderWidth: 1.5, hostAvatarBorderColor: 'rgba(20,184,166,0.55)',
    offsetY: 0, offsetX: 0,
  },
  controls: {
    barBackground: 'rgba(15,25,38,0.92)', barBlurEnabled: true, barBlurIntensity: 36,
    barBorderTop: 'rgba(20,184,166,0.20)', barPaddingV: 12,
    buttonSize: 58, buttonGap: 12, buttonShape: 'circle', buttonBorderRadius: 12,
    micActiveColor: '#10B981', micMutedColor: '#475569', leaveButtonColor: '#EF4444',
    iconColor: '#E2E8F0', iconSize: 22,
    offsetY: 0, offsetX: 0,
  },
  listeners_advanced: {
    maxVisibleSmallScreen: 10, maxVisibleDefault: 14,
    overflowBadgeText: '+{N} Seyirci', overflowBadgeColor: 'rgba(20,184,166,0.16)', overflowBadgeTextColor: '#5EEAD4',
    showHandRaiseBadge: true, handRaiseBadgePosition: 'topLeft', showMicRequestPulse: true,
  },
  // ★ v1.7.13.30 (19 May 2026): Kamera default'ları yenilendi.
  camera: {
    heightRatio: 1.05, cornerRadiusPercent: 10, cornerRadiusMin: 14,
    objectFit: 'cover', mirrorSelf: true,
    indicatorEnabled: false, indicatorColor: '#3B82F6', indicatorPosition: 'topRight', indicatorSize: 16,
    useCustomBorder: false, borderWidth: 2, borderColor: '#3B82F6',
    overlayTopOpacity: 0.45, overlayBottomOpacity: 0.55,
    spotlightEnabled: true,
    spotlightSingleAspect: 0.66, spotlightDoubleAspect: 1.30, spotlightTripleAspect: 1.0, spotlightQuadAspect: 1.0,
    spotlightGap: 8,
    fullscreenObjectFit: 'cover',
    maxConcurrentCameras: 0,
    audioCompactSize: 100,
    audioCompactGap: 10,
  },
};

// ★ v289 (16 May 2026): Nested deep merge — sizePresets gibi iç içe obj'ler için.
//   Sığ spread'te DB'ye `{sizePresets: {small: 60}}` yazılırsa medium/large kaybolur.
function mergeNested(defaults: any, raw: any): any {
  if (raw === null || raw === undefined) return defaults;
  if (typeof raw !== 'object' || typeof defaults !== 'object') return raw;
  if (Array.isArray(defaults) || Array.isArray(raw)) return raw;
  const out: any = { ...defaults };
  for (const k of Object.keys(raw)) {
    const dv = defaults[k];
    const rv = raw[k];
    if (dv && typeof dv === 'object' && !Array.isArray(dv)) {
      out[k] = mergeNested(dv, rv);
    } else {
      out[k] = rv;
    }
  }
  return out;
}

export function mergeWithDefaults(raw: any): RoomLayoutConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_LAYOUT;
  const merged: any = {};
  for (const k of Object.keys(DEFAULT_LAYOUT) as (keyof RoomLayoutConfig)[]) {
    merged[k] = mergeNested((DEFAULT_LAYOUT as any)[k], raw[k]);
  }
  return merged as RoomLayoutConfig;
}
