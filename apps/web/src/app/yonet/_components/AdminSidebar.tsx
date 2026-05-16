"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Flag, Users, Store, Home, MessageSquare,
  Coins, Bell, Crown, Settings as SettingsIcon, TrendingUp, Banknote, ScrollText,
  ShieldAlert, UserPlus, Palette, Layout as LayoutIcon,
} from 'lucide-react';
import SopranoLogoMini, { SopranoLogoStyleTag } from './SopranoLogoMini';

type NavItem = { href: string; label: string; icon: any; exact?: boolean };
type NavGroup = { type: 'group'; label: string } | NavItem;

const NAV: NavGroup[] = [
  { href: '/yonet', label: 'Panel', icon: LayoutDashboard, exact: true },
  { href: '/yonet/ekonomi', label: 'Ekonomi', icon: TrendingUp },
  { href: '/yonet/sikayetler', label: 'Şikayetler', icon: Flag },
  { href: '/yonet/kullanicilar', label: 'Kullanıcılar', icon: Users },

  // ★ P1-5 (16 May 2026): 9 sidebar girişi → 2'ye indi. Mağaza sayfası kategori chip
  //   filtresi zaten var, ayrıca her kategori için sidebar shortcut'a gerek yok.
  //   SP Paketleri ayrı tablo (sp_packages) olduğu için kendi sayfası kalır.
  { type: 'group', label: 'Kozmetik (Mağaza)' },
  { href: '/yonet/magaza', label: 'Mağaza', icon: Store },
  { href: '/yonet/sp-paketleri', label: 'SP Paketleri', icon: Coins },

  { type: 'group', label: 'Sistem' },
  // ★ Uygulama Teması — renk paleti + oda düzeni + sayfa-bazlı detaylar TEK YERDE
  { href: '/yonet/tema-sistemi', label: 'Uygulama Teması', icon: Palette },
  { href: '/yonet/uyelik', label: 'Üyelik Planları', icon: Crown },
  { href: '/yonet/odalar', label: 'Odalar', icon: Home },
  // ★ v283 (16 May 2026): Oda düzeni paneli sidebar'a eklendi — eskiden orphan'dı (klasör var, link yok)
  { href: '/yonet/oda-duzeni', label: 'Oda Düzeni', icon: LayoutIcon },
  { href: '/yonet/mesajlar', label: 'Mesaj İncelemesi', icon: MessageSquare },
  { href: '/yonet/sp', label: 'SP İşlemleri', icon: Coins },
  { href: '/yonet/cashout', label: 'Para Çekme', icon: Banknote },
  { href: '/yonet/push', label: 'Push Bildirim', icon: Bell },
  { href: '/yonet/davetler', label: 'Davetler', icon: UserPlus },
  { href: '/yonet/guvenlik', label: 'Güvenlik', icon: ShieldAlert },
  { href: '/yonet/audit', label: 'İşlem Kayıtları', icon: ScrollText },
  // ★ F-1 (16 May 2026): Sistem ayarları — bakım modu, banner, feature flags
  { href: '/yonet/sistem-ayarlari', label: 'Sistem Ayarları', icon: ShieldAlert },
  { href: '/yonet/ayarlar', label: 'Yönetici Şifresi', icon: SettingsIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // ★ Hydration mismatch fix: searchParams server-side boş, client-side gerçek.
  //   Active state'i mount sonrasında hesapla (ilk render server-client eşit).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const currentCat = mounted ? searchParams.get('cat') : null;

  return (
    <aside className="w-64 shrink-0 border-r border-white/[0.08] flex flex-col">
      <SopranoLogoStyleTag />

      {/* Header — SopranoLogo + amber YÖNETİM tagline */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/yonet" className="block">
          <SopranoLogoMini size="md" tagline="YÖNETİM" taglineAmber />
        </Link>
      </div>

      {/* Nav — turkuaz aktif vurgu (ana sayfa paleti) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto yonet-scrollbar">
        {NAV.map((it, idx) => {
          if ('type' in it && it.type === 'group') {
            return (
              <div key={`g-${idx}`} className="pt-3 pb-1 px-3 text-[9px] font-bold tracking-[0.15em] text-slate-500 uppercase">
                {it.label}
              </div>
            );
          }
          const item = it as NavItem;
          // Defansif: href yoksa atla
          if (!item.href) return null;
          // Kategori filtreli URL'ler için: pathname + cat query parametresi match
          const hasQuery = item.href.includes('?');
          let active: boolean;
          if (item.exact) {
            active = pathname === item.href;
          } else if (hasQuery) {
            // /yonet/magaza?cat=frames gibi — pathname eşleşmeli + cat eşleşmeli
            const [hrefPath, hrefQuery] = item.href.split('?');
            const hrefCat = new URLSearchParams(hrefQuery).get('cat');
            active = pathname === hrefPath && currentCat === hrefCat;
          } else {
            // Plain path — sadece pathname.startsWith (cat query'siz)
            active = pathname.startsWith(item.href) && !currentCat;
          }
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                active
                  ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-cyan-200 border border-teal-500/30 shadow-[0_0_12px_-4px_rgba(20,184,166,0.4)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-teal-300' : ''}`} />
              <span className="font-medium">{item.label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer — sade marka altı */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <div className="text-[10px] text-slate-500 tracking-wider">
          Maison Soprano · v1.0
        </div>
        <Link
          href="/"
          className="text-[10px] text-slate-600 hover:text-cyan-300 tracking-wider mt-1 inline-block transition-colors"
        >
          ← Ana siteye dön
        </Link>
      </div>
    </aside>
  );
}
