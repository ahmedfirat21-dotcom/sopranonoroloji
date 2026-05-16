"use client";
import React from 'react';
import { Section, Slider, Toggle, ColorField, SelectField, TextField,
  SHAPE_OPTS, RING_STYLE_OPTS, NAME_POS_OPTS, BADGE_POS_OPTS, CORNER_OPTS, WEIGHT_OPTS,
  DIVIDER_OPTS, BG_TYPE_OPTS, ENTER_OPTS, CAMERA_OPTS, BTN_SHAPE_OPTS,
} from './controls';
import type { RoomLayoutConfig, AvatarShape, RingStyle, NamePosition, BadgePosition, CornerPosition,
  EnterTransition, CameraAspect, ButtonShape, StageDivider, GlobalBg } from './types';

type C = RoomLayoutConfig;

/* ═══════════════════════════════ HOST ═══════════════════════════════ */
export function HostPanel({ cfg, host_advanced, update, updateNameAdv, nameAdv }:
  { cfg: C['host']; host_advanced: C['shadows']; update: (p: Partial<C['host']>) => void;
    updateNameAdv: (p: Partial<C['name_advanced']>) => void; nameAdv: C['name_advanced'];
  }) {
  return (
    <div className="space-y-3">
      <Section title="Avatar Şekli & Boyut" hint="Host avatarının fiziksel görünümü" mobile="partial">
        <SelectField label="Şekil" value={cfg.avatarShape} options={SHAPE_OPTS} onChange={v => update({ avatarShape: v as AvatarShape })} />
        <Slider label="Boyut" min={60} max={180} step={2} value={cfg.avatarSize} onChange={v => update({ avatarSize: v })} display={`${cfg.avatarSize}dp`} />
        <Slider label="Köşe Yuvarlaması (rounded için)" min={0} max={90} step={1} value={cfg.borderRadius} onChange={v => update({ borderRadius: v })} display={`${cfg.borderRadius}dp`} />
        <Slider label="Konteyner İç Boşluğu" min={0} max={40} step={1} value={cfg.containerPadding} onChange={v => update({ containerPadding: v })} display={`${cfg.containerPadding}dp`} />
      </Section>

      <Section title="Halka (Border Ring)" hint="Avatar etrafında çevreleyen renkli çizgi" mobile="none">
        <Slider label="Kalınlık" min={0} max={14} step={1} value={cfg.ringWidth} onChange={v => update({ ringWidth: v })} display={`${cfg.ringWidth}dp`} />
        <ColorField label="Renk" value={cfg.ringColor} onChange={v => update({ ringColor: v })} />
        <SelectField label="Stil" value={cfg.ringStyle} options={RING_STYLE_OPTS} onChange={v => update({ ringStyle: v as RingStyle })} />
      </Section>

      <Section title="Halo (Arkaplan Glow)" hint="Skia ile render edilen renkli yumuşak ışıma" mobile="none">
        <Toggle label="Halo Aktif" checked={cfg.haloEnabled} onChange={v => update({ haloEnabled: v })} />
        <ColorField label="Halo Rengi" value={cfg.haloColor} onChange={v => update({ haloColor: v })} />
        <Slider label="Opaklık" min={0} max={1} step={0.05} value={cfg.haloOpacity} onChange={v => update({ haloOpacity: v })} display={`${(cfg.haloOpacity * 100).toFixed(0)}%`} />
        <Slider label="Bulanıklık (Blur)" min={0} max={60} step={1} value={cfg.haloBlur} onChange={v => update({ haloBlur: v })} display={`${cfg.haloBlur}px`} />
      </Section>

      <Section title="İsim Yazısı" mobile="none">
        <SelectField label="Konum" value={cfg.namePosition} options={NAME_POS_OPTS} onChange={v => update({ namePosition: v as NamePosition })} />
        <Slider label="Font Boyutu" min={8} max={28} step={1} value={cfg.nameFontSize} onChange={v => update({ nameFontSize: v })} display={`${cfg.nameFontSize}sp`} />
        <SelectField label="Kalınlık" value={cfg.nameFontWeight} options={WEIGHT_OPTS} onChange={v => update({ nameFontWeight: v })} />
        <ColorField label="Yazı Rengi" value={cfg.nameColor} onChange={v => update({ nameColor: v })} />
      </Section>

      <Section title="İsim Gelişmiş (Tüm Avatarlar)" hint="Gölge, stroke, harf aralığı — tüm avatar isimleri için" mobile="none">
        <Toggle label="Yazı Gölgesi" checked={nameAdv.textShadowEnabled} onChange={v => updateNameAdv({ textShadowEnabled: v })} />
        <ColorField label="Gölge Rengi" value={nameAdv.textShadowColor} onChange={v => updateNameAdv({ textShadowColor: v })} />
        <Slider label="Gölge Y Ofseti" min={0} max={6} step={1} value={nameAdv.textShadowOffsetY} onChange={v => updateNameAdv({ textShadowOffsetY: v })} display={`${nameAdv.textShadowOffsetY}px`} />
        <Slider label="Gölge Yumuşaklık" min={0} max={10} step={1} value={nameAdv.textShadowRadius} onChange={v => updateNameAdv({ textShadowRadius: v })} display={`${nameAdv.textShadowRadius}px`} />
        <Toggle label="Yazı Stroke (Çevre Çizgisi)" checked={nameAdv.strokeEnabled} onChange={v => updateNameAdv({ strokeEnabled: v })} />
        <ColorField label="Stroke Rengi" value={nameAdv.strokeColor} onChange={v => updateNameAdv({ strokeColor: v })} />
        <Slider label="Stroke Kalınlığı" min={0} max={3} step={0.1} value={nameAdv.strokeWidth} onChange={v => updateNameAdv({ strokeWidth: v })} display={`${nameAdv.strokeWidth.toFixed(1)}px`} />
        <Slider label="Harf Aralığı" min={-2} max={4} step={0.1} value={nameAdv.letterSpacing} onChange={v => updateNameAdv({ letterSpacing: v })} display={`${nameAdv.letterSpacing.toFixed(1)}`} />
        <Slider label="Satır Yüksekliği" min={1} max={2} step={0.05} value={nameAdv.lineHeight} onChange={v => updateNameAdv({ lineHeight: v })} display={`${nameAdv.lineHeight.toFixed(2)}`} />
      </Section>

      <Section title="Rozet (Tier / Verified)" mobile="none">
        <SelectField label="Rozet Konumu" value={cfg.badgePosition} options={BADGE_POS_OPTS} onChange={v => update({ badgePosition: v as BadgePosition })} />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════ SPEAKERS ═══════════════════════════════ */
export function SpeakersPanel({ cfg, adv, updateCfg, updateAdv }:
  { cfg: C['speakers']; adv: C['speakers_advanced']; updateCfg: (p: Partial<C['speakers']>) => void; updateAdv: (p: Partial<C['speakers_advanced']>) => void }) {
  return (
    <div className="space-y-3">
      <Section title="Avatar Şekli" mobile="ok">
        <SelectField label="Şekil" value={cfg.avatarShape} options={SHAPE_OPTS} onChange={v => updateCfg({ avatarShape: v as AvatarShape })} />
        <Slider label="Köşe Yuvarlaması" min={0} max={60} step={1} value={cfg.borderRadius} onChange={v => updateCfg({ borderRadius: v })} display={`${cfg.borderRadius}dp`} />
      </Section>

      <Section title="Grid Düzeni" mobile="none">
        <Slider label="Maksimum Sütun" min={2} max={6} step={1} value={cfg.maxCols} onChange={v => updateCfg({ maxCols: v })} display={`${cfg.maxCols}`} />
        <Slider label="Yatay Boşluk" min={4} max={32} step={1} value={cfg.colGap} onChange={v => updateCfg({ colGap: v })} display={`${cfg.colGap}dp`} />
        <Slider label="Dikey Boşluk" min={4} max={32} step={1} value={cfg.rowGap} onChange={v => updateCfg({ rowGap: v })} display={`${cfg.rowGap}dp`} />
      </Section>

      <Section title="Boyut Şablonları" hint="Kişi sayısına göre otomatik seçilir" mobile="none">
        <Slider label="Büyük (1-3 kişi)" min={70} max={180} step={2} value={cfg.sizePresets.large} onChange={v => updateCfg({ sizePresets: { ...cfg.sizePresets, large: v } })} display={`${cfg.sizePresets.large}dp`} />
        <Slider label="Orta (4-9 kişi)" min={60} max={160} step={2} value={cfg.sizePresets.medium} onChange={v => updateCfg({ sizePresets: { ...cfg.sizePresets, medium: v } })} display={`${cfg.sizePresets.medium}dp`} />
        <Slider label="Küçük (10+ kişi)" min={50} max={140} step={2} value={cfg.sizePresets.small} onChange={v => updateCfg({ sizePresets: { ...cfg.sizePresets, small: v } })} display={`${cfg.sizePresets.small}dp`} />
      </Section>

      <Section title="Halka" mobile="none">
        <Slider label="Kalınlık" min={0} max={8} step={1} value={cfg.ringWidth} onChange={v => updateCfg({ ringWidth: v })} display={`${cfg.ringWidth}dp`} />
        <ColorField label="Halka Rengi" value={cfg.ringColor} onChange={v => updateCfg({ ringColor: v })} />
        <ColorField label="Konuşurken Halka Rengi" value={cfg.speakingRingColor} onChange={v => updateCfg({ speakingRingColor: v })} />
      </Section>

      <Section title="İsim & Mikrofon" mobile="none">
        <SelectField label="İsim Konumu" value={cfg.namePosition} options={NAME_POS_OPTS} onChange={v => updateCfg({ namePosition: v as NamePosition })} />
        <Slider label="Font Boyutu" min={8} max={22} step={1} value={cfg.nameFontSize} onChange={v => updateCfg({ nameFontSize: v })} display={`${cfg.nameFontSize}sp`} />
        <Slider label="Maks Karakter" min={4} max={24} step={1} value={cfg.nameMaxChars} onChange={v => updateCfg({ nameMaxChars: v })} display={`${cfg.nameMaxChars} hf`} />
        <Toggle label="Mikrofon İkonu Göster" checked={cfg.showMicIcon} onChange={v => updateCfg({ showMicIcon: v })} />
        <Slider label="Susturulduğunda Opaklık" min={0.2} max={1} step={0.05} value={cfg.muteOpacity} onChange={v => updateCfg({ muteOpacity: v })} display={`${(cfg.muteOpacity * 100).toFixed(0)}%`} />
      </Section>

      <Section title="Kamera Tile (Gelişmiş)" hint="Kamera açan konuşmacı için ayrı tile davranışı" mobile="none">
        <Toggle label="Kamera Tile Aktif" checked={adv.cameraTileEnabled} onChange={v => updateAdv({ cameraTileEnabled: v })} />
        <SelectField label="Kamera Aspect Oranı" value={adv.cameraAspectRatio} options={CAMERA_OPTS} onChange={v => updateAdv({ cameraAspectRatio: v as CameraAspect })} />
        <Slider label="Kamera Köşe Yuvarlaması" min={0} max={40} step={1} value={adv.cameraTileBorderRadius} onChange={v => updateAdv({ cameraTileBorderRadius: v })} display={`${adv.cameraTileBorderRadius}dp`} />
        <Toggle label="Tek Kamera Tam Genişlik" checked={adv.singleCameraFullWidth} onChange={v => updateAdv({ singleCameraFullWidth: v })} />
        <Toggle label="Spotlight (Owner Büyütme)" checked={adv.spotlightEnabled} onChange={v => updateAdv({ spotlightEnabled: v })} />
        <Slider label="Spotlight Ölçeği" min={1} max={1.5} step={0.05} value={adv.spotlightScale} onChange={v => updateAdv({ spotlightScale: v })} display={`${adv.spotlightScale.toFixed(2)}x`} />
        <Slider label="Owner Avatar Ölçeği" min={1} max={1.3} step={0.05} value={adv.ownerScale} onChange={v => updateAdv({ ownerScale: v })} display={`${adv.ownerScale.toFixed(2)}x`} />
        <ColorField label="Mikrofon İkonu Rengi" value={adv.micIconColor} onChange={v => updateAdv({ micIconColor: v })} />
        <Slider label="Susturulduğunda Griye Düşürme" min={0} max={1} step={0.05} value={adv.mutedAvatarGrayscale} onChange={v => updateAdv({ mutedAvatarGrayscale: v })} display={`${(adv.mutedAvatarGrayscale * 100).toFixed(0)}%`} />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════ LISTENERS ═══════════════════════════════ */
export function ListenersPanel({ cfg, adv, updateCfg, updateAdv }:
  { cfg: C['listeners']; adv: C['listeners_advanced']; updateCfg: (p: Partial<C['listeners']>) => void; updateAdv: (p: Partial<C['listeners_advanced']>) => void }) {
  return (
    <div className="space-y-3">
      <Section title="Avatar Şekli" mobile="ok">
        <SelectField label="Şekil" value={cfg.avatarShape} options={SHAPE_OPTS} onChange={v => updateCfg({ avatarShape: v as AvatarShape })} />
        <Slider label="Köşe Yuvarlaması" min={0} max={50} step={1} value={cfg.borderRadius} onChange={v => updateCfg({ borderRadius: v })} display={`${cfg.borderRadius}dp`} />
      </Section>

      <Section title="Grid Düzeni" mobile="none">
        <Slider label="Maksimum Sütun" min={4} max={10} step={1} value={cfg.maxCols} onChange={v => updateCfg({ maxCols: v })} display={`${cfg.maxCols}`} />
        <Slider label="Yatay Boşluk" min={2} max={20} step={1} value={cfg.colGap} onChange={v => updateCfg({ colGap: v })} display={`${cfg.colGap}dp`} />
        <Slider label="Dikey Boşluk" min={2} max={20} step={1} value={cfg.rowGap} onChange={v => updateCfg({ rowGap: v })} display={`${cfg.rowGap}dp`} />
      </Section>

      <Section title="Boyut Şablonları" hint="Dinleyici sayısı arttıkça küçülür" mobile="none">
        <Slider label="Büyük (1-4)" min={40} max={90} step={1} value={cfg.sizePresets.large} onChange={v => updateCfg({ sizePresets: { ...cfg.sizePresets, large: v } })} display={`${cfg.sizePresets.large}dp`} />
        <Slider label="Orta (5-8)" min={36} max={80} step={1} value={cfg.sizePresets.medium} onChange={v => updateCfg({ sizePresets: { ...cfg.sizePresets, medium: v } })} display={`${cfg.sizePresets.medium}dp`} />
        <Slider label="Küçük (9+)" min={28} max={70} step={1} value={cfg.sizePresets.small} onChange={v => updateCfg({ sizePresets: { ...cfg.sizePresets, small: v } })} display={`${cfg.sizePresets.small}dp`} />
      </Section>

      <Section title="İsim" mobile="partial">
        <Toggle label="İsim Göster" checked={cfg.showName} onChange={v => updateCfg({ showName: v })} />
        <Slider label="Font Boyutu" min={6} max={16} step={1} value={cfg.nameFontSize} onChange={v => updateCfg({ nameFontSize: v })} display={`${cfg.nameFontSize}sp`} />
        <Slider label="Maks Karakter" min={3} max={16} step={1} value={cfg.nameMaxChars} onChange={v => updateCfg({ nameMaxChars: v })} display={`${cfg.nameMaxChars} hf`} />
      </Section>

      <Section title="Halka" mobile="ok">
        <Slider label="Kalınlık" min={0} max={4} step={1} value={cfg.ringWidth} onChange={v => updateCfg({ ringWidth: v })} display={`${cfg.ringWidth}dp`} />
        <ColorField label="Halka Rengi" value={cfg.ringColor} onChange={v => updateCfg({ ringColor: v })} />
      </Section>

      <Section title="Oda Sahibi (Owner) Vurgusu" mobile="partial">
        <Toggle label="Taç Göster" checked={cfg.ownerCrownEnabled} onChange={v => updateCfg({ ownerCrownEnabled: v })} />
        <Slider label="Avatar Ölçeği" min={1} max={1.5} step={0.05} value={cfg.ownerScale} onChange={v => updateCfg({ ownerScale: v })} display={`${cfg.ownerScale.toFixed(2)}x`} />
      </Section>

      <Section title="Overflow & El Kaldırma (Gelişmiş)" mobile="none">
        <Slider label="Maks Görünür (Küçük Ekran)" min={6} max={16} step={1} value={adv.maxVisibleSmallScreen} onChange={v => updateAdv({ maxVisibleSmallScreen: v })} display={`${adv.maxVisibleSmallScreen}`} />
        <Slider label="Maks Görünür (Normal)" min={8} max={24} step={1} value={adv.maxVisibleDefault} onChange={v => updateAdv({ maxVisibleDefault: v })} display={`${adv.maxVisibleDefault}`} />
        <TextField label="Overflow Badge Metni" value={adv.overflowBadgeText} onChange={v => updateAdv({ overflowBadgeText: v })} placeholder="+{N} Seyirci" />
        <ColorField label="Overflow Badge Arka Plan" value={adv.overflowBadgeColor} onChange={v => updateAdv({ overflowBadgeColor: v })} />
        <ColorField label="Overflow Badge Yazı" value={adv.overflowBadgeTextColor} onChange={v => updateAdv({ overflowBadgeTextColor: v })} />
        <Toggle label="El Kaldırma Rozeti" checked={adv.showHandRaiseBadge} onChange={v => updateAdv({ showHandRaiseBadge: v })} />
        <SelectField label="El Kaldırma Rozet Konumu" value={adv.handRaiseBadgePosition} options={CORNER_OPTS} onChange={v => updateAdv({ handRaiseBadgePosition: v as CornerPosition })} />
        <Toggle label="Mikrofon İsteği Pulse" checked={adv.showMicRequestPulse} onChange={v => updateAdv({ showMicRequestPulse: v })} />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════ STAGE + GLOBAL ═══════════════════════════════ */
export function StageGlobalPanel({ stage, global, header, controls,
  updateStage, updateGlobal, updateHeader, updateControls }:
  { stage: C['stage']; global: C['global']; header: C['header']; controls: C['controls'];
    updateStage: (p: Partial<C['stage']>) => void; updateGlobal: (p: Partial<C['global']>) => void;
    updateHeader: (p: Partial<C['header']>) => void; updateControls: (p: Partial<C['controls']>) => void;
  }) {
  return (
    <div className="space-y-3">
      <Section title="Sahne Konteyneri" mobile="none">
        <ColorField label="Arka Plan Rengi" value={stage.backgroundColor} onChange={v => updateStage({ backgroundColor: v })} />
        <Slider label="Köşe Yuvarlaması" min={0} max={48} step={1} value={stage.borderRadius} onChange={v => updateStage({ borderRadius: v })} display={`${stage.borderRadius}dp`} />
        <Slider label="İç Boşluk (Padding)" min={0} max={48} step={1} value={stage.padding} onChange={v => updateStage({ padding: v })} display={`${stage.padding}dp`} />
        <Slider label="Konuşmacı - Dinleyici Boşluğu" min={4} max={80} step={1} value={stage.gapBetweenSpeakersAndListeners} onChange={v => updateStage({ gapBetweenSpeakersAndListeners: v })} display={`${stage.gapBetweenSpeakersAndListeners}dp`} />
      </Section>

      <Section title="Ayraç" mobile="none">
        <SelectField label="Stil" value={stage.dividerStyle} options={DIVIDER_OPTS} onChange={v => updateStage({ dividerStyle: v as StageDivider })} />
        <ColorField label="Ayraç Rengi" value={stage.dividerColor} onChange={v => updateStage({ dividerColor: v })} />
      </Section>

      <Section title="Genel Arka Plan" mobile="none">
        <SelectField label="Tip" value={global.background} options={BG_TYPE_OPTS} onChange={v => updateGlobal({ background: v as GlobalBg })} />
        {global.background === 'solid' && <ColorField label="Düz Renk" value={global.bgColor} onChange={v => updateGlobal({ bgColor: v })} />}
        {global.background === 'gradient' && (<>
          <ColorField label="Gradient Üst" value={global.bgGradient[0] || '#0F1926'} onChange={v => updateGlobal({ bgGradient: [v, global.bgGradient[1] || '#0A0F1A'] })} />
          <ColorField label="Gradient Alt" value={global.bgGradient[1] || '#0A0F1A'} onChange={v => updateGlobal({ bgGradient: [global.bgGradient[0] || '#0F1926', v] })} />
        </>)}
        {global.background === 'image' && (
          <TextField label="Görsel URL" value={global.bgImageUrl || ''} onChange={v => updateGlobal({ bgImageUrl: v || null })} placeholder="https://..." mono />
        )}
      </Section>

      <Section title="Ekran Kenar Boşlukları (Safe Area)" mobile="partial">
        <Slider label="Üst" min={0} max={80} step={1} value={global.safePaddingTop} onChange={v => updateGlobal({ safePaddingTop: v })} display={`${global.safePaddingTop}dp`} />
        <Slider label="Alt" min={0} max={80} step={1} value={global.safePaddingBottom} onChange={v => updateGlobal({ safePaddingBottom: v })} display={`${global.safePaddingBottom}dp`} />
        <Slider label="Yatay" min={0} max={40} step={1} value={global.horizontalPadding} onChange={v => updateGlobal({ horizontalPadding: v })} display={`${global.horizontalPadding}dp`} />
      </Section>

      <Section title="Oda Başlığı (Header)" mobile="partial">
        <Slider label="Başlık Font" min={12} max={28} step={1} value={header.titleFontSize} onChange={v => updateHeader({ titleFontSize: v })} display={`${header.titleFontSize}sp`} />
        <SelectField label="Başlık Kalınlık" value={header.titleFontWeight} options={WEIGHT_OPTS} onChange={v => updateHeader({ titleFontWeight: v })} />
        <ColorField label="Başlık Rengi" value={header.titleColor} onChange={v => updateHeader({ titleColor: v })} />
        <Slider label="Alt Yazı Font" min={8} max={18} step={1} value={header.subtitleFontSize} onChange={v => updateHeader({ subtitleFontSize: v })} display={`${header.subtitleFontSize}sp`} />
        <ColorField label="Alt Yazı Rengi" value={header.subtitleColor} onChange={v => updateHeader({ subtitleColor: v })} />
        <Toggle label="CANLI Göstergesi" checked={header.showLiveIndicator} onChange={v => updateHeader({ showLiveIndicator: v })} />
        <ColorField label="CANLI Nokta Rengi" value={header.liveDotColor} onChange={v => updateHeader({ liveDotColor: v })} />
        <Toggle label="CANLI Nokta Pulse" checked={header.liveDotPulse} onChange={v => updateHeader({ liveDotPulse: v })} />
        <Toggle label="Dinleyici Sayısı" checked={header.showListenerCount} onChange={v => updateHeader({ showListenerCount: v })} />
        <Slider label="Header Arka Plan Opaklık" min={0} max={1} step={0.05} value={header.headerBgOpacity} onChange={v => updateHeader({ headerBgOpacity: v })} display={`${(header.headerBgOpacity * 100).toFixed(0)}%`} />
        <Toggle label="Alt Çizgi" checked={header.headerBorderBottom} onChange={v => updateHeader({ headerBorderBottom: v })} />
        <ColorField label="Alt Çizgi Rengi" value={header.headerBorderColor} onChange={v => updateHeader({ headerBorderColor: v })} />
      </Section>

      <Section title="Alt Kontrol Barı" mobile="partial">
        <ColorField label="Bar Arka Plan" value={controls.barBackground} onChange={v => updateControls({ barBackground: v })} />
        <Toggle label="Bar Blur" checked={controls.barBlurEnabled} onChange={v => updateControls({ barBlurEnabled: v })} />
        <Slider label="Bar Blur Yoğunluk" min={0} max={60} step={1} value={controls.barBlurIntensity} onChange={v => updateControls({ barBlurIntensity: v })} display={`${controls.barBlurIntensity}`} />
        <ColorField label="Bar Üst Çizgi" value={controls.barBorderTop} onChange={v => updateControls({ barBorderTop: v })} />
        <Slider label="Bar Dikey Padding" min={4} max={24} step={1} value={controls.barPaddingV} onChange={v => updateControls({ barPaddingV: v })} display={`${controls.barPaddingV}dp`} />
        <Slider label="Buton Boyutu" min={32} max={64} step={1} value={controls.buttonSize} onChange={v => updateControls({ buttonSize: v })} display={`${controls.buttonSize}dp`} />
        <Slider label="Buton Arası Boşluk" min={4} max={32} step={1} value={controls.buttonGap} onChange={v => updateControls({ buttonGap: v })} display={`${controls.buttonGap}dp`} />
        <SelectField label="Buton Şekli" value={controls.buttonShape} options={BTN_SHAPE_OPTS} onChange={v => updateControls({ buttonShape: v as ButtonShape })} />
        <Slider label="Buton Köşe (Rounded için)" min={0} max={20} step={1} value={controls.buttonBorderRadius} onChange={v => updateControls({ buttonBorderRadius: v })} display={`${controls.buttonBorderRadius}dp`} />
        <ColorField label="Mikrofon Aktif Renk" value={controls.micActiveColor} onChange={v => updateControls({ micActiveColor: v })} />
        <ColorField label="Mikrofon Sustur Renk" value={controls.micMutedColor} onChange={v => updateControls({ micMutedColor: v })} />
        <ColorField label="Ayrıl Buton Rengi" value={controls.leaveButtonColor} onChange={v => updateControls({ leaveButtonColor: v })} />
        <ColorField label="İkon Rengi" value={controls.iconColor} onChange={v => updateControls({ iconColor: v })} />
        <Slider label="İkon Boyutu" min={14} max={30} step={1} value={controls.iconSize} onChange={v => updateControls({ iconSize: v })} display={`${controls.iconSize}dp`} />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════ ANIMATIONS + SHADOWS ═══════════════════════════════ */
export function EffectsPanel({ anims, shadows, updateAnims, updateShadows }:
  { anims: C['animations']; shadows: C['shadows'];
    updateAnims: (p: Partial<C['animations']>) => void; updateShadows: (p: Partial<C['shadows']>) => void }) {
  return (
    <div className="space-y-3">
      <Section title="Konuşma Animasyonu" hint="Birisi konuştuğunda avatar etrafındaki dalgalanma" mobile="none">
        <Toggle label="Konuşma Pulse Aktif" checked={anims.speakingPulseEnabled} onChange={v => updateAnims({ speakingPulseEnabled: v })} />
        <Slider label="Pulse Hızı" min={400} max={3000} step={100} value={anims.speakingPulseSpeed} onChange={v => updateAnims({ speakingPulseSpeed: v })} display={`${anims.speakingPulseSpeed}ms`} />
        <Slider label="Halka Genişleme" min={1} max={2} step={0.05} value={anims.speakingRingExpand} onChange={v => updateAnims({ speakingRingExpand: v })} display={`${anims.speakingRingExpand.toFixed(2)}x`} />
      </Section>

      <Section title="Halo Pulse" hint="Host halo'sunun nefes alma efekti" mobile="none">
        <Toggle label="Halo Pulse Aktif" checked={anims.haloPulseEnabled} onChange={v => updateAnims({ haloPulseEnabled: v })} />
        <Slider label="Halo Pulse Hızı" min={500} max={5000} step={100} value={anims.haloPulseSpeed} onChange={v => updateAnims({ haloPulseSpeed: v })} display={`${anims.haloPulseSpeed}ms`} />
        <Slider label="Pulse Genlik" min={0.05} max={0.5} step={0.05} value={anims.haloPulseAmplitude} onChange={v => updateAnims({ haloPulseAmplitude: v })} display={`${(anims.haloPulseAmplitude * 100).toFixed(0)}%`} />
      </Section>

      <Section title="Etkileşim & Geçiş" mobile="none">
        <Slider label="Tıklama Scale Feedback" min={0.85} max={1} step={0.01} value={anims.avatarTapScale} onChange={v => updateAnims({ avatarTapScale: v })} display={`${anims.avatarTapScale.toFixed(2)}x`} />
        <SelectField label="Giriş Geçişi" value={anims.enterTransition} options={ENTER_OPTS} onChange={v => updateAnims({ enterTransition: v as EnterTransition })} />
        <Slider label="Geçiş Süresi" min={100} max={1500} step={50} value={anims.enterDurationMs} onChange={v => updateAnims({ enterDurationMs: v })} display={`${anims.enterDurationMs}ms`} />
        <Toggle label="Hareket Azaltma (Reduce Motion)" checked={anims.reduceMotion} onChange={v => updateAnims({ reduceMotion: v })} />
      </Section>

      <Section title="Gölgeler (Skia Render)" hint="Cross-platform yumuşak renkli gölge — Android'de de görünür" mobile="none">
        <ColorField label="Host Gölge Rengi" value={shadows.hostShadowColor} onChange={v => updateShadows({ hostShadowColor: v })} />
        <Slider label="Host Gölge Blur" min={0} max={48} step={1} value={shadows.hostShadowBlur} onChange={v => updateShadows({ hostShadowBlur: v })} display={`${shadows.hostShadowBlur}px`} />
        <Slider label="Host Gölge Opaklık" min={0} max={1} step={0.05} value={shadows.hostShadowOpacity} onChange={v => updateShadows({ hostShadowOpacity: v })} display={`${(shadows.hostShadowOpacity * 100).toFixed(0)}%`} />
        <Toggle label="Konuşmacı Gölgesi Aktif" checked={shadows.speakerShadowEnabled} onChange={v => updateShadows({ speakerShadowEnabled: v })} />
        <ColorField label="Konuşmacı Gölge Rengi" value={shadows.speakerShadowColor} onChange={v => updateShadows({ speakerShadowColor: v })} />
        <Slider label="Konuşmacı Gölge Blur" min={0} max={32} step={1} value={shadows.speakerShadowBlur} onChange={v => updateShadows({ speakerShadowBlur: v })} display={`${shadows.speakerShadowBlur}px`} />
        <Slider label="Konuşmacı Gölge Opaklık" min={0} max={1} step={0.05} value={shadows.speakerShadowOpacity} onChange={v => updateShadows({ speakerShadowOpacity: v })} display={`${(shadows.speakerShadowOpacity * 100).toFixed(0)}%`} />
        <Toggle label="Dinleyici Gölgesi Aktif" checked={shadows.listenerShadowEnabled} onChange={v => updateShadows({ listenerShadowEnabled: v })} />
        <ColorField label="Dinleyici Gölge Rengi" value={shadows.listenerShadowColor} onChange={v => updateShadows({ listenerShadowColor: v })} />
        <Slider label="Dinleyici Gölge Blur" min={0} max={20} step={1} value={shadows.listenerShadowBlur} onChange={v => updateShadows({ listenerShadowBlur: v })} display={`${shadows.listenerShadowBlur}px`} />
        <Slider label="Dinleyici Gölge Opaklık" min={0} max={1} step={0.05} value={shadows.listenerShadowOpacity} onChange={v => updateShadows({ listenerShadowOpacity: v })} display={`${(shadows.listenerShadowOpacity * 100).toFixed(0)}%`} />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════ ACCENTS + INDICATORS ═══════════════════════════════ */
export function AccentsIndicatorsPanel({ accents, indicators, updateAccents, updateIndicators }:
  { accents: C['accents']; indicators: C['indicators'];
    updateAccents: (p: Partial<C['accents']>) => void; updateIndicators: (p: Partial<C['indicators']>) => void }) {
  return (
    <div className="space-y-3">
      <Section title="Owner & Moderatör Vurgusu" mobile="partial">
        <ColorField label="Owner Vurgu Rengi" value={accents.ownerHighlight} onChange={v => updateAccents({ ownerHighlight: v })} />
        <Slider label="Owner Halka Kalınlığı" min={0} max={8} step={1} value={accents.ownerRingWidth} onChange={v => updateAccents({ ownerRingWidth: v })} display={`${accents.ownerRingWidth}dp`} />
        <Toggle label="Owner Halo Aktif" checked={accents.ownerHaloEnabled} onChange={v => updateAccents({ ownerHaloEnabled: v })} />
        <ColorField label="Moderatör Vurgu Rengi" value={accents.moderatorHighlight} onChange={v => updateAccents({ moderatorHighlight: v })} />
        <Slider label="Moderatör Halka Kalınlığı" min={0} max={6} step={1} value={accents.moderatorRingWidth} onChange={v => updateAccents({ moderatorRingWidth: v })} display={`${accents.moderatorRingWidth}dp`} />
      </Section>

      <Section title="El Kaldırma & Yeni Katılım" mobile="none">
        <Toggle label="El Kaldırma Aktif" checked={accents.handRaiseEnabled} onChange={v => updateAccents({ handRaiseEnabled: v })} />
        <ColorField label="El Kaldırma Rengi" value={accents.handRaiseColor} onChange={v => updateAccents({ handRaiseColor: v })} />
        <ColorField label="Yeni Katılım Vurgu" value={accents.newJoinHighlight} onChange={v => updateAccents({ newJoinHighlight: v })} />
        <Slider label="Yeni Katılım Süresi" min={1000} max={10000} step={500} value={accents.newJoinDurationMs} onChange={v => updateAccents({ newJoinDurationMs: v })} display={`${accents.newJoinDurationMs}ms`} />
        <ColorField label="Seçili Vurgu Rengi" value={accents.selectedHighlight} onChange={v => updateAccents({ selectedHighlight: v })} />
      </Section>

      <Section title="Online Noktası" mobile="none">
        <Toggle label="Online Noktası Göster" checked={indicators.onlineDotEnabled} onChange={v => updateIndicators({ onlineDotEnabled: v })} />
        <ColorField label="Renk" value={indicators.onlineDotColor} onChange={v => updateIndicators({ onlineDotColor: v })} />
        <Slider label="Boyut" min={4} max={16} step={1} value={indicators.onlineDotSize} onChange={v => updateIndicators({ onlineDotSize: v })} display={`${indicators.onlineDotSize}dp`} />
        <SelectField label="Konum" value={indicators.onlineDotPosition} options={CORNER_OPTS} onChange={v => updateIndicators({ onlineDotPosition: v as CornerPosition })} />
      </Section>

      <Section title="Susturma Göstergesi" mobile="none">
        <Toggle label="Sustur İkonu Göster" checked={indicators.muteIndicatorEnabled} onChange={v => updateIndicators({ muteIndicatorEnabled: v })} />
        <ColorField label="Renk" value={indicators.muteIndicatorColor} onChange={v => updateIndicators({ muteIndicatorColor: v })} />
        <Slider label="Boyut" min={12} max={28} step={1} value={indicators.muteIndicatorSize} onChange={v => updateIndicators({ muteIndicatorSize: v })} display={`${indicators.muteIndicatorSize}dp`} />
        <SelectField label="Konum" value={indicators.muteIndicatorPosition} options={CORNER_OPTS} onChange={v => updateIndicators({ muteIndicatorPosition: v as CornerPosition })} />
      </Section>

      <Section title="Diğer Göstergeler" mobile="none">
        <Toggle label="Kamera Göstergesi" checked={indicators.cameraIndicatorEnabled} onChange={v => updateIndicators({ cameraIndicatorEnabled: v })} />
        <ColorField label="Kamera Renk" value={indicators.cameraIndicatorColor} onChange={v => updateIndicators({ cameraIndicatorColor: v })} />
        <Toggle label="Doğrulama Tiki" checked={indicators.verifiedTickEnabled} onChange={v => updateIndicators({ verifiedTickEnabled: v })} />
        <ColorField label="Doğrulama Tiki Rengi" value={indicators.verifiedTickColor} onChange={v => updateIndicators({ verifiedTickColor: v })} />
      </Section>
    </div>
  );
}
