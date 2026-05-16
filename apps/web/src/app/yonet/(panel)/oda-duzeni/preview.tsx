"use client";
import React from 'react';
import { Crown, Mic, MicOff, Video, Hand, Bell, ChevronDown, Users, BarChart3, MessageCircle, Volume2, Mail, Gift, Plus } from 'lucide-react';
import type { RoomLayoutConfig, AvatarShape } from './types';

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
  let cols: number, maxSize: number;
  if (count <= 1)      { cols = 1; maxSize = 110; }
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

function hexToRgba(hex: string, alpha: number): string {
  if (!hex?.startsWith('#') || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function RoomPreview({ cfg, speakerCount = DEFAULT_SPEAKER_COUNT, listenerCount = DEFAULT_LISTENER_COUNT }:
  { cfg: RoomLayoutConfig; speakerCount?: number; listenerCount?: number }) {
  const sM = getSpeakerMetrics(speakerCount, PREVIEW_W, cfg.speakers);
  const lM = getListenerMetrics(listenerCount, PREVIEW_W, cfg.listeners);

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
        {/* Speaker grid */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${sM.cols}, 1fr)`,
            gap: `${cfg.speakers.rowGap}px ${cfg.speakers.colGap}px`,
            justifyItems: 'center',
            marginBottom: speakerCount === 0 ? 0 : 12,
          }}
        >
          {speakerCount === 0 ? (
            <EmptyStage />
          ) : (
            Array.from({ length: speakerCount }).map((_, i) => (
              <SpeakerTile
                key={i}
                size={sM.cardW}
                cfg={cfg}
                isOwner={i === 0}
                speaking={i === 1}
                muted={i === 2}
              />
            ))
          )}
        </div>

        {/* Listener grid */}
        {listenerCount > 0 && (
          <div
            className="grid mt-3"
            style={{
              gridTemplateColumns: `repeat(${lM.cols}, 1fr)`,
              gap: `${cfg.listeners.rowGap}px ${cfg.listeners.colGap}px`,
              justifyItems: 'center',
            }}
          >
            {Array.from({ length: Math.min(listenerCount, cfg.listeners_advanced.maxVisibleDefault) }).map((_, i) => (
              <ListenerTile
                key={i}
                size={lM.avSize}
                cfg={cfg}
                isOwner={false}
              />
            ))}
          </div>
        )}
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
        background: h.headerBgOpacity > 0
          ? `linear-gradient(180deg, rgba(48,65,94,${h.headerBgOpacity * 0.95}), rgba(26,40,64,${h.headerBgOpacity * 0.85}), rgba(12,22,40,${h.headerBgOpacity * 0.6}))`
          : 'linear-gradient(180deg, rgba(48,65,94,0.92), rgba(26,40,64,0.82), rgba(12,22,40,0.6))',
      }}
    >
      {/* Sol: host avatar */}
      <div
        className="w-9 h-9 rounded-full shrink-0 relative"
        style={{
          background: 'linear-gradient(135deg, #fbbf24, #b45309)',
          border: '1.5px solid #fbbf24',
        }}
      />
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

/* ══════════════ SPEAKER TILE — APK SpeakerSection ══════════════ */
function SpeakerTile({ size, cfg, isOwner, speaking, muted }:
  { size: number; cfg: RoomLayoutConfig; isOwner: boolean; speaking: boolean; muted: boolean }) {
  const sp = cfg.speakers;
  const host = cfg.host;
  const acc = cfg.accents;
  const shape = isOwner ? host.avatarShape : sp.avatarShape;
  const radiusCfg = isOwner ? host.borderRadius : sp.borderRadius;
  const renderSize = size;
  const ringW = isOwner ? 2 : (speaking ? sp.ringWidth : sp.ringWidth);
  const ringColor = isOwner ? acc.ownerHighlight : (speaking ? sp.speakingRingColor : sp.ringColor);
  const radius = shapeRadius(shape, renderSize, radiusCfg);

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <div
        className="relative flex items-center justify-center"
        style={{
          width: renderSize,
          height: renderSize,
          borderRadius: radius,
          background: 'linear-gradient(135deg, #475569, #1e293b)',
          border: ringW > 0 ? `${ringW}px solid ${ringColor}` : 'none',
          boxShadow: isOwner ? `0 0 16px ${hexToRgba(acc.ownerHighlight, 0.45)}` : 'none',
          opacity: muted ? sp.muteOpacity : 1,
        }}
      >
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
      </div>

      {/* Name — host için sarı (owner highlight rengi) */}
      <div
        className="text-center truncate mt-1.5"
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: isOwner ? acc.ownerHighlight : '#e2e8f0',
          maxWidth: size,
        }}
      >
        {isOwner ? 'Burak DENİZ' : 'Konuş.'}
      </div>
    </div>
  );
}

/* ══════════════ LISTENER TILE — APK ListenerGrid ══════════════ */
function ListenerTile({ size, cfg, isOwner }:
  { size: number; cfg: RoomLayoutConfig; isOwner: boolean }) {
  const l = cfg.listeners;
  const acc = cfg.accents;
  const renderSize = isOwner ? size * l.ownerScale : size;
  const radius = shapeRadius(l.avatarShape, renderSize, l.borderRadius);
  const ringW = isOwner ? 2 : l.ringWidth;
  const ringColor = isOwner ? acc.ownerHighlight : l.ringColor;

  return (
    <div className="flex flex-col items-center relative" style={{ width: size + 6 }}>
      <div
        className="relative"
        style={{
          width: renderSize, height: renderSize, borderRadius: radius,
          background: 'linear-gradient(135deg, #64748b, #475569)',
          border: ringW > 0 ? `${ringW}px solid ${ringColor}` : 'none',
        }}
      >
        {isOwner && l.ownerCrownEnabled && (
          <Crown
            className="absolute"
            style={{ top: -4, right: -4, color: acc.ownerHighlight, width: 11, height: 11 }}
          />
        )}
      </div>
      {l.showName && (
        <div
          className="truncate text-center mt-1"
          style={{
            fontSize: 9,
            color: 'rgba(148,163,184,0.85)',
            maxWidth: size + 4,
          }}
        >
          Dinleyici
        </div>
      )}
    </div>
  );
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
