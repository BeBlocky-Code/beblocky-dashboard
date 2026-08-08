"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession, type SessionData } from "./auth-client";

const SESSION_QUERY_KEY = ["session"] as const;

/**
 * Shared session query — sidebar, pages, and dialogs all read the same cache
 * instead of each firing `/auth/session` + `/account` on mount.
 */
export function useSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async (): Promise<SessionData | null> => {
      const { data } = await getSession();
      return data ?? null;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
  }, [queryClient]);

  return {
    data: query.data ?? undefined,
    isPending: query.isPending,
    refetch,
  };
}
