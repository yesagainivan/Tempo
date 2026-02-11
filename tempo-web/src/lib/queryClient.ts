import { QueryClient } from '@tanstack/react-query';

/**
 * Configured QueryClient for local-first PowerSync data.
 * 
 * Key settings:
 * - staleTime: 1 minute - local SQLite data is fresh, no need for aggressive refetching
 * - refetchOnMount: false - prevents queries from refetching when components remount (tab switching)
 * - refetchOnWindowFocus: false - prevents refetching when user returns to the browser tab
 * - retry: 1 - reduces retry attempts for failed queries
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60,       // 1 minute
            refetchOnMount: false,      // Don't refetch on tab switch
            refetchOnWindowFocus: false,
            retry: 1,                   // Reduce retry attempts
        },
    },
});
