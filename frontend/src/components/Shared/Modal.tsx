import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string; // Add title as an optional prop
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"> {/* Increased bg opacity slightly for better focus */}
      <div className="bg-surface-elevated rounded-lg shadow-xl p-6 w-full max-w-md relative"> {/* Added max-w-md for better responsiveness */}
        <button
          className="absolute top-3 right-3 text-text-secondary hover:text-text-primary transition-colors" // Adjusted styling
          onClick={onClose}
          aria-label="Close modal"
        >
          {/* Using an SVG for a cleaner close icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {title && <h2 className="text-xl font-semibold text-text-primary mb-4">{title}</h2>}
        <div className={title ? "mt-2" : ""}>{/* Add margin if title exists */}
          {children}
        </div>
      </div>
    </div>
  );
}