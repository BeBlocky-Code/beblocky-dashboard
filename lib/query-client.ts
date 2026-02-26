"use client";

import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

/**
 * Default stale times for different types of data
 * - Static data (courses, users): 5 minutes
 * - Dynamic data (progress, conversations): 1 minute
 * - Lists that change frequently: 2 minutes
 */
export const STALE_TIMES = {
  /** Course content, lessons, slides - changes infrequently */
  STATIC: 5 * 60 * 1000, // 5 minutes
  /** User profiles, teacher data - changes occasionally */
  USER: 3 * 60 * 1000, // 3 minutes
  /** Lists like all courses, all classes */
  LISTS: 2 * 60 * 1000, // 2 minutes
  /** Progress, conversations - changes frequently */
  DYNAMIC: 60 * 1000, // 1 minute
  /** Real-time data that should always be fresh */
  REALTIME: 30 * 1000, // 30 seconds
} as const;

/**
 * Garbage collection times - how long to keep unused data in cache
 */
export const GC_TIMES = {
  /** Keep course data for 30 minutes for back-navigation */
  LONG: 30 * 60 * 1000, // 30 minutes
  /** Keep user data for 15 minutes */
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  /** Keep dynamic data for 10 minutes */
  SHORT: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Create a new QueryClient instance with sensible defaults
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time - data considered fresh for 2 minutes
        staleTime: STALE_TIMES.LISTS,
        // Keep unused data in cache for 15 minutes
        gcTime: GC_TIMES.MEDIUM,
        // Refetch when window gains focus (good for keeping data fresh)
        refetchOnWindowFocus: true,
        // Don't refetch on mount if data exists and isn't stale
        refetchOnMount: false,
        // Don't refetch on reconnect automatically
        refetchOnReconnect: "always",
        // Retry failed requests up to 2 times with exponential backoff
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Keep previous data while fetching new data
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

// Singleton QueryClient instance for use throughout the app
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Get the QueryClient instance (singleton pattern for browser)
 * Creates a new instance on the server, reuses the same instance in browser
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient
    return createQueryClient();
  }
  // Browser: create once and reuse
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}

/**
 * Setup persistence for the QueryClient
 * This persists cache to localStorage so data survives page refresh
 * 
 * Call this function once in your app's initialization (e.g., in QueryProvider)
 */
export function setupQueryPersistence(queryClient: QueryClient): void {
  if (typeof window === "undefined") return;

  try {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: "beblocky-query-cache",
      // Throttle writes to localStorage
      throttleTime: 1000,
      // Serialize/deserialize functions (default JSON)
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    });

    persistQueryClient({
      queryClient,
      persister,
      // Maximum age for persisted data (30 minutes)
      maxAge: 30 * 60 * 1000,
      // Only persist certain query keys (optional - can be customized)
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Persist all successful queries
          return query.state.status === "success";
        },
      },
    });
  } catch (error) {
    // Fail silently if localStorage is not available
    console.warn("Failed to setup query persistence:", error);
  }
}

/**
 * Invalidate all queries - useful when user logs out
 */
export function invalidateAllQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries();
}

/**
 * Clear all cached data - useful when user logs out
 */
export function clearQueryCache(queryClient: QueryClient): void {
  queryClient.clear();
}
