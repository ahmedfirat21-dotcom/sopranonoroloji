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

export default function MobilePreview({ item }: { item: Item }) {
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
              {item.category === 'glow_message' && <GlowMessagePreview item={item} grad={grad} accent={accent} />}
              {!['frames', 'entry_effect', 'gift', 'glow_message'].includes(item.category) && (
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

function GlowMessagePreview({ item, grad, accent }: { item: Item; grad: string; accent: string }) {
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
