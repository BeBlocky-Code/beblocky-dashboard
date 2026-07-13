"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { STALE_TIMES, GC_TIMES } from "@/lib/query-client";
import { progressApi } from "@/lib/api/progress";

/**
 * Hook to fetch all course progress records (admin analytics).
 */
export function useAllProgress(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.progress.list(),
    queryFn: () => progressApi.getAllProgress(),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.SHORT,
    enabled: options?.enabled !== false,
  });
}
