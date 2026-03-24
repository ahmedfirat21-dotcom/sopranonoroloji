/** SopranoChat — Veri Modelleri & Dummy Data */

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

export const DUMMY_LOCALAR: Loca[] = [
  {
    id: '1',
    locaAdi: 'Midnight Lounge',
    sahipAdi: 'Kaan Yıldız',
    sahipAvatar: null,
    anlikKapasite: 8,
    maksKapasite: 12,
    locaTuru: 'VIP',
    isLive: true,
    kategori: 'Müzik',
    aciklama: 'Premium müzik & sohbet deneyimi',
  },
  {
    id: '2',
    locaAdi: 'Crypto Alpha',
    sahipAdi: 'Emre Demir',
    sahipAvatar: null,
    anlikKapasite: 15,
    maksKapasite: 20,
    locaTuru: 'Elite',
    isLive: true,
    kategori: 'Yatırım',
    aciklama: 'Kripto piyasa analizleri',
  },
  {
    id: '3',
    locaAdi: 'Game Vault',
    sahipAdi: 'Arda Kaya',
    sahipAvatar: null,
    anlikKapasite: 4,
    maksKapasite: 10,
    locaTuru: 'Standart',
    isLive: true,
    kategori: 'Gaming',
  },
  {
    id: '4',
    locaAdi: 'Jazz & Chill',
    sahipAdi: 'Selin Arslan',
    sahipAvatar: null,
    anlikKapasite: 6,
    maksKapasite: 8,
    locaTuru: 'VIP',
    isLive: true,
    kategori: 'Müzik',
    aciklama: 'Caz müzik ve rahat sohbet',
  },
  {
    id: '5',
    locaAdi: 'Kod Fabrikası',
    sahipAdi: 'Burak Çelik',
    sahipAvatar: null,
    anlikKapasite: 3,
    maksKapasite: 6,
    locaTuru: 'Standart',
    isLive: false,
    kategori: 'Teknoloji',
  },
  {
    id: '6',
    locaAdi: 'Sanat Galerisi',
    sahipAdi: 'Elif Yılmaz',
    sahipAvatar: null,
    anlikKapasite: 5,
    maksKapasite: 10,
    locaTuru: 'Elite',
    isLive: true,
    kategori: 'Sanat',
    aciklama: 'Dijital sanat & NFT tartışmaları',
  },
  {
    id: '7',
    locaAdi: 'Spor Arena',
    sahipAdi: 'Mert Öztürk',
    sahipAvatar: null,
    anlikKapasite: 12,
    maksKapasite: 16,
    locaTuru: 'Standart',
    isLive: true,
    kategori: 'Spor',
  },
  {
    id: '8',
    locaAdi: 'Gece Kulübü',
    sahipAdi: 'Deniz Şahin',
    sahipAvatar: null,
    anlikKapasite: 9,
    maksKapasite: 12,
    locaTuru: 'VIP',
    isLive: false,
    kategori: 'Eğlence',
    aciklama: 'DJ performansları & parti',
  },
];
