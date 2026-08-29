import React from 'react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="p-8 sm:p-12 bg-white rounded-3xl border border-veyra-border shadow-xs text-center space-y-4 my-4 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-veyra-blue-soft border border-veyra-blue-border/60 text-veyra-blue flex items-center justify-center mx-auto shadow-2xs">
        {icon}
      </div>
      <div>
        <h4 className="text-lg font-extrabold text-veyra-text tracking-tight">{title}</h4>
        <p className="text-xs text-veyra-text-sub font-medium mt-1 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onAction}
            icon={actionIcon}
            className="font-bold px-6 py-2.5 text-xs shadow-xs"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
