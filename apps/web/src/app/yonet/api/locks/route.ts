import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { listLocks, clearLock } from '@/lib/admin/rateLimit';
import { logAudit } from '@/lib/admin/audit';

async function ensureAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  return NextResponse.json({ locks: listLocks() });
}

export async function DELETE(req: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Yetki yok' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const ip = searchParams.get('ip');
  if (!ip) {
    return NextResponse.json({ error: 'ip gerekli' }, { status: 400 });
  }
  const removed = clearLock(ip);
  if (removed) {
    logAudit({ action: 'ip_lock_clear', target_type: 'ip', target_id: ip });
  }
  return NextResponse.json({ ok: true, removed });
}
