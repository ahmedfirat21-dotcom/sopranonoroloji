"use client";
/* eslint-disable react/forbid-component-props */
// ★ Inline style'lar bu dosyada zorunlu — admin slider/renk/toggle değişikliği
//   dinamik render gerektirir, StyleSheet'e taşınamaz.
import React from 'react';
import { Crown, Mic, MicOff, Video, VideoOff, Hand, Bell, ChevronDown, Users, BarChart3, MessageCircle, Volume2, Mail, Gift, Plus } from 'lucide-react';
import type { RoomLayoutConfig, AvatarShape, CornerPosition } from './types';

/**
 * Oda Önizleme — APK paritesi (v286, 16 May 2026)
 * ══════════════════════════════════════════════════════════════════
 * Hedef: app/room/[id].tsx + RoomInfoHeader + SpeakerSection +
 * ListenerGrid + RoomControlBar görsel kompozisyonunu birebir kopyala.
 *
 * Yalnızca admin panelinde gerçekten kullanılabilir alanlar dinamik
 * render edilir (host/speakers/listeners avatar şekli + radius,
 * listener ring/name/ownerCrown, accents.ownerHighlight, header title +
 * listenerCount + bg opacity + border, controls buttonSize/iconSize/
 * iconColor, global.horizontalPadding). Geri kalan default sabit.
 */

const PREVIEW_W = 320; // mobile 360dp ekran simulation, %89 scale
const DEFAULT_SPEAKER_COUNT = 1; // APK default: sadece host
const DEFAULT_LISTENER_COUNT = 6;

function shapeRadius(shape: AvatarShape, size: number, cfgRadius: number) {
  switch (shape) {
    case 'circle':  return size / 2;
    case 'square':  return 0;
    case 'rounded': return Math.min(cfgRadius, size / 2);
    case 'hex':     return size / 2;
    default:        return size / 2;
  }
}

function getSpeakerMetrics(count: number, W: number, cfg: RoomLayoutConfig['speakers']) {
  const availableW = W - 32;
  const p = cfg.sizePresets;
  // ★ v1.7.13.27 (19 May 2026): Eski hardcoded col cap'leri (3,3,3,4,5) ve
  //   1-kişi maxSize=110 admin slider'ını eziyordu. Şimdi admin maxCols ve
  //   tüm sizePresets sınırlar arasında ETKİN; preview kullanıcı değerini yansıtır.
  let cols: number, maxSize: number;
  if (count <= 1)      { cols = 1;                              maxSize = p.large; }
  else if (count <= 3) { cols = Math.min(count, cfg.maxCols);   maxSize = p.large; }
  else if (count <= 6) { cols = Math.min(3,     cfg.maxCols);   maxSize = p.medium; }
  else if (count <= 9) { cols = Math.min(3,     cfg.maxCols);   maxSize = Math.round(p.medium * 0.92); }
  else if (count <= 12){ cols = Math.min(4,     cfg.maxCols);   maxSize = p.small; }
  else                 { cols = Math.min(5,     cfg.maxCols);   maxSize = Math.round(p.small * 0.9); }
  // Eski Math.min(3, maxCols) yerine count-cap'i kullan — 1 kişide 1 col, 2'de 2 col vs.
  // 4+ kişi için 3'ten fazla col mantıklı değil (avatar çok küçülür) ama admin
  // maxCols=6 yaparsa 4 kişi için min(4, 6) = 4 col gösterelim.
  if (count >= 2 && count <= 6) cols = Math.min(count, cfg.maxCols);
  const gap = cfg.colGap;
  const calc = Math.floor((availableW - gap * (cols - 1)) / cols);
  const cardW = Math.min(calc, maxSize);
  return { cols, cardW, gap };
}

function getListenerMetrics(count: number, W: number, cfg: RoomLayoutConfig['listeners']) {
  const p = cfg.sizePresets;
  // ★ v1.7.13.27: maxCols+1 / +2 magic adder kaldırıldı → admin maxCols slider
  //   doğrudan etkin. Eskiden 6 maxCols ayarlasan preview 7-8 col gösteriyordu.
  let cols: number, maxSize: number;
  if (count <= 4)       { cols = Math.min(count, cfg.maxCols); maxSize = p.large; }
  else if (count <= 8)  { cols = Math.min(6, cfg.maxCols);     maxSize = p.medium; }
  else if (count <= 15) { cols = Math.min(7, cfg.maxCols);     maxSize = Math.round(p.medium * 0.95); }
  else                  { cols = Math.min(8, cfg.maxCols);     maxSize = p.small; }
  const gap = cfg.colGap;
  const cellW = Math.floor((W - 32 - gap * (cols - 1)) / cols);
  const calc = Math.max(32, cellW - (count <= 8 ? 10 : count <= 15 ? 8 : 5));
  const avSize = Math.min(calc, maxSize);
  return { cols, gap, cellW, avSize };
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex?.startsWith('#') || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function RoomPreview({ cfg, speakerCount = DEFAULT_SPEAKER_COUNT, listenerCount = DEFAULT_LISTENER_COUNT, cameraCount = 0 }:
  { cfg: RoomLayoutConfig; speakerCount?: number; listenerCount?: number; cameraCount?: number }) {
  const sM = getSpeakerMetrics(speakerCount, PREVIEW_W, cfg.speakers);
  const lM = getListenerMetrics(listenerCount, PREVIEW_W, cfg.listeners);
  // ★ v301 (18 May 2026): Camera mock — ilk `cameraCount` konuşmacının kamerası açık.
  //   Spotlight aktifse kameralılar üstte rectangular tile olarak render edilir, audio
  //   only altta küçük circle. SpeakerSection.tsx hibrit pattern'ı ile birebir.
  const camCount = Math.min(cameraCount, speakerCount);
  const showSpotlight = cfg.camera.spotlightEnabled && camCount > 0;

  // APK default arka plan: room_in_bg gradient
  const bgStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(180deg, rgba(20,40,70,0.92), rgba(10,20,35,0.95))',
  };

  return (
    <div
      className="mx-auto rounded-2xl border border-slate-700/40 overflow-hidden relative shadow-2xl"
      style={{ width: PREVIEW_W, height: 680, ...bgStyle }}
    >
      {/* Safe top */}
      <div style={{ height: cfg.global.safePaddingTop }} />

      {/* ════════ HEADER (APK: RoomInfoHeader) ════════ */}
      <PreviewHeader cfg={cfg} totalCount={speakerCount + listenerCount} />

      {/* ════════ STAGE ════════ */}
      <div
        style={{
          paddingLeft: cfg.global.horizontalPadding,
          paddingRight: cfg.global.horizontalPadding,
          paddingTop: 16,
        }}
      >
        {/* ★ v301: Spotlight aktif + kamera var → kameralılar üstte rectangular */}
        {showSpotlight && <CameraSpotlightGrid cfg={cfg} camCount={camCount} W={PREVIEW_W - cfg.global.horizontalPadding * 2} />}

        {/* Speaker grid (audio-only veya spotlight kapalı tüm konuşmacılar) */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${sM.cols}, 1fr)`,
            gap: `${cfg.speakers.rowGap}px ${cfg.speakers.colGap}px`,
            justifyItems: 'center',
            marginBottom: speakerCount === 0 ? 0 : 12,
            marginTop: showSpotlight ? 8 : 0,
          }}
        >
          {speakerCount === 0 ? (
            <EmptyStage />
          ) : (
            Array.from({ length: speakerCount }).map((_, i) => {
              // Spotlight aktifse kameralılar zaten yukarıda — sadece audio-only'ler bu grid'de.
              if (showSpotlight && i < camCount) return null;
              return (
                <SpeakerTile
                  key={i}
                  size={sM.cardW}
                  cfg={cfg}
                  isOwner={i === 0}
                  isMod={i === 3} /* ★ v289: 4. konuşmacı mod → mor halka */
                  speaking={i === 1}
                  muted={i === 2}
                  withCamera={!showSpotlight && i < camCount}
                  isSoloSpeaker={speakerCount === 1}
                />
              );
            })
          )}
        </div>

        {/* ★ v289 (16 May 2026): Stage divider — admin'in stage.dividerStyle/Color */}
        {listenerCount > 0 && <StageDividerLine cfg={cfg} />}

        {/* Listener grid
            ★ v1.7.13.27 (19 May 2026): stage.gapBetweenSpeakersAndListeners admin
            slider'ı önizlemeye bağlandı. Eskiden hardcoded mt-3 (12px) idi; admin
            değerini değiştirsen önizleme reaksiyon vermiyordu. APK ile birebir aynı. */}
        {listenerCount > 0 && (() => {
          const max = cfg.listeners_advanced.maxVisibleDefault;
          const shown = Math.min(listenerCount, max);
          const overflow = Math.max(0, listenerCount - max);
          const stageGap = Math.max(8, cfg.stage.gapBetweenSpeakersAndListeners ?? 20);
          return (
            <div
              className="grid"
              style={{
                marginTop: stageGap,
                gridTemplateColumns: `repeat(${lM.cols}, 1fr)`,
                gap: `${cfg.listeners.rowGap}px ${cfg.listeners.colGap}px`,
                justifyItems: 'center',
              }}
            >
              {Array.from({ length: shown }).map((_, i) => (
                <ListenerTile
                  key={i}
                  size={lM.avSize}
                  cfg={cfg}
                  isOwner={i === 0} /* ★ v289: ilk listener owner (crown + highlight) */
                  handRaised={i === 2} /* ★ v289: 3. listener el kaldırmış */
                />
              ))}
              {overflow > 0 && <OverflowBadge cfg={cfg} count={overflow} />}
            </div>
          );
        })()}
      </div>

      {/* Sahneye Çık CTA — APK'da host olmayanlar için görünür */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none"
        style={{ bottom: 64 + cfg.global.safePaddingBottom }}
      >
        <div
          className="px-5 py-2 rounded-full text-xs font-semibold flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, rgba(20,184,166,0.85), rgba(13,148,136,0.85))',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(20,184,166,0.35)',
          }}
        >
          <Mic style={{ width: 12, height: 12 }} />
          Sahneye Çık
        </div>
      </div>

      {/* ════════ CONTROL BAR (APK: RoomControlBar) ════════ */}
      <PreviewControlBar cfg={cfg} />
    </div>
  );
}

/* ══════════════ HEADER ══════════════
 * APK: RoomInfoHeader.tsx — host avatar (sol) + room name + duration
 * (orta) + viewer count + signal + bell + chevron (sağ) */
function PreviewHeader({ cfg, totalCount }: { cfg: RoomLayoutConfig; totalCount: number }) {
  const h = cfg.header;
  return (
    <div
      className="px-3 pt-2 pb-2.5 flex items-center gap-2 relative"
      style={{
        background: 'linear-gradient(180deg, rgba(48,65,94,0.92) 0%, rgba(26,40,64,0.82) 55%, rgba(12,22,40,0.6) 100%)',
        opacity: h.headerBgOpacity > 0 ? h.headerBgOpacity : 1,
      }}
    >
      {/* Sol: host avatar — v300 dinamik (showHostAvatar / size / borderWidth / borderColor) */}
      {h.showHostAvatar !== false && (
        <div
          className="rounded-full shrink-0 relative"
          style={{
            width: h.hostAvatarSize ?? 36,
            height: h.hostAvatarSize ?? 36,
            background: 'linear-gradient(135deg, #fbbf24, #b45309)',
            border: `${h.hostAvatarBorderWidth ?? 1.5}px solid ${h.hostAvatarBorderColor ?? 'rgba(20,184,166,0.55)'}`,
          }}
        />
      )}
      {/* Orta: room name + duration */}
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{
            fontSize: h.titleFontSize,
            fontWeight: h.titleFontWeight as any,
            color: h.titleColor,
            lineHeight: 1.15,
          }}
        >
          Burak'in Odası
        </div>
        <div className="flex items-center gap-1.5 mt-0.5" style={{ color: 'rgba(148,163,184,0.85)', fontSize: 9 }}>
          <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="rgba(20,184,166,0.7)" strokeWidth="2.4">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
          <span>0 dk</span>
        </div>
      </div>
      {/* Sağ: viewer count + signal + bell + chevron */}
      {h.showListenerCount && (
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(20,184,166,0.12)',
            border: '1px solid rgba(20,184,166,0.30)',
          }}
        >
          <span className="block w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
          <Users style={{ width: 10, height: 10, color: '#5EEAD4' }} />
          <span style={{ fontSize: 10, color: '#5EEAD4', fontWeight: 700 }}>{totalCount}</span>
        </div>
      )}
      <BarChart3 style={{ width: 14, height: 14, color: '#10B981' }} />
      <Bell style={{ width: 14, height: 14, color: '#94A3B8' }} />
      <ChevronDown style={{ width: 14, height: 14, color: '#94A3B8' }} />

      {/* Alt çizgi */}
      {h.headerBorderBottom && (
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${h.headerBorderColor}, ${h.headerBorderColor}, transparent)`,
          }}
        />
      )}
    </div>
  );
}

/* ══════════════ EMPTY STAGE — APK "Sahne boş" mesajı ══════════════ */
function EmptyStage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 col-span-full" style={{ opacity: 0.45 }}>
      <div
        className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center mb-2"
        style={{ borderColor: 'rgba(94,234,212,0.4)' }}
      >
        <Mic style={{ width: 18, height: 18, color: 'rgba(94,234,212,0.6)' }} />
      </div>
      <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)' }}>Sahne boş</div>
    </div>
  );
}

/* ══════════════ SPEAKER TILE — APK SpeakerSection ══════════════
 * ★ v289 (16 May 2026): host.avatarSize + halo (haloEnabled/Color/Opacity/Blur)
 * + speakers.nameFontSize + nameMaxChars + shadows (host/speaker) + isMod halka
 * (accents.moderatorHighlight) + online dot (indicators.onlineDot*) preview'e
 * bağlandı. Önceden bu 12+ alan slider'ı değiştirse de yansımıyordu. */
function SpeakerTile({ size, cfg, isOwner, speaking, muted, isMod, withCamera, isSoloSpeaker }:
  { size: number; cfg: RoomLayoutConfig; isOwner: boolean; speaking: boolean; muted: boolean; isMod?: boolean; withCamera?: boolean; isSoloSpeaker?: boolean }) {
  const sp = cfg.speakers;
  const host = cfg.host;
  const acc = cfg.accents;
  const sh = cfg.shadows;
  const ind = cfg.indicators;
  const cam = cfg.camera;
  const shape = isOwner ? host.avatarShape : sp.avatarShape;
  const radiusCfg = isOwner ? host.borderRadius : sp.borderRadius;
  // ★ v289: Host için avatarSize override (admin'in Boyut slider'ı)
  // ★ v309 (18 May 2026) FIX: Host avatarSize sadece host TEK BAŞINA sahnedeyse uygulanır.
  //   Çoklu konuşmacıda host büyütülürse grid hesabı (size'a göre) ile container width
  //   (renderSize) uyumsuz olur → tile'lar sağdan taşar. APK'da useHostSize benzer mantık.
  const renderSize = (isOwner && isSoloSpeaker) ? Math.min(host.avatarSize, size + 40) : size;
  // ★ v291 (16 May 2026): Host için admin halka (host.ringWidth/ringColor) artık etkin.
  //   Önce sabit 2dp altın halka idi (kullanıcı kararı v283), şimdi admin'e geri geldi.
  // ★ v301 (18 May 2026): withCamera + cam.useCustomBorder ise audio border'ı override et.
  const audioRingW = isMod ? Math.max(2, sp.ringWidth) : (isOwner ? host.ringWidth : sp.ringWidth);
  const audioRingColor = isMod
    ? acc.moderatorHighlight
    : isOwner ? (host.ringColor || acc.ownerHighlight) : (speaking ? sp.speakingRingColor : sp.ringColor);
  const ringW = withCamera && cam.useCustomBorder ? cam.borderWidth : audioRingW;
  const ringColor = withCamera && cam.useCustomBorder ? cam.borderColor : audioRingColor;
  // ★ v301: Kameralı tile → cam.cornerRadius (% + min), audio → shapeRadius normal
  const camRadius = Math.max(cam.cornerRadiusMin, Math.floor(renderSize * cam.cornerRadiusPercent / 100));
  const radius = withCamera ? camRadius : shapeRadius(shape, renderSize, radiusCfg);
  // ★ v301: Kameralı tile dikdörtgen — height = width * heightRatio
  const tileH = withCamera ? Math.round(renderSize * cam.heightRatio) : renderSize;
  // ★ v289: Shadows (Skia) — host vs speaker ayrı config
  const shadowOpacity = isOwner ? host.haloOpacity * 0.6 : 0;
  const shadowColor = isOwner ? host.haloColor : '#000';
  // Box-shadow string: halo (host) + Skia shadow (host/speaker)
  const haloShadow = (isOwner && host.haloEnabled)
    ? `0 0 ${host.haloBlur}px ${hexToRgba(host.haloColor, host.haloOpacity)}`
    : '';
  const skiaShadow = isOwner
    ? `0 0 ${sh.hostShadowBlur}px ${hexToRgba(sh.hostShadowColor, sh.hostShadowOpacity)}`
    : (sh.speakerShadowEnabled
        ? `0 0 ${sh.speakerShadowBlur}px ${hexToRgba(sh.speakerShadowColor, sh.speakerShadowOpacity)}`
        : '');
  const combinedShadow = [haloShadow, skiaShadow].filter(Boolean).join(', ');
  // ★ v309 (18 May 2026): Host config'inin tüm field'ları preview'a bağlandı:
  //   - host.namePosition (önceden sp.namePosition zorla kullanılıyordu, host
  //     için override yoktu)
  //   - host.nameFontSize (önceden sp.nameFontSize)
  //   - host.nameFontWeight (yeni)
  //   - host.nameColor (yeni — eski sadece acc.ownerHighlight'tan geliyordu)
  //   - host.ringStyle (border-style, yeni)
  //   - host.containerPadding (wrapper padding, yeni)
  const nameFontSize = isOwner ? (host.nameFontSize || 14) : (sp.nameFontSize || 11);
  const nameFontWeight = isOwner ? (host.nameFontWeight || '700') : '700';
  const fullName = isOwner ? 'Burak DENİZ' : (isMod ? 'Moderatör Ali' : 'Konuş.');
  const nameMaxChars = isOwner ? 0 : sp.nameMaxChars;
  const displayName = nameMaxChars > 0 ? fullName.slice(0, nameMaxChars) : fullName;
  const pos = isOwner ? (host.namePosition || 'below') : (sp.namePosition || 'below');
  const nameColor = isOwner
    ? (host.nameColor || acc.ownerHighlight)
    : (isMod ? acc.moderatorHighlight : '#e2e8f0');
  // host.ringStyle (solid/dashed/dotted/none) sadece host için. Speakers ringStyle yok.
  const borderStyle = isOwner && host.ringStyle && host.ringStyle !== 'none' ? host.ringStyle : 'solid';
  const nameEl = pos === 'hidden' ? null : (
    <div
      className="text-center truncate"
      style={{
        fontSize: nameFontSize,
        fontWeight: nameFontWeight as any,
        color: nameColor,
        maxWidth: renderSize,
        marginTop: pos === 'below' ? 6 : 0,
        marginBottom: pos === 'above' ? 6 : 0,
        ...(pos === 'inside' ? {
          position: 'absolute', bottom: 4, left: 0, right: 0,
          background: 'rgba(0,0,0,0.45)', borderRadius: 4, padding: '1px 4px',
        } : {}),
      }}
    >
      {displayName}
    </div>
  );

  return (
    <div className="relative flex flex-col items-center" style={{ width: Math.max(size, renderSize) }}>
      {/* ★ v289: namePosition='above' isim avatardan ÖNCE */}
      {pos === 'above' && nameEl}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          width: renderSize,
          height: tileH,
          borderRadius: radius,
          background: withCamera
            ? 'linear-gradient(135deg, #0f766e, #134e4a)'
            : 'linear-gradient(135deg, #475569, #1e293b)',
          // ★ v309 (18 May 2026): host.ringStyle artık etkin (solid/dashed/dotted)
          border: ringW > 0 ? `${ringW}px ${borderStyle} ${ringColor}` : 'none',
          boxShadow: combinedShadow || 'none',
          opacity: muted ? sp.muteOpacity : 1,
          padding: isOwner ? Math.max(0, Math.min(20, host.containerPadding || 0)) : 0,
        }}
      >
        {/* ★ v301: Kamera mock — "VIDEO" simgesi + gradient overlay */}
        {withCamera && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <Video style={{ width: Math.min(28, renderSize * 0.3), height: Math.min(28, renderSize * 0.3), color: 'rgba(255,255,255,0.55)' }} />
            </div>
            {cam.overlayTopOpacity > 0 && (
              <div
                className="absolute left-0 right-0 top-0 pointer-events-none"
                style={{ height: '35%', background: `linear-gradient(180deg, rgba(0,0,0,${cam.overlayTopOpacity}), transparent)` }}
              />
            )}
            {cam.overlayBottomOpacity > 0 && (
              <div
                className="absolute left-0 right-0 bottom-0 pointer-events-none"
                style={{ height: '40%', background: `linear-gradient(180deg, transparent, rgba(0,0,0,${cam.overlayBottomOpacity}))` }}
              />
            )}
            {cam.indicatorEnabled && (
              <div
                className="absolute rounded-full flex items-center justify-center"
                style={{
                  ...positionStyle(cam.indicatorPosition),
                  width: cam.indicatorSize, height: cam.indicatorSize,
                  background: cam.indicatorColor,
                  border: '2px solid rgba(15,25,38,1)',
                }}
              >
                <Video style={{ width: cam.indicatorSize * 0.55, height: cam.indicatorSize * 0.55, color: '#fff' }} />
              </div>
            )}
          </>
        )}
        {/* Speaking pulse */}
        {speaking && (
          <div
            className="absolute pointer-events-none"
            style={{
              inset: -4,
              borderRadius: radius + 4,
              border: `2px solid ${sp.speakingRingColor}`,
              opacity: 0.35,
            }}
          />
        )}
        {/* Mute icon */}
        {muted && sp.showMicIcon && (
          <div
            className="absolute rounded-full flex items-center justify-center"
            style={{
              bottom: -2, right: -2,
              width: 18, height: 18,
              background: '#475569',
              border: '2px solid rgba(15,25,38,1)',
            }}
          >
            <MicOff style={{ width: 10, height: 10, color: '#fff' }} />
          </div>
        )}
        {/* ★ v289: Online dot — indicators.onlineDot* (sadece host hariç, yeşil nokta) */}
        {!isOwner && !withCamera && ind.onlineDotEnabled && (
          <div
            className="absolute rounded-full"
            style={{
              ...positionStyle(ind.onlineDotPosition),
              width: ind.onlineDotSize,
              height: ind.onlineDotSize,
              background: ind.onlineDotColor,
              border: '2px solid rgba(15,25,38,1)',
            }}
          />
        )}
        {/* ★ v289: namePosition='inside' isim avatarın İÇİNDE (alt overlay) */}
        {pos === 'inside' && nameEl}
      </div>

      {/* ★ v289: namePosition='below' isim avatardan SONRA (default) */}
      {pos === 'below' && nameEl}
    </div>
  );
}

// ★ v289: indicators.onlineDotPosition → CSS köşe konumu helper
function positionStyle(pos: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft'): React.CSSProperties {
  switch (pos) {
    case 'topRight':    return { top: -1, right: -1 };
    case 'topLeft':     return { top: -1, left: -1 };
    case 'bottomLeft':  return { bottom: -1, left: -1 };
    case 'bottomRight':
    default:            return { bottom: -1, right: -1 };
  }
}

/* ══════════════ LISTENER TILE — APK ListenerGrid ══════════════
 * ★ v289 (16 May 2026): listeners.nameFontSize + nameMaxChars + listenerShadow*
 * (Skia) + handRaise badge (accents) + ownerHighlight border (admin Vurgu Rengi)
 * preview'e bağlandı. */
function ListenerTile({ size, cfg, isOwner, handRaised }:
  { size: number; cfg: RoomLayoutConfig; isOwner: boolean; handRaised?: boolean }) {
  const l = cfg.listeners;
  const acc = cfg.accents;
  const sh = cfg.shadows;
  const renderSize = isOwner ? size * l.ownerScale : size;
  const radius = shapeRadius(l.avatarShape, renderSize, l.borderRadius);
  // ★ v289: Owner için cfgOwnerHighlight override (mobile ListenerCell ile aynı pattern)
  const ringW = isOwner ? Math.max(2, l.ringWidth) : l.ringWidth;
  const ringColor = isOwner ? acc.ownerHighlight : l.ringColor;
  // ★ v289: Listener Skia shadow
  const shadowCss = sh.listenerShadowEnabled
    ? `0 0 ${sh.listenerShadowBlur}px ${hexToRgba(sh.listenerShadowColor, sh.listenerShadowOpacity)}`
    : 'none';
  // ★ v289: Name kesim
  const nameFontSize = l.nameFontSize || 9;
  const fullName = isOwner ? 'Burak D.' : 'Dinleyici';
  const displayName = l.nameMaxChars > 0 ? fullName.slice(0, l.nameMaxChars) : fullName;

  return (
    <div className="flex flex-col items-center relative" style={{ width: size + 6 }}>
      <div
        className="relative"
        style={{
          width: renderSize, height: renderSize, borderRadius: radius,
          background: 'linear-gradient(135deg, #64748b, #475569)',
          border: ringW > 0 ? `${ringW}px solid ${ringColor}` : 'none',
          boxShadow: shadowCss,
        }}
      >
        {isOwner && l.ownerCrownEnabled && (
          <Crown
            className="absolute"
            style={{ top: -4, right: -4, color: acc.ownerHighlight, width: 11, height: 11 }}
          />
        )}
        {/* ★ v289: Hand raise badge — accents.handRaiseEnabled + handRaiseColor */}
        {handRaised && acc.handRaiseEnabled && (
          <div
            className="absolute rounded-full flex items-center justify-center"
            style={{
              top: -4, left: -4,
              width: 14, height: 14,
              background: acc.handRaiseColor,
              border: '2px solid rgba(15,25,38,1)',
            }}
          >
            <Hand style={{ width: 8, height: 8, color: '#fff' }} />
          </div>
        )}
      </div>
      {l.showName && (
        <div
          className="truncate text-center mt-1"
          style={{
            fontSize: nameFontSize,
            color: 'rgba(148,163,184,0.85)',
            maxWidth: size + 4,
          }}
        >
          {displayName}
        </div>
      )}
    </div>
  );
}

/* ★ v289: Overflow badge — listeners_advanced.overflowBadge* */
function OverflowBadge({ cfg, count }: { cfg: RoomLayoutConfig; count: number }) {
  const la = cfg.listeners_advanced;
  const text = (la.overflowBadgeText || '+{N} Seyirci').replace('{N}', String(count));
  return (
    <div className="flex flex-col items-center" style={{ width: 50 }}>
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: 44, height: 44,
          background: la.overflowBadgeColor || 'rgba(20,184,166,0.16)',
          border: `1px solid ${hexToRgba((la.overflowBadgeTextColor || '#5EEAD4'), 0.35)}`,
        }}
      >
        <span style={{ color: la.overflowBadgeTextColor || '#5EEAD4', fontSize: 11, fontWeight: 700 }}>
          +{count}
        </span>
      </div>
      <div className="truncate text-center mt-1" style={{ fontSize: 9, color: la.overflowBadgeTextColor || '#5EEAD4', maxWidth: 50 }}>
        {text.replace(/^\+\d+\s*/, '').trim() || 'Seyirci'}
      </div>
    </div>
  );
}

/* ════════ v301 (18 May 2026): CameraSpotlightGrid ════════
 * Spotlight aktif + kamera açan konuşmacılar — Discord/TikTok pattern.
 * Mobile SpeakerSection.tsx L1228-1248 ile birebir aspect kuralı:
 *   1 kamera → spotlightSingleAspect (default 0.62, sinematik)
 *   2 kamera → spotlightDoubleAspect (default 1.0, kare yan yana)
 *   3 kamera → spotlightTripleAspect (default 1.0, 3 col kare)
 *   4 kamera → spotlightQuadAspect (default 1.05, 2x2 hafif dikey)
 *   5+      → 3 col kompakt, kare
 */
function CameraSpotlightGrid({ cfg, camCount, W }: { cfg: RoomLayoutConfig; camCount: number; W: number }) {
  const cam = cfg.camera;
  let cols = 1, tileW = W, tileH = W * cam.spotlightSingleAspect;
  let gap = cam.spotlightGap;
  if (camCount === 1) {
    tileW = W; tileH = Math.round(W * cam.spotlightSingleAspect);
  } else if (camCount === 2) {
    cols = 2; tileW = Math.floor((W - gap) / 2); tileH = Math.round(tileW * cam.spotlightDoubleAspect);
  } else if (camCount === 3) {
    cols = 3; tileW = Math.floor((W - gap * 2) / 3); tileH = Math.round(tileW * cam.spotlightTripleAspect);
  } else if (camCount === 4) {
    cols = 2; tileW = Math.floor((W - gap) / 2); tileH = Math.round(tileW * cam.spotlightQuadAspect);
  } else {
    cols = 3; tileW = Math.floor((W - gap * 2) / 3); tileH = tileW; gap = Math.max(4, gap - 4);
  }
  const radius = Math.max(cam.cornerRadiusMin, Math.floor(tileW * cam.cornerRadiusPercent / 100));
  return (
    <div className="grid mb-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
      {Array.from({ length: camCount }).map((_, i) => {
        const useCustom = cam.useCustomBorder;
        return (
          <div
            key={i}
            className="relative overflow-hidden flex items-center justify-center"
            style={{
              width: tileW, height: tileH, borderRadius: radius,
              background: 'linear-gradient(135deg, #0f766e, #134e4a)',
              border: useCustom && cam.borderWidth > 0 ? `${cam.borderWidth}px solid ${cam.borderColor}` : 'none',
            }}
          >
            <Video style={{ width: Math.min(34, tileW * 0.18), height: Math.min(34, tileW * 0.18), color: 'rgba(255,255,255,0.45)' }} />
            {cam.overlayTopOpacity > 0 && (
              <div className="absolute left-0 right-0 top-0 pointer-events-none"
                style={{ height: '32%', background: `linear-gradient(180deg, rgba(0,0,0,${cam.overlayTopOpacity}), transparent)` }} />
            )}
            {cam.overlayBottomOpacity > 0 && (
              <div className="absolute left-0 right-0 bottom-0 pointer-events-none"
                style={{ height: '38%', background: `linear-gradient(180deg, transparent, rgba(0,0,0,${cam.overlayBottomOpacity}))` }} />
            )}
            {cam.indicatorEnabled && (
              <div className="absolute rounded-full flex items-center justify-center"
                style={{
                  ...positionStyle(cam.indicatorPosition),
                  width: cam.indicatorSize, height: cam.indicatorSize,
                  background: cam.indicatorColor,
                  border: '2px solid rgba(15,25,38,1)',
                }}>
                <Video style={{ width: cam.indicatorSize * 0.55, height: cam.indicatorSize * 0.55, color: '#fff' }} />
              </div>
            )}
            <div className="absolute left-2 bottom-1.5 text-white truncate" style={{ fontSize: 10, maxWidth: tileW - 16, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
              {i === 0 ? 'Burak DENİZ' : `Kameralı ${i + 1}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ★ v289: Stage divider — stage.dividerStyle / dividerColor */
function StageDividerLine({ cfg }: { cfg: RoomLayoutConfig }) {
  const st = cfg.stage;
  if (st.dividerStyle === 'none') return null;
  if (st.dividerStyle === 'gradient') {
    return (
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${st.dividerColor}, ${st.dividerColor}, transparent)`,
          marginTop: 4, marginBottom: 4,
        }}
      />
    );
  }
  return <div style={{ height: 1, background: st.dividerColor, marginTop: 4, marginBottom: 4 }} />;
}

/* ══════════════ CONTROL BAR — APK RoomControlBar 8 ikon ══════════════ */
function PreviewControlBar({ cfg }: { cfg: RoomLayoutConfig }) {
  const c = cfg.controls;
  return (
    <div
      className="absolute left-0 right-0 bottom-0 flex items-center justify-around"
      style={{
        background: 'rgba(15,25,38,0.92)',
        backdropFilter: 'blur(14px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        paddingTop: 8,
        paddingBottom: 8 + cfg.global.safePaddingBottom,
        paddingLeft: cfg.global.horizontalPadding,
        paddingRight: cfg.global.horizontalPadding,
      }}
    >
      <CtrlBtn cfg={cfg}><MessageCircle style={{ width: c.iconSize, height: c.iconSize, color: c.iconColor }} /></CtrlBtn>
      <CtrlBtn cfg={cfg} active="#14B8A6"><Volume2 style={{ width: c.iconSize, height: c.iconSize, color: '#fff' }} /></CtrlBtn>
      <CtrlBtn cfg={cfg} active="#FBBF24"><Mic style={{ width: c.iconSize, height: c.iconSize, color: '#fff' }} /></CtrlBtn>
      <CtrlBtn cfg={cfg}><Video style={{ width: c.iconSize, height: c.iconSize, color: c.iconColor }} /></CtrlBtn>
      <CtrlBtn cfg={cfg}><Hand style={{ width: c.iconSize, height: c.iconSize, color: c.iconColor }} /></CtrlBtn>
      <CtrlBtn cfg={cfg}><Mail style={{ width: c.iconSize, height: c.iconSize, color: c.iconColor }} /></CtrlBtn>
      <CtrlBtn cfg={cfg}><Gift style={{ width: c.iconSize, height: c.iconSize, color: c.iconColor }} /></CtrlBtn>
      <CtrlBtn cfg={cfg}><Plus style={{ width: c.iconSize, height: c.iconSize, color: c.iconColor }} /></CtrlBtn>
    </div>
  );
}

function CtrlBtn({ cfg, active, children }: { cfg: RoomLayoutConfig; active?: string; children: React.ReactNode }) {
  const c = cfg.controls;
  const radius = c.buttonShape === 'circle' ? c.buttonSize / 2 : c.buttonBorderRadius;
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: c.buttonSize, height: c.buttonSize, borderRadius: radius,
        background: active || 'transparent',
        marginLeft: c.buttonGap / 6,
        marginRight: c.buttonGap / 6,
      }}
    >
      {children}
    </div>
  );
}
