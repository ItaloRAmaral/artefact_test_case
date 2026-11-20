import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { TRPCLink } from '@trpc/client';
import { createTRPCClient } from '@trpc/client';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';

import { ToastProvider } from '@/client/shared/toast';
import { TRPCProvider } from '@/client/trpc/provider';
import type { AppRouter } from '@/server/adapters/trpc/app-router';
import type { TaskRepository } from '@/server/domains/task/repositories/database-repository';
import { InMemoryTaskRepository } from '@/server/domains/task/repositories/in-memory-database-repository';

import { routerLink } from './trpc-links';

export function renderWithTrpc(
  ui: ReactElement,
  options: { repository?: TaskRepository; link?: TRPCLink<AppRouter> } = {},
) {
  const repository = options.repository ?? new InMemoryTaskRepository();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const trpcClient = createTRPCClient<AppRouter>({
    links: [options.link ?? routerLink(repository)],
  });
  const user = userEvent.setup();

  const result = render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </TRPCProvider>
      </QueryClientProvider>
    ),
  });

  return { ...result, user, repository, queryClient };
}
