import { getApiAuthHeaders } from "@/lib/auth-client";

/**
 * Normalize a Mongo id that may arrive as a string, ObjectId, or populated doc.
 * Populated docs must use `_id` — calling `.toString()` on the doc yields
 * "[object Object]" and breaks length===24 filters.
 */
export function toRefId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "object") {
    const obj = value as { _id?: unknown; id?: unknown; toHexString?: () => string };
    if (typeof obj.toHexString === "function") {
      try {
        return obj.toHexString();
      } catch {
        /* fall through */
      }
    }
    const nested = toRefId(obj._id ?? obj.id);
    if (nested) return nested;
  }
  return null;
}

export function toRefIdList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const ids: string[] = [];
  for (const value of values) {
    const id = toRefId(value);
    if (id) ids.push(id);
  }
  return ids;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Authenticated fetch for beblocky-api. Attaches Bearer from the auth session
 * (host-only cookies are not sent cross-origin).
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }

  const authHeaders = await getApiAuthHeaders();
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${process.env.NEXT_PUBLIC_API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...authHeaders,
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (isFormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (body?.message) detail = String(body.message);
    } catch {
      /* ignore */
    }
    throw new ApiError(response.status, `API call failed: ${detail}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
