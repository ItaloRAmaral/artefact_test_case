import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';

import { ToastProvider } from '@/client/shared/toast';
import { TrpcReactProvider } from '@/client/trpc/provider';

import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-bricolage',
});

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'A simple task manager',
};

/**
 * Renders the root layout with the tRPC and toast providers.
 *
 * @param props.children - The page.
 * @param props.modal - The modal slot, shown over the page.
 * @returns The HTML document.
 */
export default function RootLayout({ children, modal }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body>
        <TrpcReactProvider>
          <ToastProvider>
            <div className="mx-auto max-w-2xl px-4 py-10">{children}</div>
            {modal}
          </ToastProvider>
        </TrpcReactProvider>
      </body>
    </html>
  );
}
