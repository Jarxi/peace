import React from 'react';
import Image from 'next/image';

export const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Image
    src="/shenbird_black.png"
    alt="Shenbird Logo"
    width={32}
    height={32}
    className={className}
  />
);
