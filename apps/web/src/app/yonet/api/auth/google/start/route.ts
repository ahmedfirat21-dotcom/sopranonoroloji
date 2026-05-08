/**
 * Google OAuth — start endpoint.
 * Login sayfasındaki "Google ile Giriş" butonuna basınca buraya gelinir;
 * burası Google'ın OAuth ekranına yönlendirir, dönüş için state cookie set eder.
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildAuthUrl, getOAuthClientId, getRedirectUri } from '@/lib/admin/google-oauth';
import { randomBytes } from 'crypto';

const STATE_COOKIE = 'sb_admin_oauth_state';
const STATE_MAX_AGE = 10 * 60; // 10 dakika

export async function GET(req: NextRequest) {
  if (!getOAuthClientId()) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID env değişkeni tanımlı değil. Vercel ayarlarından ekleyin.' },
      { status: 500 },
    );
  }

  const state = randomBytes(24).toString('hex');
  const origin = req.nextUrl.origin;
  const redirectUri = getRedirectUri(origin);
  const url = buildAuthUrl(redirectUri, state);

  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: STATE_MAX_AGE,
    path: '/',
  });
  return res;
}
