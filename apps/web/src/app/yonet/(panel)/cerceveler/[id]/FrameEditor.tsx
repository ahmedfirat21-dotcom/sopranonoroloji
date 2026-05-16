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

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { Save, RotateCcw, Award, Move, Sparkles, Settings as SettingsIcon, Wind, Heart } from 'lucide-react';

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
  // ★ 2026-05-11: Hareket & efekt animasyonları (mobilde Animated.loop ile render)
  avatar_pulse: boolean;        // büyüyüp küçülme
  avatar_pulse_speed: number;   // saniye / 1 nabız (1-5)
  avatar_float: boolean;        // yavaş yukarı/aşağı süzülme
  avatar_float_speed: number;   // saniye / 1 tur (2-8)
  glow_pulse: boolean;          // glow'un yoğunluğu nefes alır
  frame_breathe: boolean;       // frame'in kendisi büyüyüp küçülür
  particle_type: 'none' | 'sparkle' | 'stars' | 'hearts' | 'bubbles';
  particle_count: number;       // 4-12 arası — kaç tane parçacık
  particle_color: string;       // parçacık rengi (auto = glow_color)
  // ★ Renk döngüsü — frame/glow/particle rengi sürekli HSL hue ile döner (rainbow)
  color_cycle: boolean;
  color_cycle_speed: number;    // saniye / 1 tam tur (5-30)
  // ★ 2026-05-11: Kullanıcı adı stilleme — avatar etrafında nereye, hangi şekilde
  name_enabled: boolean;
  name_position: 'top' | 'bottom' | 'left' | 'right'; // ana yön
  // ★ 2026-05-11: Yüzdelik bazlı — her avatar boyutunda (Mini→Profile) orantılı
  //   görünüm. Pixel bazlı eski sistemde mini'de yazı uçuyor profile'da yapışıyordu.
  name_offset: number;          // % avatar yarıçapına göre dış mesafe (-50→200)
  name_rotation: number;        // ±180° eğim
  name_curve_style: 'flat' | 'arc-top' | 'arc-bottom' | 'circle';
  name_color: string;
  name_size: number;            // % avatar boyutuna göre font (6-25)
  name_bold: boolean;
  // ★ v283 (16 May 2026): tier_badge_* KALDIRILDI — rozet ayarları artık
  //   Mağaza → Rozetler → [id] → Konum sekmesinde yönetiliyor.
  //   Çift kontrol kalktı, tek kaynak: cosmetic_items.editor_config.badge_config.
  // ★ 2026-05-11 — EK animasyon paleti
  // Avatar
  avatar_shake: boolean;        // hızlı titreşim (bildirim hissi)
  avatar_swing: boolean;        // sarkaç gibi sallanma (saat-yönü-saat-yönü-tersi)
  avatar_tilt: boolean;         // yumuşak yan yatma (sağ-sol)
  // Frame
  frame_shimmer: boolean;       // üzerinden ışık süpürmesi geçer
  frame_wobble: boolean;        // titreşim (rotate ±3°)
  frame_pulse_ring: boolean;    // dışa yayılan radar halkası
  // İsim
  name_glow: boolean;           // text-shadow pulse — yazı parlar
  name_wave: boolean;           // harf-harf yukarı-aşağı dalga (dairesel/yay'da kapalı)
  name_shimmer: boolean;        // metin üzerinden gradient ışık süpürmesi
  name_color_cycle: boolean;    // yazı rengi HSL döngüsü (color_cycle_speed paylaşır)
  // ★ 2026-05-11: İsim için tam hareket paketi (avatar/frame paritesi)
  // Hareket
  name_pulse: boolean;          // yazı büyür-küçülür
  name_pulse_speed: number;     // sn (1-5)
  name_float: boolean;          // yazı yukarı-aşağı süzülür
  name_float_speed: number;     // sn (2-8)
  name_shake: boolean;          // titreşim
  name_swing: boolean;          // sarkaç sallanma
  name_tilt: boolean;           // yan yatma
  name_breathe: boolean;        // yavaş nefes (subtle scale)
  name_wobble: boolean;         // titreşim (rotate ±2.5°)
  // Sürekli dönme
  name_rotation_continuous: boolean;
  name_rotation_speed: number;  // sn / 1 tam tur (4-30)
  // Görünürlük
  name_opacity: number;         // 0.3-1
  // Glow / parlama (avatar glow paritesi)
  name_glow_color: string;
  name_glow_intensity: number;  // 0.2-1.5
  name_glow_pulse: boolean;     // glow yoğunluğu dalgalanır
  // ★ 2026-05-11 — Sanatsal avatar paketi
  avatar_shape: 'circle' | 'rounded-square' | 'hexagon' | 'squircle' | 'star' | 'diamond';
  // Avatar border (premium ring)
  avatar_border_enabled: boolean;
  avatar_border_color: string;
  avatar_border_width: number;  // 1-12 px
  avatar_border_style: 'solid' | 'dashed' | 'dotted' | 'double';
  // Background halo (derinlik için arka plan glow)
  bg_halo_enabled: boolean;
  bg_halo_color: string;
  bg_halo_size: number;         // 1.0-3.0 (avatar boyutuna çarpan)
  bg_halo_intensity: number;    // 0.2-1
  // Avatar filtreleri (sanatsal işleme)
  avatar_hue_rotate: number;    // 0-360°
  avatar_brightness: number;    // 0.5-1.5x
  avatar_saturation: number;    // 0-2x
  avatar_blur: number;          // 0-5 px (subtle dreamy blur)
  avatar_grayscale: number;     // 0-100%
  avatar_sepia: number;         // 0-100%
  // ★ v1.3.54: Boyut bazlı override'lar — sadece farklı olanları içerir.
  //   Mobile pickSizeKey(size) ile avatarın px boyutuna göre key seçilir.
  size_overrides?: Partial<Record<'mini' | 'listener' | 'speaker' | 'stage_host' | 'profile', Partial<FrameConfig>>>;
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
  // Hareket & efekt — default kapalı (zorunlu özellik değil, opsiyonel zenginlik)
  avatar_pulse: false,
  avatar_pulse_speed: 2,
  avatar_float: false,
  avatar_float_speed: 4,
  glow_pulse: false,
  frame_breathe: false,
  particle_type: 'none',
  particle_count: 6,
  particle_color: '#fbbf24',
  color_cycle: false,
  color_cycle_speed: 12,
  // Kimlik & etiket — default kapalı (opsiyonel, frame'in ana işine müdahale etmez)
  name_enabled: false,
  name_position: 'bottom',
  name_offset: 25,    // % avatar yarıçapı (orantılı — her boyutta tutarlı)
  name_rotation: 0,
  name_curve_style: 'flat',
  name_color: '#f8fafc',
  name_size: 14,      // % avatar boyutu (60px avatar→8px, 200px avatar→28px)
  name_bold: true,
  // ★ v283: tier_badge_* default'ları kaldırıldı (artık rozet ürününde yönetilir)
  // Ek animasyon paleti — default kapalı (opsiyonel zenginlik)
  avatar_shake: false,
  avatar_swing: false,
  avatar_tilt: false,
  frame_shimmer: false,
  frame_wobble: false,
  frame_pulse_ring: false,
  name_glow: false,
  name_wave: false,
  name_shimmer: false,
  name_color_cycle: false,
  // İsim hareket paketi — default kapalı
  name_pulse: false,
  name_pulse_speed: 2,
  name_float: false,
  name_float_speed: 4,
  name_shake: false,
  name_swing: false,
  name_tilt: false,
  name_breathe: false,
  name_wobble: false,
  name_rotation_continuous: false,
  name_rotation_speed: 12,
  name_opacity: 1,
  name_glow_color: '#fbbf24',
  name_glow_intensity: 0.6,
  name_glow_pulse: false,
  // Sanatsal avatar paketi — default'lar müdahale etmez
  avatar_shape: 'circle',
  avatar_border_enabled: false,
  avatar_border_color: '#fbbf24',
  avatar_border_width: 3,
  avatar_border_style: 'solid',
  bg_halo_enabled: false,
  bg_halo_color: '#fbbf24',
  bg_halo_size: 1.6,
  bg_halo_intensity: 0.6,
  avatar_hue_rotate: 0,
  avatar_brightness: 1,
  avatar_saturation: 1,
  avatar_blur: 0,
  avatar_grayscale: 0,
  avatar_sepia: 0,
};

// Avatar şekli için CSS clip-path / borderRadius değerleri
const SHAPE_CLIP: Record<string, { borderRadius: string; clipPath?: string; label: string }> = {
  'circle':         { borderRadius: '50%', label: '⚪ Daire' },
  'rounded-square': { borderRadius: '22%', label: '⬛ Yuvarlak Kare' },
  'squircle':       { borderRadius: '36%', label: '◼ Squircle' },
  'hexagon':        { borderRadius: '0',   clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)', label: '⬢ Altıgen' },
  'star':           { borderRadius: '0',   clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', label: '⭐ Yıldız' },
  'diamond':        { borderRadius: '0',   clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', label: '◆ Elmas' },
};

// ★ v265 (13 May 2026): TierBadge önizleme size paleti — mobile/components/TierBadge.tsx
//   SIZE config ile birebir aynı. editingSize'a göre APK'da hangi tierBadgeSize çağırılır:
//     - mini, listener → 'xs' (sadece icon, label fontSize=0 ile gizli)
//     - speaker → 'sm' (kompakt label)
//     - stage_host, profile → 'md' (full label)
//     - default (Tümü) → 'md' (referans/temel boyut)
const TIER_BADGE_SIZE: Record<string, { height: number; paddingH: number; fontSize: number; iconSize: number; radius: number; letterSpacing: number; showLabel: boolean }> = {
  xs: { height: 14, paddingH: 4, fontSize: 0,   iconSize: 9, radius: 7,    letterSpacing: 0,   showLabel: false },
  sm: { height: 14, paddingH: 5, fontSize: 8.5, iconSize: 8, radius: 7,    letterSpacing: 0.6, showLabel: true  },
  md: { height: 17, paddingH: 6, fontSize: 9.5, iconSize: 9, radius: 8.5,  letterSpacing: 0.7, showLabel: true  },
  lg: { height: 22, paddingH: 8, fontSize: 11,  iconSize: 11,radius: 11,   letterSpacing: 0.8, showLabel: true  },
};
function badgeSizeForEditingSize(es: string): keyof typeof TIER_BADGE_SIZE {
  if (es === 'mini' || es === 'listener') return 'xs';
  if (es === 'speaker') return 'sm';
  if (es === 'stage_host' || es === 'profile') return 'md';
  return 'md'; // default/Tümü
}

const TIER_PREVIEW: Record<'Plus' | 'Pro' | 'GodMaster', {
  label: string;
  iconChar: string;       // ★ ✦ ✧ — Ionicons yerine unicode approximation
  gradient: string;       // CSS linear-gradient
  glow: string;           // shadow color
  textColor: string;
}> = {
  Plus: {
    label: 'PLUS',
    iconChar: '◆',
    gradient: 'linear-gradient(135deg, #5EEAD4 0%, #0E7490 100%)',
    glow: 'rgba(94,234,212,0.55)',
    textColor: '#F0FDFA',
  },
  Pro: {
    label: 'PRO',
    iconChar: '★',
    gradient: 'linear-gradient(135deg, #FCD34D 0%, #B45309 100%)',
    glow: 'rgba(251,191,36,0.65)',
    textColor: '#7C2D12',
  },
  GodMaster: {
    label: 'GM',
    iconChar: '✦',
    gradient: 'linear-gradient(135deg, #F472B6 0%, #FBBF24 100%)',
    glow: 'rgba(244,114,182,0.7)',
    textColor: '#ffffff',
  },
};

// Tier badge konum koordinatları — avatar merkezine göre yüzdelik (-1...1)
// ★ v265: Daire avatar için köşeler 0.354 (sin 45°). Mobile BADGE_POS ile parite.
const BADGE_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  tl: { x: -0.354, y: -0.354, label: '↖ Sol-Üst' },
  tc: { x: 0,      y: -0.5,   label: '↑ Üst' },
  tr: { x: 0.354,  y: -0.354, label: '↗ Sağ-Üst' },
  ml: { x: -0.5,   y: 0,      label: '← Sol' },
  mr: { x: 0.5,    y: 0,      label: '→ Sağ' },
  bl: { x: -0.354, y: 0.354,  label: '↙ Sol-Alt' },
  bc: { x: 0,      y: 0.5,    label: '↓ Alt' },
  br: { x: 0.354,  y: 0.354,  label: '↘ Sağ-Alt' },
};

// ★ v1.3.59: APK ile birebir karşılaştırma için default avatar (avatar_m_1.jpg)
//   kullanıcı şikayeti: "web admindeki avatarı APK ile aynı yap, hataları net göreyim".
const SAMPLE_AVATAR = '/avatar_m_1.jpg';
// ★ v1.3.60: Sahne boyutu APK ProfileHero kart genişliğine eşit (~360px).
//   Avatar/sahne oranı = APK avatar/kart oranı → ince ayar slider'larında
//   görünüm birebir parite. 480px (eski) APK'dan büyüktü, slider çekildiğinde
//   önizlemede APK'dakinden farklı boyut görünüyordu.
const STAGE_SIZE = 360;
// ★ v213e: Mobile size selector — gerçek emülatör pixel boyutlarına göre simulate
// ★ v1.3.58: APK'daki GERÇEK avatar render boyutları (px). Önizleme aynı boyutta
//   render eder — kullanıcı slider'ı sürüklediği boyut APK'da gözle gördüğü
//   sonuca eşit.
const MOBILE_SIZES = [
  { v: 40, l: 'Mini (40)' },          // home header, room kart, DM listesi
  { v: 80, l: 'Dinleyici (80)' },     // ListenerGrid
  { v: 120, l: 'Konuşmacı (120)' },   // SpeakerSection grid speakers
  { v: 140, l: 'Sahne Host (140)' },  // SpeakerSection host (cardWidth maxSize)
  { v: 160, l: 'Profil (160)' },      // ProfileHero (modern büyük avatar)
];

// ★ v1.3.61: Frame Lottie haritası — frameLottieRegistry.ts ile birebir senkron.
//   meta_scale: APK'daki meta.scale değeri. Bu değer Lottie/PNG'nin avatar boyutuna
//   göre ne kadar büyütüleceğini belirler. Web admin önizleme bu değeri hesaba
//   KATMALIDIR yoksa preview ile APK boyutları uyuşmaz.
//   avatar_ratio: APK'daki avatarRatio — avatarın frame iç dairesine oturması için.
interface FrameLottieEntry {
  url: string;
  /** APK'daki meta.scale — Lottie kompozisyonunu avatar boyutuna göre kaç kat genişlet */
  meta_scale: number;
  /** APK'daki avatarRatio — avatarın frame içine oturma oranı */
  avatar_ratio: number;
}
const FRAME_LOTTIE_MAP: Record<string, FrameLottieEntry> = {
  // VIP kanatlı frame'ler — meta.scale 1.8, avatarRatio 0.78
  'aurelius':        { url: '/lotties/Avatar frame.json',    meta_scale: 1.8,  avatar_ratio: 0.78 },
  'lunaris':         { url: '/lotties/Avatar-Frame1.json',   meta_scale: 1.8,  avatar_ratio: 0.78 },
  'rose-eternel':    { url: '/lotties/Avatar_Frame2.json',   meta_scale: 1.8,  avatar_ratio: 0.78 },
  'cadence-soprano': { url: '/lotties/Profile Frame.json',   meta_scale: 1.85, avatar_ratio: 0.78 },
  // SopranoAura — scale 1.14, avatar full
  'soprano-aura':    { url: '/lotties/SopranoAura.json',     meta_scale: 1.14, avatar_ratio: 1.0  },
  // Premium scale=1.0 frame'ler — avatarRatio 0.92
  'midnight-amethyst': { url: '/lotties/MidnightAmethyst.json', meta_scale: 1.0, avatar_ratio: 0.92 },
  'sunrise-gold':      { url: '/lotties/SunriseGold.json',     meta_scale: 1.0, avatar_ratio: 0.92 },
  'ocean-pearl':       { url: '/lotties/OceanPearl.json',      meta_scale: 1.0, avatar_ratio: 0.92 },
  'ruby-flame':        { url: '/lotties/RubyFlame.json',       meta_scale: 1.0, avatar_ratio: 0.92 },
  'neon-pulse':        { url: '/lotties/NeonPulse.json',       meta_scale: 1.0, avatar_ratio: 0.92 },
  // Egzantrik çerçeveler — scale 1.0, avatarRatio 0.92
  'celestial-orbit':   { url: '/lotties/CelestialOrbit.json',  meta_scale: 1.0, avatar_ratio: 0.92 },
  'hex-prism':         { url: '/lotties/HexPrism.json',        meta_scale: 1.0, avatar_ratio: 0.92 },
  'pulse-wave':        { url: '/lotties/PulseWave.json',       meta_scale: 1.0, avatar_ratio: 0.92 },
  'eclipse-corona':    { url: '/lotties/EclipseCorona.json',   meta_scale: 1.0, avatar_ratio: 0.92 },
  'glitch-matrix':     { url: '/lotties/GlitchMatrix.json',    meta_scale: 1.0, avatar_ratio: 0.92 },
  // TealRibbon — scale 1.15, avatarRatio 0.85
  'teal-ribbon':       { url: '/lotties/TealRibbon.json',      meta_scale: 1.15, avatar_ratio: 0.85 },
  // ★ v1.3.65: Premium PNG çerçeveler — APK frameLottieRegistry.ts ile birebir.
  //   scale 1.0, avatar_ratio 0.92 (premium grubu). public/avatar_frames/premium/
  //   bundle'dan kopyalanmış PNG'ler.
  'gold-royal':        { url: '/avatar_frames/premium/GoldRoyal.png',      meta_scale: 1.0, avatar_ratio: 0.92 },
  'silver-platinum':   { url: '/avatar_frames/premium/SilverPlatinum.png', meta_scale: 1.0, avatar_ratio: 0.92 },
  'rose-gold':         { url: '/avatar_frames/premium/RoseGold.png',       meta_scale: 1.0, avatar_ratio: 0.92 },
  'teal-neon':         { url: '/avatar_frames/premium/TealNeon.png',       meta_scale: 1.0, avatar_ratio: 0.92 },
  'purple-violet':     { url: '/avatar_frames/premium/PurpleViolet.png',   meta_scale: 1.0, avatar_ratio: 0.92 },
};

export default function FrameEditor({ item }: { item: any }) {
  const initialCfg: FrameConfig = useMemo(() => {
    const fromCfg = (item.editor_config as any)?.frame_config;
    // ★ v1.3.61: Registry'deki avatar_ratio'yu default olarak kullan.
    //   APK'da getFrameAvatarRatio(frameId) → registry değeri döner;
    //   admin'de de aynı varsayılan kullanılmalı (eşleşme için).
    const entry = FRAME_LOTTIE_MAP[item.id];
    const registryDefaults: Partial<FrameConfig> = {};
    if (entry) {
      registryDefaults.avatar_ratio = entry.avatar_ratio;
    }
    return { ...DEFAULT_CONFIG, ...registryDefaults, ...(fromCfg || {}) };
  }, [item.id]);

  // ★ v1.3.54: Per-size config — DB'de top-level config + size_overrides[sizeKey].
  //   rawCfg = ham yapı (size_overrides dahil). cfg = editingSize'a göre merged display.
  const [rawCfg, setRawCfg] = useState<FrameConfig & { size_overrides?: any }>(initialCfg);
  const [editingSize, setEditingSize] = useState<'default' | 'mini' | 'listener' | 'speaker' | 'stage_host' | 'profile'>('default');
  const cfg = useMemo(() => {
    if (editingSize === 'default') return rawCfg;
    const overrides = (rawCfg as any).size_overrides?.[editingSize] ?? {};
    return { ...rawCfg, ...overrides };
  }, [rawCfg, editingSize]);
  const [lottieData, setLottieData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  // ★ Mobile boyut: önizleme bu boyutta (gerçek emülatör pixel), oran kalır
  const [mobileSize, setMobileSize] = useState(160);
  // ★ v265 (13 May 2026): Tier rozet önizleme seçici — APK'daki TierBadge'in tier'a göre
  //   farklı render ettiği parite (Plus=teal diamond, Pro=altın star, GM=pembe sparkles).
  //   Önceden tüm tier'lar "PRO" hardcode'la gösteriliyordu; admin Plus/GM ayarı yapsa bile
  //   önizlemede aynı görünüyordu.
  const [previewTier, setPreviewTier] = useState<'Plus' | 'Pro' | 'GodMaster'>('Pro');

  // ★ v1.3.61: Registry meta — APK'daki meta.scale ve avatarRatio değerleri.
  //   Önizleme bu değerleri hesaba katmalı yoksa boyutlar uyuşmaz.
  const registryEntry = FRAME_LOTTIE_MAP[item.id] || null;
  const metaScale = registryEntry?.meta_scale ?? 1.0;
  const registryAvatarRatio = registryEntry?.avatar_ratio ?? 0.92;

  // ★ 2026-05-11: asset_url (DB'deki yeni kolon) öncelikli — web admin'den yüklenen
  //   yeni ürünlerin id'si hardcoded FRAME_LOTTIE_MAP'te olmaz, ama asset_url'de var.
  //   Eski editor_config.lottie_url ve FRAME_LOTTIE_MAP backward-compat için kalıyor.
  const assetUrl: string | null =
    (typeof item.asset_url === 'string' && item.asset_url) ||
    (item.editor_config as any)?.lottie_url ||
    registryEntry?.url ||
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
    setRawCfg(c => {
      if (editingSize === 'default') {
        return { ...c, [key]: value };
      }
      const overrides = (c as any).size_overrides ?? {};
      return {
        ...c,
        size_overrides: {
          ...overrides,
          [editingSize]: { ...(overrides[editingSize] ?? {}), [key]: value },
        },
      } as any;
    });
  }

  function reset() { setRawCfg(DEFAULT_CONFIG); setEditingSize('default'); }

  /** ★ Aktif boyut override'unu temizle (default değerlere düşer). */
  function clearSizeOverride(sizeKey: typeof editingSize) {
    if (sizeKey === 'default') return;
    setRawCfg(c => {
      const overrides = { ...((c as any).size_overrides ?? {}) };
      delete overrides[sizeKey];
      return { ...c, size_overrides: overrides } as any;
    });
  }

  async function save() {
    setSaving(true);
    setSavedNote(null);
    try {
      const res = await fetch(`/api/yonet/frames/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame_config: rawCfg }),
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

  // ★ editingSize değişince önizleme boyutunu o boyuta auto-tune et
  useEffect(() => {
    const sizeMap: Record<typeof editingSize, number> = {
      default: 140,
      mini: 40,
      listener: 80,
      speaker: 120,
      stage_host: 140,
      profile: 160,
    };
    setMobileSize(sizeMap[editingSize]);
  }, [editingSize]);

  // ★ v1.3.61: APK ile birebir parite — frame boyutu hesaplaması.
  //   APK'da LottieFrame: lottieSize = size * meta.scale * dynScale
  //   APK'da PngFrame:    frameSize  = size * meta.scale * dynScale
  //   Eski hata: web admin meta.scale'i hesaba katmıyordu (sadece frame_scale kullanıyordu),
  //   bu yüzden aurelius gibi scale=1.8 frame'ler admin'de çok küçük, APK'da çok büyük çıkıyordu.
  // ★ v1.3.62 PARİTE: Admin'den yüklenen frame'ler RemoteAssetFrame ile render edilir;
  //   image için 1.4x, lottie için 1.8x extra büyütme uygular. Registry'de olmayan
  //   (registryEntry yoksa) frame'lere bu çarpanı admin de uygular ki halka avatardan
  //   büyük gözüksün, custom shape (hexagon/star/diamond) köşeleri APK ile aynı görünsün.
  const remoteFactor = registryEntry ? 1.0 : (isLottie ? 1.8 : 1.4);
  const frameContainerSize = Math.round(mobileSize * metaScale * cfg.frame_scale * remoteFactor);
  const avatarSize = Math.round(mobileSize * cfg.avatar_ratio);
  const stageCenter = STAGE_SIZE / 2;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6">
      {/* SOL — preview
          ★ v1.3.54: Üst "Boyut" seçici kaldırıldı. Sağ paneldeki "Hangi boyut için
          ayarlıyorsun?" seçici hem editingSize hem önizleme boyutunu kontrol ediyor
          (useEffect otomatik senkron). İki seçici kafa karıştırıyordu. */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">
          Çerçeve Önizleme
          <span className="ml-2 text-[10px] text-slate-500 font-normal">
            ({MOBILE_SIZES.find(s => s.v === mobileSize)?.l || `${mobileSize}px`})
          </span>
        </h2>
        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: STAGE_SIZE,
            height: STAGE_SIZE,
            // ★ v1.3.60: APK ProfileHero card görünümü ile birebir parite —
            //   slate diagonal gradient + amber radial overlay (ProfileHero s.card
            //   ile aynı katmanlar). Slider çekildiğinde APK kart görünümü simüle.
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,158,11,0.08), transparent 60%),' +
              'radial-gradient(ellipse 60% 40% at 0% 0%, rgba(245,158,11,0.20), transparent 50%),' +
              'linear-gradient(135deg, #3a4658 0%, #2a3344 50%, #1a2030 100%)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
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

          {/* Avatar — merkezi, sabit boyutta. Pulse/float animation transform üzerinden,
              glow_pulse keyframes ile boxShadow yoğunluğunu dalgalandırır. */}
          {/* ★ Background Halo — avatarın ARKASINDA soft diffuse glow (derinlik) */}
          {cfg.bg_halo_enabled && (() => {
            const haloSize = avatarSize * cfg.bg_halo_size;
            return (
              <div
                style={{
                  position: 'absolute',
                  left: stageCenter - haloSize / 2,
                  top: stageCenter - haloSize / 2,
                  width: haloSize,
                  height: haloSize,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${cfg.bg_halo_color}${Math.round(cfg.bg_halo_intensity * 255).toString(16).padStart(2, '0')} 0%, ${cfg.bg_halo_color}00 70%)`,
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            );
          })()}

          {/* ★ v1.3.63 PARİTE: Glow Halo — APK BgHaloOverlay ile birebir.
                Eski: avatar wrapper boxShadow (sıkı 20/40px neon halka).
                Yeni: avatar arkasında ayrı radial-gradient div, sizeMul ve intensity
                APK formülüyle (1.15 + intensity*0.15, intensity*0.8). Görsel: yumuşak
                duman gibi yayılan halo — APK SVG RadialGradient ile aynı görünüm. */}
          {cfg.glow_enabled && (() => {
            const glowSizeMul = 1.15 + cfg.glow_intensity * 0.15;
            const glowOpacity = Math.min(1, cfg.glow_intensity * 0.8);
            const haloSize = avatarSize * glowSizeMul;
            const opacityHex = Math.round(glowOpacity * 255).toString(16).padStart(2, '0');
            return (
              <div
                style={{
                  position: 'absolute',
                  left: stageCenter - haloSize / 2,
                  top: stageCenter - haloSize / 2,
                  width: haloSize,
                  height: haloSize,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${cfg.glow_color}${opacityHex} 0%, ${cfg.glow_color}00 70%)`,
                  pointerEvents: 'none',
                  // glow_pulse aktifse opacity dalgalanır (APK glowPulseAnim 1↔1.4 brightness)
                  animation: [
                    cfg.glow_pulse && `glow-halo-pulse ${cfg.avatar_pulse_speed * 1.5}s ease-in-out infinite`,
                    cfg.color_cycle && `glow-halo-hue ${cfg.color_cycle_speed}s linear infinite`,
                  ].filter(Boolean).join(', ') || undefined,
                  zIndex: 1.5 as any,
                }}
              />
            );
          })()}

          {/* Avatar — şekil/border/filter uygulanmış */}
          {(() => {
            const shapeDef = SHAPE_CLIP[cfg.avatar_shape] || SHAPE_CLIP.circle;
            // CSS filter zinciri — sanatsal işleme
            const filterChain = [
              cfg.avatar_hue_rotate !== 0 && `hue-rotate(${cfg.avatar_hue_rotate}deg)`,
              cfg.avatar_brightness !== 1 && `brightness(${cfg.avatar_brightness})`,
              cfg.avatar_saturation !== 1 && `saturate(${cfg.avatar_saturation})`,
              cfg.avatar_blur > 0 && `blur(${cfg.avatar_blur}px)`,
              cfg.avatar_grayscale > 0 && `grayscale(${cfg.avatar_grayscale}%)`,
              cfg.avatar_sepia > 0 && `sepia(${cfg.avatar_sepia}%)`,
            ].filter(Boolean).join(' ') || undefined;
            const borderCss = cfg.avatar_border_enabled
              ? `${cfg.avatar_border_width}px ${cfg.avatar_border_style} ${cfg.avatar_border_color}`
              : undefined;
            return (
              <div
                style={{
                  position: 'absolute',
                  left: stageCenter - avatarSize / 2,
                  top: stageCenter - avatarSize / 2,
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: shapeDef.borderRadius,
                  clipPath: shapeDef.clipPath,
                  overflow: 'hidden',
                  border: borderCss,
                  boxSizing: 'border-box',
                  zIndex: 2,
                  // ★ v1.3.63: boxShadow KALDIRILDI — glow artık ayrı radial-gradient
                  //   halo div'i ile (yukarıda) APK BgHaloOverlay paritesi sağlanıyor.
                  animation: [
                    cfg.avatar_pulse && `avatar-pulse ${cfg.avatar_pulse_speed}s ease-in-out infinite`,
                    cfg.avatar_float && `avatar-float ${cfg.avatar_float_speed}s ease-in-out infinite`,
                    cfg.avatar_shake && `avatar-shake 0.6s linear infinite`,
                    cfg.avatar_swing && `avatar-swing 2.5s ease-in-out infinite`,
                    cfg.avatar_tilt && `avatar-tilt 3s ease-in-out infinite`,
                  ].filter(Boolean).join(', ') || undefined,
                }}
              >
                {/* Filter wrapper iç div'e — animation ile çakışmasın diye ayrı katman */}
                <div style={{ width: '100%', height: '100%', filter: filterChain }}>
                  <img src={SAMPLE_AVATAR} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            );
          })()}

          {/* ★ Particle efekti — avatar etrafında dönen parçacıklar.
                Gerçek emoji + glow + per-particle pulse. Yörünge avatarın
                YETERLİ DIŞINDA (avatarSize/2 + 20px) ki yüzün üstüne binmesin.
                Wrapper orbit loop yapar, her span sabit pozisyonda + twinkle. */}
          {cfg.particle_type !== 'none' && (() => {
            const particleEmoji =
              cfg.particle_type === 'sparkle' ? '✨'
              : cfg.particle_type === 'stars'   ? '⭐'
              : cfg.particle_type === 'hearts'  ? '❤️'
              : '🫧';
            // ★ v269 (14 May 2026): Mobile AvatarFrame ile birebir parite (audit aksiyon 3+4):
            //   - fontSize çarpan: 0.18 → 0.15, min 14 → 12 (mobile L:429 ile eşit)
            //   - orbit min pad: 20 → 4, fontSize çarpan 0.4 → 0.15 (mobile L:432 ile eşit)
            //   Önceden web admin'de parçacıklar uzakta+iri, mobile'da yakın+küçük gösterilirdi.
            const particleSize = Math.max(12, Math.round(avatarSize * 0.15));
            const orbitRadius = avatarSize / 2 + Math.max(4, particleSize * 0.15);
            const wrapperSize = (orbitRadius + particleSize) * 2;
            return (
              <div
                style={{
                  position: 'absolute',
                  left: stageCenter - wrapperSize / 2,
                  top: stageCenter - wrapperSize / 2,
                  width: wrapperSize,
                  height: wrapperSize,
                  pointerEvents: 'none',
                  zIndex: 4,
                  animation: 'particle-orbit-wrapper 14s linear infinite',
                }}
              >
                {Array.from({ length: cfg.particle_count }).map((_, i) => {
                  const angle = (360 / cfg.particle_count) * i;
                  const rad = (angle * Math.PI) / 180;
                  const x = Math.cos(rad) * orbitRadius;
                  const y = Math.sin(rad) * orbitRadius;
                  const delay = (i * 0.25) % 2;
                  return (
                    <span
                      key={i}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        marginLeft: x - particleSize / 2,
                        marginTop: y - particleSize / 2,
                        width: particleSize,
                        height: particleSize,
                        fontSize: particleSize,
                        lineHeight: `${particleSize}px`,
                        textAlign: 'center',
                        animation: `particle-twinkle 1.8s ease-in-out ${delay}s infinite`,
                        filter: `drop-shadow(0 0 4px ${cfg.particle_color}) drop-shadow(0 0 8px ${cfg.particle_color})`,
                        // Counter-rotate: wrapper döndüğü için emoji sabit dik dursun
                        transformOrigin: 'center',
                      }}
                    >
                      {particleEmoji}
                    </span>
                  );
                })}
              </div>
            );
          })()}

          {/* Frame Lottie — avatar etrafında, scale'a göre büyüyebilir.
              frame_breathe ile yavaş büyüyüp küçülür (rotation ile birlikte çalışabilir).
              ★ v1.3.63 PARİTE: APK Lottie native filter desteklemez. Gerçek CSS
              `hue-rotate / brightness / saturate` ve `color-cycle` keyframes
              KALDIRILDI — yerine APK LottieFrame.tsx ile aynı renkli overlay div
              katmanları kullanılıyor (hue: HSL %25, brightness: white/black, sat<1: gri). */}
          {lottieData && (
            <div
              style={{
                position: 'absolute',
                left: stageCenter - frameContainerSize / 2 + cfg.frame_offset_x * mobileSize,
                top: stageCenter - frameContainerSize / 2 + cfg.frame_offset_y * mobileSize,
                width: frameContainerSize,
                height: frameContainerSize,
                opacity: cfg.frame_opacity,
                animation: [
                  cfg.frame_rotation > 0 && `frame-spin ${cfg.frame_rotation}s linear infinite`,
                  cfg.frame_breathe && `frame-breathe 4s ease-in-out infinite`,
                  cfg.frame_wobble && `frame-wobble 2s ease-in-out infinite`,
                ].filter(Boolean).join(', ') || undefined,
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              <Lottie animationData={lottieData} loop autoplay speed={cfg.lottie_speed}
                style={{ width: '100%', height: '100%' }} />
              {/* APK LottieFrame renkli overlay simülasyonu — hue/brightness/saturation */}
              {/* ★ v275: opacity'ler 0.25/0.4 → 0.45/0.6/0.55 (mobile parite + görünür) */}
              {cfg.lottie_hue_rotate !== 0 && (
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  backgroundColor: `hsl(${cfg.lottie_hue_rotate}, 70%, 50%)`,
                  opacity: 0.45, borderRadius: '50%', pointerEvents: 'none',
                }} />
              )}
              {cfg.lottie_brightness !== 1 && (
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  backgroundColor: cfg.lottie_brightness > 1 ? 'white' : 'black',
                  opacity: Math.min(0.7, Math.abs(cfg.lottie_brightness - 1) * 0.6),
                  borderRadius: '50%', pointerEvents: 'none',
                }} />
              )}
              {cfg.lottie_saturation < 1 && (
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  backgroundColor: 'rgba(128,128,128,1)',
                  opacity: (1 - cfg.lottie_saturation) * 0.55,
                  borderRadius: '50%', pointerEvents: 'none',
                }} />
              )}
            </div>
          )}
          {/* ★ PNG/JPG/SVG asset — Lottie değilse direkt Image render.
              ★ v1.3.63 PARİTE: APK PngFrame `lottie_hue_rotate/brightness/saturation`
              flag'lerini UYGULAMAZ — sadece `color_cycle` aktifse tintColor cycle.
              Web önizleme bu davranışla birebir: filter kaldırıldı, sadece color_cycle
              aktifken hue-rotate animasyonu (APK tintColor cycle'ın görsel karşılığı). */}
          {imageUrl && !lottieData && (
            <div
              style={{
                position: 'absolute',
                left: stageCenter - frameContainerSize / 2 + cfg.frame_offset_x * mobileSize,
                top: stageCenter - frameContainerSize / 2 + cfg.frame_offset_y * mobileSize,
                width: frameContainerSize,
                height: frameContainerSize,
                opacity: cfg.frame_opacity,
                animation: [
                  cfg.frame_rotation > 0 && `frame-spin ${cfg.frame_rotation}s linear infinite`,
                  cfg.frame_breathe && `frame-breathe 4s ease-in-out infinite`,
                  cfg.frame_wobble && `frame-wobble 2s ease-in-out infinite`,
                  // APK PngFrame'de tintColor cycle — web'de hue-rotate ile yaklaşık
                  cfg.color_cycle && `color-cycle ${cfg.color_cycle_speed}s linear infinite`,
                ].filter(Boolean).join(', ') || undefined,
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          )}
          {/* ★ Frame shimmer — üzerinden ışık süpürmesi geçer.
              ★ v1.3.63 PARİTE: mixBlendMode KALDIRILDI — RN'de mixBlendMode yok,
              APK'da düz LinearGradient overlay + wrapper translateX kullanılıyor.
              Web önizleme APK görünümü ile birebir olsun diye blend mode kaldırıldı. */}
          {cfg.frame_shimmer && (lottieData || imageUrl) && (() => {
            const shScale = cfg.frame_shimmer_scale ?? 1;
            const shSize = frameContainerSize * shScale;
            const shSpeed = cfg.frame_shimmer_speed ?? 2.5;
            const shOpacity = cfg.frame_shimmer_opacity ?? 0.4;
            const shAngle = cfg.frame_shimmer_angle ?? 110;
            const shBand = cfg.frame_shimmer_band ?? 0.2;
            const shReverse = !!cfg.frame_shimmer_reverse;
            const bandHalf = Math.max(0.02, Math.min(0.48, shBand / 2));
            const stopStartPct = (0.5 - bandHalf) * 100;
            const stopEndPct = (0.5 + bandHalf) * 100;
            return (
              <div
                style={{
                  position: 'absolute',
                  left: stageCenter - shSize / 2 + cfg.frame_offset_x * mobileSize,
                  top: stageCenter - shSize / 2 + cfg.frame_offset_y * mobileSize,
                  width: shSize,
                  height: shSize,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                  zIndex: (cfg.frame_shimmer_layer ?? 'above') === 'below' ? 2 : 4,
                  backgroundImage: `linear-gradient(${shAngle}deg, transparent ${stopStartPct}%, rgba(255,255,255,${shOpacity}) 50%, transparent ${stopEndPct}%)`,
                  backgroundSize: '200% 100%',
                  backgroundRepeat: 'no-repeat',
                  animation: `${shReverse ? 'frame-shimmer-rev' : 'frame-shimmer'} ${shSpeed}s linear infinite`,
                }}
              />
            );
          })()}

          {/* ★ Pulse Ring — radar dalgası, frame etrafında dışa yayılır */}
          {cfg.frame_pulse_ring && (
            <>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: stageCenter - avatarSize / 2,
                    top: stageCenter - avatarSize / 2,
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: '50%',
                    border: `2px solid ${cfg.glow_color}`,
                    pointerEvents: 'none',
                    zIndex: 1,
                    opacity: 0,
                    animation: `pulse-ring 2.4s ease-out infinite ${i * 0.8}s`,
                  }}
                />
              ))}
            </>
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

          {/* ★ Kullanıcı Adı — SVG textPath ile düz/yay/dairesel render
             ★ v1.3.62 PARİTE FIX: frameSize = mobileSize (APK'daki `size`). Avatar_ratio
             değişimi name'i etkilemez (APK'daki davranışla aynı). */}
          {cfg.name_enabled && (
            <NamePreviewSvg
              cfg={cfg}
              frameSize={mobileSize}
              stageCenter={stageCenter}
            />
          )}

          {/* ★ v1.3.63 PARİTE: Tier Badge önizleme APK TierBadge ile birebir.
               components/TierBadge.tsx → md size: height 17, paddingH 6, fontSize 9.5,
               letterSpacing 0.7, radius 8.5, gradient #FCD34D→#B45309 (LinearGradient
               start 0,0 → end 1,1 = CSS 135deg), shadow rgba(251,191,36,0.65) blur 5.
               Shimmer loop: opacity 0.85↔1, scale 1↔1.04, 1.6s ease-in-out. */}
          {/* ★ v283 (16 May 2026): Tier rozet preview KALDIRILDI — rozet ayarları artık
              Mağaza → Rozetler menüsünden yönetiliyor, çerçeve editöründe yer almıyor. */}
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

        {/* ★ v1.3.54: Boyut bazlı override seçici. Default seçildiğinde değişiklikler
            top-level config'e yazılır (TÜM boyutlar için geçerli temel ayar).
            Belirli bir boyut seçilirse SADECE o boyut için override yazılır. */}
        <Section title="Hangi boyut için ayarlıyorsun?" icon={<SettingsIcon className="w-4 h-4 text-indigo-400" />}>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { k: 'default', l: 'Tümü (Temel)', desc: 'Tüm boyutlar' },
              { k: 'mini', l: 'Mini', desc: '40px' },
              { k: 'listener', l: 'Dinleyici', desc: '80px' },
              { k: 'speaker', l: 'Konuşmacı', desc: '120px' },
              { k: 'stage_host', l: 'Sahne Host', desc: '140px' },
              { k: 'profile', l: 'Profil', desc: '160px' },
            ] as const).map(b => {
              const active = editingSize === b.k;
              const hasOverride = b.k !== 'default' && !!(rawCfg as any).size_overrides?.[b.k];
              return (
                <button
                  key={b.k}
                  type="button"
                  onClick={() => setEditingSize(b.k as typeof editingSize)}
                  className={`relative px-2 py-2 rounded-md border text-[11px] text-left ${
                    active
                      ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium">{b.l}</div>
                  <div className="text-[9px] text-slate-500">{b.desc}</div>
                  {hasOverride && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" title="Bu boyut için özel ayar var" />
                  )}
                </button>
              );
            })}
          </div>
          {editingSize !== 'default' && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-amber-300/90 bg-amber-900/20 border border-amber-700/40 rounded p-2">
              <div>
                <strong>{editingSize}</strong> boyutu için özel ayar yapıyorsun.
                {!(rawCfg as any).size_overrides?.[editingSize] && ' Henüz override yok — değer değiştirince oluşacak.'}
              </div>
              {(rawCfg as any).size_overrides?.[editingSize] && (
                <button
                  type="button"
                  onClick={() => clearSizeOverride(editingSize)}
                  className="ml-2 px-2 py-0.5 rounded bg-red-800 hover:bg-red-700 text-red-100 text-[10px] whitespace-nowrap"
                >Override sil</button>
              )}
            </div>
          )}
        </Section>

        <Section title="Avatar — İç Doluluk" icon={<Award className="w-4 h-4 text-amber-400" />}>
          <Slider label="Avatar Oranı" min={0.6} max={1.25} step={0.01} value={cfg.avatar_ratio} onChange={v => update('avatar_ratio', v)} display={`${Math.round(cfg.avatar_ratio * 100)}%`} />
          <p className="text-[11px] text-slate-500">Avatar'ın size'a göre boyutu. Frame iç dairesini doldurmasını sağlar.</p>
        </Section>

        {/* ★ 2026-05-11: Sanatsal avatar paketi — şekil + border + halo + filtre */}
        <Section title="Avatar Görünümü" icon={<Sparkles className="w-4 h-4 text-fuchsia-400" />}>
          <SubBlock title="Şekil">
            <label className="block">
              <div className="text-xs text-slate-400 mb-1">Avatar şekli</div>
              <select
                value={cfg.avatar_shape}
                onChange={e => update('avatar_shape', e.target.value as FrameConfig['avatar_shape'])}
                aria-label="Avatar şekli"
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs"
              >
                {Object.entries(SHAPE_CLIP).map(([key, def]) => (
                  <option key={key} value={key}>{def.label}</option>
                ))}
              </select>
            </label>
            <p className="text-[10px] text-slate-500">Daire dışı şekiller eski 5 frame ile çelişebilir, frame opacity'i azaltmayı dene.</p>
          </SubBlock>
          <SubBlock title="Border (Premium Ring)">
            <Toggle label="Border aktif" checked={cfg.avatar_border_enabled} onChange={v => update('avatar_border_enabled', v)} />
            {cfg.avatar_border_enabled && (
              <>
                <ColorInput label="Renk" value={cfg.avatar_border_color} onChange={v => update('avatar_border_color', v)} />
                <Slider label="Kalınlık" min={1} max={12} step={1} value={cfg.avatar_border_width} onChange={v => update('avatar_border_width', v)} display={`${cfg.avatar_border_width}px`} />
                <label className="block">
                  <div className="text-xs text-slate-400 mb-1">Stil</div>
                  <select
                    value={cfg.avatar_border_style}
                    onChange={e => update('avatar_border_style', e.target.value as FrameConfig['avatar_border_style'])}
                    aria-label="Border stili"
                    className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs"
                  >
                    <option value="solid">Düz</option>
                    <option value="dashed">Kesik kesik</option>
                    <option value="dotted">Noktalı</option>
                    <option value="double">Çift çizgi</option>
                  </select>
                </label>
              </>
            )}
          </SubBlock>
          <SubBlock title="🌟 Background Halo (Derinlik)">
            <Toggle label="Halo aktif (avatar arkasında soft glow)" checked={cfg.bg_halo_enabled} onChange={v => update('bg_halo_enabled', v)} />
            {cfg.bg_halo_enabled && (
              <>
                <ColorInput label="Halo rengi" value={cfg.bg_halo_color} onChange={v => update('bg_halo_color', v)} />
                <Slider label="Boyut" min={1.0} max={3.0} step={0.1} value={cfg.bg_halo_size} onChange={v => update('bg_halo_size', v)} display={`${cfg.bg_halo_size.toFixed(1)}x`} />
                <Slider label="Yoğunluk" min={0.2} max={1} step={0.05} value={cfg.bg_halo_intensity} onChange={v => update('bg_halo_intensity', v)} display={`${Math.round(cfg.bg_halo_intensity * 100)}%`} />
              </>
            )}
          </SubBlock>
          <SubBlock title="🎨 Filtreler (Sanatsal İşleme)">
            <Slider label="Renk Tonu (Hue)" min={0} max={360} step={5} value={cfg.avatar_hue_rotate} onChange={v => update('avatar_hue_rotate', v)} display={`${cfg.avatar_hue_rotate}°`} />
            <Slider label="Parlaklık" min={0.5} max={1.5} step={0.05} value={cfg.avatar_brightness} onChange={v => update('avatar_brightness', v)} display={`${cfg.avatar_brightness.toFixed(2)}x`} />
            <Slider label="Doygunluk" min={0} max={2} step={0.05} value={cfg.avatar_saturation} onChange={v => update('avatar_saturation', v)} display={`${cfg.avatar_saturation.toFixed(2)}x`} />
            <Slider label="Bulanıklık (Dreamy)" min={0} max={5} step={0.5} value={cfg.avatar_blur} onChange={v => update('avatar_blur', v)} display={`${cfg.avatar_blur}px`} />
            <Slider label="Siyah-Beyaz" min={0} max={100} step={5} value={cfg.avatar_grayscale} onChange={v => update('avatar_grayscale', v)} display={`%${cfg.avatar_grayscale}`} />
            <Slider label="Sepia (eski fotoğraf)" min={0} max={100} step={5} value={cfg.avatar_sepia} onChange={v => update('avatar_sepia', v)} display={`%${cfg.avatar_sepia}`} />
          </SubBlock>
        </Section>

        <Section title="Frame — Konum & Boyut" icon={<Move className="w-4 h-4 text-purple-400" />}>
          <Slider label="Ölçek (Avatar'a göre)" min={0.8} max={1.5} step={0.02} value={cfg.frame_scale} onChange={v => update('frame_scale', v)} display={`${cfg.frame_scale.toFixed(2)}x`} />
          <Slider label="Yatay Kaydır" min={-0.15} max={0.15} step={0.01} value={cfg.frame_offset_x} onChange={v => update('frame_offset_x', v)} display={`${(cfg.frame_offset_x * 100).toFixed(0)}%`} />
          <Slider label="Dikey Kaydır" min={-0.15} max={0.15} step={0.01} value={cfg.frame_offset_y} onChange={v => update('frame_offset_y', v)} display={`${(cfg.frame_offset_y * 100).toFixed(0)}%`} />
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
          {/* ★ v284: Mobil RN Lottie color filter desteklemiyor (mimari kısıt).
              Slider'lar görsel önizleme için çalışır, web üzerinde tam renkli görünür,
              fakat APK'da no-op — değiştirilse bile mobil görsel değişmez.
              Animasyon Hızı tek istisna: Lottie speed prop RN tarafında da çalışır. */}
          <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 mt-0.5 shrink-0">
              <path d="M12 9v4M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="leading-relaxed">
              <span className="font-medium text-amber-100">Mobil kısıt:</span>{' '}
              React Native Lottie renk filtresini doğrudan desteklemiyor (Hue/Parlaklık/Doygunluk). Bu slider'lar
              web önizlemede çalışır ama APK'da görsel etki yapmaz — sadece <span className="font-mono">Animasyon Hızı</span> mobile uygulanır.
              Renk değişikliği için frame asset'ini farklı tonlarda yeniden export etmek gerek (Lottie JSON'unu Skia ile re-render alternatifi post-launch işidir).
            </div>
          </div>
          <Slider label="Renk Tonu (Hue) — sadece web preview" min={0} max={360} step={5} value={cfg.lottie_hue_rotate} onChange={v => update('lottie_hue_rotate', v)} display={`${cfg.lottie_hue_rotate}°`} />
          <Slider label="Parlaklık — sadece web preview" min={0.3} max={2} step={0.05} value={cfg.lottie_brightness} onChange={v => update('lottie_brightness', v)} display={`${cfg.lottie_brightness.toFixed(2)}x`} />
          <Slider label="Doygunluk — sadece web preview" min={0} max={2} step={0.05} value={cfg.lottie_saturation} onChange={v => update('lottie_saturation', v)} display={`${cfg.lottie_saturation.toFixed(2)}x`} />
          <Slider label="Animasyon Hızı ✓ mobil destekli" min={0.25} max={2} step={0.05} value={cfg.lottie_speed} onChange={v => update('lottie_speed', v)} display={`${cfg.lottie_speed.toFixed(2)}x`} />
        </Section>

        {/* ★ 2026-05-11: Hareket & Efekt — opsiyonel canlandırıcı katmanlar */}
        <Section title="Hareket & Efekt" icon={<Wind className="w-4 h-4 text-emerald-400" />}>
          <SubBlock title="Avatar Hareketi">
            <Toggle label="Nabız (büyür-küçülür)" checked={cfg.avatar_pulse} onChange={v => update('avatar_pulse', v)} />
            {cfg.avatar_pulse && (
              <Slider label="Nabız hızı" min={1} max={5} step={0.5} value={cfg.avatar_pulse_speed} onChange={v => update('avatar_pulse_speed', v)} display={`${cfg.avatar_pulse_speed}sn`} />
            )}
            <Toggle label="Süzülme (yavaş yukarı/aşağı)" checked={cfg.avatar_float} onChange={v => update('avatar_float', v)} />
            {cfg.avatar_float && (
              <Slider label="Süzülme hızı" min={2} max={8} step={0.5} value={cfg.avatar_float_speed} onChange={v => update('avatar_float_speed', v)} display={`${cfg.avatar_float_speed}sn`} />
            )}
            <Toggle label="Titreşim (shake — bildirim hissi)" checked={cfg.avatar_shake} onChange={v => update('avatar_shake', v)} />
            <Toggle label="Sarkaç (swing — sallanma)" checked={cfg.avatar_swing} onChange={v => update('avatar_swing', v)} />
            <Toggle label="Yan yatma (tilt — sağ-sol)" checked={cfg.avatar_tilt} onChange={v => update('avatar_tilt', v)} />
          </SubBlock>
          <SubBlock title="Frame Davranışı">
            <Toggle label="Frame nefes alır (yavaş büyür-küçülür)" checked={cfg.frame_breathe} onChange={v => update('frame_breathe', v)} />
            <Toggle label="Glow nefes (parlaklık dalgalanır)" checked={cfg.glow_pulse} onChange={v => update('glow_pulse', v)} />
            <p className="text-[10px] text-slate-500 leading-snug">
              Avatar etrafındaki parlaklık halkası <strong>~1.5 saniye periyotla yumuşak yanar-söner</strong>
              (opacity 0.7 ↔ 1.0). "Nefes alır gibi" canlı, dikkat çekici efekt. <br />
              ⚠️ <strong>Önce yukarıdaki "Parlaklık (avatar)" aktif olmalı</strong>, yoksa görünmez.
            </p>
            <Toggle label="Shimmer (üzerinden ışık süpürmesi)" checked={cfg.frame_shimmer} onChange={v => update('frame_shimmer', v)} />
            {cfg.frame_shimmer && (
              <div className="space-y-2 pl-2 border-l-2 border-cyan-500/30">
                <Slider label="Boyut" min={0.3} max={2.0} step={0.05}
                  value={cfg.frame_shimmer_scale ?? 1}
                  onChange={v => update('frame_shimmer_scale', v)}
                  display={`${Math.round((cfg.frame_shimmer_scale ?? 1) * 100)}%`} />
                <Slider label="Hız (saniye)" min={0.5} max={10} step={0.1}
                  value={cfg.frame_shimmer_speed ?? 2.5}
                  onChange={v => update('frame_shimmer_speed', v)}
                  display={`${(cfg.frame_shimmer_speed ?? 2.5).toFixed(1)}s`} />
                <Slider label="Parlaklık (peak)" min={0.05} max={1} step={0.05}
                  value={cfg.frame_shimmer_opacity ?? 0.4}
                  onChange={v => update('frame_shimmer_opacity', v)}
                  display={`${Math.round((cfg.frame_shimmer_opacity ?? 0.4) * 100)}%`} />
                <Slider label="Açı (derece)" min={0} max={359} step={1}
                  value={cfg.frame_shimmer_angle ?? 110}
                  onChange={v => update('frame_shimmer_angle', v)}
                  display={`${cfg.frame_shimmer_angle ?? 110}°`} />
                <Slider label="Bant Genişliği" min={0.05} max={0.5} step={0.01}
                  value={cfg.frame_shimmer_band ?? 0.2}
                  onChange={v => update('frame_shimmer_band', v)}
                  display={`${Math.round((cfg.frame_shimmer_band ?? 0.2) * 100)}%`} />
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input type="checkbox"
                    checked={cfg.frame_shimmer_reverse ?? false}
                    onChange={e => update('frame_shimmer_reverse', e.target.checked)}
                    aria-label="Shimmer yönü ters" />
                  Yön: ters çevir (sola → sağa)
                </label>
                <label className="block">
                  <div className="text-xs text-slate-400 mb-1">Konum (Katman)</div>
                  <select
                    value={cfg.frame_shimmer_layer ?? 'above'}
                    onChange={e => update('frame_shimmer_layer', e.target.value as 'above' | 'below')}
                    aria-label="Shimmer katman pozisyonu"
                    className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs"
                  >
                    <option value="above">Çerçeve Üstü (frame PNG'yi de kapatır)</option>
                    <option value="below">Çerçeve Altı (frame PNG arkasında, iç dairede)</option>
                  </select>
                </label>
              </div>
            )}
            <Toggle label="Wobble (titreşim — hafif sallama)" checked={cfg.frame_wobble} onChange={v => update('frame_wobble', v)} />
            <Toggle label="Pulse Ring (radar dalgası — dışa yayılan halka)" checked={cfg.frame_pulse_ring} onChange={v => update('frame_pulse_ring', v)} />
          </SubBlock>
          <SubBlock title="Parçacık Efekti (avatar etrafında)">
            <label className="block">
              <div className="text-xs text-slate-400 mb-1">Tip</div>
              <select
                value={cfg.particle_type}
                onChange={e => update('particle_type', e.target.value as FrameConfig['particle_type'])}
                aria-label="Parçacık tipi"
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs"
              >
                <option value="none">Kapalı</option>
                <option value="sparkle">✨ Parıltı</option>
                <option value="stars">⭐ Yıldız</option>
                <option value="hearts">❤️ Kalp</option>
                <option value="bubbles">○ Baloncuk</option>
              </select>
            </label>
            {cfg.particle_type !== 'none' && (
              <>
                <Slider label="Adet" min={4} max={12} step={1} value={cfg.particle_count} onChange={v => update('particle_count', v)} display={`${cfg.particle_count}`} />
                <ColorInput label="Renk" value={cfg.particle_color} onChange={v => update('particle_color', v)} />
              </>
            )}
          </SubBlock>
          <SubBlock title="🌈 Renk Döngüsü (Rainbow)">
            <Toggle label="Aktif — frame/glow/parçacık rengi sürekli döner" checked={cfg.color_cycle} onChange={v => update('color_cycle', v)} />
            {cfg.color_cycle && (
              <>
                <Slider label="Tur süresi" min={5} max={30} step={1} value={cfg.color_cycle_speed} onChange={v => update('color_cycle_speed', v)} display={`${cfg.color_cycle_speed}sn / tur`} />
                <p className="text-[10px] text-slate-500">Hızlı = canlı disko · Yavaş = yumuşak geçiş</p>
              </>
            )}
          </SubBlock>
          <p className="text-[10px] text-emerald-300/70 leading-relaxed">
            💡 Bu efektler mobilde de çalışır — kayıt sonrası 5 dk içinde otomatik uygulanır.
          </p>
        </Section>

        {/* ★ 2026-05-11: Kimlik & Etiket — kullanıcı adı ve tier rozeti
            ile çerçevenin etrafında premium kimlik sunumu. */}
        <Section title="Kimlik & Etiket" icon={<Award className="w-4 h-4 text-cyan-400" />}>
          <SubBlock title="Kullanıcı Adı">
            <Toggle label="Adı çerçeve etrafında göster" checked={cfg.name_enabled} onChange={v => update('name_enabled', v)} />
            <p className="text-[10px] text-emerald-300/70 mt-1 leading-snug">
              ✓ İsim ayarları mobil uygulamada da çalışır — yay / dairesel / eğim
              react-native-svg ile gerçek render edilir. Hareket, glow, shimmer,
              renk döngüsü ve wave animasyonları paralel paritededir.
            </p>
            {cfg.name_enabled && (
              <>
                <label className="block">
                  <div className="text-xs text-slate-400 mb-1">Konum</div>
                  <select
                    value={cfg.name_position}
                    onChange={e => update('name_position', e.target.value as FrameConfig['name_position'])}
                    aria-label="İsim konumu"
                    className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs"
                  >
                    <option value="top">↑ Üst</option>
                    <option value="bottom">↓ Alt</option>
                    <option value="left">← Sol</option>
                    <option value="right">→ Sağ</option>
                  </select>
                </label>
                <label className="block">
                  <div className="text-xs text-slate-400 mb-1">Şekil</div>
                  <select
                    value={cfg.name_curve_style}
                    onChange={e => update('name_curve_style', e.target.value as FrameConfig['name_curve_style'])}
                    aria-label="İsim şekli"
                    className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs"
                  >
                    <option value="flat">— Düz</option>
                    <option value="arc-top">⌒ Yay (gülen)</option>
                    <option value="arc-bottom">⌣ Yay (kaşıyan)</option>
                    <option value="circle">○ Dairesel (avatar etrafında)</option>
                  </select>
                </label>
                {/* ★ v278: max 80 → 30 (profil sayfası kart metinleriyle çakışmayı önler) */}
                <Slider label="Mesafe (% avatar yarıçapı)" min={-30} max={30} step={5} value={cfg.name_offset} onChange={v => update('name_offset', v)} display={`%${cfg.name_offset}`} />
                <Slider label="Eğim" min={-90} max={90} step={5} value={cfg.name_rotation} onChange={v => update('name_rotation', v)} display={`${cfg.name_rotation}°`} />
                <Slider label="Boyut (% avatar)" min={6} max={18} step={1} value={cfg.name_size} onChange={v => update('name_size', v)} display={`%${cfg.name_size}`} />
                <ColorInput label="Renk" value={cfg.name_color} onChange={v => update('name_color', v)} />
                <Toggle label="Kalın yazı" checked={cfg.name_bold} onChange={v => update('name_bold', v)} />
                <Slider label="Opaklık" min={0.3} max={1} step={0.05} value={cfg.name_opacity} onChange={v => update('name_opacity', v)} display={`${Math.round(cfg.name_opacity * 100)}%`} />
                <div className="pt-2 border-t border-slate-700/40">
                  <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">🎚 İsim Hareketi</div>
                  <Toggle label="Nabız (büyür-küçülür)" checked={cfg.name_pulse} onChange={v => update('name_pulse', v)} />
                  {cfg.name_pulse && (
                    <Slider label="Nabız hızı" min={1} max={5} step={0.5} value={cfg.name_pulse_speed} onChange={v => update('name_pulse_speed', v)} display={`${cfg.name_pulse_speed}sn`} />
                  )}
                  <Toggle label="Süzülme (yukarı-aşağı)" checked={cfg.name_float} onChange={v => update('name_float', v)} />
                  {cfg.name_float && (
                    <Slider label="Süzülme hızı" min={2} max={8} step={0.5} value={cfg.name_float_speed} onChange={v => update('name_float_speed', v)} display={`${cfg.name_float_speed}sn`} />
                  )}
                  <Toggle label="Titreşim (shake)" checked={cfg.name_shake} onChange={v => update('name_shake', v)} />
                  <Toggle label="Sarkaç (swing — ±8°)" checked={cfg.name_swing} onChange={v => update('name_swing', v)} />
                  <Toggle label="Yan yatma (tilt — ±3°)" checked={cfg.name_tilt} onChange={v => update('name_tilt', v)} />
                  <Toggle label="Nefes (breathe — yumuşak büyür-küçülür)" checked={cfg.name_breathe} onChange={v => update('name_breathe', v)} />
                  <Toggle label="Wobble (titreşimli sallanma — ±2.5°)" checked={cfg.name_wobble} onChange={v => update('name_wobble', v)} />
                  <Toggle label="Sürekli dönme (rotation)" checked={cfg.name_rotation_continuous} onChange={v => update('name_rotation_continuous', v)} />
                  {cfg.name_rotation_continuous && (
                    <Slider label="Dönme hızı" min={4} max={30} step={1} value={cfg.name_rotation_speed} onChange={v => update('name_rotation_speed', v)} display={`${cfg.name_rotation_speed}sn / tur`} />
                  )}
                </div>
                <div className="pt-2 border-t border-slate-700/40">
                  <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">✨ İsim Parlama (Glow)</div>
                  <Toggle label="Glow (yazı parlar)" checked={cfg.name_glow} onChange={v => update('name_glow', v)} />
                  {cfg.name_glow && (
                    <>
                      <ColorInput label="Glow rengi" value={cfg.name_glow_color} onChange={v => update('name_glow_color', v)} />
                      <Slider label="Şiddet" min={0.2} max={1.5} step={0.05} value={cfg.name_glow_intensity} onChange={v => update('name_glow_intensity', v)} display={`${cfg.name_glow_intensity.toFixed(2)}x`} />
                      <Toggle label="Glow nefes (dalgalanır)" checked={cfg.name_glow_pulse} onChange={v => update('name_glow_pulse', v)} />
                    </>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-700/40">
                  <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">🎨 Diğer Efektler</div>
                  <Toggle label="Wave (harf-harf dalga — sadece düz)" checked={cfg.name_wave} onChange={v => update('name_wave', v)} />
                  <Toggle label="Shimmer (üstünden ışık geçer)" checked={cfg.name_shimmer} onChange={v => update('name_shimmer', v)} />
                  <Toggle label="🌈 Renk döngüsü (yazı rengi döner)" checked={cfg.name_color_cycle} onChange={v => update('name_color_cycle', v)} />
                </div>
              </>
            )}
          </SubBlock>
          {/* ★ v283 (16 May 2026): "Tier Etiketi" SubBlock'u tamamen kaldırıldı.
              Rozet ayarları artık Mağaza → Rozetler menüsünden yönetiliyor —
              tek kaynak, tek yer. Çerçeve editörü çerçeve ayarlarıyla sınırlı. */}
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
        @keyframes frame-breathe {
          0%, 100% { transform: scale(1) }
          50%      { transform: scale(1.06) }
        }
        @keyframes avatar-pulse {
          0%, 100% { transform: scale(1) }
          50%      { transform: scale(1.08) }
        }
        @keyframes avatar-float {
          0%, 100% { transform: translateY(0) }
          50%      { transform: translateY(-8px) }
        }
        @keyframes glow-pulse {
          0%, 100% { filter: brightness(1) }
          50%      { filter: brightness(1.4) }
        }
        @keyframes particle-twinkle {
          0%, 100% { opacity: 0.4; transform: scale(0.85) }
          50%      { opacity: 1;   transform: scale(1.15) }
        }
        @keyframes particle-orbit-wrapper {
          from { transform: rotate(0deg) }
          to   { transform: rotate(360deg) }
        }
        @keyframes color-cycle {
          0%   { filter: hue-rotate(0deg) }
          100% { filter: hue-rotate(360deg) }
        }
        @keyframes glow-color-cycle {
          0%   { box-shadow: 0 0 20px hsl(0,   80%, 60%), 0 0 40px hsl(0,   80%, 60%) }
          25%  { box-shadow: 0 0 20px hsl(90,  80%, 60%), 0 0 40px hsl(90,  80%, 60%) }
          50%  { box-shadow: 0 0 20px hsl(180, 80%, 60%), 0 0 40px hsl(180, 80%, 60%) }
          75%  { box-shadow: 0 0 20px hsl(270, 80%, 60%), 0 0 40px hsl(270, 80%, 60%) }
          100% { box-shadow: 0 0 20px hsl(360, 80%, 60%), 0 0 40px hsl(360, 80%, 60%) }
        }
        /* ★ Avatar ek hareketler */
        @keyframes avatar-shake {
          0%, 100% { transform: translate(0, 0) }
          20%      { transform: translate(-2px, 1px) }
          40%      { transform: translate(2px, -1px) }
          60%      { transform: translate(-1px, 2px) }
          80%      { transform: translate(1px, -2px) }
        }
        @keyframes avatar-swing {
          0%, 100% { transform: rotate(0deg) }
          25%      { transform: rotate(-8deg) }
          75%      { transform: rotate(8deg) }
        }
        @keyframes avatar-tilt {
          0%, 100% { transform: rotate(-3deg) }
          50%      { transform: rotate(3deg) }
        }
        /* ★ Frame ek davranışlar */
        @keyframes frame-shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        @keyframes frame-shimmer-rev {
          0%   { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }
        @keyframes frame-wobble {
          0%, 100% { transform: rotate(0deg) }
          25%      { transform: rotate(2.5deg) }
          75%      { transform: rotate(-2.5deg) }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.7 }
          100% { transform: scale(2.2); opacity: 0 }
        }
        /* ★ İsim animasyonları — text-shadow + transform + background-clip */
        @keyframes name-glow {
          0%, 100% { filter: drop-shadow(0 0 2px currentColor) }
          50%      { filter: drop-shadow(0 0 8px currentColor) drop-shadow(0 0 14px currentColor) }
        }
        @keyframes name-shimmer-bg {
          0%   { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }
        @keyframes name-color-cycle {
          0%   { fill: hsl(0,   85%, 65%) }
          25%  { fill: hsl(90,  85%, 65%) }
          50%  { fill: hsl(180, 85%, 65%) }
          75%  { fill: hsl(270, 85%, 65%) }
          100% { fill: hsl(360, 85%, 65%) }
        }
        @keyframes name-wave {
          0%, 100% { transform: translateY(0) }
          50%      { transform: translateY(-3px) }
        }
        /* ★ İsim hareket animasyonları — SVG wrapper'a uygulanır */
        @keyframes name-anim-pulse {
          0%, 100% { transform: scale(1) }
          50%      { transform: scale(1.1) }
        }
        @keyframes name-anim-float {
          0%, 100% { transform: translateY(0) }
          50%      { transform: translateY(-6px) }
        }
        @keyframes name-anim-shake {
          0%, 100% { transform: translate(0, 0) }
          20%      { transform: translate(-2px, 1px) }
          40%      { transform: translate(2px, -1px) }
          60%      { transform: translate(-1px, 2px) }
          80%      { transform: translate(1px, -2px) }
        }
        @keyframes name-anim-swing {
          0%, 100% { transform: rotate(0deg) }
          25%      { transform: rotate(-8deg) }
          75%      { transform: rotate(8deg) }
        }
        @keyframes name-anim-tilt {
          0%, 100% { transform: rotate(-3deg) }
          50%      { transform: rotate(3deg) }
        }
        @keyframes name-anim-breathe {
          0%, 100% { transform: scale(1) }
          50%      { transform: scale(1.04) }
        }
        @keyframes name-anim-wobble {
          0%, 100% { transform: rotate(0deg) }
          25%      { transform: rotate(2.5deg) }
          75%      { transform: rotate(-2.5deg) }
        }
        @keyframes name-anim-spin {
          from { transform: rotate(0deg) }
          to   { transform: rotate(360deg) }
        }
        /* ★ v1.3.54: Tier badge animasyonları — mobile TierBadge ile parite */
        @keyframes tb-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1) }
          50%      { transform: translate(-50%, -50%) scale(1.15) }
        }
        @keyframes tb-breathe {
          0%, 100% { transform: translate(-50%, -50%) scale(1) }
          50%      { transform: translate(-50%, -50%) scale(1.06) }
        }
        @keyframes tb-float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0) }
          50%      { transform: translate(-50%, -50%) translateY(-4px) }
        }
        @keyframes tb-shake {
          0%, 100% { transform: translate(-50%, -50%) }
          20%      { transform: translate(calc(-50% - 2px), -50%) }
          40%      { transform: translate(calc(-50% + 2px), -50%) }
          60%      { transform: translate(calc(-50% - 1px), -50%) }
          80%      { transform: translate(calc(-50% + 1px), -50%) }
        }
        @keyframes tb-swing {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg) }
          25%      { transform: translate(-50%, -50%) rotate(-8deg) }
          75%      { transform: translate(-50%, -50%) rotate(8deg) }
        }
        @keyframes tb-tilt {
          0%, 100% { transform: translate(-50%, -50%) rotate(-3deg) }
          50%      { transform: translate(-50%, -50%) rotate(3deg) }
        }
        @keyframes tb-wobble {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg) }
          25%      { transform: translate(-50%, -50%) rotate(2.5deg) }
          75%      { transform: translate(-50%, -50%) rotate(-2.5deg) }
        }
        @keyframes tb-spin {
          from { transform: translate(-50%, -50%) rotate(0deg) }
          to   { transform: translate(-50%, -50%) rotate(360deg) }
        }
        @keyframes tb-glow-pulse {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 4px currentColor) }
          50%      { filter: brightness(1.2) drop-shadow(0 0 12px currentColor) }
        }
        @keyframes tb-hue {
          0%   { filter: hue-rotate(0deg) }
          100% { filter: hue-rotate(360deg) }
        }
        @keyframes name-glow-pulse {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 2px currentColor) }
          50%      { filter: brightness(1.3) drop-shadow(0 0 8px currentColor) drop-shadow(0 0 14px currentColor) }
        }
        /* ★ v1.3.60: APK shimmer parite — outer wrapper opacity 0.4 ↔ 1.0 pulse
           (Animated.View shimmerAnim ile birebir). */
        @keyframes name-shimmer-opacity {
          0%, 100% { opacity: 1 }
          50%      { opacity: 0.4 }
        }
        /* ★ v1.3.63: Tier badge shimmer — APK TierBadge.tsx ile birebir.
           opacity 0.85↔1, scale 1↔1.04, 1.6s ease-in-out × 2 (round-trip 3.2s).
           ★ v1.3.64: shimmer artık iç katmanda — outer wrapper static
           translate(-50%,-50%) scale(tier_badge_scale) ile büyütme/küçültme.
           Bu keyframe sadece scale + opacity (translate yok, çakışma engellendi). */
        @keyframes tier-badge-shimmer-inner {
          0%, 100% {
            transform: scale(1);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.04);
            opacity: 1;
          }
        }
        /* ★ v1.3.63: Glow halo pulse — APK glowPulseAnim 1↔1.4 brightness paritesi.
           Radial-gradient div opacity 0.7↔1.0 ile glow yoğunluğu nefes alır. */
        @keyframes glow-halo-pulse {
          0%, 100% { opacity: 0.7 }
          50%      { opacity: 1 }
        }
        /* ★ v1.3.63: Glow halo hue — color_cycle aktifken radial-gradient
           rengi sürekli döner. APK setCycleColor (setInterval HSL) ile parite. */
        @keyframes glow-halo-hue {
          0%   { filter: hue-rotate(0deg) }
          100% { filter: hue-rotate(360deg) }
        }
      `}</style>
    </div>
  );
}

/**
 * NamePreviewSvg — Avatar etrafında SVG textPath ile kullanıcı adı.
 * 4 şekil: flat (düz) / arc-top (yay yukarı) / arc-bottom (yay aşağı) / circle (dairesel).
 * Mobile karşılığı react-native-svg ile yapılır (post-launch).
 */
function NamePreviewSvg({ cfg, frameSize, stageCenter }: {
  cfg: FrameConfig;
  frameSize: number;
  stageCenter: number;
}) {
  const sampleName = 'Burak DENİZ'; // ★ v1.3.59: APK varsayılan kullanıcı (44burakdeniz) ile birebir karşılaştırma için
  // ★ v1.3.62 PARİTE FIX: APK NameOverlay `size` (frame size) tabanlı hesap kullanıyor.
  //   Eski `avatarSize` (frame × avatar_ratio) tabanı, avatar_ratio<1 değerlerde
  //   admin'de name'i KÜÇÜK gösteriyordu, APK'da BÜYÜK. Şimdi her ikisi frameSize tabanlı.
  //   APK: fontPx = (name_size/100) × size; offsetPx = (name_offset/100) × (size/2)
  const radiusBase = frameSize / 2;
  const offsetPx = (cfg.name_offset / 100) * radiusBase;
  const r = radiusBase + offsetPx;
  const fontPx = Math.max(8, (cfg.name_size / 100) * frameSize);
  const svgSize = (r + fontPx) * 2.4; // SVG canvas; rotation ve text overflow için bolca pay
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const fontWeight = cfg.name_bold ? 700 : 400;

  // Hangi konum baz alınacak (top/bottom/left/right) — circle hariç hepsinde tek nokta
  let pathD = '';
  let textAnchor: 'start' | 'middle' | 'end' = 'middle';
  switch (cfg.name_curve_style) {
    case 'arc-top':
      // Yay yukarı (gülen ağız): sol-üstten sağ-üste 180° yay
      pathD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
      break;
    case 'arc-bottom':
      // Yay aşağı (kaşıyan): sol-alttan sağ-alta 180° yay
      pathD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;
      break;
    case 'circle':
      // ★ v1.3.62 PARİTE: APK ile aynı — TOP'tan başla (12 yönü), saat yönünde tam daire.
      //   Eski LEFT (9 yönü) başlangıcı text'i yan döndürüyordu, APK üstten başlar.
      pathD = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
      break;
    case 'flat':
    default: {
      // Konuma göre düz çizgi — extension uzunluğu frameSize'a orantılı (parite)
      const len = frameSize * 1.6;
      const sideExt = frameSize * 0.5;
      switch (cfg.name_position) {
        case 'top':    pathD = `M ${cx - len / 2} ${cy - r} L ${cx + len / 2} ${cy - r}`; break;
        case 'bottom': pathD = `M ${cx - len / 2} ${cy + r + fontPx} L ${cx + len / 2} ${cy + r + fontPx}`; break;
        case 'left':   pathD = `M ${cx - r - sideExt} ${cy} L ${cx - r + sideExt} ${cy}`; textAnchor = 'end'; break;
        case 'right':  pathD = `M ${cx + r - sideExt} ${cy} L ${cx + r + sideExt} ${cy}`; textAnchor = 'start'; break;
      }
      break;
    }
  }

  // SVG'yi avatar merkezine konumla (translate -%50)
  const left = stageCenter - svgSize / 2;
  const top = stageCenter - svgSize / 2;
  // ID unique olmalı — birden fazla NamePreviewSvg render edilirse çakışmasın
  const uid = useId();
  const pathId = `name-path-${uid.replace(/:/g, '_')}`;

  // ★ İsim hareket animasyon zinciri — avatar/frame ile aynı palet.
  // Static rotation (eğim) ve dinamik animasyon transform'ları çakışmasın diye
  // animation'lar SVG wrapper'a, eğim base transform'a uygulanır.
  const nameAnimations = [
    cfg.name_pulse && `name-anim-pulse ${cfg.name_pulse_speed}s ease-in-out infinite`,
    cfg.name_float && `name-anim-float ${cfg.name_float_speed}s ease-in-out infinite`,
    cfg.name_shake && 'name-anim-shake 0.6s linear infinite',
    cfg.name_swing && 'name-anim-swing 2.5s ease-in-out infinite',
    cfg.name_tilt && 'name-anim-tilt 3s ease-in-out infinite',
    cfg.name_breathe && 'name-anim-breathe 4s ease-in-out infinite',
    cfg.name_wobble && 'name-anim-wobble 2s ease-in-out infinite',
    cfg.name_rotation_continuous && `name-anim-spin ${cfg.name_rotation_speed}s linear infinite`,
    // ★ v1.3.60: APK parite — shimmer için outer opacity pulse (APK Animated.View)
    cfg.name_shimmer && 'name-shimmer-opacity 2.4s ease-in-out infinite',
  ].filter(Boolean).join(', ') || undefined;

  return (
    <svg
      width={svgSize}
      height={svgSize}
      style={{
        position: 'absolute',
        left, top,
        zIndex: 6,
        pointerEvents: 'none',
        // Eğim ve sürekli dönme aynı transform'a yazılırsa biri diğerini
        // ezebilir. Burada eğim CSS transform üzerinden, hareket animasyonları
        // ayrı keyframes'le. CSS animation transform'u override eder, bu yüzden
        // sürekli dönme açıksa eğim'i animation 0% adımında ekledim.
        transform: cfg.name_rotation !== 0 && !cfg.name_rotation_continuous && !cfg.name_swing && !cfg.name_tilt && !cfg.name_wobble && !cfg.name_shake
          ? `rotate(${cfg.name_rotation}deg)`
          : undefined,
        transformOrigin: 'center',
        overflow: 'visible',
        opacity: cfg.name_opacity,
        animation: nameAnimations,
      }}
    >
      <defs>
        <path id={pathId} d={pathD} fill="none" />
        {/* ★ v1.3.63: name_shimmer linearGradient KALDIRILDI — fill'de
            kullanılmıyordu (ölü kod). APK MaskedView desteklemiyor; gerçek shimmer
            için outer wrapper opacity pulse yeterli (name-shimmer-opacity keyframes). */}
      </defs>
      <text
        fontSize={fontPx}
        fontWeight={fontWeight}
        fontFamily="Inter, system-ui, sans-serif"
        // ★ v1.3.60: APK parite — name_shimmer için linearGradient mask fill
        //   yerine düz renk + outer wrapper opacity pulse (APK Animated.View opacity
        //   yapısı). Gradient text RN'de yok, web admin önizleme APK'yı simüle eder.
        fill={cfg.name_color}
        style={{
          // ★ v1.3.60: APK parite — tek katman text-shadow (RN textShadow tek katman
          //   destekler). Eski 3 katman (outline + glow + outer) APK'da imkansız;
          //   tek shadow radius (14+intensity*18) ile APK formülü.
          textShadow: cfg.name_glow
            ? `0 1px 1px rgba(0,0,0,0.7), 0 0 ${14 + cfg.name_glow_intensity * 18}px ${cfg.name_glow_color}`
            : '0 1px 1px rgba(0,0,0,0.7)',
          paintOrder: 'stroke',
          stroke: 'rgba(0,0,0,0.4)',
          strokeWidth: 1,
          animation: [
            cfg.name_glow && cfg.name_glow_pulse && 'name-glow-pulse 1.8s ease-in-out infinite',
            cfg.name_color_cycle && `name-color-cycle ${cfg.color_cycle_speed}s linear infinite`,
          ].filter(Boolean).join(', ') || undefined,
        }}
      >
        {cfg.name_wave && cfg.name_curve_style === 'flat' ? (
          // Wave: harf-harf animation (sadece düz çizgide; yay/dairesel'de
          // dy ofseti SVG textPath ile karışıyor, kapatıyoruz)
          <textPath href={`#${pathId}`} startOffset="50%" textAnchor={textAnchor}>
            {sampleName.split('').map((ch, i) => (
              <tspan
                key={i}
                style={{
                  animation: `name-wave 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.08}s`,
                  display: 'inline-block',
                }}
              >
                {ch}
              </tspan>
            ))}
          </textPath>
        ) : (
          <textPath href={`#${pathId}`} startOffset="50%" textAnchor={textAnchor}>
            {sampleName}
          </textPath>
        )}
      </text>
    </svg>
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
