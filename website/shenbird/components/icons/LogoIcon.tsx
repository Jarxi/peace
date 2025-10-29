import React from 'react';
import Image from 'next/image';

export const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Image
    src="/shumbird_black.png"
    alt="Shumbird Logo"
    width={32}
    height={32}
    className={className}
  />
);
