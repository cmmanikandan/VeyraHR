import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-veyra-border bg-white/60 ${className || ''}`}>
      <div className="w-12 h-12 rounded-2xl bg-veyra-blue-soft text-veyra-blue flex items-center justify-center mb-3 shadow-xs">
        {icon || <FolderOpen className="w-6 h-6 text-veyra-blue" />}
      </div>
      <h4 className="text-base font-bold text-veyra-text tracking-tight">{title}</h4>
      <p className="text-xs text-veyra-text-sub max-w-sm mt-1 mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
