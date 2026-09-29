import { ISlide } from "@/types/slide";
import { apiFetch } from "@/lib/api/utils";

export interface CreateSlideData {
  title: string;
  content?: string;
  order: number;
  courseId: string;
  lessonId?: string;
  titleFont?: string;
  contentFont?: string;
  startingCode?: string;
  solutionCode?: string;
  backgroundColor?: string;
  textColor?: string;
  themeColors?: {
    main: string;
    secondary: string;
    accent?: string;
  };
  videoUrl?: string;
}

export interface UpdateSlideData extends Partial<CreateSlideData> {
  _id?: string;
}

/**
 * Create a slide with optional image uploads
 */
export async function createSlideWithImages(
  slideData: CreateSlideData,
  imageFiles?: File[]
): Promise<ISlide> {
  const formData = new FormData();

  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file) => {
      formData.append("uploadImage", file);
    });
  }

  formData.append("data", JSON.stringify(slideData));

  return apiFetch<ISlide>("/slides", {
    method: "POST",
    body: formData,
  });
}

/**
 * Update an existing slide
 */
export async function updateSlide(
  slideId: string,
  slideData: UpdateSlideData,
  imageFiles?: File[]
): Promise<ISlide> {
  const formData = new FormData();

  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file) => {
      formData.append("uploadImage", file);
    });
  }

  const { _id, ...dataToSend } = slideData;
  formData.append("data", JSON.stringify(dataToSend));

  return apiFetch<ISlide>(`/slides/${slideId}`, {
    method: "PATCH",
    body: formData,
  });
}

/**
 * Delete a slide
 */
export async function deleteSlide(slideId: string): Promise<void> {
  await apiFetch<void>(`/slides/${slideId}`, {
    method: "DELETE",
  });
}

/**
 * Get slides for a course
 */
export async function getSlidesForCourse(courseId: string): Promise<ISlide[]> {
  return apiFetch<ISlide[]>(`/slides?courseId=${courseId}`);
}

/**
 * Get slides for a lesson
 */
export async function getSlidesForLesson(lessonId: string): Promise<ISlide[]> {
  return apiFetch<ISlide[]>(`/slides?lessonId=${lessonId}`);
}
