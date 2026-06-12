import { useEffect, useState, useCallback } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

let toastIdCounter = 0;
let externalPush = null;

export function pushToast(type, message) {
  externalPush?.({ type, message });
}

export default function Notifications({ notifications }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = ++toastIdCounter;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    const duration = toast.type === "error" ? 8000 : 4000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    externalPush = addToast;
    return () => { externalPush = null; };
  }, [addToast]);

  /* Notifications are shown in the dropdown only, not as auto-toasts */

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (!toasts.length) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-sm animate-slide-in ${
            toast.type === "error"
              ? "bg-red-50 border-red-200"
              : toast.type === "success"
              ? "bg-emerald-50 border-emerald-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          ) : toast.type === "success" ? (
            <CheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={20} />
          ) : (
            <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          )}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className={`text-sm font-semibold ${
                toast.type === "error" ? "text-red-800" : toast.type === "success" ? "text-emerald-800" : "text-blue-800"
              }`}>{toast.title}</p>
            )}
            <p className={`text-sm ${toast.title ? "mt-0.5" : ""} ${
              toast.type === "error" ? "text-red-700" : toast.type === "success" ? "text-emerald-700" : "text-blue-700"
            }`}>{toast.message}</p>
          </div>
          <button onClick={() => removeToast(toast.id)} className={`flex-shrink-0 ${
            toast.type === "error" ? "text-red-400 hover:text-red-600" : toast.type === "success" ? "text-emerald-400 hover:text-emerald-600" : "text-blue-400 hover:text-blue-600"
          } transition-colors`}>
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
