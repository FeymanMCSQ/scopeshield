// src/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
