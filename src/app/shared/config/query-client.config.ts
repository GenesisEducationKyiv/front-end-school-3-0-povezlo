import { QueryClient } from '@tanstack/angular-query-experimental';
import { QUERY_CACHE_TIMES } from './query-constants';

/**
 * Creates and configures a QueryClient instance with optimized defaults
 * @returns Configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_CACHE_TIMES.DEFAULT_STALE_TIME,
        gcTime: QUERY_CACHE_TIMES.DEFAULT_GC_TIME,
        retry: 2,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

/**
 * Pre-configured QueryClient instance ready for injection
 */
export const queryClientInstance: QueryClient = createQueryClient();
