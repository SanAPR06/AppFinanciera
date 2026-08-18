import { CheckCircle2, XCircle } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-buttons shadow-none border text-body-sm font-medium animate-toast-in ${
            t.variant === 'success'
              ? 'bg-electric-lime border-electric-lime text-off-black-ink'
              : 'bg-off-black-ink border-off-black-ink text-off-white-canvas'
          }`}
        >
          {t.variant === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
