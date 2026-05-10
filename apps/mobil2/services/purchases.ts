// ═══════════════════════════════════════════════════════
// SopranoChat — In-App Purchase Servisi
//
// RevenueCat SDK wrapper — initialize, login, offerings,
// purchase ve bakiye senkronizasyonu.
//
// NOT: RevenueCat SDK henüz yüklenmediğinde graceful
//      fallback sağlar (build kırmaz).
// ═══════════════════════════════════════════════════════

const BASE_URL = 'https://sopranochat.com';

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

export interface CoinPackageOffering {
  id: string;            // RevenueCat product id (coin_100, coin_500 vb.)
  coins: number;         // Jeton miktarı
  bonusPercent: number;  // Bonus yüzdesi
  price: string;         // Yerel para formatı (₺29.99)
  priceAmount: number;   // Sayısal fiyat
  currencyCode: string;  // TRY, USD vb.
  popular?: boolean;     // Öne çıkan paket
  packageRC?: any;       // RevenueCat Package objesi (SDK aktifse)
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

export interface BalanceInfo {
  balance: number;
  lastUpdated: string;
}

// ─────────────────────────────────────────────────────
// Fallback (Statik) Paketler
// Mağaza bağlantısı kurulamazsa bunları göster
// ─────────────────────────────────────────────────────

const FALLBACK_PACKAGES: CoinPackageOffering[] = [
  { id: 'coin_100',   coins: 100,   bonusPercent: 0,  price: '₺29.99',    priceAmount: 29.99,   currencyCode: 'TRY' },
  { id: 'coin_500',   coins: 500,   bonusPercent: 10, price: '₺99.99',    priceAmount: 99.99,   currencyCode: 'TRY', popular: true },
  { id: 'coin_1000',  coins: 1000,  bonusPercent: 15, price: '₺179.99',   priceAmount: 179.99,  currencyCode: 'TRY' },
  { id: 'coin_2500',  coins: 2500,  bonusPercent: 20, price: '₺399.99',   priceAmount: 399.99,  currencyCode: 'TRY' },
  { id: 'coin_5000',  coins: 5000,  bonusPercent: 25, price: '₺699.99',   priceAmount: 699.99,  currencyCode: 'TRY' },
  { id: 'coin_10000', coins: 10000, bonusPercent: 35, price: '₺1,199.99', priceAmount: 1199.99, currencyCode: 'TRY' },
];

// SDK yüklü mü?
let Purchases: any = null;
let isSDKConfigured = false;

// ─────────────────────────────────────────────────────
// SDK Initialization
// ─────────────────────────────────────────────────────

export async function initializePurchases(apiKey: string): Promise<boolean> {
  try {
    // Dinamik import — build kırmadan SDK kontrolü
    // @ts-ignore
    const rc = await import('react-native-purchases').catch(() => null);
    if (!rc) {
      console.warn('[Purchases] react-native-purchases yüklü değil, fallback modu aktif');
      return false;
    }

    Purchases = rc.default || rc;
    Purchases.configure({ apiKey });
    isSDKConfigured = true;
    console.log('[Purchases] ✅ RevenueCat SDK yapılandırıldı');
    return true;
  } catch (err) {
    console.warn('[Purchases] SDK init hatası:', err);
    return false;
  }
}

// ─────────────────────────────────────────────────────
// SDK Login — Kullanıcıyı tanıt
// ─────────────────────────────────────────────────────

export async function loginUser(userId: string): Promise<void> {
  if (!isSDKConfigured || !Purchases) return;

  try {
    await Purchases.logIn(userId);
    console.log(`[Purchases] ✅ Kullanıcı giriş yaptı: ${userId}`);
  } catch (err) {
    console.warn('[Purchases] Login hatası:', err);
  }
}

// ─────────────────────────────────────────────────────
// Offerings — Mağazadan paketleri çek
// ─────────────────────────────────────────────────────

export async function getOfferings(): Promise<CoinPackageOffering[]> {
  if (!isSDKConfigured || !Purchases) {
    console.log('[Purchases] Fallback paketler kullanılıyor');
    return FALLBACK_PACKAGES;
  }

  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current || !offerings.current.availablePackages?.length) {
      console.warn('[Purchases] Mağazada teklif bulunamadı, fallback kullanılıyor');
      return FALLBACK_PACKAGES;
    }

    const packages: CoinPackageOffering[] = offerings.current.availablePackages.map(
      (pkg: any) => {
        const product = pkg.product;
        const productId = product.identifier;
        const fallback = FALLBACK_PACKAGES.find((f) => f.id === productId);

        return {
          id: productId,
          coins: fallback?.coins || 0,
          bonusPercent: fallback?.bonusPercent || 0,
          price: product.priceString || fallback?.price || '?',
          priceAmount: product.price || fallback?.priceAmount || 0,
          currencyCode: product.currencyCode || 'TRY',
          popular: fallback?.popular || false,
          packageRC: pkg,
        };
      },
    );

    // coins'e göre sırala
    packages.sort((a, b) => a.coins - b.coins);
    return packages;
  } catch (err) {
    console.warn('[Purchases] Offerings hatası:', err);
    return FALLBACK_PACKAGES;
  }
}

// ─────────────────────────────────────────────────────
// Purchase — Satın al
// ─────────────────────────────────────────────────────

export async function purchasePackage(
  offering: CoinPackageOffering,
): Promise<PurchaseResult> {
  if (!isSDKConfigured || !Purchases || !offering.packageRC) {
    // SDK yoksa simüle et (test modunda)
    console.log('[Purchases] SDK yok — satın alma simüle ediliyor');
    return simulatePurchase(offering);
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(offering.packageRC);
    console.log(`[Purchases] ✅ Satın alma başarılı: ${offering.id}`);
    return { success: true };
  } catch (err: any) {
    if (err.userCancelled) {
      return { success: false, cancelled: true, error: 'Satın alma iptal edildi' };
    }
    return { success: false, error: err.message || 'Satın alma başarısız' };
  }
}

// ─────────────────────────────────────────────────────
// Simülasyon (Test & Development)
// ─────────────────────────────────────────────────────

async function simulatePurchase(
  offering: CoinPackageOffering,
): Promise<PurchaseResult> {
  // 2 saniye gecikme simüle et
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // %90 başarı oranı
  if (Math.random() > 0.1) {
    return { success: true };
  }
  return { success: false, error: 'Ödeme sağlayıcısına ulaşılamadı' };
}

// ─────────────────────────────────────────────────────
// Bakiye Senkronizasyonu — API'den güncel bakiyeyi çek
// ─────────────────────────────────────────────────────

export async function fetchBalance(userId: string): Promise<BalanceInfo | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/economy/balance?userId=${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      balance: data.balance ?? 0,
      lastUpdated: data.lastUpdated ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
