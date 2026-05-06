/**
 * SopranoChat — Yönetim panelinde kullanılan logo (landing-new ile birebir aynı CSS).
 * Ortak component yapmak yerine direkt buraya yazıldı; landing-new ile bağı yok,
 * orası değişirse burası kalır (admin teması farklı evrim sürecine sahip olabilir).
 *
 * <SopranoLogoStyleTag/> — global CSS'i bir kez sayfa içine ekle.
 * <SopranoLogoMini ... /> — logoyu render et.
 */
'use client';

import * as React from 'react';

/** Logo CSS — sayfa başına bir kez ekle (sidebar, login, topbar gibi yerlerde). */
export function SopranoLogoStyleTag() {
  return (
    <style>{`
      @import url('https://fonts.cdnfonts.com/css/cooper-black');
      @keyframes scAdminLogoGlow {
        0%, 100% { filter: drop-shadow(0 0 2px rgba(120,200,200,0)) drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
        50% { filter: drop-shadow(0 0 8px rgba(120,200,200,0.3)) drop-shadow(0 0 20px rgba(120,200,200,0.1)) drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
      }
      .sc-admin-logo {
        font-family: 'Cooper Black', 'Arial Rounded MT Bold', serif;
        font-weight: 900;
        letter-spacing: 0.5px;
        display: inline-flex;
        align-items: flex-end;
      }
      .sc-admin-logo-soprano {
        background: linear-gradient(180deg, #ffffff 0%, #dde4ee 35%, #b8c2d4 70%, #ccd4e4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6)) drop-shadow(1px 1px 0 rgba(0,0,0,0.4));
      }
      .sc-admin-logo-chat {
        background: linear-gradient(180deg, #b8f0f0 0%, #5ec8c8 30%, #3a9e9e 65%, #4db0a8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6)) drop-shadow(1px 1px 0 rgba(20,80,70,0.5));
        animation: scAdminLogoGlow 3s ease-in-out infinite;
      }
      .sc-admin-logo-tagline {
        font-family: 'Cooper Black', 'Arial Rounded MT Bold', sans-serif;
        letter-spacing: 1.5px;
        background: linear-gradient(180deg, #ffffff 0%, #dde4ee 35%, #b8c2d4 70%, #ccd4e4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
      }
    `}</style>
  );
}

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** "YÖNETİM" gibi alt etiket — boş bırakılırsa "Senin Sesin" gösterilir. */
  tagline?: string;
  /** Tagline rengi (varsayılan amber) — yönetim panelinde amber, normal yerlerde gümüş */
  taglineAmber?: boolean;
  muted?: boolean;
  showTagline?: boolean;
}

/**
 * Cooper Black gradient logo — gümüş "Soprano" + turkuaz parlak "Chat".
 * Tagline opsiyonel; yönetim için "YÖNETİM" amber renkte gösterilebilir.
 */
export default function SopranoLogoMini({
  size = 'md',
  tagline,
  taglineAmber = false,
  muted = false,
  showTagline = true,
}: Props) {
  const sizes = {
    xs: { soprano: 16, chat: 16, tagline: 5 },
    sm: { soprano: 22, chat: 22, tagline: 6.5 },
    md: { soprano: 30, chat: 30, tagline: 8.5 },
    lg: { soprano: 44, chat: 44, tagline: 11 },
  } as const;
  const s = sizes[size];
  const finalTagline = tagline ?? 'Senin Sesin';

  // Amber tagline — sidebar/login için (Fredoka + amber YÖNETİM yazısının yerini tutar)
  const amberTaglineStyle: React.CSSProperties = {
    fontSize: s.tagline,
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
    fontWeight: 800,
    letterSpacing: '0.25em',
    color: '#fbbf24',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  };

  return (
    <div
      className="sc-admin-logo"
      style={{
        opacity: muted ? 0.7 : 1,
        lineHeight: 1,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'baseline',
        paddingBottom: showTagline ? s.tagline + 2 : 0,
      }}
    >
      <span className="sc-admin-logo-soprano" style={{ fontSize: s.soprano, lineHeight: 1 }}>
        Soprano
      </span>
      <span
        className="sc-admin-logo-chat"
        style={{ fontSize: s.chat, lineHeight: 1, marginLeft: 1 }}
      >
        Chat
      </span>
      {showTagline && (
        <span
          className={taglineAmber ? '' : 'sc-admin-logo-tagline'}
          style={{
            fontStyle: 'normal',
            position: 'absolute',
            right: 0,
            bottom: 0,
            lineHeight: 1,
            ...(taglineAmber
              ? amberTaglineStyle
              : { fontSize: s.tagline }),
          }}
        >
          {finalTagline}
        </span>
      )}
    </div>
  );
}
