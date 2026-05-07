"use client";

/**
 * InventoryModal — Kullanıcı envanter yönetimi.
 * Mevcut ürünler + ekle/kaldır + "Test hesabı yap" kısayolu.
 */
import { useEffect, useState } from 'react';
import { useAdminDialog } from '../../_components/AdminDialog';
import { Loader2, Trash2, Plus, Sparkles, Check, X, Search } from 'lucide-react';

type Item = {
  id: string;
  category: string;
  name: string;
  art_emoji: string | null;
  bg_gradient_start: string | null;
  bg_gradient_end: string | null;
  price_sp: number;
  rarity: string | null;
  active: boolean | null;
};

type InvEntry = {
  item_id: string;
  acquired_at: string;
  acquired_via: string | null;
  item: Item | null;
};

const CAT_LABELS: Record<string, string> = {
  frames: 'Çerçeveler',
  entry_effect: 'Giriş Animasyonları',
  gift: 'Hediyeler',
  glow_message: 'Parlak Mesajlar',
  effect: 'Efektler',
  theme: 'Temalar',
  background: 'Arkaplan',
  emoji: 'Emojiler',
  badge: 'Rozetler',
};

export default function InventoryModal({
  userId,
  displayName,
  onClose,
  onChanged,
}: {
  userId: string;
  displayName: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const dialog = useAdminDialog();
  const [inventory, setInventory] = useState<InvEntry[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<'owned' | 'add'>('owned');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const loadAll = async () => {
    try {
      const [invRes, itemsRes] = await Promise.all([
        fetch(`/yonet/api/users/${userId}/inventory`),
        fetch('/yonet/api/store/items/bulk'),
      ]);
      const invJson = await invRes.json();
      const itemsJson = await itemsRes.json();
      setInventory(invJson.inventory || []);
      setAllItems(itemsJson.items || []);
    } catch (e: any) {
      await dialog.alert({ title: 'Yükleme hatası', message: e.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const callAction = async (body: any, busyKey = 'global') => {
    setBusy(busyKey);
    try {
      const res = await fetch(`/yonet/api/users/${userId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'İşlem başarısız');
      }
      await loadAll();
      onChanged();
    } catch (e: any) {
      await dialog.alert({ title: 'Hata', message: e.message, variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const handleTestAccount = async () => {
    const ok = await dialog.confirm({
      title: `${displayName} — Test hesabı yap`,
      message:
        '• Üyelik planı: PRO\n' +
        '• SP bakiyesi: 999.999\n' +
        '• Tüm aktif ürünler envantere eklenecek\n\n' +
        'Geri almak için: tier\'ı Free yap, SP\'yi düşür, "Envanteri Temizle" tıkla.',
      confirmLabel: 'Test hesabı yap',
    });
    if (!ok) return;
    await callAction({ test_account: true }, 'test');
  };

  const ownedIds = new Set(inventory.map(i => i.item_id));

  // Mağazadaki ürünler — kullanıcının sahip olmadıkları (eklenebilir)
  const addable = allItems.filter(i => !ownedIds.has(i.id) && i.active);
  const filteredAddable = addable.filter(i => {
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
    }
    return true;
  });

  // Kategorilerin listesi
  const categories = Array.from(new Set(allItems.map(i => i.category))).sort();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-auto">
      <div className="bg-slate-900 border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-3xl my-2 sm:my-8">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold flex items-center gap-2 truncate">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              Envanter — {displayName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? 'Yükleniyor...' : `${inventory.length} ürün sahibi · ${allItems.length} mağazada toplam`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl w-8 h-8 flex items-center justify-center shrink-0"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : (
          <>
            {/* Hızlı eylemler */}
            <div className="px-5 py-3 border-b border-white/10 bg-amber-500/5">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleTestAccount}
                  disabled={busy === 'test'}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/25 disabled:opacity-50 flex items-center gap-1.5"
                  title="Pro tier + 999999 SP + tüm aktif ürünler envantere"
                >
                  {busy === 'test' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Test Hesabı Yap
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await dialog.confirm({
                      title: 'Tüm ürünleri envantere ekle',
                      message: 'Mağazadaki tüm aktif ürünler bu kullanıcının envanterine eklensin mi?',
                      confirmLabel: 'Hepsini ekle',
                    });
                    if (!ok) return;
                    callAction({ add_all: true }, 'addAll');
                  }}
                  disabled={busy === 'addAll'}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/25 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {busy === 'addAll' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Tümünü Ekle
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await dialog.confirm({
                      title: `${displayName} envanteri temizlenecek`,
                      message: 'Tüm sahip olduğu ürünler kaldırılacak. Devam edilsin mi?',
                      confirmLabel: 'Temizle',
                      danger: true,
                    });
                    if (!ok) return;
                    callAction({ clear: true }, 'clear');
                  }}
                  disabled={busy === 'clear' || inventory.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-500/25 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {busy === 'clear' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Envanteri Temizle
                </button>
              </div>
            </div>

            {/* Sekmeler */}
            <div className="flex border-b border-white/10">
              <button
                type="button"
                onClick={() => setTab('owned')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                  tab === 'owned'
                    ? 'text-amber-300 border-b-2 border-amber-500/60 bg-amber-500/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sahip Olduğu ({inventory.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('add')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                  tab === 'add'
                    ? 'text-cyan-300 border-b-2 border-cyan-500/60 bg-cyan-500/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Eklenebilir ({addable.length})
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {tab === 'owned' && (
                <>
                  {inventory.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-sm">
                      Bu kullanıcının envanteri boş.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {inventory.map(entry => (
                        <ItemCard
                          key={entry.item_id}
                          item={entry.item}
                          itemId={entry.item_id}
                          owned
                          acquiredVia={entry.acquired_via}
                          onAction={() => callAction({ remove: entry.item_id }, entry.item_id)}
                          busy={busy === entry.item_id}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {tab === 'add' && (
                <>
                  {/* Filtreler */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Ürün ara..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/30 border border-white/10 focus:border-cyan-500/50 focus:outline-none text-xs"
                      />
                    </div>
                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      aria-label="Kategori"
                      className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs"
                    >
                      <option value="all">Tüm Kategoriler</option>
                      {categories.map(c => (
                        <option key={c} value={c}>{CAT_LABELS[c] || c}</option>
                      ))}
                    </select>
                  </div>

                  {filteredAddable.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-sm">
                      {addable.length === 0 ? 'Tüm aktif ürünler zaten envantere eklenmiş.' : 'Filtreyle eşleşen ürün yok.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {filteredAddable.map(item => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          itemId={item.id}
                          onAction={() => callAction({ add: item.id }, item.id)}
                          busy={busy === item.id}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ItemCard({
  item, itemId, owned, acquiredVia, onAction, busy,
}: {
  item: Item | null;
  itemId: string;
  owned?: boolean;
  acquiredVia?: string | null;
  onAction: () => void;
  busy: boolean;
}) {
  const grad = item?.bg_gradient_start && item?.bg_gradient_end
    ? `linear-gradient(135deg, ${item.bg_gradient_start}, ${item.bg_gradient_end})`
    : 'linear-gradient(135deg, #1e293b, #0f172a)';

  return (
    <div
      className="rounded-lg border bg-white/5 p-2 relative"
      style={{
        borderColor: item?.bg_gradient_start ? `${item.bg_gradient_start}40` : 'rgba(255,255,255,0.1)',
      }}
    >
      <div
        className="w-full h-12 rounded-md flex items-center justify-center text-2xl mb-1.5"
        style={{ background: grad }}
      >
        {item?.art_emoji || '📦'}
      </div>
      <div className="text-[11px] font-bold text-slate-100 truncate" title={item?.name || itemId}>
        {item?.name || itemId}
      </div>
      <div className="text-[9px] text-slate-500 truncate">
        {CAT_LABELS[item?.category || ''] || item?.category || 'bilinmeyen'}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[9px] text-amber-300 font-mono">
          {item?.price_sp.toLocaleString('tr-TR') || '?'} SP
        </span>
        <button
          type="button"
          onClick={onAction}
          disabled={busy}
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors flex items-center gap-1 ${
            owned
              ? 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
          }`}
        >
          {busy ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : owned ? <X className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
          {owned ? 'Çıkar' : 'Ekle'}
        </button>
      </div>
      {acquiredVia && (
        <div className="text-[8px] text-slate-600 mt-0.5 truncate">{acquiredVia}</div>
      )}
    </div>
  );
}
