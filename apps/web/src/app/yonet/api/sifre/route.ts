/**
 * Şifre değiştirme endpoint'i.
 * Eski şifre doğru ise yeni şifre için scrypt hash üretir ve döndürür.
 * Hash runtime'da değişmez — kullanıcı .env.local + Vercel env'e koymalı + redeploy.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME, checkAdminPassword } from '@/lib/admin/auth';
import { hashPassword } from '@/lib/admin/password';
import { logAudit } from '@/lib/admin/audit';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function POST(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  let oldPassword: string;
  let newPassword: string;
  try {
    const body = await req.json();
    oldPassword = String(body?.old || '');
    newPassword = String(body?.new || '');
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  if (!checkAdminPassword(oldPassword)) {
    logAudit({ action: 'password_change_wrong_old' });
    return NextResponse.json({ error: 'Mevcut şifre yanlış' }, { status: 401 });
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Yeni şifre en az 8 karakter olmalı' }, { status: 400 });
  }
  if (newPassword === oldPassword) {
    return NextResponse.json({ error: 'Yeni şifre eskiyle aynı olamaz' }, { status: 400 });
  }

  const hash = hashPassword(newPassword);
  logAudit({ action: 'password_changed_hash_generated' });

  return NextResponse.json({
    ok: true,
    hash,
    instructions: {
      tr: '.env.local içinde ADMIN_PASSWORD_HASH değerini bu hash ile değiştir, sonra dev server\'ı yeniden başlat. Vercel\'de Settings → Environment Variables\'dan da güncelle ve redeploy et.',
      env_key: 'ADMIN_PASSWORD_HASH',
    },
  });
}
