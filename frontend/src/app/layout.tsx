import React from 'react';
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';
import { QueryProvider } from '@/components/providers/QueryProvider';
import '@/styles/globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space'
});

export const metadata = {
  title: 'WINRVTE - Moneyball for Esports',
  description: 'Analytics tool for Valorant players and organizations',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cn(
      inter.variable,
      spaceGrotesk.variable,
      'bg-gray-950 text-white antialiased'
    )}>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
} 