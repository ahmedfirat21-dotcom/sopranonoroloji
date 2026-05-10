/**
 * SopranoChat Admin — Google OAuth helper
 *
 * Manuel OAuth 2.0 flow (NextAuth bağımlılığı yok). Mevcut admin HMAC cookie
 * sistemiyle birlikte çalışır: Google'dan email doğrulanınca standart admin
 * cookie set edilir, requireAdmin() değişmeden çalışmaya devam eder.
 *
 * ★ 2026-05-10 SECURITY: Yetkili e-posta listesi sadece GOOGLE_ALLOWED_EMAILS
 *   env'inden okunur. Default e-posta KALDIRILDI — env eksikse tüm girişler
 *   reddedilir (fail-closed). Production'da env zorunlu.
 */

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export function getOAuthClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || '';
}

export function getOAuthClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET || '';
}

/** Tam URL — request origin'inden inşa edilir (production veya preview) */
export function getRedirectUri(origin: string): string {
  return `${origin}/yonet/api/auth/google/callback`;
}

export function getAllowedEmails(): string[] {
  const raw = process.env.GOOGLE_ALLOWED_EMAILS || '';
  return raw
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = getAllowedEmails();
  return allow.includes(email.toLowerCase());
}

export function buildAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: getOAuthClientId(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token?: string;
  id_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: getOAuthClientId(),
    client_secret: getOAuthClientSecret(),
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  return (await res.json()) as TokenResponse;
}

interface UserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function fetchUserInfo(accessToken: string): Promise<UserInfo> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return {};
  return (await res.json()) as UserInfo;
}
