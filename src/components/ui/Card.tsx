import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean;
  variant?: 'default' | 'flat' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  padded = true,
  variant = 'default',
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        "rounded-veyra-lg transition-all duration-200",
        variant === 'default' && !className?.includes('bg-') && "bg-white border border-veyra-border shadow-veyra",
        variant === 'default' && className?.includes('bg-') && "border border-veyra-border shadow-veyra",
        variant === 'flat' && !className?.includes('bg-') && "bg-veyra-bg-secondary border border-veyra-border/60",
        variant === 'bordered' && !className?.includes('bg-') && "bg-white border-2 border-veyra-border",
        padded && "p-5 sm:p-6",
        interactive && "hover:shadow-veyra-hover hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
