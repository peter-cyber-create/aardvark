'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'lg' | 'medium' | 'small' | 'large';
  className?: string;
  color?: string;
}

export function LoadingSpinner({ size = 'medium', className = '', color }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    lg: 'h-8 w-8',
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-b-2 border-current ${sizeClasses[size]}`}
        style={color ? { color } : {}}
      />
    </div>
  );
}
