import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { id } = await params;
  const { action } = await req.json();

  if (!['dismiss', 'resolve', 'ban'].includes(action)) {
    return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
  }

  // Şikayeti çek
  const { data: report } = await supabaseAdmin
    .from('reports')
    .select('reported_user_id')
    .eq('id', id)
    .maybeSingle();

  if (!report) {
    return NextResponse.json({ error: 'Şikayet bulunamadı' }, { status: 404 });
  }

  // Aksiyon
  if (action === 'ban' && report.reported_user_id) {
    // Kullanıcıyı banla (profiles.is_banned = true)
    await supabaseAdmin
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', report.reported_user_id);
  }

  // Status güncelle
  const newStatus = action === 'dismiss' ? 'dismissed' : 'resolved';
  const { error } = await supabaseAdmin
    .from('reports')
    .update({ status: newStatus, resolved_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
