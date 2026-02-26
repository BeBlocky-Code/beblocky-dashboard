/**
 * Query Key Factory
 * 
 * Centralized query keys for TanStack Query.
 * Using a factory pattern ensures:
 * - Consistent key structure across the app
 * - Type-safe key generation
 * - Easy invalidation of related queries
 * 
 * Key Hierarchy:
 * - Level 1: Entity type (e.g., "courses", "users")
 * - Level 2: Action/scope (e.g., "list", "detail", "byEmail")
 * - Level 3+: Parameters (e.g., courseId, email)
 * 
 * Usage:
 * ```ts
 * // In a query
 * useQuery({
 *   queryKey: queryKeys.courses.detail(courseId),
 *   queryFn: () => fetchCourse(courseId),
 * })
 * 
 * // Invalidate all courses
 * queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
 * 
 * // Invalidate specific course
 * queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) })
 * ```
 */

export const queryKeys = {
  // ============================================
  // COURSES
  // ============================================
  courses: {
    /** Base key for all course queries */
    all: ["courses"] as const,
    
    /** List all courses */
    list: () => [...queryKeys.courses.all, "list"] as const,
    
    /** List courses with details (lessons, slides counts) */
    listWithDetails: () => [...queryKeys.courses.all, "list", "withDetails"] as const,
    
    /** Single course by ID */
    detail: (courseId: string) => [...queryKeys.courses.all, "detail", courseId] as const,
    
    /** Course with full content (lessons and slides populated) */
    withContent: (courseId: string) => [...queryKeys.courses.all, "withContent", courseId] as const,
    
    /** Complete course data for editing */
    completeData: (courseId: string) => [...queryKeys.courses.all, "complete", courseId] as const,
  },

  // ============================================
  // LESSONS
  // ============================================
  lessons: {
    /** Base key for all lesson queries */
    all: ["lessons"] as const,
    
    /** Lessons for a specific course */
    byCourse: (courseId: string) => [...queryKeys.lessons.all, "byCourse", courseId] as const,
    
    /** Single lesson by ID */
    detail: (lessonId: string) => [...queryKeys.lessons.all, "detail", lessonId] as const,
  },

  // ============================================
  // SLIDES
  // ============================================
  slides: {
    /** Base key for all slide queries */
    all: ["slides"] as const,
    
    /** Slides for a specific course */
    byCourse: (courseId: string) => [...queryKeys.slides.all, "byCourse", courseId] as const,
    
    /** Slides for a specific lesson */
    byLesson: (lessonId: string) => [...queryKeys.slides.all, "byLesson", lessonId] as const,
    
    /** Single slide by ID */
    detail: (slideId: string) => [...queryKeys.slides.all, "detail", slideId] as const,
  },

  // ============================================
  // USERS
  // ============================================
  users: {
    /** Base key for all user queries */
    all: ["users"] as const,
    
    /** Current user */
    current: () => [...queryKeys.users.all, "current"] as const,
    
    /** User by email */
    byEmail: (email: string) => [...queryKeys.users.all, "byEmail", email] as const,
    
    /** User by ID */
    byId: (userId: string) => [...queryKeys.users.all, "byId", userId] as const,
  },

  // ============================================
  // STUDENTS
  // ============================================
  students: {
    /** Base key for all student queries */
    all: ["students"] as const,
    
    /** List all students */
    list: () => [...queryKeys.students.all, "list"] as const,
    
    /** Student by email */
    byEmail: (email: string) => [...queryKeys.students.all, "byEmail", email] as const,
    
    /** Student by user ID */
    byUserId: (userId: string) => [...queryKeys.students.all, "byUserId", userId] as const,
    
    /** Current student */
    current: () => [...queryKeys.students.all, "current"] as const,
    
    /** Single student by ID */
    detail: (studentId: string) => [...queryKeys.students.all, "detail", studentId] as const,
  },

  // ============================================
  // TEACHERS
  // ============================================
  teachers: {
    /** Base key for all teacher queries */
    all: ["teachers"] as const,
    
    /** Teacher by user ID */
    byUserId: (userId: string) => [...queryKeys.teachers.all, "byUserId", userId] as const,
    
    /** Current teacher */
    current: () => [...queryKeys.teachers.all, "current"] as const,
    
    /** Single teacher by ID */
    detail: (teacherId: string) => [...queryKeys.teachers.all, "detail", teacherId] as const,
  },

  // ============================================
  // CLASSES
  // ============================================
  classes: {
    /** Base key for all class queries */
    all: ["classes"] as const,
    
    /** List all classes */
    list: (filters?: {
      creatorId?: string;
      organizationId?: string;
      courseId?: string;
      studentId?: string;
      userType?: string;
    }) => filters 
      ? [...queryKeys.classes.all, "list", filters] as const
      : [...queryKeys.classes.all, "list"] as const,
    
    /** Single class by ID */
    detail: (classId: string) => [...queryKeys.classes.all, "detail", classId] as const,
    
    /** Class statistics */
    stats: (classId: string) => [...queryKeys.classes.all, "stats", classId] as const,
  },

  // ============================================
  // ORGANIZATIONS
  // ============================================
  organizations: {
    /** Base key for all organization queries */
    all: ["organizations"] as const,
    
    /** Organization by user ID */
    byUserId: (userId: string) => [...queryKeys.organizations.all, "byUserId", userId] as const,
    
    /** Current organization */
    current: () => [...queryKeys.organizations.all, "current"] as const,
    
    /** Single organization by ID */
    detail: (orgId: string) => [...queryKeys.organizations.all, "detail", orgId] as const,
  },

  // ============================================
  // ADMINS
  // ============================================
  admins: {
    /** Base key for all admin queries */
    all: ["admins"] as const,
    
    /** Admin by user ID */
    byUserId: (userId: string) => [...queryKeys.admins.all, "byUserId", userId] as const,
    
    /** Current admin */
    current: () => [...queryKeys.admins.all, "current"] as const,
  },

  // ============================================
  // PROGRESS (for future use)
  // ============================================
  progress: {
    /** Base key for all progress queries */
    all: ["progress"] as const,
    
    /** Progress by student */
    byStudent: (studentId: string) => [...queryKeys.progress.all, "byStudent", studentId] as const,
    
    /** Progress by student and course */
    byStudentAndCourse: (studentId: string, courseId: string) => 
      [...queryKeys.progress.all, "byStudentAndCourse", studentId, courseId] as const,
  },

  // ============================================
  // AI CONVERSATIONS (for future use)
  // ============================================
  ai: {
    /** Base key for all AI queries */
    all: ["ai"] as const,
    
    /** Conversations by student */
    conversations: (studentId: string) => [...queryKeys.ai.all, "conversations", studentId] as const,
    
    /** Analysis history by student */
    analysisHistory: (studentId: string) => [...queryKeys.ai.all, "analysisHistory", studentId] as const,
  },
} as const;

// Type helpers for query keys
export type QueryKeys = typeof queryKeys;
export type CourseQueryKeys = QueryKeys["courses"];
export type UserQueryKeys = QueryKeys["users"];
export type ClassQueryKeys = QueryKeys["classes"];
