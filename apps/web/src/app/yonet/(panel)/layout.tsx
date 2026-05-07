/**
 * SopranoChat Admin — Panel Layout (server component, AUTH GATED)
 * /yonet/(panel)/* sayfaları için. /yonet/giris bu layout'a girmez.
 *
 * Tema: ana sayfa diliyle uyumlu — koyu lacivert + turkuaz/mavi ambient glow.
 */
import type { ReactNode } from 'react';
import AdminSidebar from '../_components/AdminSidebar';
import AdminTopbar from '../_components/AdminTopbar';
import { requireAdmin } from '@/lib/admin/auth';

export const metadata = {
  title: 'SopranoChat Yönetim',
  robots: { index: false, follow: false },
};

export default async function YonetPanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <>
      {/* ★ 7 May 2026: globals.css'te html'e açık mor gradient + zoom:0.90 var
          (landing/diğer sayfalar için). Yonet'te bu html bg sağ kenarda gözüküyordu;
          fixed dark katmanla tüm viewport'u örtüyoruz. */}
      <style>{`
        html, body { background: #0A0F1A !important; }
      `}</style>
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        style={{ background: '#0A0F1A' }}
      />
    <div
      className="yonet-scrollbar relative flex h-screen w-screen text-slate-100 overflow-hidden"
      style={{ background: '#0A0F1A', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      {/* Ambient glow — landing-new ile birebir aynı palet */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(78, 176, 168, 0.15), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(123, 159, 239, 0.10), transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Masaüstü inline sidebar — mobile drawer Topbar içindeki toggle ile açılır */}
      <div className="hidden lg:flex relative z-10">
        <AdminSidebar />
      </div>
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <AdminTopbar />
        <div className="yonet-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </main>
    </div>
    </>
  );
}
