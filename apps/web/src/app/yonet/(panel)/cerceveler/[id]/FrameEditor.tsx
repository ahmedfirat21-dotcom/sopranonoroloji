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
  name_offset: number;          // 0-40 px ek mesafe avatar kenarından
  name_rotation: number;        // -45 → 45 derece eğim
  name_curve_style: 'flat' | 'arc-top' | 'arc-bottom' | 'circle';
  name_color: string;
  name_size: number;            // px (10-22)
  name_bold: boolean;
  // ★ Tier etiketi (Plus/Pro/Free badge)
  tier_badge_enabled: boolean;
  tier_badge_position: 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br'; // 8 nokta
  tier_badge_style: 'chip' | 'capsule' | 'star' | 'ribbon';
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
  name_offset: 12,
  name_rotation: 0,
  name_curve_style: 'flat',
  name_color: '#f8fafc',
  name_size: 14,
  name_bold: true,
  tier_badge_enabled: false,
  tier_badge_position: 'tr',
  tier_badge_style: 'chip',
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
};

// Tier badge konum koordinatları — avatar merkezine göre yüzdelik (-1...1)
const BADGE_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  tl: { x: -0.5, y: -0.5, label: '↖ Sol-Üst' },
  tc: { x: 0,    y: -0.55, label: '↑ Üst' },
  tr: { x: 0.5,  y: -0.5, label: '↗ Sağ-Üst' },
  ml: { x: -0.55, y: 0,   label: '← Sol' },
  mr: { x: 0.55, y: 0,    label: '→ Sağ' },
  bl: { x: -0.5, y: 0.5,  label: '↙ Sol-Alt' },
  bc: { x: 0,    y: 0.55, label: '↓ Alt' },
  br: { x: 0.5,  y: 0.5,  label: '↘ Sağ-Alt' },
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

          {/* Avatar — merkezi, sabit boyutta. Pulse/float animation transform üzerinden,
              glow_pulse keyframes ile boxShadow yoğunluğunu dalgalandırır. */}
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
              animation: [
                cfg.avatar_pulse && `avatar-pulse ${cfg.avatar_pulse_speed}s ease-in-out infinite`,
                cfg.avatar_float && `avatar-float ${cfg.avatar_float_speed}s ease-in-out infinite`,
                cfg.avatar_shake && `avatar-shake 0.6s linear infinite`,
                cfg.avatar_swing && `avatar-swing 2.5s ease-in-out infinite`,
                cfg.avatar_tilt && `avatar-tilt 3s ease-in-out infinite`,
                cfg.glow_enabled && cfg.glow_pulse && `glow-pulse ${cfg.avatar_pulse_speed * 1.5}s ease-in-out infinite`,
                cfg.glow_enabled && cfg.color_cycle && `glow-color-cycle ${cfg.color_cycle_speed}s linear infinite`,
              ].filter(Boolean).join(', ') || undefined,
            }}
          >
            <img src={SAMPLE_AVATAR} alt="" className="w-full h-full object-cover" />
          </div>

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
            const particleSize = Math.max(14, Math.round(avatarSize * 0.18));
            // Yörünge mesafesi — avatar yarıçapı + dışında en az 20px boşluk
            // (frame_pulse_ring radar dalgalarıyla uyumlu)
            const orbitRadius = avatarSize / 2 + Math.max(20, particleSize * 0.4);
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
              frame_breathe ile yavaş büyüyüp küçülür (rotation ile birlikte çalışabilir). */}
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
                animation: [
                  cfg.frame_rotation > 0 && `frame-spin ${cfg.frame_rotation}s linear infinite`,
                  cfg.frame_breathe && `frame-breathe 4s ease-in-out infinite`,
                  cfg.frame_wobble && `frame-wobble 2s ease-in-out infinite`,
                  cfg.color_cycle && `color-cycle ${cfg.color_cycle_speed}s linear infinite`,
                ].filter(Boolean).join(', ') || undefined,
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              <Lottie animationData={lottieData} loop autoplay speed={cfg.lottie_speed}
                style={{ width: '100%', height: '100%' }} />
            </div>
          )}
          {/* ★ PNG/JPG/SVG asset — Lottie değilse direkt Image render
                Hue/brightness/saturation/breathe/rotation animasyonları PNG'lere de uygulanır. */}
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
                animation: [
                  cfg.frame_rotation > 0 && `frame-spin ${cfg.frame_rotation}s linear infinite`,
                  cfg.frame_breathe && `frame-breathe 4s ease-in-out infinite`,
                  cfg.frame_wobble && `frame-wobble 2s ease-in-out infinite`,
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
          {/* ★ Frame shimmer — üzerinden ışık süpürmesi geçer */}
          {cfg.frame_shimmer && (lottieData || imageUrl) && (
            <div
              style={{
                position: 'absolute',
                left: stageCenter - frameContainerSize / 2 + cfg.frame_offset_x * mobileSize,
                top: stageCenter - frameContainerSize / 2 + cfg.frame_offset_y * mobileSize,
                width: frameContainerSize,
                height: frameContainerSize,
                borderRadius: '50%',
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 4,
                background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
                animation: 'frame-shimmer 2.5s linear infinite',
                mixBlendMode: 'overlay',
              }}
            />
          )}

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

          {/* ★ Kullanıcı Adı — SVG textPath ile düz/yay/dairesel render */}
          {cfg.name_enabled && (
            <NamePreviewSvg
              cfg={cfg}
              avatarSize={avatarSize}
              stageCenter={stageCenter}
            />
          )}

          {/* ★ Tier Badge — 8 noktada konumlanan rozet */}
          {cfg.tier_badge_enabled && (() => {
            const pos = BADGE_POSITIONS[cfg.tier_badge_position];
            const badgeX = stageCenter + pos.x * avatarSize;
            const badgeY = stageCenter + pos.y * avatarSize;
            const styleClass = cfg.tier_badge_style;
            const radius = styleClass === 'capsule' ? 999 : styleClass === 'chip' ? 6 : 0;
            const isStar = styleClass === 'star';
            const isRibbon = styleClass === 'ribbon';
            return (
              <div
                style={{
                  position: 'absolute',
                  left: badgeX,
                  top: badgeY,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 5,
                  pointerEvents: 'none',
                }}
              >
                {isStar ? (
                  <div style={{
                    width: 32, height: 32,
                    background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#000', fontWeight: 900, fontSize: 9,
                    boxShadow: '0 0 12px rgba(251,191,36,0.6)',
                  }}>PRO</div>
                ) : isRibbon ? (
                  <div style={{
                    background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                    color: '#0a0f1a', padding: '3px 14px',
                    fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                    clipPath: 'polygon(0 0, 100% 0, 95% 50%, 100% 100%, 0 100%, 5% 50%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}>PRO</div>
                ) : (
                  <div style={{
                    background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                    color: '#0a0f1a',
                    padding: '3px 10px',
                    fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                    borderRadius: radius,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(251,191,36,0.6)',
                  }}>PRO</div>
                )}
              </div>
            );
          })()}
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
            <p className="text-[10px] text-slate-500">Glow nefes için yukarıdaki Glow aktif olmalı.</p>
            <Toggle label="Shimmer (üzerinden ışık süpürmesi)" checked={cfg.frame_shimmer} onChange={v => update('frame_shimmer', v)} />
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
                <Slider label="Mesafe" min={0} max={40} step={2} value={cfg.name_offset} onChange={v => update('name_offset', v)} display={`${cfg.name_offset}px`} />
                <Slider label="Eğim" min={-45} max={45} step={5} value={cfg.name_rotation} onChange={v => update('name_rotation', v)} display={`${cfg.name_rotation}°`} />
                <Slider label="Boyut" min={10} max={22} step={1} value={cfg.name_size} onChange={v => update('name_size', v)} display={`${cfg.name_size}px`} />
                <ColorInput label="Renk" value={cfg.name_color} onChange={v => update('name_color', v)} />
                <Toggle label="Kalın yazı" checked={cfg.name_bold} onChange={v => update('name_bold', v)} />
                <div className="pt-2 border-t border-slate-700/40">
                  <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">İsim Animasyonu</div>
                  <Toggle label="Glow (yazı parlar)" checked={cfg.name_glow} onChange={v => update('name_glow', v)} />
                  <Toggle label="Wave (harf-harf dalga)" checked={cfg.name_wave} onChange={v => update('name_wave', v)} />
                  <Toggle label="Shimmer (üstünden ışık geçer)" checked={cfg.name_shimmer} onChange={v => update('name_shimmer', v)} />
                  <Toggle label="🌈 Renk döngüsü (yazı rengi döner)" checked={cfg.name_color_cycle} onChange={v => update('name_color_cycle', v)} />
                </div>
              </>
            )}
          </SubBlock>
          <SubBlock title="Tier Etiketi (Plus / Pro)">
            <Toggle label="Tier rozetini göster" checked={cfg.tier_badge_enabled} onChange={v => update('tier_badge_enabled', v)} />
            {cfg.tier_badge_enabled && (
              <>
                <label className="block">
                  <div className="text-xs text-slate-400 mb-1">Konum</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['tl','tc','tr','ml','mr','bl','bc','br'] as const).map(p => {
                      // ortadaki center kutucuğu boş — sadece avatar
                      if (p === 'mr') {
                        return (
                          <React.Fragment key={p}>
                            <button
                              type="button"
                              onClick={() => update('tier_badge_position', 'ml')}
                              className={`px-2 py-1.5 text-[10px] rounded border ${cfg.tier_badge_position === 'ml' ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                              title={BADGE_POSITIONS.ml.label}
                            >{BADGE_POSITIONS.ml.label}</button>
                            <div className="px-2 py-1.5 text-[10px] rounded border border-dashed border-slate-700 text-slate-600 text-center">●</div>
                            <button
                              type="button"
                              onClick={() => update('tier_badge_position', 'mr')}
                              className={`px-2 py-1.5 text-[10px] rounded border ${cfg.tier_badge_position === 'mr' ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                              title={BADGE_POSITIONS.mr.label}
                            >{BADGE_POSITIONS.mr.label}</button>
                          </React.Fragment>
                        );
                      }
                      if (p === 'ml') return null; // ml zaten yukarıdaki Fragment'te render edildi
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => update('tier_badge_position', p)}
                          className={`px-2 py-1.5 text-[10px] rounded border ${cfg.tier_badge_position === p ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                          title={BADGE_POSITIONS[p].label}
                        >
                          {BADGE_POSITIONS[p].label}
                        </button>
                      );
                    })}
                  </div>
                </label>
                <label className="block">
                  <div className="text-xs text-slate-400 mb-1">Stil</div>
                  <select
                    value={cfg.tier_badge_style}
                    onChange={e => update('tier_badge_style', e.target.value as FrameConfig['tier_badge_style'])}
                    aria-label="Tier rozeti stili"
                    className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs"
                  >
                    <option value="chip">Chip (yuvarlak köşeli)</option>
                    <option value="capsule">Kapsül (full-rounded)</option>
                    <option value="star">Yıldız (5 köşeli)</option>
                    <option value="ribbon">Şerit (askılı)</option>
                  </select>
                </label>
              </>
            )}
          </SubBlock>
          <p className="text-[10px] text-cyan-300/70 leading-relaxed">
            💡 Önizleme örnek isim ve örnek tier ile gösterir. Mobilde gerçek kullanıcı adı + gerçek tier yansır.
          </p>
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
      `}</style>
    </div>
  );
}

/**
 * NamePreviewSvg — Avatar etrafında SVG textPath ile kullanıcı adı.
 * 4 şekil: flat (düz) / arc-top (yay yukarı) / arc-bottom (yay aşağı) / circle (dairesel).
 * Mobile karşılığı react-native-svg ile yapılır (post-launch).
 */
function NamePreviewSvg({ cfg, avatarSize, stageCenter }: {
  cfg: FrameConfig;
  avatarSize: number;
  stageCenter: number;
}) {
  const sampleName = 'Murat Berxo'; // önizleme örneği — mobilde gerçek user.display_name
  const r = avatarSize / 2 + cfg.name_offset;
  const svgSize = (r + cfg.name_size) * 2.4; // SVG canvas; rotation ve text overflow için bolca pay
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
      // Tam daire — saat 9 yönünden başla, saat yönünde
      pathD = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`;
      break;
    case 'flat':
    default: {
      // Konuma göre düz çizgi
      const len = avatarSize + 80;
      switch (cfg.name_position) {
        case 'top':    pathD = `M ${cx - len / 2} ${cy - r} L ${cx + len / 2} ${cy - r}`; break;
        case 'bottom': pathD = `M ${cx - len / 2} ${cy + r + cfg.name_size} L ${cx + len / 2} ${cy + r + cfg.name_size}`; break;
        case 'left':   pathD = `M ${cx - r - 60} ${cy} L ${cx - r + 60} ${cy}`; textAnchor = 'end'; break;
        case 'right':  pathD = `M ${cx + r - 60} ${cy} L ${cx + r + 60} ${cy}`; textAnchor = 'start'; break;
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

  return (
    <svg
      width={svgSize}
      height={svgSize}
      style={{
        position: 'absolute',
        left, top,
        zIndex: 6,
        pointerEvents: 'none',
        transform: cfg.name_rotation !== 0 ? `rotate(${cfg.name_rotation}deg)` : undefined,
        transformOrigin: 'center',
        overflow: 'visible',
      }}
    >
      <defs>
        <path id={pathId} d={pathD} fill="none" />
        {cfg.name_shimmer && (
          <linearGradient id={`shimmer-${pathId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={cfg.name_color} stopOpacity="0.6" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor={cfg.name_color} stopOpacity="0.6" />
            <animate
              attributeName="x1"
              values="-100%;100%"
              dur="2.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              values="0%;200%"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </linearGradient>
        )}
      </defs>
      <text
        fontSize={cfg.name_size}
        fontWeight={fontWeight}
        fontFamily="Inter, system-ui, sans-serif"
        fill={cfg.name_shimmer ? `url(#shimmer-${pathId})` : cfg.name_color}
        style={{
          textShadow: '0 1px 3px rgba(0,0,0,0.7)',
          paintOrder: 'stroke',
          stroke: 'rgba(0,0,0,0.4)',
          strokeWidth: 1,
          animation: [
            cfg.name_glow && 'name-glow 2s ease-in-out infinite',
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
