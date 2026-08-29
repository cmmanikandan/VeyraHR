import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-veyra-blue/30 disabled:opacity-60 disabled:cursor-not-allowed select-none rounded-xl";
  
  const variants = {
    primary: "bg-veyra-blue hover:bg-veyra-blue-hover text-white shadow-sm hover:shadow active:scale-[0.99]",
    secondary: "bg-veyra-blue-soft text-veyra-blue hover:bg-blue-100 font-semibold active:scale-[0.99]",
    outline: "bg-white border border-veyra-border text-veyra-text hover:bg-veyra-bg-secondary hover:border-slate-300 shadow-xs",
    ghost: "text-veyra-text-sub hover:bg-veyra-bg-secondary hover:text-veyra-text",
    danger: "bg-veyra-danger text-white hover:bg-red-700 shadow-sm active:scale-[0.99]",
    success: "bg-veyra-success text-white hover:bg-emerald-700 shadow-sm active:scale-[0.99]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5 min-h-[36px]",
    md: "px-4 py-2.5 text-sm gap-2 min-h-[42px]",
    lg: "px-6 py-3.5 text-base gap-2.5 font-semibold min-h-[50px]",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : icon}
      <span>{children}</span>
    </button>
  );
};
