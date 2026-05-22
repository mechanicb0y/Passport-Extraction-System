import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ title, message, type = "info" }) => {
      const id = crypto?.randomUUID?.() ?? String(Date.now());
      setToasts((current) => [...current, { id, title, message, type }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify, dismiss }), [dismiss, notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] ?? Info;

          return (
            <div className={`toast toast-${toast.type}`} key={toast.id}>
              <Icon size={18} aria-hidden="true" />
              <div>
                <strong>{toast.title}</strong>
                {toast.message ? <span>{toast.message}</span> : null}
              </div>
              <button className="icon-button ghost" type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
