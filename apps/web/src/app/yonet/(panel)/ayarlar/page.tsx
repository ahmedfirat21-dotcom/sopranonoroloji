/**
 * SopranoChat Admin — Yönetici Şifresi
 * ★ v283 (16 May 2026): Eski başlık "Ayarlar" idi; sadece yönetici şifresi içerdiği için
 *   yanıltıcıydı. Net başlık: "Yönetici Şifresi". Sistem ayarları (bakım modu, feature flags)
 *   ileride ayrı bir panele eklenecek.
 */
import { KeyRound } from 'lucide-react';
import PasswordChangeForm from './PasswordChangeForm';

export default function AyarlarPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-cyan-400" /> Yönetici Şifresi
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Panel giriş şifreni değiştir + güvenlik notları
        </p>
      </div>

      <PasswordChangeForm />

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-bold tracking-wider text-slate-300 mb-3">GÜVENLİK NOTLARI</h2>
        <ul className="text-xs text-slate-400 space-y-2 list-disc pl-5">
          <li>Şifre <strong>scrypt</strong> ile hashlenir, plain metin olarak saklanmaz.</li>
          <li>Yanlış şifre 5 kez denenirse IP <strong>15 dakika kilitlenir</strong>.</li>
          <li>Tüm yönetici aksiyonları <strong>audit log</strong>'a yazılır (Vercel Logs / lokal terminal).</li>
          <li>Cookie 8 saat sonra otomatik geçersiz olur (yeniden giriş gerekir).</li>
          <li>Şifre değişince eski tarayıcı oturumları otomatik düşer.</li>
        </ul>
      </div>
    </div>
  );
}
