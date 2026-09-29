"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import {
  isWorkspaceSessionReady,
  shouldLeaveDashboard,
} from "@/lib/workspace";
import { fetchAllCoursesWithDetails } from "@/lib/api/course";
import { queryKeys } from "@/lib/query-keys";
import { STALE_TIMES, GC_TIMES } from "@/lib/query-client";
import { WrongWorkspace } from "./wrong-workspace";

function WorkspaceLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export function WorkspaceGate({ children }: { children: React.ReactNode }) {
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

  if (!isWorkspaceSessionReady(hasMounted, isPending)) {
    return <WorkspaceLoading />;
  }

  const roles = session?.user?.roles ?? [];
  if (shouldLeaveDashboard(roles)) {
    return <WrongWorkspace roles={roles} />;
  }

  return <>{children}</>;
}
