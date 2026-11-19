import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data hydrated from the server counts as fresh, so the client does not refetch
        // what the server just rendered (DECISIONS D-27).
        staleTime: 30_000,
      },
    },
  });
}
