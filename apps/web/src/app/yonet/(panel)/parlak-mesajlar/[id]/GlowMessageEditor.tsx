"use client";

/**
 * Parlak Mesaj Editörü — sohbet baloncuğunun parıltı/glow/animasyon ayarları
 * ════════════════════════════════════════════════════════════════════
 * 6 sekme: Baloncuk / Glow / Yazı / Animasyon / Sınır / Genel
 * Canlı önizleme: gerçek sohbet mock'u + 3 baloncuk
 */
import React, { useReducer, useTransition } from 'react';
import { Save, RotateCcw, MessageSquare, Sparkles, Type as TypeIcon, Activity, Square, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { saveGlowMessageConfig } from './actions';

type Tab = 'bubble' | 'glow' | 'text' | 'anim' | 'border' | 'general';
type BubbleShape = 'rounded' | 'pill' | 'square' | 'speech';
type GlowAnim = 'none' | 'pulse' | 'breathe' | 'shimmer' | 'rainbow';
type TextAnim = 'none' | 'fade-in' | 'typewriter' | 'glow-pulse' | 'shake';

interface GlowMessageConfig {
  // Baloncuk
  bubble_bg_color: string;
  bubble_bg_gradient_enabled: boolean;
  bubble_bg_gradient_top: string;
  bubble_bg_gradient_bottom: string;
  bubble_shape: BubbleShape;
  bubble_border_radius: number;
  bubble_padding_x: number;
  bubble_padding_y: number;
  bubble_opacity: number;
  // Glow
  glow_enabled: boolean;
  glow_color: string;
  glow_intensity: number;       // 0-1
  glow_blur: number;            // px
  glow_spread: number;          // px
  glow_inset: boolean;          // iç glow
  // Yazı
  text_color: string;
  text_font_size: number;
  text_font_weight: string;
  text_shadow_enabled: boolean;
  text_shadow_color: string;
  text_shadow_offset_y: number;
  text_shadow_blur: number;
  text_stroke_enabled: boolean;
  text_stroke_color: string;
  text_stroke_width: number;
  text_letter_spacing: number;
  // Animasyon
  glow_animation: GlowAnim;
  glow_anim_speed_ms: number;
  glow_anim_amplitude: number;  // 0-1
  text_animation: TextAnim;
  text_anim_speed_ms: number;
  bubble_pulse: boolean;
  bubble_pulse_scale: number;   // 1.0-1.15
  rainbow_speed_sec: number;
  // Sınır
  border_enabled: boolean;
  border_color: string;
  border_width: number;
  border_style: 'solid' | 'dashed' | 'dotted' | 'double';
  border_gradient_enabled: boolean;
  border_gradient_from: string;
  border_gradient_to: string;
  // Genel
  visible_in_chat: boolean;
  visible_in_dm: boolean;
  visible_in_room: boolean;
  priority_above_normal: boolean;
}

const DEFAULT_CFG: GlowMessageConfig = {
  bubble_bg_color: 'rgba(20,184,166,0.18)',
  bubble_bg_gradient_enabled: false,
  bubble_bg_gradient_top: '#14B8A6',
  bubble_bg_gradient_bottom: '#0E7490',
  bubble_shape: 'rounded',
  bubble_border_radius: 16,
  bubble_padding_x: 14,
  bubble_padding_y: 10,
  bubble_opacity: 1,
  glow_enabled: true,
  glow_color: '#14B8A6',
  glow_intensity: 0.6,
  glow_blur: 18,
  glow_spread: 2,
  glow_inset: false,
  text_color: '#F1F5F9',
  text_font_size: 14,
  text_font_weight: '600',
  text_shadow_enabled: true,
  text_shadow_color: 'rgba(0,0,0,0.5)',
  text_shadow_offset_y: 1,
  text_shadow_blur: 2,
  text_stroke_enabled: false,
  text_stroke_color: 'rgba(0,0,0,0.5)',
  text_stroke_width: 0.5,
  text_letter_spacing: 0,
  glow_animation: 'pulse',
  glow_anim_speed_ms: 1600,
  glow_anim_amplitude: 0.3,
  text_animation: 'none',
  text_anim_speed_ms: 800,
  bubble_pulse: false,
  bubble_pulse_scale: 1.04,
  rainbow_speed_sec: 6,
  border_enabled: false,
  border_color: '#14B8A6',
  border_width: 1,
  border_style: 'solid',
  border_gradient_enabled: false,
  border_gradient_from: '#14B8A6',
  border_gradient_to: '#A78BFA',
  visible_in_chat: true,
  visible_in_dm: true,
  visible_in_room: true,
  priority_above_normal: false,
};

function reducer(state: GlowMessageConfig, action: Partial<GlowMessageConfig> | { reset: true }): GlowMessageConfig {
  if ('reset' in action) return DEFAULT_CFG;
  return { ...state, ...action };
}

export default function GlowMessageEditor({ item }: { item: any }) {
  const initial: GlowMessageConfig = { ...DEFAULT_CFG, ...((item.editor_config as any)?.glow_config || {}) };
  const [cfg, dispatch] = useReducer(reducer, initial);
  const [tab, setTab] = React.useState<Tab>('bubble');
  const [saving, startSave] = useTransition();
  const [status, setStatus] = React.useState<string | null>(null);

  const upd = (patch: Partial<GlowMessageConfig>) => dispatch(patch);

  const handleSave = () => {
    setStatus(null);
    startSave(async () => {
      const res = await saveGlowMessageConfig(item.id, cfg as any);
      setStatus(res.ok ? '✓ Kaydedildi' : `✗ Hata: ${res.error}`);
      setTimeout(() => setStatus(null), 3000);
    });
  };

  const TABS: { k: Tab; l: string; i: React.ReactNode }[] = [
    { k: 'bubble',  l: 'Baloncuk',  i: <MessageSquare className="w-3.5 h-3.5" /> },
    { k: 'glow',    l: 'Glow',      i: <Sparkles className="w-3.5 h-3.5" /> },
    { k: 'text',    l: 'Yazı',      i: <TypeIcon className="w-3.5 h-3.5" /> },
    { k: 'anim',    l: 'Animasyon', i: <Activity className="w-3.5 h-3.5" /> },
    { k: 'border',  l: 'Sınır',     i: <Square className="w-3.5 h-3.5" /> },
    { k: 'general', l: 'Genel',     i: <SettingsIcon className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start">
      {/* SOL — config */}
      <div className="flex-1 min-w-0 w-full space-y-3">
        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-700/40 rounded-xl p-1 overflow-x-auto sticky top-0 z-10 backdrop-blur">
          {TABS.map(t => (
            <button key={t.k} type="button" onClick={() => setTab(t.k)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.k
                  ? 'bg-gradient-to-r from-teal-500/30 to-cyan-500/20 text-cyan-100 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}>
              {t.i}{t.l}
            </button>
          ))}
        </div>

        <div className="pb-20 space-y-3">
          {tab === 'bubble' && <BubblePanel cfg={cfg} upd={upd} />}
          {tab === 'glow' && <GlowPanel cfg={cfg} upd={upd} />}
          {tab === 'text' && <TextPanel cfg={cfg} upd={upd} />}
          {tab === 'anim' && <AnimPanel cfg={cfg} upd={upd} />}
          {tab === 'border' && <BorderPanel cfg={cfg} upd={upd} />}
          {tab === 'general' && <GeneralPanel cfg={cfg} upd={upd} />}
        </div>

        {/* Action bar */}
        <div className="fixed left-0 right-0 bottom-0 z-50 border-t border-slate-700/50 bg-slate-950/90 backdrop-blur px-4 py-3 lg:left-64">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <button type="button" onClick={() => confirm('Varsayılana dön?') && dispatch({ reset: true })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30">
              <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
            </button>
            <div className="flex items-center gap-3">
              {status && (
                <span className={`text-xs ${status.startsWith('✗') ? 'text-rose-400' : 'text-emerald-400'}`}>{status}</span>
              )}
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30 hover:opacity-90 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SAĞ — preview */}
      <div className="w-full xl:w-[380px] xl:sticky xl:top-4 xl:self-start shrink-0">
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-3">
          <div className="text-xs text-slate-300 mb-3 font-medium">Canlı Önizleme</div>
          <ChatPreview cfg={cfg} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── PANELS ─────────────────── */

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
        <span>{label}</span>
        <span className="text-slate-200 font-mono">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-teal-500" />
    </label>
  );
}

function Toggle({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-slate-400">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-slate-600'}`}>
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

function BubblePanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Şekil & Boyut">
        <SelectField label="Baloncuk Şekli" value={cfg.bubble_shape} options={[
          { value: 'rounded', label: 'Yuvarlatılmış Kare' },
          { value: 'pill', label: 'Pill (Tam Yuvarlak)' },
          { value: 'square', label: 'Kare' },
          { value: 'speech', label: 'Konuşma Balonu' },
        ]} onChange={(v: any) => upd({ bubble_shape: v })} />
        <Slider label="Köşe Yuvarlaması" min={0} max={32} step={1} value={cfg.bubble_border_radius} onChange={(v: number) => upd({ bubble_border_radius: v })} display={`${cfg.bubble_border_radius}px`} />
        <Slider label="Yatay Padding" min={4} max={28} step={1} value={cfg.bubble_padding_x} onChange={(v: number) => upd({ bubble_padding_x: v })} display={`${cfg.bubble_padding_x}px`} />
        <Slider label="Dikey Padding" min={4} max={20} step={1} value={cfg.bubble_padding_y} onChange={(v: number) => upd({ bubble_padding_y: v })} display={`${cfg.bubble_padding_y}px`} />
        <Slider label="Opaklık" min={0.1} max={1} step={0.05} value={cfg.bubble_opacity} onChange={(v: number) => upd({ bubble_opacity: v })} display={`${Math.round(cfg.bubble_opacity * 100)}%`} />
      </Section>
      <Section title="Arka Plan">
        <Toggle label="Gradient Aktif" checked={cfg.bubble_bg_gradient_enabled} onChange={(v: boolean) => upd({ bubble_bg_gradient_enabled: v })} />
        {cfg.bubble_bg_gradient_enabled ? (
          <>
            <ColorField label="Gradient Üst" value={cfg.bubble_bg_gradient_top} onChange={(v: string) => upd({ bubble_bg_gradient_top: v })} />
            <ColorField label="Gradient Alt" value={cfg.bubble_bg_gradient_bottom} onChange={(v: string) => upd({ bubble_bg_gradient_bottom: v })} />
          </>
        ) : (
          <ColorField label="Düz Renk" value={cfg.bubble_bg_color} onChange={(v: string) => upd({ bubble_bg_color: v })} />
        )}
      </Section>
    </div>
  );
}

function GlowPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Glow / Parıltı">
        <Toggle label="Glow Aktif" checked={cfg.glow_enabled} onChange={(v: boolean) => upd({ glow_enabled: v })} />
        {cfg.glow_enabled && (<>
          <ColorField label="Glow Rengi" value={cfg.glow_color} onChange={(v: string) => upd({ glow_color: v })} />
          <Slider label="Şiddet" min={0} max={1} step={0.05} value={cfg.glow_intensity} onChange={(v: number) => upd({ glow_intensity: v })} display={`${Math.round(cfg.glow_intensity * 100)}%`} />
          <Slider label="Bulanıklık (Blur)" min={0} max={60} step={1} value={cfg.glow_blur} onChange={(v: number) => upd({ glow_blur: v })} display={`${cfg.glow_blur}px`} />
          <Slider label="Yayılma (Spread)" min={0} max={20} step={1} value={cfg.glow_spread} onChange={(v: number) => upd({ glow_spread: v })} display={`${cfg.glow_spread}px`} />
          <Toggle label="İç Glow (inset)" checked={cfg.glow_inset} onChange={(v: boolean) => upd({ glow_inset: v })} />
        </>)}
      </Section>
    </div>
  );
}

function TextPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Yazı Stili">
        <ColorField label="Yazı Rengi" value={cfg.text_color} onChange={(v: string) => upd({ text_color: v })} />
        <Slider label="Font Boyutu" min={10} max={22} step={1} value={cfg.text_font_size} onChange={(v: number) => upd({ text_font_size: v })} display={`${cfg.text_font_size}px`} />
        <SelectField label="Font Kalınlığı" value={cfg.text_font_weight} options={[
          { value: '400', label: 'Normal' },
          { value: '500', label: 'Orta' },
          { value: '600', label: 'Yarı Kalın' },
          { value: '700', label: 'Kalın' },
          { value: '800', label: 'Ekstra Kalın' },
        ]} onChange={(v: string) => upd({ text_font_weight: v })} />
        <Slider label="Harf Aralığı" min={-1} max={4} step={0.1} value={cfg.text_letter_spacing} onChange={(v: number) => upd({ text_letter_spacing: v })} display={`${cfg.text_letter_spacing.toFixed(1)}`} />
      </Section>
      <Section title="Yazı Gölgesi">
        <Toggle label="Gölge Aktif" checked={cfg.text_shadow_enabled} onChange={(v: boolean) => upd({ text_shadow_enabled: v })} />
        {cfg.text_shadow_enabled && (<>
          <ColorField label="Gölge Rengi" value={cfg.text_shadow_color} onChange={(v: string) => upd({ text_shadow_color: v })} />
          <Slider label="Y Ofseti" min={0} max={8} step={1} value={cfg.text_shadow_offset_y} onChange={(v: number) => upd({ text_shadow_offset_y: v })} display={`${cfg.text_shadow_offset_y}px`} />
          <Slider label="Yumuşaklık" min={0} max={16} step={1} value={cfg.text_shadow_blur} onChange={(v: number) => upd({ text_shadow_blur: v })} display={`${cfg.text_shadow_blur}px`} />
        </>)}
      </Section>
      <Section title="Çevre Çizgisi (Stroke)">
        <Toggle label="Stroke Aktif" checked={cfg.text_stroke_enabled} onChange={(v: boolean) => upd({ text_stroke_enabled: v })} />
        {cfg.text_stroke_enabled && (<>
          <ColorField label="Stroke Rengi" value={cfg.text_stroke_color} onChange={(v: string) => upd({ text_stroke_color: v })} />
          <Slider label="Stroke Kalınlığı" min={0} max={3} step={0.1} value={cfg.text_stroke_width} onChange={(v: number) => upd({ text_stroke_width: v })} display={`${cfg.text_stroke_width.toFixed(1)}px`} />
        </>)}
      </Section>
    </div>
  );
}

function AnimPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Glow Animasyonu">
        <SelectField label="Animasyon Tipi" value={cfg.glow_animation} options={[
          { value: 'none', label: 'Yok' },
          { value: 'pulse', label: 'Pulse (Nabız)' },
          { value: 'breathe', label: 'Breathe (Nefes)' },
          { value: 'shimmer', label: 'Shimmer (Parıltı)' },
          { value: 'rainbow', label: 'Rainbow (Renk Döngüsü)' },
        ]} onChange={(v: any) => upd({ glow_animation: v })} />
        {cfg.glow_animation !== 'none' && (<>
          <Slider label="Animasyon Hızı" min={400} max={5000} step={100} value={cfg.glow_anim_speed_ms} onChange={(v: number) => upd({ glow_anim_speed_ms: v })} display={`${cfg.glow_anim_speed_ms}ms`} />
          <Slider label="Genlik (Amplitüd)" min={0.1} max={1} step={0.05} value={cfg.glow_anim_amplitude} onChange={(v: number) => upd({ glow_anim_amplitude: v })} display={`${Math.round(cfg.glow_anim_amplitude * 100)}%`} />
        </>)}
        {cfg.glow_animation === 'rainbow' && (
          <Slider label="Rainbow Tur Süresi" min={2} max={15} step={0.5} value={cfg.rainbow_speed_sec} onChange={(v: number) => upd({ rainbow_speed_sec: v })} display={`${cfg.rainbow_speed_sec}sn`} />
        )}
      </Section>
      <Section title="Baloncuk Hareketi">
        <Toggle label="Baloncuk Pulse" checked={cfg.bubble_pulse} onChange={(v: boolean) => upd({ bubble_pulse: v })} />
        {cfg.bubble_pulse && (
          <Slider label="Pulse Ölçeği" min={1} max={1.2} step={0.01} value={cfg.bubble_pulse_scale} onChange={(v: number) => upd({ bubble_pulse_scale: v })} display={`${cfg.bubble_pulse_scale.toFixed(2)}x`} />
        )}
      </Section>
      <Section title="Yazı Animasyonu">
        <SelectField label="Tip" value={cfg.text_animation} options={[
          { value: 'none', label: 'Yok' },
          { value: 'fade-in', label: 'Fade In' },
          { value: 'typewriter', label: 'Daktilo' },
          { value: 'glow-pulse', label: 'Yazı Glow Pulse' },
          { value: 'shake', label: 'Titreşim' },
        ]} onChange={(v: any) => upd({ text_animation: v })} />
        {cfg.text_animation !== 'none' && (
          <Slider label="Hız" min={200} max={3000} step={50} value={cfg.text_anim_speed_ms} onChange={(v: number) => upd({ text_anim_speed_ms: v })} display={`${cfg.text_anim_speed_ms}ms`} />
        )}
      </Section>
    </div>
  );
}

function BorderPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Sınır (Border)">
        <Toggle label="Sınır Aktif" checked={cfg.border_enabled} onChange={(v: boolean) => upd({ border_enabled: v })} />
        {cfg.border_enabled && (<>
          <Slider label="Kalınlık" min={0} max={6} step={1} value={cfg.border_width} onChange={(v: number) => upd({ border_width: v })} display={`${cfg.border_width}px`} />
          <SelectField label="Stil" value={cfg.border_style} options={[
            { value: 'solid', label: 'Düz' }, { value: 'dashed', label: 'Kesik' },
            { value: 'dotted', label: 'Noktalı' }, { value: 'double', label: 'Çift' },
          ]} onChange={(v: any) => upd({ border_style: v })} />
          <Toggle label="Gradient Sınır" checked={cfg.border_gradient_enabled} onChange={(v: boolean) => upd({ border_gradient_enabled: v })} />
          {cfg.border_gradient_enabled ? (
            <>
              <ColorField label="Gradient Başlangıç" value={cfg.border_gradient_from} onChange={(v: string) => upd({ border_gradient_from: v })} />
              <ColorField label="Gradient Bitiş" value={cfg.border_gradient_to} onChange={(v: string) => upd({ border_gradient_to: v })} />
            </>
          ) : (
            <ColorField label="Sınır Rengi" value={cfg.border_color} onChange={(v: string) => upd({ border_color: v })} />
          )}
        </>)}
      </Section>
    </div>
  );
}

function GeneralPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Nerelerde Görünür">
        <Toggle label="Sohbet Listesi" checked={cfg.visible_in_chat} onChange={(v: boolean) => upd({ visible_in_chat: v })} />
        <Toggle label="DM'lerde" checked={cfg.visible_in_dm} onChange={(v: boolean) => upd({ visible_in_dm: v })} />
        <Toggle label="Odalarda" checked={cfg.visible_in_room} onChange={(v: boolean) => upd({ visible_in_room: v })} />
      </Section>
      <Section title="Öncelik" hint="Aktifse mesaj diğer mesajların üzerinde gösterilir.">
        <Toggle label="Normalin Üstünde Öncelik" checked={cfg.priority_above_normal} onChange={(v: boolean) => upd({ priority_above_normal: v })} />
      </Section>
    </div>
  );
}

/* ─────────────────── PREVIEW ─────────────────── */

function ChatPreview({ cfg }: { cfg: GlowMessageConfig }) {
  const radius = cfg.bubble_shape === 'pill' ? 999
    : cfg.bubble_shape === 'square' ? 0
    : cfg.bubble_shape === 'speech' ? cfg.bubble_border_radius
    : cfg.bubble_border_radius;

  const bg = cfg.bubble_bg_gradient_enabled
    ? `linear-gradient(180deg, ${cfg.bubble_bg_gradient_top}, ${cfg.bubble_bg_gradient_bottom})`
    : cfg.bubble_bg_color;

  const glowAlpha = cfg.glow_enabled ? Math.round(cfg.glow_intensity * 255).toString(16).padStart(2, '0') : '00';
  const glowShadow = cfg.glow_enabled
    ? `${cfg.glow_inset ? 'inset ' : ''}0 0 ${cfg.glow_blur}px ${cfg.glow_spread}px ${cfg.glow_color}${glowAlpha}`
    : 'none';

  const borderStyle = cfg.border_enabled
    ? cfg.border_gradient_enabled
      ? { border: `${cfg.border_width}px ${cfg.border_style} transparent`, backgroundImage: `linear-gradient(${bg}, ${bg}), linear-gradient(135deg, ${cfg.border_gradient_from}, ${cfg.border_gradient_to})`, backgroundOrigin: 'border-box' as const, backgroundClip: 'padding-box, border-box' as any }
      : { border: `${cfg.border_width}px ${cfg.border_style} ${cfg.border_color}` }
    : {};

  const textShadow = cfg.text_shadow_enabled
    ? `0 ${cfg.text_shadow_offset_y}px ${cfg.text_shadow_blur}px ${cfg.text_shadow_color}`
    : undefined;

  const glowAnimName = cfg.glow_animation === 'pulse' ? 'glow-msg-pulse'
    : cfg.glow_animation === 'breathe' ? 'glow-msg-breathe'
    : cfg.glow_animation === 'shimmer' ? 'glow-msg-shimmer'
    : cfg.glow_animation === 'rainbow' ? 'glow-msg-rainbow'
    : undefined;
  const glowAnim = glowAnimName
    ? `${glowAnimName} ${cfg.glow_animation === 'rainbow' ? cfg.rainbow_speed_sec + 's' : cfg.glow_anim_speed_ms + 'ms'} ease-in-out infinite`
    : undefined;
  const bubblePulseAnim = cfg.bubble_pulse ? `bubble-msg-pulse 1.4s ease-in-out infinite` : undefined;

  return (
    <div className="rounded-xl bg-gradient-to-b from-[#0F1926] to-[#0A0F1A] p-3 space-y-3">
      <style>{`
        @keyframes glow-msg-pulse {
          0%, 100% { box-shadow: ${cfg.glow_inset ? 'inset ' : ''}0 0 ${cfg.glow_blur * 0.6}px ${cfg.glow_spread}px ${cfg.glow_color}${Math.round(cfg.glow_intensity * (1 - cfg.glow_anim_amplitude) * 255).toString(16).padStart(2, '0')}; }
          50%      { box-shadow: ${cfg.glow_inset ? 'inset ' : ''}0 0 ${cfg.glow_blur * 1.3}px ${cfg.glow_spread * 1.5}px ${cfg.glow_color}${Math.round(cfg.glow_intensity * 255).toString(16).padStart(2, '0')}; }
        }
        @keyframes glow-msg-breathe {
          0%, 100% { box-shadow: 0 0 ${cfg.glow_blur * 0.5}px ${cfg.glow_color}66; }
          50%      { box-shadow: 0 0 ${cfg.glow_blur * 1.5}px ${cfg.glow_color}; }
        }
        @keyframes glow-msg-shimmer {
          0%       { box-shadow: 0 0 ${cfg.glow_blur}px ${cfg.glow_color}; transform: translateX(-2px); }
          50%      { box-shadow: 0 0 ${cfg.glow_blur * 1.2}px ${cfg.glow_color}; transform: translateX(2px); }
          100%     { box-shadow: 0 0 ${cfg.glow_blur}px ${cfg.glow_color}; transform: translateX(-2px); }
        }
        @keyframes glow-msg-rainbow {
          0%   { box-shadow: 0 0 ${cfg.glow_blur}px hsl(0, 80%, 60%); }
          25%  { box-shadow: 0 0 ${cfg.glow_blur}px hsl(90, 80%, 60%); }
          50%  { box-shadow: 0 0 ${cfg.glow_blur}px hsl(180, 80%, 60%); }
          75%  { box-shadow: 0 0 ${cfg.glow_blur}px hsl(270, 80%, 60%); }
          100% { box-shadow: 0 0 ${cfg.glow_blur}px hsl(360, 80%, 60%); }
        }
        @keyframes bubble-msg-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(${cfg.bubble_pulse_scale}); }
        }
      `}</style>

      {/* 3 mock mesaj — sadece ortadaki glow_message */}
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-slate-700 shrink-0" />
        <div className="rounded-xl px-3 py-2 bg-slate-800 text-slate-300 text-xs">Hey, nasılsın?</div>
      </div>

      <div className="flex items-start gap-2 justify-end">
        <div
          className="text-center"
          style={{
            background: bg,
            borderRadius: radius,
            paddingLeft: cfg.bubble_padding_x,
            paddingRight: cfg.bubble_padding_x,
            paddingTop: cfg.bubble_padding_y,
            paddingBottom: cfg.bubble_padding_y,
            opacity: cfg.bubble_opacity,
            boxShadow: glowAnim ? undefined : glowShadow,
            animation: [glowAnim, bubblePulseAnim].filter(Boolean).join(', ') || undefined,
            ...borderStyle,
            color: cfg.text_color,
            fontSize: cfg.text_font_size,
            fontWeight: cfg.text_font_weight as any,
            textShadow,
            WebkitTextStroke: cfg.text_stroke_enabled ? `${cfg.text_stroke_width}px ${cfg.text_stroke_color}` : undefined,
            letterSpacing: cfg.text_letter_spacing,
            maxWidth: 220,
          } as React.CSSProperties}
        >
          ✨ Selam!  Bu Parlak Mesaj
        </div>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 shrink-0" />
      </div>

      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-slate-700 shrink-0" />
        <div className="rounded-xl px-3 py-2 bg-slate-800 text-slate-300 text-xs">Çok güzel olmuş 🔥</div>
      </div>

      <div className="text-[10px] text-slate-500 mt-2 leading-relaxed">
        Ortadaki sağa-hizalı mesaj &ldquo;parlak&rdquo;. Slider'lar anlık önizlemeye yansır.
      </div>
    </div>
  );
}
