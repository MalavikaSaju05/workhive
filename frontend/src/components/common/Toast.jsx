import { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

// ─── Toast item ───────────────────────────────────────────────────────────────
const ICONS = {
  success: { icon: CheckCircle2, cls: 'text-emerald-500' },
  error:   { icon: XCircle,      cls: 'text-red-500'     },
  info:    { icon: AlertCircle,  cls: 'text-blue-500'    },
};

const Toast = ({ id, message, type = 'info', onRemove }) => {
  const { icon: Icon, cls } = ICONS[type] || ICONS.info;
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 3500);
    return () => clearTimeout(t);
  }, [id, onRemove]);

  return (
    <div className="flex items-start gap-2.5 bg-white border border-gray-200 rounded-xl
                    shadow-lg px-4 py-3 min-w-[260px] max-w-sm animate-slide-up">
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cls}`} />
      <p className="text-sm text-gray-800 flex-1 leading-snug">{message}</p>
      <button onClick={() => onRemove(id)} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─── Toast container ──────────────────────────────────────────────────────────
export const ToastContainer = ({ toasts, onRemove }) => (
  <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
    {toasts.map((t) => (
      <Toast key={t.id} {...t} onRemove={onRemove} />
    ))}
  </div>
);

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};