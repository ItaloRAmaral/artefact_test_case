'use client';

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

import type { AppRouter } from '@/server/adapters/trpc/app-router';
import { makeQueryClient } from '@/shared/trpc/query-client';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
}

/**
 * Provides the query client and the tRPC client to its children.
 *
 * @param props.children - The app.
 * @returns The children inside the providers.
 */
export function TrpcReactProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({ links: [httpLink({ url: '/api/trpc' })] }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
