'use client';

import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function Card({
  title,
  description,
  children,
  className = '',
  footer,
}: CardProps) {
  return (
    <div className={`bg-background border border-border rounded-lg shadow-sm ${className}`}>
      {(title || description) && (
        <div className="p-6 border-b border-border">
          {title && <h3 className="text-lg font-medium text-foreground">{title}</h3>}
          {description && <p className="mt-1 text-sm text-secondary">{description}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-input-bg border-t border-border">{footer}</div>
      )}
    </div>
  );
}
