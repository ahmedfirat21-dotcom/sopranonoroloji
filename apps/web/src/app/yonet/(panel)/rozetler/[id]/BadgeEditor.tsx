"use client";

/**
 * Rozet Editörü — profil rozeti (Verified tik, Premium, Pro, vs.)
 * 7 sekme: Şekil / Görsel / Glow / Sınır / Animasyon / Konum / Genel
 */
import React, { useReducer, useTransition } from 'react';
import { Save, RotateCcw, Shapes, ImageIcon, Sparkles, Square, Activity, Move, Settings as SettingsIcon, Loader2, Crown, BadgeCheck, Award, Star, Diamond, Shield, Hexagon, Gem } from 'lucide-react';
import { saveBadgeConfig } from './actions';

type Tab = 'shape' | 'visual' | 'glow' | 'border' | 'anim' | 'position' | 'tier' | 'general';
type BadgeShape = 'circle' | 'rounded-square' | 'shield' | 'star' | 'diamond' | 'hexagon' | 'crown' | 'gem';
type IconType = 'verified' | 'crown' | 'star' | 'award' | 'diamond' | 'shield' | 'custom' | 'none';
type AnimType = 'none' | 'pulse' | 'spin' | 'shimmer' | 'bounce' | 'rainbow' | 'breathe';

interface BadgeConfig {
  // Şekil
  shape: BadgeShape;
  size: number;             // 16-48 dp
  border_radius: number;    // rounded-square için
  // Görsel
  icon_type: IconType;
  icon_color: string;
  icon_size_ratio: number;  // 0.4-0.9 (badge size'a göre ikon)
  bg_color: string;
  bg_gradient_enabled: boolean;
  bg_gradient_from: string;
  bg_gradient_to: string;
  bg_gradient_angle: number; // 0-360
  bg_opacity: number;
  custom_image_url: string;
  // Glow
  glow_enabled: boolean;
  glow_color: string;
  glow_intensity: number;
  glow_blur: number;
  glow_pulse: boolean;
  // Sınır
  border_enabled: boolean;
  border_color: string;
  border_width: number;
  border_style: 'solid' | 'dashed' | 'dotted' | 'double';
  // Animasyon
  animation: AnimType;
  anim_speed_ms: number;
  anim_amplitude: number;
  // Konum (avatar üzerinde nerede)
  position: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft' | 'inline';
  offset_x: number;         // % avatar size
  offset_y: number;
  scale_on_avatar: number;  // 0.2-0.5 (avatar size çarpanı)
  // Genel
  visible_on_avatar: boolean;
  visible_on_profile: boolean;
  visible_inline_with_name: boolean;
  hover_tooltip_text: string;
  z_index: number;
  // ★ v119 (13 May 2026): Tier'a otomatik atama — Plus/Pro üyelik alındığında
  //   bu rozet otomatik active_badge_id olarak set edilir (manuel satın alma gerekmez)
  auto_assign_tier: 'none' | 'Plus' | 'Pro' | 'GoldMember';
  tier_label_override: string;   // Rozet üzerindeki yazı (örn "PLUS" / "PRO")
  tier_label_color: string;
  tier_label_font_size: number;
  hide_for_free_users: boolean;
  show_in_subscription_screen: boolean; // Plus/Pro abonelik ekranında ön plan görseli
}

const DEFAULT_CFG: BadgeConfig = {
  shape: 'circle',
  size: 24,
  border_radius: 8,
  icon_type: 'verified',
  icon_color: '#FFFFFF',
  icon_size_ratio: 0.6,
  bg_color: '#3B82F6',
  bg_gradient_enabled: false,
  bg_gradient_from: '#3B82F6',
  bg_gradient_to: '#1E40AF',
  bg_gradient_angle: 135,
  bg_opacity: 1,
  custom_image_url: '',
  glow_enabled: true,
  glow_color: '#3B82F6',
  glow_intensity: 0.5,
  glow_blur: 12,
  glow_pulse: false,
  border_enabled: false,
  border_color: '#FFFFFF',
  border_width: 1,
  border_style: 'solid',
  animation: 'none',
  anim_speed_ms: 1500,
  anim_amplitude: 0.3,
  position: 'bottomRight',
  offset_x: 0,
  offset_y: 0,
  scale_on_avatar: 0.3,
  visible_on_avatar: true,
  visible_on_profile: true,
  visible_inline_with_name: true,
  hover_tooltip_text: '',
  z_index: 10,
  auto_assign_tier: 'none',
  tier_label_override: '',
  tier_label_color: '#FFFFFF',
  tier_label_font_size: 9,
  hide_for_free_users: false,
  show_in_subscription_screen: false,
};

function reducer(state: BadgeConfig, action: Partial<BadgeConfig> | { reset: true }): BadgeConfig {
  if ('reset' in action) return DEFAULT_CFG;
  return { ...state, ...action };
}

export default function BadgeEditor({ item }: { item: any }) {
  const initial: BadgeConfig = { ...DEFAULT_CFG, ...((item.editor_config as any)?.badge_config || {}) };
  const [cfg, dispatch] = useReducer(reducer, initial);
  const [tab, setTab] = React.useState<Tab>('shape');
  const [saving, startSave] = useTransition();
  const [status, setStatus] = React.useState<string | null>(null);

  const upd = (patch: Partial<BadgeConfig>) => dispatch(patch);

  const handleSave = () => {
    setStatus(null);
    startSave(async () => {
      const res = await saveBadgeConfig(item.id, cfg as any);
      setStatus(res.ok ? '✓ Kaydedildi' : `✗ Hata: ${res.error}`);
      setTimeout(() => setStatus(null), 3000);
    });
  };

  const TABS: { k: Tab; l: string; i: React.ReactNode }[] = [
    { k: 'shape',    l: 'Şekil',     i: <Shapes className="w-3.5 h-3.5" /> },
    { k: 'visual',   l: 'Görsel',    i: <ImageIcon className="w-3.5 h-3.5" /> },
    { k: 'glow',     l: 'Glow',      i: <Sparkles className="w-3.5 h-3.5" /> },
    { k: 'border',   l: 'Sınır',     i: <Square className="w-3.5 h-3.5" /> },
    { k: 'anim',     l: 'Animasyon', i: <Activity className="w-3.5 h-3.5" /> },
    { k: 'position', l: 'Konum',     i: <Move className="w-3.5 h-3.5" /> },
    { k: 'tier',     l: 'Tier',      i: <Gem className="w-3.5 h-3.5" /> },
    { k: 'general',  l: 'Genel',     i: <SettingsIcon className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start">
      <div className="flex-1 min-w-0 w-full space-y-3">
        <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-700/40 rounded-xl p-1 overflow-x-auto sticky top-0 z-10 backdrop-blur">
          {TABS.map(t => (
            <button key={t.k} type="button" onClick={() => setTab(t.k)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.k
                  ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/20 text-amber-100 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}>
              {t.i}{t.l}
            </button>
          ))}
        </div>

        <div className="pb-20 space-y-3">
          {tab === 'shape' && <ShapePanel cfg={cfg} upd={upd} />}
          {tab === 'visual' && <VisualPanel cfg={cfg} upd={upd} />}
          {tab === 'glow' && <GlowPanel cfg={cfg} upd={upd} />}
          {tab === 'border' && <BorderPanel cfg={cfg} upd={upd} />}
          {tab === 'anim' && <AnimPanel cfg={cfg} upd={upd} />}
          {tab === 'position' && <PositionPanel cfg={cfg} upd={upd} />}
          {tab === 'tier' && <TierPanel cfg={cfg} upd={upd} />}
          {tab === 'general' && <GeneralPanel cfg={cfg} upd={upd} />}
        </div>

        <div className="fixed left-0 right-0 bottom-0 z-50 border-t border-slate-700/50 bg-slate-950/90 backdrop-blur px-4 py-3 lg:left-64">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <button type="button" onClick={() => confirm('Varsayılana dön?') && dispatch({ reset: true })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30">
              <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
            </button>
            <div className="flex items-center gap-3">
              {status && <span className={`text-xs ${status.startsWith('✗') ? 'text-rose-400' : 'text-emerald-400'}`}>{status}</span>}
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:opacity-90 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full xl:w-[380px] xl:sticky xl:top-4 xl:self-start shrink-0">
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-3">
          <div className="text-xs text-slate-300 mb-3 font-medium">Canlı Önizleme</div>
          <BadgePreview cfg={cfg} />
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function Section({ title, children, hint }: any) {
  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-4 space-y-3">
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{title}</h3>
        {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Slider({ label, min, max, step, value, onChange, display }: any) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span><span className="text-slate-200 font-mono">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-amber-500" />
    </label>
  );
}
function Toggle({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-slate-400">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-amber-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}
function ColorField({ label, value, onChange }: any) {
  const norm = value?.startsWith('#') && (value.length === 7 || value.length === 4) ? value : '#000000';
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input type="color" value={norm} onChange={e => onChange(e.target.value)} className="w-9 h-7 rounded border-0 bg-transparent cursor-pointer" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200" />
      </div>
    </label>
  );
}
function SelectField({ label, value, options, onChange }: any) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200">
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
function TextField({ label, value, onChange, placeholder }: any) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200" />
    </label>
  );
}

/* ─── Panels ─── */
function ShapePanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Rozet Şekli">
        <SelectField label="Şekil" value={cfg.shape} options={[
          { value: 'circle', label: '⭕ Yuvarlak' },
          { value: 'rounded-square', label: '⬛ Yuvarlatılmış Kare' },
          { value: 'shield', label: '🛡 Kalkan' },
          { value: 'star', label: '⭐ Yıldız' },
          { value: 'diamond', label: '💎 Elmas' },
          { value: 'hexagon', label: '⬡ Altıgen' },
          { value: 'crown', label: '👑 Taç' },
          { value: 'gem', label: '💠 Mücevher' },
        ]} onChange={(v: any) => upd({ shape: v })} />
        <Slider label="Boyut" min={14} max={48} step={1} value={cfg.size} onChange={(v: number) => upd({ size: v })} display={`${cfg.size}px`} />
        {cfg.shape === 'rounded-square' && (
          <Slider label="Köşe Yuvarlaması" min={0} max={20} step={1} value={cfg.border_radius} onChange={(v: number) => upd({ border_radius: v })} display={`${cfg.border_radius}px`} />
        )}
      </Section>
    </div>
  );
}
function VisualPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="İçindeki İkon">
        <SelectField label="İkon Tipi" value={cfg.icon_type} options={[
          { value: 'verified', label: '✓ Doğrulama Tiki' },
          { value: 'crown', label: '👑 Taç' },
          { value: 'star', label: '⭐ Yıldız' },
          { value: 'award', label: '🏆 Ödül' },
          { value: 'diamond', label: '💎 Elmas' },
          { value: 'shield', label: '🛡 Kalkan' },
          { value: 'custom', label: '📷 Özel Görsel' },
          { value: 'none', label: '— Yok' },
        ]} onChange={(v: any) => upd({ icon_type: v })} />
        {cfg.icon_type !== 'none' && cfg.icon_type !== 'custom' && (
          <>
            <ColorField label="İkon Rengi" value={cfg.icon_color} onChange={(v: string) => upd({ icon_color: v })} />
            <Slider label="İkon Boyut Oranı" min={0.3} max={0.95} step={0.05} value={cfg.icon_size_ratio} onChange={(v: number) => upd({ icon_size_ratio: v })} display={`${Math.round(cfg.icon_size_ratio * 100)}%`} />
          </>
        )}
        {cfg.icon_type === 'custom' && (
          <TextField label="Özel Görsel URL" value={cfg.custom_image_url} onChange={(v: string) => upd({ custom_image_url: v })} placeholder="https://..." />
        )}
      </Section>
      <Section title="Arka Plan">
        <Toggle label="Gradient" checked={cfg.bg_gradient_enabled} onChange={(v: boolean) => upd({ bg_gradient_enabled: v })} />
        {cfg.bg_gradient_enabled ? (
          <>
            <ColorField label="Gradient Başlangıç" value={cfg.bg_gradient_from} onChange={(v: string) => upd({ bg_gradient_from: v })} />
            <ColorField label="Gradient Bitiş" value={cfg.bg_gradient_to} onChange={(v: string) => upd({ bg_gradient_to: v })} />
            <Slider label="Gradient Açısı" min={0} max={360} step={5} value={cfg.bg_gradient_angle} onChange={(v: number) => upd({ bg_gradient_angle: v })} display={`${cfg.bg_gradient_angle}°`} />
          </>
        ) : (
          <ColorField label="Düz Renk" value={cfg.bg_color} onChange={(v: string) => upd({ bg_color: v })} />
        )}
        <Slider label="Opaklık" min={0.2} max={1} step={0.05} value={cfg.bg_opacity} onChange={(v: number) => upd({ bg_opacity: v })} display={`${Math.round(cfg.bg_opacity * 100)}%`} />
      </Section>
    </div>
  );
}
function GlowPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Glow">
        <Toggle label="Glow Aktif" checked={cfg.glow_enabled} onChange={(v: boolean) => upd({ glow_enabled: v })} />
        {cfg.glow_enabled && (<>
          <ColorField label="Glow Rengi" value={cfg.glow_color} onChange={(v: string) => upd({ glow_color: v })} />
          <Slider label="Şiddet" min={0} max={1} step={0.05} value={cfg.glow_intensity} onChange={(v: number) => upd({ glow_intensity: v })} display={`${Math.round(cfg.glow_intensity * 100)}%`} />
          <Slider label="Bulanıklık" min={0} max={40} step={1} value={cfg.glow_blur} onChange={(v: number) => upd({ glow_blur: v })} display={`${cfg.glow_blur}px`} />
          <Toggle label="Glow Pulse (Nefes)" checked={cfg.glow_pulse} onChange={(v: boolean) => upd({ glow_pulse: v })} />
        </>)}
      </Section>
    </div>
  );
}
function BorderPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Sınır">
        <Toggle label="Sınır Aktif" checked={cfg.border_enabled} onChange={(v: boolean) => upd({ border_enabled: v })} />
        {cfg.border_enabled && (<>
          <ColorField label="Renk" value={cfg.border_color} onChange={(v: string) => upd({ border_color: v })} />
          <Slider label="Kalınlık" min={0} max={6} step={1} value={cfg.border_width} onChange={(v: number) => upd({ border_width: v })} display={`${cfg.border_width}px`} />
          <SelectField label="Stil" value={cfg.border_style} options={[
            { value: 'solid', label: 'Düz' }, { value: 'dashed', label: 'Kesik' },
            { value: 'dotted', label: 'Noktalı' }, { value: 'double', label: 'Çift' },
          ]} onChange={(v: any) => upd({ border_style: v })} />
        </>)}
      </Section>
    </div>
  );
}
function AnimPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Animasyon">
        <SelectField label="Tip" value={cfg.animation} options={[
          { value: 'none', label: 'Yok' },
          { value: 'pulse', label: 'Pulse (Nabız)' },
          { value: 'spin', label: 'Sürekli Dönme' },
          { value: 'shimmer', label: 'Parıltı' },
          { value: 'bounce', label: 'Zıplama' },
          { value: 'rainbow', label: 'Renk Döngüsü' },
          { value: 'breathe', label: 'Nefes' },
        ]} onChange={(v: any) => upd({ animation: v })} />
        {cfg.animation !== 'none' && (<>
          <Slider label="Hız" min={300} max={5000} step={100} value={cfg.anim_speed_ms} onChange={(v: number) => upd({ anim_speed_ms: v })} display={`${cfg.anim_speed_ms}ms`} />
          <Slider label="Genlik" min={0.1} max={1} step={0.05} value={cfg.anim_amplitude} onChange={(v: number) => upd({ anim_amplitude: v })} display={`${Math.round(cfg.anim_amplitude * 100)}%`} />
        </>)}
      </Section>
    </div>
  );
}
function PositionPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Avatar Üzerinde Konum">
        <SelectField label="Köşe" value={cfg.position} options={[
          { value: 'topRight', label: 'Sağ Üst' }, { value: 'topLeft', label: 'Sol Üst' },
          { value: 'bottomRight', label: 'Sağ Alt' }, { value: 'bottomLeft', label: 'Sol Alt' },
          { value: 'inline', label: 'İsmin Yanında' },
        ]} onChange={(v: any) => upd({ position: v })} />
        <Slider label="X Offset" min={-30} max={30} step={1} value={cfg.offset_x} onChange={(v: number) => upd({ offset_x: v })} display={`${cfg.offset_x}%`} />
        <Slider label="Y Offset" min={-30} max={30} step={1} value={cfg.offset_y} onChange={(v: number) => upd({ offset_y: v })} display={`${cfg.offset_y}%`} />
        <Slider label="Boyut (avatara göre)" min={0.15} max={0.6} step={0.02} value={cfg.scale_on_avatar} onChange={(v: number) => upd({ scale_on_avatar: v })} display={`${Math.round(cfg.scale_on_avatar * 100)}%`} />
      </Section>
    </div>
  );
}
function TierPanel({ cfg, upd }: any) {
  // ★ P0 (16 May 2026): Tier paneli sadeleştirildi — eski hızlı şablonlar + tier_label_override
  //   + hide_for_free_users kaldırıldı. Görsel ayarlar (şekil/glow/renk) Şekil/Görsel/Glow
  //   sekmelerinden gelir — bu rozet ürününün ANA AYARI'dır.
  //
  //   Tier sekmesi şimdi 2 sade şey:
  //   1. "Üyelik Atama" — Plus/Pro/GoldMember kullanıcılarına otomatik atansın mı?
  //   2. "Bu rozeti göster" — toggle (visible_on_avatar)
  const TIER_META: Record<string, { label: string; color: string; emoji: string }> = {
    Plus:       { label: 'Plus üyeler',       color: '#7DFCE0', emoji: '🚀' },
    Pro:        { label: 'Pro üyeler',        color: '#FBBF24', emoji: '👑' },
    GoldMember: { label: 'Gold Member üyeler', color: '#F472B6', emoji: '🏵' },
  };
  return (
    <div className="space-y-3">
      <Section
        title="Üyelik Atama"
        hint="Bu rozet hangi üyelik seviyesindeki kullanıcılara OTOMATİK atansın? (Görsel ayarlar Şekil/Görsel/Glow sekmelerinden gelir.)"
      >
        <SelectField label="Atanacak Üyelik" value={cfg.auto_assign_tier || 'none'} options={[
          { value: 'none',        label: 'Yok (yalnızca manuel atama)' },
          { value: 'Plus',        label: '🚀 Plus üyeler' },
          { value: 'Pro',         label: '👑 Pro üyeler' },
          { value: 'GoldMember',  label: '🏵 Gold Member üyeler' },
        ]} onChange={(v: any) => upd({ auto_assign_tier: v })} />
        {cfg.auto_assign_tier && cfg.auto_assign_tier !== 'none' && TIER_META[cfg.auto_assign_tier] && (
          <div
            className="rounded-lg p-3 border mt-2"
            style={{
              background: TIER_META[cfg.auto_assign_tier].color + '15',
              borderColor: TIER_META[cfg.auto_assign_tier].color + '40',
            }}
          >
            <div
              className="text-xs font-semibold flex items-center gap-1.5"
              style={{ color: TIER_META[cfg.auto_assign_tier].color }}
            >
              <span>{TIER_META[cfg.auto_assign_tier].emoji}</span>
              Bu rozet {TIER_META[cfg.auto_assign_tier].label}e otomatik atanır.
            </div>
            <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              APK'da: Kullanıcının manuel rozeti varsa o öncelikli; yoksa bu rozet gösterilir.
              <br/>Aynı tier için BİRDEN FAZLA rozet varsa en son oluşturulan kullanılır
              (tek tier-rozet öneririz).
            </div>
          </div>
        )}
      </Section>

      <Section title="Rozet Görünürlüğü">
        <Toggle
          label="Bu rozeti göster"
          checked={cfg.visible_on_avatar !== false}
          onChange={(v: boolean) => upd({ visible_on_avatar: v })}
        />
        <div className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
          Kapalıysa: bu rozet hiçbir yerde gözükmez (envantere atansa veya tier-atama olsa da).
        </div>
      </Section>
    </div>
  );
}

function GeneralPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Nerelerde Görünür">
        <Toggle label="Avatar Üzerinde" checked={cfg.visible_on_avatar} onChange={(v: boolean) => upd({ visible_on_avatar: v })} />
        <Toggle label="Profil Sayfası" checked={cfg.visible_on_profile} onChange={(v: boolean) => upd({ visible_on_profile: v })} />
        <Toggle label="İsim Yanında (Inline)" checked={cfg.visible_inline_with_name} onChange={(v: boolean) => upd({ visible_inline_with_name: v })} />
      </Section>
      <Section title="Etiket / Tooltip">
        <TextField label="Hover Tooltip Metni" value={cfg.hover_tooltip_text} onChange={(v: string) => upd({ hover_tooltip_text: v })} placeholder="Örn: Premium Üye" />
        <Slider label="Z-Index" min={1} max={100} step={1} value={cfg.z_index} onChange={(v: number) => upd({ z_index: v })} display={`${cfg.z_index}`} />
      </Section>
    </div>
  );
}

/* ─── Preview ─── */
const ICONS: Record<string, React.ComponentType<any>> = {
  verified: BadgeCheck, crown: Crown, star: Star, award: Award,
  diamond: Diamond, shield: Shield, hexagon: Hexagon,
};

function BadgePreview({ cfg }: { cfg: BadgeConfig }) {
  const renderBadge = (size: number) => {
    const Icon = cfg.icon_type !== 'none' && cfg.icon_type !== 'custom' ? ICONS[cfg.icon_type] : null;
    const bg = cfg.bg_gradient_enabled
      ? `linear-gradient(${cfg.bg_gradient_angle}deg, ${cfg.bg_gradient_from}, ${cfg.bg_gradient_to})`
      : cfg.bg_color;

    const shapeStyle: React.CSSProperties = (() => {
      switch (cfg.shape) {
        case 'circle': return { borderRadius: '50%' };
        case 'rounded-square': return { borderRadius: cfg.border_radius };
        case 'shield': return { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
        case 'star': return { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
        case 'diamond': return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
        case 'hexagon': return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
        case 'crown': return { clipPath: 'polygon(0 30%, 20% 30%, 25% 0%, 50% 30%, 75% 0%, 80% 30%, 100% 30%, 100% 100%, 0 100%)' };
        case 'gem': return { clipPath: 'polygon(20% 0%, 80% 0%, 100% 35%, 50% 100%, 0% 35%)' };
      }
    })();

    const animMap: Record<string, string> = {
      pulse: `badge-pulse ${cfg.anim_speed_ms}ms ease-in-out infinite`,
      spin: `badge-spin ${cfg.anim_speed_ms}ms linear infinite`,
      shimmer: `badge-shimmer ${cfg.anim_speed_ms}ms ease-in-out infinite`,
      bounce: `badge-bounce ${cfg.anim_speed_ms}ms ease-in-out infinite`,
      rainbow: `badge-rainbow ${cfg.anim_speed_ms}ms linear infinite`,
      breathe: `badge-breathe ${cfg.anim_speed_ms}ms ease-in-out infinite`,
    };
    const anim = cfg.animation !== 'none' ? animMap[cfg.animation] : undefined;
    const glowAlpha = Math.round(cfg.glow_intensity * 255).toString(16).padStart(2, '0');
    const glowShadow = cfg.glow_enabled ? `0 0 ${cfg.glow_blur}px ${cfg.glow_color}${glowAlpha}` : 'none';
    const glowAnim = cfg.glow_enabled && cfg.glow_pulse ? `, badge-glow-pulse 1.5s ease-in-out infinite` : '';

    return (
      <div
        className="flex items-center justify-center relative"
        style={{
          width: size, height: size,
          background: bg,
          opacity: cfg.bg_opacity,
          border: cfg.border_enabled ? `${cfg.border_width}px ${cfg.border_style} ${cfg.border_color}` : 'none',
          boxShadow: glowShadow,
          animation: (anim || '') + (cfg.glow_enabled && cfg.glow_pulse ? glowAnim : ''),
          ...shapeStyle,
        } as React.CSSProperties}
      >
        {/* Tier label öncelik — ikona göre üstün */}
        {cfg.tier_label_override ? (
          <span style={{
            color: cfg.tier_label_color,
            fontSize: (size / 24) * cfg.tier_label_font_size,
            fontWeight: 900,
            letterSpacing: 0.5,
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            lineHeight: 1,
          }}>{cfg.tier_label_override}</span>
        ) : cfg.icon_type === 'custom' && cfg.custom_image_url ? (
          <img src={cfg.custom_image_url} alt="" className="object-contain"
            style={{ width: size * cfg.icon_size_ratio, height: size * cfg.icon_size_ratio }} />
        ) : Icon ? (
          <Icon style={{ width: size * cfg.icon_size_ratio, height: size * cfg.icon_size_ratio, color: cfg.icon_color }} />
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <style>{`
        @keyframes badge-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(${1 + cfg.anim_amplitude * 0.25})} }
        @keyframes badge-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes badge-shimmer { 0%{filter:brightness(1)} 50%{filter:brightness(${1 + cfg.anim_amplitude})} 100%{filter:brightness(1)} }
        @keyframes badge-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-${cfg.anim_amplitude * 6}px)} }
        @keyframes badge-rainbow { 0%{filter:hue-rotate(0)} 100%{filter:hue-rotate(360deg)} }
        @keyframes badge-breathe { 0%,100%{opacity:${1 - cfg.anim_amplitude * 0.3}} 50%{opacity:1} }
        @keyframes badge-glow-pulse { 0%,100%{box-shadow: 0 0 ${cfg.glow_blur * 0.6}px ${cfg.glow_color}} 50%{box-shadow: 0 0 ${cfg.glow_blur * 1.4}px ${cfg.glow_color}} }
      `}</style>

      {/* Solo */}
      <div className="rounded-lg bg-slate-800/40 p-4 flex items-center justify-center">
        <div className="text-center space-y-2">
          {renderBadge(cfg.size * 2)}
          <div className="text-[10px] text-slate-500">Solo (2x boyut)</div>
        </div>
      </div>

      {/* Avatar üzerinde */}
      <div className="rounded-lg bg-slate-800/40 p-4">
        <div className="text-[10px] text-slate-500 mb-2 text-center">Avatar üzerinde ({cfg.position})</div>
        <div className="flex justify-center">
          <div className="relative" style={{ width: 80, height: 80 }}>
            <div className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500" style={{ width: 80, height: 80 }} />
            {cfg.visible_on_avatar && (
              <div
                className="absolute"
                style={{
                  ...({
                    topRight: { top: -2, right: -2 }, topLeft: { top: -2, left: -2 },
                    bottomRight: { bottom: -2, right: -2 }, bottomLeft: { bottom: -2, left: -2 },
                    inline: { display: 'none' },
                  }[cfg.position]),
                  transform: `translate(${cfg.offset_x}%, ${cfg.offset_y}%)`,
                  zIndex: cfg.z_index,
                }}
              >
                {renderBadge(80 * cfg.scale_on_avatar)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* İnline (isim yanında) */}
      {cfg.visible_inline_with_name && (
        <div className="rounded-lg bg-slate-800/40 p-3 flex items-center justify-center gap-2">
          <span className="text-sm text-slate-200 font-semibold">Burak</span>
          {renderBadge(cfg.size)}
        </div>
      )}
    </div>
  );
}
