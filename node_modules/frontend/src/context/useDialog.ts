import { useContext } from 'react';
import { DialogContext, type DialogContextType } from './dialogContextDefinition'; // Import from new file

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
