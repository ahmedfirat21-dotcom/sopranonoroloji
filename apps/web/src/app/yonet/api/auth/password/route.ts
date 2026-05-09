/**
 * POST /yonet/api/auth/password
 * DEV-ONLY: localhost'ta ADMIN_ACCESS_KEY ile giriş için password fallback.
 * Production'da NODE_ENV=production iken devre dışı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPassword, makeAdminToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE } from '@/lib/admin/auth';

export async function POST(req: NextRequest) {
  // Sadece dev (localhost) — prod'da Google OAuth zorunlu
  const isDev = process.env.NODE_ENV !== 'production';
  if (!isDev) {
    return NextResponse.json({ error: 'Sadece dev ortamı' }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const password = (body?.password || '').toString();
  if (!password || !checkAdminPassword(password)) {
    return NextResponse.json({ error: 'Geçersiz şifre' }, { status: 401 });
  }
  const token = makeAdminToken();
  if (!token) {
    return NextResponse.json({ error: 'Cookie secret eksik' }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    secure: false, // localhost
  });
  return res;
}
