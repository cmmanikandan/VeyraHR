import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant = 
  | 'blue' 
  | 'navy' 
  | 'green' 
  | 'amber' 
  | 'red' 
  | 'purple' 
  | 'indigo' 
  | 'cyan' 
  | 'gray' 
  | 'success' 
  | 'warning' 
  | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  icon,
  className,
}) => {
  const normalizedVariant = variant === 'success' ? 'green' : variant === 'warning' ? 'amber' : variant === 'danger' ? 'red' : variant;

  const variants: Record<string, string> = {
    blue: "bg-veyra-blue-soft text-veyra-blue border-veyra-blue-border/60",
    navy: "bg-veyra-navy/10 text-veyra-navy border-veyra-navy/20",
    green: "bg-veyra-success-bg text-veyra-success border-emerald-200",
    amber: "bg-veyra-warning-bg text-veyra-warning border-amber-200",
    red: "bg-veyra-danger-bg text-veyra-danger border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    gray: "bg-slate-100 text-veyra-text-sub border-slate-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] gap-1 rounded-md font-medium",
    md: "px-2.5 py-1 text-xs gap-1.5 rounded-lg font-semibold",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center border select-none tracking-tight",
        variants[normalizedVariant] || variants.blue,
        sizes[size],
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};
