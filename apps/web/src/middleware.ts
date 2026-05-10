import { NextRequest, NextResponse } from 'next/server';

/**
 * SopranoChat Web Admin — Edge Middleware
 *
 * Defense-in-depth: /yonet/api/* path'lerine giden istekler önce middleware'e
 * uğrar. Cookie yoksa doğrudan 401 döner — route handler'ın requireAdmin()
 * çağrısına bile gerek kalmaz. Public auth endpoint'leri (login, OAuth)
 * skip listesinde.
 *
 * Cookie'nin gerçek HMAC doğrulaması Edge runtime'da yapılmaz (Node crypto
 * Edge'de yok). Cookie'nin format kontrolü ve mevcudiyeti yeterli ilk savunma;
 * route handler kendi requireAdmin() ile tam doğrulama yapar.
 */

const ADMIN_COOKIE = 'sb_admin_session';

// Public — auth endpoint'leri cookie'siz erişilebilir
const PUBLIC_ADMIN_PATHS = [
  '/yonet/api/giris',
  '/yonet/api/sifre',
  '/yonet/api/auth/google/start',
  '/yonet/api/auth/google/callback',
  '/yonet/api/auth/password',
  '/yonet/api/logout',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/yonet/api/')) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token || !token.includes('.')) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Admin oturumu yok' },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/yonet/api/:path*'],
};
