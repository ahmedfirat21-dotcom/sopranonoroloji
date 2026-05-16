"use client";
import React from 'react';

/**
 * ★ v285 (16 May 2026): mobile prop — admin ayarın APK'ya yansıyıp yansımadığını
 *   gösterir. 'ok' yeşil ✓ (tüm field'lar render'a bağlı), 'partial' sarı ⚠
 *   (bir kısmı bağlı), 'none' kırmızı ✗ (DB'ye yazılır ama mobile kullanmaz).
 *   Audit: c:\SopranoChat services/roomLayoutConfig.ts ↔ components/room/* grep'i.
 */
export function Section({ title, children, hint, mobile }: {
  title: string; children: React.ReactNode; hint?: string;
  mobile?: 'ok' | 'partial' | 'none';
}) {
  // ★ v286: 'ok' rozetini gizliyoruz — sayfanın üstünde 'Tek vücut' banner'ı zaten
  //   her ayarın APK'ya yansıdığını söylüyor; her section'da tekrar yeşil rozet
  //   görsel gürültü olur. Rozet sadece uyarı amaçlı kalsın (partial/none).
  const badge = mobile === 'partial' ? { label: 'APK kısmi ⚠', cls: 'bg-amber-500/15 border-amber-500/40 text-amber-300' }
              : mobile === 'none' ? { label: 'APK yansımaz ✗', cls: 'bg-rose-500/15 border-rose-500/40 text-rose-300' }
              : null;
  return (
    <div className={`rounded-xl border p-4 space-y-3 ${
      mobile === 'none' ? 'border-rose-500/30 bg-rose-500/[0.03]'
      : mobile === 'partial' ? 'border-amber-500/30 bg-amber-500/[0.03]'
      : 'border-slate-700/40 bg-slate-900/30'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">{title}</h3>
          {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
        </div>
        {badge && (
          <span className={`shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function Slider({ label, min, max, step, value, onChange, display }: {
  label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; display: string;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span className="text-slate-200 font-mono">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-teal-500" />
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer">
      <span className="text-xs text-slate-400">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input type="color" value={normalizeColor(value)} onChange={(e) => onChange(e.target.value)}
          className="w-9 h-7 rounded border-0 bg-transparent cursor-pointer" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200" />
      </div>
    </label>
  );
}

export function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function TextField({ label, value, onChange, placeholder, mono }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 ${mono ? 'font-mono' : ''}`} />
    </label>
  );
}

function normalizeColor(c: string): string {
  if (!c) return '#000000';
  if (c.startsWith('#') && (c.length === 7 || c.length === 4)) return c;
  // rgba — color picker tarafı için
  const m = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (m) {
    const r = parseInt(m[1]).toString(16).padStart(2, '0');
    const g = parseInt(m[2]).toString(16).padStart(2, '0');
    const b = parseInt(m[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#000000';
}

// ─── Sabit option listeleri ───
export const SHAPE_OPTS = [
  { value: 'circle', label: 'Yuvarlak (Daire)' },
  { value: 'square', label: 'Kare' },
  { value: 'rounded', label: 'Yuvarlatılmış Kare' },
  { value: 'hex', label: 'Altıgen' },
];
export const RING_STYLE_OPTS = [
  { value: 'solid', label: 'Düz' },
  { value: 'dashed', label: 'Kesik' },
  { value: 'dotted', label: 'Noktalı' },
  { value: 'none', label: 'Yok' },
];
export const NAME_POS_OPTS = [
  { value: 'below', label: 'Altta' },
  { value: 'above', label: 'Üstte' },
  { value: 'inside', label: 'İçeride' },
  { value: 'hidden', label: 'Gizli' },
];
export const BADGE_POS_OPTS = [
  { value: 'topRight', label: 'Sağ Üst' },
  { value: 'topLeft', label: 'Sol Üst' },
  { value: 'bottomRight', label: 'Sağ Alt' },
  { value: 'bottomLeft', label: 'Sol Alt' },
  { value: 'hidden', label: 'Gizli' },
];
export const CORNER_OPTS = [
  { value: 'topRight', label: 'Sağ Üst' },
  { value: 'topLeft', label: 'Sol Üst' },
  { value: 'bottomRight', label: 'Sağ Alt' },
  { value: 'bottomLeft', label: 'Sol Alt' },
];
export const WEIGHT_OPTS = [
  { value: '400', label: 'Normal (400)' },
  { value: '500', label: 'Orta (500)' },
  { value: '600', label: 'Yarı Kalın (600)' },
  { value: '700', label: 'Kalın (700)' },
  { value: '800', label: 'Ekstra Kalın (800)' },
  { value: '900', label: 'En Kalın (900)' },
];
export const DIVIDER_OPTS = [
  { value: 'none', label: 'Yok' },
  { value: 'line', label: 'Düz Çizgi' },
  { value: 'gradient', label: 'Gradient' },
];
export const BG_TYPE_OPTS = [
  { value: 'gradient', label: 'Gradient' },
  { value: 'solid', label: 'Düz Renk' },
  { value: 'image', label: 'Görsel' },
  { value: 'none', label: 'Yok' },
];
export const ENTER_OPTS = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'none', label: 'Yok' },
];
export const CAMERA_OPTS = [
  { value: '1:1', label: 'Kare 1:1' },
  { value: '16:9', label: 'Manzara 16:9' },
  { value: '4:3', label: 'Klasik 4:3' },
];
export const BTN_SHAPE_OPTS = [
  { value: 'circle', label: 'Yuvarlak' },
  { value: 'rounded', label: 'Yuvarlatılmış Kare' },
];
