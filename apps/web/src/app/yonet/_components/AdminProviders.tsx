/**
 * Admin panel için client-side provider'lar.
 * Server layout client component'leri direkt sarmalayamadığı için bu wrapper.
 */
'use client';

import * as React from 'react';
import { AdminDialogProvider } from './AdminDialog';

export default function AdminProviders({ children }: { children: React.ReactNode }) {
  return <AdminDialogProvider>{children}</AdminDialogProvider>;
}
