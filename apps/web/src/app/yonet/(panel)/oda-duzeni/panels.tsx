"use client";
import React from 'react';
import { Section, Slider, Toggle, ColorField, SelectField,
  SHAPE_OPTS, WEIGHT_OPTS,
} from './controls';
import type { RoomLayoutConfig, AvatarShape } from './types';

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
      <Section title="Host Avatarı" hint="Oda sahibinin avatar şekli ve köşe yuvarlaması" mobile="ok">
        <SelectField label="Şekil" value={cfg.avatarShape} options={SHAPE_OPTS} onChange={v => update({ avatarShape: v as AvatarShape })} />
        <Slider label="Köşe Yuvarlaması (kare şekilde)" min={0} max={48} step={1} value={cfg.borderRadius} onChange={v => update({ borderRadius: v })} display={`${cfg.borderRadius}dp`} />
      </Section>
    </div>
  );
}

/* ═══════════════════════════════ SPEAKERS ═══════════════════════════════ */
export function SpeakersPanel({ cfg, updateCfg }:
  { cfg: C['speakers']; updateCfg: (p: Partial<C['speakers']>) => void }) {
  return (
    <div className="space-y-3">
      <Section title="Konuşmacı Avatarı" hint="Mikrofon sahibi katılımcıların avatar görünümü" mobile="ok">
        <SelectField label="Şekil" value={cfg.avatarShape} options={SHAPE_OPTS} onChange={v => updateCfg({ avatarShape: v as AvatarShape })} />
        <Slider label="Köşe Yuvarlaması (kare şekilde)" min={0} max={48} step={1} value={cfg.borderRadius} onChange={v => updateCfg({ borderRadius: v })} display={`${cfg.borderRadius}dp`} />
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

      <Section title="İsim" hint="Avatar altında dinleyicinin adı görünür mü" mobile="ok">
        <Toggle label="İsim Göster" checked={cfg.showName} onChange={v => updateCfg({ showName: v })} />
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

      <Section title="Alt Kontrol Barı" hint="Ekranın altındaki mikrofon/sohbet/ayrıl barı" mobile="ok">
        <Slider label="Buton Boyutu" min={32} max={56} step={1} value={controls.buttonSize} onChange={v => updateControls({ buttonSize: v })} display={`${controls.buttonSize}dp`} />
        <Slider label="İkon Boyutu" min={14} max={28} step={1} value={controls.iconSize} onChange={v => updateControls({ iconSize: v })} display={`${controls.iconSize}dp`} />
        <ColorField label="İkon Rengi" value={controls.iconColor} onChange={v => updateControls({ iconColor: v })} />
      </Section>

      <Section title="Sayfa Kenar Boşluğu" hint="Avatar gridinin yatay iç boşluğu" mobile="ok">
        <Slider label="Yatay Padding" min={0} max={32} step={1} value={global.horizontalPadding} onChange={v => updateGlobal({ horizontalPadding: v })} display={`${global.horizontalPadding}dp`} />
      </Section>
    </div>
  );
}
