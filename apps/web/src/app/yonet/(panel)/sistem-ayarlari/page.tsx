/**
 * SopranoChat Admin — Sistem Ayarları
 * ★ F-1 (16 May 2026): Bakım modu, min app sürüm, feature flags, banner.
 *   Tek tablo: app_system_settings (id='default').
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ShieldAlert } from 'lucide-react';
import SystemSettingsClient from './SystemSettingsClient';

async function loadSettings() {
  const { data } = await supabaseAdmin
    .from('app_system_settings')
    .select('*')
    .eq('id', 'default')
    .single();
  return data;
}

export default async function SistemAyarlariPage() {
  const settings = await loadSettings();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-amber-400" /> Sistem Ayarları
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Bakım modu · Zorunlu güncelleme · Banner · Özellik bayrakları
        </p>
      </div>

      <SystemSettingsClient initial={settings as any} />
    </div>
  );
}
