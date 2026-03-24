import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// ═══════════════════════════════════════════════════════
// GET /api/notifications
//
// Kullanıcının bildirimlerini getir.
// Query: ?userId=xxx&limit=30
// ═══════════════════════════════════════════════════════

const prisma = new PrismaClient();

// Bildirim formatı — şimdilik hediye işlemlerinden ve oda etkinliklerinden
// otomatik bildirimler üretiyoruz.
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}sn`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  return `${days}g`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parametresi gerekli' },
        { status: 400 },
      );
    }

    // Bildirim kaynakları:
    // 1. Alınan hediyeler (GiftTransaction receiverId = userId)
    // 2. Oda davetleri (vb — gelecekte genişletilebilir)

    // Şimdilik hediye bildirimlerini çek
    const giftNotifications = await prisma.giftTransaction.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: { displayName: true, avatarUrl: true },
        },
        gift: {
          select: { name: true, price: true },
        },
      },
    });

    const result = giftNotifications.map((tx) => ({
      id: tx.id,
      type: 'gift',
      fromName: tx.sender?.displayName || 'Anonim',
      message: `sana ${tx.gift?.name || 'hediye'} gönderdi`,
      time: timeAgo(tx.createdAt),
      isRead: true, // Şimdilik hepsi okunmuş
      fromAvatar: tx.sender?.avatarUrl || null,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[Notifications Error]', err);
    return NextResponse.json(
      { error: err.message || 'Bildirimler yüklenirken hata oluştu' },
      { status: 500 },
    );
  }
}
