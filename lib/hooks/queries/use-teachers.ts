"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { STALE_TIMES, GC_TIMES } from "@/lib/query-client";
import { teacherApi } from "@/lib/api/teacher";
import type { IUser } from "@/types/user";

/**
 * Hook to fetch a teacher by user ID
 * 
 * @param userId - The user ID
 * @param user - The authenticated user (for auth headers)
 * @param options - Additional query options
 * 
 * @example
 * ```tsx
 * const { data: teacher, isLoading, error } = useTeacherByUserId(userId, user);
 * ```
 */
export function useTeacherByUserId(
  userId: string | undefined,
  user: IUser | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.teachers.byUserId(userId ?? ""),
    queryFn: () => teacherApi.getTeacherByUserId(userId!, user!),
    staleTime: STALE_TIMES.USER,
    gcTime: GC_TIMES.MEDIUM,
    enabled: options?.enabled !== false && !!userId && !!user,
    // Don't throw on 404 - teacher might not exist yet
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Teacher not found") {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch the current teacher
 * 
 * @param user - The authenticated user
 * @param options - Additional query options
 * 
 * @example
 * ```tsx
 * const { data: currentTeacher, isLoading } = useCurrentTeacher(user);
 * ```
 */
export function useCurrentTeacher(user: IUser | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.teachers.current(),
    queryFn: () => teacherApi.getCurrentTeacher(user!),
    staleTime: STALE_TIMES.USER,
    gcTime: GC_TIMES.MEDIUM,
    enabled: options?.enabled !== false && !!user,
  });
}

/**
 * Hook to create a teacher from a user
 * Automatically invalidates teacher queries on success
 * 
 * @example
 * ```tsx
 * const createTeacherMutation = useCreateTeacher();
 * 
 * const handleCreate = async () => {
 *   await createTeacherMutation.mutateAsync({ userId, user });
 * };
 * ```
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, user }: { userId: string; user: IUser }) =>
      teacherApi.createTeacherFromUser(userId, user),
    onSuccess: (_, variables) => {
      // Invalidate teacher queries
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.byUserId(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.current() });
    },
  });
}
