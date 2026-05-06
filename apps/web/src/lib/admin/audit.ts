/**
 * Admin audit logger — Vercel Logs ve local console'a yazar.
 * Production'da Vercel Logs sekmesinden görülebilir.
 */

type AuditEntry = {
  ts: string;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, any>;
  ip?: string;
};

export function logAudit(entry: Omit<AuditEntry, 'ts'>) {
  const full: AuditEntry = {
    ts: new Date().toISOString(),
    ...entry,
  };
  // Vercel/Next runtime console.log → log explorer'a gider, prefix ile filter edilebilir
  console.log('[ADMIN_AUDIT]', JSON.stringify(full));
}
