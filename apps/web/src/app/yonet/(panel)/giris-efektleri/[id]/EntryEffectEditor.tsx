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
import { Save, RotateCcw, Sparkles, Move, Repeat, MessageSquare, Settings as SettingsIcon, Wand2, Play, LogOut, Film, Wind, Volume2, Filter, Stars } from 'lucide-react';

// ★ v117 (13 May 2026): Sekme sistemi — mevcut tek scroll panel 9 tab'a bölündü
//   + yeni özellik tab'ları: Partikül, Sahne Efekti, Aura/Trail, Ses, Trigger.
type Tab = 'konum' | 'giris' | 'loop' | 'cikis' | 'banner' | 'lottie' | 'partikul' | 'sahne' | 'aura' | 'ses' | 'trigger' | 'genel';

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

  // ★ v117 — Yeni özellik paketleri (Skia render ile mobile)
  // ─── Partikül Sistemi ───
  particles_enabled: boolean;
  particles_type: 'confetti' | 'glitter' | 'stars' | 'hearts' | 'fireworks' | 'snowflakes' | 'smoke' | 'sparkles' | 'coins';
  particles_count: number;             // 10-150 — toplam partikül
  particles_lifetime_ms: number;        // 500-5000 — her partiküler yaşam süresi
  particles_speed: number;              // 0.5-3 — hız çarpanı
  particles_spread_deg: number;          // 10-360 — yayılma açısı
  particles_gravity: number;            // -1..1 (negatif=yukarı, pozitif=aşağı)
  particles_size_min: number;           // 4-20
  particles_size_max: number;           // 8-40
  particles_color_palette: string[];    // renk array
  particles_emit_x: number;             // 0-1 (canvas'a göre)
  particles_emit_y: number;             // 0-1
  particles_burst: boolean;              // true=ilk başta hepsi, false=sürekli emit
  particles_emit_rate: number;          // 1-20/saniye (burst yoksa)
  particles_fade_out: boolean;          // lifetime sonunda fade
  particles_rotation_speed: number;     // -360..360 deg/sn

  // ─── Sahne Efekti ───
  scene_flash_enabled: boolean;
  scene_flash_color: string;
  scene_flash_intensity: number;        // 0-1
  scene_flash_duration_ms: number;      // 100-2000
  scene_shake_enabled: boolean;
  scene_shake_intensity: number;        // 1-20 px amplitude
  scene_shake_duration_ms: number;
  scene_vignette_enabled: boolean;
  scene_vignette_color: string;
  scene_vignette_pulse: boolean;
  scene_vignette_size: number;          // 0.3-1 (radius)
  scene_bg_blur_enabled: boolean;
  scene_bg_blur_max: number;            // 0-20 px
  scene_bg_blur_duration_ms: number;
  scene_color_tint_enabled: boolean;
  scene_color_tint_color: string;
  scene_color_tint_intensity: number;   // 0-1
  scene_zoom_in_enabled: boolean;       // kamera push-in
  scene_zoom_in_scale: number;          // 1-1.5
  scene_zoom_in_duration_ms: number;

  // ─── Avatar Aura / Trail / Halo ───
  aura_enabled: boolean;
  aura_color: string;
  aura_size: number;                    // 1.2-3.0 (avatar size çarpanı)
  aura_pulse: boolean;
  aura_pulse_speed: number;             // sn
  aura_intensity: number;               // 0.2-1.5
  aura_layers: number;                  // 1-4 (kaç katman halo)
  trail_enabled: boolean;
  trail_color: string;
  trail_length: number;                 // 3-15
  trail_decay_ms: number;               // 200-2000
  trail_thickness: number;              // 1-8 px
  halo_ring_enabled: boolean;
  halo_ring_color: string;
  halo_ring_thickness: number;          // 1-6
  halo_ring_spin_speed: number;         // sn (full cycle)
  halo_ring_dashed: boolean;

  // ─── Ses Efekti ───
  sound_enabled: boolean;
  sound_id: string;                     // 'whoosh' | 'magic' | 'sparkle' | 'horn' | 'chime' | ... veya custom URL
  sound_volume: number;                 // 0-1
  sound_delay_ms: number;               // 0-3000 (intro'dan sonra)

  // ─── Trigger Koşulları ───
  trigger_first_join_only: boolean;
  trigger_min_tier: 'free' | 'plus' | 'pro' | 'gm';
  trigger_owner_only: boolean;
  trigger_cooldown_minutes: number;     // 0-60 (0=yok)
  trigger_birthday_only: boolean;       // doğum gününde ekstra efekt
  trigger_milestone: 'none' | 'first_join' | 'tier_upgrade' | 'streak_7' | 'streak_30';
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

  // ★ v117 defaults
  particles_enabled: false,
  particles_type: 'confetti',
  particles_count: 40,
  particles_lifetime_ms: 2500,
  particles_speed: 1.0,
  particles_spread_deg: 180,
  particles_gravity: 0.3,
  particles_size_min: 6,
  particles_size_max: 14,
  particles_color_palette: ['#FBBF24', '#F472B6', '#22D3EE', '#A78BFA', '#10B981'],
  particles_emit_x: 0.5,
  particles_emit_y: 0.5,
  particles_burst: true,
  particles_emit_rate: 8,
  particles_fade_out: true,
  particles_rotation_speed: 180,

  scene_flash_enabled: false,
  scene_flash_color: '#FFFFFF',
  scene_flash_intensity: 0.6,
  scene_flash_duration_ms: 300,
  scene_shake_enabled: false,
  scene_shake_intensity: 6,
  scene_shake_duration_ms: 500,
  scene_vignette_enabled: false,
  scene_vignette_color: '#000000',
  scene_vignette_pulse: false,
  scene_vignette_size: 0.7,
  scene_bg_blur_enabled: false,
  scene_bg_blur_max: 8,
  scene_bg_blur_duration_ms: 800,
  scene_color_tint_enabled: false,
  scene_color_tint_color: '#FBBF24',
  scene_color_tint_intensity: 0.25,
  scene_zoom_in_enabled: false,
  scene_zoom_in_scale: 1.08,
  scene_zoom_in_duration_ms: 600,

  aura_enabled: false,
  aura_color: '#FBBF24',
  aura_size: 1.6,
  aura_pulse: true,
  aura_pulse_speed: 1.8,
  aura_intensity: 0.7,
  aura_layers: 2,
  trail_enabled: false,
  trail_color: '#22D3EE',
  trail_length: 8,
  trail_decay_ms: 800,
  trail_thickness: 3,
  halo_ring_enabled: false,
  halo_ring_color: '#FBBF24',
  halo_ring_thickness: 2,
  halo_ring_spin_speed: 4,
  halo_ring_dashed: false,

  sound_enabled: false,
  sound_id: 'sparkle',
  sound_volume: 0.6,
  sound_delay_ms: 200,

  trigger_first_join_only: false,
  trigger_min_tier: 'free',
  trigger_owner_only: false,
  trigger_cooldown_minutes: 0,
  trigger_birthday_only: false,
  trigger_milestone: 'none',
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
  // ★ v117: Tab state — config panelini 12 sekmeye böl
  const [tab, setTab] = useState<Tab>('konum');
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
          style={{
            width: STAGE_W,
            height: STAGE_H,
            background: 'linear-gradient(180deg, #0f172a 0%, #0a0f1a 100%)',
            // ★ v117 sahne efektleri — yalnızca preview oynarken
            ...(previewPhase === 'playing' ? {
              animation: [
                cfg.scene_shake_enabled && `scene-shake ${Math.max(200, cfg.scene_shake_duration_ms / 6)}ms steps(4) ${Math.floor(cfg.scene_shake_duration_ms / Math.max(200, cfg.scene_shake_duration_ms / 6))} both`,
                cfg.scene_zoom_in_enabled && `scene-zoom-in ${cfg.scene_zoom_in_duration_ms}ms ease-out forwards`,
              ].filter(Boolean).join(', '),
              ['--shake-x' as any]: `${cfg.scene_shake_intensity}px`,
              ['--zoom-scale' as any]: cfg.scene_zoom_in_scale,
            } : {}),
            // BG blur (children'a uygular)
            filter: previewPhase === 'playing' && cfg.scene_bg_blur_enabled ? `blur(${cfg.scene_bg_blur_max}px)` : undefined,
            transition: cfg.scene_bg_blur_enabled ? `filter ${cfg.scene_bg_blur_duration_ms}ms ease-out` : undefined,
          } as React.CSSProperties}
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

          {/* ★ v117 — Partikül canvas (preview oynuyor + aktif) */}
          {cfg.particles_enabled && previewPhase === 'playing' && (
            <ParticleCanvas key={`particles-${previewKey}`} cfg={cfg} width={STAGE_W} height={STAGE_H} />
          )}

          {/* ★ v117 — Sahne efekti overlay'leri */}
          {previewPhase === 'playing' && (
            <>
              {/* Color tint (z-22) */}
              {cfg.scene_color_tint_enabled && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: cfg.scene_color_tint_color,
                    opacity: cfg.scene_color_tint_intensity,
                    mixBlendMode: 'overlay',
                    zIndex: 22,
                  }}
                />
              )}
              {/* Vignette (z-24) */}
              {cfg.scene_vignette_enabled && (
                <div
                  className={`absolute inset-0 pointer-events-none ${cfg.scene_vignette_pulse ? 'animate-pulse' : ''}`}
                  style={{
                    background: `radial-gradient(circle at center, transparent ${cfg.scene_vignette_size * 50}%, ${cfg.scene_vignette_color} 100%)`,
                    zIndex: 24,
                  }}
                />
              )}
              {/* Flash (z-30, full coverage) */}
              {cfg.scene_flash_enabled && (
                <div
                  key={`flash-${previewKey}`}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: cfg.scene_flash_color,
                    zIndex: 30,
                    animation: `scene-flash ${cfg.scene_flash_duration_ms}ms ease-out forwards`,
                    ['--flash-intensity' as any]: cfg.scene_flash_intensity,
                  } as React.CSSProperties}
                />
              )}
            </>
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

        {/* ★ v117: Tab bar — 12 sekme, sticky top */}
        <div className="sticky top-12 z-10 -mx-2 px-2 pb-2 pt-1 bg-[#0a0f1a]/95 backdrop-blur-md flex gap-1 overflow-x-auto">
          {([
            { k: 'konum',    l: 'Konum',     i: <Move className="w-3 h-3" /> },
            { k: 'giris',    l: 'Giriş',     i: <Play className="w-3 h-3" /> },
            { k: 'loop',     l: 'Loop',      i: <Repeat className="w-3 h-3" /> },
            { k: 'cikis',    l: 'Çıkış',     i: <LogOut className="w-3 h-3" /> },
            { k: 'banner',   l: 'Banner',    i: <MessageSquare className="w-3 h-3" /> },
            { k: 'lottie',   l: 'Lottie',    i: <Film className="w-3 h-3" /> },
            { k: 'partikul', l: 'Partikül',  i: <Stars className="w-3 h-3" /> },
            { k: 'sahne',    l: 'Sahne',     i: <Filter className="w-3 h-3" /> },
            { k: 'aura',     l: 'Aura',      i: <Sparkles className="w-3 h-3" /> },
            { k: 'ses',      l: 'Ses',       i: <Volume2 className="w-3 h-3" /> },
            { k: 'trigger',  l: 'Tetik',     i: <Wind className="w-3 h-3" /> },
            { k: 'genel',    l: 'Genel',     i: <SettingsIcon className="w-3 h-3" /> },
          ] as { k: Tab; l: string; i: React.ReactNode }[]).map(t => (
            <button key={t.k} type="button" onClick={() => setTab(t.k)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                tab === t.k
                  ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}>
              {t.i}{t.l}
            </button>
          ))}
        </div>

        {tab === 'konum' && (
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
        )}

        {tab === 'konum' && cfg.has_avatar && (
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

        {tab === 'giris' && cfg.has_avatar && (
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

        {tab === 'loop' && cfg.has_avatar && (
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

        {tab === 'cikis' && cfg.has_avatar && (
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

        {tab === 'banner' && (
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
        )}

        {tab === 'lottie' && (
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
        )}

        {/* ═══════════════════════ YENİ ÖZELLİK PAKETLERİ (v117) ═══════════════════════ */}

        {tab === 'partikul' && (
        <Section title="Partikül Sistemi" icon={<Stars className="w-4 h-4 text-pink-400" />}>
          <Toggle label="Partikülleri Aktif Et" checked={cfg.particles_enabled} onChange={v => update('particles_enabled', v)} />
          {cfg.particles_enabled && (<>
            <Select label="Partikül Tipi" value={cfg.particles_type} onChange={v => update('particles_type', v as any)} options={[
              { v: 'confetti',   l: 'Konfeti 🎉' },
              { v: 'glitter',    l: 'Pırıltı ✨' },
              { v: 'stars',      l: 'Yıldız ⭐' },
              { v: 'hearts',     l: 'Kalp ❤️' },
              { v: 'fireworks',  l: 'Havai Fişek 🎆' },
              { v: 'snowflakes', l: 'Kar Tanesi ❄️' },
              { v: 'smoke',      l: 'Duman 💨' },
              { v: 'sparkles',   l: 'Parlatma ⚡' },
              { v: 'coins',      l: 'Para 🪙' },
            ]} />
            <SubBlock title="Sayı & Yaşam">
              <Slider label="Toplam Sayı" min={10} max={150} step={5} value={cfg.particles_count} onChange={v => update('particles_count', v)} display={`${cfg.particles_count}`} />
              <Slider label="Yaşam Süresi" min={500} max={5000} step={100} value={cfg.particles_lifetime_ms} onChange={v => update('particles_lifetime_ms', v)} display={`${cfg.particles_lifetime_ms}ms`} />
              <Toggle label="Burst Mod (Hepsi Aynı Anda)" checked={cfg.particles_burst} onChange={v => update('particles_burst', v)} />
              {!cfg.particles_burst && (
                <Slider label="Emit Hızı (saniyede)" min={1} max={20} step={1} value={cfg.particles_emit_rate} onChange={v => update('particles_emit_rate', v)} display={`${cfg.particles_emit_rate}/sn`} />
              )}
              <Toggle label="Sonunda Solsun (Fade)" checked={cfg.particles_fade_out} onChange={v => update('particles_fade_out', v)} />
            </SubBlock>
            <SubBlock title="Hareket">
              <Slider label="Hız Çarpanı" min={0.3} max={3} step={0.1} value={cfg.particles_speed} onChange={v => update('particles_speed', v)} display={`${cfg.particles_speed.toFixed(1)}x`} />
              <Slider label="Yayılma Açısı" min={10} max={360} step={10} value={cfg.particles_spread_deg} onChange={v => update('particles_spread_deg', v)} display={`${cfg.particles_spread_deg}°`} />
              <Slider label="Yer Çekimi" min={-1} max={1} step={0.05} value={cfg.particles_gravity} onChange={v => update('particles_gravity', v)} display={`${cfg.particles_gravity.toFixed(2)}`} />
              <Slider label="Dönüş Hızı" min={-360} max={360} step={10} value={cfg.particles_rotation_speed} onChange={v => update('particles_rotation_speed', v)} display={`${cfg.particles_rotation_speed}°/sn`} />
            </SubBlock>
            <SubBlock title="Boyut & Çıkış Noktası">
              <Slider label="Min Boyut" min={2} max={20} step={1} value={cfg.particles_size_min} onChange={v => update('particles_size_min', v)} display={`${cfg.particles_size_min}px`} />
              <Slider label="Max Boyut" min={4} max={40} step={1} value={cfg.particles_size_max} onChange={v => update('particles_size_max', v)} display={`${cfg.particles_size_max}px`} />
              <Slider label="Çıkış X" min={0} max={1} step={0.02} value={cfg.particles_emit_x} onChange={v => update('particles_emit_x', v)} display={`${Math.round(cfg.particles_emit_x * 100)}%`} />
              <Slider label="Çıkış Y" min={0} max={1} step={0.02} value={cfg.particles_emit_y} onChange={v => update('particles_emit_y', v)} display={`${Math.round(cfg.particles_emit_y * 100)}%`} />
            </SubBlock>
            <SubBlock title="Renk Paleti">
              <p className="text-[10px] text-slate-500 mb-1">Virgülle ayrılmış HEX renkler. Her partikül rastgele birini seçer.</p>
              <input type="text" value={cfg.particles_color_palette.join(',')}
                onChange={e => update('particles_color_palette', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                aria-label="Partikül renk paleti (virgülle ayrılmış HEX)"
                placeholder="#FBBF24, #F472B6, #22D3EE"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200" />
              <div className="flex flex-wrap gap-1 mt-2">
                {cfg.particles_color_palette.map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded border border-slate-600" style={{ background: c }} title={c} />
                ))}
              </div>
            </SubBlock>
          </>)}
        </Section>
        )}

        {tab === 'sahne' && (
        <Section title="Sahne Efektleri" icon={<Filter className="w-4 h-4 text-orange-400" />}>
          <SubBlock title="Ekran Flash (Aniden Beyaz)">
            <Toggle label="Flash Aktif" checked={cfg.scene_flash_enabled} onChange={v => update('scene_flash_enabled', v)} />
            {cfg.scene_flash_enabled && (<>
              <ColorInput label="Flash Rengi" value={cfg.scene_flash_color} onChange={v => update('scene_flash_color', v)} />
              <Slider label="Şiddet" min={0.1} max={1} step={0.05} value={cfg.scene_flash_intensity} onChange={v => update('scene_flash_intensity', v)} display={`${Math.round(cfg.scene_flash_intensity * 100)}%`} />
              <Slider label="Süre (ms)" min={50} max={2000} step={50} value={cfg.scene_flash_duration_ms} onChange={v => update('scene_flash_duration_ms', v)} display={`${cfg.scene_flash_duration_ms}ms`} />
            </>)}
          </SubBlock>

          <SubBlock title="Kamera Shake (Sallama)">
            <Toggle label="Shake Aktif" checked={cfg.scene_shake_enabled} onChange={v => update('scene_shake_enabled', v)} />
            {cfg.scene_shake_enabled && (<>
              <Slider label="Şiddet (px)" min={1} max={20} step={1} value={cfg.scene_shake_intensity} onChange={v => update('scene_shake_intensity', v)} display={`±${cfg.scene_shake_intensity}px`} />
              <Slider label="Süre (ms)" min={100} max={3000} step={100} value={cfg.scene_shake_duration_ms} onChange={v => update('scene_shake_duration_ms', v)} display={`${cfg.scene_shake_duration_ms}ms`} />
            </>)}
          </SubBlock>

          <SubBlock title="Vignette (Köşe Karartma)">
            <Toggle label="Vignette Aktif" checked={cfg.scene_vignette_enabled} onChange={v => update('scene_vignette_enabled', v)} />
            {cfg.scene_vignette_enabled && (<>
              <ColorInput label="Vignette Rengi" value={cfg.scene_vignette_color} onChange={v => update('scene_vignette_color', v)} />
              <Slider label="Boyut (radius)" min={0.3} max={1} step={0.05} value={cfg.scene_vignette_size} onChange={v => update('scene_vignette_size', v)} display={`${Math.round(cfg.scene_vignette_size * 100)}%`} />
              <Toggle label="Pulse (Nefes Alsın)" checked={cfg.scene_vignette_pulse} onChange={v => update('scene_vignette_pulse', v)} />
            </>)}
          </SubBlock>

          <SubBlock title="Arkaplan Blur (Sahne Bulanıklığı)">
            <Toggle label="BG Blur Aktif" checked={cfg.scene_bg_blur_enabled} onChange={v => update('scene_bg_blur_enabled', v)} />
            {cfg.scene_bg_blur_enabled && (<>
              <Slider label="Max Blur" min={1} max={20} step={1} value={cfg.scene_bg_blur_max} onChange={v => update('scene_bg_blur_max', v)} display={`${cfg.scene_bg_blur_max}px`} />
              <Slider label="Süre" min={200} max={3000} step={100} value={cfg.scene_bg_blur_duration_ms} onChange={v => update('scene_bg_blur_duration_ms', v)} display={`${cfg.scene_bg_blur_duration_ms}ms`} />
            </>)}
          </SubBlock>

          <SubBlock title="Renk Tint (Sahne Üzerine Renkli Kaplama)">
            <Toggle label="Tint Aktif" checked={cfg.scene_color_tint_enabled} onChange={v => update('scene_color_tint_enabled', v)} />
            {cfg.scene_color_tint_enabled && (<>
              <ColorInput label="Tint Rengi" value={cfg.scene_color_tint_color} onChange={v => update('scene_color_tint_color', v)} />
              <Slider label="Şiddet" min={0.05} max={1} step={0.05} value={cfg.scene_color_tint_intensity} onChange={v => update('scene_color_tint_intensity', v)} display={`${Math.round(cfg.scene_color_tint_intensity * 100)}%`} />
            </>)}
          </SubBlock>

          <SubBlock title="Kamera Push-In (Yakınlaşma)">
            <Toggle label="Zoom-In Aktif" checked={cfg.scene_zoom_in_enabled} onChange={v => update('scene_zoom_in_enabled', v)} />
            {cfg.scene_zoom_in_enabled && (<>
              <Slider label="Zoom Oranı" min={1.02} max={1.5} step={0.02} value={cfg.scene_zoom_in_scale} onChange={v => update('scene_zoom_in_scale', v)} display={`${cfg.scene_zoom_in_scale.toFixed(2)}x`} />
              <Slider label="Süre" min={200} max={2000} step={100} value={cfg.scene_zoom_in_duration_ms} onChange={v => update('scene_zoom_in_duration_ms', v)} display={`${cfg.scene_zoom_in_duration_ms}ms`} />
            </>)}
          </SubBlock>
        </Section>
        )}

        {tab === 'aura' && (
        <Section title="Aura / Trail / Halo (Avatar Çevresi)" icon={<Sparkles className="w-4 h-4 text-teal-400" />}>
          <SubBlock title="Aura (Yumuşak Glow)">
            <Toggle label="Aura Aktif" checked={cfg.aura_enabled} onChange={v => update('aura_enabled', v)} />
            {cfg.aura_enabled && (<>
              <ColorInput label="Aura Rengi" value={cfg.aura_color} onChange={v => update('aura_color', v)} />
              <Slider label="Boyut Çarpanı" min={1.1} max={3} step={0.1} value={cfg.aura_size} onChange={v => update('aura_size', v)} display={`${cfg.aura_size.toFixed(1)}x`} />
              <Slider label="Yoğunluk" min={0.1} max={1.5} step={0.05} value={cfg.aura_intensity} onChange={v => update('aura_intensity', v)} display={`${cfg.aura_intensity.toFixed(2)}`} />
              <Slider label="Katman Sayısı" min={1} max={4} step={1} value={cfg.aura_layers} onChange={v => update('aura_layers', v)} display={`${cfg.aura_layers}`} />
              <Toggle label="Pulse (Nefes)" checked={cfg.aura_pulse} onChange={v => update('aura_pulse', v)} />
              {cfg.aura_pulse && (
                <Slider label="Pulse Hızı" min={0.5} max={5} step={0.1} value={cfg.aura_pulse_speed} onChange={v => update('aura_pulse_speed', v)} display={`${cfg.aura_pulse_speed.toFixed(1)}sn`} />
              )}
            </>)}
          </SubBlock>

          <SubBlock title="Trail (Hareket Kuyruğu)">
            <Toggle label="Trail Aktif" checked={cfg.trail_enabled} onChange={v => update('trail_enabled', v)} />
            {cfg.trail_enabled && (<>
              <ColorInput label="Trail Rengi" value={cfg.trail_color} onChange={v => update('trail_color', v)} />
              <Slider label="Uzunluk" min={3} max={15} step={1} value={cfg.trail_length} onChange={v => update('trail_length', v)} display={`${cfg.trail_length}`} />
              <Slider label="Kalınlık" min={1} max={8} step={0.5} value={cfg.trail_thickness} onChange={v => update('trail_thickness', v)} display={`${cfg.trail_thickness}px`} />
              <Slider label="Sönüş Süresi" min={200} max={2000} step={100} value={cfg.trail_decay_ms} onChange={v => update('trail_decay_ms', v)} display={`${cfg.trail_decay_ms}ms`} />
            </>)}
          </SubBlock>

          <SubBlock title="Halo Ring (Dönen Halka)">
            <Toggle label="Halo Ring Aktif" checked={cfg.halo_ring_enabled} onChange={v => update('halo_ring_enabled', v)} />
            {cfg.halo_ring_enabled && (<>
              <ColorInput label="Ring Rengi" value={cfg.halo_ring_color} onChange={v => update('halo_ring_color', v)} />
              <Slider label="Kalınlık" min={1} max={6} step={0.5} value={cfg.halo_ring_thickness} onChange={v => update('halo_ring_thickness', v)} display={`${cfg.halo_ring_thickness}px`} />
              <Slider label="Dönüş Hızı (sn)" min={1} max={15} step={0.5} value={cfg.halo_ring_spin_speed} onChange={v => update('halo_ring_spin_speed', v)} display={`${cfg.halo_ring_spin_speed}sn`} />
              <Toggle label="Kesik (Dashed)" checked={cfg.halo_ring_dashed} onChange={v => update('halo_ring_dashed', v)} />
            </>)}
          </SubBlock>
        </Section>
        )}

        {tab === 'ses' && (
        <Section title="Ses Efekti" icon={<Volume2 className="w-4 h-4 text-indigo-400" />}>
          <Toggle label="Ses Aktif" checked={cfg.sound_enabled} onChange={v => update('sound_enabled', v)} />
          {cfg.sound_enabled && (<>
            <Select label="Ses Şablonu" value={cfg.sound_id} onChange={v => update('sound_id', v)} options={[
              { v: 'sparkle',  l: 'Pırıltı (Sparkle)' },
              { v: 'whoosh',   l: 'Whoosh (Rüzgar)' },
              { v: 'magic',    l: 'Sihirli Çan' },
              { v: 'horn',     l: 'Boru Sesi (Horn)' },
              { v: 'chime',    l: 'Çan (Chime)' },
              { v: 'pop',      l: 'Pop (Patlama)' },
              { v: 'glitter',  l: 'Glitter' },
              { v: 'rise',     l: 'Yükselen Ton' },
              { v: 'fanfare',  l: 'Fanfar' },
              { v: 'custom',   l: 'Özel URL' },
            ]} />
            {cfg.sound_id === 'custom' && (
              <label className="block">
                <div className="text-xs text-slate-400 mb-1">Özel ses URL'i</div>
                <input type="text" value={cfg.sound_id} onChange={e => update('sound_id', e.target.value)} placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono" />
              </label>
            )}
            <Slider label="Ses Seviyesi" min={0} max={1} step={0.05} value={cfg.sound_volume} onChange={v => update('sound_volume', v)} display={`${Math.round(cfg.sound_volume * 100)}%`} />
            <Slider label="Gecikme (intro'dan sonra)" min={0} max={3000} step={50} value={cfg.sound_delay_ms} onChange={v => update('sound_delay_ms', v)} display={`${cfg.sound_delay_ms}ms`} />
            <p className="text-[10px] text-amber-400/70">⚠ Ses sadece kullanıcı uygulama ses ayarlarına bağlı olarak çalar. Sessize alınmışsa atlanır.</p>
          </>)}
        </Section>
        )}

        {tab === 'trigger' && (
        <Section title="Tetik (Trigger) Koşulları" icon={<Wind className="w-4 h-4 text-violet-400" />}>
          <p className="text-[11px] text-slate-500">Bu efektin oynayacağı koşulları belirle. Boş bırakırsan her girişte oynar.</p>
          <Toggle label="Sadece İlk Girişte" checked={cfg.trigger_first_join_only} onChange={v => update('trigger_first_join_only', v)} />
          <Toggle label="Sadece Oda Sahibi İçin" checked={cfg.trigger_owner_only} onChange={v => update('trigger_owner_only', v)} />
          <Toggle label="Sadece Doğum Gününde" checked={cfg.trigger_birthday_only} onChange={v => update('trigger_birthday_only', v)} />
          <Select label="Minimum Tier" value={cfg.trigger_min_tier} onChange={v => update('trigger_min_tier', v as any)} options={[
            { v: 'free', l: 'Free (Herkes)' },
            { v: 'plus', l: 'Plus+' },
            { v: 'pro',  l: 'Pro+' },
            { v: 'gm',   l: 'GM (Yönetici)' },
          ]} />
          <Select label="Milestone (Özel Olay)" value={cfg.trigger_milestone} onChange={v => update('trigger_milestone', v as any)} options={[
            { v: 'none',           l: 'Yok' },
            { v: 'first_join',     l: 'İlk Giriş (Hayat Boyu)' },
            { v: 'tier_upgrade',   l: 'Tier Yükselmesi' },
            { v: 'streak_7',       l: '7 Gün Streak' },
            { v: 'streak_30',      l: '30 Gün Streak' },
          ]} />
          <Slider label="Cooldown (peş peşe spam engelle)" min={0} max={60} step={1} value={cfg.trigger_cooldown_minutes} onChange={v => update('trigger_cooldown_minutes', v)} display={cfg.trigger_cooldown_minutes === 0 ? 'Yok' : `${cfg.trigger_cooldown_minutes}dk`} />
        </Section>
        )}

        {tab === 'genel' && (
        <Section title="Genel" icon={<SettingsIcon className="w-4 h-4 text-slate-400" />}>
          <Slider label="Toplam Görünür Süre (ms)" min={2000} max={12000} step={500} value={cfg.duration_ms} onChange={v => update('duration_ms', v)} display={`${cfg.duration_ms}`} />
          <label className="block">
            <div className="text-xs text-slate-400 mb-1">Önizleme metni</div>
            <input type="text" value={sampleName} onChange={e => setSampleName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" />
          </label>
        </Section>
        )}

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

        /* ★ v117 — Sahne efekti keyframes */
        @keyframes scene-flash {
          0% { opacity: var(--flash-intensity, 0.6) }
          100% { opacity: 0 }
        }
        @keyframes scene-shake {
          0%, 100% { transform: translate(0, 0) }
          25%      { transform: translate(calc(var(--shake-x) * -1), calc(var(--shake-x) * 0.5)) }
          50%      { transform: translate(var(--shake-x), calc(var(--shake-x) * -0.4)) }
          75%      { transform: translate(calc(var(--shake-x) * -0.5), var(--shake-x)) }
        }
        @keyframes scene-zoom-in {
          from { transform: scale(1) }
          to   { transform: scale(var(--zoom-scale, 1.08)) }
        }
        /* Halo ring rotation */
        @keyframes halo-spin {
          from { transform: rotate(0deg) }
          to   { transform: rotate(360deg) }
        }
        /* Aura pulse */
        @keyframes aura-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1) }
          50%      { opacity: 1;   transform: scale(1.08) }
        }
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

  // ★ v117 — Aura/Halo katmanları (avatar etrafında, transform'a tabi değil)
  const auraLayers = cfg.aura_enabled ? Array.from({ length: cfg.aura_layers }, (_, i) => {
    const layerScale = 1 + (i + 1) * 0.18 * (cfg.aura_size - 1);
    const layerOpacity = cfg.aura_intensity * (1 - i * 0.25);
    return { scale: layerScale, opacity: layerOpacity, key: i };
  }) : [];

  return (
    <div
      className="absolute"
      style={{ left, top, width: size, height: size }}
    >
      {/* ★ Aura katmanları — avatar altında, ana ref'in dışında, transform'a tabi DEĞİL */}
      {auraLayers.map(L => (
        <div
          key={`aura-${L.key}`}
          className="absolute pointer-events-none"
          style={{
            left: '50%', top: '50%',
            width: size * L.scale, height: size * L.scale,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${cfg.aura_color}${Math.round(L.opacity * 100).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
            animation: cfg.aura_pulse ? `aura-pulse ${cfg.aura_pulse_speed}s ease-in-out infinite` : undefined,
            zIndex: 1,
          }}
        />
      ))}

      {/* ★ Halo ring — dönen çember */}
      {cfg.halo_ring_enabled && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%', top: '50%',
            width: size * 1.25, height: size * 1.25,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: `${cfg.halo_ring_thickness}px ${cfg.halo_ring_dashed ? 'dashed' : 'solid'} ${cfg.halo_ring_color}`,
            animation: `halo-spin ${cfg.halo_ring_spin_speed}s linear infinite`,
            zIndex: 2,
          }}
        />
      )}

      {/* Asıl avatar (transform'lu) */}
      <div
        ref={ref}
        className="absolute cursor-move border-2 border-fuchsia-400/70"
        style={{
          left: 0, top: 0, width: size, height: size,
          borderRadius: circular ? '50%' : 8,
          overflow: 'hidden',
          transformOrigin: 'center center',
          zIndex: 3,
          ...glowStyle,
        }}
      >
        <img src={SAMPLE_AVATAR} alt="" className="w-full h-full object-cover pointer-events-none" />
      </div>
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

// ═══════════════════════════════════════════════════════════════════════
// ★ v117 — ParticleCanvas: Canvas2D + RAF ile parçacık simülasyonu
// Tüm partikül tiplerini (konfeti, yıldız, kalp, havai fişek, kar, duman, coin, glitter, sparkles)
// gerçek zamanlı render eder. Mobile tarafta Skia ile aynı parametrelerle çalışacak.
// ═══════════════════════════════════════════════════════════════════════
function ParticleCanvas({ cfg, width, height }: { cfg: EntryConfig; width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    type P = {
      x: number; y: number;
      vx: number; vy: number;
      size: number; color: string;
      rot: number; vrot: number;
      born: number; life: number;
    };
    const particles: P[] = [];
    const startTime = performance.now();
    const emitX = width * cfg.particles_emit_x;
    const emitY = height * cfg.particles_emit_y;

    function spawn(now: number) {
      const angleRange = (cfg.particles_spread_deg * Math.PI) / 180;
      const baseAngle = -Math.PI / 2; // yukarı
      const angle = baseAngle + (Math.random() - 0.5) * angleRange;
      const speed = (80 + Math.random() * 140) * cfg.particles_speed;
      const size = cfg.particles_size_min + Math.random() * Math.max(0, cfg.particles_size_max - cfg.particles_size_min);
      const palette = cfg.particles_color_palette.length > 0 ? cfg.particles_color_palette : ['#FBBF24'];
      const color = palette[Math.floor(Math.random() * palette.length)] || '#FBBF24';
      particles.push({
        x: emitX, y: emitY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size, color,
        rot: Math.random() * Math.PI * 2,
        vrot: ((cfg.particles_rotation_speed * Math.PI) / 180) * (0.4 + Math.random() * 0.8),
        born: now,
        life: cfg.particles_lifetime_ms,
      });
    }

    if (cfg.particles_burst) {
      for (let i = 0; i < cfg.particles_count; i++) spawn(startTime);
    }

    let lastEmit = startTime;
    let lastFrame = startTime;
    let raf = 0;

    function frame(now: number) {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      if (!cfg.particles_burst) {
        const interval = 1000 / Math.max(1, cfg.particles_emit_rate);
        while (now - lastEmit > interval && particles.length < cfg.particles_count) {
          spawn(now);
          lastEmit += interval;
        }
      }

      ctx!.clearRect(0, 0, width, height);
      const gravity = cfg.particles_gravity * 250; // px/s²

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = now - p.born;
        if (age > p.life) { particles.splice(i, 1); continue; }
        p.vy += gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
        const ageNorm = age / p.life;
        const alpha = cfg.particles_fade_out ? Math.max(0, 1 - ageNorm) : 1;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.globalAlpha = alpha;
        drawParticle(ctx!, cfg.particles_type, p.size, p.color);
        ctx!.restore();
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); };
  }, [cfg, width, height]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 20 }}
    />
  );
}

function drawParticle(ctx: CanvasRenderingContext2D, type: EntryConfig['particles_type'], size: number, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  switch (type) {
    case 'confetti': {
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
      return;
    }
    case 'glitter':
    case 'sparkles': {
      // 4 köşeli ışık yıldızı
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? size / 2 : size / 6;
        const a = (i * Math.PI) / 4;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'stars': {
      // 5 köşe yıldız
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? size / 2 : size / 5;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'hearts': {
      ctx.beginPath();
      ctx.moveTo(0, size * 0.35);
      ctx.bezierCurveTo(-size * 0.6, -size * 0.1, -size * 0.6, -size * 0.5, 0, -size * 0.15);
      ctx.bezierCurveTo(size * 0.6, -size * 0.5, size * 0.6, -size * 0.1, 0, size * 0.35);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'fireworks': {
      ctx.beginPath();
      ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * size / 3, Math.sin(a) * size / 3);
        ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
        ctx.stroke();
      }
      return;
    }
    case 'snowflakes': {
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
    case 'smoke': {
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    case 'coins': {
      ctx.beginPath();
      ctx.ellipse(0, 0, size / 2, size / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      return;
    }
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
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
