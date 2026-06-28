'use client';

import Image from 'next/image';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ variant = 'dark', size = 'md', showText = false }: LogoProps) {
  const sizes = {
    sm: 'h-16 w-[136px]',
    md: 'h-20 w-[170px]',
    lg: 'h-24 w-[204px]',
  };

  return (
    <div className="flex items-center">
      <div className={`relative ${sizes[size]} flex-shrink-0`}>
        <Image
          src="/Logo-Casagrande-1-2048x951.png"
          alt="Hotel Casagrande"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
