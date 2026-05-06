/**
 * SopranoChat Admin — Auth Gate
 * v2.0 (6 May 2026)
 *
 * - Şifre: ADMIN_PASSWORD_HASH (scrypt) öncelikli, yoksa ADMIN_ACCESS_KEY (plain) fallback.
 * - Cookie: HMAC imzalı timestamp.
 * - Cookie secret: hash veya plain key — şifre değişince eski cookie'ler invalid olur.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHmac } from 'crypto';
import { verifyPassword } from './password';

const COOKIE_NAME = 'sb_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 saat

function getCookieSecret(): string {
  // Cookie HMAC için hash veya plain key — hangisi varsa
  return process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_ACCESS_KEY || '';
}

export function checkAdminPassword(plain: string): boolean {
  if (!plain) return false;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash && hash.startsWith('scrypt$')) {
    return verifyPassword(plain, hash);
  }
  // Fallback: plain ADMIN_ACCESS_KEY (ilk kurulum / eski sistem)
  const plainKey = process.env.ADMIN_ACCESS_KEY;
  if (plainKey && plain === plainKey) return true;
  return false;
}

/** Token = timestamp.HMAC(secret, "admin:" + timestamp) */
export function makeAdminToken(): string {
  const secret = getCookieSecret();
  if (!secret) return '';
  const ts = Date.now().toString();
  const sig = createHmac('sha256', secret).update(`admin:${ts}`).digest('hex');
  return `${ts}.${sig}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  const secret = getCookieSecret();
  if (!secret || !token) return false;
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return false;
  const ageMs = Date.now() - parseInt(ts, 10);
  if (ageMs > COOKIE_MAX_AGE * 1000) return false;
  const expected = createHmac('sha256', secret).update(`admin:${ts}`).digest('hex');
  return sig === expected;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_COOKIE_MAX_AGE = COOKIE_MAX_AGE;

export async function requireAdmin(): Promise<true> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!verifyAdminToken(token)) {
    redirect('/yonet/giris');
  }
  return true;
}
