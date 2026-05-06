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

  if (action === 'soft_delete') {
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
}
