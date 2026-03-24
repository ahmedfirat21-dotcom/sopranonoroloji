import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// ═══════════════════════════════════════════════════════
// GET /api/rooms/discover
//
// Keşfet ekranı için trend odalar + radar kullanıcıları.
// Odalar: katılımcı sayısına ve oluşturulma tarihine göre.
// Radar: en aktif kullanıcılar (puan sıralaması).
// ═══════════════════════════════════════════════════════

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Trend odalar — katılımcı sayısına göre sırala
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: [
        { currentParticipants: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 20,
      include: {
        owner: {
          select: {
            displayName: true,
            avatarUrl: true,
            points: true,
          },
        },
      },
    });

    const trendRooms = rooms.map((r, i) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      ownerDisplayName: r.owner?.displayName || 'Anonim',
      ownerAvatarUrl: r.owner?.avatarUrl || null,
      maxCapacity: r.maxParticipants,
      currentParticipants: r.currentParticipants,
      isPrivate: r.isPrivate,
      tags: r.tags,
      createdAt: r.createdAt?.toISOString(),
      // Otomatik badge hesapla
      badge: r.currentParticipants > (r.maxParticipants * 0.7) ? 'hot'
        : i < 3 ? 'trend'
        : (Date.now() - new Date(r.createdAt).getTime()) < 86400000 ? 'new'
        : 'standard',
    }));

    // Radar kullanıcıları — en yüksek puanlı aktif kullanıcılar
    const topUsers = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: 6,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        points: true,
        isPremium: true,
      },
    });

    const radarUsers = topUsers.map((u, i) => ({
      id: u.id,
      name: u.displayName || 'Kullanıcı',
      avatar: u.avatarUrl,
      initials: (u.displayName || 'K')
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      ring: i < 2 ? 1 : i < 4 ? 2 : 3,
      angle: (i * 60) + 30,
      tier: u.isPremium ? 'gold' as const : u.points > 1000 ? 'silver' as const : 'standard' as const,
    }));

    return NextResponse.json(
      { rooms: trendRooms, radarUsers },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[Discover API Error]', err);
    return NextResponse.json(
      { error: err.message || 'Keşfet verileri yüklenirken hata oluştu' },
      { status: 500 },
    );
  }
}
