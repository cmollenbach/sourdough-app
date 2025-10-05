import React, { useState } from 'react'; // Removed createContext
import type { ReactNode } from 'react'; // Import ReactNode as a type
import { DialogContext, type DialogOptions } from './dialogContextDefinition'; // Removed DialogContextType import

// DialogOptions and DialogContextType are now imported

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const showDialog = (newOptions: DialogOptions) => {
    setOptions(newOptions);
    setIsOpen(true);
  };

  const hideDialog = () => {
    // The actual onCancel logic from options is typically handled by the Modal/DialogManager
    // when the cancel button is clicked, before hideDialog is called.
    // This function primarily just resets the state.
    setIsOpen(false);
    // Delay resetting options to allow for fade-out animations if any
    // setTimeout(() => setOptions(null), 300); // Optional: if you have animations
    setOptions(null); 
  };

  return (
    <DialogContext.Provider value={{ isOpen, options, showDialog, hideDialog }}>
      {children}
    </DialogContext.Provider>
  );
};