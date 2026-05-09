/**
 * Yeni Çerçeve Ekle — Lottie upload + metadata, doğrudan mağazaya ekler.
 */
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import NewFrameForm from './NewFrameForm';

export default function NewFramePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/yonet/cerceveler" className="text-slate-400 hover:text-slate-100 inline-flex items-center text-sm">
          <ChevronLeft className="w-4 h-4 mr-1" /> Geri
        </Link>
        <span className="text-slate-600">/</span>
        <h1 className="text-xl font-semibold">Yeni Çerçeve Oluştur</h1>
      </div>
      <NewFrameForm />
    </div>
  );
}
