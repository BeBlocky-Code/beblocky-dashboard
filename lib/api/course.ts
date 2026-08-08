import {
  ICourse,
  IUpdateCourseDto,
  ICreateCourseDto,
  CourseSubscriptionType,
  CourseStatus,
} from "@/types/course";
import { ILesson, ICreateLessonDto } from "@/types/lesson";
import { ISlide, ICreateSlideDto } from "@/types/slide";
import { Types } from "mongoose";
import { formatRelativeTime } from "@/lib/utils";
import { apiFetch, toRefId, toRefIdList } from "@/lib/api/utils";

function toObjectIdList(values: unknown): Types.ObjectId[] {
  return toRefIdList(values).map((id) => new Types.ObjectId(id));
}

function toObjectIdOrNew(value: unknown): Types.ObjectId {
  const id = toRefId(value);
  return id ? new Types.ObjectId(id) : new Types.ObjectId();
}

// Types for the client-side course with additional computed properties
export interface ClientCourse extends ICourse {
  _id: string;
  lessonsCount?: number;
  studentsCount?: number;
  slidesCount?: number;
  lastUpdated?: string;
}

// Interface for the modern edit course dialog
export interface ModernCourse {
  id: string;
  courseTitle: string;
  courseDescription: string;
  courseLanguage: string;
  subType: CourseSubscriptionType;
  category: string;
  status: "Active" | "Draft";
  students: number;
  lessons: number;
  slides: number;
  rating: number;
  lastUpdated: string;
}

/**
 * Create a new course
 */
export async function createCourse(
  courseData: ICreateCourseDto,
  userId: string
): Promise<ClientCourse> {
  const apiPayload: Record<string, unknown> = {
    courseTitle: courseData.courseTitle,
    courseDescription: courseData.courseDescription || "",
    courseLanguage: courseData.courseLanguage,
    userId,
    subType: courseData.subType || CourseSubscriptionType.FREE,
    status: courseData.status || CourseStatus.DRAFT,
    rating: courseData.rating || 0,
    language: courseData.language || courseData.courseLanguage,
  };

  if (courseData.lessonIds) {
    apiPayload.lessonIds = courseData.lessonIds.map((id) => id.toString());
  }
  if (courseData.slideIds) {
    apiPayload.slideIds = courseData.slideIds.map((id) => id.toString());
  }
  if (courseData.organization) {
    apiPayload.organization = courseData.organization.map((id) =>
      id.toString(),
    );
  }

  const newCourse = await apiFetch<any>("/courses", {
    method: "POST",
    body: JSON.stringify(apiPayload),
  });

  return {
    ...newCourse,
    _id: newCourse._id,
    school: toObjectIdOrNew(newCourse.school),
    slides: toObjectIdList(newCourse.slides),
    lessons: toObjectIdList(newCourse.lessons),
    students: toObjectIdList(newCourse.students),
    organization: toObjectIdList(newCourse.organization),
  };
}

/**
 * Update course details
 */
export async function updateCourse(
  courseId: string,
  updatedCourse: IUpdateCourseDto,
  userId?: string
): Promise<ClientCourse> {
  const apiPayload: Record<string, unknown> = {};

  if (updatedCourse.courseTitle)
    apiPayload.courseTitle = updatedCourse.courseTitle;
  if (updatedCourse.courseDescription)
    apiPayload.courseDescription = updatedCourse.courseDescription;
  if (updatedCourse.courseLanguage)
    apiPayload.courseLanguage = updatedCourse.courseLanguage;
  if (updatedCourse.subType) apiPayload.subType = updatedCourse.subType;
  if (updatedCourse.status) apiPayload.status = updatedCourse.status;
  if (updatedCourse.rating !== undefined)
    apiPayload.rating = updatedCourse.rating;
  if (updatedCourse.language) apiPayload.language = updatedCourse.language;
  if (userId) apiPayload.userId = userId;

  if (updatedCourse.lessonIds) {
    apiPayload.lessonIds = updatedCourse.lessonIds.map((id) => id.toString());
  }
  if (updatedCourse.slideIds) {
    apiPayload.slideIds = updatedCourse.slideIds.map((id) => id.toString());
  }
  if (updatedCourse.organization) {
    apiPayload.organization = updatedCourse.organization.map((id) =>
      id.toString(),
    );
  }

  const updatedData = await apiFetch<any>(`/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(apiPayload),
  });

  return {
    ...updatedData,
    _id: updatedData._id,
    school: toObjectIdOrNew(updatedData.school),
    slides: toObjectIdList(updatedData.slides),
    lessons: toObjectIdList(updatedData.lessons),
    students: toObjectIdList(updatedData.students),
    organization: toObjectIdList(updatedData.organization),
  };
}

/**
 * Convert ClientCourse to ModernCourse for the edit dialog
 */
export function convertToModernCourse(course: ClientCourse): ModernCourse {
  return {
    id: course._id,
    courseTitle: course.courseTitle,
    courseDescription: course.courseDescription,
    courseLanguage: course.courseLanguage,
    subType: course.subType,
    category: course.language || course.courseLanguage,
    status: course.status === CourseStatus.ACTIVE ? "Active" : "Draft",
    students: course.studentsCount || course.students?.length || 0,
    lessons: course.lessonsCount || course.lessons?.length || 0,
    slides: course.slidesCount || course.slides?.length || 0,
    rating: course.rating,
    lastUpdated: course.lastUpdated || formatRelativeTime(course.updatedAt),
  };
}

/**
 * Convert ModernCourse back to IUpdateCourseDto
 */
export function convertFromModernCourse(
  course: ModernCourse
): IUpdateCourseDto {
  return {
    courseTitle: course.courseTitle,
    courseDescription: course.courseDescription,
    courseLanguage: course.courseLanguage,
    subType: course.subType,
    status:
      course.status === "Active" ? CourseStatus.ACTIVE : CourseStatus.DRAFT,
    rating: course.rating,
    language: course.category,
  };
}

/**
 * Fetch course details by ID
 */
export async function fetchCourse(courseId: string): Promise<ClientCourse> {
  const courseData = await apiFetch<any>(`/courses/${courseId}`);

  try {
    const slides = toObjectIdList(courseData.slides);
    const lessons = toObjectIdList(courseData.lessons);
    const students = toObjectIdList(courseData.students);
    return {
      ...courseData,
      _id: courseData._id,
      school: toObjectIdOrNew(courseData.school),
      slides,
      lessons,
      students,
      lessonsCount: lessons.length,
      slidesCount: slides.length,
      studentsCount: students.length || courseData.students?.length || 0,
      lastUpdated: formatRelativeTime(
        courseData.updatedAt || courseData.createdAt,
      ),
    };
  } catch (error) {
    console.error("Error transforming course data:", error);
    throw new Error("Failed to process course data");
  }
}

/**
 * Fetch lessons for a course
 */
export async function fetchLessonsForCourse(
  courseId: string,
): Promise<ILesson[]> {
  return apiFetch<ILesson[]>(`/lessons?courseId=${courseId}`);
}

/**
 * Fetch slides for a course
 */
export async function fetchSlidesForCourse(
  courseId: string,
): Promise<ISlide[]> {
  return apiFetch<ISlide[]>(`/slides?courseId=${courseId}`);
}

/**
 * Update an existing lesson
 */
export async function updateLesson(
  lessonId: string,
  updatedData: Partial<ILesson>
): Promise<ILesson> {
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      throw new Error("API URL is not configured");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/lessons/${lessonId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedData),
      }
    );

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {}

      throw new Error(
        errorData?.message ||
          `Failed to update lesson: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Course API error updating lesson:", error);
    throw error;
  }
}

/**
 * Delete a lesson
 */
export async function deleteLesson(lessonId: string): Promise<void> {
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      throw new Error("API URL is not configured");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/lessons/${lessonId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {}

      throw new Error(
        errorData?.message ||
          `Failed to delete lesson: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error("Course API error deleting lesson:", error);
    throw error;
  }
}

/**
 * Create a new slide
 */
export async function createSlide(
  slideData: ICreateSlideDto,
  imageFiles?: File[]
): Promise<ISlide> {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }

  if (
    !slideData.courseId ||
    !slideData.courseId.toString ||
    slideData.courseId.toString().length !== 24
  ) {
    throw new Error("Cannot create slide: courseId is missing or invalid.");
  }

  // Prepare FormData
  const formData = new FormData();

  // Add image files (if any)
  if (imageFiles && imageFiles.length > 0) {
    for (const file of imageFiles) {
      formData.append("uploadImage", file);
    }
  }

  // Only include defined values in the payload
  const apiPayload: ICreateSlideDto = {
    title: slideData.title,
    order: slideData.order,
    courseId: slideData.courseId,
    lessonId: slideData.lessonId || new Types.ObjectId(), // Add required lessonId
  };

  if (slideData.content) apiPayload.content = slideData.content;
  if (slideData.lessonId) apiPayload.lessonId = slideData.lessonId;
  if (slideData.titleFont) apiPayload.titleFont = slideData.titleFont;
  if (slideData.contentFont) apiPayload.contentFont = slideData.contentFont;
  if (slideData.startingCode) apiPayload.startingCode = slideData.startingCode;
  if (slideData.solutionCode) apiPayload.solutionCode = slideData.solutionCode;
  if (slideData.backgroundColor)
    apiPayload.backgroundColor = slideData.backgroundColor;
  if (slideData.textColor) apiPayload.textColor = slideData.textColor;
  if (slideData.themeColors) {
    apiPayload.themeColors = {
      main: slideData.themeColors.main,
      secondary: slideData.themeColors.secondary,
    };
  }
  if (slideData.imageUrls) apiPayload.imageUrls = slideData.imageUrls;

  // Add slide data as JSON string
  formData.append("data", JSON.stringify(apiPayload));

  const newSlide = await apiFetch<ISlide>("/slides", {
    method: "POST",
    body: formData,
  });

  // Lesson.slides is updated by the API on create. Course.slides is not —
  // link it here and fail loudly so counts/refs don't drift silently.
  const courseId = String(slideData.courseId);
  const slideId = String(newSlide._id);
  await apiFetch(`/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify({ $addToSet: { slides: slideId } }),
  });

  return newSlide;
}

/**
 * Update an existing slide
 */
export async function updateSlide(
  slideId: string,
  updatedData: Partial<ISlide>,
  imageFiles?: File[],
  _prevLessonId?: string,
  _newLessonId?: string
): Promise<ISlide> {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }

  // Prepare FormData
  const formData = new FormData();

  // Add image files (if any)
  if (imageFiles && imageFiles.length > 0) {
    for (const file of imageFiles) {
      formData.append("uploadImage", file);
    }
  }

  // Handle imageUrls properly - preserve existing images when adding new ones
  const slideDataToSend = { ...updatedData };

  // If we're adding new images, we need to preserve existing imageUrls
  // The backend should merge new images with existing ones, not replace them
  if (imageFiles && imageFiles.length > 0) {
    // Remove imageUrls from payload to prevent overwriting existing ones
    // The backend should handle merging new images with existing imageUrls
    delete slideDataToSend.imageUrls;
  }

  // Add slide data as JSON string
  formData.append("data", JSON.stringify(slideDataToSend));

  const updatedSlide = await apiFetch<ISlide>(`/slides/${slideId}`, {
    method: "PATCH",
    body: formData,
  });

  // Lesson slide membership is maintained by the API on update.
  // Keep course.slides in sync when a slide is assigned/moved.
  const courseId =
    toRefId((updatedData as any).courseId) ||
    toRefId((updatedData as any).course) ||
    toRefId((updatedSlide as any).courseId) ||
    toRefId((updatedSlide as any).course);
  if (courseId && updatedSlide._id) {
    await apiFetch(`/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify({
        $addToSet: { slides: String(updatedSlide._id) },
      }),
    });
  }

  return updatedSlide;
}

/**
 * Reorder slides within a lesson (assigns order 1..n).
 */
export async function reorderSlides(
  lessonId: string,
  slideIds: string[]
): Promise<ISlide[]> {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/slides/reorder`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ lessonId, slideIds }),
    }
  );

  if (!response.ok) {
    let message = "Failed to reorder slides";
    try {
      const err = await response.json();
      message = err?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(
      Array.isArray(message) ? message.join(", ") : String(message)
    );
  }

  return response.json();
}

/**
 * Delete a slide
 */
export async function deleteSlide(slideId: string): Promise<void> {
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      throw new Error("API URL is not configured");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/slides/${slideId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {}

      throw new Error(
        errorData?.message ||
          `Failed to delete slide: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error("Course API error deleting slide:", error);
    throw error;
  }
}

/**
 * Create a new lesson
 */
export async function createLesson(
  lessonData: ICreateLessonDto
): Promise<ILesson> {
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      throw new Error("API URL is not configured");
    }

    if (
      !lessonData.courseId ||
      !lessonData.courseId.toString ||
      lessonData.courseId.toString().length !== 24
    ) {
      throw new Error("Cannot create lesson: courseId is missing or invalid.");
    }

    // Build payload according to backend contract
    const apiPayload: any = {
      title: lessonData.title,
      courseId: lessonData.courseId.toString(),
      duration: lessonData.duration,
      difficulty: lessonData.difficulty || "Beginner", // Use the enum value directly
    };

    if (lessonData.description) apiPayload.description = lessonData.description;
    if (lessonData.slides)
      apiPayload.slides = lessonData.slides.map((id) => id.toString());
    if (lessonData.tags) apiPayload.tags = lessonData.tags;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lessons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {}
      throw new Error(
        errorData?.message ||
          `Failed to create lesson: ${response.status} ${response.statusText}`,
      );
    }

    const newLesson = await response.json();

    // Keep course.lessons in sync — API create does not do this.
    await apiFetch(`/courses/${lessonData.courseId}`, {
      method: "PUT",
      body: JSON.stringify({
        $addToSet: { lessons: String(newLesson._id) },
      }),
    });

    return newLesson;
  } catch (error) {
    console.error("Course API error creating lesson:", error);
    throw error;
  }
}

/**
 * Fetch complete course data including lessons and slides
 */
export async function fetchCompleteCourseData(courseId: string): Promise<{
  course: ClientCourse;
  lessons: ILesson[];
  slides: ISlide[];
}> {
  try {
    // Fetch all data in parallel
    const [course, lessons, slides] = await Promise.all([
      fetchCourse(courseId),
      fetchLessonsForCourse(courseId),
      fetchSlidesForCourse(courseId),
    ]);

    // Update course with counts
    const courseWithCounts: ClientCourse = {
      ...course,
      lessonsCount: lessons.length,
      slidesCount: slides.length,
      studentsCount: course.students?.length || 0,
    };

    return {
      course: courseWithCounts,
      lessons,
      slides,
    };
  } catch (error) {
    console.error("Error fetching complete course data:", error);
    throw error;
  }
}

/**
 * Fetch all courses with their details (lessons, slides, students count)
 */
export async function fetchAllCoursesWithDetails(): Promise<ClientCourse[]> {
  const coursesData = await apiFetch<any[]>("/courses");

  // Counts from lesson/slide refs (string ids OR populated docs).
  return coursesData.map((course: any) => {
    const slides = toObjectIdList(course.slides);
    const lessons = toObjectIdList(course.lessons);
    const students = toObjectIdList(course.students);

    return {
      ...course,
      _id: course._id,
      school: toObjectIdOrNew(course.school),
      slides,
      lessons,
      students,
      lessonsCount: lessons.length,
      slidesCount: slides.length,
      studentsCount: students.length || course.students?.length || 0,
      lastUpdated: formatRelativeTime(course.updatedAt || course.createdAt),
    } as ClientCourse;
  });
}

/**
 * Delete a course
 */
export async function deleteCourse(courseId: string): Promise<void> {
  await apiFetch<void>(`/courses/${courseId}`, {
    method: "DELETE",
  });
}
