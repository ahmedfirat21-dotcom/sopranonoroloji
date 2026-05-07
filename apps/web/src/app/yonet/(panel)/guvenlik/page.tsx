/**
 * Güvenlik — IP kilidi yönetimi.
 * Admin login'e 5 yanlış deneyen IP 15dk kilitlenir.
 * Buradan listele + manuel sıfırla.
 */
import { ShieldAlert } from 'lucide-react';
import LocksClient from './LocksClient';

export default function GuvenlikPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-400" /> Güvenlik
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Admin paneline giriş denerken 5 yanlış şifre giren IP 15 dakika kilitlenir.
          Buradan görebilir, gerekirse kilidi açabilirsin.
        </p>
      </div>

      <LocksClient />
    </div>
  );
}
