"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { STALE_TIMES, GC_TIMES } from "@/lib/query-client";
import { certificateApi } from "@/lib/api/certificate";

export function useCertificateStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.certificates.stats(),
    queryFn: () => certificateApi.getStats(),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.SHORT,
    enabled: options?.enabled !== false,
  });
}
