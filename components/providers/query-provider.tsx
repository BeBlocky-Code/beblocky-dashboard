"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient, setupQueryPersistence } from "@/lib/query-client";

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * QueryProvider component that wraps the app with TanStack Query context
 * 
 * Features:
 * - Creates a single QueryClient instance per browser session
 * - Sets up persistence to localStorage (optional)
 * - Includes React Query DevTools in development
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient once per component instance
  // Using useState ensures the client is created only once and persists across renders
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    
    // Setup persistence (runs only in browser)
    if (typeof window !== "undefined") {
      setupQueryPersistence(client);
    }
    
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
