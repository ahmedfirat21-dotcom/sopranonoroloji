import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/admin/audit';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const userId = String(body.user_id || '').trim();
  const amount = parseInt(String(body.amount), 10);
  const reason = String(body.reason || '').slice(0, 200);

  if (!userId) {
    return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: 'Geçersiz miktar' }, { status: 400 });
  }
  if (Math.abs(amount) > 100000) {
    return NextResponse.json({ error: 'Tek seferde max 100,000 SP' }, { status: 400 });
  }

  const action = `web_admin_grant${reason ? ': ' + reason : ''}`;
  const externalRef = `web_admin:${userId}:${amount}:${Date.now()}`;

  // ★ 8 May 2026: grant_system_points yerine admin_grant_sp kullanılıyor.
  //   Eski RPC günlük 300 SP üretim limiti uyguluyor — admin manuel grantları
  //   sessizce kestiriyor, donatable_sp güncellenmiyordu. Yeni RPC limit yok,
  //   sp_transactions trigger'ı donatable_sp'yi senkronize ediyor.
  const { data, error } = await supabaseAdmin.rpc('admin_grant_sp', {
    p_user_id: userId,
    p_amount: amount,
    p_action: action,
    p_external_ref: externalRef,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  logAudit({
    action: 'sp_grant',
    target_type: 'user',
    target_id: userId,
    payload: { amount, reason: reason.slice(0, 80), external_ref: externalRef },
  });
  return NextResponse.json({ ok: true, result: data });
}
