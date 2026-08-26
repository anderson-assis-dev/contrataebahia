import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      show,
      success: (message, duration) => show(message, 'success', duration),
      error: (message, duration) => show(message, 'error', duration),
      info: (message, duration) => show(message, 'info', duration),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <Icon size={18} className="toast-icon" />
              <span className="toast-msg">{toast.message}</span>
              <button type="button" className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Fechar">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de ToastProvider');
  return ctx;
};
