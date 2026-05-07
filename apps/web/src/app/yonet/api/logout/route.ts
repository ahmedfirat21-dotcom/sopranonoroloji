import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { logAudit } from '@/lib/admin/audit';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  logAudit({ action: 'logout' });
  return NextResponse.json({ ok: true });
}
