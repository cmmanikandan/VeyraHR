import React from 'react';

interface VeyraBrandHeaderProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export const VeyraBrandHeader: React.FC<VeyraBrandHeaderProps> = ({
  size = 'lg',
  subtitle,
  className = '',
  onClick,
}) => {
  // Dimension presets strictly aligned with exact design system rules
  const dimensionPresets = {
    sm: {
      logoHeight: 'h-[32px] w-auto',
      logoGap: 'gap-[12px]',
      wordmarkText: 'text-[20px]',
      taglineText: 'text-[9px]',
      taglineSpacing: 'tracking-[3px]',
    },
    md: {
      logoHeight: 'h-[38px] md:h-[42px] w-auto',
      logoGap: 'gap-[16px]',
      wordmarkText: 'text-[24px] md:text-[28px]',
      taglineText: 'text-[10px]',
      taglineSpacing: 'tracking-[5px]',
    },
    lg: {
      logoHeight: 'h-[40px] md:h-[48px] w-auto',
      logoGap: 'gap-[20px]',
      wordmarkText: 'text-[24px] sm:text-[28px] md:text-[34px]',
      taglineText: 'text-[11px]',
      taglineSpacing: 'tracking-[6px]',
    },
  };

  const current = dimensionPresets[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${current.logoGap} bg-transparent selection:bg-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* 1. Logo Icon on Left: Vertically centered with VeyraHR wordmark */}
      <img
        src="/logo.png"
        alt="VeyraHR Logo"
        className={`${current.logoHeight} object-contain shrink-0 self-center`}
      />

      {/* 2. Wordmark: Veyra (#172033) + HR (#2563EB) ONLY */}
      <div className="flex flex-col text-left justify-center shrink-0">
        <h1
          className={`font-extrabold ${current.wordmarkText} tracking-[-0.015em] leading-none select-none`}
          style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', 'Inter', sans-serif" }}
        >
          <span className="text-[#172033]">Veyra</span>
          <span className="text-[#2563EB]">HR</span>
        </h1>

        {/* Optional Subtitle (Shown only if explicitly passed) */}
        {subtitle && (
          <span
            className={`font-semibold ${current.taglineText} ${current.taglineSpacing} text-[#64748B] uppercase whitespace-nowrap block mt-1 select-none`}
            style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', 'Inter', sans-serif" }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
