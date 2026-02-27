const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "";
};

export interface HourOfCodeCourse {
  _id: string;
  courseTitle?: string;
  courseDescription?: string;
  courseLanguage?: string;
  subType?: string;
  status?: string;
  language?: string;
}

export interface HourOfCodeResponse {
  _id: string;
  name: string;
  courseIds: HourOfCodeCourse[] | string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatchHourOfCodePayload {
  name?: string;
  courseIds: string[];
  isActive?: boolean;
}

export async function fetchHourOfCode(): Promise<HourOfCodeResponse | null> {
  const base = getBaseUrl();
  if (!base) throw new Error("API URL is not configured");

  const res = await fetch(`${base}/hour-of-code`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch Hour of Code");

  const data = await res.json();
  return data as HourOfCodeResponse;
}

export async function patchHourOfCode(
  payload: PatchHourOfCodePayload
): Promise<HourOfCodeResponse> {
  const base = getBaseUrl();
  if (!base) throw new Error("API URL is not configured");

  const res = await fetch(`${base}/hour-of-code`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to update Hour of Code");
  }

  return res.json() as Promise<HourOfCodeResponse>;
}
