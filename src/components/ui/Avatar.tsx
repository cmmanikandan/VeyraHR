import React from 'react';
import { clsx } from 'clsx';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | 'on_leave';
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
  status,
  onClick,
}) => {
  const getInitials = (n: string) => {
    if (!n) return 'V';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg font-bold',
  };

  const statusDot = {
    online: 'bg-emerald-500 ring-white',
    offline: 'bg-slate-300 ring-white',
    on_leave: 'bg-amber-500 ring-white',
  };

  return (
    <div onClick={onClick} className="relative inline-block select-none shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={clsx(
            'rounded-full object-cover border border-veyra-border/60 shadow-2xs',
            sizes[size],
            className
          )}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full bg-veyra-blue-soft text-veyra-blue font-bold flex items-center justify-center border border-veyra-blue-border/60',
            sizes[size],
            className
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full ring-2',
            size === 'sm' ? 'w-2 h-2' : 'w-3 h-3',
            statusDot[status]
          )}
        />
      )}
    </div>
  );
};
