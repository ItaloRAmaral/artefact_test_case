import type { Metadata } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';

import { ToastProvider } from '@/client/shared/toast';
import { TrpcReactProvider } from '@/client/trpc/provider';

import './globals.css';

// Next downloads the font at build time and serves it from the app, so the browser asks
// Google for nothing; the optical-size axis lets one family serve headings and small text
// (DECISIONS D-37).
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-bricolage',
});

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'A simple task manager',
};

export default function RootLayout({ children, modal }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body>
        <TrpcReactProvider>
          <ToastProvider>
            <div className="mx-auto max-w-2xl px-4 py-10">{children}</div>
            {/* Create and edit open here, over the list, when reached by a link (D-35). */}
            {modal}
          </ToastProvider>
        </TrpcReactProvider>
      </body>
    </html>
  );
}
