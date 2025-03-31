import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const calculatePercentage = (part: number, total: number): string => {
  return `${Math.round((part / total) * 100)}%`;
};

export const formatKDA = (kills: number, deaths: number, assists: number): string => {
  const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
  return kda.toFixed(2);
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}; 