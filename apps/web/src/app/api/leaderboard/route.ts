import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// ═══════════════════════════════════════════════════════
// GET /api/leaderboard
//
// Kullanıcıları puana göre sırala.
// Query: ?tenantId=xxx&type=points|gifts|duels&limit=50
// ═══════════════════════════════════════════════════════

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const type = searchParams.get('type') || 'points';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    // Sıralama türüne göre orderBy belirle
    let orderBy: Record<string, 'desc'> = { points: 'desc' };
    if (type === 'gifts') {
      orderBy = { totalGiftsSent: 'desc' };
    } else if (type === 'duels') {
      orderBy = { duelWins: 'desc' };
    }

    const where: any = {
      isBanned: false,
    };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy,
      take: limit,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        points: true,
        totalGiftsSent: true,
        totalGiftsReceived: true,
        duelWins: true,
        duelLosses: true,
        isPremium: true,
        role: true,
        isOnline: true,
      },
    });

    const result = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.displayName,
      avatar: user.avatarUrl,
      points: user.points,
      giftsSent: user.totalGiftsSent,
      giftsReceived: user.totalGiftsReceived,
      duelWins: user.duelWins,
      duelLosses: user.duelLosses,
      isPremium: user.isPremium,
      role: user.role,
      isOnline: user.isOnline,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[Leaderboard Error]', err);
    return NextResponse.json(
      { error: err.message || 'Sıralama yüklenirken hata oluştu' },
      { status: 500 },
    );
  }
}
