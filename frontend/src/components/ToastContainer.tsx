import React from 'react';
import { useToast, Toast, ToastType } from '../context/useToast';
import { IonIcon } from '@ionic/react';
import { 
  checkmarkCircle, 
  alertCircle, 
  warningOutline, 
  informationCircle,
  close 
} from 'ionicons/icons';

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const iconMap = {
    success: checkmarkCircle,
    error: alertCircle,
    warning: warningOutline,
    info: informationCircle,
  };

  const colorMap = {
    success: 'text-success-500',
    error: 'text-danger-500',
    warning: 'text-warning-500',
    info: 'text-primary-500',
  };

  return (
    <IonIcon 
      icon={iconMap[type]} 
      className={`text-xl ${colorMap[type]}`}
    />
  );
};

const ToastItem: React.FC<{ 
  toast: Toast; 
  onDismiss: (id: string) => void; 
}> = ({ toast, onDismiss }) => {
  const bgColorMap = {
    success: 'bg-success-50 border-success-200',
    error: 'bg-danger-50 border-danger-200',
    warning: 'bg-warning-50 border-warning-200',
    info: 'bg-primary-50 border-primary-200',
  };

  const textColorMap = {
    success: 'text-success-800',
    error: 'text-danger-800',
    warning: 'text-warning-800',
    info: 'text-primary-800',
  };

  return (
    <div className={`
      flex items-start gap-3 p-4 rounded-lg border shadow-lg
      ${bgColorMap[toast.type]} ${textColorMap[toast.type]}
      transform transition-all duration-300 ease-out
      animate-in slide-in-from-right-full
    `}>
      <ToastIcon type={toast.type} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">
          {toast.message}
        </p>
        
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={`
              mt-2 text-xs font-semibold underline
              hover:no-underline focus:outline-none
              ${textColorMap[toast.type]}
            `}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className={`
          flex-shrink-0 p-1 rounded-full
          hover:bg-black/10 focus:outline-none focus:bg-black/10
          transition-colors duration-200
        `}
        aria-label="Dismiss notification"
      >
        <IonIcon icon={close} className="text-lg opacity-60" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="
      fixed top-4 right-4 z-50 
      flex flex-col gap-2 
      max-w-sm w-full
      pointer-events-none
    ">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem 
            toast={toast} 
            onDismiss={hideToast}
          />
        </div>
      ))}
    </div>
  );
};
