"use client";

/**
 * Tema Editörü — uygulama renk paleti, yüzey, yazı, gradient, dark/light.
 * 8 sekme: Ana Renkler / Yüzey / Yazı / Gradient / Köşe & Boşluk / Animasyon / Mod / Genel
 */
import React, { useReducer, useTransition } from 'react';
import { Save, RotateCcw, Palette, Square, Type as TypeIcon, Layers, Move, Activity, Sun, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { saveThemeConfig } from './actions';

type Tab = 'primary' | 'surface' | 'text' | 'gradient' | 'radii' | 'anim' | 'mode' | 'general';
type ModeType = 'dark' | 'light' | 'auto';

interface ThemeConfig {
  // Ana renkler
  color_primary: string;
  color_primary_hover: string;
  color_secondary: string;
  color_accent: string;
  color_success: string;
  color_warning: string;
  color_danger: string;
  color_info: string;
  // Yüzey
  surface_bg: string;
  surface_card: string;
  surface_elevated: string;
  surface_overlay: string;
  surface_modal: string;
  surface_border: string;
  surface_divider: string;
  // Yazı
  text_primary: string;
  text_secondary: string;
  text_tertiary: string;
  text_inverse: string;
  text_link: string;
  text_muted: string;
  // Gradient (önceden tanımlı kombolar)
  gradient_brand_from: string;
  gradient_brand_to: string;
  gradient_brand_angle: number;
  gradient_premium_from: string;
  gradient_premium_to: string;
  gradient_danger_from: string;
  gradient_danger_to: string;
  // Köşeler & boşluk
  radius_sm: number;
  radius_md: number;
  radius_lg: number;
  radius_xl: number;
  radius_pill: number;
  spacing_unit: number;     // 4 (px tabanlı)
  // Animasyon
  transition_fast_ms: number;
  transition_normal_ms: number;
  transition_slow_ms: number;
  easing_default: string;   // 'ease-in-out' | 'cubic-bezier(.4,0,.2,1)' vs.
  // Mod
  mode: ModeType;
  light_inverse_enabled: boolean;
  light_surface_bg: string;
  light_text_primary: string;
  auto_match_system: boolean;
  // Genel
  is_premium_only: boolean;
  preview_in_settings: boolean;
  description: string;
}

const DEFAULT_CFG: ThemeConfig = {
  color_primary: '#14B8A6',
  color_primary_hover: '#0D9488',
  color_secondary: '#A78BFA',
  color_accent: '#FBBF24',
  color_success: '#10B981',
  color_warning: '#F59E0B',
  color_danger: '#EF4444',
  color_info: '#3B82F6',
  surface_bg: '#0A0F1A',
  surface_card: '#0F1926',
  surface_elevated: '#1E293B',
  surface_overlay: 'rgba(15,25,38,0.85)',
  surface_modal: '#0F1926',
  surface_border: 'rgba(255,255,255,0.08)',
  surface_divider: 'rgba(255,255,255,0.04)',
  text_primary: '#F1F5F9',
  text_secondary: '#CBD5E1',
  text_tertiary: '#94A3B8',
  text_inverse: '#0F172A',
  text_link: '#22D3EE',
  text_muted: '#64748B',
  gradient_brand_from: '#14B8A6',
  gradient_brand_to: '#06B6D4',
  gradient_brand_angle: 135,
  gradient_premium_from: '#FBBF24',
  gradient_premium_to: '#F472B6',
  gradient_danger_from: '#EF4444',
  gradient_danger_to: '#DC2626',
  radius_sm: 6,
  radius_md: 12,
  radius_lg: 18,
  radius_xl: 24,
  radius_pill: 999,
  spacing_unit: 4,
  transition_fast_ms: 150,
  transition_normal_ms: 300,
  transition_slow_ms: 500,
  easing_default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  mode: 'dark',
  light_inverse_enabled: false,
  light_surface_bg: '#FFFFFF',
  light_text_primary: '#0F172A',
  auto_match_system: false,
  is_premium_only: false,
  preview_in_settings: true,
  description: '',
};

function reducer(state: ThemeConfig, action: Partial<ThemeConfig> | { reset: true }): ThemeConfig {
  if ('reset' in action) return DEFAULT_CFG;
  return { ...state, ...action };
}

export default function ThemeEditor({ item }: { item: any }) {
  const initial: ThemeConfig = { ...DEFAULT_CFG, ...((item.editor_config as any)?.theme_config || {}) };
  const [cfg, dispatch] = useReducer(reducer, initial);
  const [tab, setTab] = React.useState<Tab>('primary');
  const [saving, startSave] = useTransition();
  const [status, setStatus] = React.useState<string | null>(null);

  const upd = (patch: Partial<ThemeConfig>) => dispatch(patch);

  const handleSave = () => {
    setStatus(null);
    startSave(async () => {
      const res = await saveThemeConfig(item.id, cfg as any);
      setStatus(res.ok ? '✓ Kaydedildi' : `✗ Hata: ${res.error}`);
      setTimeout(() => setStatus(null), 3000);
    });
  };

  const TABS: { k: Tab; l: string; i: React.ReactNode }[] = [
    { k: 'primary',  l: 'Renkler',   i: <Palette className="w-3.5 h-3.5" /> },
    { k: 'surface',  l: 'Yüzey',     i: <Square className="w-3.5 h-3.5" /> },
    { k: 'text',     l: 'Yazı',      i: <TypeIcon className="w-3.5 h-3.5" /> },
    { k: 'gradient', l: 'Gradient',  i: <Layers className="w-3.5 h-3.5" /> },
    { k: 'radii',    l: 'Köşe',      i: <Move className="w-3.5 h-3.5" /> },
    { k: 'anim',     l: 'Anim',      i: <Activity className="w-3.5 h-3.5" /> },
    { k: 'mode',     l: 'Mod',       i: <Sun className="w-3.5 h-3.5" /> },
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
                  ? 'bg-gradient-to-r from-rose-500/30 to-pink-500/20 text-rose-100 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}>
              {t.i}{t.l}
            </button>
          ))}
        </div>

        <div className="pb-20 space-y-3">
          {tab === 'primary' && <PrimaryPanel cfg={cfg} upd={upd} />}
          {tab === 'surface' && <SurfacePanel cfg={cfg} upd={upd} />}
          {tab === 'text' && <TextPanel cfg={cfg} upd={upd} />}
          {tab === 'gradient' && <GradientPanel cfg={cfg} upd={upd} />}
          {tab === 'radii' && <RadiiPanel cfg={cfg} upd={upd} />}
          {tab === 'anim' && <AnimPanel cfg={cfg} upd={upd} />}
          {tab === 'mode' && <ModePanel cfg={cfg} upd={upd} />}
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 hover:opacity-90 disabled:opacity-50">
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
          <ThemePreview cfg={cfg} />
        </div>
      </div>
    </div>
  );
}

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
function Slider({ label, min, max, step, value, onChange, display }: any) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span><span className="text-slate-200 font-mono">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-rose-500" />
    </label>
  );
}
function Toggle({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-slate-400">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-rose-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
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

function PrimaryPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Marka Renkleri" hint="Butonlar, link'ler, vurgular için ana paleti">
        <ColorField label="Primary (Ana Renk)" value={cfg.color_primary} onChange={(v: string) => upd({ color_primary: v })} />
        <ColorField label="Primary Hover" value={cfg.color_primary_hover} onChange={(v: string) => upd({ color_primary_hover: v })} />
        <ColorField label="Secondary (İkincil)" value={cfg.color_secondary} onChange={(v: string) => upd({ color_secondary: v })} />
        <ColorField label="Accent (Vurgu)" value={cfg.color_accent} onChange={(v: string) => upd({ color_accent: v })} />
      </Section>
      <Section title="Durum Renkleri">
        <ColorField label="Success (Başarı)" value={cfg.color_success} onChange={(v: string) => upd({ color_success: v })} />
        <ColorField label="Warning (Uyarı)" value={cfg.color_warning} onChange={(v: string) => upd({ color_warning: v })} />
        <ColorField label="Danger (Hata)" value={cfg.color_danger} onChange={(v: string) => upd({ color_danger: v })} />
        <ColorField label="Info (Bilgi)" value={cfg.color_info} onChange={(v: string) => upd({ color_info: v })} />
      </Section>
    </div>
  );
}

function SurfacePanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Arka Plan Katmanları">
        <ColorField label="BG (Ana Arka Plan)" value={cfg.surface_bg} onChange={(v: string) => upd({ surface_bg: v })} />
        <ColorField label="Card (Kart)" value={cfg.surface_card} onChange={(v: string) => upd({ surface_card: v })} />
        <ColorField label="Elevated (Yükseltilmiş)" value={cfg.surface_elevated} onChange={(v: string) => upd({ surface_elevated: v })} />
        <ColorField label="Modal (Modal Arka)" value={cfg.surface_modal} onChange={(v: string) => upd({ surface_modal: v })} />
        <ColorField label="Overlay (Modal Backdrop)" value={cfg.surface_overlay} onChange={(v: string) => upd({ surface_overlay: v })} />
      </Section>
      <Section title="Sınır & Ayraç">
        <ColorField label="Border (Sınır)" value={cfg.surface_border} onChange={(v: string) => upd({ surface_border: v })} />
        <ColorField label="Divider (Ayraç)" value={cfg.surface_divider} onChange={(v: string) => upd({ surface_divider: v })} />
      </Section>
    </div>
  );
}

function TextPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Metin Renkleri">
        <ColorField label="Primary (Ana Yazı)" value={cfg.text_primary} onChange={(v: string) => upd({ text_primary: v })} />
        <ColorField label="Secondary (İkincil Yazı)" value={cfg.text_secondary} onChange={(v: string) => upd({ text_secondary: v })} />
        <ColorField label="Tertiary (Açıklama)" value={cfg.text_tertiary} onChange={(v: string) => upd({ text_tertiary: v })} />
        <ColorField label="Muted (Soluk)" value={cfg.text_muted} onChange={(v: string) => upd({ text_muted: v })} />
        <ColorField label="Inverse (Beyaz Üzerinde)" value={cfg.text_inverse} onChange={(v: string) => upd({ text_inverse: v })} />
        <ColorField label="Link" value={cfg.text_link} onChange={(v: string) => upd({ text_link: v })} />
      </Section>
    </div>
  );
}

function GradientPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Marka Gradienti">
        <ColorField label="Başlangıç" value={cfg.gradient_brand_from} onChange={(v: string) => upd({ gradient_brand_from: v })} />
        <ColorField label="Bitiş" value={cfg.gradient_brand_to} onChange={(v: string) => upd({ gradient_brand_to: v })} />
        <Slider label="Açı" min={0} max={360} step={5} value={cfg.gradient_brand_angle} onChange={(v: number) => upd({ gradient_brand_angle: v })} display={`${cfg.gradient_brand_angle}°`} />
      </Section>
      <Section title="Premium Gradienti">
        <ColorField label="Başlangıç" value={cfg.gradient_premium_from} onChange={(v: string) => upd({ gradient_premium_from: v })} />
        <ColorField label="Bitiş" value={cfg.gradient_premium_to} onChange={(v: string) => upd({ gradient_premium_to: v })} />
      </Section>
      <Section title="Tehlike Gradienti">
        <ColorField label="Başlangıç" value={cfg.gradient_danger_from} onChange={(v: string) => upd({ gradient_danger_from: v })} />
        <ColorField label="Bitiş" value={cfg.gradient_danger_to} onChange={(v: string) => upd({ gradient_danger_to: v })} />
      </Section>
    </div>
  );
}

function RadiiPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Köşe Yuvarlamaları" hint="Uygulamada kullanılan radius skalası">
        <Slider label="Small (sm)" min={0} max={16} step={1} value={cfg.radius_sm} onChange={(v: number) => upd({ radius_sm: v })} display={`${cfg.radius_sm}px`} />
        <Slider label="Medium (md)" min={4} max={28} step={1} value={cfg.radius_md} onChange={(v: number) => upd({ radius_md: v })} display={`${cfg.radius_md}px`} />
        <Slider label="Large (lg)" min={8} max={40} step={1} value={cfg.radius_lg} onChange={(v: number) => upd({ radius_lg: v })} display={`${cfg.radius_lg}px`} />
        <Slider label="X-Large (xl)" min={12} max={60} step={1} value={cfg.radius_xl} onChange={(v: number) => upd({ radius_xl: v })} display={`${cfg.radius_xl}px`} />
      </Section>
      <Section title="Boşluk Birimi">
        <Slider label="Spacing Unit" min={2} max={8} step={1} value={cfg.spacing_unit} onChange={(v: number) => upd({ spacing_unit: v })} display={`${cfg.spacing_unit}px`} />
      </Section>
    </div>
  );
}

function AnimPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Geçiş Süreleri">
        <Slider label="Hızlı" min={50} max={500} step={25} value={cfg.transition_fast_ms} onChange={(v: number) => upd({ transition_fast_ms: v })} display={`${cfg.transition_fast_ms}ms`} />
        <Slider label="Normal" min={100} max={800} step={25} value={cfg.transition_normal_ms} onChange={(v: number) => upd({ transition_normal_ms: v })} display={`${cfg.transition_normal_ms}ms`} />
        <Slider label="Yavaş" min={200} max={1500} step={50} value={cfg.transition_slow_ms} onChange={(v: number) => upd({ transition_slow_ms: v })} display={`${cfg.transition_slow_ms}ms`} />
      </Section>
      <Section title="Easing (Hareket Eğrisi)">
        <SelectField label="Default" value={cfg.easing_default} options={[
          { value: 'ease', label: 'Ease' },
          { value: 'ease-in', label: 'Ease In' },
          { value: 'ease-out', label: 'Ease Out' },
          { value: 'ease-in-out', label: 'Ease In Out' },
          { value: 'linear', label: 'Linear' },
          { value: 'cubic-bezier(0.4, 0, 0.2, 1)', label: 'Material Standard' },
          { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Bouncy' },
        ]} onChange={(v: string) => upd({ easing_default: v })} />
      </Section>
    </div>
  );
}

function ModePanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Tema Modu">
        <SelectField label="Mod" value={cfg.mode} options={[
          { value: 'dark', label: '🌙 Karanlık' },
          { value: 'light', label: '☀ Aydınlık' },
          { value: 'auto', label: '🔄 Sistem Otomatik' },
        ]} onChange={(v: any) => upd({ mode: v })} />
        <Toggle label="Sistem Modunu Takip Et" checked={cfg.auto_match_system} onChange={(v: boolean) => upd({ auto_match_system: v })} />
        <Toggle label="Aydınlık Mod İnverse Desteği" checked={cfg.light_inverse_enabled} onChange={(v: boolean) => upd({ light_inverse_enabled: v })} />
        {cfg.light_inverse_enabled && (<>
          <ColorField label="Aydınlık BG" value={cfg.light_surface_bg} onChange={(v: string) => upd({ light_surface_bg: v })} />
          <ColorField label="Aydınlık Yazı" value={cfg.light_text_primary} onChange={(v: string) => upd({ light_text_primary: v })} />
        </>)}
      </Section>
    </div>
  );
}

function GeneralPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Temayı Aktif Et">
        <Toggle label="Premium (yalnızca Plus/Pro)" checked={cfg.is_premium_only} onChange={(v: boolean) => upd({ is_premium_only: v })} />
        <Toggle label="Ayarlarda Önizleme Göster" checked={cfg.preview_in_settings} onChange={(v: boolean) => upd({ preview_in_settings: v })} />
      </Section>
      <Section title="Açıklama">
        <TextField label="Tema Açıklaması" value={cfg.description} onChange={(v: string) => upd({ description: v })} placeholder="Bu temanın hissi ve kullanım önerisi…" />
      </Section>
    </div>
  );
}

/* ─── Preview — Mobil ekran birebir simülasyonu (3 sekme: Profil / Oda / Sohbet) ─── */
function ThemePreview({ cfg }: { cfg: ThemeConfig }) {
  const [screen, setScreen] = React.useState<'profile' | 'room' | 'chat'>('profile');
  const W = 320, H = 600;

  return (
    <div className="space-y-2">
      {/* Ekran seçici */}
      <div className="flex items-center gap-1 bg-slate-900/40 border border-slate-700/30 rounded-lg p-1">
        {([
          { k: 'profile', l: 'Profil' },
          { k: 'room',    l: 'Oda' },
          { k: 'chat',    l: 'Sohbet' },
        ] as const).map(t => (
          <button key={t.k} type="button" onClick={() => setScreen(t.k)}
            className={`flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
              screen === t.k
                ? 'bg-gradient-to-r from-rose-500/30 to-pink-500/20 text-rose-100 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}>{t.l}</button>
        ))}
      </div>

      {/* Mobile shell */}
      <div className="mx-auto rounded-[28px] border-[3px] border-slate-700 overflow-hidden relative"
        style={{ width: W, height: H, background: cfg.surface_bg, boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1.5 text-[10px]" style={{ color: cfg.text_primary, background: cfg.surface_bg }}>
          <span style={{ fontWeight: 600 }}>22:48</span>
          <div className="w-12 h-2 rounded-full" style={{ background: cfg.text_tertiary }} />
          <span style={{ fontWeight: 600 }}>📶 🔋</span>
        </div>

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-2xl" />

        {/* Screen content */}
        <div className="flex-1 overflow-hidden" style={{ background: cfg.surface_bg, height: H - 80 }}>
          {screen === 'profile' && <ProfileMock cfg={cfg} />}
          {screen === 'room' && <RoomMock cfg={cfg} />}
          {screen === 'chat' && <ChatMock cfg={cfg} />}
        </div>

        {/* Tab bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-3 px-4"
          style={{ background: cfg.surface_elevated, borderTop: `1px solid ${cfg.surface_divider}` }}>
          {['🏠', '💬', '🎙', '🔔', '👤'].map((icon, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span style={{ fontSize: 18, opacity: i === (screen === 'profile' ? 4 : screen === 'room' ? 2 : 1) ? 1 : 0.4 }}>{icon}</span>
              <div style={{ width: 4, height: 4, borderRadius: 2,
                background: i === (screen === 'profile' ? 4 : screen === 'room' ? 2 : 1) ? cfg.color_primary : 'transparent'
              }} />
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-slate-500 leading-relaxed text-center">
        Üst sekmelerden ekran değiştir — slider'ı çevirdiğin değer hangi ekranda görünüyor anla.
      </div>
    </div>
  );
}

function ProfileMock({ cfg }: { cfg: ThemeConfig }) {
  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div style={{ color: cfg.text_primary, fontSize: 18, fontWeight: 800 }}>Profilim</div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: cfg.surface_elevated }}>⚙</div>
      </div>

      {/* Avatar + isim */}
      <div className="flex flex-col items-center py-3">
        <div className="w-20 h-20 rounded-full"
          style={{ background: `linear-gradient(${cfg.gradient_brand_angle}deg, ${cfg.gradient_brand_from}, ${cfg.gradient_brand_to})` }} />
        <div className="mt-2" style={{ color: cfg.text_primary, fontSize: 16, fontWeight: 700 }}>Murat Berxo</div>
        <div style={{ color: cfg.text_tertiary, fontSize: 11 }}>@muratb</div>
        <div className="mt-2 px-3 py-1 rounded-full"
          style={{ background: `linear-gradient(135deg, ${cfg.gradient_premium_from}, ${cfg.gradient_premium_to})`, color: '#0F172A', fontSize: 11, fontWeight: 700 }}>
          PRO
        </div>
      </div>

      {/* Stat kartlar */}
      <div className="grid grid-cols-3 gap-2">
        {[{ n: 248, l: 'Takipçi', c: cfg.color_primary }, { n: 142, l: 'Takip', c: cfg.color_info }, { n: 12, l: 'Oda', c: cfg.color_accent }].map((s, i) => (
          <div key={i} className="rounded-lg p-2.5 text-center" style={{ background: cfg.surface_card, borderRadius: cfg.radius_md, border: `1px solid ${cfg.surface_border}` }}>
            <div style={{ color: s.c, fontSize: 16, fontWeight: 800 }}>{s.n}</div>
            <div style={{ color: cfg.text_tertiary, fontSize: 9 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Aksiyon butonları */}
      <button type="button" className="w-full py-2.5 text-sm font-bold"
        style={{ background: `linear-gradient(${cfg.gradient_brand_angle}deg, ${cfg.gradient_brand_from}, ${cfg.gradient_brand_to})`, color: '#FFF', borderRadius: cfg.radius_md }}>
        Profili Düzenle
      </button>

      {/* Liste kartı */}
      <div className="rounded-lg p-3" style={{ background: cfg.surface_card, borderRadius: cfg.radius_md, border: `1px solid ${cfg.surface_border}` }}>
        <div style={{ color: cfg.text_primary, fontSize: 12, fontWeight: 700 }}>Durum Mesajı</div>
        <div style={{ color: cfg.text_secondary, fontSize: 11 }} className="mt-1">Bugün enerjik hissediyorum 🎵</div>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-0.5 text-[9px] font-semibold rounded-full"
            style={{ background: cfg.color_success + '22', color: cfg.color_success, border: `1px solid ${cfg.color_success}55` }}>Aktif</span>
          <span className="px-2 py-0.5 text-[9px] rounded-full" style={{ color: cfg.text_link }}>3 saat önce</span>
        </div>
      </div>
    </div>
  );
}

function RoomMock({ cfg }: { cfg: ThemeConfig }) {
  return (
    <div className="p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div style={{ color: cfg.text_primary, fontSize: 14, fontWeight: 700 }}>📚 Felsefe Sohbeti</div>
          <div style={{ color: cfg.text_tertiary, fontSize: 10 }}>· 24 dinleyici</div>
        </div>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: cfg.color_danger }} />
      </div>

      {/* Speakers */}
      <div className="text-[10px] uppercase tracking-wider" style={{ color: cfg.text_tertiary }}>Sahnede</div>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full"
              style={{
                background: i === 1
                  ? `linear-gradient(135deg, ${cfg.gradient_premium_from}, ${cfg.gradient_premium_to})`
                  : cfg.surface_elevated,
                border: i === 1 ? `2px solid ${cfg.color_accent}` : `2px solid ${cfg.color_primary}`,
              }} />
            <div className="mt-1 text-[10px] font-semibold" style={{ color: i === 1 ? cfg.color_accent : cfg.text_primary }}>
              {i === 1 ? 'Host' : `Konuş ${i}`}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px my-2" style={{ background: cfg.surface_divider }} />

      {/* Listeners */}
      <div className="text-[10px] uppercase tracking-wider" style={{ color: cfg.text_tertiary }}>Dinleyiciler</div>
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-9 h-9 rounded-full"
            style={{ background: i % 3 === 0 ? cfg.color_secondary + '60' : cfg.surface_elevated }} />
        ))}
      </div>

      {/* Control bar */}
      <div className="rounded-lg flex items-center justify-around py-2 mt-3"
        style={{ background: cfg.surface_overlay, borderRadius: cfg.radius_lg, border: `1px solid ${cfg.surface_border}` }}>
        {[
          { icon: '🎙', bg: cfg.color_success },
          { icon: '📷', bg: cfg.surface_elevated },
          { icon: '👋', bg: cfg.surface_elevated },
          { icon: '💎', bg: cfg.surface_elevated },
          { icon: '✕', bg: cfg.color_danger },
        ].map((b, i) => (
          <div key={i} className="w-9 h-9 rounded-full flex items-center justify-center text-sm"
            style={{ background: b.bg }}>{b.icon}</div>
        ))}
      </div>
    </div>
  );
}

function ChatMock({ cfg }: { cfg: ThemeConfig }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${cfg.surface_divider}` }}>
        <div className="w-8 h-8 rounded-full" style={{ background: cfg.color_secondary }} />
        <div className="flex-1">
          <div style={{ color: cfg.text_primary, fontSize: 13, fontWeight: 700 }}>Ahmet</div>
          <div style={{ color: cfg.color_success, fontSize: 10 }}>● çevrimiçi</div>
        </div>
        <span style={{ color: cfg.color_primary, fontSize: 18 }}>📞</span>
      </div>

      {/* Mesajlar */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        <div className="flex">
          <div className="max-w-[70%] px-3 py-2 rounded-xl"
            style={{ background: cfg.surface_card, color: cfg.text_primary, fontSize: 12, borderRadius: cfg.radius_lg, border: `1px solid ${cfg.surface_border}` }}>
            Hey nasılsın? 👋
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[70%] px-3 py-2"
            style={{ background: `linear-gradient(135deg, ${cfg.gradient_brand_from}, ${cfg.gradient_brand_to})`, color: '#FFF', fontSize: 12, borderRadius: cfg.radius_lg }}>
            İyi sen?
          </div>
        </div>
        <div className="flex">
          <div className="max-w-[70%] px-3 py-2 rounded-xl"
            style={{ background: cfg.surface_card, color: cfg.text_primary, fontSize: 12, borderRadius: cfg.radius_lg, border: `1px solid ${cfg.surface_border}` }}>
            <span style={{ color: cfg.text_link }}>https://soprano.com/oda</span>
            <div style={{ color: cfg.text_tertiary, fontSize: 10, marginTop: 4 }}>3 dk önce · düzenlendi</div>
          </div>
        </div>
        <div className="flex justify-end">
          <span className="px-2 py-0.5 text-[9px] rounded-full font-semibold"
            style={{ background: cfg.color_success + '22', color: cfg.color_success }}>okundu ✓✓</span>
        </div>
      </div>

      {/* Input bar */}
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderTop: `1px solid ${cfg.surface_divider}`, background: cfg.surface_elevated }}>
        <span style={{ color: cfg.text_tertiary }}>😊</span>
        <input type="text" placeholder="Mesaj yaz..."
          className="flex-1 px-3 py-1.5 text-xs outline-none"
          style={{ background: cfg.surface_bg, color: cfg.text_primary, borderRadius: cfg.radius_pill, border: `1px solid ${cfg.surface_border}` }} />
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: cfg.color_primary, color: '#FFF', fontSize: 14 }}>→</div>
      </div>
    </div>
  );
}
