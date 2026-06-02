import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: CustomEvent<Omit<ToastMessage, 'id'>>) => {
      const newToast = { ...e.detail, id: Math.random().toString(36).substring(2, 9) };
      setToasts((prev) => [...prev, newToast]);
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3000);
    };

    window.addEventListener('toast' as any, handleToast);
    return () => window.removeEventListener('toast' as any, handleToast);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[280px] shadow-lg border-l-4 bg-brand-white ${
              toast.type === 'success' ? 'border-brand-dark text-brand-dark' :
              toast.type === 'error' ? 'border-red-500 text-red-600' :
              'border-brand-gold text-brand-dark'
            }`}
          >
            {toast.type === 'success' ? <Check size={18} /> : 
             toast.type === 'error' ? <X size={18} /> : <Info size={18} />}
            <span className="text-sm font-medium tracking-wide flex-1">{toast.message}</span>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-brand-dark/40 hover:text-brand-dark transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
