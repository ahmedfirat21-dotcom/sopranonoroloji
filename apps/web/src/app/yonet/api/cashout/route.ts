/**
 * Cashout API — kullanıcı para çekme istekleri.
 * GET: liste (status filter), POST: onay/reddet + admin notu.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/admin/audit';

const ALLOWED_STATUSES = new Set(['pending', 'approved', 'rejected', 'paid']);

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function GET(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let q = supabaseAdmin
    .from('cashout_requests')
    .select('id, user_id, amount, commission_rate, net_amount, status, admin_note, created_at, updated_at, profiles!cashout_requests_user_id_fkey(display_name, username, avatar_url, system_points, subscription_tier)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (status && ALLOWED_STATUSES.has(status)) {
    q = q.eq('status', status);
  }
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data });
}

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const id: string = body.id;
  const newStatus: string = body.status;
  const adminNote: string = body.admin_note || '';

  if (!id || !newStatus || !ALLOWED_STATUSES.has(newStatus)) {
    return NextResponse.json({ error: 'id ve geçerli status gerekli' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('cashout_requests')
    .update({
      status: newStatus,
      admin_note: adminNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    action: 'cashout_status_change',
    target_type: 'cashout_request',
    target_id: id,
    payload: { new_status: newStatus, note: adminNote },
  });

  return NextResponse.json({ ok: true });
}
