"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { STALE_TIMES, GC_TIMES } from "@/lib/query-client";
import { classApi } from "@/lib/api/class";
import type {
  IClass,
  ICreateClassDto,
  IUpdateClassDto,
  IAddStudentDto,
  IAddCourseDto,
  IClassStats,
} from "@/types/class";
import type { IUser } from "@/types/user";

// ============================================
// CLASS QUERIES
// ============================================

/**
 * Hook to fetch all classes
 * 
 * @param user - The authenticated user
 * @param filters - Optional filters for the query
 * @param options - Additional query options
 * 
 * @example
 * ```tsx
 * const { data: classes, isLoading } = useClasses(user);
 * ```
 */
export function useClasses(
  user: IUser | null,
  filters?: {
    creatorId?: string;
    organizationId?: string;
    courseId?: string;
    studentId?: string;
    userType?: string;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.classes.list(filters),
    queryFn: () => classApi.getClasses(user!, filters),
    staleTime: STALE_TIMES.LISTS,
    gcTime: GC_TIMES.MEDIUM,
    enabled: options?.enabled !== false && !!user,
  });
}

/**
 * Hook to fetch a single class by ID
 * 
 * @param classId - The class ID to fetch
 * @param user - The authenticated user
 * @param options - Additional query options
 */
export function useClass(classId: string, user: IUser | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.classes.detail(classId),
    queryFn: () => classApi.getClassById(classId, user!),
    staleTime: STALE_TIMES.USER,
    gcTime: GC_TIMES.MEDIUM,
    enabled: options?.enabled !== false && !!classId && !!user,
  });
}

/**
 * Hook to fetch class statistics
 * 
 * @param classId - The class ID
 * @param user - The authenticated user
 * @param options - Additional query options
 */
export function useClassStats(classId: string, user: IUser | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.classes.stats(classId),
    queryFn: () => classApi.getClassStats(classId, user!),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.SHORT,
    enabled: options?.enabled !== false && !!classId && !!user,
  });
}

// ============================================
// CLASS MUTATIONS
// ============================================

/**
 * Hook to create a new class
 * Automatically invalidates the classes list on success
 * 
 * @example
 * ```tsx
 * const createClassMutation = useCreateClass();
 * 
 * const handleCreate = async (data: ICreateClassDto) => {
 *   await createClassMutation.mutateAsync({ data, user });
 * };
 * ```
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, user }: { data: ICreateClassDto; user: IUser }) =>
      classApi.createClass(data, user),
    onSuccess: () => {
      // Invalidate classes list to refetch with new class
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
  });
}

/**
 * Hook to update a class
 * Automatically invalidates the specific class and classes list on success
 */
export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      data,
      user,
    }: {
      classId: string;
      data: IUpdateClassDto;
      user: IUser;
    }) => classApi.updateClass(classId, data, user),
    onSuccess: (_, variables) => {
      // Invalidate the specific class
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
      // Invalidate classes list
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.list() });
    },
  });
}

/**
 * Hook to delete a class
 * Automatically removes from cache and invalidates classes list
 */
export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, user }: { classId: string; user: IUser }) =>
      classApi.deleteClass(classId, user),
    onSuccess: (_, variables) => {
      // Remove the specific class from cache
      queryClient.removeQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
      // Invalidate classes list
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
  });
}

// ============================================
// STUDENT MANAGEMENT MUTATIONS
// ============================================

/**
 * Hook to add a student to a class
 */
export function useAddStudentToClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      data,
      user,
    }: {
      classId: string;
      data: IAddStudentDto;
      user: IUser;
    }) => classApi.addStudent(classId, data, user),
    onSuccess: (_, variables) => {
      // Invalidate the specific class
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
      // Invalidate class stats
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.stats(variables.classId) });
      // Invalidate classes list
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.list() });
    },
  });
}

/**
 * Hook to remove a student from a class
 */
export function useRemoveStudentFromClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      studentId,
      user,
    }: {
      classId: string;
      studentId: string;
      user: IUser;
    }) => classApi.removeStudent(classId, studentId, user),
    onSuccess: (_, variables) => {
      // Invalidate the specific class
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
      // Invalidate class stats
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.stats(variables.classId) });
      // Invalidate classes list
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.list() });
    },
  });
}

// ============================================
// COURSE MANAGEMENT MUTATIONS
// ============================================

/**
 * Hook to add a course to a class
 */
export function useAddCourseToClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      data,
      user,
    }: {
      classId: string;
      data: IAddCourseDto;
      user: IUser;
    }) => classApi.addCourse(classId, data, user),
    onSuccess: (_, variables) => {
      // Invalidate the specific class
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
      // Invalidate classes list
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.list() });
    },
  });
}

/**
 * Hook to remove a course from a class
 */
export function useRemoveCourseFromClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      courseId,
      user,
    }: {
      classId: string;
      courseId: string;
      user: IUser;
    }) => classApi.removeCourse(classId, courseId, user),
    onSuccess: (_, variables) => {
      // Invalidate the specific class
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
      // Invalidate classes list
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.list() });
    },
  });
}

// ============================================
// SETTINGS MUTATIONS
// ============================================

/**
 * Hook to update class settings
 */
export function useUpdateClassSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      settings,
      user,
    }: {
      classId: string;
      settings: {
        allowStudentEnrollment?: boolean;
        requireApproval?: boolean;
        autoProgress?: boolean;
      };
      user: IUser;
    }) => classApi.updateSettings(classId, settings, user),
    onSuccess: (_, variables) => {
      // Invalidate the specific class
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
    },
  });
}

/**
 * Hook to extend class end date
 */
export function useExtendClassEndDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      newEndDate,
      user,
    }: {
      classId: string;
      newEndDate: Date;
      user: IUser;
    }) => classApi.extendEndDate(classId, newEndDate, user),
    onSuccess: (_, variables) => {
      // Invalidate the specific class
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(variables.classId) });
      // Invalidate classes list
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.list() });
    },
  });
}
