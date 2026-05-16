import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/admin/audit';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

// ★ 2026-05-10: system_points BURADAN ÇIKARILDI — direct UPDATE sp_transactions
//   trigger'ını bypass ediyor, donatable_sp güncellenmeden kalıyordu (kullanıcı
//   bağış yapamıyordu). SP değişiklikleri artık admin_grant_sp RPC'sine yönlendirilir.
const ALLOWED_FIELDS = new Set([
  'is_banned',
  'is_verified',
  'is_admin',
  'subscription_tier',
  'display_name',
  'active_badge_id',
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

  // Default: alan güncelleme (is_banned, is_verified, subscription_tier vb)
  const update = body?.update;
  if (!update || typeof update !== 'object') {
    return NextResponse.json({ error: 'Geçersiz gövde' }, { status: 400 });
  }

  // ★ 2026-05-10: system_points isteği gelirse RPC ile delta uygula (trigger devrede,
  //   donatable_sp + lifetime metrics doğru güncellenir). Direct UPDATE yasak.
  if ('system_points' in update) {
    const targetSP = parseInt(String(update.system_points), 10);
    if (!Number.isFinite(targetSP) || targetSP < 0) {
      return NextResponse.json({ error: 'Geçersiz SP değeri' }, { status: 400 });
    }
    const { data: current } = await supabaseAdmin
      .from('profiles')
      .select('system_points')
      .eq('id', id)
      .maybeSingle();
    const currentSP = (current as any)?.system_points ?? 0;
    const delta = targetSP - currentSP;
    if (delta !== 0) {
      const externalRef = `web_admin:${id}:${delta}:${Date.now()}`;
      const { error: rpcErr } = await supabaseAdmin.rpc('admin_grant_sp', {
        p_user_id: id,
        p_amount: delta,
        p_action: 'web_admin_user_update',
        p_external_ref: externalRef,
      });
      if (rpcErr) {
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }
      logAudit({ action: 'user_sp_update', target_type: 'user', target_id: id, payload: { from: currentSP, to: targetSP, delta } });
    }
    delete (update as any).system_points;
  }

  const safe: Record<string, any> = {};
  for (const k of Object.keys(update)) {
    if (ALLOWED_FIELDS.has(k)) safe[k] = update[k];
  }

  // ★ v280: is_verified değiştiğinde active_badge_id'yi otomatik eşle.
  //   Admin "TİK" butonuna bastığında, DB'deki ilk badge kategorisindeki
  //   rozet ürününü kullanıcıya ata (APK'da CosmeticBadge render için).
  if ('is_verified' in safe && !('active_badge_id' in safe)) {
    if (safe.is_verified) {
      // Doğrulama veriliyor → ilk badge ürünü bul ve ata
      const { data: badgeItem } = await supabaseAdmin
        .from('cosmetic_items')
        .select('id')
        .eq('category', 'badge')
        .eq('active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (badgeItem?.id) {
        safe.active_badge_id = badgeItem.id;
      }
    } else {
      // Doğrulama kaldırılıyor → rozeti de kaldır
      safe.active_badge_id = null;
    }
  }

  if (Object.keys(safe).length === 0) {
    // SP delta uygulanmış olabilir — boş gövde başarı sayılır
    return NextResponse.json({ ok: true });
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
