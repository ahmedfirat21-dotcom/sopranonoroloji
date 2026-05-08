// SopranoChat web admin — Push send endpoint
// v110.18 (8 May 2026): Expo Push API kaldırıldı, Supabase edge function'a delegate edildi.
// Edge fn (send-push) FCM V1 doğrudan gönderim + stale token temizliği yapıyor.
//
// Audience modları:
// - 'all': tüm distinct user_id'lere
// - 'tier': belirli subscription_tier kullanıcılarına
// - 'user': tek kullanıcıya (UID ya da username/@username)
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/admin/audit';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

/**
 * Input UID mi yoksa username mi anlamaya çalış. UID değilse profiles.username'de ara.
 * Firebase UID'leri 28 karakter alphanumeric. Username genelde daha kısa veya `@` ile başlar.
 */
async function resolveUserId(input: string): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // UID görünüm: 28 char alphanumeric (Firebase) — direkt kullan
  if (/^[A-Za-z0-9]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  // Username olarak ara (@ varsa kaldır)
  const username = trimmed.replace(/^@+/, '').toLowerCase();
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle();
  return data?.id ?? null;
}

async function loadTargetUserIds(audience: string, tier: string | null, userId: string | null): Promise<string[]> {
  if (audience === 'user' && userId) {
    const resolved = await resolveUserId(userId);
    return resolved ? [resolved] : [];
  }

  if (audience === 'tier' && tier) {
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('subscription_tier', tier);
    return (users || []).map(u => u.id);
  }

  // 'all' broadcast — push_tokens'taki distinct user_id'ler
  const { data } = await supabaseAdmin
    .from('push_tokens')
    .select('user_id');
  if (!data) return [];
  return [...new Set(data.map(d => d.user_id))];
}

/**
 * Tek bir user_id'ye edge fn üzerinden push gönder. Başarılı/başarısız sayısını döner.
 * Edge fn yanıtı: { success, sent, failed, total }
 */
async function sendToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<{ sent: number; failed: number }> {
  try {
    const { data: result, error } = await supabaseAdmin.functions.invoke('send-push', {
      body: {
        target_user_id: userId,
        title,
        body,
        data: data || {},
        is_call: false,
      },
    });
    if (error || !result?.success) {
      return { sent: 0, failed: 1 };
    }
    return {
      sent: result.sent ?? 0,
      failed: result.failed ?? 0,
    };
  } catch {
    return { sent: 0, failed: 1 };
  }
}

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const audience = String(body.audience || 'all');
  const tier = body.tier ? String(body.tier) : null;
  const userId = body.user_id ? String(body.user_id) : null;
  const title = String(body.title || '').trim();
  const text = String(body.body || '').trim();
  const data = body.data && typeof body.data === 'object' ? body.data : undefined;

  if (!title || !text) {
    return NextResponse.json({ error: 'Başlık ve metin gerekli' }, { status: 400 });
  }
  if (!['all', 'tier', 'user'].includes(audience)) {
    return NextResponse.json({ error: 'Geçersiz audience' }, { status: 400 });
  }

  const userIds = await loadTargetUserIds(audience, tier, userId);
  if (userIds.length === 0) {
    const note = audience === 'user'
      ? `Kullanıcı bulunamadı: "${userId}". UID veya @username kullan.`
      : 'Hedef kullanıcı bulunamadı';
    return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0, note });
  }

  // Paralel gönder ama edge fn rate limit'ini zorlamayacak şekilde batch
  const BATCH = 20;
  let totalSent = 0;
  let totalFailed = 0;
  for (let i = 0; i < userIds.length; i += BATCH) {
    const slice = userIds.slice(i, i + BATCH);
    const results = await Promise.all(slice.map(uid => sendToUser(uid, title, text, data)));
    for (const r of results) {
      totalSent += r.sent;
      totalFailed += r.failed;
    }
  }

  logAudit({
    action: 'push_send',
    target_type: audience === 'user' ? 'user' : audience === 'tier' ? 'tier' : 'all',
    target_id: audience === 'user' ? userIds[0] : audience === 'tier' ? tier || undefined : 'broadcast',
    payload: {
      title,
      body: text.slice(0, 100),
      total_users: userIds.length,
      sent: totalSent,
      failed: totalFailed,
    },
  });

  return NextResponse.json({
    ok: true,
    total: userIds.length,
    sent: totalSent,
    failed: totalFailed,
  });
}
