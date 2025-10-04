import type { ReactNode } from 'react';
import { useState } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      tabIndex={0}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-text-primary text-text-inverse text-xs rounded shadow z-50 whitespace-nowrap">
          {content}
        </span>
      )}
    </span>
  );
}