/**
 * SopranoChat Admin — Ekonomi
 * SP üretimi, harcama, tier dağılımı, mağaza alımları, hediye hacmi.
 */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { TrendingUp, TrendingDown, Coins, ShoppingBag, Gift, Crown, Users, Repeat } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  daily_login: 'Günlük giriş',
  prime_time_return: 'Prime time bonusu',
  stage_time: 'Sahne süresi',
  camera_time: 'Kamera süresi',
  message_sent: 'Mesaj ödülü',
  room_create: 'Oda açma',
  follower_gain: 'Takipçi kazanımı',
  ccu_milestone_10: 'CCU milestone 10',
  ccu_milestone_25: 'CCU milestone 25',
  ccu_milestone_50: 'CCU milestone 50',
  store_purchase: 'Mağaza alımı',
  referral: 'Davet bonusu',
  referral_bonus: 'Davet bonusu',
  welcome_bonus: 'Hoşgeldin bonusu',
  donation_sent: 'Bağış gönderildi',
  donation_received: 'Bağış alındı',
  gift_sent: 'Hediye gönderildi',
  gift_received: 'Hediye alındı',
  powerup_glow_message: 'Power-up: Parlak mesaj',
  powerup_stage_light: 'Power-up: Sahne ışığı',
  powerup_message_glow: 'Power-up: Mesaj parıltısı',
  profile_boost: 'Profil boost',
  badge_reward: 'Rozet ödülü',
  room_boost: 'Oda boost',
  entry_fee_share: 'Giriş ücreti payı',
  admin_grant: 'Admin manuel',
  web_admin_grant: 'Admin (web)',
};

async function loadEconomyData() {
  const now = Date.now();
  const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Tüm 30 gün işlemler
  const { data: tx30 } = await supabaseAdmin
    .from('sp_transactions')
    .select('amount, type, created_at')
    .gte('created_at', since30d);
  const txs = tx30 || [];

  // Profile + tier dağılımı + total SP stoğu
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('subscription_tier, system_points, donatable_sp');
  const profs = profiles || [];

  // Hesaplamalar
  const total30dIn = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const total30dOut = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const txs7d = txs.filter(t => t.created_at >= since7d);
  const total7dIn = txs7d.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const total7dOut = txs7d.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  // Tip bazında gruplama
  const byType = new Map<string, { count: number; total: number; in: number; out: number }>();
  for (const t of txs) {
    const cur = byType.get(t.type) || { count: 0, total: 0, in: 0, out: 0 };
    cur.count++;
    cur.total += t.amount;
    if (t.amount > 0) cur.in += t.amount;
    else cur.out += Math.abs(t.amount);
    byType.set(t.type, cur);
  }
  const typeRows = Array.from(byType.entries())
    .map(([type, v]) => ({ type, ...v }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  // Tier dağılımı
  const tierCounts: Record<string, number> = { Free: 0, Plus: 0, Pro: 0, GodMaster: 0 };
  let totalSpStock = 0;
  let totalDonatable = 0;
  for (const p of profs) {
    const tier = p.subscription_tier || 'Free';
    if (tier in tierCounts) tierCounts[tier]++;
    else tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    totalSpStock += p.system_points || 0;
    totalDonatable += p.donatable_sp || 0;
  }

  // Mağaza alımları
  const storeRows = txs.filter(t => t.type === 'store_purchase');
  const storeCount = storeRows.length;
  const storeVolumeSp = storeRows.reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  // Hediye + bağış hacmi
  const giftSent = txs.filter(t => t.type === 'gift_sent');
  const donationSent = txs.filter(t => t.type === 'donation_sent');
  const giftVolume = giftSent.reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const donationVolume = donationSent.reduce((s, t) => s + Math.abs(t.amount || 0), 0);

  // Günlük seri (son 14 gün)
  const dailySeries: { date: string; in: number; out: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const day = d.toISOString().slice(0, 10);
    const dayTxs = txs.filter(t => t.created_at.startsWith(day));
    dailySeries.push({
      date: day,
      in: dayTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
      out: dayTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    });
  }

  return {
    total30dIn, total30dOut,
    total7dIn, total7dOut,
    typeRows,
    tierCounts,
    totalSpStock, totalDonatable,
    storeCount, storeVolumeSp,
    giftCount: giftSent.length, giftVolume,
    donationCount: donationSent.length, donationVolume,
    dailySeries,
    totalUsers: profs.length,
    activeSubscribers: tierCounts.Plus + tierCounts.Pro,
  };
}

export default async function EkonomiPage() {
  const d = await loadEconomyData();
  const maxDailyVal = Math.max(1, ...d.dailySeries.map(x => Math.max(x.in, x.out)));
  const totalSubscribers = d.activeSubscribers;
  const subscriberRate = d.totalUsers > 0 ? ((totalSubscribers / d.totalUsers) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-400" /> Ekonomi
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Son 30 günde {d.typeRows.reduce((s, r) => s + r.count, 0)} işlem ·{' '}
          <span className="text-emerald-300">+{d.total30dIn.toLocaleString('tr-TR')}</span> üretim ·{' '}
          <span className="text-red-300">−{d.total30dOut.toLocaleString('tr-TR')}</span> harcama
        </p>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={<TrendingUp className="w-4 h-4" />}
          label="30g SP Üretimi"
          value={d.total30dIn}
          accent="#10b981"
          sub={`+${d.total7dIn.toLocaleString('tr-TR')} (7g)`}
        />
        <Kpi
          icon={<TrendingDown className="w-4 h-4" />}
          label="30g SP Harcaması"
          value={d.total30dOut}
          accent="#ef4444"
          sub={`−${d.total7dOut.toLocaleString('tr-TR')} (7g)`}
        />
        <Kpi
          icon={<Coins className="w-4 h-4" />}
          label="Toplam SP Stoğu"
          value={d.totalSpStock}
          accent="#f59e0b"
          sub={`${d.totalDonatable.toLocaleString('tr-TR')} bağış-yapılabilir`}
        />
        <Kpi
          icon={<Crown className="w-4 h-4" />}
          label="Aktif Aboneler"
          value={totalSubscribers}
          accent="#a855f7"
          sub={`${d.totalUsers} kullanıcının %${subscriberRate}'si`}
        />
        <Kpi
          icon={<ShoppingBag className="w-4 h-4" />}
          label="Mağaza Alımı"
          value={d.storeCount}
          accent="#06b6d4"
          sub={`${d.storeVolumeSp.toLocaleString('tr-TR')} SP hacim`}
        />
        <Kpi
          icon={<Gift className="w-4 h-4" />}
          label="Hediye Akışı"
          value={d.giftCount}
          accent="#ec4899"
          sub={`${d.giftVolume.toLocaleString('tr-TR')} SP hacim`}
        />
        <Kpi
          icon={<Repeat className="w-4 h-4" />}
          label="Bağış Akışı"
          value={d.donationCount}
          accent="#14b8a6"
          sub={`${d.donationVolume.toLocaleString('tr-TR')} SP hacim`}
        />
        <Kpi
          icon={<Users className="w-4 h-4" />}
          label="Toplam Kullanıcı"
          value={d.totalUsers}
          accent="#3b82f6"
          sub="Tüm kayıtlı hesaplar"
        />
      </div>

      {/* Günlük seri grafiği */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-bold tracking-wider text-slate-300 mb-4">SON 14 GÜN — SP HAREKETİ</h2>
        <div className="flex items-end gap-1 h-40">
          {d.dailySeries.map((day, i) => {
            const inH = (day.in / maxDailyVal) * 100;
            const outH = (day.out / maxDailyVal) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${day.date}\nÜretim: +${day.in}\nHarcama: −${day.out}`}>
                <div className="flex-1 w-full flex flex-col-reverse gap-0.5">
                  {/* Üretim (yeşil, üst) */}
                  <div
                    className="rounded-t-sm bg-emerald-400/70 hover:bg-emerald-400 transition-colors"
                    style={{ height: `${inH}%`, minHeight: day.in > 0 ? 2 : 0 }}
                  />
                  {/* Harcama (kırmızı, üstüne biner) */}
                  <div
                    className="rounded-b-sm bg-red-400/70 hover:bg-red-400 transition-colors"
                    style={{ height: `${outH}%`, minHeight: day.out > 0 ? 2 : 0 }}
                  />
                </div>
                <span className="text-[8px] text-slate-500 font-mono">{day.date.slice(8, 10)}/{day.date.slice(5, 7)}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-400/70 rounded-sm" /> <span className="text-slate-400">Üretim</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-400/70 rounded-sm" /> <span className="text-slate-400">Harcama</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tier dağılımı */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold tracking-wider text-slate-300 mb-4">ÜYELİK PLANI DAĞILIMI</h2>
          <div className="space-y-2.5">
            {[
              { name: 'Free',      label: 'Ücretsiz',  color: '#94a3b8', emoji: '🆓' },
              { name: 'Plus',      label: 'Plus',      color: '#a855f7', emoji: '🚀' },
              { name: 'Pro',       label: 'Pro',       color: '#f59e0b', emoji: '👑' },
              { name: 'GodMaster', label: 'GodMaster', color: '#ef4444', emoji: '⚡' },
            ].map(t => {
              const count = d.tierCounts[t.name] || 0;
              const pct = d.totalUsers > 0 ? (count / d.totalUsers) * 100 : 0;
              return (
                <div key={t.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>{t.emoji}</span> {t.label}
                    </span>
                    <span className="text-slate-400">
                      <span className="font-bold text-slate-200">{count}</span> · %{pct.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: t.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SP tip bazında dağılım */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold tracking-wider text-slate-300 mb-4">SP İŞLEM TİPLERİ (30g)</h2>
          <div className="overflow-y-auto max-h-80 space-y-1.5">
            {d.typeRows.slice(0, 25).map(t => (
              <div
                key={t.type}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {TYPE_LABELS[t.type] || t.type}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{t.type} · {t.count} işlem</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold font-mono ${t.total >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {t.total >= 0 ? '+' : ''}{t.total.toLocaleString('tr-TR')}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {t.in > 0 && <span className="text-emerald-400/70">+{t.in.toLocaleString('tr-TR')}</span>}
                    {t.in > 0 && t.out > 0 && <span className="text-slate-600 mx-1">/</span>}
                    {t.out > 0 && <span className="text-red-400/70">−{t.out.toLocaleString('tr-TR')}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notlar */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200/80 space-y-1">
        <div><strong className="text-amber-200">Not:</strong> Gerçek para geliri (₺/$) RevenueCat / Google Play Console'dan takip edilir — bu sayfa sadece SP ekonomisinin sağlığını gösterir.</div>
        <div>SP üretimi {'>'} harcama ise enflasyon riski; harcama {'>'} üretim ise mağaza/hediye akışı yüksek (sağlıklı). İdeal denge: %50 üretim, %50 harcama oranı.</div>
      </div>
    </div>
  );
}

function Kpi({
  icon, label, value, accent, sub,
}: {
  icon: React.ReactNode; label: string; value: number; accent: string; sub?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{ background: `${accent}10`, borderColor: `${accent}30` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}25`, color: accent }}
        >
          {icon}
        </div>
        <span className="text-[10px] tracking-wider font-bold text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color: accent }}>
        {value.toLocaleString('tr-TR')}
      </div>
      {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
