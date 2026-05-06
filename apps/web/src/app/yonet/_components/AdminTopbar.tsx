"use client";

import { LogOut } from 'lucide-react';
import MobileSidebarToggle from './MobileSidebarToggle';
import SopranoLogoMini, { SopranoLogoStyleTag } from './SopranoLogoMini';

export default function AdminTopbar() {
  const handleLogout = async () => {
    await fetch('/yonet/api/logout', { method: 'POST' });
    window.location.href = '/yonet/giris';
  };

  return (
    <header className="h-14 shrink-0 bg-[#0F1929]/70 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-3 sm:px-6 gap-2">
      <SopranoLogoStyleTag />
      <div className="flex items-center gap-3 min-w-0">
        <MobileSidebarToggle />
        {/* Masaüstü — sidebar zaten logo gösteriyor, sadece sayfa başlığı pill'i */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
          <span className="text-[11px] font-semibold tracking-[0.2em] text-cyan-300">
            YÖNETİM PANELİ
          </span>
        </div>
        {/* Mobil — kompakt logo */}
        <div className="sm:hidden">
          <SopranoLogoMini size="xs" tagline="YÖNETİM" taglineAmber />
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all shrink-0"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline tracking-wider">Çıkış</span>
      </button>
    </header>
  );
}
