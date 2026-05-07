/**
 * SopranoChat — Admin Dialog (confirm/alert/prompt yerine)
 * Kullanıcı talebi: "klasik popup pencere istemiyorum"
 *
 * Kullanım:
 *   const dialog = useAdminDialog();
 *   const ok = await dialog.confirm({ title, message, danger });
 *   await dialog.alert({ title, message });
 *   const value = await dialog.prompt({ title, message, defaultValue });
 *
 * Provider <AdminDialogProvider> _components seviyesinde (admin layout'ta) kuruldu.
 */
'use client';

import * as React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

type ConfirmOpts = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};
type AlertOpts = {
  title: string;
  message?: string;
  okLabel?: string;
  variant?: 'success' | 'error' | 'info';
};
type PromptOpts = {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  multiline?: boolean;
  inputType?: 'text' | 'number' | 'password';
  okLabel?: string;
  cancelLabel?: string;
};

type DialogState =
  | { kind: 'confirm'; opts: ConfirmOpts; resolve: (v: boolean) => void }
  | { kind: 'alert'; opts: AlertOpts; resolve: () => void }
  | { kind: 'prompt'; opts: PromptOpts; resolve: (v: string | null) => void }
  | null;

interface AdminDialogContextValue {
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
  alert: (opts: AlertOpts) => Promise<void>;
  prompt: (opts: PromptOpts) => Promise<string | null>;
}

const AdminDialogContext = React.createContext<AdminDialogContextValue | null>(null);

export function useAdminDialog(): AdminDialogContextValue {
  const ctx = React.useContext(AdminDialogContext);
  if (!ctx) throw new Error('useAdminDialog must be used within AdminDialogProvider');
  return ctx;
}

export function AdminDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DialogState>(null);
  const [promptValue, setPromptValue] = React.useState('');

  const api: AdminDialogContextValue = React.useMemo(() => ({
    confirm: (opts) => new Promise<boolean>((resolve) => {
      setState({ kind: 'confirm', opts, resolve });
    }),
    alert: (opts) => new Promise<void>((resolve) => {
      setState({ kind: 'alert', opts, resolve });
    }),
    prompt: (opts) => new Promise<string | null>((resolve) => {
      setPromptValue(opts.defaultValue ?? '');
      setState({ kind: 'prompt', opts, resolve });
    }),
  }), []);

  const close = React.useCallback((result: any) => {
    if (!state) return;
    state.resolve(result);
    setState(null);
    setPromptValue('');
  }, [state]);

  // Esc + Backdrop close
  React.useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.kind === 'confirm') close(false);
        else if (state.kind === 'alert') close(undefined);
        else if (state.kind === 'prompt') close(null);
      }
      if (e.key === 'Enter' && !e.shiftKey && state.kind !== 'prompt') {
        // Confirm/alert için Enter onayı
        if (state.kind === 'confirm') close(true);
        else if (state.kind === 'alert') close(undefined);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state, close]);

  return (
    <AdminDialogContext.Provider value={api}>
      {children}
      {state && (
        <DialogShell state={state} onClose={close} promptValue={promptValue} setPromptValue={setPromptValue} />
      )}
    </AdminDialogContext.Provider>
  );
}

function DialogShell({
  state, onClose, promptValue, setPromptValue,
}: {
  state: NonNullable<DialogState>;
  onClose: (v: any) => void;
  promptValue: string;
  setPromptValue: (v: string) => void;
}) {
  const { kind, opts } = state;
  const danger = kind === 'confirm' && state.opts.danger;
  const accent = danger ? '#F87171' : '#5EEAD4';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(8, 12, 22, 0.65)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          if (kind === 'confirm') onClose(false);
          else if (kind === 'alert') onClose(undefined);
          else if (kind === 'prompt') onClose(null);
        }
      }}
    >
      <div
        className="w-full max-w-md bg-[#0F1929] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          boxShadow: `0 30px 80px -10px rgba(0,0,0,0.6), 0 0 0 1px ${accent}1a`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — ikon + başlık */}
        <div className="flex items-start gap-3 p-5 border-b border-white/5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `${accent}1a`,
              border: `1px solid ${accent}40`,
            }}
          >
            {danger ? (
              <AlertTriangle className="w-5 h-5" style={{ color: accent }} />
            ) : kind === 'alert' && opts.variant === 'success' ? (
              <Check className="w-5 h-5" style={{ color: accent }} />
            ) : kind === 'alert' && opts.variant === 'error' ? (
              <AlertTriangle className="w-5 h-5" style={{ color: '#F87171' }} />
            ) : (
              <AlertTriangle className="w-5 h-5" style={{ color: accent }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-100 leading-snug">{opts.title}</h3>
            {(kind === 'confirm' || kind === 'alert' || kind === 'prompt') && (opts as any).message && (
              <p className="text-sm text-slate-400 mt-1 whitespace-pre-line leading-relaxed">
                {(opts as any).message}
              </p>
            )}
          </div>
        </div>

        {/* Prompt input */}
        {kind === 'prompt' && (
          <div className="px-5 py-4 border-b border-white/5">
            {state.opts.multiline ? (
              <textarea
                autoFocus
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={state.opts.placeholder}
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-cyan-500/50 focus:outline-none text-slate-100 text-sm resize-none"
              />
            ) : (
              <input
                autoFocus
                type={state.opts.inputType || 'text'}
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={state.opts.placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onClose(promptValue);
                }}
                className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-cyan-500/50 focus:outline-none text-slate-100 text-sm"
              />
            )}
          </div>
        )}

        {/* Butonlar */}
        <div className="flex justify-end gap-2 p-4 bg-black/20">
          {kind === 'confirm' && (
            <>
              <button
                type="button"
                onClick={() => onClose(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
              >
                {state.opts.cancelLabel || 'İptal'}
              </button>
              <button
                type="button"
                onClick={() => onClose(true)}
                autoFocus
                className="px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                style={{
                  background: danger ? 'rgba(248,113,113,0.18)' : 'rgba(94,234,212,0.18)',
                  border: `1px solid ${accent}40`,
                  color: accent,
                }}
              >
                {state.opts.confirmLabel || (danger ? 'Sil' : 'Tamam')}
              </button>
            </>
          )}
          {kind === 'alert' && (
            <button
              type="button"
              onClick={() => onClose(undefined)}
              autoFocus
              className="px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              style={{
                background: 'rgba(94,234,212,0.18)',
                border: '1px solid rgba(94,234,212,0.4)',
                color: '#5EEAD4',
              }}
            >
              {state.opts.okLabel || 'Tamam'}
            </button>
          )}
          {kind === 'prompt' && (
            <>
              <button
                type="button"
                onClick={() => onClose(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
              >
                {state.opts.cancelLabel || 'İptal'}
              </button>
              <button
                type="button"
                onClick={() => onClose(promptValue)}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                style={{
                  background: 'rgba(94,234,212,0.18)',
                  border: '1px solid rgba(94,234,212,0.4)',
                  color: '#5EEAD4',
                }}
              >
                {state.opts.okLabel || 'Tamam'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
