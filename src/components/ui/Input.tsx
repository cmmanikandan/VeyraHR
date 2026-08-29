import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, type = 'text', required, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';
    const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full text-left">
        {label && (
          <label className="block text-xs font-semibold text-veyra-text mb-1.5">
            {label}
            {(required || label.includes('*')) && (
              <span className="text-veyra-danger ml-0.5 font-bold">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-veyra-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            required={required}
            className={clsx(
              "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-veyra-text placeholder:text-veyra-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-veyra-blue/20 focus:border-veyra-blue",
              icon ? "pl-10" : "pl-3.5",
              isPasswordType ? "pr-10" : "pr-3.5",
              error ? "border-veyra-danger focus:ring-veyra-danger/20" : "border-veyra-border",
              className
            )}
            {...props}
          />
          {isPasswordType && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-veyra-text-muted hover:text-veyra-text transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-veyra-danger mt-1 font-medium flex items-center gap-1">{error}</p>}
        {hint && !error && <p className="text-xs text-veyra-text-sub mt-1">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
