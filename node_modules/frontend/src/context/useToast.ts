import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: Toast[];
  showToast: (message: string, options?: {
    type?: ToastType;
    duration?: number;
    action?: Toast['action'];
  }) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

// Default durations by type (in milliseconds)
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

export const useToast = create<ToastStore>((set, get) => ({
  toasts: [],

  showToast: (message, options = {}) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const type = options.type || 'info';
    const duration = options.duration ?? DEFAULT_DURATIONS[type];

    const newToast: Toast = {
      id,
      message,
      type,
      duration,
      action: options.action,
    };

    set(state => ({
      toasts: [...state.toasts, newToast]
    }));

    // Auto-hide after duration (unless duration is 0 for persistent toasts)
    if (duration > 0) {
      setTimeout(() => {
        get().hideToast(id);
      }, duration);
    }

    return id;
  },

  hideToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },
}));
