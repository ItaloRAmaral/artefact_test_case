import type { Metadata } from 'next';

import { TrpcReactProvider } from '@/client/trpc/provider';

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'A simple task manager',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <TrpcReactProvider>{children}</TrpcReactProvider>
      </body>
    </html>
  );
}
