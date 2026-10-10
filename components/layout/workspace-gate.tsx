"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import type { SessionData } from "@/lib/auth-client";
import {
  isWorkspaceSessionReady,
  shouldLeaveDashboard,
} from "@/lib/workspace";
import { fetchAllCoursesWithDetails } from "@/lib/api/course";
import { queryKeys } from "@/lib/query-keys";
import { STALE_TIMES, GC_TIMES } from "@/lib/query-client";
import { WorkspaceSessionProvider } from "@/lib/workspace-session-context";
import { WrongWorkspace } from "./wrong-workspace";

export function WorkspaceGate({
  initialSession,
  children,
}: {
  initialSession: SessionData | null;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceSessionProvider session={initialSession}>
      <WorkspaceGateInner>{children}</WorkspaceGateInner>
    </WorkspaceSessionProvider>
  );
}

function WorkspaceGateInner({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useQuery({
    queryKey: queryKeys.courses.listWithDetails(),
    queryFn: fetchAllCoursesWithDetails,
    staleTime: STALE_TIMES.LISTS,
    gcTime: GC_TIMES.MEDIUM,
  });

  const rolesKnown =
    session?.user != null || isWorkspaceSessionReady(hasMounted, isPending);
  const roles = session?.user?.roles ?? [];

  if (rolesKnown && shouldLeaveDashboard(roles)) {
    return <WrongWorkspace roles={roles} />;
  }

  // The shell and page skeletons render while a missing server session is
  // still resolving in the browser, so data fetches are not stuck behind it.
  return <>{children}</>;
}
