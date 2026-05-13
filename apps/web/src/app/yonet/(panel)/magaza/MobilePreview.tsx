"use client";

/**
 * Mobil önizleme — bir kozmetik ürünün telefonda nasıl göründüğünü mockup'ta gösterir.
 * Kategori bazlı: çerçeve, giriş animasyonu, hediye, parlak mesaj.
 */
import { Smartphone, Sparkles, Mic } from 'lucide-react';
import ItemLottiePreview from '@/components/store/ItemLottiePreview';

type Item = {
  id: string;
  category: string;
  rarity: string | null;
  name: string;
  tagline: string | null;
  art_emoji: string | null;
  art_color: string | null;
  bg_gradient_start: string | null;
  bg_gradient_mid?: string | null;
  bg_gradient_end: string | null;
  price_sp: number;
  /** DB'den gelen asset URL — yüklenen frame/animasyon önizlemede gösterilir */
  asset_url?: string | null;
};

/**
 * Ek prop'lar — bir kategori için detaylı config geçilirse (theme/badge/glow)
 * o önizleme bu config'i tüketir. Mağaza modal'ında verilmez (sadece item),
 * editörlerden çağrılırken verilir.
 */
type ExtraPreviewProps = {
  themeConfig?: any;
  badgeConfig?: any;
  glowConfig?: any;
  bgConfig?: any;
};

export default function MobilePreview({ item, themeConfig, badgeConfig, glowConfig, bgConfig }: { item: Item } & ExtraPreviewProps) {
  const grad = item.bg_gradient_start && item.bg_gradient_end
    ? `linear-gradient(135deg, ${item.bg_gradient_start}${item.bg_gradient_mid ? `, ${item.bg_gradient_mid}` : ''}, ${item.bg_gradient_end})`
    : 'linear-gradient(135deg, #1e293b, #0f172a)';
  const accent = item.art_color || '#f59e0b';

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 font-semibold tracking-wider">
        <Smartphone className="w-3.5 h-3.5" />
        MOBİL ÖNİZLEME
      </div>

      {/* Telefon çerçevesi */}
      <div className="mx-auto" style={{ maxWidth: 280 }}>
        <div className="bg-black rounded-[2.2rem] p-2 border border-slate-700 shadow-2xl">
          <div className="bg-[#0A0F1A] rounded-[1.7rem] overflow-hidden relative" style={{ aspectRatio: '9/19', minHeight: 480 }}>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-2xl z-10" />

            {/* Status bar */}
            <div className="absolute top-1 left-0 right-0 flex justify-between px-5 text-[9px] text-white/70 z-20">
              <span>22:48</span>
              <span>•••</span>
            </div>

            {/* İçerik — kategoriye göre */}
            <div className="absolute inset-0 pt-7">
              {item.category === 'frames' && <FramePreview item={item} grad={grad} accent={accent} />}
              {item.category === 'entry_effect' && <EntryEffectPreview item={item} grad={grad} accent={accent} />}
              {item.category === 'gift' && <GiftPreview item={item} grad={grad} accent={accent} />}
              {item.category === 'glow_message' && <GlowMessagePreview item={item} grad={grad} accent={accent} glowConfig={glowConfig} />}
              {item.category === 'theme' && <ThemePreviewMock item={item} themeConfig={themeConfig} />}
              {item.category === 'badge' && <BadgePreviewMock item={item} badgeConfig={badgeConfig} accent={accent} />}
              {item.category === 'background' && <BackgroundPreviewMock item={item} bgConfig={bgConfig} grad={grad} accent={accent} />}
              {!['frames', 'entry_effect', 'gift', 'glow_message', 'theme', 'badge', 'background'].includes(item.category) && (
                <DefaultPreview item={item} grad={grad} accent={accent} />
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-3">
          Kullanıcılar bu ürünü mağazadan satın alıp profilde / sohbette aktifleştirir.
        </p>
      </div>
    </div>
  );
}

/* ==================== KATEGORI BAZLI PREVIEW ==================== */

function FramePreview({ item, grad, accent }: { item: Item; grad: string; accent: string }) {
  // Yüklenen frame asset'i avatarın üstüne overlay olarak çizilir.
  // Lottie ve PNG/SVG ikisini de ItemLottiePreview render eder.
  const hasAsset = !!item.asset_url;
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="text-[10px] text-slate-400 mb-3">Profil Sayfası</div>
      {/* Avatar + frame overlay */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Avatar (her zaman görünür) */}
        <div
          className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-3xl"
          style={{
            boxShadow: hasAsset ? 'none' : `0 0 30px ${accent}66`,
          }}
        >
          👤
        </div>
        {/* Yüklenen çerçeve overlay (varsa) — avatarın üstünde, biraz daha büyük */}
        {hasAsset && (
          <div className="absolute inset-0 pointer-events-none">
            <ItemLottiePreview
              itemId={item.id}
              assetUrl={item.asset_url}
              fallbackEmoji={item.art_emoji}
              size={128}
            />
          </div>
        )}
        {/* Asset yoksa: gradient ring + emoji köşe işareti (eski davranış) */}
        {!hasAsset && (
          <>
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: grad,
                WebkitMask: 'radial-gradient(circle, transparent 38%, black 42%)',
                mask: 'radial-gradient(circle, transparent 38%, black 42%)',
              }}
            />
            <div className="absolute -top-1 -right-1 text-2xl">{item.art_emoji || '✨'}</div>
          </>
        )}
      </div>
      <div className="mt-4 text-white font-bold text-sm">Murat Berxo</div>
      <div className="text-[10px] text-slate-400">@muratb</div>
      <div className="mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${accent}33`, color: accent, border: `1px solid ${accent}66` }}>
        {item.name.toUpperCase()}
      </div>
    </div>
  );
}

function EntryEffectPreview({ item, grad, accent }: { item: Item; grad: string; accent: string }) {
  return (
    <div className="flex flex-col h-full px-3 pt-3">
      <div className="text-[10px] text-slate-400 mb-2 px-1">Oda Görünümü</div>
      {/* Oda başlık */}
      <div className="bg-white/5 rounded-lg px-2 py-1.5 mb-2">
        <div className="text-[10px] text-white font-semibold">🎵 Müzik Sohbet</div>
        <div className="text-[8px] text-slate-400">12 dinleyici</div>
      </div>
      {/* Giriş efekti animasyonu */}
      <div
        className="rounded-xl p-3 mb-2 border-2 relative overflow-hidden"
        style={{ background: grad, borderColor: accent, boxShadow: `0 0 20px ${accent}88` }}
      >
        <div className="flex justify-center mb-1">
          <ItemLottiePreview itemId={item.id} assetUrl={item.asset_url} fallbackEmoji={item.art_emoji} size={56} />
        </div>
        <div className="text-center text-[10px] text-white font-bold">Aranan odaya girdi</div>
        <div className="text-center text-[8px] text-white/70 mt-0.5">{item.name}</div>
      </div>
      {/* Diğer üyeler */}
      <div className="space-y-1.5 mt-1">
        {['ERDAR', 'Selin', 'Kadir'].map((n, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white/[0.03] rounded-md">
            <div className="w-5 h-5 rounded-full bg-slate-700" />
            <div className="text-[10px] text-slate-300">{n} odaya girdi</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GiftPreview({ item, grad, accent }: { item: Item; grad: string; accent: string }) {
  return (
    <div className="flex flex-col h-full px-3 pt-3">
      <div className="text-[10px] text-slate-400 mb-2 px-1">Sohbet</div>
      {/* Mesaj baloncukları */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="bg-white/[0.05] rounded-lg p-2 max-w-[80%]">
          <div className="text-[8px] text-slate-400">Murat</div>
          <div className="text-[10px] text-white">selam canım</div>
        </div>
        {/* HEDİYE balonu */}
        <div
          className="rounded-xl p-3 border-2 mx-auto max-w-[85%]"
          style={{ background: grad, borderColor: accent, boxShadow: `0 0 20px ${accent}66` }}
        >
          <div className="flex justify-center mb-1">
            <ItemLottiePreview itemId={item.id} assetUrl={item.asset_url} fallbackEmoji={item.art_emoji || '🎁'} size={72} />
          </div>
          <div className="text-center text-[10px] text-white font-bold">Aranan → Murat</div>
          <div className="text-center text-[10px] text-white/90">{item.name}</div>
          <div className="text-center text-[9px] mt-1 font-bold" style={{ color: accent }}>
            ★ {item.price_sp.toLocaleString('tr-TR')} SP
          </div>
        </div>
        <div className="bg-white/[0.05] rounded-lg p-2 max-w-[80%] ml-auto">
          <div className="text-[8px] text-slate-400 text-right">Murat</div>
          <div className="text-[10px] text-white">çok teşekkürler 🥰</div>
        </div>
      </div>
    </div>
  );
}

function GlowMessagePreview({ item, grad, accent, glowConfig }: { item: Item; grad: string; accent: string; glowConfig?: any }) {
  return (
    <div className="flex flex-col h-full px-3 pt-3">
      <div className="text-[10px] text-slate-400 mb-2 px-1">Sohbet</div>
      <div className="flex-1 space-y-2">
        <div className="bg-white/[0.05] rounded-lg p-2 max-w-[80%]">
          <div className="text-[8px] text-slate-400">Murat</div>
          <div className="text-[10px] text-white">naber kanka</div>
        </div>
        {/* Parlak mesaj */}
        <div
          className="rounded-lg p-2 max-w-[85%] ml-auto"
          style={{
            background: grad,
            boxShadow: `0 0 24px ${accent}aa, 0 0 48px ${accent}55`,
            border: `1px solid ${accent}88`,
          }}
        >
          <div className="text-[8px] text-white/80 text-right">Aranan {item.art_emoji || '✨'}</div>
          <div className="text-[11px] text-white font-bold">iyiyim sen nasılsın?</div>
        </div>
        <div className="text-center text-[9px] text-slate-500">↑ {item.name}</div>
      </div>
    </div>
  );
}

/* ==================== v119: THEME + BADGE + BACKGROUND PREVIEW ==================== */

function ThemePreviewMock({ item, themeConfig }: { item: Item; themeConfig?: any }) {
  const t = themeConfig || {};
  const bg = t.surface_bg || '#0A0F1A';
  const card = t.surface_card || '#0F1926';
  const border = t.surface_border || 'rgba(255,255,255,0.08)';
  const primary = t.color_primary || '#14B8A6';
  const textP = t.text_primary || '#F1F5F9';
  const textS = t.text_secondary || '#CBD5E1';
  const textT = t.text_tertiary || '#94A3B8';
  const success = t.color_success || '#10B981';
  const danger = t.color_danger || '#EF4444';
  const radiusMd = t.radius_md || 12;
  const radiusPill = t.radius_pill || 999;
  const gFrom = t.gradient_brand_from || '#14B8A6';
  const gTo = t.gradient_brand_to || '#06B6D4';
  const gAngle = t.gradient_brand_angle || 135;
  const gPremiumFrom = t.gradient_premium_from || '#FBBF24';
  const gPremiumTo = t.gradient_premium_to || '#F472B6';
  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
        <div style={{ color: textP, fontSize: 13, fontWeight: 800 }}>{item.name || 'Tema'}</div>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: success }} />
      </div>
      {/* Profil mock */}
      <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full" style={{ background: `linear-gradient(${gAngle}deg, ${gFrom}, ${gTo})` }} />
          <div className="mt-1" style={{ color: textP, fontSize: 11, fontWeight: 700 }}>Murat Berxo</div>
          <div style={{ color: textT, fontSize: 9 }}>@muratb</div>
          <div className="mt-1 px-2 py-0.5 rounded-full" style={{ background: `linear-gradient(135deg, ${gPremiumFrom}, ${gPremiumTo})`, color: '#0F172A', fontSize: 8, fontWeight: 800 }}>PRO</div>
        </div>
        {/* Stat kartlar */}
        <div className="grid grid-cols-3 gap-1.5">
          {[{ n: 248, l: 'Takipçi', c: primary }, { n: 142, l: 'Takip', c: t.color_info || '#3B82F6' }, { n: 12, l: 'Oda', c: t.color_accent || '#FBBF24' }].map((s, i) => (
            <div key={i} className="rounded-md p-1.5 text-center" style={{ background: card, borderRadius: radiusMd, border: `1px solid ${border}` }}>
              <div style={{ color: s.c, fontSize: 12, fontWeight: 800 }}>{s.n}</div>
              <div style={{ color: textT, fontSize: 7 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* Buton */}
        <button type="button" className="w-full py-1.5"
          style={{ background: `linear-gradient(${gAngle}deg, ${gFrom}, ${gTo})`, color: '#FFF', borderRadius: radiusMd, fontSize: 10, fontWeight: 700 }}>
          Profili Düzenle
        </button>
        {/* Durum mesajı kartı */}
        <div className="rounded-md p-2" style={{ background: card, border: `1px solid ${border}`, borderRadius: radiusMd }}>
          <div style={{ color: textP, fontSize: 10, fontWeight: 700 }}>Durum</div>
          <div style={{ color: textS, fontSize: 9 }} className="mt-0.5">Bugün enerjik 🎵</div>
          <div className="flex gap-1 mt-1">
            <span className="px-1.5 py-0.5 rounded-full" style={{ background: success + '22', color: success, fontSize: 7, border: `1px solid ${success}55`, borderRadius: radiusPill }}>Aktif</span>
            <span className="px-1.5 py-0.5 rounded-full" style={{ background: danger + '22', color: danger, fontSize: 7, border: `1px solid ${danger}55`, borderRadius: radiusPill }}>Acil</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BadgePreviewMock({ item, badgeConfig, accent }: { item: Item; badgeConfig?: any; accent: string }) {
  const b = badgeConfig || {};
  const size = b.size || 32;
  const bg = b.bg_gradient_enabled
    ? `linear-gradient(${b.bg_gradient_angle || 135}deg, ${b.bg_gradient_from || accent}, ${b.bg_gradient_to || accent})`
    : (b.bg_color || accent);
  const tierLabel = b.tier_label_override || '';
  const tierLabelColor = b.tier_label_color || '#FFFFFF';
  const tierLabelSize = b.tier_label_font_size || 9;
  const shape = b.shape || 'circle';
  const radiusStyle: React.CSSProperties = (() => {
    switch (shape) {
      case 'circle': return { borderRadius: '50%' };
      case 'rounded-square': return { borderRadius: b.border_radius || 8 };
      case 'shield': return { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
      case 'star': return { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
      case 'diamond': return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
      case 'hexagon': return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
      case 'crown': return { clipPath: 'polygon(0 30%, 20% 30%, 25% 0%, 50% 30%, 75% 0%, 80% 30%, 100% 30%, 100% 100%, 0 100%)' };
      case 'gem': return { clipPath: 'polygon(20% 0%, 80% 0%, 100% 35%, 50% 100%, 0% 35%)' };
      default: return { borderRadius: '50%' };
    }
  })();
  const glowShadow = b.glow_enabled ? `0 0 ${b.glow_blur || 12}px ${b.glow_color || accent}${Math.round((b.glow_intensity || 0.5) * 255).toString(16).padStart(2, '0')}` : 'none';

  const renderBadge = (s: number) => (
    <div className="flex items-center justify-center font-black"
      style={{ width: s, height: s, background: bg, ...radiusStyle, boxShadow: glowShadow,
        color: tierLabelColor, fontSize: (s / 24) * tierLabelSize, textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        border: b.border_enabled ? `${b.border_width || 1}px ${b.border_style || 'solid'} ${b.border_color || '#FFF'}` : 'none',
      }}>
      {tierLabel || (b.icon_type === 'verified' ? '✓' : b.icon_type === 'crown' ? '♔' : b.icon_type === 'star' ? '★' : '')}
    </div>
  );

  return (
    <div className="flex flex-col h-full px-3 pt-3">
      <div className="text-[10px] text-slate-400 mb-2">Profil Avatar</div>
      {/* Avatar + rozet */}
      <div className="flex flex-col items-center py-2">
        <div className="relative" style={{ width: 80, height: 80 }}>
          <div className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500" style={{ width: 80, height: 80 }} />
          {b.visible_on_avatar !== false && (
            <div className="absolute" style={{
              ...({ topRight: { top: -2, right: -2 }, topLeft: { top: -2, left: -2 },
                    bottomRight: { bottom: -2, right: -2 }, bottomLeft: { bottom: -2, left: -2 },
                    inline: { display: 'none' } }[b.position || 'bottomRight'] as any),
              transform: `translate(${b.offset_x || 0}%, ${b.offset_y || 0}%)`,
              zIndex: b.z_index || 10,
            }}>
              {renderBadge(80 * (b.scale_on_avatar || 0.3))}
            </div>
          )}
        </div>
        <div className="mt-2 text-white text-xs font-bold flex items-center gap-1">
          Murat Berxo
          {b.visible_inline_with_name !== false && renderBadge(14)}
        </div>
        <div className="text-[9px] text-slate-400">@muratb</div>
      </div>
      {/* Mesaj listesi mock */}
      <div className="space-y-1 mt-2">
        {['Ali', 'Selin', 'Kemal'].map((n, i) => (
          <div key={n} className="flex items-center gap-1.5 bg-white/[0.04] rounded p-1.5">
            <div className="w-5 h-5 rounded-full bg-slate-700 relative">
              {i === 0 && b.visible_on_avatar !== false && (
                <div className="absolute -bottom-0.5 -right-0.5">{renderBadge(10)}</div>
              )}
            </div>
            <div className="text-[9px] text-white flex items-center gap-1">{n} {i === 1 && renderBadge(8)}</div>
          </div>
        ))}
      </div>
      <div className="text-[9px] text-slate-500 text-center mt-2">{item.name}</div>
    </div>
  );
}

function BackgroundPreviewMock({ item, bgConfig, grad, accent }: { item: Item; bgConfig?: any; grad: string; accent: string }) {
  const b = bgConfig || {};
  const bgStyle: React.CSSProperties = (() => {
    if (!bgConfig) return { background: grad };
    if (b.bg_type === 'solid') return { background: b.solid_color };
    if (b.bg_type === 'gradient') {
      const stops = (b.gradient_stops || []).map((s: string) => s.split(' ')[0]).join(', ');
      return { backgroundImage: `linear-gradient(${b.gradient_angle || 180}deg, ${stops || '#0F1926, #0A0F1A'})` };
    }
    if (b.bg_type === 'radial') return { backgroundImage: `radial-gradient(circle, ${b.radial_color_in}, ${b.radial_color_out})` };
    if (b.bg_type === 'image' && b.image_url) return {
      backgroundImage: `url(${b.image_url})`, backgroundSize: b.image_fit === 'tile' ? '80px' : 'cover',
      backgroundPosition: `${b.image_position_x || 50}% ${b.image_position_y || 50}%`,
      backgroundRepeat: b.image_fit === 'tile' ? 'repeat' : 'no-repeat',
    };
    return { background: b.fallback_color || '#0A0F1A' };
  })();
  const filter = bgConfig ? [
    b.brightness !== 1 && `brightness(${b.brightness})`,
    b.contrast !== 1 && `contrast(${b.contrast})`,
    b.saturation !== 1 && `saturate(${b.saturation})`,
    b.hue_rotate && `hue-rotate(${b.hue_rotate}deg)`,
    b.sepia && `sepia(${b.sepia})`,
    b.blur_enabled && `blur(${b.blur_amount || 0}px)`,
  ].filter(Boolean).join(' ') : '';
  return (
    <div className="relative h-full flex flex-col items-center justify-center">
      <div className="absolute inset-0" style={{ ...bgStyle, filter: filter || undefined }} />
      {bgConfig?.overlay_enabled && (
        <div className="absolute inset-0" style={{ background: b.overlay_color, opacity: b.overlay_opacity, mixBlendMode: b.overlay_blend_mode as any }} />
      )}
      {bgConfig?.vignette_enabled && (
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle, transparent 40%, ${b.vignette_color || '#000'} 100%)`, opacity: b.vignette_intensity }} />
      )}
      <div className="relative z-10 flex flex-col items-center text-center px-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-lg" />
        <div className="text-white text-xs font-bold mt-2 drop-shadow">Murat Berxo</div>
        <div className="text-white/70 text-[9px]">@muratb · Profil</div>
        <div className="mt-2 px-2 py-1 rounded-full bg-white/15 text-[9px] text-white border border-white/20 backdrop-blur">
          {item.name || 'Arkaplan'}
        </div>
      </div>
    </div>
  );
}

function DefaultPreview({ item, grad, accent }: { item: Item; grad: string; accent: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div
        className="w-32 h-32 rounded-2xl flex items-center justify-center overflow-hidden"
        style={{ background: grad, boxShadow: `0 0 40px ${accent}66` }}
      >
        <ItemLottiePreview itemId={item.id} assetUrl={item.asset_url} fallbackEmoji={item.art_emoji} size={128} />
      </div>
      <div className="mt-4 text-white font-bold text-sm text-center">{item.name}</div>
      {item.tagline && <div className="text-[10px] text-slate-400 text-center mt-1">{item.tagline}</div>}
      <div className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: `${accent}33`, color: accent, border: `1px solid ${accent}66` }}>
        {item.price_sp.toLocaleString('tr-TR')} SP
      </div>
    </div>
  );
}
