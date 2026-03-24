import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

// ═══════════════════════════════════════════════════════
// Ekonomi Motoru — /api/economy/buy-visa
//
// SopranoChat Mikrofon Vizesi Satın Alma API'si
// Atomik (ACID) Transaction ile çalışır.
//
// POST /api/economy/buy-visa
// Body: { userId: string, roomId: string, tenantId: string }
//
// İş Akışı:
//   1. User & Room doğrulama
//   2. Bakiye kontrolü
//   3. Atomic Transaction:
//      a) Alıcı bakiyesinden düş
//      b) %70 oda sahibine aktar
//      c) Participant rolünü SPEAKER yap
//      d) EconomyTransaction kaydı oluştur
//   4. Başarılı yanıt + güncel bakiye
// ═══════════════════════════════════════════════════════

const prisma = new PrismaClient();

// Komisyon oranı: Platform %30 keser, Oda sahibi %70 alır
const OWNER_SHARE_RATE = 0.70;
const PLATFORM_COMMISSION_RATE = 0.30;

export async function POST(req: NextRequest) {
  try {
    // ─── 1. Body Parse ───
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz JSON body' },
        { status: 400 },
      );
    }

    const { userId, roomId, tenantId } = body;

    if (!userId || !roomId) {
      return NextResponse.json(
        { success: false, error: 'userId ve roomId alanları zorunludur' },
        { status: 400 },
      );
    }

    // ─── 2. User & Room Doğrulama ───
    const [user, room] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.room.findUnique({
        where: { id: roomId },
        include: { owner: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 404 },
      );
    }

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Loca bulunamadı' },
        { status: 404 },
      );
    }

    if (!room.ownerId || !room.owner) {
      return NextResponse.json(
        { success: false, error: 'Bu locanın bir sahibi yok' },
        { status: 400 },
      );
    }

    // Kendi odasında vize almaya gerek yok
    if (room.ownerId === userId) {
      return NextResponse.json(
        { success: false, error: 'Loca sahibi zaten tam yetkiye sahip' },
        { status: 400 },
      );
    }

    // ─── 3. Bakiye Kontrolü ───
    const visaPrice = room.speakerVisaPrice;
    const userBalance = Number(user.balance);

    if (userBalance < visaPrice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Yetersiz bakiye',
          required: visaPrice,
          current: userBalance,
          deficit: visaPrice - userBalance,
        },
        { status: 400 },
      );
    }

    // ─── 4. Atomic Transaction ───
    const ownerShare = Math.floor(visaPrice * OWNER_SHARE_RATE);
    const platformCommission = visaPrice - ownerShare;

    const result = await prisma.$transaction(async (tx) => {
      // 4a. Alıcının cüzdanından düş
      const updatedBuyer = await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: new Prisma.Decimal(visaPrice),
          },
        },
      });

      // Double-check: bakiye negatife düşmüş mü?
      if (Number(updatedBuyer.balance) < 0) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      // 4b. Oda sahibine %70 ekle
      const updatedOwner = await tx.user.update({
        where: { id: room.ownerId! },
        data: {
          balance: {
            increment: new Prisma.Decimal(ownerShare),
          },
        },
      });

      // 4c. Participant rolünü SPEAKER yap
      // Önce mevcut participant kaydını bul
      const existingParticipant = await tx.participant.findFirst({
        where: {
          userId: userId,
          roomId: roomId,
          isActive: true,
        },
      });

      if (existingParticipant) {
        // Mevcut kaydı güncelle
        await tx.participant.update({
          where: { id: existingParticipant.id },
          data: { role: 'SPEAKER' },
        });
      } else {
        // Yeni participant kaydı oluştur
        await tx.participant.create({
          data: {
            userId,
            roomId,
            role: 'SPEAKER',
            isActive: true,
            isMicOn: true,
          },
        });
      }

      // 4d. EconomyTransaction kaydı
      const transaction = await tx.economyTransaction.create({
        data: {
          tenantId: tenantId || user.tenantId,
          senderId: userId,
          receiverId: room.ownerId!,
          roomId,
          amount: new Prisma.Decimal(visaPrice),
          commission: new Prisma.Decimal(platformCommission),
          type: 'VISA_PURCHASE',
          description: `${user.displayName} → ${room.name} mikrofon vizesi`,
          metadata: {
            visaPrice,
            ownerShare,
            platformCommission,
            buyerName: user.displayName,
            roomName: room.name,
            ownerName: room.owner!.displayName,
          },
        },
      });

      return {
        transactionId: transaction.id,
        buyerBalance: Number(updatedBuyer.balance),
        ownerBalance: Number(updatedOwner.balance),
        ownerShare,
        platformCommission,
      };
    });

    // ─── 5. Başarılı Yanıt ───
    return NextResponse.json(
      {
        success: true,
        message: 'Mikrofon vizesi başarıyla satın alındı',
        data: {
          transactionId: result.transactionId,
          newRole: 'speaker',
          walletBalance: result.buyerBalance,
          payment: {
            total: visaPrice,
            ownerReceived: result.ownerShare,
            platformCommission: result.platformCommission,
          },
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[Buy Visa Error]', err);

    if (err.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(
        { success: false, error: 'Yetersiz bakiye (race condition koruması)' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: err.message || 'Vize işlemi sırasında hata oluştu' },
      { status: 500 },
    );
  }
}
