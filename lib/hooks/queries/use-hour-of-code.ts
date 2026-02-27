"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { STALE_TIMES, GC_TIMES } from "@/lib/query-client";
import {
  fetchHourOfCode,
  patchHourOfCode,
  type PatchHourOfCodePayload,
  type HourOfCodeResponse,
} from "@/lib/api/hour-of-code";

export function useHourOfCode() {
  return useQuery({
    queryKey: queryKeys.hourOfCode.active(),
    queryFn: fetchHourOfCode,
    staleTime: STALE_TIMES.LISTS,
    gcTime: GC_TIMES.MEDIUM,
  });
}

export function usePatchHourOfCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PatchHourOfCodePayload) => patchHourOfCode(payload),
    onSuccess: (data: HourOfCodeResponse) => {
      queryClient.setQueryData(queryKeys.hourOfCode.active(), data);
    },
  });
}
