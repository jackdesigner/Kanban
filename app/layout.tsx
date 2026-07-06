import React from 'react';

export const metadata = {
  title: 'Kanban',
  description: 'Kanban board with Supabase SSR authentication',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
