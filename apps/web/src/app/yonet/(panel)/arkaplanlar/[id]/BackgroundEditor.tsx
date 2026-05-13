"use client";

/**
 * Arkaplan Editörü — profil/oda arka planı için detaylı ayar.
 * 8 sekme: Görsel / Gradient / Renk Düzeltme / Bulanıklık / Parallax / Animasyon / Overlay / Genel
 */
import React, { useReducer, useTransition } from 'react';
import { Save, RotateCcw, ImageIcon, Palette, SlidersHorizontal, Wind, Move, Activity, Layers, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { saveBackgroundConfig } from './actions';

type Tab = 'image' | 'gradient' | 'color' | 'blur' | 'parallax' | 'anim' | 'overlay' | 'general';
type BgType = 'image' | 'gradient' | 'solid' | 'radial' | 'video' | 'lottie';
type ImageFit = 'cover' | 'contain' | 'fill' | 'tile' | 'center';
type AnimType = 'none' | 'pan' | 'zoom' | 'ken-burns' | 'parallax-scroll' | 'rotate';

interface BgConfig {
  // Tip
  bg_type: BgType;
  // Görsel
  image_url: string;
  image_fit: ImageFit;
  image_position_x: number;  // 0-100 %
  image_position_y: number;
  image_scale: number;       // 1-2
  image_opacity: number;
  image_tile_size: number;   // px (fit=tile için)
  // Gradient
  gradient_type: 'linear' | 'radial' | 'conic';
  gradient_angle: number;
  gradient_stops: string[];  // ["#000 0%", "#fff 100%"]
  // Solid
  solid_color: string;
  // Radial (özelleştirilmiş)
  radial_color_in: string;
  radial_color_out: string;
  radial_size: number;       // 30-150 %
  // Renk düzeltme
  brightness: number;        // 0.3-2
  contrast: number;          // 0.5-2
  saturation: number;        // 0-2
  hue_rotate: number;        // 0-360
  invert: boolean;
  sepia: number;             // 0-1
  // Bulanıklık
  blur_enabled: boolean;
  blur_amount: number;       // 0-50 px
  // Parallax
  parallax_enabled: boolean;
  parallax_intensity: number; // 0-1
  parallax_direction: 'vertical' | 'horizontal' | 'both';
  // Animasyon
  animation: AnimType;
  anim_speed_sec: number;
  anim_amplitude: number;
  ken_burns_zoom_to: number;  // 1-1.5
  // Overlay (renk filtresi)
  overlay_enabled: boolean;
  overlay_color: string;
  overlay_opacity: number;
  overlay_blend_mode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
  vignette_enabled: boolean;
  vignette_color: string;
  vignette_intensity: number;
  // Genel
  applies_to_profile: boolean;
  applies_to_room: boolean;
  applies_to_chat: boolean;
  layer_z_index: number;
  fallback_color: string;
}

const DEFAULT_CFG: BgConfig = {
  bg_type: 'gradient',
  image_url: '',
  image_fit: 'cover',
  image_position_x: 50,
  image_position_y: 50,
  image_scale: 1,
  image_opacity: 1,
  image_tile_size: 80,
  gradient_type: 'linear',
  gradient_angle: 180,
  gradient_stops: ['#0F1926 0%', '#0A0F1A 100%'],
  solid_color: '#0A0F1A',
  radial_color_in: '#14B8A6',
  radial_color_out: '#0F1926',
  radial_size: 70,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  hue_rotate: 0,
  invert: false,
  sepia: 0,
  blur_enabled: false,
  blur_amount: 0,
  parallax_enabled: false,
  parallax_intensity: 0.3,
  parallax_direction: 'vertical',
  animation: 'none',
  anim_speed_sec: 20,
  anim_amplitude: 0.5,
  ken_burns_zoom_to: 1.15,
  overlay_enabled: false,
  overlay_color: '#000000',
  overlay_opacity: 0.3,
  overlay_blend_mode: 'multiply',
  vignette_enabled: false,
  vignette_color: '#000000',
  vignette_intensity: 0.5,
  applies_to_profile: true,
  applies_to_room: false,
  applies_to_chat: false,
  layer_z_index: 0,
  fallback_color: '#0A0F1A',
};

function reducer(state: BgConfig, action: Partial<BgConfig> | { reset: true }): BgConfig {
  if ('reset' in action) return DEFAULT_CFG;
  return { ...state, ...action };
}

export default function BackgroundEditor({ item }: { item: any }) {
  const initial: BgConfig = { ...DEFAULT_CFG, ...((item.editor_config as any)?.background_config || {}) };
  const [cfg, dispatch] = useReducer(reducer, initial);
  const [tab, setTab] = React.useState<Tab>('image');
  const [saving, startSave] = useTransition();
  const [status, setStatus] = React.useState<string | null>(null);

  const upd = (patch: Partial<BgConfig>) => dispatch(patch);

  const handleSave = () => {
    setStatus(null);
    startSave(async () => {
      const res = await saveBackgroundConfig(item.id, cfg as any);
      setStatus(res.ok ? '✓ Kaydedildi' : `✗ Hata: ${res.error}`);
      setTimeout(() => setStatus(null), 3000);
    });
  };

  const TABS: { k: Tab; l: string; i: React.ReactNode }[] = [
    { k: 'image',    l: 'Görsel',     i: <ImageIcon className="w-3.5 h-3.5" /> },
    { k: 'gradient', l: 'Gradient',   i: <Palette className="w-3.5 h-3.5" /> },
    { k: 'color',    l: 'Renk',       i: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { k: 'blur',     l: 'Bulanık',    i: <Wind className="w-3.5 h-3.5" /> },
    { k: 'parallax', l: 'Parallax',   i: <Move className="w-3.5 h-3.5" /> },
    { k: 'anim',     l: 'Animasyon',  i: <Activity className="w-3.5 h-3.5" /> },
    { k: 'overlay',  l: 'Overlay',    i: <Layers className="w-3.5 h-3.5" /> },
    { k: 'general',  l: 'Genel',      i: <SettingsIcon className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start">
      <div className="flex-1 min-w-0 w-full space-y-3">
        <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-700/40 rounded-xl p-1 overflow-x-auto sticky top-0 z-10 backdrop-blur">
          {TABS.map(t => (
            <button key={t.k} type="button" onClick={() => setTab(t.k)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.k
                  ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/20 text-indigo-100 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}>
              {t.i}{t.l}
            </button>
          ))}
        </div>

        <div className="pb-20 space-y-3">
          {tab === 'image' && <ImagePanel cfg={cfg} upd={upd} />}
          {tab === 'gradient' && <GradientPanel cfg={cfg} upd={upd} />}
          {tab === 'color' && <ColorPanel cfg={cfg} upd={upd} />}
          {tab === 'blur' && <BlurPanel cfg={cfg} upd={upd} />}
          {tab === 'parallax' && <ParallaxPanel cfg={cfg} upd={upd} />}
          {tab === 'anim' && <AnimPanel cfg={cfg} upd={upd} />}
          {tab === 'overlay' && <OverlayPanel cfg={cfg} upd={upd} />}
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:opacity-90 disabled:opacity-50">
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
          <BgPreview cfg={cfg} />
        </div>
      </div>
    </div>
  );
}

/* ─── Form atoms ─── */
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
        onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
    </label>
  );
}
function Toggle({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-slate-400">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-600'}`}>
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
        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono" />
    </label>
  );
}

/* ─── Panels ─── */
function ImagePanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Arka Plan Tipi">
        <SelectField label="Tip" value={cfg.bg_type} options={[
          { value: 'image', label: '🖼 Görsel' },
          { value: 'gradient', label: '🌈 Gradient' },
          { value: 'solid', label: '🟩 Düz Renk' },
          { value: 'radial', label: '⭕ Radial Gradient' },
          { value: 'video', label: '🎥 Video (URL)' },
          { value: 'lottie', label: '✨ Lottie Animasyon' },
        ]} onChange={(v: any) => upd({ bg_type: v })} />
      </Section>
      {(cfg.bg_type === 'image' || cfg.bg_type === 'video' || cfg.bg_type === 'lottie') && (
        <Section title="Kaynak">
          <TextField label={cfg.bg_type === 'video' ? 'Video URL (mp4)' : cfg.bg_type === 'lottie' ? 'Lottie JSON URL' : 'Görsel URL'}
            value={cfg.image_url} onChange={(v: string) => upd({ image_url: v })} placeholder="https://..." />
          {cfg.bg_type === 'image' && (<>
            <SelectField label="Sığdırma" value={cfg.image_fit} options={[
              { value: 'cover', label: 'Cover (Doldur)' }, { value: 'contain', label: 'Contain (Sığdır)' },
              { value: 'fill', label: 'Fill (Bozarak doldur)' }, { value: 'tile', label: 'Tile (Tekrar)' },
              { value: 'center', label: 'Center (Ortala)' },
            ]} onChange={(v: any) => upd({ image_fit: v })} />
            <Slider label="X Konumu" min={0} max={100} step={1} value={cfg.image_position_x} onChange={(v: number) => upd({ image_position_x: v })} display={`${cfg.image_position_x}%`} />
            <Slider label="Y Konumu" min={0} max={100} step={1} value={cfg.image_position_y} onChange={(v: number) => upd({ image_position_y: v })} display={`${cfg.image_position_y}%`} />
            <Slider label="Ölçek" min={0.5} max={2} step={0.05} value={cfg.image_scale} onChange={(v: number) => upd({ image_scale: v })} display={`${cfg.image_scale.toFixed(2)}x`} />
            <Slider label="Opaklık" min={0.1} max={1} step={0.05} value={cfg.image_opacity} onChange={(v: number) => upd({ image_opacity: v })} display={`${Math.round(cfg.image_opacity * 100)}%`} />
            {cfg.image_fit === 'tile' && (
              <Slider label="Tile Boyutu" min={20} max={300} step={10} value={cfg.image_tile_size} onChange={(v: number) => upd({ image_tile_size: v })} display={`${cfg.image_tile_size}px`} />
            )}
          </>)}
        </Section>
      )}
    </div>
  );
}

function GradientPanel({ cfg, upd }: any) {
  const setStop = (idx: number, val: string) => {
    const next = [...cfg.gradient_stops];
    next[idx] = val;
    upd({ gradient_stops: next });
  };
  const addStop = () => upd({ gradient_stops: [...cfg.gradient_stops, '#FFFFFF 50%'] });
  const removeStop = (idx: number) => upd({ gradient_stops: cfg.gradient_stops.filter((_: any, i: number) => i !== idx) });
  return (
    <div className="space-y-3">
      {cfg.bg_type === 'gradient' && (
        <Section title="Lineer / Konik Gradient">
          <SelectField label="Tip" value={cfg.gradient_type} options={[
            { value: 'linear', label: 'Lineer' }, { value: 'radial', label: 'Radial' }, { value: 'conic', label: 'Konik' },
          ]} onChange={(v: any) => upd({ gradient_type: v })} />
          <Slider label="Açı" min={0} max={360} step={5} value={cfg.gradient_angle} onChange={(v: number) => upd({ gradient_angle: v })} display={`${cfg.gradient_angle}°`} />
          <div className="space-y-2">
            <div className="text-xs text-slate-400">Renk Durakları (HEX + %)</div>
            {cfg.gradient_stops.map((stop: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="text" value={stop} onChange={e => setStop(idx, e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200"
                  placeholder="#FFF 50%" />
                <button type="button" onClick={() => removeStop(idx)} className="text-rose-400 hover:text-rose-300 px-2">−</button>
              </div>
            ))}
            <button type="button" onClick={addStop} className="text-xs text-emerald-400 hover:text-emerald-300">+ Yeni Durak</button>
          </div>
        </Section>
      )}
      {cfg.bg_type === 'solid' && (
        <Section title="Düz Renk">
          <ColorField label="Renk" value={cfg.solid_color} onChange={(v: string) => upd({ solid_color: v })} />
        </Section>
      )}
      {cfg.bg_type === 'radial' && (
        <Section title="Radial Gradient">
          <ColorField label="İç Renk (Merkez)" value={cfg.radial_color_in} onChange={(v: string) => upd({ radial_color_in: v })} />
          <ColorField label="Dış Renk (Kenar)" value={cfg.radial_color_out} onChange={(v: string) => upd({ radial_color_out: v })} />
          <Slider label="Boyut" min={20} max={150} step={5} value={cfg.radial_size} onChange={(v: number) => upd({ radial_size: v })} display={`${cfg.radial_size}%`} />
        </Section>
      )}
      <Section title="Fallback Renk" hint="Görsel yüklenmediğinde gösterilir">
        <ColorField label="Fallback" value={cfg.fallback_color} onChange={(v: string) => upd({ fallback_color: v })} />
      </Section>
    </div>
  );
}

function ColorPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Renk Düzeltme (Color Grading)">
        <Slider label="Parlaklık" min={0.3} max={2} step={0.05} value={cfg.brightness} onChange={(v: number) => upd({ brightness: v })} display={`${cfg.brightness.toFixed(2)}x`} />
        <Slider label="Kontrast" min={0.5} max={2} step={0.05} value={cfg.contrast} onChange={(v: number) => upd({ contrast: v })} display={`${cfg.contrast.toFixed(2)}x`} />
        <Slider label="Doygunluk" min={0} max={2} step={0.05} value={cfg.saturation} onChange={(v: number) => upd({ saturation: v })} display={`${cfg.saturation.toFixed(2)}x`} />
        <Slider label="Renk Tonu (Hue)" min={0} max={360} step={5} value={cfg.hue_rotate} onChange={(v: number) => upd({ hue_rotate: v })} display={`${cfg.hue_rotate}°`} />
        <Slider label="Sepia" min={0} max={1} step={0.05} value={cfg.sepia} onChange={(v: number) => upd({ sepia: v })} display={`${Math.round(cfg.sepia * 100)}%`} />
        <Toggle label="Negatif (Invert)" checked={cfg.invert} onChange={(v: boolean) => upd({ invert: v })} />
      </Section>
    </div>
  );
}

function BlurPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Bulanıklık (Blur)">
        <Toggle label="Blur Aktif" checked={cfg.blur_enabled} onChange={(v: boolean) => upd({ blur_enabled: v })} />
        {cfg.blur_enabled && (
          <Slider label="Blur Miktarı" min={0} max={50} step={1} value={cfg.blur_amount} onChange={(v: number) => upd({ blur_amount: v })} display={`${cfg.blur_amount}px`} />
        )}
      </Section>
    </div>
  );
}

function ParallaxPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Parallax (Derinlik Efekti)" hint="Cihaz hareketinde arka plan ters yönde kayar">
        <Toggle label="Parallax Aktif" checked={cfg.parallax_enabled} onChange={(v: boolean) => upd({ parallax_enabled: v })} />
        {cfg.parallax_enabled && (<>
          <Slider label="Şiddet" min={0.05} max={1} step={0.05} value={cfg.parallax_intensity} onChange={(v: number) => upd({ parallax_intensity: v })} display={`${Math.round(cfg.parallax_intensity * 100)}%`} />
          <SelectField label="Yön" value={cfg.parallax_direction} options={[
            { value: 'vertical', label: 'Dikey' }, { value: 'horizontal', label: 'Yatay' }, { value: 'both', label: 'Her İkisi' },
          ]} onChange={(v: any) => upd({ parallax_direction: v })} />
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
          { value: 'pan', label: 'Yavaş Kaydırma' },
          { value: 'zoom', label: 'Yavaş Zoom In/Out' },
          { value: 'ken-burns', label: 'Ken Burns (Sinematik)' },
          { value: 'parallax-scroll', label: 'Parallax Scroll' },
          { value: 'rotate', label: 'Yavaş Dönüş' },
        ]} onChange={(v: any) => upd({ animation: v })} />
        {cfg.animation !== 'none' && (<>
          <Slider label="Hız (Tur Süresi)" min={3} max={60} step={1} value={cfg.anim_speed_sec} onChange={(v: number) => upd({ anim_speed_sec: v })} display={`${cfg.anim_speed_sec}sn`} />
          <Slider label="Genlik" min={0.1} max={1} step={0.05} value={cfg.anim_amplitude} onChange={(v: number) => upd({ anim_amplitude: v })} display={`${Math.round(cfg.anim_amplitude * 100)}%`} />
          {cfg.animation === 'ken-burns' && (
            <Slider label="Ken Burns Zoom Hedefi" min={1.02} max={1.5} step={0.02} value={cfg.ken_burns_zoom_to} onChange={(v: number) => upd({ ken_burns_zoom_to: v })} display={`${cfg.ken_burns_zoom_to.toFixed(2)}x`} />
          )}
        </>)}
      </Section>
    </div>
  );
}

function OverlayPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Renk Overlay">
        <Toggle label="Overlay Aktif" checked={cfg.overlay_enabled} onChange={(v: boolean) => upd({ overlay_enabled: v })} />
        {cfg.overlay_enabled && (<>
          <ColorField label="Overlay Rengi" value={cfg.overlay_color} onChange={(v: string) => upd({ overlay_color: v })} />
          <Slider label="Opaklık" min={0} max={1} step={0.05} value={cfg.overlay_opacity} onChange={(v: number) => upd({ overlay_opacity: v })} display={`${Math.round(cfg.overlay_opacity * 100)}%`} />
          <SelectField label="Karışım Modu (Blend)" value={cfg.overlay_blend_mode} options={[
            { value: 'normal', label: 'Normal' }, { value: 'multiply', label: 'Multiply' },
            { value: 'screen', label: 'Screen' }, { value: 'overlay', label: 'Overlay' },
            { value: 'darken', label: 'Darken' }, { value: 'lighten', label: 'Lighten' },
          ]} onChange={(v: any) => upd({ overlay_blend_mode: v })} />
        </>)}
      </Section>
      <Section title="Vignette (Köşe Karartma)">
        <Toggle label="Vignette Aktif" checked={cfg.vignette_enabled} onChange={(v: boolean) => upd({ vignette_enabled: v })} />
        {cfg.vignette_enabled && (<>
          <ColorField label="Renk" value={cfg.vignette_color} onChange={(v: string) => upd({ vignette_color: v })} />
          <Slider label="Şiddet" min={0.1} max={1} step={0.05} value={cfg.vignette_intensity} onChange={(v: number) => upd({ vignette_intensity: v })} display={`${Math.round(cfg.vignette_intensity * 100)}%`} />
        </>)}
      </Section>
    </div>
  );
}

function GeneralPanel({ cfg, upd }: any) {
  return (
    <div className="space-y-3">
      <Section title="Nerelerde Uygulanır">
        <Toggle label="Profil Sayfası" checked={cfg.applies_to_profile} onChange={(v: boolean) => upd({ applies_to_profile: v })} />
        <Toggle label="Odalar" checked={cfg.applies_to_room} onChange={(v: boolean) => upd({ applies_to_room: v })} />
        <Toggle label="Sohbetler" checked={cfg.applies_to_chat} onChange={(v: boolean) => upd({ applies_to_chat: v })} />
      </Section>
      <Section title="Katman">
        <Slider label="Z-Index" min={-10} max={10} step={1} value={cfg.layer_z_index} onChange={(v: number) => upd({ layer_z_index: v })} display={`${cfg.layer_z_index}`} />
      </Section>
    </div>
  );
}

/* ─── Preview ─── */
function BgPreview({ cfg }: { cfg: BgConfig }) {
  const W = 320, H = 480;

  let bgStyle: React.CSSProperties = { background: cfg.fallback_color };
  if (cfg.bg_type === 'solid') bgStyle = { background: cfg.solid_color };
  else if (cfg.bg_type === 'gradient') {
    const stops = cfg.gradient_stops.join(', ');
    bgStyle = cfg.gradient_type === 'linear' ? { backgroundImage: `linear-gradient(${cfg.gradient_angle}deg, ${stops})` }
      : cfg.gradient_type === 'radial' ? { backgroundImage: `radial-gradient(circle, ${stops})` }
      : { backgroundImage: `conic-gradient(from ${cfg.gradient_angle}deg, ${stops})` };
  }
  else if (cfg.bg_type === 'radial') {
    bgStyle = { backgroundImage: `radial-gradient(circle, ${cfg.radial_color_in} 0%, ${cfg.radial_color_out} ${cfg.radial_size}%)` };
  }
  else if (cfg.bg_type === 'image' && cfg.image_url) {
    const sizeMap: Record<string, string> = { cover: 'cover', contain: 'contain', fill: '100% 100%', tile: `${cfg.image_tile_size}px`, center: 'auto' };
    bgStyle = {
      backgroundImage: `url(${cfg.image_url})`,
      backgroundSize: sizeMap[cfg.image_fit],
      backgroundPosition: `${cfg.image_position_x}% ${cfg.image_position_y}%`,
      backgroundRepeat: cfg.image_fit === 'tile' ? 'repeat' : 'no-repeat',
      opacity: cfg.image_opacity,
      transform: `scale(${cfg.image_scale})`,
      transformOrigin: 'center center',
    };
  }
  else if (cfg.bg_type === 'video' && cfg.image_url) {
    // Video preview as embedded video, no extra style
  }

  const filter = [
    cfg.brightness !== 1 && `brightness(${cfg.brightness})`,
    cfg.contrast !== 1 && `contrast(${cfg.contrast})`,
    cfg.saturation !== 1 && `saturate(${cfg.saturation})`,
    cfg.hue_rotate > 0 && `hue-rotate(${cfg.hue_rotate}deg)`,
    cfg.sepia > 0 && `sepia(${cfg.sepia})`,
    cfg.invert && 'invert(1)',
    cfg.blur_enabled && cfg.blur_amount > 0 && `blur(${cfg.blur_amount}px)`,
  ].filter(Boolean).join(' ');

  const animMap: Record<string, string> = {
    pan: `bg-pan ${cfg.anim_speed_sec}s ease-in-out infinite alternate`,
    zoom: `bg-zoom ${cfg.anim_speed_sec}s ease-in-out infinite alternate`,
    'ken-burns': `bg-ken-burns ${cfg.anim_speed_sec}s ease-in-out infinite alternate`,
    'parallax-scroll': `bg-pan ${cfg.anim_speed_sec * 2}s linear infinite`,
    rotate: `bg-rotate ${cfg.anim_speed_sec * 2}s linear infinite`,
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/40 relative mx-auto" style={{ width: W, height: H }}>
      <style>{`
        @keyframes bg-pan { from { background-position: 0% 0% } to { background-position: 100% 100% } }
        @keyframes bg-zoom { 0%{transform:scale(1)} 100%{transform:scale(${1 + cfg.anim_amplitude * 0.3})} }
        @keyframes bg-ken-burns { 0%{transform:scale(1) translate(0,0)} 100%{transform:scale(${cfg.ken_burns_zoom_to}) translate(-${cfg.anim_amplitude * 5}%, -${cfg.anim_amplitude * 5}%)} }
        @keyframes bg-rotate { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>

      {/* Video preview */}
      {cfg.bg_type === 'video' && cfg.image_url ? (
        <video src={cfg.image_url} autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: filter || undefined, animation: animMap[cfg.animation] || undefined }} />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            ...bgStyle,
            filter: filter || undefined,
            animation: animMap[cfg.animation] || undefined,
            zIndex: cfg.layer_z_index,
          }}
        />
      )}

      {/* Overlay */}
      {cfg.overlay_enabled && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: cfg.overlay_color, opacity: cfg.overlay_opacity, mixBlendMode: cfg.overlay_blend_mode as any, zIndex: 2 }} />
      )}

      {/* Vignette */}
      {cfg.vignette_enabled && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle, transparent 40%, ${cfg.vignette_color} 100%)`, opacity: cfg.vignette_intensity, zIndex: 3 }} />
      )}

      {/* Mock content over bg */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 mb-3 shadow-2xl" />
        <div className="text-white text-base font-bold drop-shadow-lg">Burak DENİZ</div>
        <div className="text-slate-200 text-xs mt-1 drop-shadow">@burak · Profil mock</div>
        <div className="mt-3 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs text-white border border-white/20">
          Arkaplan önizleme
        </div>
      </div>
    </div>
  );
}
