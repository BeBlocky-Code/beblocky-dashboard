"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { STALE_TIMES, GC_TIMES } from "@/lib/query-client";
import { userApi } from "@/lib/api/user";
import type { IUser } from "@/types/user";

/**
 * Hook to fetch a user by email
 * 
 * @param email - The user's email address
 * @param options - Additional query options
 * 
 * @example
 * ```tsx
 * const { data: user, isLoading, error } = useUserByEmail(email);
 * ```
 */
export function useUserByEmail(email: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.users.byEmail(email ?? ""),
    queryFn: () => userApi.getUserByEmail(email!),
    staleTime: STALE_TIMES.USER,
    gcTime: GC_TIMES.MEDIUM,
    enabled: options?.enabled !== false && !!email,
  });
}

/**
 * Hook to fetch the current user
 * 
 * @param user - The base user object (from session)
 * @param options - Additional query options
 * 
 * @example
 * ```tsx
 * const { data: currentUser, isLoading } = useCurrentUser(sessionUser);
 * ```
 */
export function useCurrentUser(user: IUser | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.users.current(),
    queryFn: () => userApi.getCurrentUser(user!),
    staleTime: STALE_TIMES.USER,
    gcTime: GC_TIMES.MEDIUM,
    enabled: options?.enabled !== false && !!user,
  });
}
