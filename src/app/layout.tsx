import type { Metadata } from 'next';

import { ToastProvider } from '@/client/shared/toast';
import { TrpcReactProvider } from '@/client/trpc/provider';

import './globals.css';

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'A simple task manager',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <TrpcReactProvider>
          <ToastProvider>
            <div className="mx-auto max-w-2xl px-4 py-10">{children}</div>
          </ToastProvider>
        </TrpcReactProvider>
      </body>
    </html>
  );
}
