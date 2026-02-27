const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL ?? "";

export interface BundleCourse {
  _id: string;
  courseTitle?: string;
}

export interface BundleResponse {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  courseIds: BundleCourse[] | string[];
  projectIds: string[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBundlePayload {
  name: string;
  description?: string;
  imageUrl?: string;
  courseIds?: string[];
  projectIds?: string[];
  isPublished?: boolean;
}

export interface UpdateBundlePayload {
  name?: string;
  description?: string;
  imageUrl?: string;
  courseIds?: string[];
  projectIds?: string[];
  isPublished?: boolean;
}

export async function fetchBundles(): Promise<BundleResponse[]> {
  const base = getBaseUrl();
  if (!base) throw new Error("API URL is not configured");
  const res = await fetch(`${base}/bundles`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch bundles");
  return res.json();
}

export async function fetchBundle(id: string): Promise<BundleResponse> {
  const base = getBaseUrl();
  if (!base) throw new Error("API URL is not configured");
  const res = await fetch(`${base}/bundles/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch bundle");
  return res.json();
}

export async function createBundle(
  payload: CreateBundlePayload
): Promise<BundleResponse> {
  const base = getBaseUrl();
  if (!base) throw new Error("API URL is not configured");
  const res = await fetch(`${base}/bundles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to create bundle");
  }
  return res.json();
}

export async function updateBundle(
  id: string,
  payload: UpdateBundlePayload
): Promise<BundleResponse> {
  const base = getBaseUrl();
  if (!base) throw new Error("API URL is not configured");
  const res = await fetch(`${base}/bundles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to update bundle");
  }
  return res.json();
}

export async function deleteBundle(id: string): Promise<void> {
  const base = getBaseUrl();
  if (!base) throw new Error("API URL is not configured");
  const res = await fetch(`${base}/bundles/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete bundle");
}
