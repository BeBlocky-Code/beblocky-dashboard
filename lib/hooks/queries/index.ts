"use client";

/**
 * TanStack Query Hooks
 *
 * This module exports all custom query hooks for the application.
 * Each hook wraps the underlying API calls with TanStack Query for:
 * - Automatic caching
 * - Background refetching
 * - Optimistic updates
 * - Query invalidation
 */

// Course hooks
export {
  useCoursesWithDetails,
  useCourse,
  useCourseComplete,
  useLessonsForCourse,
  useSlidesForCourse,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useCreateSlide,
  useUpdateSlide,
  useDeleteSlide,
} from "./use-courses";

// Class hooks
export {
  useClasses,
  useClass,
  useClassStats,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useAddStudentToClass,
  useRemoveStudentFromClass,
  useAddCourseToClass,
  useRemoveCourseFromClass,
  useUpdateClassSettings,
  useExtendClassEndDate,
} from "./use-classes";

// User hooks
export { useUserByEmail, useCurrentUser } from "./use-users";

// Student hooks
export {
  useAllStudents,
  useStudentByEmail,
  useStudentByUserId,
  useCurrentStudent,
} from "./use-students";

// Teacher hooks
export {
  useTeacherByUserId,
  useCurrentTeacher,
  useCreateTeacher,
} from "./use-teachers";
