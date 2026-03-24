/** SopranoChat — Veri Modelleri */

export interface Loca {
  id: string;
  locaAdi: string;
  sahipAdi: string;
  sahipAvatar: string | null;
  anlikKapasite: number;
  maksKapasite: number;
  locaTuru: 'VIP' | 'Standart' | 'Elite';
  isLive: boolean;
  kategori: string;
  aciklama?: string;
}

