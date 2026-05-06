"use client";

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { usePathname } from 'next/navigation';

export default function MobileSidebarToggle() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Sayfa değişince otomatik kapat
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ESC ile kapat + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Hamburger butonu — sadece mobile/tablet'te göster */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
        aria-label="Menüyü aç"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[85vw] flex">
            <AdminSidebar />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
