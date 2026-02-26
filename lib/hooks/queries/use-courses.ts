"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { STALE_TIMES, GC_TIMES } from "@/lib/query-client";
import {
  fetchCourse,
  fetchLessonsForCourse,
  fetchSlidesForCourse,
  fetchAllCoursesWithDetails,
  fetchCompleteCourseData,
  createCourse,
  updateCourse,
  deleteCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  createSlide,
  updateSlide,
  deleteSlide,
  type ClientCourse,
} from "@/lib/api/course";
import type { ILesson, ICreateLessonDto } from "@/types/lesson";
import type { ISlide, ICreateSlideDto } from "@/types/slide";
import type { ICreateCourseDto, IUpdateCourseDto } from "@/types/course";

// ============================================
// COURSE QUERIES
// ============================================

/**
 * Hook to fetch all courses with details (lessons, slides, students count)
 * 
 * @example
 * ```tsx
 * const { data: courses, isLoading, error } = useCoursesWithDetails();
 * ```
 */
export function useCoursesWithDetails() {
  return useQuery({
    queryKey: queryKeys.courses.listWithDetails(),
    queryFn: fetchAllCoursesWithDetails,
    staleTime: STALE_TIMES.LISTS,
    gcTime: GC_TIMES.MEDIUM,
  });
}

/**
 * Hook to fetch a single course by ID
 * 
 * @param courseId - The course ID to fetch
 * @param options - Additional query options
 * 
 * @example
 * ```tsx
 * const { data: course, isLoading } = useCourse(courseId);
 * ```
 */
export function useCourse(courseId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.courses.detail(courseId),
    queryFn: () => fetchCourse(courseId),
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    enabled: options?.enabled !== false && !!courseId,
  });
}

/**
 * Hook to fetch complete course data including lessons and slides
 * 
 * @param courseId - The course ID to fetch
 * @param options - Additional query options
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useCourseComplete(courseId);
 * const { course, lessons, slides } = data ?? {};
 * ```
 */
export function useCourseComplete(courseId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.courses.completeData(courseId),
    queryFn: () => fetchCompleteCourseData(courseId),
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    enabled: options?.enabled !== false && !!courseId,
  });
}

/**
 * Hook to fetch lessons for a course
 * 
 * @param courseId - The course ID
 * @param options - Additional query options
 */
export function useLessonsForCourse(courseId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.lessons.byCourse(courseId),
    queryFn: () => fetchLessonsForCourse(courseId),
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    enabled: options?.enabled !== false && !!courseId,
  });
}

/**
 * Hook to fetch slides for a course
 * 
 * @param courseId - The course ID
 * @param options - Additional query options
 */
export function useSlidesForCourse(courseId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.slides.byCourse(courseId),
    queryFn: () => fetchSlidesForCourse(courseId),
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    enabled: options?.enabled !== false && !!courseId,
  });
}

// ============================================
// COURSE MUTATIONS
// ============================================

/**
 * Hook to create a new course
 * Automatically invalidates the courses list on success
 * 
 * @example
 * ```tsx
 * const createCourseMutation = useCreateCourse();
 * 
 * const handleCreate = async (data: ICreateCourseDto) => {
 *   await createCourseMutation.mutateAsync({ courseData: data, userId });
 * };
 * ```
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseData, userId }: { courseData: ICreateCourseDto; userId: string }) =>
      createCourse(courseData, userId),
    onSuccess: () => {
      // Invalidate courses list to refetch with new course
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}

/**
 * Hook to update a course
 * Automatically invalidates the specific course and courses list on success
 * 
 * @example
 * ```tsx
 * const updateCourseMutation = useUpdateCourse();
 * 
 * const handleUpdate = async (data: IUpdateCourseDto) => {
 *   await updateCourseMutation.mutateAsync({ courseId, updatedCourse: data, userId });
 * };
 * ```
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      updatedCourse,
      userId,
    }: {
      courseId: string;
      updatedCourse: IUpdateCourseDto;
      userId?: string;
    }) => updateCourse(courseId, updatedCourse, userId),
    onSuccess: (_, variables) => {
      // Invalidate the specific course
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.completeData(variables.courseId) });
      // Invalidate courses list
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.listWithDetails() });
    },
  });
}

/**
 * Hook to delete a course
 * Automatically invalidates the courses list on success
 * 
 * @example
 * ```tsx
 * const deleteCourseMutation = useDeleteCourse();
 * 
 * const handleDelete = async (courseId: string) => {
 *   await deleteCourseMutation.mutateAsync(courseId);
 * };
 * ```
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => deleteCourse(courseId),
    onSuccess: (_, courseId) => {
      // Remove the specific course from cache
      queryClient.removeQueries({ queryKey: queryKeys.courses.detail(courseId) });
      queryClient.removeQueries({ queryKey: queryKeys.courses.completeData(courseId) });
      // Invalidate courses list
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}

// ============================================
// LESSON MUTATIONS
// ============================================

/**
 * Hook to create a new lesson
 * Automatically invalidates lessons for the course on success
 */
export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonData: ICreateLessonDto) => createLesson(lessonData),
    onSuccess: (_, variables) => {
      const courseId = variables.courseId.toString();
      // Invalidate lessons for the course
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.byCourse(courseId) });
      // Invalidate complete course data
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.completeData(courseId) });
      // Invalidate courses list to update lesson counts
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.listWithDetails() });
    },
  });
}

/**
 * Hook to update a lesson
 */
export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lessonId,
      updatedData,
    }: {
      lessonId: string;
      updatedData: Partial<ILesson>;
    }) => updateLesson(lessonId, updatedData),
    onSuccess: (data) => {
      const courseId = data.courseId?.toString();
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.lessons.byCourse(courseId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.completeData(courseId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.all });
    },
  });
}

/**
 * Hook to delete a lesson
 */
export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, courseId }: { lessonId: string; courseId: string }) =>
      deleteLesson(lessonId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.byCourse(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.completeData(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.listWithDetails() });
    },
  });
}

// ============================================
// SLIDE MUTATIONS
// ============================================

/**
 * Hook to create a new slide
 * Automatically invalidates slides for the course on success
 */
export function useCreateSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slideData,
      imageFiles,
    }: {
      slideData: ICreateSlideDto;
      imageFiles?: File[];
    }) => createSlide(slideData, imageFiles),
    onSuccess: (_, variables) => {
      const courseId = variables.slideData.courseId.toString();
      // Invalidate slides for the course
      queryClient.invalidateQueries({ queryKey: queryKeys.slides.byCourse(courseId) });
      // Invalidate complete course data
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.completeData(courseId) });
      // Invalidate courses list to update slide counts
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.listWithDetails() });
      // Invalidate lesson slides if lessonId is provided
      if (variables.slideData.lessonId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.slides.byLesson(variables.slideData.lessonId.toString()),
        });
      }
    },
  });
}

/**
 * Hook to update a slide
 */
export function useUpdateSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slideId,
      updatedData,
      imageFiles,
      prevLessonId,
      newLessonId,
    }: {
      slideId: string;
      updatedData: Partial<ISlide>;
      imageFiles?: File[];
      prevLessonId?: string;
      newLessonId?: string;
    }) => updateSlide(slideId, updatedData, imageFiles, prevLessonId, newLessonId),
    onSuccess: (data, variables) => {
      const courseId = data.courseId?.toString();
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.slides.byCourse(courseId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.completeData(courseId) });
      }
      // Invalidate lesson slides
      if (variables.prevLessonId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.slides.byLesson(variables.prevLessonId),
        });
      }
      if (variables.newLessonId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.slides.byLesson(variables.newLessonId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.slides.all });
    },
  });
}

/**
 * Hook to delete a slide
 */
export function useDeleteSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slideId, courseId }: { slideId: string; courseId: string }) =>
      deleteSlide(slideId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.slides.byCourse(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.completeData(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.listWithDetails() });
    },
  });
}
