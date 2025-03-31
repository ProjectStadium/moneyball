'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CardProps } from './types';

export const Card = ({ 
  variant = 'default', 
  className, 
  children, 
  ...props 
}: CardProps) => {
  return (
    <div
      className={cn(
        'rounded-lg bg-white/5 p-4 backdrop-blur-sm transition-all duration-200',
        {
          'border border-purple-500 hover:border-purple-400': variant === 'featured',
          'border border-blue-500 hover:border-blue-400': variant === 'story',
          'hover:bg-white/10': variant === 'default',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}; 