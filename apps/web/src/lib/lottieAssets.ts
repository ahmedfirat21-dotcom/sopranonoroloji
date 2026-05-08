/**
 * SopranoChat web admin — Lottie asset registry
 *
 * Mobile uygulamadaki giftLottieRegistry / frameLottieRegistry /
 * entryEffectLottieRegistry mapping'lerini birebir yansıtır. Aynı item
 * id mobilde Lottie X.json render ediyorsa burada da aynı dosya gösterilir.
 *
 * Public yol: /lottie/store/<dosya-adı>.json (apps/web/public/lottie/store).
 *
 * Yeni hediye/çerçeve eklerken: önce mobile'daki ilgili registry'e ekle,
 * sonra `assets/avatar_frames/<file>.json`'ı buradaki public klasörüne
 * kopyala ve aşağıdaki map'lere bir satır ekle. Böylece web admin yöneticisi
 * mobilde gerçekten gösterileni görür.
 */

const BASE = '/lottie/store/';

const GIFT_LOTTIE_MAP: Record<string, string> = {
  'gift-snow':       BASE + 'Loading Ring.json',
  'gift-volcano':    BASE + 'Fire.json',
  'gift-star':       BASE + 'Pro.json',
  'gift-sparkle':    BASE + 'Fireworks.json',
  'gift-fire':       BASE + 'Firery Passion.json',
  'gift-heart':      BASE + 'Heart characters crying.json',
  'gift-rose':       BASE + 'Rose1.json',
  'gift-anchor':     BASE + 'boat.json',
  'gift-dragon':     BASE + 'Dragon.json',
  'gift-trophy':     BASE + 'Trophy.json',
  'gift-car':        BASE + 'Car.json',
  'gift-cake':       BASE + 'Cake.json',
  'gift-diamond':    BASE + 'Red Diamond.json',
  'gift-rocket':     BASE + 'Rocket fly out the laptop.json',
  'gift-perfume':    BASE + 'perfume.json',
  'gift-crown':      BASE + 'Crown.json',
  'gift-teddy':      BASE + 'Teddy Bear.json',
  'gift-butterfly':  BASE + 'Butterfly.json',
  'gift-unicorn':    BASE + 'Unicorn.json',
  'gift-guitar':     BASE + 'Guitar.json',
  'gift-airplane':   BASE + 'Airplane.json',
  'gift-castle':     BASE + 'Castle.json',
  'gift-money':      BASE + 'Money Rain.json',
  'gift-gem':        BASE + 'Gem.json',
  'gift-confetti':   BASE + 'Confetti.json',
  'gift-balloon':    BASE + 'Balloon.json',
  'gift-sunglasses': BASE + 'Sunglasses.json',
  'gift-sparkles':   BASE + 'Sparkles.json',
  'gift-shooting':   BASE + 'Shooting Star.json',
  'gift-love':       BASE + 'Love Letter.json',
  'gift-celebrate':  BASE + 'Celebration.json',
  'gift-lion':       BASE + 'Lion Running.json',
  'gift-kiss':       BASE + 'Kiss of the heart.json',
  // gift-bolt: Lottie yok (mobile'da emoji fallback) — burada da emoji düşer
};

const FRAME_LOTTIE_MAP: Record<string, string> = {
  'aurelius':           BASE + 'Avatar frame.json',
  'lunaris':            BASE + 'Avatar-Frame1.json',
  'rose-eternel':       BASE + 'Avatar_Frame2.json',
  'cadence-soprano':    BASE + 'Profile Frame.json',
  'soprano-aura':       BASE + 'SopranoAura.json',
  'midnight-amethyst':  BASE + 'MidnightAmethyst.json',
  'sunrise-gold':       BASE + 'SunriseGold.json',
  'ocean-pearl':        BASE + 'OceanPearl.json',
  'ruby-flame':         BASE + 'RubyFlame.json',
  'neon-pulse':         BASE + 'NeonPulse.json',
  'celestial-orbit':    BASE + 'CelestialOrbit.json',
  'hex-prism':          BASE + 'HexPrism.json',
  'pulse-wave':         BASE + 'PulseWave.json',
  'eclipse-corona':     BASE + 'EclipseCorona.json',
  'glitch-matrix':      BASE + 'GlitchMatrix.json',
};

const ENTRY_EFFECT_LOTTIE_MAP: Record<string, string> = {
  'constellation':  BASE + 'Fireworks.json',
  'or-ancien':      BASE + 'Star Strike Emoji.json',
  'inferno':        BASE + 'Fire.json',
  'voltaire':       BASE + 'Shooting Star.json',
  'belle-epoque':   BASE + 'Heart characters crying.json',
  'ai-spark':       BASE + 'AI_Spark.json',
};

/**
 * Bir cosmetic item id'sine bakıp mobilde hangi Lottie gösteriliyorsa
 * o dosyanın public URL'sini döner. Yoksa null.
 */
export function getItemLottieUrl(itemId: string): string | null {
  return (
    GIFT_LOTTIE_MAP[itemId] ||
    FRAME_LOTTIE_MAP[itemId] ||
    ENTRY_EFFECT_LOTTIE_MAP[itemId] ||
    null
  );
}

export function hasItemLottie(itemId: string): boolean {
  return getItemLottieUrl(itemId) !== null;
}
