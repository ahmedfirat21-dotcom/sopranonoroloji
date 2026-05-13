/**
 * Uygulama Teması — Sistem Ayarı Sayfası
 * ════════════════════════════════════════════════════════════════════
 * Tema artık mağaza ürünü değil — uygulamanın renk paletini admin
 * buradan tek seferde yönetir. app_theme_config tablosundan id='default'
 * row'u okur, ThemeEditor render eder. Mağaza ürünleri değildir.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Palette } from 'lucide-react';
import AppThemeEditor from './AppThemeEditor';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [themeRes, roomLayoutRes] = await Promise.all([
    supabaseAdmin.from('app_theme_config').select('*').eq('id', 'default').single(),
    supabaseAdmin.from('room_layout_config').select('*').eq('id', 'default').single(),
  ]);
  const data = themeRes.data;
  const roomLayoutInitial = roomLayoutRes.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500/30 to-pink-500/20 border border-rose-500/40 flex items-center justify-center">
          <Palette className="w-5 h-5 text-rose-300" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Uygulama Teması</h1>
          <p className="text-xs text-slate-500">Uygulamanın renk paletini ve görsel sistemini buradan yönet. Kaydet → mobile anında uygular.</p>
        </div>
      </div>
      <AppThemeEditor initial={data} roomLayoutInitial={roomLayoutInitial} />
    </div>
  );
}
