'use client';

import { LoadingSpinner } from './LoadingSpinner';

interface InputFieldProps {
  label?: string;
  type?: string;
  placeholder?: string;
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  loading?: boolean;
  helperText?: string;
  name?: string;
  id?: string;
  className?: string;
  labelClassName?: string;
}

export function InputField({
  label,
  type = 'text',
  placeholder,
  error,
  value,
  onChange,
  required,
  loading,
  helperText,
  name,
  id,
  className = '',
  labelClassName = '',
}: InputFieldProps) {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-secondary ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          id={inputId}
          name={name}
          className={`
            w-full px-3 py-2 
            bg-input-bg
            border border-border
            rounded-md
            text-foreground
            placeholder:text-secondary/60
            focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
            disabled:bg-input-bg disabled:text-secondary
            transition-colors
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          `}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={loading}
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
      {helperText && !error && (
        <p className="text-sm text-secondary">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
