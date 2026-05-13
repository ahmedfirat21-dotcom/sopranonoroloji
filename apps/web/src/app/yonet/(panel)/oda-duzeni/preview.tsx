"use client";
import React from 'react';
import { Crown, Mic, MicOff, Video, Hand, ShieldCheck, BadgeCheck, Shield } from 'lucide-react';
import type { RoomLayoutConfig, AvatarShape, CornerPosition } from './types';

/**
 * Oda Önizleme — Mobile sahne formülünü birebir kopya
 * ══════════════════════════════════════════════════════════════════
 * getSpeakerMetrics/getGridMetrics (mobile) ile aynı hesabı kullanır.
 * Renkler, boyutlar, gap, border-radius — config'in tamamı tüketilir.
 * HTML/CSS render — Skia parite teknik olarak browser-side mümkün değil
 * (canvaskit-wasm büyük yük), ama görsel sonuç %95+ aynı: mobil Skia
 * sadece glow/shadow tarafında devreye girer, layout kompozisyonu özdeş.
 */

const PREVIEW_W = 320;     // mobile 360dp ekran simulation, ~%89 scale
const DEFAULT_SPEAKER_COUNT = 4;
const DEFAULT_LISTENER_COUNT = 9;

// ── Mobile formülünün birebir kopyası ──
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
  let cols: number, maxSize: number;
  if (count <= 1)      { cols = 1; maxSize = 140; }
  else if (count <= 3) { cols = Math.min(3, cfg.maxCols); maxSize = p.large; }
  else if (count <= 6) { cols = Math.min(3, cfg.maxCols); maxSize = p.medium; }
  else if (count <= 9) { cols = Math.min(3, cfg.maxCols); maxSize = Math.round(p.medium * 0.92); }
  else if (count <= 12){ cols = Math.min(4, cfg.maxCols); maxSize = p.small; }
  else                 { cols = Math.min(5, cfg.maxCols); maxSize = Math.round(p.small * 0.9); }
  const gap = cfg.colGap;
  const calc = Math.floor((availableW - gap * (cols - 1)) / cols);
  const cardW = Math.min(calc, maxSize);
  return { cols, cardW, gap };
}

function getListenerMetrics(count: number, W: number, cfg: RoomLayoutConfig['listeners']) {
  const p = cfg.sizePresets;
  let cols: number, maxSize: number;
  if (count <= 4)       { cols = Math.min(5, cfg.maxCols + 1); maxSize = p.large; }
  else if (count <= 8)  { cols = Math.min(6, cfg.maxCols); maxSize = p.medium; }
  else if (count <= 15) { cols = Math.min(7, cfg.maxCols + 1); maxSize = Math.round(p.medium * 0.95); }
  else                  { cols = Math.min(8, cfg.maxCols + 2); maxSize = p.small; }
  const gap = cfg.colGap;
  const cellW = Math.floor((W - 32 - gap * (cols - 1)) / cols);
  const calc = Math.max(32, cellW - (count <= 8 ? 10 : count <= 15 ? 8 : 5));
  const avSize = Math.min(calc, maxSize);
  return { cols, gap, cellW, avSize };
}

// ── Indicator corner CSS ──
function cornerStyle(pos: CornerPosition, offset = 0): React.CSSProperties {
  const o = offset;
  switch (pos) {
    case 'topRight':    return { top: o, right: o };
    case 'topLeft':     return { top: o, left: o };
    case 'bottomRight': return { bottom: o, right: o };
    case 'bottomLeft':  return { bottom: o, left: o };
  }
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex?.startsWith('#') || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function RoomPreview({ cfg, speakerCount = DEFAULT_SPEAKER_COUNT, listenerCount = DEFAULT_LISTENER_COUNT }:
  { cfg: RoomLayoutConfig; speakerCount?: number; listenerCount?: number }) {
  const SPEAKER_COUNT = speakerCount;
  const LISTENER_COUNT = listenerCount;
  const sM = getSpeakerMetrics(SPEAKER_COUNT, PREVIEW_W, cfg.speakers);
  const lM = getListenerMetrics(LISTENER_COUNT, PREVIEW_W, cfg.listeners);

  const bgStyle: React.CSSProperties =
    cfg.global.background === 'gradient'
      ? { backgroundImage: `linear-gradient(180deg, ${cfg.global.bgGradient[0]}, ${cfg.global.bgGradient[1]})` }
      : cfg.global.background === 'solid'
      ? { background: cfg.global.bgColor }
      : cfg.global.background === 'image' && cfg.global.bgImageUrl
      ? { backgroundImage: `url(${cfg.global.bgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { background: '#0A0F1A' };

  return (
    <div
      className="mx-auto rounded-2xl border border-slate-700/40 overflow-hidden relative shadow-2xl"
      style={{ width: PREVIEW_W, height: 680, ...bgStyle }}
    >
      {/* Preview-only CSS keyframes — speakingRingExpand + haloPulse */}
      <style>{`
        @keyframes speaking-ring-expand {
          0%   { transform: scale(1);   opacity: 0.85 }
          70%  { opacity: 0.3 }
          100% { transform: scale(var(--ring-scale-to, 1.35)); opacity: 0 }
        }
        @keyframes halo-pulse {
          0%, 100% { transform: scale(1);   opacity: calc(1 - var(--halo-amp, 0.2)) }
          50%      { transform: scale(calc(1 + var(--halo-amp, 0.2))); opacity: 1 }
        }
      `}</style>
      {/* Safe top */}
      <div style={{ height: cfg.global.safePaddingTop }} />

      {/* Header */}
      <PreviewHeader cfg={cfg} count={SPEAKER_COUNT + LISTENER_COUNT + 1} />

      {/* Stage container */}
      <div
        style={{
          padding: cfg.stage.padding,
          paddingLeft: cfg.global.horizontalPadding,
          paddingRight: cfg.global.horizontalPadding,
          backgroundColor: cfg.stage.backgroundColor,
          borderRadius: cfg.stage.borderRadius,
        }}
      >
        {/* Speaker grid (host = 0. tile, owner highlight) */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${sM.cols}, 1fr)`,
            gap: `${cfg.speakers.rowGap}px ${cfg.speakers.colGap}px`,
            justifyItems: 'center',
          }}
        >
          {Array.from({ length: SPEAKER_COUNT }).map((_, i) => (
            <SpeakerTile
              key={i}
              size={sM.cardW}
              cfg={cfg}
              isOwner={i === 0}
              speaking={i === 1 || i === SPEAKER_COUNT - 1 && SPEAKER_COUNT > 3}
              muted={i === 2}
              cameraOn={i === 3 && SPEAKER_COUNT > 3}
              isModerator={i === 4 && SPEAKER_COUNT > 4}
              isVerified={i === 1 || i === 2}
            />
          ))}
        </div>

        {/* Divider */}
        {cfg.stage.dividerStyle !== 'none' ? (
          <div style={{
            height: 1,
            marginTop: cfg.stage.gapBetweenSpeakersAndListeners / 2,
            marginBottom: cfg.stage.gapBetweenSpeakersAndListeners / 2,
            background: cfg.stage.dividerStyle === 'gradient'
              ? `linear-gradient(90deg, transparent, ${cfg.stage.dividerColor}, transparent)`
              : cfg.stage.dividerColor,
          }} />
        ) : (
          <div style={{ height: cfg.stage.gapBetweenSpeakersAndListeners }} />
        )}

        {/* Listener grid — overflow capping (advanced.maxVisibleDefault) */}
        {(() => {
          const cap = Math.min(LISTENER_COUNT, cfg.listeners_advanced.maxVisibleDefault);
          const overflow = Math.max(0, LISTENER_COUNT - cap);
          return (
            <>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${lM.cols}, 1fr)`,
                  gap: `${cfg.listeners.rowGap}px ${cfg.listeners.colGap}px`,
                  justifyItems: 'center',
                }}
              >
                {Array.from({ length: cap }).map((_, i) => (
                  <ListenerTile
                    key={i}
                    size={lM.avSize}
                    cfg={cfg}
                    isOwner={false}
                    handRaised={i === 2}
                    online={i % 3 === 0}
                  />
                ))}
              </div>
              {overflow > 0 && (
                <div className="mt-2 flex justify-center">
                  <OverflowBadge cfg={cfg} hiddenCount={overflow} />
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Control bar */}
      <PreviewControlBar cfg={cfg} />
    </div>
  );
}

/* ══════════════ HEADER ══════════════ */
function PreviewHeader({ cfg, count }: { cfg: RoomLayoutConfig; count: number }) {
  const h = cfg.header;
  return (
    <div
      className="px-3 pt-2 pb-3 flex items-center gap-2"
      style={{
        background: h.headerBgOpacity > 0 ? `rgba(15,25,38,${h.headerBgOpacity})` : 'transparent',
        borderBottom: h.headerBorderBottom ? `1px solid ${h.headerBorderColor}` : 'none',
      }}
    >
      {h.showLiveIndicator && (
        <div
          className={h.liveDotPulse ? 'animate-pulse' : ''}
          style={{ width: 6, height: 6, borderRadius: 3, background: h.liveDotColor }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{
            fontSize: h.titleFontSize,
            fontWeight: h.titleFontWeight as any,
            color: h.titleColor,
            lineHeight: 1.1,
          }}
        >
          Oda Adı Örneği
        </div>
        <div style={{ fontSize: h.subtitleFontSize, color: h.subtitleColor }}>
          {h.showListenerCount ? `${count} kişi` : 'Sohbet'}
        </div>
      </div>
    </div>
  );
}

/* ══════════════ SPEAKER TILE ══════════════ */
function SpeakerTile({ size, cfg, isOwner, speaking, muted, cameraOn, isModerator, isVerified }:
  { size: number; cfg: RoomLayoutConfig; isOwner: boolean; speaking: boolean; muted: boolean; cameraOn: boolean; isModerator: boolean; isVerified: boolean }) {
  const sp = cfg.speakers;
  const host = cfg.host;
  const adv = cfg.speakers_advanced;
  const sh = cfg.shadows;
  const ind = cfg.indicators;
  const acc = cfg.accents;
  const nameAdv = cfg.name_advanced;
  const anims = cfg.animations;

  // Owner ise host config geçerli — host.avatarSize ile bağımsız boyut
  const useHost = isOwner;
  const shape = useHost ? host.avatarShape : sp.avatarShape;
  const radiusCfg = useHost ? host.borderRadius : sp.borderRadius;
  // ★ Bug fix: useHost ise host.avatarSize kullan, ownerScale uygulanır
  //   Spotlight enabled ise host'a spotlightScale uygulanır
  const baseSize = useHost
    ? host.avatarSize * adv.ownerScale * (adv.spotlightEnabled ? adv.spotlightScale : 1)
    : size;
  const renderSize = baseSize;
  // ★ Moderator > speaking > default ring
  const ringW = useHost ? acc.ownerRingWidth
    : isModerator ? acc.moderatorRingWidth
    : speaking ? sp.ringWidth : sp.ringWidth;
  const ringColor = useHost ? acc.ownerHighlight
    : isModerator ? acc.moderatorHighlight
    : speaking ? sp.speakingRingColor : sp.ringColor;
  const radius = shapeRadius(shape, renderSize, radiusCfg);

  // Shadow
  const showShadow = useHost ? host.haloEnabled : sh.speakerShadowEnabled || speaking;
  const shadowColor = useHost ? host.haloColor : sh.speakerShadowColor;
  const shadowBlur = useHost ? host.haloBlur : sh.speakerShadowBlur;
  const shadowOpacity = useHost ? host.haloOpacity : sh.speakerShadowOpacity;
  const boxShadow = showShadow
    ? `0 0 ${shadowBlur}px ${hexToRgba(shadowColor, shadowOpacity)}`
    : 'none';

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <div
        className="relative flex items-center justify-center"
        style={{
          width: renderSize,
          height: renderSize,
          borderRadius: radius,
          background: cameraOn
            ? 'linear-gradient(135deg, #1e40af, #6366f1)'
            : 'linear-gradient(135deg, #1e293b, #475569)',
          border: ringW > 0 ? `${ringW}px ${useHost ? 'solid' : 'solid'} ${ringColor}` : 'none',
          boxShadow,
          opacity: muted ? sp.muteOpacity : 1,
          filter: muted ? `grayscale(${adv.mutedAvatarGrayscale})` : undefined,
        }}
      >
        {/* Owner crown */}
        {isOwner && (
          <Crown
            className="absolute"
            style={{ ...cornerStyle('topRight', -4), color: acc.ownerHighlight, width: 14, height: 14 }}
          />
        )}

        {/* Camera indicator */}
        {cameraOn && ind.cameraIndicatorEnabled && (
          <Video
            className="absolute"
            style={{ ...cornerStyle('topLeft', 4), color: ind.cameraIndicatorColor, width: 12, height: 12 }}
          />
        )}

        {/* Mic mute indicator */}
        {muted && ind.muteIndicatorEnabled && sp.showMicIcon && (
          <div
            className="absolute rounded-full flex items-center justify-center"
            style={{
              ...cornerStyle(ind.muteIndicatorPosition, -2),
              width: ind.muteIndicatorSize, height: ind.muteIndicatorSize,
              background: ind.muteIndicatorColor,
              border: '2px solid rgba(15,25,38,1)',
            }}
          >
            <MicOff style={{ width: ind.muteIndicatorSize * 0.55, height: ind.muteIndicatorSize * 0.55, color: '#fff' }} />
          </div>
        )}

        {/* Speaking mic icon (active, not muted) */}
        {!muted && speaking && sp.showMicIcon && (
          <Mic
            className="absolute"
            style={{
              bottom: -3 + adv.micIconOffsetY, right: -3,
              width: 12, height: 12,
              color: adv.micIconColor,
              filter: 'drop-shadow(0 0 4px ' + hexToRgba(adv.micIconColor, 0.8) + ')',
            }}
          />
        )}

        {/* Verified tick */}
        {isVerified && ind.verifiedTickEnabled && (
          <BadgeCheck
            className="absolute"
            style={{ ...cornerStyle('bottomLeft', -3), color: ind.verifiedTickColor, width: 13, height: 13, background: '#0F172A', borderRadius: 7 }}
          />
        )}

        {/* Moderator shield (top-left if no camera) */}
        {isModerator && !cameraOn && (
          <Shield
            className="absolute"
            style={{ ...cornerStyle('topLeft', 4), color: acc.moderatorHighlight, width: 12, height: 12 }}
          />
        )}
      </div>

      {/* Speaking pulse ring overlay — speakingRingExpand'e bağlı scale */}
      {speaking && anims.speakingPulseEnabled && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: renderSize, height: renderSize, borderRadius: radius,
            border: `2px solid ${sp.speakingRingColor}`,
            animation: `speaking-ring-expand ${anims.speakingPulseSpeed}ms ease-out infinite`,
            ['--ring-scale-to' as any]: anims.speakingRingExpand,
            marginTop: 0,
          } as React.CSSProperties}
        />
      )}

      {/* Halo pulse — sadece host avatar için, halo pulse aktifse */}
      {useHost && host.haloEnabled && anims.haloPulseEnabled && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: renderSize * 1.4, height: renderSize * 1.4,
            top: -renderSize * 0.2, left: -renderSize * 0.2,
            borderRadius: radius * 1.4,
            background: `radial-gradient(circle, ${hexToRgba(host.haloColor, host.haloOpacity)} 0%, transparent 70%)`,
            animation: `halo-pulse ${anims.haloPulseSpeed}ms ease-in-out infinite`,
            ['--halo-amp' as any]: anims.haloPulseAmplitude,
          } as React.CSSProperties}
        />
      )}

      {/* Name */}
      {(useHost ? host.namePosition : sp.namePosition) !== 'hidden' && (
        <div
          className="text-center truncate mt-1"
          style={{
            fontSize: (useHost ? host.nameFontSize : sp.nameFontSize) * 0.92,
            fontWeight: (useHost ? host.nameFontWeight : '600') as any,
            color: useHost ? host.nameColor : '#e2e8f0',
            maxWidth: size,
            textShadow: nameAdv.textShadowEnabled
              ? `0 ${nameAdv.textShadowOffsetY}px ${nameAdv.textShadowRadius}px ${nameAdv.textShadowColor}`
              : undefined,
            WebkitTextStroke: nameAdv.strokeEnabled ? `${nameAdv.strokeWidth}px ${nameAdv.strokeColor}` : undefined,
            letterSpacing: nameAdv.letterSpacing,
            lineHeight: nameAdv.lineHeight,
          }}
        >
          {isOwner ? 'Host' : speaking ? 'Konuş.' : muted ? 'Sessiz' : cameraOn ? 'Kamera' : 'Konuş.'}
        </div>
      )}
    </div>
  );
}

/* ══════════════ LISTENER TILE ══════════════ */
function ListenerTile({ size, cfg, isOwner, handRaised, online }:
  { size: number; cfg: RoomLayoutConfig; isOwner: boolean; handRaised: boolean; online: boolean }) {
  const l = cfg.listeners;
  const acc = cfg.accents;
  const ind = cfg.indicators;
  const sh = cfg.shadows;
  const ladv = cfg.listeners_advanced;
  const nameAdv = cfg.name_advanced;
  const renderSize = isOwner ? size * l.ownerScale : size;
  const radius = shapeRadius(l.avatarShape, renderSize, l.borderRadius);

  const ringW = isOwner ? acc.ownerRingWidth : l.ringWidth;
  const ringColor = isOwner ? acc.ownerHighlight : l.ringColor;

  const boxShadow = sh.listenerShadowEnabled
    ? `0 2px ${sh.listenerShadowBlur}px ${hexToRgba(sh.listenerShadowColor, sh.listenerShadowOpacity)}`
    : 'none';

  return (
    <div className="flex flex-col items-center relative" style={{ width: size + 6 }}>
      <div
        className="relative"
        style={{
          width: renderSize, height: renderSize, borderRadius: radius,
          background: 'linear-gradient(135deg, #475569, #64748b)',
          border: ringW > 0 ? `${ringW}px solid ${ringColor}` : 'none',
          boxShadow,
        }}
      >
        {/* Online dot */}
        {online && ind.onlineDotEnabled && (
          <div
            className="absolute rounded-full"
            style={{
              ...cornerStyle(ind.onlineDotPosition, -1),
              width: ind.onlineDotSize, height: ind.onlineDotSize,
              background: ind.onlineDotColor,
              border: '1.5px solid rgba(15,25,38,1)',
            }}
          />
        )}
        {/* Hand raise */}
        {handRaised && ladv.showHandRaiseBadge && (
          <div
            className="absolute rounded-full flex items-center justify-center"
            style={{
              ...cornerStyle(ladv.handRaiseBadgePosition, -2),
              width: 16, height: 16, background: acc.handRaiseColor,
              border: '2px solid rgba(15,25,38,1)',
            }}
          >
            <Hand style={{ width: 9, height: 9, color: '#0F172A' }} />
          </div>
        )}
        {/* Owner crown */}
        {isOwner && l.ownerCrownEnabled && (
          <Crown
            className="absolute"
            style={{ ...cornerStyle('topRight', -4), color: acc.ownerHighlight, width: 11, height: 11 }}
          />
        )}
      </div>
      {l.showName && (
        <div
          className="truncate text-center mt-0.5"
          style={{
            fontSize: l.nameFontSize * 0.9,
            color: '#94a3b8',
            maxWidth: size + 4,
            textShadow: nameAdv.textShadowEnabled
              ? `0 ${nameAdv.textShadowOffsetY}px ${nameAdv.textShadowRadius}px ${nameAdv.textShadowColor}`
              : undefined,
            WebkitTextStroke: nameAdv.strokeEnabled ? `${nameAdv.strokeWidth}px ${nameAdv.strokeColor}` : undefined,
            letterSpacing: nameAdv.letterSpacing,
            lineHeight: nameAdv.lineHeight,
          }}
        >
          {(handRaised ? 'Eli' : 'Ali').slice(0, l.nameMaxChars)}
        </div>
      )}
    </div>
  );
}

/* ══════════════ OVERFLOW BADGE ══════════════ */
function OverflowBadge({ cfg, hiddenCount }: { cfg: RoomLayoutConfig; hiddenCount: number }) {
  const ladv = cfg.listeners_advanced;
  const text = (ladv.overflowBadgeText || '+{N} Seyirci').replace('{N}', String(hiddenCount));
  return (
    <div
      className="rounded-full px-2 py-1 text-[10px] font-semibold"
      style={{
        background: ladv.overflowBadgeColor,
        color: ladv.overflowBadgeTextColor,
        border: `1px solid ${ladv.overflowBadgeTextColor}33`,
      }}
    >
      {text}
    </div>
  );
}

/* ══════════════ CONTROL BAR ══════════════ */
function PreviewControlBar({ cfg }: { cfg: RoomLayoutConfig }) {
  const c = cfg.controls;
  return (
    <div
      className="absolute left-0 right-0 bottom-0 flex items-center justify-around"
      style={{
        background: c.barBackground,
        backdropFilter: c.barBlurEnabled ? `blur(${c.barBlurIntensity / 2}px)` : undefined,
        borderTop: `1px solid ${c.barBorderTop}`,
        paddingTop: c.barPaddingV,
        paddingBottom: c.barPaddingV + cfg.global.safePaddingBottom,
        paddingLeft: cfg.global.horizontalPadding,
        paddingRight: cfg.global.horizontalPadding,
      }}
    >
      {/* Mic */}
      <CtrlBtn cfg={cfg} bg={c.micActiveColor}><Mic style={{ width: c.iconSize, height: c.iconSize, color: '#fff' }} /></CtrlBtn>
      {/* Camera */}
      <CtrlBtn cfg={cfg} bg="rgba(255,255,255,0.10)"><Video style={{ width: c.iconSize, height: c.iconSize, color: c.iconColor }} /></CtrlBtn>
      {/* Hand */}
      <CtrlBtn cfg={cfg} bg="rgba(255,255,255,0.10)"><Hand style={{ width: c.iconSize, height: c.iconSize, color: c.iconColor }} /></CtrlBtn>
      {/* Verify */}
      <CtrlBtn cfg={cfg} bg="rgba(255,255,255,0.10)"><ShieldCheck style={{ width: c.iconSize, height: c.iconSize, color: c.iconColor }} /></CtrlBtn>
      {/* Leave */}
      <CtrlBtn cfg={cfg} bg={c.leaveButtonColor}><MicOff style={{ width: c.iconSize, height: c.iconSize, color: '#fff' }} /></CtrlBtn>
    </div>
  );
}
function CtrlBtn({ cfg, bg, children }: { cfg: RoomLayoutConfig; bg: string; children: React.ReactNode }) {
  const c = cfg.controls;
  const radius = c.buttonShape === 'circle' ? c.buttonSize / 2 : c.buttonBorderRadius;
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: c.buttonSize, height: c.buttonSize, borderRadius: radius,
        background: bg, marginLeft: c.buttonGap / 4, marginRight: c.buttonGap / 4,
      }}
    >
      {children}
    </div>
  );
}
