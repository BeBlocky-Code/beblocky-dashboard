"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { STALE_TIMES, GC_TIMES } from "@/lib/query-client";
import { studentApi } from "@/lib/api/student";
import type { IUser } from "@/types/user";

/**
 * Hook to fetch all students (admin only)
 * 
 * @param options - Additional query options
 * 
 * @example
 * ```tsx
 * const { data: students, isLoading } = useAllStudents();
 * ```
 */
export function useAllStudents(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.students.list(),
    queryFn: () => studentApi.getAllStudents(),
    staleTime: STALE_TIMES.LISTS,
    gcTime: GC_TIMES.MEDIUM,
    enabled: options?.enabled !== false,
  });
}

/**
 * Hook to fetch a student by email
 * 
 * @param email - The student's email address
 * @param user - The authenticated user (for auth headers)
 * @param options - Additional query options
 * 
 * @example
 * ```tsx
 * const { data: student, isLoading } = useStudentByEmail(email, user);
 * ```
 */
export function useStudentByEmail(
  email: string | undefined,
  user: IUser | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.students.byEmail(email ?? ""),
    queryFn: () => studentApi.getStudentByEmail(email!, user!),
    staleTime: STALE_TIMES.USER,
    gcTime: GC_TIMES.MEDIUM,
    enabled: options?.enabled !== false && !!email && !!user,
  });
}

/**
 * Hook to fetch a student by user ID
 * 
 * @param userId - The user ID
 * @param user - The authenticated user (for auth headers)
 * @param options - Additional query options
 * 
 * @example
 * ```tsx
 * const { data: student, isLoading } = useStudentByUserId(userId, user);
 * ```
 */
export function useStudentByUserId(
  userId: string | undefined,
  user: IUser | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.students.byUserId(userId ?? ""),
    queryFn: () => studentApi.getStudentByUserId(userId!, user!),
    staleTime: STALE_TIMES.USER,
    gcTime: GC_TIMES.MEDIUM,
    enabled: options?.enabled !== false && !!userId && !!user,
  });
}

/**
 * Hook to fetch the current student
 * 
 * @param user - The authenticated user
 * @param options - Additional query options
 * 
 * @example
 * ```tsx
 * const { data: currentStudent, isLoading } = useCurrentStudent(user);
 * ```
 */
export function useCurrentStudent(user: IUser | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.students.current(),
    queryFn: () => studentApi.getCurrentStudent(user!),
    staleTime: STALE_TIMES.USER,
    gcTime: GC_TIMES.MEDIUM,
    enabled: options?.enabled !== false && !!user,
  });
}
