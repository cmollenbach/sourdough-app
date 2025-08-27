import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (message: string, options?: {
    type?: ToastType;
    duration?: number;
    action?: ToastMessage['action'];
  }) => void;
  removeToast: (id: number) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;

// Default durations by type (in milliseconds)
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, options: {
    type?: ToastType;
    duration?: number;
    action?: ToastMessage['action'];
  } = {}) => {
    const id = toastIdCounter++;
    const type = options.type || 'info';
    const duration = options.duration ?? DEFAULT_DURATIONS[type];
    
    const newToast: ToastMessage = {
      id,
      type,
      message,
      duration,
      action: options.action,
    };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    // Auto-remove toast after duration (unless duration is 0 for persistent toasts)
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, clearAllToasts }}>
      {children}
      {/* Enhanced Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 p-4 rounded-lg border shadow-lg pointer-events-auto
              transform transition-all duration-300 ease-out
              ${toast.type === 'success' ? 'bg-success-50 border-success-200 text-success-800' : ''}
              ${toast.type === 'error' ? 'bg-danger-50 border-danger-200 text-danger-800' : ''}
              ${toast.type === 'info' ? 'bg-primary-50 border-primary-200 text-primary-800' : ''}
              ${toast.type === 'warning' ? 'bg-warning-50 border-warning-200 text-warning-800' : ''}
              animate-in slide-in-from-right-full
            `}
          >
            {/* Icon */}
            <div className={`
              flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
              ${toast.type === 'success' ? 'bg-success-500 text-white' : ''}
              ${toast.type === 'error' ? 'bg-danger-500 text-white' : ''}
              ${toast.type === 'info' ? 'bg-primary-500 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-warning-500 text-white' : ''}
            `}>
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'info' && 'i'}
              {toast.type === 'warning' && '!'}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium break-words">
                {toast.message}
              </p>
              
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  className="mt-2 text-xs font-semibold underline hover:no-underline focus:outline-none"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="
                flex-shrink-0 p-1 rounded-full
                hover:bg-black/10 focus:outline-none focus:bg-black/10
                transition-colors duration-200 text-lg opacity-60 hover:opacity-100
              "
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};