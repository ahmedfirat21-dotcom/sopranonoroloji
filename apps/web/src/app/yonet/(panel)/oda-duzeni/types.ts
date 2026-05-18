// Mobile services/roomLayoutConfig.ts ile birebir senkron — v116
export type AvatarShape = 'circle' | 'square' | 'rounded' | 'hex';
export type RingStyle = 'solid' | 'dashed' | 'dotted' | 'none';
export type NamePosition = 'below' | 'above' | 'inside' | 'hidden';
export type BadgePosition = 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft' | 'hidden';
export type StageDivider = 'none' | 'line' | 'gradient';
export type GlobalBg = 'solid' | 'gradient' | 'image' | 'none';
export type CornerPosition = 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
export type EnterTransition = 'fade' | 'slide' | 'bounce' | 'none';
export type CameraAspect = '1:1' | '16:9' | '4:3';
export type ButtonShape = 'circle' | 'rounded';

export interface RoomLayoutConfig {
  host: {
    avatarShape: AvatarShape; avatarSize: number; borderRadius: number;
    ringWidth: number; ringColor: string; ringStyle: RingStyle;
    namePosition: NamePosition; nameFontSize: number; nameFontWeight: string; nameColor: string;
    badgePosition: BadgePosition;
    haloEnabled: boolean; haloColor: string; haloOpacity: number; haloBlur: number;
    containerPadding: number;
  };
  speakers: {
    avatarShape: AvatarShape; borderRadius: number;
    maxCols: number; colGap: number; rowGap: number;
    ringWidth: number; ringColor: string; speakingRingColor: string;
    namePosition: NamePosition; nameFontSize: number; nameMaxChars: number;
    showMicIcon: boolean; muteOpacity: number;
    sizePresets: { small: number; medium: number; large: number };
  };
  listeners: {
    avatarShape: AvatarShape; borderRadius: number;
    maxCols: number; colGap: number; rowGap: number;
    showName: boolean; nameFontSize: number; nameMaxChars: number;
    ringWidth: number; ringColor: string;
    ownerCrownEnabled: boolean; ownerScale: number;
    sizePresets: { small: number; medium: number; large: number };
  };
  stage: {
    backgroundColor: string; borderRadius: number; padding: number;
    dividerStyle: StageDivider; dividerColor: string;
    gapBetweenSpeakersAndListeners: number;
  };
  global: {
    background: GlobalBg; bgColor: string; bgGradient: string[]; bgImageUrl: string | null;
    safePaddingTop: number; safePaddingBottom: number; horizontalPadding: number;
  };
  animations: {
    speakingPulseEnabled: boolean; speakingPulseSpeed: number; speakingRingExpand: number;
    haloPulseEnabled: boolean; haloPulseSpeed: number; haloPulseAmplitude: number;
    avatarTapScale: number; enterTransition: EnterTransition; enterDurationMs: number;
    reduceMotion: boolean;
  };
  accents: {
    ownerHighlight: string; ownerRingWidth: number; ownerHaloEnabled: boolean;
    moderatorHighlight: string; moderatorRingWidth: number;
    handRaiseColor: string; handRaiseEnabled: boolean;
    newJoinHighlight: string; newJoinDurationMs: number;
    selectedHighlight: string;
  };
  indicators: {
    onlineDotEnabled: boolean; onlineDotColor: string; onlineDotSize: number; onlineDotPosition: CornerPosition;
    muteIndicatorEnabled: boolean; muteIndicatorColor: string; muteIndicatorSize: number; muteIndicatorPosition: CornerPosition;
    cameraIndicatorEnabled: boolean; cameraIndicatorColor: string;
    verifiedTickEnabled: boolean; verifiedTickColor: string;
  };
  shadows: {
    hostShadowColor: string; hostShadowBlur: number; hostShadowOpacity: number;
    speakerShadowColor: string; speakerShadowBlur: number; speakerShadowOpacity: number; speakerShadowEnabled: boolean;
    listenerShadowEnabled: boolean; listenerShadowColor: string; listenerShadowBlur: number; listenerShadowOpacity: number;
  };
  header: {
    titleFontSize: number; titleFontWeight: string; titleColor: string;
    subtitleFontSize: number; subtitleColor: string;
    showLiveIndicator: boolean; liveDotColor: string; liveDotPulse: boolean;
    showListenerCount: boolean;
    headerBgOpacity: number; headerBorderBottom: boolean; headerBorderColor: string;
    // ★ v300 (17 May 2026): Host avatar görsel ayarları — APK ile birebir senkron.
    showHostAvatar: boolean;
    hostAvatarSize: number;
    hostAvatarBorderWidth: number;
    hostAvatarBorderColor: string;
    // ★ v1.7.13.13 (19 May 2026): Üst başlık konum offset — APK ile birebir.
    offsetY?: number; offsetX?: number;
  };
  controls: {
    barBackground: string; barBlurEnabled: boolean; barBlurIntensity: number; barBorderTop: string; barPaddingV: number;
    buttonSize: number; buttonGap: number; buttonShape: ButtonShape; buttonBorderRadius: number;
    micActiveColor: string; micMutedColor: string; leaveButtonColor: string;
    iconColor: string; iconSize: number;
    // ★ v1.7.13.13 (19 May 2026): Alt kontrol barı konum offset — APK ile birebir.
    offsetY?: number; offsetX?: number;
  };
  // ★ v289 (16 May 2026): speakers_advanced + name_advanced KALDIRILDI (19 alan,
  //   admin UI yok, mobile usage yok). Geriye uyum için mergeWithDefaults yeni
  //   şemada eski alanları görmezden gelir.
  listeners_advanced: {
    maxVisibleSmallScreen: number; maxVisibleDefault: number;
    overflowBadgeText: string; overflowBadgeColor: string; overflowBadgeTextColor: string;
    showHandRaiseBadge: boolean; handRaiseBadgePosition: CornerPosition; showMicRequestPulse: boolean;
  };
  /* ★ v301 (18 May 2026): Kamera config — mobile services/roomLayoutConfig.ts ile birebir senkron.
   * SpeakerSection.tsx + CameraFullscreenModal.tsx içindeki HARDCODED değerler buradan okunur. */
  camera: {
    heightRatio: number;          // height/width — 1.0 kare, 1.18 dikey-hafif (eski +18 davranışı)
    cornerRadiusPercent: number;  // 0-30, eski hardcode 8
    cornerRadiusMin: number;      // dp, eski hardcode 12
    objectFit: 'cover' | 'contain';
    mirrorSelf: boolean;
    indicatorEnabled: boolean;
    indicatorColor: string;
    indicatorPosition: CornerPosition;
    indicatorSize: number;
    useCustomBorder: boolean;
    borderWidth: number;
    borderColor: string;
    overlayTopOpacity: number;
    overlayBottomOpacity: number;
    spotlightEnabled: boolean;
    spotlightSingleAspect: number;
    spotlightDoubleAspect: number;
    spotlightTripleAspect: number;
    spotlightQuadAspect: number;
    spotlightGap: number;
    fullscreenObjectFit: 'cover' | 'contain';
    maxConcurrentCameras: number; // 0 = sınırsız
  };
}
