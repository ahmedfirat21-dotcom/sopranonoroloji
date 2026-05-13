"use client";

/**
 * Efekt Editörü — genel görsel efektler (sürekli partikül + sahne katmanları + overlay).
 * 8 sekme: Tip / Partikül / Sahne / Renk / Animasyon / Trigger / Ses / Genel
 */
import React, { useReducer, useTransition, useEffect, useRef } from 'react';
import { Save, RotateCcw, Sparkles, Stars, Filter, Palette, Activity, Zap, Volume2, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { saveEffectConfig } from './actions';

type Tab = 'type' | 'particles' | 'scene' | 'color' | 'anim' | 'trigger' | 'sound' | 'general';

type EffectType = 'particles' | 'scene-overlay' | 'aura' | 'lottie-overlay' | 'shockwave' | 'rain' | 'snow' | 'ambient-light';
type ParticleType = 'sparkle' | 'star' | 'heart' | 'confetti' | 'snowflake' | 'leaf' | 'firefly' | 'bubble' | 'petal';
type TriggerType = 'always' | 'on-event' | 'on-message' | 'on-room-enter' | 'on-tier-up' | 'on-time';

interface EffectConfig {
  // Tip
  effect_type: EffectType;
  effect_name: string;
  // Partikül
  particle_type: ParticleType;
  particle_count: number;            // 10-200
  particle_lifetime_sec: number;     // 1-15
  particle_size_min: number;
  particle_size_max: number;
  particle_color_palette: string[];
  particle_emit_area: 'full' | 'top' | 'bottom' | 'left' | 'right' | 'center';
  particle_velocity_min: number;
  particle_velocity_max: number;
  particle_gravity: number;          // -1..1
  particle_rotation_speed: number;
  particle_fade_out: boolean;
  particle_emit_rate_per_sec: number;
  particle_opacity: number;
  // Sahne (overlay tabanlı)
  scene_overlay_color: string;
  scene_overlay_opacity: number;
  scene_overlay_blend: 'normal' | 'multiply' | 'screen' | 'overlay';
  scene_vignette_enabled: boolean;
  scene_vignette_intensity: number;
  scene_light_streaks_enabled: boolean;
  scene_light_streaks_count: number;
  scene_light_streaks_color: string;
  scene_fog_enabled: boolean;
  scene_fog_color: string;
  scene_fog_intensity: number;
  // Renk
  primary_color: string;
  secondary_color: string;
  use_gradient: boolean;
  gradient_angle: number;
  filter_brightness: number;
  filter_saturation: number;
  filter_hue_rotate: number;
  // Animasyon
  animation_speed: number;           // 0.3-3x
  animation_smoothing: 'linear' | 'ease' | 'ease-in-out' | 'cubic';
  loop_enabled: boolean;
  loop_count: number;                // 0 = sonsuz
  // Trigger
  trigger: TriggerType;
  trigger_event_name: string;        // 'on-event' için
  trigger_min_tier: 'free' | 'plus' | 'pro' | 'gm';
  trigger_only_room_owner: boolean;
  trigger_cooldown_minutes: number;
  // Ses
  sound_enabled: boolean;
  sound_url: string;
  sound_volume: number;
  sound_loop: boolean;
  // Genel
  applies_to_profile: boolean;
  applies_to_room: boolean;
  applies_to_chat: boolean;
  applies_to_app_wide: boolean;
  layer_z_index: number;
  description: string;
}

const DEFAULT_CFG: EffectConfig = {
  effect_type: 'particles',
  effect_name: 'Genel Efekt',
  particle_type: 'sparkle',
  particle_count: 50,
  particle_lifetime_sec: 4,
  particle_size_min: 4,
  particle_size_max: 12,
  particle_color_palette: ['#FBBF24', '#F472B6', '#22D3EE', '#A78BFA'],
  particle_emit_area: 'full',
  particle_velocity_min: 20,
  particle_velocity_max: 80,
  particle_gravity: -0.1,
  particle_rotation_speed: 60,
  particle_fade_out: true,
  particle_emit_rate_per_sec: 12,
  particle_opacity: 1,
  scene_overlay_color: '#000000',
  scene_overlay_opacity: 0,
  scene_overlay_blend: 'normal',
  scene_vignette_enabled: false,
  scene_vignette_intensity: 0.5,
  scene_light_streaks_enabled: false,
  scene_light_streaks_count: 3,
  scene_light_streaks_color: '#FBBF24',
  scene_fog_enabled: false,
  scene_fog_color: '#FFFFFF',
  scene_fog_intensity: 0.3,
  primary_color: '#14B8A6',
  secondary_color: '#A78BFA',
  use_gradient: false,
  gradient_angle: 135,
  filter_brightness: 1,
  filter_saturation: 1,
  filter_hue_rotate: 0,
  animation_speed: 1,
  animation_smoothing: 'ease-in-out',
  loop_enabled: true,
  loop_count: 0,
  trigger: 'always',
  trigger_event_name: '',
  trigger_min_tier: 'free',
  trigger_only_room_owner: false,
  trigger_cooldown_minutes: 0,
  sound_enabled: false,
  sound_url: '',
  sound_volume: 0.5,
  sound_loop: false,
  applies_to_profile: false,
  applies_to_room: true,
  applies_to_chat: false,
  applies_to_app_wide: false,
  layer_z_index: 5,
  description: '',
};

function reducer(state: EffectConfig, action: Partial<EffectConfig> | { reset: true }): EffectConfig {
  if ('reset' in action) return DEFAULT_CFG;
  return { ...state, ...action };
}

export default function EffectEditor({ item }: { item: any }) {
  const initial: EffectConfig = { ...DEFAULT_CFG, ...((item.editor_config as any)?.effect_config || {}) };
  const [cfg, dispatch] = useReducer(reducer, initial);
  const [tab, setTab] = React.useState<Tab>('type');
  const [saving, startSave] = useTransition();
  const [status, setStatus] = React.useState<string | null>(null);

  const upd = (patch: Partial<EffectConfig>) => dispatch(patch);

  const handleSave = () => {
    setStatus(null);
    startSave(async () => {
      const res = await saveEffectConfig(item.id, cfg as any);
      setStatus(res.ok ? '✓ Kaydedildi' : `✗ Hata: ${res.error}`);
      setTimeout(() => setStatus(null), 3000);
    });
  };

  const TABS: { k: Tab; l: string; i: React.ReactNode }[] = [
    { k: 'type',      l: 'Tip',       i: <Sparkles className="w-3.5 h-3.5" /> },
    { k: 'particles', l: 'Partikül',  i: <Stars className="w-3.5 h-3.5" /> },
    { k: 'scene',     l: 'Sahne',     i: <Filter className="w-3.5 h-3.5" /> },
    { k: 'color',     l: 'Renk',      i: <Palette className="w-3.5 h-3.5" /> },
    { k: 'anim',      l: 'Anim',      i: <Activity className="w-3.5 h-3.5" /> },
    { k: 'trigger',   l: 'Trigger',   i: <Zap className="w-3.5 h-3.5" /> },
    { k: 'sound',     l: 'Ses',       i: <Volume2 className="w-3.5 h-3.5" /> },
    { k: 'general',   l: 'Genel',     i: <SettingsIcon className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start">
      <div className="flex-1 min-w-0 w-full space-y-3">
        <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-700/40 rounded-xl p-1 overflow-x-auto sticky top-0 z-10 backdrop-blur">
          {TABS.map(t => (
            <button key={t.k} type="button" onClick={() => setTab(t.k)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.k
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/20 text-cyan-100 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}>
              {t.i}{t.l}
            </button>
          ))}
        </div>

        <div className="pb-20 space-y-3">
          {tab === 'type' && <TypePanel cfg={cfg} upd={upd} />}
          {tab === 'particles' && <ParticlesPanel cfg={cfg} upd={upd} />}
          {tab === 'scene' && <ScenePanel cfg={cfg} upd={upd} />}
          {tab === 'color' && <ColorPanel cfg={cfg} upd={upd} />}
          {tab === 'anim' && <AnimPanel cfg={cfg} upd={upd} />}
          {tab === 'trigger' && <TriggerPanel cfg={cfg} upd={upd} />}
          {tab === 'sound' && <SoundPanel cfg={cfg} upd={upd} />}
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 hover:opacity-90 disabled:opacity-50">
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
          <EffectPreview cfg={cfg} />
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
function Slider({ label, min, max, step, value, onChange, display }: any) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span><span className="text-slate-200 font-mono">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
    </label>
  );
}
function Toggle({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-slate-400">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-cyan-500' : 'bg-slate-600'}`}>
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
function TextField({ label, value, onChange, placeholder, mono }: any) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 ${mono ? 'font-mono' : ''}`} />
    </label>
  );
}

function TypePanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Efekt Tipi">
        <SelectField label="Tip" value={cfg.effect_type} options={[
          { value: 'particles', label: '✨ Partikül Sistemi' },
          { value: 'scene-overlay', label: '🎬 Sahne Overlay' },
          { value: 'aura', label: '💫 Aura' },
          { value: 'lottie-overlay', label: '🎯 Lottie Overlay' },
          { value: 'shockwave', label: '💥 Şok Dalgası' },
          { value: 'rain', label: '🌧 Yağmur' },
          { value: 'snow', label: '❄ Kar' },
          { value: 'ambient-light', label: '🌟 Ambient Işık' },
        ]} onChange={(v: any) => upd({ effect_type: v })} />
        <TextField label="Efekt Adı" value={cfg.effect_name} onChange={(v: string) => upd({ effect_name: v })} placeholder="Soprano Lights" />
      </Section>
    </div>
  );
}

function ParticlesPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Partikül Tipi">
        <SelectField label="Şekil" value={cfg.particle_type} options={[
          { value: 'sparkle', label: '✨ Sparkle' },
          { value: 'star', label: '⭐ Yıldız' },
          { value: 'heart', label: '❤ Kalp' },
          { value: 'confetti', label: '🎉 Konfeti' },
          { value: 'snowflake', label: '❄ Kar Tanesi' },
          { value: 'leaf', label: '🍃 Yaprak' },
          { value: 'firefly', label: '💡 Ateş Böceği' },
          { value: 'bubble', label: '🫧 Baloncuk' },
          { value: 'petal', label: '🌸 Petal' },
        ]} onChange={(v: any) => upd({ particle_type: v })} />
      </Section>
      <Section title="Sayı & Yaşam">
        <Slider label="Toplam Sayı" min={5} max={250} step={5} value={cfg.particle_count} onChange={(v: number) => upd({ particle_count: v })} display={`${cfg.particle_count}`} />
        <Slider label="Yaşam Süresi" min={0.5} max={20} step={0.5} value={cfg.particle_lifetime_sec} onChange={(v: number) => upd({ particle_lifetime_sec: v })} display={`${cfg.particle_lifetime_sec}sn`} />
        <Slider label="Emit Hızı" min={1} max={60} step={1} value={cfg.particle_emit_rate_per_sec} onChange={(v: number) => upd({ particle_emit_rate_per_sec: v })} display={`${cfg.particle_emit_rate_per_sec}/sn`} />
        <Toggle label="Sonunda Solsun" checked={cfg.particle_fade_out} onChange={(v: boolean) => upd({ particle_fade_out: v })} />
      </Section>
      <Section title="Boyut">
        <Slider label="Min Boyut" min={1} max={30} step={1} value={cfg.particle_size_min} onChange={(v: number) => upd({ particle_size_min: v })} display={`${cfg.particle_size_min}px`} />
        <Slider label="Max Boyut" min={4} max={50} step={1} value={cfg.particle_size_max} onChange={(v: number) => upd({ particle_size_max: v })} display={`${cfg.particle_size_max}px`} />
        <Slider label="Opaklık" min={0.1} max={1} step={0.05} value={cfg.particle_opacity} onChange={(v: number) => upd({ particle_opacity: v })} display={`${Math.round(cfg.particle_opacity * 100)}%`} />
      </Section>
      <Section title="Hareket">
        <Slider label="Min Hız" min={0} max={200} step={5} value={cfg.particle_velocity_min} onChange={(v: number) => upd({ particle_velocity_min: v })} display={`${cfg.particle_velocity_min}`} />
        <Slider label="Max Hız" min={10} max={300} step={5} value={cfg.particle_velocity_max} onChange={(v: number) => upd({ particle_velocity_max: v })} display={`${cfg.particle_velocity_max}`} />
        <Slider label="Yer Çekimi" min={-1} max={1} step={0.05} value={cfg.particle_gravity} onChange={(v: number) => upd({ particle_gravity: v })} display={`${cfg.particle_gravity.toFixed(2)}`} />
        <Slider label="Dönüş Hızı" min={0} max={360} step={5} value={cfg.particle_rotation_speed} onChange={(v: number) => upd({ particle_rotation_speed: v })} display={`${cfg.particle_rotation_speed}°/sn`} />
      </Section>
      <Section title="Çıkış Bölgesi">
        <SelectField label="Bölge" value={cfg.particle_emit_area} options={[
          { value: 'full', label: 'Tüm Sahne' },
          { value: 'top', label: 'Üst' }, { value: 'bottom', label: 'Alt' },
          { value: 'left', label: 'Sol' }, { value: 'right', label: 'Sağ' },
          { value: 'center', label: 'Merkez' },
        ]} onChange={(v: any) => upd({ particle_emit_area: v })} />
      </Section>
      <Section title="Renk Paleti">
        <input type="text" value={cfg.particle_color_palette.join(',')}
          onChange={e => upd({ particle_color_palette: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          aria-label="Partikül renkleri"
          placeholder="#FBBF24, #F472B6"
          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200" />
        <div className="flex flex-wrap gap-1 mt-2">
          {cfg.particle_color_palette.map((c: string, i: number) => (
            <div key={i} className="w-6 h-6 rounded border border-slate-600" style={{ background: c }} title={c} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function ScenePanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Overlay">
        <ColorField label="Renk" value={cfg.scene_overlay_color} onChange={(v: string) => upd({ scene_overlay_color: v })} />
        <Slider label="Opaklık" min={0} max={1} step={0.05} value={cfg.scene_overlay_opacity} onChange={(v: number) => upd({ scene_overlay_opacity: v })} display={`${Math.round(cfg.scene_overlay_opacity * 100)}%`} />
        <SelectField label="Blend Modu" value={cfg.scene_overlay_blend} options={[
          { value: 'normal', label: 'Normal' }, { value: 'multiply', label: 'Multiply' },
          { value: 'screen', label: 'Screen' }, { value: 'overlay', label: 'Overlay' },
        ]} onChange={(v: any) => upd({ scene_overlay_blend: v })} />
      </Section>
      <Section title="Vignette">
        <Toggle label="Vignette Aktif" checked={cfg.scene_vignette_enabled} onChange={(v: boolean) => upd({ scene_vignette_enabled: v })} />
        {cfg.scene_vignette_enabled && (
          <Slider label="Şiddet" min={0.1} max={1} step={0.05} value={cfg.scene_vignette_intensity} onChange={(v: number) => upd({ scene_vignette_intensity: v })} display={`${Math.round(cfg.scene_vignette_intensity * 100)}%`} />
        )}
      </Section>
      <Section title="Işık Demetleri (Light Streaks)">
        <Toggle label="Aktif" checked={cfg.scene_light_streaks_enabled} onChange={(v: boolean) => upd({ scene_light_streaks_enabled: v })} />
        {cfg.scene_light_streaks_enabled && (<>
          <Slider label="Sayı" min={1} max={8} step={1} value={cfg.scene_light_streaks_count} onChange={(v: number) => upd({ scene_light_streaks_count: v })} display={`${cfg.scene_light_streaks_count}`} />
          <ColorField label="Renk" value={cfg.scene_light_streaks_color} onChange={(v: string) => upd({ scene_light_streaks_color: v })} />
        </>)}
      </Section>
      <Section title="Sis (Fog)">
        <Toggle label="Sis Aktif" checked={cfg.scene_fog_enabled} onChange={(v: boolean) => upd({ scene_fog_enabled: v })} />
        {cfg.scene_fog_enabled && (<>
          <ColorField label="Sis Rengi" value={cfg.scene_fog_color} onChange={(v: string) => upd({ scene_fog_color: v })} />
          <Slider label="Şiddet" min={0.05} max={1} step={0.05} value={cfg.scene_fog_intensity} onChange={(v: number) => upd({ scene_fog_intensity: v })} display={`${Math.round(cfg.scene_fog_intensity * 100)}%`} />
        </>)}
      </Section>
    </div>
  );
}

function ColorPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Ana Renkler">
        <ColorField label="Primary" value={cfg.primary_color} onChange={(v: string) => upd({ primary_color: v })} />
        <ColorField label="Secondary" value={cfg.secondary_color} onChange={(v: string) => upd({ secondary_color: v })} />
        <Toggle label="Gradient Kullan" checked={cfg.use_gradient} onChange={(v: boolean) => upd({ use_gradient: v })} />
        {cfg.use_gradient && (
          <Slider label="Gradient Açısı" min={0} max={360} step={5} value={cfg.gradient_angle} onChange={(v: number) => upd({ gradient_angle: v })} display={`${cfg.gradient_angle}°`} />
        )}
      </Section>
      <Section title="Filtre">
        <Slider label="Parlaklık" min={0.3} max={2} step={0.05} value={cfg.filter_brightness} onChange={(v: number) => upd({ filter_brightness: v })} display={`${cfg.filter_brightness.toFixed(2)}x`} />
        <Slider label="Doygunluk" min={0} max={2} step={0.05} value={cfg.filter_saturation} onChange={(v: number) => upd({ filter_saturation: v })} display={`${cfg.filter_saturation.toFixed(2)}x`} />
        <Slider label="Renk Tonu" min={0} max={360} step={5} value={cfg.filter_hue_rotate} onChange={(v: number) => upd({ filter_hue_rotate: v })} display={`${cfg.filter_hue_rotate}°`} />
      </Section>
    </div>
  );
}

function AnimPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Animasyon Hızı">
        <Slider label="Genel Hız Çarpanı" min={0.2} max={3} step={0.1} value={cfg.animation_speed} onChange={(v: number) => upd({ animation_speed: v })} display={`${cfg.animation_speed.toFixed(1)}x`} />
        <SelectField label="Easing" value={cfg.animation_smoothing} options={[
          { value: 'linear', label: 'Linear' },
          { value: 'ease', label: 'Ease' },
          { value: 'ease-in-out', label: 'Ease In Out' },
          { value: 'cubic', label: 'Cubic' },
        ]} onChange={(v: any) => upd({ animation_smoothing: v })} />
      </Section>
      <Section title="Loop">
        <Toggle label="Loop Aktif" checked={cfg.loop_enabled} onChange={(v: boolean) => upd({ loop_enabled: v })} />
        {cfg.loop_enabled && (
          <Slider label="Loop Sayısı (0=∞)" min={0} max={20} step={1} value={cfg.loop_count} onChange={(v: number) => upd({ loop_count: v })} display={cfg.loop_count === 0 ? '∞' : `${cfg.loop_count}`} />
        )}
      </Section>
    </div>
  );
}

function TriggerPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Tetikleyici">
        <SelectField label="Ne Zaman" value={cfg.trigger} options={[
          { value: 'always', label: 'Her Zaman (Sürekli)' },
          { value: 'on-event', label: 'Olay (event-name)' },
          { value: 'on-message', label: 'Mesaj Gönderilince' },
          { value: 'on-room-enter', label: 'Odaya Girilince' },
          { value: 'on-tier-up', label: 'Tier Yükselmesi' },
          { value: 'on-time', label: 'Zaman Aralığı' },
        ]} onChange={(v: any) => upd({ trigger: v })} />
        {cfg.trigger === 'on-event' && (
          <TextField label="Event Adı" value={cfg.trigger_event_name} onChange={(v: string) => upd({ trigger_event_name: v })} placeholder="örn: gift-received" />
        )}
      </Section>
      <Section title="Koşullar">
        <SelectField label="Minimum Tier" value={cfg.trigger_min_tier} options={[
          { value: 'free', label: 'Free' }, { value: 'plus', label: 'Plus+' },
          { value: 'pro', label: 'Pro+' }, { value: 'gm', label: 'GM' },
        ]} onChange={(v: any) => upd({ trigger_min_tier: v })} />
        <Toggle label="Sadece Oda Sahibi" checked={cfg.trigger_only_room_owner} onChange={(v: boolean) => upd({ trigger_only_room_owner: v })} />
        <Slider label="Cooldown (dk)" min={0} max={120} step={1} value={cfg.trigger_cooldown_minutes} onChange={(v: number) => upd({ trigger_cooldown_minutes: v })} display={cfg.trigger_cooldown_minutes === 0 ? 'Yok' : `${cfg.trigger_cooldown_minutes}dk`} />
      </Section>
    </div>
  );
}

function SoundPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Ses">
        <Toggle label="Ses Aktif" checked={cfg.sound_enabled} onChange={(v: boolean) => upd({ sound_enabled: v })} />
        {cfg.sound_enabled && (<>
          <TextField label="Ses URL" value={cfg.sound_url} onChange={(v: string) => upd({ sound_url: v })} placeholder="https://... (mp3/ogg)" mono />
          <Slider label="Ses Seviyesi" min={0} max={1} step={0.05} value={cfg.sound_volume} onChange={(v: number) => upd({ sound_volume: v })} display={`${Math.round(cfg.sound_volume * 100)}%`} />
          <Toggle label="Sesi Loop'la" checked={cfg.sound_loop} onChange={(v: boolean) => upd({ sound_loop: v })} />
        </>)}
      </Section>
    </div>
  );
}

function GeneralPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Nerelerde Aktif">
        <Toggle label="Profil" checked={cfg.applies_to_profile} onChange={(v: boolean) => upd({ applies_to_profile: v })} />
        <Toggle label="Odalar" checked={cfg.applies_to_room} onChange={(v: boolean) => upd({ applies_to_room: v })} />
        <Toggle label="Sohbetler" checked={cfg.applies_to_chat} onChange={(v: boolean) => upd({ applies_to_chat: v })} />
        <Toggle label="Uygulama Geneli" checked={cfg.applies_to_app_wide} onChange={(v: boolean) => upd({ applies_to_app_wide: v })} />
      </Section>
      <Section title="Katman">
        <Slider label="Z-Index" min={-10} max={50} step={1} value={cfg.layer_z_index} onChange={(v: number) => upd({ layer_z_index: v })} display={`${cfg.layer_z_index}`} />
      </Section>
      <Section title="Açıklama">
        <TextField label="Açıklama" value={cfg.description} onChange={(v: string) => upd({ description: v })} placeholder="Bu efekt ne yapar?" />
      </Section>
    </div>
  );
}

/* ─── Preview — Canvas2D partikül + overlay ─── */
function EffectPreview({ cfg }: { cfg: EffectConfig }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const W = 320, H = 480;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    type P = { x: number; y: number; vx: number; vy: number; size: number; color: string; rot: number; vrot: number; born: number; life: number };
    const particles: P[] = [];
    const startTime = performance.now();
    let lastEmit = startTime;
    let lastFrame = startTime;

    function emitArea(): { x: number; y: number } {
      switch (cfg.particle_emit_area) {
        case 'top': return { x: Math.random() * W, y: 0 };
        case 'bottom': return { x: Math.random() * W, y: H };
        case 'left': return { x: 0, y: Math.random() * H };
        case 'right': return { x: W, y: Math.random() * H };
        case 'center': return { x: W / 2 + (Math.random() - 0.5) * 40, y: H / 2 + (Math.random() - 0.5) * 40 };
        default: return { x: Math.random() * W, y: Math.random() * H };
      }
    }
    function spawn(now: number) {
      const { x, y } = emitArea();
      const palette = cfg.particle_color_palette.length > 0 ? cfg.particle_color_palette : ['#FBBF24'];
      const color = palette[Math.floor(Math.random() * palette.length)];
      const speed = cfg.particle_velocity_min + Math.random() * Math.max(0, cfg.particle_velocity_max - cfg.particle_velocity_min);
      const angle = Math.random() * Math.PI * 2;
      const size = cfg.particle_size_min + Math.random() * Math.max(0, cfg.particle_size_max - cfg.particle_size_min);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed * cfg.animation_speed,
        vy: Math.sin(angle) * speed * cfg.animation_speed,
        size, color,
        rot: Math.random() * Math.PI * 2,
        vrot: (cfg.particle_rotation_speed * Math.PI / 180) * (0.4 + Math.random()),
        born: now,
        life: cfg.particle_lifetime_sec * 1000,
      });
    }

    if (cfg.effect_type === 'particles' || cfg.effect_type === 'snow' || cfg.effect_type === 'rain') {
      // initial burst
      for (let i = 0; i < Math.min(20, cfg.particle_count); i++) spawn(startTime);
    }

    let raf = 0;
    function frame(now: number) {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      // emit
      if (cfg.effect_type === 'particles' || cfg.effect_type === 'snow' || cfg.effect_type === 'rain') {
        const interval = 1000 / Math.max(1, cfg.particle_emit_rate_per_sec);
        while (now - lastEmit > interval && particles.length < cfg.particle_count) {
          spawn(now);
          lastEmit += interval;
        }
      }

      ctx!.clearRect(0, 0, W, H);

      // Vignette/fog/overlay (alt katman)
      if (cfg.scene_fog_enabled) {
        const grad = ctx!.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
        grad.addColorStop(0, cfg.scene_fog_color + Math.round(cfg.scene_fog_intensity * 80).toString(16).padStart(2, '0'));
        grad.addColorStop(1, 'transparent');
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, W, H);
      }

      // Light streaks
      if (cfg.scene_light_streaks_enabled) {
        for (let i = 0; i < cfg.scene_light_streaks_count; i++) {
          const t = (now / 8000 + i / cfg.scene_light_streaks_count) % 1;
          const x = t * (W + 200) - 100;
          ctx!.save();
          ctx!.globalAlpha = 0.3;
          ctx!.strokeStyle = cfg.scene_light_streaks_color;
          ctx!.lineWidth = 60;
          ctx!.beginPath();
          ctx!.moveTo(x, -50);
          ctx!.lineTo(x - 150, H + 50);
          ctx!.stroke();
          ctx!.restore();
        }
      }

      // Particles
      const gravity = cfg.particle_gravity * 200;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = now - p.born;
        if (age > p.life) { particles.splice(i, 1); continue; }
        p.vy += gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
        const ageNorm = age / p.life;
        const alpha = cfg.particle_fade_out ? Math.max(0, 1 - ageNorm) * cfg.particle_opacity : cfg.particle_opacity;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.globalAlpha = alpha;
        ctx!.filter = `brightness(${cfg.filter_brightness}) saturate(${cfg.filter_saturation}) hue-rotate(${cfg.filter_hue_rotate}deg)`;
        drawParticle(ctx!, cfg.particle_type, p.size, p.color);
        ctx!.restore();
      }
      ctx!.filter = 'none';

      // Vignette üst
      if (cfg.scene_vignette_enabled) {
        const vGrad = ctx!.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.75);
        vGrad.addColorStop(0, 'transparent');
        vGrad.addColorStop(1, `rgba(0,0,0,${cfg.scene_vignette_intensity})`);
        ctx!.fillStyle = vGrad;
        ctx!.fillRect(0, 0, W, H);
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [cfg]);

  const overlayStyle: React.CSSProperties = cfg.scene_overlay_opacity > 0
    ? { background: cfg.scene_overlay_color, opacity: cfg.scene_overlay_opacity, mixBlendMode: cfg.scene_overlay_blend as any }
    : {};

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/40 relative mx-auto"
      style={{ width: W, height: H, background: 'linear-gradient(180deg, #1E293B 0%, #0A0F1A 100%)' }}>
      <canvas ref={ref} className="absolute inset-0 pointer-events-none" />
      {cfg.scene_overlay_opacity > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={overlayStyle} />
      )}
      <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs pointer-events-none">
        <div className="bg-slate-900/40 px-3 py-1.5 rounded-md border border-white/10 backdrop-blur">
          Sahne / oda mock
        </div>
      </div>
    </div>
  );
}

function drawParticle(ctx: CanvasRenderingContext2D, type: ParticleType, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  switch (type) {
    case 'sparkle':
    case 'star': {
      const points = type === 'star' ? 5 : 4;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? size / 2 : size / 5;
        const a = (i * Math.PI) / points - Math.PI / 2;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'heart': {
      ctx.beginPath();
      ctx.moveTo(0, size * 0.35);
      ctx.bezierCurveTo(-size * 0.6, -size * 0.1, -size * 0.6, -size * 0.5, 0, -size * 0.15);
      ctx.bezierCurveTo(size * 0.6, -size * 0.5, size * 0.6, -size * 0.1, 0, size * 0.35);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'confetti': {
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
      return;
    }
    case 'snowflake': {
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * size / 2, Math.sin(a) * size / 2);
        ctx.stroke();
      }
      return;
    }
    case 'leaf': {
      ctx.beginPath();
      ctx.ellipse(0, 0, size / 3, size / 2, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    case 'firefly': {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
      g.addColorStop(0, color);
      g.addColorStop(0.5, color + '88');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case 'bubble': {
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = color + '33';
      ctx.fill();
      return;
    }
    case 'petal': {
      ctx.beginPath();
      ctx.ellipse(0, 0, size / 2.5, size / 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    default: {
      ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, Math.PI * 2); ctx.fill();
    }
  }
}
