/**
 * Google OAuth — callback endpoint.
 * Google "code" ile buraya yönlendirir; code'u token'a değiştirir, userinfo'dan
 * email çeker, allowlist kontrolü yapar, geçerse standart admin HMAC cookie'sini
 * set edip /yonet'e yönlendirir.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  fetchUserInfo,
  getRedirectUri,
  isEmailAllowed,
} from '@/lib/admin/google-oauth';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE, makeAdminToken } from '@/lib/admin/auth';

const STATE_COOKIE = 'sb_admin_oauth_state';

function errorRedirect(origin: string, msg: string) {
  const url = new URL('/yonet/giris', origin);
  url.searchParams.set('err', msg);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const oauthError = req.nextUrl.searchParams.get('error');

  if (oauthError) {
    return errorRedirect(origin, `Google iptal: ${oauthError}`);
  }
  if (!code || !state) {
    return errorRedirect(origin, 'Eksik parametre');
  }

  const stateCookie = req.cookies.get(STATE_COOKIE)?.value;
  if (!stateCookie || stateCookie !== state) {
    return errorRedirect(origin, 'State doğrulama başarısız');
  }

  const redirectUri = getRedirectUri(origin);
  const tokenRes = await exchangeCodeForToken(code, redirectUri);
  if (!tokenRes.access_token) {
    return errorRedirect(origin, tokenRes.error || 'Token alınamadı');
  }

  const userInfo = await fetchUserInfo(tokenRes.access_token);
  if (!userInfo.email_verified) {
    return errorRedirect(origin, 'E-posta doğrulanmamış');
  }
  if (!isEmailAllowed(userInfo.email)) {
    return errorRedirect(origin, 'Yetkisiz e-posta');
  }

  // Email allowlist'te → admin cookie set + dashboard'a yönlendir
  const token = makeAdminToken();
  if (!token) {
    return errorRedirect(origin, 'Sunucu hatası: ADMIN_PASSWORD_HASH/ADMIN_ACCESS_KEY env eksik');
  }

  const res = NextResponse.redirect(new URL('/yonet', origin));
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: '/',
  });
  // State cookie'yi temizle
  res.cookies.set(STATE_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return res;
}
