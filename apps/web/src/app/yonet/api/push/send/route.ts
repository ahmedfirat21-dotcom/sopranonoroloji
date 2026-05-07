import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/admin/audit';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

async function loadTokens(audience: string, tier: string | null, userId: string | null): Promise<string[]> {
  if (audience === 'user' && userId) {
    const { data } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId);
    return (data || []).map(d => d.token);
  }

  if (audience === 'tier' && tier) {
    // tier'a göre user_id'leri çek, sonra token'ları
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('subscription_tier', tier);
    const userIds = (users || []).map(u => u.id);
    if (userIds.length === 0) return [];

    // Supabase 'in' filter limit ~1000; gerekirse parçala
    const tokens: string[] = [];
    const CHUNK = 500;
    for (let i = 0; i < userIds.length; i += CHUNK) {
      const slice = userIds.slice(i, i + CHUNK);
      const { data } = await supabaseAdmin
        .from('push_tokens')
        .select('token')
        .in('user_id', slice);
      if (data) tokens.push(...data.map(d => d.token));
    }
    return tokens;
  }

  // 'all' broadcast — tüm token'lar
  const { data } = await supabaseAdmin
    .from('push_tokens')
    .select('token');
  return (data || []).map(d => d.token);
}

async function sendExpoBatch(tokens: string[], title: string, body: string, data?: Record<string, any>) {
  let sent = 0;
  let failed = 0;

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
      for (const t of tickets) {
        if (t?.status === 'ok') sent++;
        else failed++;
      }
      // Eğer ticket sayısı batch'ten azsa, geri kalanını failed say
      const missing = batch.length - tickets.length;
      if (missing > 0) failed += missing;
    } catch {
      failed += batch.length;
    }
  }

  return { sent, failed };
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

  const tokens = await loadTokens(audience, tier, userId);
  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0, note: 'Hedef token bulunamadı' });
  }

  const result = await sendExpoBatch(tokens, title, text, data);
  logAudit({
    action: 'push_send',
    target_type: audience === 'user' ? 'user' : audience === 'tier' ? 'tier' : 'all',
    target_id: audience === 'user' ? userId || undefined : audience === 'tier' ? tier || undefined : 'broadcast',
    payload: { title, body: text.slice(0, 100), total: tokens.length, sent: result.sent, failed: result.failed },
  });
  return NextResponse.json({ ok: true, total: tokens.length, ...result });
}
