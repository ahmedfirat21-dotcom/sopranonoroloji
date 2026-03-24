import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// ═══════════════════════════════════════════════════════
// POST /api/rooms/create
//
// Yeni oda (Loca) oluşturma
// Body: { name, category, maxParticipants, speakerVisaPrice, ownerId, tenantId }
// ═══════════════════════════════════════════════════════

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ğüşöçı\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz JSON body' },
        { status: 400 },
      );
    }

    const { name, category, maxParticipants, speakerVisaPrice, ownerId, tenantId } = body;

    if (!name || !ownerId) {
      return NextResponse.json(
        { success: false, error: 'name ve ownerId alanları zorunludur' },
        { status: 400 },
      );
    }

    // Owner doğrulama
    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 },
      );
    }

    const resolvedTenantId = tenantId || owner.tenantId;

    // Slug oluştur (benzersiz olacak şekilde)
    const baseSlug = slugify(name) || 'loca';
    let slug = baseSlug;
    let counter = 0;
    
    while (true) {
      const existing = await prisma.room.findUnique({
        where: { tenantId_slug: { tenantId: resolvedTenantId, slug } },
      });
      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Room oluştur
    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        slug,
        category: category || 'general',
        maxParticipants: maxParticipants || 8,
        speakerVisaPrice: speakerVisaPrice || 500,
        ownerId,
        tenantId: resolvedTenantId,
        status: 'ACTIVE',
        isPublic: true,
      },
      include: {
        owner: {
          select: { displayName: true, avatarUrl: true },
        },
      },
    });

    // Sahibini HOST olarak odaya ekle
    await prisma.participant.create({
      data: {
        userId: ownerId,
        roomId: room.id,
        role: 'HOST',
        isActive: true,
        isMicOn: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        room: {
          id: room.id,
          name: room.name,
          slug: room.slug,
          category: room.category,
          maxParticipants: room.maxParticipants,
          speakerVisaPrice: room.speakerVisaPrice,
          ownerDisplayName: room.owner?.displayName,
          ownerAvatarUrl: room.owner?.avatarUrl,
          status: room.status,
          createdAt: room.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('[Room Create Error]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Oda oluşturulurken hata oluştu' },
      { status: 500 },
    );
  }
}
