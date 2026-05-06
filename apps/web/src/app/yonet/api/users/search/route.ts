import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function GET(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ users: [] });

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name, username, avatar_url')
    .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data || [] });
}
