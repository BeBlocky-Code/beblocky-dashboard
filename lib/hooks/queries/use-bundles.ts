"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { STALE_TIMES, GC_TIMES } from "@/lib/query-client";
import {
  fetchBundles,
  fetchBundle,
  createBundle,
  updateBundle,
  deleteBundle,
  type CreateBundlePayload,
  type UpdateBundlePayload,
  type BundleResponse,
} from "@/lib/api/bundle";

export function useBundles() {
  return useQuery({
    queryKey: queryKeys.bundles.list(),
    queryFn: fetchBundles,
    staleTime: STALE_TIMES.LISTS,
    gcTime: GC_TIMES.MEDIUM,
  });
}

export function useBundle(id: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.bundles.detail(id ?? ""),
    queryFn: () => fetchBundle(id!),
    enabled: (options?.enabled !== false && !!id) as boolean,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.MEDIUM,
  });
}

export function useCreateBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBundlePayload) => createBundle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bundles.all });
    },
  });
}

export function useUpdateBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBundlePayload }) =>
      updateBundle(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bundles.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bundles.detail(variables.id),
      });
    },
  });
}

export function useDeleteBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBundle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bundles.all });
    },
  });
}
