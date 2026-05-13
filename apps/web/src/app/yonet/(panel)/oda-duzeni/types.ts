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
  };
  controls: {
    barBackground: string; barBlurEnabled: boolean; barBlurIntensity: number; barBorderTop: string; barPaddingV: number;
    buttonSize: number; buttonGap: number; buttonShape: ButtonShape; buttonBorderRadius: number;
    micActiveColor: string; micMutedColor: string; leaveButtonColor: string;
    iconColor: string; iconSize: number;
  };
  speakers_advanced: {
    cameraTileEnabled: boolean; cameraAspectRatio: CameraAspect; cameraTileBorderRadius: number;
    singleCameraFullWidth: boolean; spotlightEnabled: boolean; spotlightScale: number;
    ownerScale: number; micIconColor: string; micIconOffsetY: number; mutedAvatarGrayscale: number;
  };
  listeners_advanced: {
    maxVisibleSmallScreen: number; maxVisibleDefault: number;
    overflowBadgeText: string; overflowBadgeColor: string; overflowBadgeTextColor: string;
    showHandRaiseBadge: boolean; handRaiseBadgePosition: CornerPosition; showMicRequestPulse: boolean;
  };
  name_advanced: {
    textShadowEnabled: boolean; textShadowColor: string; textShadowOffsetY: number; textShadowRadius: number;
    strokeEnabled: boolean; strokeColor: string; strokeWidth: number;
    letterSpacing: number; lineHeight: number;
  };
}
