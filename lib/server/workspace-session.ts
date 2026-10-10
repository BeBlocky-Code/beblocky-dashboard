import { cookies, headers } from "next/headers";
import { normalizeSessionToken } from "@/lib/auth-callback";
import { isPrefetchRequest } from "@/lib/prefetch-request";
import { fetchAuthService } from "@/lib/server/same-host-fetch";

export type ServerWorkspaceSession = {
  valid: true;
  token: string;
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    roles: string[];
  };
};

type AccountPayload = {
  user_id?: string;
  name?: string;
  email?: string;
  image_url?: string;
  roles?: string[];
};

/**
 * Session already verified against auth-service, for the root layout to pass
 * into WorkspaceGate. Prefetch requests skip the call so sidebar link
 * prefetch cannot stampede auth-service.
 */
export async function getServerWorkspaceSession(): Promise<ServerWorkspaceSession | null> {
  const headerList = await headers();
  if (isPrefetchRequest((name) => headerList.get(name))) return null;

  const jar = await cookies();
  const token = normalizeSessionToken(
    jar.get("session")?.value ||
      jar.get("__Secure-session")?.value ||
      jar.get("__Host-session")?.value,
  );
  if (!token) return null;

  try {
    const res = await fetchAuthService("/api/v1/account", {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `session=${token}`,
      },
    });
    if (!res.ok) return null;
    const account = (await res.json()) as AccountPayload;
    if (!account.user_id) return null;
    return {
      valid: true,
      token,
      user: {
        id: account.user_id,
        name: account.name,
        email: account.email,
        image: account.image_url,
        roles: account.roles ?? [],
      },
    };
  } catch {
    return null;
  }
}
