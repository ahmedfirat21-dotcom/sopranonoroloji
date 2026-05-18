"use client";
import React from 'react';
import { Section, Slider, Toggle, ColorField, SelectField, TextField,
  SHAPE_OPTS, WEIGHT_OPTS,
} from './controls';
import type { RoomLayoutConfig, AvatarShape, CornerPosition } from './types';

// ★ v301 (18 May 2026): CORNER_OPTS bu dosyada 156. satırda EffectsPanel için
//   zaten import ediliyor; tek bir kez tanımlanmalı. CameraPanel daha aşağıda
//   (CORNER_OPTS scope'una giriyor). Çift import = "defined multiple times" hatası.

// ★ v301 (18 May 2026): Kamera tile aspect ratio preset'leri.
//   heightRatio = height / width — 1.0 kare, >1 dikey, <1 yatay.
const CAMERA_ASPECT_OPTS = [
  { value: '1.0', label: 'Kare (1:1)' },
  { value: '1.18', label: 'Hafif Dikey (eski +18 davranışı)' },
  { value: '1.25', label: 'Dikey 4:5 (TikTok)' },
  { value: '1.33', label: 'Dikey 3:4' },
  { value: '0.75', label: 'Yatay 4:3 (klasik webcam)' },
  { value: '0.5625', label: 'Yatay 16:9 (sinema)' },
];
const FIT_OPTS = [
  { value: 'cover', label: 'Doldur (cover) — kenarları kırp' },
  { value: 'contain', label: 'Sığdır (contain) — kara şerit kalabilir' },
];

type C = RoomLayoutConfig;

/* ════════════════════════════════════════════════════════════════════
 * v286 (16 May 2026): Disconnected section'lar gizlendi.
 *   Sadece APK'da render path'ine bağlı ayarlar gösterilir. 21 ölü
 *   section ('mobile=none') koddan ÇIKARILDI ama types.ts + defaults.ts
 *   + DB schema dokunulmadı — ileride bağlanırsa tek satır eklemekle döner.
 * ════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════ HOST ═══════════════════════════════ */
export function HostPanel({ cfg, update }: { cfg: C['host']; update: (p: Partial<C['host']>) => void }) {
  return (
    <div className="space-y-3">
      <Section title="Host Avatarı" hint="Oda sahibinin avatar şekli, boyutu ve köşe yuvarlaması" mobile="ok">
        <SelectField label="Şekil" value={cfg.avatarShape} options={SHAPE_OPTS} onChange={v => update({ avatarShape: v as AvatarShape })} />
        <Slider label="Boyut" min={80} max={200} step={2} value={cfg.avatarSize} onChange={v => update({ avatarSize: v })} display={`${cfg.avatarSize}dp`} />
        <Slider label="Köşe Yuvarlaması (kare şekilde)" min={0} max={48} step={1} value={cfg.borderRadius} onChange={v => update({ borderRadius: v })} display={`${cfg.borderRadius}dp`} />
      </Section>

      <Section title="Halka (Border Ring)" hint="Host avatarın etrafındaki çevre çizgisi — kullanıcının çerçevesi varsa otomatik gizlenir (frame önceliği)" mobile="ok">
        <Slider label="Kalınlık" min={0} max={6} step={1} value={cfg.ringWidth} onChange={v => update({ ringWidth: v })} display={`${cfg.ringWidth}dp`} />
        <ColorField label="Halka Rengi" value={cfg.ringColor} onChange={v => update({ ringColor: v })} />
      </Section>

      <Section title="Halo (Arkaplan Glow)" hint="Host avatarın arkasında renkli yumuşak ışıma — Skia ile cross-platform" mobile="ok">
        <Toggle label="Halo Aktif" checked={cfg.haloEnabled} onChange={v => update({ haloEnabled: v })} />
        <ColorField label="Halo Rengi" value={cfg.haloColor} onChange={v => update({ haloColor: v })} />
        <Slider label="Opaklık" min={0} max={1} step={0.05} value={cfg.haloOpacity} onChange={v => update({ haloOpacity: v })} display={`${(cfg.haloOpacity * 100).toFixed(0)}%`} />
        <Slider label="Bulanıklık (Blur)" min={0} max={60} step={1} value={cfg.haloBlur} onChange={v => update({ haloBlur: v })} display={`${cfg.haloBlur}px`} />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════ SPEAKERS ═══════════════════════════════ */
import { NAME_POS_OPTS } from './controls';
import type { NamePosition } from './types';
export function SpeakersPanel({ cfg, updateCfg }:
  { cfg: C['speakers']; updateCfg: (p: Partial<C['speakers']>) => void }) {
  return (
    <div className="space-y-3">
      <Section title="Konuşmacı Avatarı" hint="Mikrofon sahibi katılımcıların avatar görünümü" mobile="ok">
        <SelectField label="Şekil" value={cfg.avatarShape} options={SHAPE_OPTS} onChange={v => updateCfg({ avatarShape: v as AvatarShape })} />
        <Slider label="Köşe Yuvarlaması (kare şekilde)" min={0} max={48} step={1} value={cfg.borderRadius} onChange={v => updateCfg({ borderRadius: v })} display={`${cfg.borderRadius}dp`} />
      </Section>

      <Section title="Halka (Border Ring)" hint="Avatar etrafındaki çevre çizgisi" mobile="ok">
        <Slider label="Kalınlık" min={0} max={6} step={1} value={cfg.ringWidth} onChange={v => updateCfg({ ringWidth: v })} display={`${cfg.ringWidth}dp`} />
        <ColorField label="Halka Rengi" value={cfg.ringColor} onChange={v => updateCfg({ ringColor: v })} />
      </Section>

      <Section title="İsim Yazısı" hint="Konuşmacı altındaki ad — boyut/kesim/konum" mobile="ok">
        <SelectField label="Konum" value={cfg.namePosition} options={NAME_POS_OPTS} onChange={v => updateCfg({ namePosition: v as NamePosition })} />
        <Slider label="Font Boyutu" min={8} max={22} step={1} value={cfg.nameFontSize} onChange={v => updateCfg({ nameFontSize: v })} display={`${cfg.nameFontSize}sp`} />
        <Slider label="Maks Karakter (0 = sınırsız)" min={0} max={24} step={1} value={cfg.nameMaxChars} onChange={v => updateCfg({ nameMaxChars: v })} display={cfg.nameMaxChars === 0 ? '∞' : `${cfg.nameMaxChars} hf`} />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════ LISTENERS ═══════════════════════════════ */
export function ListenersPanel({ cfg, accents, updateCfg, updateAccents }:
  { cfg: C['listeners']; accents: C['accents'];
    updateCfg: (p: Partial<C['listeners']>) => void;
    updateAccents: (p: Partial<C['accents']>) => void }) {
  return (
    <div className="space-y-3">
      <Section title="Dinleyici Avatarı" hint="Sahnede olmayan katılımcıların avatar görünümü" mobile="ok">
        <SelectField label="Şekil" value={cfg.avatarShape} options={SHAPE_OPTS} onChange={v => updateCfg({ avatarShape: v as AvatarShape })} />
        <Slider label="Köşe Yuvarlaması (kare şekilde)" min={0} max={48} step={1} value={cfg.borderRadius} onChange={v => updateCfg({ borderRadius: v })} display={`${cfg.borderRadius}dp`} />
      </Section>

      <Section title="Halka (Border Ring)" hint="Avatar etrafındaki çevre çizgisi" mobile="ok">
        <Slider label="Kalınlık" min={0} max={4} step={1} value={cfg.ringWidth} onChange={v => updateCfg({ ringWidth: v })} display={`${cfg.ringWidth}dp`} />
        <ColorField label="Halka Rengi" value={cfg.ringColor} onChange={v => updateCfg({ ringColor: v })} />
      </Section>

      <Section title="İsim" hint="Avatar altında dinleyicinin adı — gizle veya boyut/kesim ayarla" mobile="ok">
        <Toggle label="İsim Göster" checked={cfg.showName} onChange={v => updateCfg({ showName: v })} />
        <Slider label="Font Boyutu" min={6} max={16} step={1} value={cfg.nameFontSize} onChange={v => updateCfg({ nameFontSize: v })} display={`${cfg.nameFontSize}sp`} />
        <Slider label="Maks Karakter (0 = sınırsız)" min={0} max={16} step={1} value={cfg.nameMaxChars} onChange={v => updateCfg({ nameMaxChars: v })} display={cfg.nameMaxChars === 0 ? '∞' : `${cfg.nameMaxChars} hf`} />
      </Section>

      <Section title="Oda Sahibi (Owner) Vurgusu" hint="Listede oda sahibinin nasıl ayırt edileceği" mobile="ok">
        <Toggle label="Taç Göster" checked={cfg.ownerCrownEnabled} onChange={v => updateCfg({ ownerCrownEnabled: v })} />
        <ColorField label="Vurgu Rengi" value={accents.ownerHighlight} onChange={v => updateAccents({ ownerHighlight: v })} />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════ HEADER + CONTROLS + GLOBAL ═══════════════════════════════ */
export function HeaderControlsPanel({ global, header, controls, updateGlobal, updateHeader, updateControls }:
  { global: C['global']; header: C['header']; controls: C['controls'];
    updateGlobal: (p: Partial<C['global']>) => void;
    updateHeader: (p: Partial<C['header']>) => void;
    updateControls: (p: Partial<C['controls']>) => void;
  }) {
  return (
    <div className="space-y-3">
      <Section title="Oda Başlığı" hint="Ekranın üstündeki oda adı" mobile="ok">
        <Slider label="Başlık Font" min={12} max={28} step={1} value={header.titleFontSize} onChange={v => updateHeader({ titleFontSize: v })} display={`${header.titleFontSize}sp`} />
        <SelectField label="Başlık Kalınlık" value={header.titleFontWeight} options={WEIGHT_OPTS} onChange={v => updateHeader({ titleFontWeight: v })} />
        <ColorField label="Başlık Rengi" value={header.titleColor} onChange={v => updateHeader({ titleColor: v })} />
        <Toggle label="Dinleyici Sayısı Göster" checked={header.showListenerCount} onChange={v => updateHeader({ showListenerCount: v })} />
        <Slider label="Header Arka Plan Opaklık" min={0} max={1} step={0.05} value={header.headerBgOpacity} onChange={v => updateHeader({ headerBgOpacity: v })} display={`${(header.headerBgOpacity * 100).toFixed(0)}%`} />
        <Toggle label="Alt Çizgi" checked={header.headerBorderBottom} onChange={v => updateHeader({ headerBorderBottom: v })} />
        <ColorField label="Alt Çizgi Rengi" value={header.headerBorderColor} onChange={v => updateHeader({ headerBorderColor: v })} />
      </Section>

      {/* ★ v300 (17 May 2026): Üst başlıktaki oda sahibi (host) mini avatarının görünüm ayarları.
          APK RoomInfoHeader.tsx ile birebir senkron — DB JSONB config.header bloğuna yazılır. */}
      <Section title="Oda Sahibi Avatarı" hint="Başlıktaki host mini avatarı (sol üst)" mobile="ok">
        <Toggle label="Avatarı Göster" checked={header.showHostAvatar ?? true} onChange={v => updateHeader({ showHostAvatar: v })} />
        <Slider label="Avatar Boyutu" min={24} max={56} step={1} value={header.hostAvatarSize ?? 36} onChange={v => updateHeader({ hostAvatarSize: v })} display={`${header.hostAvatarSize ?? 36}dp`} />
        <Slider label="Çerçeve Kalınlığı" min={0} max={4} step={0.5} value={header.hostAvatarBorderWidth ?? 1.5} onChange={v => updateHeader({ hostAvatarBorderWidth: v })} display={`${header.hostAvatarBorderWidth ?? 1.5}dp`} />
        <ColorField label="Çerçeve Rengi" value={header.hostAvatarBorderColor ?? 'rgba(20,184,166,0.55)'} onChange={v => updateHeader({ hostAvatarBorderColor: v })} />
      </Section>

      <Section title="Alt Kontrol Barı" hint="Ekranın altındaki mikrofon/sohbet/ayrıl barı" mobile="ok">
        <Slider label="Buton Boyutu" min={32} max={56} step={1} value={controls.buttonSize} onChange={v => updateControls({ buttonSize: v })} display={`${controls.buttonSize}dp`} />
        <Slider label="İkon Boyutu" min={14} max={28} step={1} value={controls.iconSize} onChange={v => updateControls({ iconSize: v })} display={`${controls.iconSize}dp`} />
        <ColorField label="İkon Rengi" value={controls.iconColor} onChange={v => updateControls({ iconColor: v })} />
      </Section>

      <Section title="Sayfa Kenar Boşluğu" hint="Avatar gridinin yatay iç boşluğu" mobile="ok">
        <Slider label="Yatay Padding" min={0} max={32} step={1} value={global.horizontalPadding} onChange={v => updateGlobal({ horizontalPadding: v })} display={`${global.horizontalPadding}dp`} />
        <Slider label="Üst Güvenli Boşluk" min={0} max={32} step={1} value={global.safePaddingTop ?? 12} onChange={v => updateGlobal({ safePaddingTop: v })} display={`${global.safePaddingTop ?? 12}dp`} />
        <Slider label="Alt Güvenli Boşluk" min={0} max={32} step={1} value={global.safePaddingBottom ?? 12} onChange={v => updateGlobal({ safePaddingBottom: v })} display={`${global.safePaddingBottom ?? 12}dp`} />
      </Section>

      {/* ★ v1.7.13.12 (19 May 2026): Oda Arka Planı paneli — kullanıcı sorusu:
          "global arkaplan nerede var web admin'de?". Field'lar DB schema'da
          vardı ama UI panel yoktu, sadece default kullanılıyordu. Şimdi admin
          canlı değiştirebilir, APK realtime render eder. */}
      <Section title="Oda Arka Planı" hint="Oda içi arka plan rengi/gradient/görsel — APK ile birebir uyumlu" mobile="ok">
        <SelectField
          label="Arka Plan Tipi"
          value={global.background || 'gradient'}
          options={[
            { value: 'solid', label: 'Düz Renk' },
            { value: 'gradient', label: 'Gradient (2 renk)' },
            { value: 'image', label: 'Görsel' },
            { value: 'none', label: 'Tema Varsayılanı' },
          ]}
          onChange={v => updateGlobal({ background: v as any })}
        />
        {(global.background === 'solid' || global.background === 'gradient') && (
          <ColorField
            label={global.background === 'solid' ? 'Arka Plan Rengi' : 'Gradient Başlangıç'}
            value={global.background === 'solid' ? (global.bgColor || '#0A0F1A') : (global.bgGradient?.[0] || '#0F1926')}
            onChange={v => {
              if (global.background === 'solid') {
                updateGlobal({ bgColor: v });
              } else {
                const next = [...(global.bgGradient || ['#0F1926', '#0A0F1A'])];
                next[0] = v;
                updateGlobal({ bgGradient: next });
              }
            }}
          />
        )}
        {global.background === 'gradient' && (
          <ColorField
            label="Gradient Bitiş"
            value={global.bgGradient?.[1] || '#0A0F1A'}
            onChange={v => {
              const next = [...(global.bgGradient || ['#0F1926', '#0A0F1A'])];
              next[1] = v;
              updateGlobal({ bgGradient: next });
            }}
          />
        )}
        {global.background === 'image' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#94A3B8' }}>
              Görsel URL (CDN/Storage linki — şu an manuel, upload UI sonra eklenecek)
            </label>
            <input
              type="text"
              value={global.bgImageUrl || ''}
              onChange={e => updateGlobal({ bgImageUrl: e.target.value || null })}
              placeholder="https://..."
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(15,25,38,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#E2E8F0',
                fontSize: 13,
              }}
            />
          </div>
        )}
      </Section>
    </div>
  );
}

/* ═══════════════════════════════ EFFECTS (Animations + Shadows + Indicators + Accents + Stage) ═══════════════════════════════ */
import { CORNER_OPTS, DIVIDER_OPTS } from './controls';
import type { CornerPosition, StageDivider } from './types';
export function EffectsPanel({
  anims, accents, indicators, shadows, speakersCfg, listenersAdv, stage,
  updateAnims, updateAccents, updateIndicators, updateShadows, updateSpeakers, updateListenersAdv, updateStage,
}: {
  anims: C['animations']; accents: C['accents']; indicators: C['indicators']; shadows: C['shadows']; speakersCfg: C['speakers'];
  listenersAdv: C['listeners_advanced']; stage: C['stage'];
  updateAnims: (p: Partial<C['animations']>) => void;
  updateAccents: (p: Partial<C['accents']>) => void;
  updateIndicators: (p: Partial<C['indicators']>) => void;
  updateShadows: (p: Partial<C['shadows']>) => void;
  updateSpeakers: (p: Partial<C['speakers']>) => void;
  updateListenersAdv: (p: Partial<C['listeners_advanced']>) => void;
  updateStage: (p: Partial<C['stage']>) => void;
}) {
  return (
    <div className="space-y-3">
      <Section title="Konuşma Pulse" hint="Birisi mikrofona konuştuğunda avatar etrafında dalgalanma halkaları" mobile="ok">
        <Toggle label="Konuşma Pulse Aktif" checked={anims.speakingPulseEnabled} onChange={v => updateAnims({ speakingPulseEnabled: v })} />
        <Slider label="Pulse Hızı" min={400} max={3000} step={100} value={anims.speakingPulseSpeed} onChange={v => updateAnims({ speakingPulseSpeed: v })} display={`${anims.speakingPulseSpeed}ms`} />
        <Slider label="Halka Genişleme Çarpanı" min={1} max={2} step={0.05} value={anims.speakingRingExpand} onChange={v => updateAnims({ speakingRingExpand: v })} display={`${anims.speakingRingExpand.toFixed(2)}x`} />
        <ColorField label="Konuşma Halka Rengi" value={speakersCfg.speakingRingColor} onChange={v => updateSpeakers({ speakingRingColor: v })} />
      </Section>

      <Section title="Halo Pulse (Host)" hint="Host avatar arkasındaki halonun nefes alma efekti" mobile="ok">
        <Toggle label="Halo Pulse Aktif" checked={anims.haloPulseEnabled} onChange={v => updateAnims({ haloPulseEnabled: v })} />
        <Slider label="Halo Pulse Hızı" min={500} max={5000} step={100} value={anims.haloPulseSpeed} onChange={v => updateAnims({ haloPulseSpeed: v })} display={`${anims.haloPulseSpeed}ms`} />
        <Slider label="Pulse Genlik" min={0.05} max={0.5} step={0.05} value={anims.haloPulseAmplitude} onChange={v => updateAnims({ haloPulseAmplitude: v })} display={`${(anims.haloPulseAmplitude * 100).toFixed(0)}%`} />
      </Section>

      <Section title="Gölgeler (Skia)" hint="Avatarların arkasındaki yumuşak renkli gölge (cross-platform)" mobile="ok">
        <ColorField label="Host Gölge Rengi" value={shadows.hostShadowColor} onChange={v => updateShadows({ hostShadowColor: v })} />
        <Slider label="Host Gölge Bulanıklık" min={0} max={48} step={1} value={shadows.hostShadowBlur} onChange={v => updateShadows({ hostShadowBlur: v })} display={`${shadows.hostShadowBlur}px`} />
        <Slider label="Host Gölge Opaklık" min={0} max={1} step={0.05} value={shadows.hostShadowOpacity} onChange={v => updateShadows({ hostShadowOpacity: v })} display={`${(shadows.hostShadowOpacity * 100).toFixed(0)}%`} />
        <Toggle label="Konuşmacı Gölge" checked={shadows.speakerShadowEnabled} onChange={v => updateShadows({ speakerShadowEnabled: v })} />
        <ColorField label="Konuşmacı Gölge Rengi" value={shadows.speakerShadowColor} onChange={v => updateShadows({ speakerShadowColor: v })} />
        <Slider label="Konuşmacı Gölge Bulanıklık" min={0} max={32} step={1} value={shadows.speakerShadowBlur} onChange={v => updateShadows({ speakerShadowBlur: v })} display={`${shadows.speakerShadowBlur}px`} />
        <Slider label="Konuşmacı Gölge Opaklık" min={0} max={1} step={0.05} value={shadows.speakerShadowOpacity} onChange={v => updateShadows({ speakerShadowOpacity: v })} display={`${(shadows.speakerShadowOpacity * 100).toFixed(0)}%`} />
        <Toggle label="Dinleyici Gölge" checked={shadows.listenerShadowEnabled} onChange={v => updateShadows({ listenerShadowEnabled: v })} />
        <ColorField label="Dinleyici Gölge Rengi" value={shadows.listenerShadowColor} onChange={v => updateShadows({ listenerShadowColor: v })} />
        <Slider label="Dinleyici Gölge Bulanıklık" min={0} max={20} step={1} value={shadows.listenerShadowBlur} onChange={v => updateShadows({ listenerShadowBlur: v })} display={`${shadows.listenerShadowBlur}px`} />
        <Slider label="Dinleyici Gölge Opaklık" min={0} max={1} step={0.05} value={shadows.listenerShadowOpacity} onChange={v => updateShadows({ listenerShadowOpacity: v })} display={`${(shadows.listenerShadowOpacity * 100).toFixed(0)}%`} />
      </Section>

      <Section title="Online Noktası" hint="Çevrimiçi kullanıcıların avatar köşesindeki yeşil nokta" mobile="ok">
        <Toggle label="Online Noktası Göster" checked={indicators.onlineDotEnabled} onChange={v => updateIndicators({ onlineDotEnabled: v })} />
        <ColorField label="Online Nokta Rengi" value={indicators.onlineDotColor} onChange={v => updateIndicators({ onlineDotColor: v })} />
        <SelectField label="Konum" value={indicators.onlineDotPosition} options={CORNER_OPTS} onChange={v => updateIndicators({ onlineDotPosition: v as CornerPosition })} />
      </Section>

      <Section title="Moderatör & El Kaldırma" hint="Moderatör avatar halkası rengi + el kaldıran dinleyici rozeti" mobile="ok">
        <ColorField label="Moderatör Halka Rengi" value={accents.moderatorHighlight} onChange={v => updateAccents({ moderatorHighlight: v })} />
        <Toggle label="El Kaldırma Rozeti Aktif" checked={accents.handRaiseEnabled} onChange={v => updateAccents({ handRaiseEnabled: v })} />
        <ColorField label="El Kaldırma Rengi" value={accents.handRaiseColor} onChange={v => updateAccents({ handRaiseColor: v })} />
      </Section>

      <Section title="Dinleyici Grid Limiti" hint="Grid'de aynı anda kaç dinleyici görünür — fazlası overflow rozetine düşer (tıkla → tüm liste)" mobile="ok">
        <Slider label="Küçük Ekran (&lt; 360dp)" min={4} max={20} step={1} value={listenersAdv.maxVisibleSmallScreen} onChange={v => updateListenersAdv({ maxVisibleSmallScreen: v })} display={`${listenersAdv.maxVisibleSmallScreen} kişi`} />
        <Slider label="Normal Ekran (≥ 360dp)" min={4} max={30} step={1} value={listenersAdv.maxVisibleDefault} onChange={v => updateListenersAdv({ maxVisibleDefault: v })} display={`${listenersAdv.maxVisibleDefault} kişi`} />
      </Section>

      <Section title="Seyirci Overflow Rozeti" hint="Listenerda görüntülenmeyen seyirci sayısı '+N' pill" mobile="ok">
        <TextField label="Şablon ('{N}' yerine sayı)" value={listenersAdv.overflowBadgeText} onChange={v => updateListenersAdv({ overflowBadgeText: v })} placeholder="+{N} Seyirci" />
        <ColorField label="Pill Arka Plan" value={listenersAdv.overflowBadgeColor} onChange={v => updateListenersAdv({ overflowBadgeColor: v })} />
        <ColorField label="Pill Yazı Rengi" value={listenersAdv.overflowBadgeTextColor} onChange={v => updateListenersAdv({ overflowBadgeTextColor: v })} />
      </Section>

      <Section title="Sahne Ayracı" hint="Konuşmacı ve dinleyici grid'i arasındaki çizgi" mobile="ok">
        <SelectField label="Stil" value={stage.dividerStyle} options={DIVIDER_OPTS} onChange={v => updateStage({ dividerStyle: v as StageDivider })} />
        <ColorField label="Ayraç Rengi" value={stage.dividerColor} onChange={v => updateStage({ dividerColor: v })} />
      </Section>

      <Section title="Etkileşim & Erişilebilirlik" hint="Avatar tıklama feedback + hareket azaltma (a11y)" mobile="ok">
        <Slider label="Avatar Tıklama Scale (basılı tut feedback)" min={0.85} max={1} step={0.01} value={anims.avatarTapScale} onChange={v => updateAnims({ avatarTapScale: v })} display={`${anims.avatarTapScale.toFixed(2)}x`} />
        <Toggle label="Hareket Azaltma (tüm pulse/halo/tap animasyonlarını kapat)" checked={anims.reduceMotion} onChange={v => updateAnims({ reduceMotion: v })} />
        {/* ★ v289 (16 May 2026): enterTransition + enterDurationMs admin'den KALDIRILDI.
            Memory: "v107.41 Reanimated entering/exiting kaldırıldı — kullanıcı zıplama
            istemiyor". Bu iki alan defaults'ta hayalet kalıyor (geriye uyum) ama UI'da
            kullanıcı görmesin — sahte ayar yok. */}
      </Section>
    </div>
  );
}

/* ═══════════════════════════════ CAMERA ═══════════════════════════════
 * ★ v301 (18 May 2026): Kameralı kullanıcı tile'ı ayarları.
 *   - Tile geometri (aspect, köşe yuvarlaması)
 *   - Video davranışı (object-fit, mirror)
 *   - Indicator (köşedeki kamera ikonu)
 *   - Border (audio'dan bağımsız kamera kenarı)
 *   - Video üzerindeki gradient overlay (isim okunabilirliği)
 *   - Spotlight modu (hibrit Discord/TikTok layout)
 *   - Fullscreen modal davranışı
 * Hepsi mobile SpeakerSection.tsx + CameraFullscreenModal.tsx render path'ine bağlı.
 * ═══════════════════════════════════════════════════════════════════════ */
export function CameraPanel({ cfg, update }:
  { cfg: RoomLayoutConfig['camera']; update: (p: Partial<RoomLayoutConfig['camera']>) => void }) {
  // Heuristic: heightRatio değerini en yakın preset'e snap'le; custom ise '' göster
  const presetMatch = CAMERA_ASPECT_OPTS.find(o => Math.abs(parseFloat(o.value) - cfg.heightRatio) < 0.005);
  return (
    <div className="space-y-3">
      <Section title="Tile Geometri" hint="Kameralı konuşmacı kutusunun en/boy oranı ve köşe yuvarlaması" mobile="ok">
        <SelectField
          label="En/Boy Oranı (Aspect)"
          value={presetMatch?.value ?? cfg.heightRatio.toFixed(4)}
          options={presetMatch ? CAMERA_ASPECT_OPTS : [...CAMERA_ASPECT_OPTS, { value: cfg.heightRatio.toFixed(4), label: `Özel (${cfg.heightRatio.toFixed(2)})` }]}
          onChange={v => update({ heightRatio: parseFloat(v) })}
        />
        <Slider label="Özel Oran (manuel)" min={0.5} max={2} step={0.01} value={cfg.heightRatio}
          onChange={v => update({ heightRatio: v })} display={`H/W = ${cfg.heightRatio.toFixed(2)}`} />
        <Slider label="Köşe Yuvarlaması (%)" min={0} max={30} step={1} value={cfg.cornerRadiusPercent}
          onChange={v => update({ cornerRadiusPercent: v })} display={`%${cfg.cornerRadiusPercent} (cardWidth)`} />
        <Slider label="Köşe Min (dp)" min={0} max={48} step={1} value={cfg.cornerRadiusMin}
          onChange={v => update({ cornerRadiusMin: v })} display={`${cfg.cornerRadiusMin}dp`} />
      </Section>

      <Section title="Video Davranışı" hint="Video kareye nasıl yerleşir ve self-view ayna mı" mobile="ok">
        <SelectField label="Object-Fit" value={cfg.objectFit} options={FIT_OPTS}
          onChange={v => update({ objectFit: v as 'cover' | 'contain' })} />
        <Toggle label="Kendi Görüntün Ayna (mirror self)" checked={cfg.mirrorSelf}
          onChange={v => update({ mirrorSelf: v })} />
      </Section>

      <Section title="Köşe Indicator (kamera ikonu)" hint="Avatarın köşesindeki 'kamera açık' rozeti" mobile="ok">
        <Toggle label="Indicator Aktif" checked={cfg.indicatorEnabled}
          onChange={v => update({ indicatorEnabled: v })} />
        <ColorField label="Indicator Rengi" value={cfg.indicatorColor}
          onChange={v => update({ indicatorColor: v })} />
        <SelectField label="Konum" value={cfg.indicatorPosition} options={CORNER_OPTS}
          onChange={v => update({ indicatorPosition: v as CornerPosition })} />
        <Slider label="Boyut" min={10} max={28} step={1} value={cfg.indicatorSize}
          onChange={v => update({ indicatorSize: v })} display={`${cfg.indicatorSize}dp`} />
      </Section>

      <Section title="Border (Kamera Kenarı)" hint="Audio halkasından bağımsız özel kamera kenarı" mobile="ok">
        <Toggle label="Özel Border Kullan (kapalı = audio ringWidth/Color)" checked={cfg.useCustomBorder}
          onChange={v => update({ useCustomBorder: v })} />
        <Slider label="Border Kalınlığı" min={0} max={8} step={1} value={cfg.borderWidth}
          onChange={v => update({ borderWidth: v })} display={`${cfg.borderWidth}dp`} />
        <ColorField label="Border Rengi" value={cfg.borderColor}
          onChange={v => update({ borderColor: v })} />
      </Section>

      <Section title="Video Overlay (Üst/Alt Gölge)" hint="Video üzerinde isim ve rozet okunabilirliği için siyah gradient" mobile="ok">
        <Slider label="Üst Gölge Opaklık" min={0} max={1} step={0.05} value={cfg.overlayTopOpacity}
          onChange={v => update({ overlayTopOpacity: v })} display={`${(cfg.overlayTopOpacity * 100).toFixed(0)}%`} />
        <Slider label="Alt Gölge Opaklık" min={0} max={1} step={0.05} value={cfg.overlayBottomOpacity}
          onChange={v => update({ overlayBottomOpacity: v })} display={`${(cfg.overlayBottomOpacity * 100).toFixed(0)}%`} />
      </Section>

      <Section title="Spotlight Modu (Hibrit Layout)" hint="Kameralı kullanıcılar üstte büyük tile, audio-only altta kompakt (Discord/TikTok pattern). Kapalı = uniform circle grid (Clubhouse)" mobile="ok">
        <Toggle label="Spotlight Aktif" checked={cfg.spotlightEnabled}
          onChange={v => update({ spotlightEnabled: v })} />
        <Slider label="1 Kamera Aspect (H/W)" min={0.4} max={1.5} step={0.02} value={cfg.spotlightSingleAspect}
          onChange={v => update({ spotlightSingleAspect: v })} display={cfg.spotlightSingleAspect.toFixed(2)} />
        <Slider label="2 Kamera Aspect" min={0.5} max={1.5} step={0.05} value={cfg.spotlightDoubleAspect}
          onChange={v => update({ spotlightDoubleAspect: v })} display={cfg.spotlightDoubleAspect.toFixed(2)} />
        <Slider label="3 Kamera Aspect" min={0.5} max={1.5} step={0.05} value={cfg.spotlightTripleAspect}
          onChange={v => update({ spotlightTripleAspect: v })} display={cfg.spotlightTripleAspect.toFixed(2)} />
        <Slider label="4 Kamera Aspect" min={0.5} max={1.5} step={0.05} value={cfg.spotlightQuadAspect}
          onChange={v => update({ spotlightQuadAspect: v })} display={cfg.spotlightQuadAspect.toFixed(2)} />
        <Slider label="Spotlight Boşluk (dp)" min={0} max={24} step={1} value={cfg.spotlightGap}
          onChange={v => update({ spotlightGap: v })} display={`${cfg.spotlightGap}dp`} />
      </Section>

      <Section title="Fullscreen Modal" hint="Kamera rozetine tıklayınca açılan tam ekran" mobile="ok">
        <SelectField label="Object-Fit (fullscreen)" value={cfg.fullscreenObjectFit} options={FIT_OPTS}
          onChange={v => update({ fullscreenObjectFit: v as 'cover' | 'contain' })} />
      </Section>

      <Section title="Limit" hint="Aynı anda kaç konuşmacı kamera açabilir" mobile="ok">
        <Slider label="Maks Eşzamanlı Kamera (0 = sınırsız)" min={0} max={15} step={1} value={cfg.maxConcurrentCameras}
          onChange={v => update({ maxConcurrentCameras: v })} display={cfg.maxConcurrentCameras === 0 ? '∞' : `${cfg.maxConcurrentCameras} kişi`} />
      </Section>
    </div>
  );
}
