import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/admin/audit';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

const ALLOWED_FIELDS = new Set([
  'is_banned',
  'is_verified',
  'is_admin',
  'system_points',
  'subscription_tier',
  'display_name',
]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // ★ Kullanıcıyı kalıcı sil — cascade RPC
  if (body?.action === 'delete') {
    const { error } = await supabaseAdmin.rpc('admin_delete_user_cascade', { p_user_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAudit({ action: 'user_delete', target_type: 'user', target_id: id });
    return NextResponse.json({ ok: true });
  }

  // ★ Admin yetki ver/al — toggle RPC
  if (body?.action === 'toggle_admin') {
    const makeAdmin = !!body.make_admin;
    const { error } = await supabaseAdmin.rpc('admin_toggle_admin', {
      p_user_id: id,
      p_make_admin: makeAdmin,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAudit({ action: 'user_toggle_admin', target_type: 'user', target_id: id, payload: { make_admin: makeAdmin } });
    return NextResponse.json({ ok: true });
  }

  // ★ Kullanıcıyı uyar — inbox'a sistem mesajı
  if (body?.action === 'warn') {
    const message = String(body.message || 'Davranışlarınız nedeniyle bir uyarı aldınız. Kuralları tekrar ihlal etmeniz durumunda hesabınız askıya alınabilir.').slice(0, 500);
    const { error } = await supabaseAdmin.from('inbox').insert({
      user_id: id,
      type: 'system',
      title: 'Yönetici Uyarısı',
      body: message,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logAudit({ action: 'user_warn', target_type: 'user', target_id: id, payload: { message: message.slice(0, 200) } });
    return NextResponse.json({ ok: true });
  }

  // Default: alan güncelleme (is_banned, is_verified, system_points vb)
  const update = body?.update;
  if (!update || typeof update !== 'object') {
    return NextResponse.json({ error: 'Geçersiz gövde' }, { status: 400 });
  }

  const safe: Record<string, any> = {};
  for (const k of Object.keys(update)) {
    if (ALLOWED_FIELDS.has(k)) safe[k] = update[k];
  }
  if (Object.keys(safe).length === 0) {
    return NextResponse.json({ error: 'Güncellenebilir alan yok' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(safe)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  logAudit({ action: 'user_update', target_type: 'user', target_id: id, payload: safe });
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data });
}
