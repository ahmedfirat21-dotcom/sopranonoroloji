import type { RoomLayoutConfig } from './types';

export const DEFAULT_LAYOUT: RoomLayoutConfig = {
  host: {
    avatarShape: 'circle', avatarSize: 140, borderRadius: 48, ringWidth: 3, ringColor: '#FBBF24',
    ringStyle: 'solid', namePosition: 'below', nameFontSize: 14, nameFontWeight: '700', nameColor: '#FFFFFF',
    badgePosition: 'topRight', haloEnabled: true, haloColor: '#FBBF24', haloOpacity: 0.45, haloBlur: 24,
    containerPadding: 12,
  },
  speakers: {
    avatarShape: 'circle', borderRadius: 50, maxCols: 4, colGap: 14, rowGap: 16, ringWidth: 2,
    ringColor: '#14B8A6', speakingRingColor: '#10B981', namePosition: 'below', nameFontSize: 12, nameMaxChars: 0,
    showMicIcon: true, muteOpacity: 0.55, sizePresets: { small: 84, medium: 100, large: 110 },
  },
  listeners: {
    avatarShape: 'circle', borderRadius: 50, maxCols: 6, colGap: 10, rowGap: 12, showName: true,
    nameFontSize: 10, nameMaxChars: 0, ringWidth: 0, ringColor: 'transparent', ownerCrownEnabled: true,
    ownerScale: 1.10, sizePresets: { small: 42, medium: 50, large: 60 },
  },
  stage: {
    backgroundColor: 'rgba(15,25,38,0)', borderRadius: 0, padding: 16, dividerStyle: 'none',
    dividerColor: 'rgba(255,255,255,0.08)', gapBetweenSpeakersAndListeners: 20,
  },
  global: {
    background: 'gradient', bgColor: '#0A0F1A', bgGradient: ['#0F1926', '#0A0F1A'], bgImageUrl: null,
    safePaddingTop: 12, safePaddingBottom: 12, horizontalPadding: 16,
  },
  animations: {
    speakingPulseEnabled: true, speakingPulseSpeed: 1400, speakingRingExpand: 1.35,
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
    showListenerCount: true, headerBgOpacity: 0.0, headerBorderBottom: true, headerBorderColor: 'rgba(20,184,166,0.55)',
  },
  controls: {
    barBackground: 'rgba(15,25,38,0.85)', barBlurEnabled: true, barBlurIntensity: 28,
    barBorderTop: 'rgba(255,255,255,0.05)', barPaddingV: 10,
    buttonSize: 44, buttonGap: 12, buttonShape: 'circle', buttonBorderRadius: 12,
    micActiveColor: '#10B981', micMutedColor: '#475569', leaveButtonColor: '#EF4444',
    iconColor: '#E2E8F0', iconSize: 22,
  },
  speakers_advanced: {
    cameraTileEnabled: true, cameraAspectRatio: '1:1', cameraTileBorderRadius: 16,
    singleCameraFullWidth: true, spotlightEnabled: false, spotlightScale: 1.20,
    ownerScale: 1.0, micIconColor: '#10B981', micIconOffsetY: -2, mutedAvatarGrayscale: 0.0,
  },
  listeners_advanced: {
    maxVisibleSmallScreen: 10, maxVisibleDefault: 14,
    overflowBadgeText: '+{N} Seyirci', overflowBadgeColor: 'rgba(20,184,166,0.16)', overflowBadgeTextColor: '#5EEAD4',
    showHandRaiseBadge: true, handRaiseBadgePosition: 'topLeft', showMicRequestPulse: true,
  },
  name_advanced: {
    textShadowEnabled: true, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffsetY: 1, textShadowRadius: 2,
    strokeEnabled: false, strokeColor: 'rgba(0,0,0,0.5)', strokeWidth: 0.5,
    letterSpacing: 0.0, lineHeight: 1.2,
  },
};

export function mergeWithDefaults(raw: any): RoomLayoutConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_LAYOUT;
  const merged: any = {};
  for (const k of Object.keys(DEFAULT_LAYOUT) as (keyof RoomLayoutConfig)[]) {
    merged[k] = { ...(DEFAULT_LAYOUT as any)[k], ...(raw[k] || {}) };
  }
  return merged as RoomLayoutConfig;
}
