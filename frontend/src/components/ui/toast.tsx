'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'destructive' | 'success';

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextType = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all animate-in slide-in-from-right-full',
              toast.variant === 'destructive' && 'border-destructive bg-destructive text-destructive-foreground',
              toast.variant === 'success' && 'border-emerald-500/20 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
              (!toast.variant || toast.variant === 'default') && 'bg-background text-foreground',
            )}
            role="alert"
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="text-sm opacity-80">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Close"
            >
              <span className="sr-only">Close</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export { ToastProvider, useToast, type Toast };
