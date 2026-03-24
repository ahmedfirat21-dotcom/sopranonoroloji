import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

// ═══════════════════════════════════════════════════════
// LiveKit Token API — /api/livekit/get-token
//
// SopranoChat Yetki/Vize Sistemine Uyumlu Token Üretimi
// Vercel Serverless Function olarak çalışır.
//
// Kullanım:
//   GET  /api/livekit/get-token?roomName=xxx&participantName=yyy&role=listener
//   POST /api/livekit/get-token  { roomName, participantName, role }
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────
// Rol tanımları
// ─────────────────────────────────────────────────────
type ParticipantRole = 'owner' | 'speaker' | 'listener';

const VALID_ROLES: ParticipantRole[] = ['owner', 'speaker', 'listener'];

/**
 * Gelen role'a göre LiveKit VideoGrant yetkilerini döndürür.
 *
 * - owner    → Tam yetki (publish + subscribe + publishData)
 * - speaker  → Konuşabilir (publish + subscribe)
 * - listener → Sadece dinler (subscribe only)
 */
function getGrantsForRole(role: ParticipantRole, roomName: string) {
  const baseGrant = {
    roomJoin: true,
    room: roomName,
  };

  switch (role) {
    case 'owner':
      return {
        ...baseGrant,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      };

    case 'speaker':
      return {
        ...baseGrant,
        canPublish: true,
        canSubscribe: true,
        canPublishData: false,
      };

    case 'listener':
      return {
        ...baseGrant,
        canPublish: false,
        canSubscribe: true,
        canPublishData: false,
      };

    default:
      // Fallback: listener (en düşük yetki)
      return {
        ...baseGrant,
        canPublish: false,
        canSubscribe: true,
        canPublishData: false,
      };
  }
}

// ─────────────────────────────────────────────────────
// Token üretim mantığı
// ─────────────────────────────────────────────────────
async function generateToken(
  roomName: string,
  participantName: string,
  role: ParticipantRole,
) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('LIVEKIT_API_KEY veya LIVEKIT_API_SECRET yapılandırılmamış');
  }

  // AccessToken oluştur
  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    name: participantName,
    // Token süresi: 6 saat
    ttl: '6h',
  });

  // Role dayalı yetkileri ekle
  const grants = getGrantsForRole(role, roomName);
  token.addGrant(grants);

  // Metadata olarak rol bilgisini ekle (frontend'de kullanılabilir)
  token.metadata = JSON.stringify({ role });

  const jwt = await token.toJwt();

  return {
    token: jwt,
    identity: participantName,
    room: roomName,
    role,
    grants: {
      canPublish: grants.canPublish,
      canSubscribe: grants.canSubscribe,
      canPublishData: grants.canPublishData ?? false,
    },
  };
}

// ─────────────────────────────────────────────────────
// Parametre çıkarma ve doğrulama
// ─────────────────────────────────────────────────────
function extractAndValidateParams(params: {
  roomName?: string | null;
  participantName?: string | null;
  role?: string | null;
}) {
  const { roomName, participantName, role } = params;

  // Zorunlu alanlar
  if (!roomName || !participantName) {
    return {
      error: 'roomName ve participantName alanları zorunludur',
      status: 400,
    };
  }

  // roomName doğrulama (alfanumerik + tire/alt çizgi, 3-64 karakter)
  if (roomName.length < 3 || roomName.length > 64) {
    return {
      error: 'roomName 3-64 karakter uzunluğunda olmalıdır',
      status: 400,
    };
  }

  // participantName doğrulama
  if (participantName.length < 1 || participantName.length > 64) {
    return {
      error: 'participantName 1-64 karakter uzunluğunda olmalıdır',
      status: 400,
    };
  }

  // Role doğrulama — belirtilmezse 'listener' olarak kabul et
  const resolvedRole = (role || 'listener') as ParticipantRole;
  if (!VALID_ROLES.includes(resolvedRole)) {
    return {
      error: `Geçersiz rol. Geçerli roller: ${VALID_ROLES.join(', ')}`,
      status: 400,
    };
  }

  return {
    roomName,
    participantName,
    role: resolvedRole,
  };
}

// ═══════════════════════════════════════════════════════
// GET Handler
// ═══════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const validation = extractAndValidateParams({
      roomName: searchParams.get('roomName'),
      participantName: searchParams.get('participantName'),
      role: searchParams.get('role'),
    });

    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    const result = await generateToken(
      validation.roomName,
      validation.participantName,
      validation.role,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[LiveKit Token Error]', err);
    return NextResponse.json(
      { error: err.message || 'Token üretilirken hata oluştu' },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════
// POST Handler
// ═══════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: 'Geçersiz JSON body' },
        { status: 400 },
      );
    }

    const validation = extractAndValidateParams({
      roomName: body.roomName,
      participantName: body.participantName,
      role: body.role,
    });

    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status },
      );
    }

    const result = await generateToken(
      validation.roomName,
      validation.participantName,
      validation.role,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[LiveKit Token Error]', err);
    return NextResponse.json(
      { error: err.message || 'Token üretilirken hata oluştu' },
      { status: 500 },
    );
  }
}
