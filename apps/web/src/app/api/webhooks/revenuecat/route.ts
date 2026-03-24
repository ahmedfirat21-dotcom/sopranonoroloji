import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { createHmac } from 'crypto';

// ═══════════════════════════════════════════════════════
// RevenueCat Webhook — /api/webhooks/revenuecat
//
// Güvenli ödeme doğrulama ve jeton yükleme endpoint'i.
// RevenueCat'ten gelen webhook event'lerini işler.
//
// Güvenlik:
//   - Authorization header ile Bearer token doğrulama
//   - Geçerli event type kontrolü
//   - Atomic transaction (ACID)
//   - Sahte fiş koruması (server-side doğrulama)
// ═══════════════════════════════════════════════════════

const prisma = new PrismaClient();

// RevenueCat Webhook Auth Secret (Vercel env'den çekilir)
const WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET || '';

// ─────────────────────────────────────────────────────
// Paket ID → Jeton Miktarı Eşleştirmesi
// ─────────────────────────────────────────────────────
const PACKAGE_COIN_MAP: Record<string, { coins: number; bonusPercent: number }> = {
  'coin_100':   { coins: 100,   bonusPercent: 0 },
  'coin_500':   { coins: 500,   bonusPercent: 10 },
  'coin_1000':  { coins: 1000,  bonusPercent: 15 },
  'coin_2500':  { coins: 2500,  bonusPercent: 20 },
  'coin_5000':  { coins: 5000,  bonusPercent: 25 },
  'coin_10000': { coins: 10000, bonusPercent: 35 },
};

// ─────────────────────────────────────────────────────
// Geçerli webhook event tipleri
// ─────────────────────────────────────────────────────
const PROCESSABLE_EVENTS = [
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
  'RENEWAL',
];

// ─────────────────────────────────────────────────────
// Webhook Secret Doğrulama
// ─────────────────────────────────────────────────────
function verifyWebhookSecret(authHeader: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('[Webhook] REVENUECAT_WEBHOOK_SECRET yapılandırılmamış');
    return false;
  }

  if (!authHeader) return false;

  // Format: "Bearer <secret>"
  const token = authHeader.replace('Bearer ', '').trim();
  return token === WEBHOOK_SECRET;
}

// ═══════════════════════════════════════════════════════
// POST Handler
// ═══════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    // ─── 1. Secret Doğrulama ───
    const authHeader = req.headers.get('authorization');
    if (!verifyWebhookSecret(authHeader)) {
      console.error('[Webhook] Yetkisiz erişim denemesi');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // ─── 2. Payload Parse ───
    const payload = await req.json().catch(() => null);
    if (!payload || !payload.event) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 },
      );
    }

    const { event } = payload;
    const eventType: string = event.type;

    // Sadece satın alma event'lerini işle
    if (!PROCESSABLE_EVENTS.includes(eventType)) {
      // Diğer event'ler (CANCELLATION, EXPIRATION vb.) için 200 dön
      return NextResponse.json({ received: true, processed: false, reason: `Event type ${eventType} skipped` });
    }

    // ─── 3. Veri Çıkarma ───
    const appUserId: string | undefined = event.app_user_id;
    const productId: string | undefined = event.product_id;
    const priceInPurchasedCurrency: number | undefined = event.price_in_purchased_currency;
    const currency: string | undefined = event.currency;
    const transactionId: string | undefined = event.transaction_id;
    const environment: string | undefined = event.environment; // PRODUCTION | SANDBOX

    if (!appUserId || !productId) {
      return NextResponse.json(
        { error: 'Missing app_user_id or product_id' },
        { status: 400 },
      );
    }

    // ─── 4. Paket Eşleştirme ───
    const packageInfo = PACKAGE_COIN_MAP[productId];
    if (!packageInfo) {
      console.error(`[Webhook] Bilinmeyen product_id: ${productId}`);
      return NextResponse.json(
        { error: `Unknown product_id: ${productId}` },
        { status: 400 },
      );
    }

    // Bonus hesapla
    const baseCoins = packageInfo.coins;
    const bonusCoins = Math.floor(baseCoins * (packageInfo.bonusPercent / 100));
    const totalCoins = baseCoins + bonusCoins;

    // ─── 5. Kullanıcı Doğrulama ───
    const user = await prisma.user.findUnique({
      where: { id: appUserId },
    });

    if (!user) {
      console.error(`[Webhook] Kullanıcı bulunamadı: ${appUserId}`);
      return NextResponse.json(
        { error: `User not found: ${appUserId}` },
        { status: 404 },
      );
    }

    // ─── 6. Duplikasyon Kontrolü (Aynı transaction tekrar gelmesin) ───
    if (transactionId) {
      const existing = await prisma.economyTransaction.findFirst({
        where: {
          metadata: {
            path: ['transactionId'],
            equals: transactionId,
          },
        },
      });

      if (existing) {
        console.warn(`[Webhook] Duplike transaction tespit edildi: ${transactionId}`);
        return NextResponse.json({ received: true, processed: false, reason: 'Duplicate transaction' });
      }
    }

    // ─── 7. Atomic Transaction ───
    const result = await prisma.$transaction(async (tx) => {
      // Bakiye güncelle
      const updatedUser = await tx.user.update({
        where: { id: appUserId },
        data: {
          balance: {
            increment: new Prisma.Decimal(totalCoins),
          },
        },
      });

      // EconomyTransaction kaydı
      const economyTx = await tx.economyTransaction.create({
        data: {
          tenantId: user.tenantId,
          senderId: appUserId,
          // receiverId yok — kendi cüzdanına yükleme
          amount: new Prisma.Decimal(totalCoins),
          type: 'TOP_UP',
          description: `${baseCoins} + ${bonusCoins} bonus jeton yüklendi (${productId})`,
          metadata: {
            productId,
            transactionId: transactionId || null,
            baseCoins,
            bonusCoins,
            totalCoins,
            priceInPurchasedCurrency: priceInPurchasedCurrency || null,
            currency: currency || 'TRY',
            environment: environment || 'PRODUCTION',
            eventType,
            processedAt: new Date().toISOString(),
          },
        },
      });

      return {
        newBalance: Number(updatedUser.balance),
        transactionId: economyTx.id,
        coinsAdded: totalCoins,
      };
    });

    console.log(`[Webhook] ✅ ${appUserId}: +${result.coinsAdded} jeton (bakiye: ${result.newBalance})`);

    return NextResponse.json({
      received: true,
      processed: true,
      data: {
        userId: appUserId,
        coinsAdded: result.coinsAdded,
        newBalance: result.newBalance,
        transactionId: result.transactionId,
      },
    });
  } catch (err: any) {
    console.error('[Webhook Error]', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
