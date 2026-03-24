import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// ═══════════════════════════════════════════════════════
// GET /api/rooms/public
//
// Herkese açık aktif odaları listele
// Query: ?tenantId=xxx (opsiyonel)
// ═══════════════════════════════════════════════════════

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    const where: any = {
      isPublic: true,
      status: { in: ['ACTIVE', 'WAITING'] },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        owner: {
          select: { displayName: true, avatarUrl: true },
        },
        _count: {
          select: {
            participants: { where: { isActive: true } },
          },
        },
      },
    });

    const result = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      slug: room.slug,
      description: room.description,
      ownerDisplayName: room.owner?.displayName || 'Anonim',
      ownerAvatarUrl: room.owner?.avatarUrl || null,
      maxCapacity: room.maxParticipants || 10,
      currentParticipants: room._count.participants,
      isPrivate: !room.isPublic,
      tags: [room.category || 'general'],
      createdAt: room.createdAt.toISOString(),
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[Rooms Public Error]', err);
    return NextResponse.json(
      { error: err.message || 'Odalar listelenirken hata oluştu' },
      { status: 500 },
    );
  }
}
