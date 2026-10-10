import { ObjectId } from "@/lib/object-id";

export enum LessonDifficulty {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
}

export interface ILesson {
  _id?: string; // MongoDB ObjectId as string
  title: string;
  description?: string;
  courseId: ObjectId;
  slides: ObjectId[];
  difficulty: LessonDifficulty;
  duration: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateLessonDto {
  title: string;
  description?: string;
  courseId: ObjectId;
  slides?: ObjectId[];
  difficulty?: LessonDifficulty;
  duration: number;
  tags?: string[];
}

export type IUpdateLessonDto = Partial<ICreateLessonDto>;

export interface IAddSlideDto {
  slideId: ObjectId;
}

export interface IReorderLessonsDto {
  lessonIds: ObjectId[];
}
