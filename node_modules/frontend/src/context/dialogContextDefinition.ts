import { createContext } from 'react';
import type { ReactNode } from 'react';

// Keep DialogOptions here as it's used by DialogContextType
export interface DialogOptions {
  title?: string;
  content: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  hideCancelButton?: boolean;
  hideConfirmButton?: boolean;
}

export interface DialogContextType {
  isOpen: boolean;
  options: DialogOptions | null;
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
}

export const DialogContext = createContext<DialogContextType | undefined>(undefined);
