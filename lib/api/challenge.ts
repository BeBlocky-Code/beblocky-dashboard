import { apiFetch } from "@/lib/api/utils";

export type ChallengeKind = "mcq" | "code";

export type AuthoringChallenge = {
  id: string;
  courseId: string;
  lessonId: string;
  kind: ChallengeKind;
  prompt: string;
  order: number;
  choices?: string[];
  correctChoiceIndexes?: number[];
  hiddenTests?: string[];
};

export type ChallengeWriteBody = {
  kind?: ChallengeKind;
  prompt: string;
  choices?: string[];
  correctChoiceIndexes?: number[];
  hiddenTests?: string[];
};

export async function listAuthoringChallenges(
  courseId: string,
  lessonId: string,
): Promise<AuthoringChallenge[]> {
  return apiFetch<AuthoringChallenge[]>(
    `/courses/${courseId}/lessons/${lessonId}/challenges/authoring`,
  );
}

export async function createChallenge(
  courseId: string,
  lessonId: string,
  body: ChallengeWriteBody,
): Promise<unknown> {
  return apiFetch(`/courses/${courseId}/lessons/${lessonId}/challenges`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateChallenge(
  challengeId: string,
  body: Partial<ChallengeWriteBody>,
): Promise<AuthoringChallenge> {
  return apiFetch<AuthoringChallenge>(`/challenges/${challengeId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteChallenge(challengeId: string): Promise<unknown> {
  return apiFetch(`/challenges/${challengeId}`, { method: "DELETE" });
}

export async function reorderChallenges(
  courseId: string,
  lessonId: string,
  challengeIds: string[],
): Promise<unknown> {
  return apiFetch(
    `/courses/${courseId}/lessons/${lessonId}/challenges/reorder`,
    {
      method: "POST",
      body: JSON.stringify({ challengeIds }),
    },
  );
}
