/**
 * SopranoChat Admin — Google OAuth helper
 *
 * Manuel OAuth 2.0 flow (NextAuth bağımlılığı yok). Mevcut admin HMAC cookie
 * sistemiyle birlikte çalışır: Google'dan email doğrulanınca standart admin
 * cookie set edilir, requireAdmin() değişmeden çalışmaya devam eder.
 *
 * Yetkili e-posta listesi GOOGLE_ALLOWED_EMAILS env (virgül ayrılı) ile
 * kontrol edilir. Boş veya tanımsızsa default olarak 44burakdeniz@gmail.com.
 */

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export function getOAuthClientId(): string {
  return process.env.GOOGLE_OAUTH_CLIENT_ID || '';
}

export function getOAuthClientSecret(): string {
  return process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
}

/** Tam URL — request origin'inden inşa edilir (production veya preview) */
export function getRedirectUri(origin: string): string {
  return `${origin}/yonet/api/auth/google/callback`;
}

export function getAllowedEmails(): string[] {
  const raw = process.env.GOOGLE_ALLOWED_EMAILS || '44burakdeniz@gmail.com';
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
