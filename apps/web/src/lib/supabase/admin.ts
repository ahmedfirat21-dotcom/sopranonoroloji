/**
 * SopranoChat Admin — Supabase Service Role Client (server-side only)
 * v1.0 (6 May 2026)
 *
 * Bu client SADECE server component'lerde / route handler'larda kullanılır.
 * Service role key RLS bypass eder — admin işlemleri için.
 * Asla client component'e import etme!
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing Supabase env vars. Check .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY',
  );
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
