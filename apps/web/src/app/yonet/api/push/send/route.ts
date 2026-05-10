import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/admin/audit';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPT_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const EXPO_BATCH_SIZE = 100;
const RECEIPT_WAIT_MS = 6000;

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

async function resolveUserId(input: string): Promise<string | null> {
  // ★ 2026-05-09: Admin paneli "Kullanıcı ID" alanına Firebase UID, username veya display_name
  //   girebiliyor. Sırayla 3 katmanda ara: önce direkt id (UID), sonra username, sonra display_name.
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1) Direkt UID match
  const { data: byId } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', trimmed)
    .maybeSingle();
  if (byId?.id) return byId.id;

  // 2) Username (case-insensitive)
  const { data: byUsername } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .ilike('username', trimmed)
    .limit(1)
    .maybeSingle();
  if (byUsername?.id) return byUsername.id;

  // 3) Display name (case-insensitive, exact)
  const { data: byDisplay } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .ilike('display_name', trimmed)
    .limit(1)
    .maybeSingle();
  if (byDisplay?.id) return byDisplay.id;

  return null;
}

/**
 * ★ 2026-05-10 BACKWARD COMPAT: V78 migration push_tokens'a transfer etti ama eski
 *   kullanıcılarda profiles.push_token'da hâlâ veri olabilir. Önce push_tokens'ı dene,
 *   token bulunamazsa profiles.push_token'a fallback. Sonuç: hem yeni hem eski user'a push gider.
 */
async function fetchTokensWithFallback(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const tokens: string[] = [];
  const foundUserIds = new Set<string>();
  const CHUNK = 500;

  // Primary: push_tokens table
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const slice = userIds.slice(i, i + CHUNK);
    const { data } = await supabaseAdmin
      .from('push_tokens')
      .select('token, user_id')
      .in('user_id', slice);
    if (data) {
      for (const row of data) {
        tokens.push(row.token);
        foundUserIds.add(row.user_id);
      }
    }
  }

  // Fallback: profiles.push_token (V78 öncesi user'lar için)
  const missingIds = userIds.filter(id => !foundUserIds.has(id));
  if (missingIds.length > 0) {
    for (let i = 0; i < missingIds.length; i += CHUNK) {
      const slice = missingIds.slice(i, i + CHUNK);
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('push_token')
        .in('id', slice)
        .not('push_token', 'is', null);
      if (data) tokens.push(...data.map(d => d.push_token).filter(Boolean) as string[]);
    }
  }

  return tokens;
}

async function loadTokens(audience: string, tier: string | null, userId: string | null): Promise<string[]> {
  if (audience === 'user' && userId) {
    const resolvedUid = await resolveUserId(userId);
    if (!resolvedUid) return [];
    return fetchTokensWithFallback([resolvedUid]);
  }

  if (audience === 'tier' && tier) {
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('subscription_tier', tier);
    const userIds = (users || []).map(u => u.id);
    return fetchTokensWithFallback(userIds);
  }

  // 'all' broadcast — push_tokens + profiles.push_token (eski user fallback)
  const { data: pushTokensData } = await supabaseAdmin
    .from('push_tokens')
    .select('token, user_id');
  const tokens = (pushTokensData || []).map(d => d.token);
  const userIdsWithToken = new Set((pushTokensData || []).map(d => d.user_id));

  const { data: legacyData } = await supabaseAdmin
    .from('profiles')
    .select('id, push_token')
    .not('push_token', 'is', null);
  for (const row of legacyData || []) {
    if (row.push_token && !userIdsWithToken.has(row.id)) {
      tokens.push(row.push_token);
    }
  }

  return tokens;
}

type SendResult = {
  ticketsAccepted: number;
  ticketsRejected: number;
  delivered: number;
  receiptErrors: number;
  errorBreakdown: Record<string, number>;
  invalidTokens: string[];
  ticketErrors: string[];
};

async function sendExpoBatch(tokens: string[], title: string, body: string, data?: Record<string, any>): Promise<SendResult> {
  const result: SendResult = {
    ticketsAccepted: 0,
    ticketsRejected: 0,
    delivered: 0,
    receiptErrors: 0,
    errorBreakdown: {},
    invalidTokens: [],
    ticketErrors: [],
  };
  const ticketToToken: Record<string, string> = {};

  for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
    const batch = tokens.slice(i, i + EXPO_BATCH_SIZE);
    const messages = batch.map(token => ({
      to: token,
      title,
      body,
      sound: 'default',
      data: data || {},
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      const j = await res.json().catch(() => ({}));
      const tickets: any[] = Array.isArray(j?.data) ? j.data : [];
      for (let k = 0; k < tickets.length; k++) {
        const t = tickets[k];
        const tok = batch[k];
        if (t?.status === 'ok' && t?.id) {
          result.ticketsAccepted++;
          ticketToToken[t.id] = tok;
        } else {
          result.ticketsRejected++;
          const err = t?.details?.error || t?.message || 'unknown';
          result.ticketErrors.push(`${err}`);
          if (err === 'DeviceNotRegistered') result.invalidTokens.push(tok);
        }
      }
      const missing = batch.length - tickets.length;
      if (missing > 0) result.ticketsRejected += missing;
    } catch (e: any) {
      result.ticketsRejected += batch.length;
      result.ticketErrors.push(`fetch_failed:${e?.message || 'unknown'}`);
    }
  }

  // ─── Receipt aşaması — Expo'dan FCM/APNs sonucu çek ───
  const ticketIds = Object.keys(ticketToToken);
  if (ticketIds.length > 0) {
    await new Promise(r => setTimeout(r, RECEIPT_WAIT_MS));
    for (let i = 0; i < ticketIds.length; i += EXPO_BATCH_SIZE) {
      const idBatch = ticketIds.slice(i, i + EXPO_BATCH_SIZE);
      try {
        const res = await fetch(EXPO_RECEIPT_URL, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: idBatch }),
        });
        const j = await res.json().catch(() => ({}));
        const receipts = (j?.data || {}) as Record<string, any>;
        for (const id of idBatch) {
          const r = receipts[id];
          if (!r) continue; // henüz işlenmemiş — bilinmiyor
          if (r.status === 'ok') {
            result.delivered++;
          } else {
            result.receiptErrors++;
            const err = r?.details?.error || r?.message || 'unknown';
            result.errorBreakdown[err] = (result.errorBreakdown[err] || 0) + 1;
            if (err === 'DeviceNotRegistered') {
              const tok = ticketToToken[id];
              if (tok) result.invalidTokens.push(tok);
            }
          }
        }
      } catch (e: any) {
        result.errorBreakdown[`receipt_fetch_failed`] = (result.errorBreakdown[`receipt_fetch_failed`] || 0) + idBatch.length;
      }
    }
  }

  return result;
}

async function cleanupInvalidTokens(tokens: string[]) {
  if (tokens.length === 0) return;
  try {
    await supabaseAdmin.from('push_tokens').delete().in('token', tokens);
  } catch { /* silent */ }
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

  // ★ 2026-05-09: "Tek" akışında kullanıcı bulunamadı vs token yok ayrımı
  if (audience === 'user' && userId) {
    const resolvedUid = await resolveUserId(userId);
    if (!resolvedUid) {
      return NextResponse.json({
        ok: false,
        total: 0,
        ticketsAccepted: 0,
        ticketsRejected: 0,
        delivered: 0,
        receiptErrors: 0,
        errorBreakdown: {},
        cleanedTokens: 0,
        note: `"${userId}" eşleşen kullanıcı bulunamadı (UID, kullanıcı adı veya görünen ad olarak ara).`,
      });
    }
  }

  const tokens = await loadTokens(audience, tier, userId);
  if (tokens.length === 0) {
    return NextResponse.json({
      ok: true,
      total: 0,
      ticketsAccepted: 0,
      ticketsRejected: 0,
      delivered: 0,
      receiptErrors: 0,
      errorBreakdown: {},
      cleanedTokens: 0,
      note: audience === 'user'
        ? 'Kullanıcı bulundu ama push token yok (uygulamayı son sürümle açıp bildirim izni vermesi gerekir).'
        : 'Hedef token bulunamadı',
    });
  }

  const result = await sendExpoBatch(tokens, title, text, data);
  // Geçersiz (DeviceNotRegistered) token'ları DB'den otomatik temizle — bir daha denenmeyi önler
  await cleanupInvalidTokens(result.invalidTokens);

  logAudit({
    action: 'push_send',
    target_type: audience === 'user' ? 'user' : audience === 'tier' ? 'tier' : 'all',
    target_id: audience === 'user' ? userId || undefined : audience === 'tier' ? tier || undefined : 'broadcast',
    payload: {
      title,
      body: text.slice(0, 100),
      total: tokens.length,
      ticketsAccepted: result.ticketsAccepted,
      ticketsRejected: result.ticketsRejected,
      delivered: result.delivered,
      receiptErrors: result.receiptErrors,
      errorBreakdown: result.errorBreakdown,
      cleanedTokens: result.invalidTokens.length,
    },
  });
  return NextResponse.json({
    ok: true,
    total: tokens.length,
    ticketsAccepted: result.ticketsAccepted,
    ticketsRejected: result.ticketsRejected,
    delivered: result.delivered,
    receiptErrors: result.receiptErrors,
    errorBreakdown: result.errorBreakdown,
    cleanedTokens: result.invalidTokens.length,
  });
}
