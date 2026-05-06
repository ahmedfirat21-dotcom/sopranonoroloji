/**
 * In-memory rate limiter — login brute-force koruması.
 * Restart'ta sıfırlanır, ama 5 fail için yeterli.
 * Vercel serverless cold start = sıfırlanır (kabul edilebilir trade-off).
 */
type Entry = { fails: number; lockedUntil: number };

const FAIL_LIMIT = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 dakika
const RESET_AFTER_MS = 60 * 60 * 1000; // 1 saat boyunca sayaç sıfırlanmaz

const store = new Map<string, Entry>();

export function checkLock(ip: string): { locked: boolean; remainingMs: number } {
  const e = store.get(ip);
  if (!e) return { locked: false, remainingMs: 0 };
  const now = Date.now();
  if (e.lockedUntil > now) {
    return { locked: true, remainingMs: e.lockedUntil - now };
  }
  // Kilit süresi geçti — sayaç sıfırla
  if (e.lockedUntil > 0 && e.lockedUntil <= now) {
    store.delete(ip);
  }
  return { locked: false, remainingMs: 0 };
}

export function recordFail(ip: string): { locked: boolean; fails: number } {
  const now = Date.now();
  const e = store.get(ip) || { fails: 0, lockedUntil: 0 };
  e.fails++;
  if (e.fails >= FAIL_LIMIT) {
    e.lockedUntil = now + LOCK_MS;
  }
  store.set(ip, e);
  // Eski kayıtları temizle (belleği şişirmemek için)
  if (store.size > 1000) {
    for (const [k, v] of store.entries()) {
      if (v.lockedUntil > 0 && v.lockedUntil < now - RESET_AFTER_MS) {
        store.delete(k);
      }
    }
  }
  return { locked: e.lockedUntil > now, fails: e.fails };
}

export function recordSuccess(ip: string) {
  store.delete(ip);
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}
