import type { Metadata } from 'next';

import { ToastProvider } from '@/client/tasks/toast';
import { TrpcReactProvider } from '@/client/trpc/provider';

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'A simple task manager',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <TrpcReactProvider>
          <ToastProvider>{children}</ToastProvider>
        </TrpcReactProvider>
      </body>
    </html>
  );
}
