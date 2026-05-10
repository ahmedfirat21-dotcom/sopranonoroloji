"use client";

/**
 * Entry Effect Editör — kapsamlı sürükle-bırak çalışma alanı.
 *
 * 4 ana bölge:
 *  1. Konumlandırma (X, Y, scale, mask)
 *  2. Giriş animasyonu (intro): fade, scale, slide, bounce, flip + duration + delay
 *  3. Sürekli (loop): rotateY 3D, pulse, glow, blur breathe + amplitude + speed
 *  4. Çıkış (outro): fade, scale, slide, blur + duration
 *  5. Metin (banner): pozisyon, renk, boyut
 *  6. Genel: süre, hız
 *
 * Canlı önizleme: avatar mock animasyonları gerçek zamanlı oynar.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { Save, RotateCcw, Sparkles, Move, Repeat, MessageSquare, Settings as SettingsIcon, Wand2 } from 'lucide-react';

// ─── Animasyon tipleri ──────────────────────────────────────────
type IntroAnim = 'none' | 'fade' | 'scale-up' | 'scale-down' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'bounce' | 'flip-x' | 'flip-y' | 'rotate-in' | 'zoom-blur';
type OutroAnim = 'none' | 'fade' | 'scale-down' | 'scale-up' | 'slide-up' | 'slide-down' | 'blur-out' | 'spin-out';

interface EntryConfig {
  // Konum + boyut
  has_avatar: boolean;
  avatar_x: number;
  avatar_y: number;
  avatar_scale: number;
  avatar_circular: boolean;

  // ★ Avatar yaşam döngüsü (Lottie içindeki appear/disappear noktaları)
  avatar_visible_start: number;  // 0..1 — Lottie'nin yüzde kaçında avatar görünür olur
  avatar_visible_end: number;    // 0..1 — Lottie'nin yüzde kaçında avatar kaybolur

  // Giriş animasyonu (intro)
  intro_anim: IntroAnim;
  intro_duration_ms: number;
  intro_delay_ms: number;

  // Sürekli (loop) animasyonlar
  loop_rotate_y: boolean;
  loop_rotate_y_deg: number;       // ±deg amplitude
  loop_rotate_y_speed: number;     // sn (full cycle)
  loop_rotate_x: boolean;
  loop_rotate_x_deg: number;
  loop_rotate_z: boolean;          // dönerek (spin)
  loop_rotate_z_speed: number;
  loop_pulse: boolean;
  loop_pulse_amount: number;       // 0-0.3
  loop_pulse_speed: number;        // sn
  loop_glow: boolean;
  loop_glow_color: string;
  loop_glow_intensity: number;     // 0-1
  loop_blur_breathe: boolean;
  loop_blur_max: number;           // px

  // Çıkış animasyonu
  outro_anim: OutroAnim;
  outro_duration_ms: number;

  // Metin (banner)
  text_visible: boolean;
  text_x: number;
  text_y: number;
  text_color: string;
  text_size: number;
  text_intro_anim: IntroAnim;

  // Genel
  duration_ms: number;
  lottie_speed: number;

  // ★ Lottie animasyonun kendisine müdahale
  lottie_scale: number;          // 0.5..2 — Lottie'yi büyüt/küçült
  lottie_offset_x: number;       // -0.5..0.5 — yatay kaydır (% canvas)
  lottie_offset_y: number;       // -0.5..0.5 — dikey kaydır
  lottie_rotation: number;       // -180..180 derece
  lottie_opacity: number;        // 0..1
  lottie_play_start: number;     // 0..1 — animasyon başlangıç noktası (%)
  lottie_play_end: number;       // 0..1 — bitiş noktası
  lottie_loop_count: number;     // 0 = sonsuz, 1+ = sayı
  lottie_hue_rotate: number;     // 0..360 — renk tonu kaydır
  lottie_brightness: number;     // 0.5..2
  lottie_saturation: number;     // 0..2
  lottie_invert: boolean;
}

const DEFAULT_CONFIG: EntryConfig = {
  has_avatar: false,
  avatar_x: 0.5,
  avatar_y: 0.55,
  avatar_scale: 0.22,
  avatar_circular: true,

  avatar_visible_start: 0.0,   // Lottie başında avatar görünür olur
  avatar_visible_end: 0.85,    // Lottie %85'te kaybolur (badge ile birlikte)

  intro_anim: 'scale-up',
  intro_duration_ms: 600,
  intro_delay_ms: 100,

  loop_rotate_y: false,
  loop_rotate_y_deg: 18,
  loop_rotate_y_speed: 3.2,
  loop_rotate_x: false,
  loop_rotate_x_deg: 12,
  loop_rotate_z: false,
  loop_rotate_z_speed: 8,
  loop_pulse: false,
  loop_pulse_amount: 0.06,
  loop_pulse_speed: 1.6,
  loop_glow: false,
  loop_glow_color: '#fbbf24',
  loop_glow_intensity: 0.6,
  loop_blur_breathe: false,
  loop_blur_max: 4,

  outro_anim: 'fade',
  outro_duration_ms: 400,

  text_visible: true,
  text_x: 0.5,
  text_y: 0.85,
  text_color: '#FFFFFF',
  text_size: 18,
  text_intro_anim: 'slide-up',

  duration_ms: 6000,
  lottie_speed: 1,

  // Lottie controls
  lottie_scale: 1,
  lottie_offset_x: 0,
  lottie_offset_y: 0,
  lottie_rotation: 0,
  lottie_opacity: 1,
  lottie_play_start: 0,
  lottie_play_end: 1,
  lottie_loop_count: 0,
  lottie_hue_rotate: 0,
  lottie_brightness: 1,
  lottie_saturation: 1,
  lottie_invert: false,
};

const SAMPLE_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';
const STAGE_W = 480;
const STAGE_H = 600;

export default function EntryEffectEditor({ item }: { item: any }) {
  const initialCfg: EntryConfig = useMemo(() => {
    // ★ v213e: meta TEXT, editor_config JSONB (yeni kolon). Eski kayıtlar boş.
    const fromCfg = (item.editor_config as any)?.entry_config;
    return { ...DEFAULT_CONFIG, ...(fromCfg || {}) };
  }, [item.id]);

  const [cfg, setCfg] = useState<EntryConfig>(initialCfg);
  const [lottieData, setLottieData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [sampleName, setSampleName] = useState('Burak DENİZ');
  const [previewKey, setPreviewKey] = useState(0);
  const [previewPhase, setPreviewPhase] = useState<'idle' | 'playing' | 'outro'>('idle');
  const [lottieProgress, setLottieProgress] = useState(0);
  const lottieRef = useRef<any>(null);
  // ★ v213c: Hedef layer'ın animated rotation keyframe'leri — avatar bu değerleri birebir takip eder
  const [syncedRotation, setSyncedRotation] = useState(0);

  // ★ Lottie kaynak haritası — entryEffectLottieRegistry.ts ile senkron
  const LOTTIE_MAP: Record<string, string> = {
    'constellation': '/lotties/Fireworks.json',
    'or-ancien': '/lotties/Star Strike Emoji.json',
    'inferno': '/lotties/Fire.json',
    'voltaire': '/lotties/Shooting Star.json',
    'belle-epoque': '/lotties/Heart characters crying.json',
    'ai-spark': '/lotties/AI_Spark.json',
  };
  // ★ 2026-05-11: asset_url (DB'deki yeni kolon) öncelikli — web admin'den yüklenen
  //   yeni ürünler hardcoded LOTTIE_MAP'te yok, asset_url'de var.
  const assetUrl: string | null =
    (typeof item.asset_url === 'string' && item.asset_url) ||
    (item.editor_config as any)?.lottie_url ||
    LOTTIE_MAP[item.id] ||
    null;
  const isLottie = !!assetUrl && /\.json($|\?)/i.test(assetUrl);
  const lottieUrl = isLottie ? assetUrl : null;

  useEffect(() => {
    if (!lottieUrl) {
      setLottieData(null);
      return;
    }
    fetch(lottieUrl).then(r => r.json()).then(setLottieData).catch(() => setLottieData(null));
  }, [lottieUrl]);

  // ★ v213c: Lottie içinde animated rotation içeren hedef layer'ı bul (memo).
  //   Avatar bu layer'ın anlık rotation değerini birebir takip edecek.
  const targetRotationLayer = useMemo(() => {
    if (!lottieData) return null;
    let best: any = null;
    let bestScore = -Infinity;
    function scan(layers: any[]) {
      for (const l of layers) {
        const r = l.ks?.r;
        if (!r || r.a !== 1) continue;
        const p = l.ks?.p?.k;
        if (!Array.isArray(p) || typeof p[0] !== 'number') continue;
        const cw = lottieData.w || 1000;
        const ch = lottieData.h || 1000;
        const dist = Math.hypot(p[0] - cw / 2, p[1] - ch / 2);
        const score = 1000 - dist;
        if (score > bestScore) { bestScore = score; best = l; }
        if (l.refId) {
          const ref = (lottieData.assets || []).find((a: any) => a.id === l.refId);
          if (ref?.layers) scan(ref.layers);
        }
      }
    }
    scan(lottieData.layers || []);
    return best;
  }, [lottieData]);

  // Rotation keyframe evaluator — verilen frame'de layer'ın rotation değerini hesaplar
  function evaluateRotation(layer: any, frame: number): number {
    const r = layer?.ks?.r;
    if (!r) return 0;
    if (r.a === 0) return typeof r.k === 'number' ? r.k : 0;
    const kfs = r.k;
    if (!Array.isArray(kfs) || kfs.length === 0) return 0;
    if (frame <= kfs[0].t) return kfs[0].s?.[0] ?? 0;
    if (frame >= kfs[kfs.length - 1].t) return kfs[kfs.length - 1].s?.[0] ?? 0;
    for (let i = 0; i < kfs.length - 1; i++) {
      const a = kfs[i], b = kfs[i + 1];
      if (frame >= a.t && frame <= b.t) {
        const t = (frame - a.t) / (b.t - a.t || 1);
        // Bezier easing kullanmak istersek a.i/a.o ile, basit linear yeterli görseller için
        const sa = a.s?.[0] ?? 0;
        const sb = b.s?.[0] ?? sa;
        return sa + (sb - sa) * t;
      }
    }
    return 0;
  }

  function update<K extends keyof EntryConfig>(key: K, value: EntryConfig[K]) {
    setCfg(c => ({ ...c, [key]: value }));
  }

  function reset() { setCfg(DEFAULT_CONFIG); }

  // ★ AI Otomatik Yerleştir v2 — Lottie JSON'u DERINLEMESİNE analiz eder.
  //   Sadece top-level değil, tüm precomp hiyerarşisini tarar. "Badge body" gibi
  //   merkez küçük layer'ı bulur, animated transform'lara öncelik verir, scale'i
  //   layer'ın visible bbox'ından hesaplar (canvas full size'ından değil).
  function autoPosition() {
    if (!lottieData) return;
    const cw = lottieData.w || 1000;
    const ch = lottieData.h || 1000;

    type Cand = { score: number; x: number; y: number; size: number; name: string; path: string; layer: any };
    const candidates: Cand[] = [];

    // Precomp w/h'a karşı sub-layer pozisyonlarından gerçek visible bbox tahmin et
    function estimateVisibleSize(precomp: any): number {
      if (!precomp?.layers) return 0;
      const xs: number[] = [], ys: number[] = [];
      for (const sub of precomp.layers) {
        const sp = sub.ks?.p?.k;
        if (Array.isArray(sp) && typeof sp[0] === 'number') {
          xs.push(sp[0]); ys.push(sp[1]);
        }
      }
      if (xs.length < 2) return 0;
      const w = Math.max(...xs) - Math.min(...xs);
      const h = Math.max(...ys) - Math.min(...ys);
      return Math.max(w, h);
    }

    function scanLayers(layers: any[], path = '') {
      for (const l of layers) {
        const nm = (l.nm || '').toLowerCase();
        const ks = l.ks || {};
        const p = ks.p?.k;
        if (!Array.isArray(p) || typeof p[0] !== 'number') continue;
        const px = p[0], py = p[1];

        // Skor: isim eşleşme + merkez yakınlığı + animated bonus
        let score = 0;
        if (/badge|circle|center|avatar|host|user|profile|outline/i.test(nm)) score += 50;
        if (/badge3|badge4|main/i.test(nm)) score += 30; // ekstra primary
        if (/shape\s+layer/i.test(nm)) score -= 20;     // jenerik decorations

        const dist = Math.hypot(px - cw / 2, py - ch / 2);
        score += Math.max(0, 100 - (dist / cw) * 200);  // close to center

        // Animated transforms = subject olan layer
        if (ks.s?.a === 1) score += 40;
        if (ks.r?.a === 1) score += 20;
        if (ks.p?.a === 1) score += 10;

        // Boyut tahmini: precomp ref'liyse, content bbox'ından çıkar
        let estSize = 200;
        if (l.refId) {
          const ref = (lottieData.assets || []).find((a: any) => a.id === l.refId);
          if (ref) estSize = estimateVisibleSize(ref) || (ref.w || 200) * 0.4;
        } else if (l.w && l.h) {
          estSize = Math.min(l.w, l.h) * 0.5; // shape layer visible content ~ 50% of bbox
        }

        candidates.push({ score, x: px, y: py, size: estSize, name: nm, path, layer: l });

        // Recursive: precomp layers içine in
        if (l.refId) {
          const ref = (lottieData.assets || []).find((a: any) => a.id === l.refId);
          if (ref?.layers) scanLayers(ref.layers, path + nm + '/');
        }
      }
    }
    if (lottieData.layers) scanLayers(lottieData.layers);

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (!best) return;

    // Avatar size: layer'ın estimated boyutunun %35'i (badge cup'ın iç kısmı)
    // Üst sınır 0.30 (canvas %30) — badge'i tamamen kapatmaması için
    const computedScale = Math.max(0.15, Math.min(0.30, (best.size / cw) * 0.35));

    // ★ Lifecycle: hedef layer'ın ip/op'una göre avatar görünür süresi
    const totalFrames = lottieData.op || 1;
    const layerIp = typeof best.layer.ip === 'number' ? best.layer.ip : 0;
    const layerOp = typeof best.layer.op === 'number' ? best.layer.op : totalFrames;
    // Badge intro'su tipik olarak ilk %10-15'te. Avatar bunun ÖNCESİNDE değil, hemen
    // sonra appear olsun. Layer ip > 0 ise onu kullan, yoksa %10 başlangıç tahmin.
    const visibleStart = Math.max(0, Math.min(0.5, layerIp > 0 ? layerIp / totalFrames : 0.1));
    // Badge'in disappear'i tipik olarak son %10-15. Avatar bundan biraz önce kaybolsun.
    const visibleEnd = Math.max(visibleStart + 0.2, Math.min(0.95, layerOp / totalFrames - 0.05));

    setCfg(c => ({
      ...c,
      has_avatar: true,
      avatar_x: Math.max(0.1, Math.min(0.9, best.x / cw)),
      avatar_y: Math.max(0.1, Math.min(0.9, best.y / ch)),
      avatar_scale: computedScale,
      avatar_circular: true,
      avatar_visible_start: visibleStart,
      avatar_visible_end: visibleEnd,
      // Akıllı varsayılan animasyonlar — profesyonel hissi için
      intro_anim: 'bounce',
      intro_duration_ms: 700,
      intro_delay_ms: 200,
      loop_pulse: true,
      loop_pulse_amount: 0.04,
      loop_pulse_speed: 1.8,
      loop_rotate_y: true,
      loop_rotate_y_deg: 12,
      loop_rotate_y_speed: 3.2,
      loop_glow: true,
      loop_glow_color: '#fbbf24',
      loop_glow_intensity: 0.4,
      outro_anim: 'fade',
      outro_duration_ms: 500,
    }));
    const top3 = candidates.slice(0, 3).map(c => `${c.name || '?'}(${c.score.toFixed(0)})`).join(', ');
    setSavedNote(`AI: ${best.name || 'unnamed'} → konum (${(best.x / cw * 100).toFixed(0)}%, ${(best.y / ch * 100).toFixed(0)}%), boyut %${(computedScale * 100).toFixed(0)}, intro+pulse+glow eklendi. Top3: ${top3}`);
    setTimeout(() => setSavedNote(null), 8000);
  }

  function replayPreview() {
    setPreviewPhase('playing');
    setPreviewKey(k => k + 1);
    // Outro tetikle (intro + duration sonrası)
    const totalMs = cfg.intro_delay_ms + cfg.intro_duration_ms + cfg.duration_ms;
    setTimeout(() => setPreviewPhase('outro'), totalMs);
    setTimeout(() => setPreviewPhase('idle'), totalMs + cfg.outro_duration_ms + 200);
  }

  async function save() {
    setSaving(true);
    setSavedNote(null);
    try {
      const res = await fetch(`/api/yonet/entry-effects/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_config: cfg }),
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

  // Drag handler
  const stageRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  function onPointerDown(e: React.PointerEvent) {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    movePointer(e);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    movePointer(e);
  }
  function onPointerUp() { draggingRef.current = false; }
  function movePointer(e: React.PointerEvent) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    update('avatar_x', Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
    update('avatar_y', Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)));
  }

  const avatarPxSize = Math.round(STAGE_W * cfg.avatar_scale);
  const avatarLeft = Math.round(STAGE_W * cfg.avatar_x - avatarPxSize / 2);
  const avatarTop = Math.round(STAGE_H * cfg.avatar_y - avatarPxSize / 2);
  const textLeft = Math.round(STAGE_W * cfg.text_x);
  const textTop = Math.round(STAGE_H * cfg.text_y);

  // ─── Animasyon CSS oluştur (intro + loops + outro) ───────────────
  // Avatar artık AvatarPreview component'inde RAF ile animasyonlu render. textStyle for intro-only.
  const textStyle = useMemo(() => buildTextStyle(cfg, previewPhase), [cfg, previewPhase, previewKey]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6">
      {/* SOL — oda simülasyonu */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Oda Simülasyonu (Önizleme)</h2>
          <button
            onClick={replayPreview}
            className="text-xs px-3 py-1.5 rounded-md bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-500/30"
          >
            ▶ Önizleme
          </button>
        </div>
        <div
          ref={stageRef}
          className="relative rounded-lg overflow-hidden shadow-2xl"
          style={{ width: STAGE_W, height: STAGE_H, background: 'linear-gradient(180deg, #0f172a 0%, #0a0f1a 100%)' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* Mock chat avatarları */}
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-9 h-9 rounded-full border-2 border-slate-700"
                style={{ background: ['#22d3ee', '#fb923c', '#a78bfa'][i - 1] }} />
            ))}
          </div>
          <div className="absolute top-3 right-3 text-slate-400 text-[10px] z-10">SAHNE</div>
          <div className="absolute bottom-2 left-2 right-2 rounded-md bg-slate-800/50 px-3 py-2 text-[11px] text-slate-300 z-10">
            ahmed: Hoş geldin {sampleName}!
          </div>

          {/* Lottie tüm canvas — Lottie kontrolleri (scale, offset, filter) uygulanmış */}
          {lottieData && (
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${cfg.lottie_offset_x * 100}%, ${cfg.lottie_offset_y * 100}%) scale(${cfg.lottie_scale}) rotate(${cfg.lottie_rotation}deg)`,
                opacity: cfg.lottie_opacity,
                filter: `hue-rotate(${cfg.lottie_hue_rotate}deg) brightness(${cfg.lottie_brightness}) saturate(${cfg.lottie_saturation})${cfg.lottie_invert ? ' invert(1)' : ''}`,
                transformOrigin: 'center center',
              }}
            >
              <Lottie
                lottieRef={lottieRef}
                animationData={lottieData}
                loop={cfg.lottie_loop_count === 0}
                autoplay
                speed={cfg.lottie_speed}
                initialSegment={(cfg.lottie_play_start > 0 || cfg.lottie_play_end < 1)
                  ? [
                      Math.floor((lottieData.op || 0) * cfg.lottie_play_start),
                      Math.floor((lottieData.op || 0) * cfg.lottie_play_end),
                    ] as any
                  : undefined}
                onEnterFrame={(e: any) => {
                  const total = lottieData.op || 1;
                  setLottieProgress(Math.min(1, e.currentTime / total));
                  // ★ Sync: hedef layer rotation'ını evaluate et → avatar bunu kullanır
                  if (targetRotationLayer) {
                    setSyncedRotation(evaluateRotation(targetRotationLayer, e.currentTime));
                  }
                }}
                onLoopComplete={() => {
                  // Avatar'ı yeniden hayata döndür (lifecycle replay)
                  setPreviewKey(k => k + 1);
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          )}

          {/* Avatar slot — Lottie progress ile lifecycle senkron + Lottie rotation ile birebir tracking */}
          {cfg.has_avatar && lottieProgress >= cfg.avatar_visible_start && lottieProgress <= cfg.avatar_visible_end && (
            <AvatarPreview
              key={`avatar-${previewKey}`}
              left={avatarLeft}
              top={avatarTop}
              size={avatarPxSize}
              circular={cfg.avatar_circular}
              cfg={cfg}
              previewPhase={previewPhase}
              previewKey={previewKey}
              syncedRotation={syncedRotation}
              hasSyncRotation={!!targetRotationLayer}
            />
          )}

          {/* Text */}
          {cfg.text_visible && (
            <div
              key={`text-${previewKey}`}
              className="absolute -translate-x-1/2 pointer-events-none font-bold whitespace-nowrap z-10"
              style={{
                left: textLeft, top: textTop, color: cfg.text_color, fontSize: cfg.text_size,
                textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                ...textStyle,
              }}
            >
              {sampleName}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Avatar slot'u sürükleyerek konumlandır. ▶ Önizleme tüm intro+loop+outro'yu canlı oynatır.
        </p>
      </div>

      {/* SAĞ — config paneli */}
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
        <div className="flex items-center justify-between sticky top-0 bg-[#0a0f1a]/95 backdrop-blur-md z-20 py-2 -mt-2">
          <h2 className="text-sm font-semibold text-slate-300">Yapılandırma</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={autoPosition} disabled={!lottieData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-600/20 hover:bg-violet-600/30 disabled:opacity-50 text-violet-200 border border-violet-500/40 text-xs">
              <Wand2 className="w-3.5 h-3.5" /> AI Otomatik
            </button>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-fuchsia-800 text-white text-xs font-medium">
              <Save className="w-3.5 h-3.5" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
        {savedNote && <div className="text-xs text-emerald-300">{savedNote}</div>}

        <Section title="Avatar — Konum & Boyut" icon={<Move className="w-4 h-4 text-fuchsia-400" />}>
          <Toggle label="Avatar göster" checked={cfg.has_avatar} onChange={v => update('has_avatar', v)} />
          {cfg.has_avatar && (
            <>
              <Slider label="X" min={0} max={1} step={0.01} value={cfg.avatar_x} onChange={v => update('avatar_x', v)} display={`${Math.round(cfg.avatar_x * 100)}%`} />
              <Slider label="Y" min={0} max={1} step={0.01} value={cfg.avatar_y} onChange={v => update('avatar_y', v)} display={`${Math.round(cfg.avatar_y * 100)}%`} />
              <Slider label="Boyut" min={0.05} max={0.6} step={0.01} value={cfg.avatar_scale} onChange={v => update('avatar_scale', v)} display={`${Math.round(cfg.avatar_scale * 100)}%`} />
              <Toggle label="Dairesel mask" checked={cfg.avatar_circular} onChange={v => update('avatar_circular', v)} />
            </>
          )}
        </Section>

        {cfg.has_avatar && (
          <Section title="Avatar Yaşam Döngüsü (Lottie ile senkron)" icon={<Repeat className="w-4 h-4 text-emerald-400" />}>
            <p className="text-[11px] text-slate-500 mb-2">
              Lottie'nin yüzde kaçında avatar görünür olur ve kaybolur. Badge'in patlayarak gelip kaybolma anına denk getirin.
            </p>
            <Slider label="Görünme Anı" min={0} max={1} step={0.01} value={cfg.avatar_visible_start}
              onChange={v => update('avatar_visible_start', v)}
              display={`%${Math.round(cfg.avatar_visible_start * 100)}`} />
            <Slider label="Kaybolma Anı" min={0} max={1} step={0.01} value={cfg.avatar_visible_end}
              onChange={v => update('avatar_visible_end', v)}
              display={`%${Math.round(cfg.avatar_visible_end * 100)}`} />
          </Section>
        )}

        {cfg.has_avatar && (
          <Section title="Giriş Animasyonu (Intro)" icon={<Sparkles className="w-4 h-4 text-emerald-400" />}>
            <Select label="Tip" value={cfg.intro_anim} onChange={v => update('intro_anim', v as IntroAnim)} options={[
              { v: 'none', l: 'Yok' },
              { v: 'fade', l: 'Fade In' },
              { v: 'scale-up', l: 'Scale Up (büyüyerek)' },
              { v: 'scale-down', l: 'Scale Down (küçülerek)' },
              { v: 'slide-up', l: 'Aşağıdan kayarak' },
              { v: 'slide-down', l: 'Yukarıdan kayarak' },
              { v: 'slide-left', l: 'Soldan kayarak' },
              { v: 'slide-right', l: 'Sağdan kayarak' },
              { v: 'bounce', l: 'Bounce (zıplayarak)' },
              { v: 'flip-x', l: 'Flip X (yatay 3D)' },
              { v: 'flip-y', l: 'Flip Y (dikey 3D)' },
              { v: 'rotate-in', l: 'Rotate In (dönerek)' },
              { v: 'zoom-blur', l: 'Zoom + Blur' },
            ]} />
            <Slider label="Süre (ms)" min={100} max={2000} step={50} value={cfg.intro_duration_ms} onChange={v => update('intro_duration_ms', v)} display={`${cfg.intro_duration_ms}`} />
            <Slider label="Gecikme (ms)" min={0} max={3000} step={50} value={cfg.intro_delay_ms} onChange={v => update('intro_delay_ms', v)} display={`${cfg.intro_delay_ms}`} />
          </Section>
        )}

        {cfg.has_avatar && (
          <Section title="Sürekli Animasyonlar (Loop)" icon={<Repeat className="w-4 h-4 text-cyan-400" />}>
            <SubBlock title="3D Sağ-Sol Salınım (RotateY)">
              <Toggle label="Aktif" checked={cfg.loop_rotate_y} onChange={v => update('loop_rotate_y', v)} />
              {cfg.loop_rotate_y && (
                <>
                  <Slider label="Açı (±°)" min={5} max={45} step={1} value={cfg.loop_rotate_y_deg} onChange={v => update('loop_rotate_y_deg', v)} display={`±${cfg.loop_rotate_y_deg}°`} />
                  <Slider label="Hız (sn)" min={0.5} max={8} step={0.1} value={cfg.loop_rotate_y_speed} onChange={v => update('loop_rotate_y_speed', v)} display={`${cfg.loop_rotate_y_speed.toFixed(1)}sn`} />
                </>
              )}
            </SubBlock>
            <SubBlock title="3D Aşağı-Yukarı Salınım (RotateX)">
              <Toggle label="Aktif" checked={cfg.loop_rotate_x} onChange={v => update('loop_rotate_x', v)} />
              {cfg.loop_rotate_x && (
                <Slider label="Açı (±°)" min={5} max={30} step={1} value={cfg.loop_rotate_x_deg} onChange={v => update('loop_rotate_x_deg', v)} display={`±${cfg.loop_rotate_x_deg}°`} />
              )}
            </SubBlock>
            <SubBlock title="Sürekli Dönme (RotateZ)">
              <Toggle label="Aktif" checked={cfg.loop_rotate_z} onChange={v => update('loop_rotate_z', v)} />
              {cfg.loop_rotate_z && (
                <Slider label="Hız (sn)" min={2} max={20} step={0.5} value={cfg.loop_rotate_z_speed} onChange={v => update('loop_rotate_z_speed', v)} display={`${cfg.loop_rotate_z_speed}sn`} />
              )}
            </SubBlock>
            <SubBlock title="Pulse / Nefes (Scale)">
              <Toggle label="Aktif" checked={cfg.loop_pulse} onChange={v => update('loop_pulse', v)} />
              {cfg.loop_pulse && (
                <>
                  <Slider label="Şiddet" min={0.02} max={0.3} step={0.01} value={cfg.loop_pulse_amount} onChange={v => update('loop_pulse_amount', v)} display={`±${Math.round(cfg.loop_pulse_amount * 100)}%`} />
                  <Slider label="Hız (sn)" min={0.5} max={5} step={0.1} value={cfg.loop_pulse_speed} onChange={v => update('loop_pulse_speed', v)} display={`${cfg.loop_pulse_speed.toFixed(1)}sn`} />
                </>
              )}
            </SubBlock>
            <SubBlock title="Glow / Parlaklık">
              <Toggle label="Aktif" checked={cfg.loop_glow} onChange={v => update('loop_glow', v)} />
              {cfg.loop_glow && (
                <>
                  <ColorInput label="Renk" value={cfg.loop_glow_color} onChange={v => update('loop_glow_color', v)} />
                  <Slider label="Şiddet" min={0.1} max={1} step={0.05} value={cfg.loop_glow_intensity} onChange={v => update('loop_glow_intensity', v)} display={`${Math.round(cfg.loop_glow_intensity * 100)}%`} />
                </>
              )}
            </SubBlock>
            <SubBlock title="Blur Breathe (Bulanık nefes)">
              <Toggle label="Aktif" checked={cfg.loop_blur_breathe} onChange={v => update('loop_blur_breathe', v)} />
              {cfg.loop_blur_breathe && (
                <Slider label="Maks Blur" min={1} max={12} step={0.5} value={cfg.loop_blur_max} onChange={v => update('loop_blur_max', v)} display={`${cfg.loop_blur_max}px`} />
              )}
            </SubBlock>
          </Section>
        )}

        {cfg.has_avatar && (
          <Section title="Çıkış Animasyonu (Outro)" icon={<Sparkles className="w-4 h-4 text-rose-400" />}>
            <Select label="Tip" value={cfg.outro_anim} onChange={v => update('outro_anim', v as OutroAnim)} options={[
              { v: 'none', l: 'Yok' },
              { v: 'fade', l: 'Fade Out' },
              { v: 'scale-down', l: 'Scale Down' },
              { v: 'scale-up', l: 'Scale Up (büyüyerek kayb)' },
              { v: 'slide-up', l: 'Yukarıya kayar' },
              { v: 'slide-down', l: 'Aşağıya kayar' },
              { v: 'blur-out', l: 'Blur Out' },
              { v: 'spin-out', l: 'Dönerek kayb' },
            ]} />
            <Slider label="Süre (ms)" min={100} max={2000} step={50} value={cfg.outro_duration_ms} onChange={v => update('outro_duration_ms', v)} display={`${cfg.outro_duration_ms}`} />
          </Section>
        )}

        <Section title="Metin (Banner)" icon={<MessageSquare className="w-4 h-4 text-amber-400" />}>
          <Toggle label="Metin göster" checked={cfg.text_visible} onChange={v => update('text_visible', v)} />
          {cfg.text_visible && (
            <>
              <Slider label="X" min={0} max={1} step={0.01} value={cfg.text_x} onChange={v => update('text_x', v)} display={`${Math.round(cfg.text_x * 100)}%`} />
              <Slider label="Y" min={0} max={1} step={0.01} value={cfg.text_y} onChange={v => update('text_y', v)} display={`${Math.round(cfg.text_y * 100)}%`} />
              <Slider label="Boyut" min={10} max={36} step={1} value={cfg.text_size} onChange={v => update('text_size', v)} display={`${cfg.text_size}px`} />
              <ColorInput label="Renk" value={cfg.text_color} onChange={v => update('text_color', v)} />
              <Select label="Giriş Animasyonu" value={cfg.text_intro_anim} onChange={v => update('text_intro_anim', v as IntroAnim)} options={[
                { v: 'none', l: 'Yok' },
                { v: 'fade', l: 'Fade' },
                { v: 'slide-up', l: 'Aşağıdan' },
                { v: 'slide-down', l: 'Yukarıdan' },
                { v: 'scale-up', l: 'Büyüyerek' },
                { v: 'bounce', l: 'Bounce' },
              ]} />
            </>
          )}
        </Section>

        <Section title="Lottie Animasyon Kontrolü" icon={<Sparkles className="w-4 h-4 text-purple-400" />}>
          <SubBlock title="Boyut & Konum">
            <Slider label="Ölçek" min={0.3} max={2} step={0.05} value={cfg.lottie_scale} onChange={v => update('lottie_scale', v)} display={`${cfg.lottie_scale.toFixed(2)}x`} />
            <Slider label="Yatay Kaydır" min={-0.5} max={0.5} step={0.01} value={cfg.lottie_offset_x} onChange={v => update('lottie_offset_x', v)} display={`${(cfg.lottie_offset_x * 100).toFixed(0)}%`} />
            <Slider label="Dikey Kaydır" min={-0.5} max={0.5} step={0.01} value={cfg.lottie_offset_y} onChange={v => update('lottie_offset_y', v)} display={`${(cfg.lottie_offset_y * 100).toFixed(0)}%`} />
            <Slider label="Döndür" min={-180} max={180} step={5} value={cfg.lottie_rotation} onChange={v => update('lottie_rotation', v)} display={`${cfg.lottie_rotation}°`} />
            <Slider label="Opaklık" min={0.1} max={1} step={0.05} value={cfg.lottie_opacity} onChange={v => update('lottie_opacity', v)} display={`${Math.round(cfg.lottie_opacity * 100)}%`} />
          </SubBlock>
          <SubBlock title="Frame Aralığı (Play Range)">
            <Slider label="Başlangıç" min={0} max={1} step={0.01} value={cfg.lottie_play_start} onChange={v => update('lottie_play_start', v)} display={`${Math.round(cfg.lottie_play_start * 100)}%`} />
            <Slider label="Bitiş" min={0} max={1} step={0.01} value={cfg.lottie_play_end} onChange={v => update('lottie_play_end', v)} display={`${Math.round(cfg.lottie_play_end * 100)}%`} />
            <Slider label="Hız" min={0.25} max={3} step={0.05} value={cfg.lottie_speed} onChange={v => update('lottie_speed', v)} display={`${cfg.lottie_speed.toFixed(2)}x`} />
            <Slider label="Loop Sayısı (0=sonsuz)" min={0} max={10} step={1} value={cfg.lottie_loop_count} onChange={v => update('lottie_loop_count', v)} display={cfg.lottie_loop_count === 0 ? '∞' : `${cfg.lottie_loop_count}`} />
          </SubBlock>
          <SubBlock title="Renk Filtreleri (Color Grading)">
            <Slider label="Renk Tonu (Hue)" min={0} max={360} step={5} value={cfg.lottie_hue_rotate} onChange={v => update('lottie_hue_rotate', v)} display={`${cfg.lottie_hue_rotate}°`} />
            <Slider label="Parlaklık" min={0.3} max={2} step={0.05} value={cfg.lottie_brightness} onChange={v => update('lottie_brightness', v)} display={`${cfg.lottie_brightness.toFixed(2)}x`} />
            <Slider label="Doygunluk" min={0} max={2} step={0.05} value={cfg.lottie_saturation} onChange={v => update('lottie_saturation', v)} display={`${cfg.lottie_saturation.toFixed(2)}x`} />
            <Toggle label="Negatif (Invert)" checked={cfg.lottie_invert} onChange={v => update('lottie_invert', v)} />
          </SubBlock>
        </Section>

        <Section title="Genel" icon={<SettingsIcon className="w-4 h-4 text-slate-400" />}>
          <Slider label="Toplam Görünür Süre (ms)" min={2000} max={12000} step={500} value={cfg.duration_ms} onChange={v => update('duration_ms', v)} display={`${cfg.duration_ms}`} />
          <label className="block">
            <div className="text-xs text-slate-400 mb-1">Önizleme metni</div>
            <input type="text" value={sampleName} onChange={e => setSampleName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" />
          </label>
        </Section>

        <details className="text-xs">
          <summary className="cursor-pointer text-slate-400 select-none">JSON çıktı</summary>
          <pre className="mt-2 bg-slate-900 border border-slate-700 rounded p-3 overflow-auto max-h-64 text-[11px]">
{JSON.stringify({ entry_config: cfg }, null, 2)}
          </pre>
        </details>
      </div>

      {/* ★ Stil — keyframe animasyonlarını CSS'e enjekte et */}
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fade-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes scale-up { from { transform: scale(0); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes scale-down-in { from { transform: scale(2); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes scale-down-out { from { transform: scale(1); opacity: 1 } to { transform: scale(0); opacity: 0 } }
        @keyframes slide-up { from { transform: translateY(80px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes slide-down { from { transform: translateY(-80px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes slide-left { from { transform: translateX(120px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes slide-right { from { transform: translateX(-120px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0 }
          60% { transform: scale(1.15); opacity: 1 }
          80% { transform: scale(0.95) }
          100% { transform: scale(1) }
        }
        @keyframes flip-x-in { from { transform: rotateX(-90deg); opacity: 0 } to { transform: rotateX(0); opacity: 1 } }
        @keyframes flip-y-in { from { transform: rotateY(-180deg); opacity: 0 } to { transform: rotateY(0); opacity: 1 } }
        @keyframes rotate-in { from { transform: rotate(-180deg) scale(0); opacity: 0 } to { transform: rotate(0) scale(1); opacity: 1 } }
        @keyframes zoom-blur-in { from { transform: scale(2); opacity: 0; filter: blur(20px) } to { transform: scale(1); opacity: 1; filter: blur(0) } }
        @keyframes blur-out { from { filter: blur(0); opacity: 1 } to { filter: blur(20px); opacity: 0 } }
        @keyframes spin-out { from { transform: rotate(0) scale(1); opacity: 1 } to { transform: rotate(360deg) scale(0); opacity: 0 } }
      `}</style>
    </div>
  );
}

// ─── Yardımcılar (animasyon CSS oluştur) ───────────────────────
function buildTextStyle(cfg: EntryConfig, phase: 'idle' | 'playing' | 'outro'): React.CSSProperties {
  const base: React.CSSProperties = {};
  if (phase === 'playing' && cfg.text_intro_anim !== 'none') {
    const map: Record<string, string> = {
      'fade': 'fade-in', 'slide-up': 'slide-up', 'slide-down': 'slide-down',
      'scale-up': 'scale-up', 'bounce': 'bounce-in',
    };
    const name = map[cfg.text_intro_anim];
    if (name) base.animation = `${name} 600ms 300ms ease-out both`;
  }
  return base;
}

// ─── AvatarPreview — RAF ile canlı animasyon ─────────────────
function AvatarPreview({ left, top, size, circular, cfg, previewPhase, previewKey, syncedRotation = 0, hasSyncRotation = false }: {
  left: number; top: number; size: number; circular: boolean;
  cfg: EntryConfig; previewPhase: 'idle' | 'playing' | 'outro'; previewKey: number;
  syncedRotation?: number; hasSyncRotation?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<number>(performance.now());
  // ★ Closure-safe ref: RAF her tick'te en taze syncedRotation'ı okusun
  const syncedRotationRef = useRef(syncedRotation);
  syncedRotationRef.current = syncedRotation;

  // RAF — sürekli loop animasyonları (rotateY/X/Z, pulse, glow, blur)
  useEffect(() => {
    let rafId = 0;
    startedAtRef.current = performance.now();
    const tick = () => {
      const el = ref.current;
      if (!el) { rafId = requestAnimationFrame(tick); return; }
      const t = (performance.now() - startedAtRef.current) / 1000; // sn

      const transforms: string[] = ['perspective(800px)'];
      // ★ v213c: Lottie sync — hedef layer'ın gerçek rotation'ını kullan (time-based değil)
      if (cfg.loop_rotate_y) {
        if (hasSyncRotation) {
          // Lottie'nin badge rotation'ı birebir takip — perfect sync (closure-safe ref)
          const lottieR = syncedRotationRef.current;
          transforms.push(`rotateY(${lottieR.toFixed(2)}deg)`);
        } else {
          // Fallback: Lottie'de rotation animasyonu yoksa time-based salınım
          const phase = (t / cfg.loop_rotate_y_speed) * 2 * Math.PI;
          const deg = Math.sin(phase) * cfg.loop_rotate_y_deg;
          transforms.push(`rotateY(${deg.toFixed(2)}deg)`);
        }
      }
      if (cfg.loop_rotate_x) {
        const phase = (t / 3) * 2 * Math.PI;
        const deg = Math.sin(phase) * cfg.loop_rotate_x_deg;
        transforms.push(`rotateX(${deg.toFixed(2)}deg)`);
      }
      if (cfg.loop_rotate_z) {
        const deg = (t / cfg.loop_rotate_z_speed) * 360;
        transforms.push(`rotateZ(${deg % 360}deg)`);
      }
      if (cfg.loop_pulse) {
        const phase = (t / cfg.loop_pulse_speed) * 2 * Math.PI;
        const scale = 1 + Math.sin(phase) * cfg.loop_pulse_amount;
        transforms.push(`scale(${scale.toFixed(3)})`);
      }
      el.style.transform = transforms.join(' ');

      // Blur breathe
      if (cfg.loop_blur_breathe) {
        const phase = (t / 2) * 2 * Math.PI;
        const blur = ((Math.sin(phase) + 1) / 2) * cfg.loop_blur_max;
        el.style.filter = `blur(${blur.toFixed(2)}px)`;
      } else {
        el.style.filter = '';
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    cfg.loop_rotate_y, cfg.loop_rotate_y_deg, cfg.loop_rotate_y_speed,
    cfg.loop_rotate_x, cfg.loop_rotate_x_deg,
    cfg.loop_rotate_z, cfg.loop_rotate_z_speed,
    cfg.loop_pulse, cfg.loop_pulse_amount, cfg.loop_pulse_speed,
    cfg.loop_blur_breathe, cfg.loop_blur_max,
    previewKey,
  ]);

  // Intro/outro animasyonu — Web Animations API
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (previewPhase === 'playing' && cfg.intro_anim !== 'none') {
      const kf = getIntroKeyframes(cfg.intro_anim);
      if (kf.length > 0) {
        const anim = el.animate(kf, {
          duration: cfg.intro_duration_ms,
          delay: cfg.intro_delay_ms,
          easing: 'cubic-bezier(0.34, 1.3, 0.5, 1)',
          fill: 'both',
        });
        return () => { try { anim.cancel(); } catch {} };
      }
    }
    if (previewPhase === 'outro' && cfg.outro_anim !== 'none') {
      const kf = getOutroKeyframes(cfg.outro_anim);
      if (kf.length > 0) {
        const anim = el.animate(kf, {
          duration: cfg.outro_duration_ms,
          easing: 'ease-in-out',
          fill: 'forwards',
        });
        return () => { try { anim.cancel(); } catch {} };
      }
    }
  }, [previewPhase, previewKey, cfg.intro_anim, cfg.intro_duration_ms, cfg.intro_delay_ms, cfg.outro_anim, cfg.outro_duration_ms]);

  // Glow box-shadow
  const glowStyle = cfg.loop_glow ? {
    boxShadow: `0 0 ${20 * cfg.loop_glow_intensity}px ${cfg.loop_glow_color}, 0 0 ${40 * cfg.loop_glow_intensity}px ${cfg.loop_glow_color}80`,
  } : {};

  return (
    <div
      ref={ref}
      className="absolute cursor-move border-2 border-fuchsia-400/70"
      style={{
        left, top, width: size, height: size,
        borderRadius: circular ? '50%' : 8,
        overflow: 'hidden',
        transformOrigin: 'center center',
        ...glowStyle,
      }}
    >
      <img src={SAMPLE_AVATAR} alt="" className="w-full h-full object-cover pointer-events-none" />
    </div>
  );
}

function getIntroKeyframes(type: IntroAnim): Keyframe[] {
  switch (type) {
    case 'fade': return [{ opacity: 0 }, { opacity: 1 }];
    case 'scale-up': return [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }];
    case 'scale-down': return [{ transform: 'scale(2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }];
    case 'slide-up': return [{ transform: 'translateY(80px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }];
    case 'slide-down': return [{ transform: 'translateY(-80px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }];
    case 'slide-left': return [{ transform: 'translateX(120px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }];
    case 'slide-right': return [{ transform: 'translateX(-120px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }];
    case 'bounce': return [
      { transform: 'scale(0)', opacity: 0, offset: 0 },
      { transform: 'scale(1.2)', opacity: 1, offset: 0.6 },
      { transform: 'scale(0.95)', offset: 0.8 },
      { transform: 'scale(1)', offset: 1 },
    ];
    case 'flip-x': return [{ transform: 'rotateX(-90deg)', opacity: 0 }, { transform: 'rotateX(0)', opacity: 1 }];
    case 'flip-y': return [{ transform: 'rotateY(-180deg)', opacity: 0 }, { transform: 'rotateY(0)', opacity: 1 }];
    case 'rotate-in': return [{ transform: 'rotate(-180deg) scale(0)', opacity: 0 }, { transform: 'rotate(0) scale(1)', opacity: 1 }];
    case 'zoom-blur': return [{ transform: 'scale(2)', opacity: 0, filter: 'blur(20px)' }, { transform: 'scale(1)', opacity: 1, filter: 'blur(0)' }];
    default: return [];
  }
}

function getOutroKeyframes(type: OutroAnim): Keyframe[] {
  switch (type) {
    case 'fade': return [{ opacity: 1 }, { opacity: 0 }];
    case 'scale-down': return [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }];
    case 'scale-up': return [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(2)', opacity: 0 }];
    case 'slide-up': return [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-80px)', opacity: 0 }];
    case 'slide-down': return [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(80px)', opacity: 0 }];
    case 'blur-out': return [{ filter: 'blur(0)', opacity: 1 }, { filter: 'blur(20px)', opacity: 0 }];
    case 'spin-out': return [{ transform: 'rotate(0) scale(1)', opacity: 1 }, { transform: 'rotate(360deg) scale(0)', opacity: 0 }];
    default: return [];
  }
}

// ─── UI Helpers ───────────────────────────────────────────────
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
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
    </label>
  );
}

function Toggle({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-fuchsia-500" />
      {label}
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-8 rounded border-0 bg-transparent cursor-pointer" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono" />
      </div>
    </label>
  );
}
