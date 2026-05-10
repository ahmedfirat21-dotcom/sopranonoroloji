"use client";

/**
 * Çerçeve Editör — sürükle-bırak frame ayarları.
 *
 * Frame Lottie'si avatar üstüne overlay olur. Editörde:
 *  - Frame ölçeği (avatar'a göre)
 *  - Frame X/Y offset
 *  - Avatar boyut oranı (frame içine sığma)
 *  - Frame rotation/glow (sürekli animasyon)
 *  - Lottie filter (hue, brightness, saturation)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { Save, RotateCcw, Award, Move, Sparkles, Settings as SettingsIcon } from 'lucide-react';

interface FrameConfig {
  // Frame Lottie ayarları
  frame_scale: number;          // Lottie kompozisyonu / avatar oranı (1.0=eşit, >1 dışa taşar)
  frame_offset_x: number;       // -0.3..0.3 (% avatar)
  frame_offset_y: number;
  frame_rotation: number;       // sürekli dönme hızı (sn) — 0=sabit
  frame_opacity: number;
  // Avatar
  avatar_ratio: number;         // 0.6..1.0 — avatar boyutu (size'ın % kaçı)
  // Glow / parlaklık
  glow_enabled: boolean;
  glow_color: string;
  glow_intensity: number;
  // Lottie filter
  lottie_hue_rotate: number;
  lottie_brightness: number;
  lottie_saturation: number;
  lottie_speed: number;
}

const DEFAULT_CONFIG: FrameConfig = {
  frame_scale: 1.0,
  frame_offset_x: 0,
  frame_offset_y: 0,
  frame_rotation: 0,
  frame_opacity: 1,
  avatar_ratio: 0.92,
  glow_enabled: false,
  glow_color: '#fbbf24',
  glow_intensity: 0.5,
  lottie_hue_rotate: 0,
  lottie_brightness: 1,
  lottie_saturation: 1,
  lottie_speed: 1,
};

const SAMPLE_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop';
const STAGE_SIZE = 480;
// ★ v213e: Mobile size selector — gerçek emülatör pixel boyutlarına göre simulate
const MOBILE_SIZES = [
  { v: 60, l: 'Mini (60)' },
  { v: 80, l: 'Listener (80)' },
  { v: 120, l: 'Speaker (120)' },
  { v: 160, l: 'Stage Host (160)' },
  { v: 200, l: 'Profile (200)' },
];

// Frame Lottie haritası — frameLottieRegistry.ts ile senkron
const FRAME_LOTTIE_MAP: Record<string, string> = {
  'aurelius': '/lotties/Avatar frame.json',
  'lunaris': '/lotties/Avatar-Frame1.json',
  'rose-eternel': '/lotties/Avatar_Frame2.json',
  'cadence-soprano': '/lotties/Profile Frame.json',
  'soprano-aura': '/lotties/SopranoAura.json',
  'midnight-amethyst': '/lotties/MidnightAmethyst.json',
  'sunrise-gold': '/lotties/SunriseGold.json',
  'ocean-pearl': '/lotties/OceanPearl.json',
  'ruby-flame': '/lotties/RubyFlame.json',
  'neon-pulse': '/lotties/NeonPulse.json',
  'celestial-orbit': '/lotties/CelestialOrbit.json',
  'hex-prism': '/lotties/HexPrism.json',
  'pulse-wave': '/lotties/PulseWave.json',
  'eclipse-corona': '/lotties/EclipseCorona.json',
  'glitch-matrix': '/lotties/GlitchMatrix.json',
};

export default function FrameEditor({ item }: { item: any }) {
  const initialCfg: FrameConfig = useMemo(() => {
    const fromCfg = (item.editor_config as any)?.frame_config;
    return { ...DEFAULT_CONFIG, ...(fromCfg || {}) };
  }, [item.id]);

  const [cfg, setCfg] = useState<FrameConfig>(initialCfg);
  const [lottieData, setLottieData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  // ★ Mobile boyut: önizleme bu boyutta (gerçek emülatör pixel), oran kalır
  const [mobileSize, setMobileSize] = useState(160);

  // ★ 2026-05-11: asset_url (DB'deki yeni kolon) öncelikli — web admin'den yüklenen
  //   yeni ürünlerin id'si hardcoded FRAME_LOTTIE_MAP'te olmaz, ama asset_url'de var.
  //   Eski editor_config.lottie_url ve FRAME_LOTTIE_MAP backward-compat için kalıyor.
  const assetUrl: string | null =
    (typeof item.asset_url === 'string' && item.asset_url) ||
    (item.editor_config as any)?.lottie_url ||
    FRAME_LOTTIE_MAP[item.id] ||
    null;
  // Asset Lottie mi (.json) yoksa görsel mi (PNG/JPG/SVG/GIF/WebP)?
  const isLottie = !!assetUrl && /\.json($|\?)/i.test(assetUrl);
  const lottieUrl = isLottie ? assetUrl : null;
  const imageUrl = !isLottie ? assetUrl : null;

  useEffect(() => {
    if (!lottieUrl) {
      setLottieData(null);
      return;
    }
    fetch(lottieUrl).then(r => r.json()).then(setLottieData).catch(() => setLottieData(null));
  }, [lottieUrl]);

  function update<K extends keyof FrameConfig>(key: K, value: FrameConfig[K]) {
    setCfg(c => ({ ...c, [key]: value }));
  }

  function reset() { setCfg(DEFAULT_CONFIG); }

  async function save() {
    setSaving(true);
    setSavedNote(null);
    try {
      const res = await fetch(`/api/yonet/frames/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame_config: cfg }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedNote('Kaydedildi ✓');
    } catch (e: any) {
      setSavedNote('Hata: ' + (e?.message || 'unknown'));
    } finally {
      setSaving(false);
      setTimeout(() => setSavedNote(null), 3000);
    }
  }

  // ★ v213e: Mobile-matching — emülatörde size=mobileSize için aynı pixel hesabı.
  //   StatusAvatar mobile: avatarSize = size * avatar_ratio (centered in size wrapper)
  //   AvatarFrame mobile: lottieSize = size * scale (overlay)
  const frameContainerSize = Math.round(mobileSize * cfg.frame_scale);
  const avatarSize = Math.round(mobileSize * cfg.avatar_ratio);
  const stageCenter = STAGE_SIZE / 2;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6">
      {/* SOL — preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-300">Çerçeve Önizleme</h2>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] text-slate-500 mr-1">Boyut:</span>
            {MOBILE_SIZES.map(s => (
              <button key={s.v} type="button" onClick={() => setMobileSize(s.v)}
                className={`text-[11px] px-2 py-1 rounded border ${mobileSize === s.v
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <div
          className="relative rounded-lg overflow-hidden shadow-2xl"
          style={{ width: STAGE_SIZE, height: STAGE_SIZE, background: 'linear-gradient(180deg, #1e293b 0%, #0a0f1a 100%)' }}
        >
          {/* Mock chat avatarları */}
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-slate-700"
                style={{ background: ['#22d3ee', '#fb923c', '#a78bfa'][i - 1] }} />
            ))}
          </div>
          <div className="absolute bottom-3 left-3 right-3 text-center text-xs text-slate-400 z-10">
            Sahnede avatar — frame avatarın etrafında render olur
          </div>

          {/* Avatar — merkezi, sabit boyutta */}
          <div
            style={{
              position: 'absolute',
              left: stageCenter - avatarSize / 2,
              top: stageCenter - avatarSize / 2,
              width: avatarSize,
              height: avatarSize,
              borderRadius: '50%',
              overflow: 'hidden',
              zIndex: 2,
              boxShadow: cfg.glow_enabled
                ? `0 0 ${20 * cfg.glow_intensity}px ${cfg.glow_color}, 0 0 ${40 * cfg.glow_intensity}px ${cfg.glow_color}80`
                : undefined,
            }}
          >
            <img src={SAMPLE_AVATAR} alt="" className="w-full h-full object-cover" />
          </div>

          {/* Frame Lottie — avatar etrafında, scale'a göre büyüyebilir */}
          {lottieData && (
            <div
              style={{
                position: 'absolute',
                left: stageCenter - frameContainerSize / 2 + cfg.frame_offset_x * mobileSize,
                top: stageCenter - frameContainerSize / 2 + cfg.frame_offset_y * mobileSize,
                width: frameContainerSize,
                height: frameContainerSize,
                opacity: cfg.frame_opacity,
                filter: `hue-rotate(${cfg.lottie_hue_rotate}deg) brightness(${cfg.lottie_brightness}) saturate(${cfg.lottie_saturation})`,
                animation: cfg.frame_rotation > 0 ? `frame-spin ${cfg.frame_rotation}s linear infinite` : undefined,
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              <Lottie animationData={lottieData} loop autoplay speed={cfg.lottie_speed}
                style={{ width: '100%', height: '100%' }} />
            </div>
          )}
          {/* ★ PNG/JPG/SVG asset — Lottie değilse direkt Image render
                Hue/brightness/saturation filtresi PNG'lere de uygulanabilir;
                speed/rotation animasyonu sadece Lottie spesifik (PNG için rotation yine çalışır). */}
          {imageUrl && !lottieData && (
            <div
              style={{
                position: 'absolute',
                left: stageCenter - frameContainerSize / 2 + cfg.frame_offset_x * mobileSize,
                top: stageCenter - frameContainerSize / 2 + cfg.frame_offset_y * mobileSize,
                width: frameContainerSize,
                height: frameContainerSize,
                opacity: cfg.frame_opacity,
                filter: `hue-rotate(${cfg.lottie_hue_rotate}deg) brightness(${cfg.lottie_brightness}) saturate(${cfg.lottie_saturation})`,
                animation: cfg.frame_rotation > 0 ? `frame-spin ${cfg.frame_rotation}s linear infinite` : undefined,
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          )}
          {/* Hiç asset yoksa kullanıcıyı bilgilendir */}
          {!lottieData && !imageUrl && (
            <div
              style={{
                position: 'absolute',
                left: stageCenter - 120,
                top: stageCenter + avatarSize / 2 + 20,
                width: 240,
                textAlign: 'center',
                fontSize: 11,
                color: '#94a3b8',
                zIndex: 3,
              }}
            >
              ⚠️ Bu ürünün asset dosyası yok.<br />
              <span style={{ color: '#fbbf24' }}>Mağaza → Düzenle</span>'den dosya yükle.
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Avatar görsel sabit. Frame ölçeği avatara göre büyür/küçülür.
        </p>
      </div>

      {/* SAĞ — config panel */}
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
        <div className="flex items-center justify-between sticky top-0 bg-[#0a0f1a]/95 backdrop-blur-md z-20 py-2 -mt-2">
          <h2 className="text-sm font-semibold text-slate-300">Yapılandırma</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white text-xs font-medium">
              <Save className="w-3.5 h-3.5" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
        {savedNote && <div className="text-xs text-emerald-300">{savedNote}</div>}

        <Section title="Avatar — İç Doluluk" icon={<Award className="w-4 h-4 text-amber-400" />}>
          <Slider label="Avatar Oranı" min={0.6} max={1.05} step={0.01} value={cfg.avatar_ratio} onChange={v => update('avatar_ratio', v)} display={`${Math.round(cfg.avatar_ratio * 100)}%`} />
          <p className="text-[11px] text-slate-500">Avatar'ın size'a göre boyutu. Frame iç dairesini doldurmasını sağlar.</p>
        </Section>

        <Section title="Frame — Konum & Boyut" icon={<Move className="w-4 h-4 text-purple-400" />}>
          <Slider label="Ölçek (Avatar'a göre)" min={0.8} max={2.0} step={0.02} value={cfg.frame_scale} onChange={v => update('frame_scale', v)} display={`${cfg.frame_scale.toFixed(2)}x`} />
          <Slider label="Yatay Kaydır" min={-0.3} max={0.3} step={0.01} value={cfg.frame_offset_x} onChange={v => update('frame_offset_x', v)} display={`${(cfg.frame_offset_x * 100).toFixed(0)}%`} />
          <Slider label="Dikey Kaydır" min={-0.3} max={0.3} step={0.01} value={cfg.frame_offset_y} onChange={v => update('frame_offset_y', v)} display={`${(cfg.frame_offset_y * 100).toFixed(0)}%`} />
          <Slider label="Opaklık" min={0.3} max={1} step={0.05} value={cfg.frame_opacity} onChange={v => update('frame_opacity', v)} display={`${Math.round(cfg.frame_opacity * 100)}%`} />
        </Section>

        <Section title="Sürekli Animasyon" icon={<Sparkles className="w-4 h-4 text-cyan-400" />}>
          <SubBlock title="Frame Dönüşü">
            <Slider label="Hız (sn / 1 tur)" min={0} max={30} step={1} value={cfg.frame_rotation} onChange={v => update('frame_rotation', v)} display={cfg.frame_rotation === 0 ? 'Kapalı' : `${cfg.frame_rotation}sn`} />
            <p className="text-[11px] text-slate-500">0 = sabit, 5+ = yavaş dönme. Lottie'nin kendi animasyonuna ek dönme.</p>
          </SubBlock>
          <SubBlock title="Glow / Parlaklık (Avatar)">
            <Toggle label="Aktif" checked={cfg.glow_enabled} onChange={v => update('glow_enabled', v)} />
            {cfg.glow_enabled && (
              <>
                <ColorInput label="Renk" value={cfg.glow_color} onChange={v => update('glow_color', v)} />
                <Slider label="Şiddet" min={0.2} max={1.5} step={0.05} value={cfg.glow_intensity} onChange={v => update('glow_intensity', v)} display={`${cfg.glow_intensity.toFixed(2)}x`} />
              </>
            )}
          </SubBlock>
        </Section>

        <Section title="Lottie Renk Filtreleri" icon={<Sparkles className="w-4 h-4 text-pink-400" />}>
          <Slider label="Renk Tonu (Hue)" min={0} max={360} step={5} value={cfg.lottie_hue_rotate} onChange={v => update('lottie_hue_rotate', v)} display={`${cfg.lottie_hue_rotate}°`} />
          <Slider label="Parlaklık" min={0.3} max={2} step={0.05} value={cfg.lottie_brightness} onChange={v => update('lottie_brightness', v)} display={`${cfg.lottie_brightness.toFixed(2)}x`} />
          <Slider label="Doygunluk" min={0} max={2} step={0.05} value={cfg.lottie_saturation} onChange={v => update('lottie_saturation', v)} display={`${cfg.lottie_saturation.toFixed(2)}x`} />
          <Slider label="Animasyon Hızı" min={0.25} max={3} step={0.05} value={cfg.lottie_speed} onChange={v => update('lottie_speed', v)} display={`${cfg.lottie_speed.toFixed(2)}x`} />
        </Section>

        <details className="text-xs">
          <summary className="cursor-pointer text-slate-400 select-none">JSON çıktı</summary>
          <pre className="mt-2 bg-slate-900 border border-slate-700 rounded p-3 overflow-auto max-h-64 text-[11px]">
{JSON.stringify({ frame_config: cfg }, null, 2)}
          </pre>
        </details>
      </div>

      <style jsx>{`
        @keyframes frame-spin {
          from { transform: rotate(0deg) }
          to { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
        {icon}{title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function SubBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-slate-800/40 border border-slate-700/40 p-3 space-y-2">
      <div className="text-[11px] font-semibold text-slate-400">{title}</div>
      {children}
    </div>
  );
}
function Slider({ label, min, max, step, value, onChange, display }: any) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span className="text-slate-300 font-mono">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-amber-500" />
    </label>
  );
}
function Toggle({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-amber-500" />
      {label}
    </label>
  );
}
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-8 rounded border-0 bg-transparent cursor-pointer" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono" />
      </div>
    </label>
  );
}
