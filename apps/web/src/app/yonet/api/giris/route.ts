import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  makeAdminToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE, checkAdminPassword,
} from '@/lib/admin/auth';
import { checkLock, recordFail, recordSuccess, getClientIp } from '@/lib/admin/rateLimit';
import { logAudit } from '@/lib/admin/audit';

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Rate limit kontrolü
  const lockState = checkLock(ip);
  if (lockState.locked) {
    const minutes = Math.ceil(lockState.remainingMs / 60000);
    logAudit({ action: 'login_locked', payload: { ip, remaining_minutes: minutes } });
    return NextResponse.json(
      { error: `Çok fazla yanlış deneme. ${minutes} dakika sonra tekrar dene.` },
      { status: 429 },
    );
  }

  let accessKey: string;
  try {
    const body = await req.json();
    accessKey = String(body?.accessKey || '');
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  // Şifre doğrula (hash öncelikli, plain fallback)
  if (!checkAdminPassword(accessKey)) {
    const failState = recordFail(ip);
    logAudit({
      action: 'login_failed',
      payload: { ip, fails: failState.fails, locked: failState.locked },
    });
    if (failState.locked) {
      return NextResponse.json(
        { error: '5 yanlış deneme — 15 dakika kilitlendi.' },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: `Geçersiz erişim anahtarı (${5 - failState.fails} deneme kaldı)` },
      { status: 401 },
    );
  }

  // Başarılı giriş
  recordSuccess(ip);
  logAudit({ action: 'login_success', payload: { ip } });

  const token = makeAdminToken();
  if (!token) {
    return NextResponse.json({ error: 'Server config eksik (ADMIN_ACCESS_KEY veya ADMIN_PASSWORD_HASH)' }, { status: 500 });
  }
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return NextResponse.json({ ok: true });
}
